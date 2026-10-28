"use client";
import { useEffect, useState } from "react";
import { Check, Clock3, LoaderCircle, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { followsApi } from "@/services/follows-api";
export function FollowButton({ username, onChanged }: { username: string; onChanged?: (following: boolean) => void }) {
  const [following, setFollowing] = useState(false), [pending, setPending] = useState(false), [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false), [checking, setChecking] = useState(true), [error, setError] = useState("");
  const { user, requireAuth } = useAuth(); const isSelf = user?.username?.toLowerCase() === username.toLowerCase();
  useEffect(() => { let active = true; if (!user || isSelf) { setChecking(false); return; } setChecking(true); followsApi.status(username).then(result => { if (active) { setFollowing(result.following); setPending(Boolean(result.requestPending)); setIsPrivate(Boolean(result.isPrivate)); } }).catch(() => undefined).finally(() => { if (active) setChecking(false); }); return () => { active = false; }; }, [username, user, isSelf]);
  async function toggle() { if (!user) { requireAuth(`/profile/${username}`); return; } if (isSelf || busy) return; setBusy(true); setError(""); try { if (following || pending) { await followsApi.unfollow(username); setFollowing(false); setPending(false); onChanged?.(false); } else { const result = await followsApi.follow(username); if (result.requestPending) { setPending(true); setFollowing(false); } else { setFollowing(true); setPending(false); onChanged?.(true); } } } catch (err) { setError(err instanceof Error ? err.message : "Couldn't update follow status."); } finally { setBusy(false); } }
  if (isSelf) return null;
  return <div><button type="button" className={`button ${following ? "button-secondary" : "button-primary"}`} onClick={() => void toggle()} disabled={busy || checking}>{busy || checking ? <LoaderCircle size={16} className="animate-spin"/> : pending ? <Clock3 size={16}/> : following ? <Check size={16}/> : <UserPlus size={16}/>} {checking ? "Checking…" : busy ? "Please wait…" : pending ? "Requested" : following ? "Following" : isPrivate ? "Request to follow" : "Follow"}</button>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
