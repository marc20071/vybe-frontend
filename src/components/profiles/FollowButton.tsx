
"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Clock3,
  LoaderCircle,
  UserPlus,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { followsApi } from "@/services/follows-api";

export function FollowButton({
  username,
  onChanged,
}: {
  username: string;
  onChanged?: (following: boolean) => void;
}) {
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  const { user, requireAuth } = useAuth();

  const isSelf =
    user?.username?.toLowerCase() === username.toLowerCase();

  useEffect(() => {
    let active = true;

    if (!user || isSelf) {
      setChecking(false);
      return;
    }

    setChecking(true);

    followsApi
      .status(username)
      .then((result) => {
        if (!active) return;

        setFollowing(result.following);
        setPending(Boolean(result.requestPending));
        setIsPrivate(Boolean(result.isPrivate));
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [username, user, isSelf]);

  async function toggle() {
    if (!user) {
      requireAuth(`/profile/${encodeURIComponent(username)}`);
      return;
    }

    if (isSelf || busy) return;

    setBusy(true);
    setError("");

    try {
      if (following || pending) {
        await followsApi.unfollow(username);

        setFollowing(false);
        setPending(false);
        onChanged?.(false);
      } else {
        const result = await followsApi.follow(username);

        if (result.requestPending) {
          setPending(true);
          setFollowing(false);
        } else {
          setFollowing(true);
          setPending(false);
          onChanged?.(true);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't update follow status."
      );
    } finally {
      setBusy(false);
    }
  }

  if (isSelf) return null;

  const label = checking
    ? "Checking"
    : busy
      ? "Wait"
      : pending
        ? "Requested"
        : following
          ? "Following"
          : isPrivate
            ? "Request"
            : "Follow";

  return (
    <div className="compact-follow-wrap">
      <button
        type="button"
        className={`compact-follow-button ${
          following || pending ? "is-following" : "is-follow"
        }`}
        onClick={() => void toggle()}
        disabled={busy || checking}
        aria-label={`${label} ${username}`}
      >
        {busy || checking ? (
          <LoaderCircle size={13} className="animate-spin" />
        ) : pending ? (
          <Clock3 size={13} />
        ) : following ? (
          <Check size={13} />
        ) : (
          <UserPlus size={13} />
        )}

        <span>{label}</span>
      </button>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <style jsx>{`
        .compact-follow-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          min-height: 29px;
          padding: 4px 10px;
          border: 1px solid transparent;
          border-radius: 7px;
          font-size: 11px;
          line-height: 1;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .compact-follow-button.is-follow {
          color: white;
          background: #7c3aed;
        }

        .compact-follow-button.is-following {
          color: var(--foreground, #333);
          background: transparent;
          border-color: var(--border, #dedede);
        }

        .compact-follow-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .compact-follow-wrap .form-error {
          margin: 4px 0 0;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}
