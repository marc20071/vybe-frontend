"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Trash2, Volume2, VolumeX, Eye } from "lucide-react";
import { storiesApi, type Story, type StoryComment } from "@/services/stories-api";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";

type StoryViewerProps = { stories: Story[]; index: number; onIndexChange: (index: number) => void; onClose: () => void; onChanged?: () => void };

export function StoryViewer({ stories, index, onIndexChange, onClose, onChanged }: StoryViewerProps) {
  const { user, requireAuth } = useAuth();
  const story = stories[index];
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSending, setCommentSending] = useState(false);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const isVideo = story?.type === "video" || Boolean(story?.mediaUrl && /\.(mp4|webm)(?:$|[?#])/i.test(story.mediaUrl));
  const isText = story?.type === "text" || !story?.mediaUrl;

  const next = useCallback(() => { if (index < stories.length - 1) onIndexChange(index + 1); else onClose(); }, [index, stories.length, onIndexChange, onClose]);
  const previous = useCallback(() => { if (index > 0) onIndexChange(index - 1); }, [index, onIndexChange]);

  useEffect(() => {
    if (!story) return;
    setLiked(Boolean(story.viewerHasLiked)); setLikeCount(story.likeCount || 0); setComments([]); setCommentText(""); setCommentsOpen(false); setError(""); setSoundEnabled(true); setViewerCount(null);
    if (user) void storiesApi.view(story.id).catch(() => undefined);
    if (user?.id === story.userId) void storiesApi.viewers(story.id).then((result) => setViewerCount(result.items.length)).catch(() => undefined);
  }, [story?.id, user?.id]);

  useEffect(() => {
    if (!story) return;
    const video = videoRef.current;
    if (video) { video.currentTime = 0; video.muted = story.originalAudioMuted || !soundEnabled; video.volume = Math.max(0, Math.min(1, story.originalVolume ?? 1)); void video.play().catch(() => undefined); }
    const audio = musicRef.current;
    if (audio && story.music?.audioUrl) {
      audio.src = story.music.audioUrl; audio.volume = Math.max(0, Math.min(1, story.musicVolume ?? 0.8));
      const start = () => { try { audio.currentTime = Math.max(0, story.music?.startSeconds || 0); } catch { /* metadata may not be ready */ } if (soundEnabled) void audio.play().catch(() => setError("Tap the sound button to enable music playback.")); };
      audio.addEventListener("loadedmetadata", start, { once: true });
      if (audio.readyState >= 1) start();
      return () => { audio.removeEventListener("loadedmetadata", start); audio.pause(); audio.removeAttribute("src"); audio.load(); if (video) video.pause(); };
    }
    return () => { if (video) video.pause(); };
  }, [story?.id, soundEnabled]);

  useEffect(() => {
    if (!story || isVideo) return;
    const seconds = story.music?.durationSeconds ? Math.min(60, Math.max(5, story.music.durationSeconds)) : 5;
    const timer = window.setTimeout(next, seconds * 1000);
    return () => window.clearTimeout(timer);
  }, [story?.id, isVideo, next]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") onClose(); if (event.key === "ArrowLeft") previous(); if (event.key === "ArrowRight") next(); }
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, next, previous]);

  async function toggleLike() {
    if (!user) { requireAuth("/"); return; }
    if (!story || busy) return;
    const wasLiked = liked; setLiked(!wasLiked); setLikeCount((n) => Math.max(0, n + (wasLiked ? -1 : 1))); setBusy(true); setError("");
    try { const result = wasLiked ? await storiesApi.unlike(story.id) : await storiesApi.like(story.id); setLiked(result.liked); setLikeCount(result.likeCount); }
    catch (err) { setLiked(wasLiked); setLikeCount((n) => Math.max(0, n + (wasLiked ? 1 : -1))); setError(err instanceof Error ? err.message : "Couldn't update like."); }
    finally { setBusy(false); }
  }
  async function loadComments() {
    if (!story) return; setCommentsOpen(true); setCommentLoading(true); setError("");
    try { const result = await storiesApi.comments(story.id); setComments(result.items); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't load comments."); }
    finally { setCommentLoading(false); }
  }
  async function sendComment(event: React.FormEvent) {
    event.preventDefault(); if (!user) { requireAuth("/"); return; } if (!story || !commentText.trim() || commentSending) return;
    setCommentSending(true); setError("");
    try { const result = await storiesApi.comment(story.id, commentText.trim()); setComments((items) => [...items, result.comment]); setCommentText(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't send your reply."); }
    finally { setCommentSending(false); }
  }
  async function deleteStory() {
    if (!story || !user || story.userId !== user.id || busy) return;
    if (!window.confirm("Delete this Story for everyone?")) return;
    setBusy(true); setError("");
    try { await storiesApi.remove(story.id); onChanged?.(); next(); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't delete this Story."); }
    finally { setBusy(false); }
  }
  function enableSound() {
    const enabled = !soundEnabled; setSoundEnabled(enabled);
    if (enabled) { if (musicRef.current) void musicRef.current.play().catch(() => setError("Music could not play on this device.")); if (videoRef.current && !story?.originalAudioMuted) { videoRef.current.muted = false; void videoRef.current.play().catch(() => undefined); } }
    else { if (musicRef.current) musicRef.current.pause(); if (videoRef.current) videoRef.current.muted = true; }
  }
  if (!story) return null;
  const textStyle = story.textStyle || {};
  const storyBackground = typeof textStyle.background === "string" ? textStyle.background : "linear-gradient(135deg,#4c1d95,#db2777)";
  const storyColor = typeof textStyle.color === "string" ? textStyle.color : "#fff";

  return <div role="dialog" aria-modal="true" aria-label={`${story.username}'s story`} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "#08080cf5", display: "grid", placeItems: "center", padding: 12 }}>
    <div onClick={(event) => event.stopPropagation()} className="story-viewer-shell">
      <div className="story-viewer-progress">{stories.map((item, i) => <span key={item.id} className={i < index ? "done" : i === index ? "current" : ""}><i style={i === index ? { animationDuration: `${story.music?.durationSeconds || 5}s`, animationPlayState: isVideo ? "paused" : "running" } : undefined}/></span>)}</div>
      <header className="story-viewer-header"><Avatar name={story.displayName || story.username} src={story.avatarUrl} size={36}/><div className="story-viewer-author"><strong>{story.displayName || story.username}</strong><small>@{story.username} · {new Date(story.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>
        {story.music && <span className="story-music-chip"><span className="music-pulse">♫</span>{story.music.title} · {story.music.artist}{story.music.licenseUrl && <> · <a href={story.music.licenseUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>License</a></>}</span>}
        <button type="button" onClick={enableSound} className="icon-button" aria-label={soundEnabled ? "Mute story music" : "Enable story music"}>{soundEnabled ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
        {user?.id === story.userId && <button type="button" className="icon-button" onClick={() => void deleteStory()} aria-label="Delete story" disabled={busy}><Trash2 size={17}/></button>}
        <button type="button" onClick={onClose} className="icon-button" aria-label="Close story"><X size={20}/></button>
      </header>
      <div className="story-viewer-media" onClick={(event) => { const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect(); if (event.clientX < rect.left + rect.width * 0.28) previous(); else if (event.clientX > rect.left + rect.width * 0.72) next(); }}>
        {isText ? <div className="story-viewer-text" style={{ background: storyBackground, color: storyColor }}>{story.text}</div> : isVideo ? <video ref={videoRef} key={story.id} src={story.mediaUrl} autoPlay playsInline muted={story.originalAudioMuted || !soundEnabled} controls={false} onEnded={next} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}/>: <img key={story.id} src={story.mediaUrl} alt={`Story from ${story.username}`} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}/>}
        {!isText && story.text && <span className="story-viewer-caption" style={{ color: storyColor }}>{story.text}</span>}
      </div>
      {story.music?.audioUrl && <audio ref={musicRef} preload="auto" onTimeUpdate={(event) => { const audio = event.currentTarget; const stopAt = (story.music?.startSeconds || 0) + (story.music?.durationSeconds || 15); if (audio.currentTime >= stopAt) audio.pause(); }} />}
      <div className="story-viewer-actions"><button type="button" onClick={() => void toggleLike()} className={liked ? "liked" : ""} disabled={busy}><Heart size={20}/><span>{likeCount}</span></button><button type="button" onClick={() => void loadComments()}><MessageCircle size={20}/><span>Reply</span></button>{user?.id === story.userId && <button type="button" onClick={() => void storiesApi.viewers(story.id).then((result) => setViewerCount(result.items.length)).catch(() => setError("Couldn't load viewers."))}><Eye size={18}/><span>{viewerCount === null ? "Viewers" : viewerCount}</span></button>}<span className="story-viewer-spacer"/><button type="button" className="icon-button" aria-label="Previous Story" onClick={previous} disabled={index === 0}><ChevronLeft size={18}/></button><button type="button" className="icon-button" aria-label="Next Story" onClick={next}><ChevronRight size={18}/></button></div>
      {error && <p className="story-inline-error" role="status">{error}</p>}
      {commentsOpen && <section className="story-comments-panel"><header><strong>Replies</strong><button type="button" className="button button-ghost" onClick={() => setCommentsOpen(false)}>Close</button></header>{commentLoading ? <p className="muted">Loading replies…</p> : comments.length ? <div className="story-comments-list">{comments.map((comment) => <article key={comment.id}><Avatar name={comment.displayName} src={comment.avatarUrl} size={30}/><div><strong>{comment.displayName} <small>@{comment.username}</small></strong><p>{comment.body}</p></div></article>)}</div> : <p className="muted">No replies yet. Start the conversation.</p>}<form onSubmit={(event) => void sendComment(event)}><input value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={1000} placeholder={user ? "Write a reply…" : "Sign in to reply"} aria-label="Write a Story reply"/><button type="submit" className="button button-primary" disabled={commentSending || !commentText.trim()}>{commentSending ? "Sending…" : "Send"}</button></form></section>}
    </div>
  </div>;
}
