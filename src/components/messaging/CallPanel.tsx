"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";
import { messagesApi } from "@/services/messages-api";

type SignalPayload = Record<string, unknown>;

function asSignalPayload(value: unknown): SignalPayload {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as SignalPayload;
  }

  return {};
}

function getSessionDescription(
  payload: SignalPayload
): RTCSessionDescriptionInit | null {
  const type = payload.type;
  const sdp = payload.sdp;

  if (
    type !== "offer" &&
    type !== "answer" &&
    type !== "pranswer" &&
    type !== "rollback"
  ) {
    return null;
  }

  if (type !== "rollback" && typeof sdp !== "string") {
    return null;
  }

  return {
    type,
    ...(typeof sdp === "string" ? { sdp } : {}),
  };
}

function getIceCandidate(
  payload: SignalPayload
): RTCIceCandidateInit | null {
  if (typeof payload.candidate !== "string") {
    return null;
  }

  const candidate: RTCIceCandidateInit = {
    candidate: payload.candidate,
  };

  if (typeof payload.sdpMid === "string" || payload.sdpMid === null) {
    candidate.sdpMid = payload.sdpMid;
  }

  if (typeof payload.sdpMLineIndex === "number" || payload.sdpMLineIndex === null) {
    candidate.sdpMLineIndex = payload.sdpMLineIndex;
  }

  if (typeof payload.usernameFragment === "string" || payload.usernameFragment === null) {
    candidate.usernameFragment = payload.usernameFragment;
  }

  return candidate;
}

export function CallPanel({
  conversationId,
  userId,
  recipientId,
}: {
  conversationId: string;
  userId: string;
  recipientId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [videoMode, setVideoMode] = useState(true);
  const [status, setStatus] = useState("Ready to call");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef("");
  const afterRef = useRef<string | undefined>(undefined);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const localIceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const signalingReadyRef = useRef(false);
  const remoteIdRef = useRef<string | null>(recipientId);

  useEffect(() => {
    remoteIdRef.current = recipientId;
  }, [recipientId]);

  useEffect(() => {
    if (open && localStreamRef.current && localRef.current) {
      localRef.current.srcObject = localStreamRef.current;
    }
  }, [open, videoMode]);

  const cleanup = useCallback(
    async (sendHangup = false) => {
      const peer = peerRef.current;
      const callId = callIdRef.current;
      const remoteId = remoteIdRef.current;

      if (sendHangup && callId && remoteId) {
        try {
          await messagesApi.sendSignal(conversationId, {
            recipientId: remoteId,
            callId,
            signalType: "hangup",
          });
        } catch {
          // Continue cleanup even if signaling fails.
        }
      }

      peer?.close();
      peerRef.current = null;

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;

      if (localRef.current) {
        localRef.current.srcObject = null;
      }

      if (remoteRef.current) {
        remoteRef.current.srcObject = null;
      }

      callIdRef.current = "";
      pendingIceRef.current = [];
      localIceQueueRef.current = [];
      signalingReadyRef.current = false;

      setOpen(false);
      setMuted(false);
      setCameraOff(false);
      setStatus("Ready to call");
    },
    [conversationId]
  );

  const setupPeer = useCallback(
    async (withVideo: boolean, callId: string, remoteId: string) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo,
      });

      localStreamRef.current = stream;

      if (localRef.current) {
        localRef.current.srcObject = stream;
      }

      const iceServers: RTCIceServer[] = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ];

      const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
      const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
      const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

      if (turnUrl && turnUsername && turnCredential) {
        iceServers.push({
          urls: turnUrl,
          username: turnUsername,
          credential: turnCredential,
        });
      }

      const pc = new RTCPeerConnection({ iceServers });
      peerRef.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (remoteRef.current && event.streams[0]) {
          remoteRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          return;
        }

        const candidate = event.candidate.toJSON();

        if (signalingReadyRef.current) {
          void messagesApi
            .sendSignal(conversationId, {
              recipientId: remoteId,
              callId,
              signalType: "ice",
              payload: candidate,
            })
            .catch(() => undefined);
        } else {
          localIceQueueRef.current.push(candidate);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setStatus("Connected");
        } else if (pc.connectionState === "failed") {
          setStatus("Connection failed — check network/firewall");
        } else if (pc.connectionState === "disconnected") {
          setStatus("Connection interrupted");
        }
      };

      setVideoMode(withVideo);
      setOpen(true);
      setStatus("Connecting…");

      return pc;
    },
    [conversationId]
  );

  const flushLocalIce = useCallback(
    async (remoteId: string, callId: string) => {
      signalingReadyRef.current = true;

      for (const candidate of localIceQueueRef.current.splice(0)) {
        try {
          await messagesApi.sendSignal(conversationId, {
            recipientId: remoteId,
            callId,
            signalType: "ice",
            payload: candidate,
          });
        } catch {
          // A failed candidate may prevent connection on some networks.
        }
      }
    },
    [conversationId]
  );

  const start = useCallback(
    async (withVideo: boolean) => {
      if (!recipientId) {
        setStatus("Calls are available in direct conversations only.");
        return;
      }

      if (peerRef.current) {
        return;
      }

      try {
        const callId = crypto.randomUUID();

        callIdRef.current = callId;
        remoteIdRef.current = recipientId;
        afterRef.current = undefined;
        pendingIceRef.current = [];
        localIceQueueRef.current = [];
        signalingReadyRef.current = false;

        const pc = await setupPeer(withVideo, callId, recipientId);
        const offer = await pc.createOffer();

        await pc.setLocalDescription(offer);

        await messagesApi.sendSignal(conversationId, {
          recipientId,
          callId,
          signalType: "offer",
          payload: offer,
        });

        await flushLocalIce(recipientId, callId);
      } catch (error) {
        setStatus(
          error instanceof Error
            ? error.message
            : "Could not start call. Allow camera/microphone access and use HTTPS."
        );

        await cleanup(false);
      }
    },
    [recipientId, setupPeer, conversationId, cleanup, flushLocalIce]
  );

  useEffect(() => {
    if (!userId || !recipientId) {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    let polling = false;

    const poll = async () => {
      if (cancelled) {
        return;
      }

      let delay = 10000;

      if (document.visibilityState === "visible" && !polling) {
        polling = true;

        try {
          const result = await messagesApi.receiveSignals(
            conversationId,
            afterRef.current
          );

          for (const signal of result.items) {
            if (cancelled) {
              return;
            }

            afterRef.current = signal.created_at;

            const sender = signal.sender_id;
            const payload = asSignalPayload(signal.payload);

            if (signal.signal_type === "offer") {
              if (peerRef.current) {
                continue;
              }

              const remoteDescription = getSessionDescription(payload);

              if (!remoteDescription || remoteDescription.type !== "offer") {
                continue;
              }

              const accept = window.confirm("Incoming VYBE call. Accept?");

              if (!accept) {
                await messagesApi.sendSignal(conversationId, {
                  recipientId: sender,
                  callId: signal.call_id,
                  signalType: "reject",
                });

                continue;
              }

              callIdRef.current = signal.call_id;
              remoteIdRef.current = sender;
              pendingIceRef.current = [];
              localIceQueueRef.current = [];
              signalingReadyRef.current = false;

              try {
                const remoteSdp =
                  typeof remoteDescription.sdp === "string"
                    ? remoteDescription.sdp
                    : "";

                const pc = await setupPeer(
                  remoteSdp.includes("m=video"),
                  signal.call_id,
                  sender
                );

                await pc.setRemoteDescription(remoteDescription);

                for (const candidate of pendingIceRef.current.splice(0)) {
                  try {
                    await pc.addIceCandidate(candidate);
                  } catch {
                    // Ignore invalid or stale ICE candidates.
                  }
                }

                const answer = await pc.createAnswer();

                await pc.setLocalDescription(answer);

                await messagesApi.sendSignal(conversationId, {
                  recipientId: sender,
                  callId: signal.call_id,
                  signalType: "answer",
                  payload: answer,
                });

                await flushLocalIce(sender, signal.call_id);
              } catch (error) {
                setStatus(
                  error instanceof Error
                    ? error.message
                    : "Unable to accept call."
                );

                await cleanup(false);
              }
            } else if (
              signal.call_id === callIdRef.current &&
              signal.signal_type === "answer" &&
              peerRef.current
            ) {
              const remoteDescription = getSessionDescription(payload);

              if (!remoteDescription || remoteDescription.type !== "answer") {
                continue;
              }

              try {
                await peerRef.current.setRemoteDescription(remoteDescription);

                for (const candidate of pendingIceRef.current.splice(0)) {
                  try {
                    await peerRef.current.addIceCandidate(candidate);
                  } catch {
                    // Ignore invalid or stale ICE candidates.
                  }
                }

                setStatus("Connecting…");
              } catch {
                setStatus("Could not apply the remote call answer.");
              }
            } else if (
              signal.call_id === callIdRef.current &&
              signal.signal_type === "ice" &&
              peerRef.current
            ) {
              const candidate = getIceCandidate(payload);

              if (!candidate) {
                continue;
              }

              if (!peerRef.current.remoteDescription) {
                pendingIceRef.current.push(candidate);
              } else {
                try {
                  await peerRef.current.addIceCandidate(candidate);
                } catch {
                  // Ignore invalid or stale ICE candidates.
                }
              }
            } else if (
              signal.call_id === callIdRef.current &&
              (signal.signal_type === "hangup" ||
                signal.signal_type === "reject")
            ) {
              const endStatus =
                signal.signal_type === "reject" ? "Call declined" : "Call ended";

              await cleanup(false);
              setStatus(endStatus);
            }
          }
        } catch {
          // Transient polling failures are retried on the next tick.
        } finally {
          polling = false;
        }

        delay = peerRef.current ? 2500 : 8000;
      } else {
        delay = document.visibilityState === "visible" ? 8000 : 15000;
      }

      if (!cancelled) {
        timer = window.setTimeout(() => void poll(), delay);
      }
    };

    void poll();

    return () => {
      cancelled = true;

      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [
    conversationId,
    userId,
    recipientId,
    setupPeer,
    cleanup,
    flushLocalIce,
  ]);

  function toggleMute() {
    const next = !muted;

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });

    setMuted(next);
  }

  function toggleCamera() {
    const next = !cameraOff;

    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });

    setCameraOff(next);
  }

  return (
    <>
      <div className="chat-call-actions">
        <button
          className="icon-button"
          type="button"
          aria-label="Start voice call"
          title="Voice call"
          onClick={() => void start(false)}
          disabled={open || !recipientId}
        >
          <Phone size={17} />
        </button>

        <button
          className="icon-button"
          type="button"
          aria-label="Start video call"
          title="Video call"
          onClick={() => void start(true)}
          disabled={open || !recipientId}
        >
          <Video size={17} />
        </button>
      </div>

      {open && (
        <div className="call-overlay" role="dialog" aria-label="VYBE call">
          <div className="call-window">
            <div className="call-window-head">
              <strong>{videoMode ? "Video call" : "Voice call"}</strong>
              <span>{status}</span>
            </div>

            <div className="call-video-grid">
              <video
                ref={remoteRef}
                autoPlay
                playsInline
                className="call-remote-video"
              />

              <video
                ref={localRef}
                autoPlay
                muted
                playsInline
                className="call-local-video"
              />
            </div>

            <div className="call-controls">
              <button
                type="button"
                className="icon-button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {videoMode && (
                <button
                  type="button"
                  className="icon-button"
                  onClick={toggleCamera}
                  aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
                >
                  {cameraOff ? <VideoOff size={18} /> : <Video size={18} />}
                </button>
              )}

              <button
                type="button"
                className="button button-primary"
                onClick={() => void cleanup(true)}
              >
                <PhoneOff size={17} /> End call
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
