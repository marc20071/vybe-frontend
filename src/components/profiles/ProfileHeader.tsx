"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldBan, ShieldCheck, LoaderCircle, MessageCircle, LockKeyhole } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usersApi, type Profile } from "@/services/users-api";
import type { Post } from "@/types/post";
import { FollowButton } from "@/components/profiles/FollowButton";
import { Avatar } from "@/components/ui/Avatar";
import { PostActions } from "@/components/posts/PostActions";

export function ProfileHeader({ username }: { username: string }) {
  const clean = decodeURIComponent(username).replace(/^@/, "").toLowerCase();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [profileResult, postsResult] = await Promise.all([usersApi.profile(clean), usersApi.posts(clean)]);
      setProfile(profileResult.user);
      setPosts(postsResult.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this profile.");
    } finally { setLoading(false); }
  }, [clean]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!user || user.username.toLowerCase() === clean) { setIsBlocked(false); return; }
    usersApi.blockedUsers().then((result) => setIsBlocked(result.items.some((item) => item.username.toLowerCase() === clean))).catch(() => undefined);
  }, [user?.id, clean]);

  async function toggleBlock() {
    if (!user || blockBusy) return;
    const confirmed = window.confirm(isBlocked ? `Unblock @${clean}?` : `Block @${clean}? They will not be able to follow or message you through VYBE.`);
    if (!confirmed) return;
    setBlockBusy(true); setError("");
    try {
      if (isBlocked) await usersApi.unblockUser(clean); else await usersApi.blockUser(clean);
      setIsBlocked(!isBlocked);
      if (!isBlocked) await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't update this account's block status."); }
    finally { setBlockBusy(false); }
  }

  if (loading && !profile) {
    return <div className="profile-loading" role="status" aria-label="Loading profile"><div className="skeleton profile-skeleton-avatar" /><div style={{ flex: 1 }}><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /><div className="skeleton skeleton-line" /></div><div className="skeleton profile-skeleton-post" /></div>;
  }

  if (error && !profile) {
    return <section className="content-panel" role="alert"><h1>Couldn't load profile</h1><p className="muted">{error}</p><button type="button" className="button button-secondary" onClick={() => void load()}><RefreshCw size={15} /> Try again</button></section>;
  }

  if (!profile) return <section className="content-panel"><h1>Profile not found</h1><p className="muted">This username may have changed or the account may no longer exist.</p><Link href="/" className="button button-secondary">Back to VYBE</Link></section>;

  const isOwnProfile = user?.username?.toLowerCase() === clean;
  return (
    <>
      <section className="profile-hero">
        <Link href={`/profile/${encodeURIComponent(profile.username)}`} className="profile-avatar-link" aria-label={`Open @${profile.username} profile`}><Avatar name={profile.displayName || profile.username} src={profile.avatarUrl} size={88} className="profile-avatar-image" /></Link>
        <div className="profile-identity">
          <p className="eyebrow">CREATOR PROFILE</p>
          <h1 className="page-title" style={{ margin: "5px 0" }}><Link href={`/profile/${encodeURIComponent(profile.username)}`}>{profile.displayName || profile.username}</Link></h1>
          <p className="muted" style={{ margin: 0, fontSize: 13, display:"flex",alignItems:"center",gap:6 }}><Link href={`/profile/${encodeURIComponent(profile.username)}`}>@{profile.username}</Link>{profile.isPrivate&&<span className="private-profile-label"><LockKeyhole size={12}/> Private account</span>}</p>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-stats" aria-label="Profile statistics">
            <span><strong>{profile.postCount.toLocaleString()}</strong> posts</span>
            <span><strong>{profile.followerCount.toLocaleString()}</strong> followers</span>
            <span><strong>{profile.followingCount.toLocaleString()}</strong> following</span>
          </div>
        </div>
        <div className="profile-actions">{isOwnProfile ? <Link href="/settings" className="button button-secondary">Edit profile</Link> : <><FollowButton username={clean} onChanged={() => void load()} /><Link href={`/messages?to=${encodeURIComponent(profile.username)}`} className="button button-secondary"><MessageCircle size={15}/> Message</Link>{user && <button type="button" className="button button-secondary" onClick={() => void toggleBlock()} disabled={blockBusy}>{blockBusy ? <LoaderCircle size={15} className="animate-spin"/> : isBlocked ? <ShieldCheck size={15}/> : <ShieldBan size={15}/>} {isBlocked ? "Unblock" : "Block"}</button>}</>}</div>
      </section>

      <div className="feed-toolbar" style={{ marginTop: 25 }}><div className="feed-tabs"><span className="feed-tab active">Posts</span></div><span className="feed-note">{posts.length} recent posts</span></div>
      {error && <p className="form-error" role="alert">{error} <button type="button" onClick={() => void load()}>Retry</button></p>}
      {loading && <div className="profile-post-skeletons" role="status" aria-label="Loading posts">{Array.from({ length: 2 }, (_, i) => <div className="content-panel" key={i}><div className="skeleton skeleton-line" /><div className="skeleton skeleton-media" /></div>)}</div>}
      {!loading && posts.length === 0 && <div className="empty-state">{profile.privateContent?<><LockKeyhole size={30} color="#8b5cf6"/><h2 style={{fontFamily:"Space Grotesk"}}>This account is private</h2><p className="muted">Follow this creator and wait for approval to see their posts.</p></>:<><h2 style={{ fontFamily: "Space Grotesk" }}>{isOwnProfile ? "Your first post starts here" : "No posts yet"}</h2><p className="muted">{isOwnProfile ? "Share a photo or video and it will appear on your profile." : "This creator hasn't shared any public posts yet."}</p>{isOwnProfile && <Link href="/upload" className="button button-primary">Create a post</Link>}</>}</div>}
      {!loading && posts.map((post) => {
        const media = post.media?.[0];
        return <article className="profile-post content-panel" key={post.id}>
          <div className="creator-row"><Link href={`/profile/${encodeURIComponent(post.username)}`} aria-label={`Open @${post.username} profile`}><Avatar name={post.displayName} src={post.avatarUrl} /></Link><div className="creator-meta"><Link href={`/profile/${encodeURIComponent(post.username)}`} className="creator-name">{post.displayName || post.username}</Link><div className="creator-handle"><Link href={`/profile/${encodeURIComponent(post.username)}`}>@{post.username}</Link> · {new Date(post.createdAt).toLocaleDateString()}</div></div></div>
          {post.caption && <p className="profile-post-caption">{post.caption}</p>}
          {media?.url && (media.type === "video" ? <video src={media.url} controls playsInline preload="metadata" className="profile-post-media" /> : <img src={media.url} alt={post.caption || "Post by creator"} loading="lazy" className="profile-post-media" />)}
          <PostActions postId={post.id} likes={post.likeCount} comments={post.commentCount} shares={0} viewerHasLiked={post.viewerHasLiked} viewerHasSaved={post.viewerHasSaved} authorId={post.userId} onDeleted={(id) => setPosts((items) => items.filter((item) => item.id !== id))} />
        </article>;
      })}
    </>
  );
}
