import Link from "next/link";
import type { Post } from "@/types/post";
import { Avatar } from "@/components/ui/Avatar";
import { PostActions } from "@/components/posts/PostActions";

export function PostCard({ post }: { post: Post }) {
  const media = post.media?.[0];
  return <article className="content-panel profile-post">
    <div className="creator-row"><Link href={`/profile/${encodeURIComponent(post.username)}`} aria-label={`Open @${post.username} profile`}><Avatar name={post.displayName || post.username} src={post.avatarUrl} /></Link><div className="creator-meta"><Link href={`/profile/${encodeURIComponent(post.username)}`} className="creator-name">{post.displayName || post.username}</Link><div className="creator-handle"><Link href={`/profile/${encodeURIComponent(post.username)}`}>@{post.username}</Link> · {new Date(post.createdAt).toLocaleDateString()}</div></div></div>
    {post.caption && <p className="profile-post-caption">{post.caption}</p>}
    {media?.url && (media.type === "video" ? <video src={media.url} controls playsInline preload="metadata" className="profile-post-media" /> : <img src={media.url} alt={post.caption || "VYBE post"} loading="lazy" className="profile-post-media" />)}
    <PostActions postId={post.id} likes={post.likeCount} comments={post.commentCount} shares={0} viewerHasLiked={post.viewerHasLiked} viewerHasSaved={post.viewerHasSaved} authorId={post.userId} />
  </article>;
}
