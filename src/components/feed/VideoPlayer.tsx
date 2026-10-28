"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { postsApi } from "@/services/posts-api";
import type { Post } from "@/types/post";
import { Avatar } from "@/components/ui/Avatar";
import { PostActions } from "@/components/posts/PostActions";

export function VideoPlayer({ videoId }: { videoId: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const result = await postsApi.get(videoId);
      setPost(result.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this post.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [videoId]);

  if (loading) return <div className="content-panel" role="status" aria-label="Loading post"><div className="skeleton skeleton-media" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /></div>;
  if (error || !post) return <section className="content-panel" role="alert"><h2>Post unavailable</h2><p className="muted">{error || "This post may have been removed or is no longer public."}</p><button type="button" className="button button-secondary" onClick={() => void load()}><RefreshCw size={15} /> Try again</button></section>;

  const media = post.media?.[0];
  return <article className="content-panel single-post">
    <div className="creator-row"><Avatar name={post.displayName || post.username} src={post.avatarUrl} /><div className="creator-meta"><Link href={`/profile/${post.username}`} className="creator-name">{post.displayName || post.username}</Link><div className="creator-handle">@{post.username} · {new Date(post.createdAt).toLocaleString()}</div></div></div>
    {post.caption && <p className="single-post-caption">{post.caption}</p>}
    {media?.url ? media.type === "video" ? <video src={media.url} controls playsInline preload="metadata" className="single-post-media" /> : <img src={media.url} alt={post.caption || "VYBE post"} className="single-post-media" /> : <p className="muted">This media is no longer available.</p>}
    <PostActions postId={post.id} likes={post.likeCount} comments={post.commentCount} shares={0} viewerHasLiked={post.viewerHasLiked} viewerHasSaved={post.viewerHasSaved} />
  </article>;
}
