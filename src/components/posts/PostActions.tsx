
"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Send, LoaderCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/services/api-client";
import { commentsApi, type Comment } from "@/services/comments-api";
import { postsApi } from "@/services/posts-api";

type PostActionsProps = {
  postId: string;
  likes: number;
  comments: number;
  shares: number;
  viewerHasLiked?: boolean;
  viewerHasSaved?: boolean;
  authorId?: string;
  onDeleted?: (postId: string) => void;
};

export function PostActions({
  postId,
  likes,
  comments: initialComments,
  shares,
  viewerHasLiked = false,
  viewerHasSaved = false,
  authorId,
  onDeleted,
}: PostActionsProps) {
  const { user, requireAuth } = useAuth();

  const [liked, setLiked] = useState(viewerHasLiked);
  const [saved, setSaved] = useState(viewerHasSaved);
  const [likeCount, setLikeCount] = useState(likes);
  const [commentCount, setCommentCount] = useState(initialComments);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<"like" | "save" | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentItems, setCommentItems] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    setLiked(viewerHasLiked);
    setSaved(viewerHasSaved);
  }, [viewerHasLiked, viewerHasSaved]);

  useEffect(() => {
    setLikeCount(likes);
  }, [likes]);

  useEffect(() => {
    setCommentCount(initialComments);
  }, [initialComments]);

  async function toggleLike() {
    if (!user) {
      requireAuth(`/video/${postId}`);
      return;
    }
    if (busy) return;

    const nextLiked = !liked;
    setBusy("like");
    setNotice("");

    try {
      const result = await apiRequest<{ liked: boolean; count: number }>(
        `/posts/${encodeURIComponent(postId)}/like`,
        { method: nextLiked ? "PUT" : "DELETE" }
      );

      setLiked(result.liked);
      setLikeCount(result.count);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Couldn't update your like. Try again."
      );
    } finally {
      setBusy(null);
    }
  }

  async function toggleSave() {
    if (!user) {
      requireAuth(`/video/${postId}`);
      return;
    }
    if (busy) return;

    const nextSaved = !saved;
    setBusy("save");
    setNotice("");

    try {
      await apiRequest<void>(`/posts/${encodeURIComponent(postId)}/save`, {
        method: nextSaved ? "PUT" : "DELETE",
      });

      setSaved(nextSaved);
      setNotice(nextSaved ? "Post saved." : "Post removed from your saved posts.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Couldn't update your saved posts. Try again."
      );
    } finally {
      setBusy(null);
    }
  }

  async function toggleComments() {
    const opening = !commentsOpen;
    setCommentsOpen(opening);
    setNotice("");

    if (!opening) return;

    setCommentsLoading(true);
    try {
      const result = await commentsApi.list(postId);
      setCommentItems(result.items);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Couldn't load comments. Try again."
      );
    } finally {
      setCommentsLoading(false);
    }
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      requireAuth(`/video/${postId}`);
      return;
    }

    const body = commentText.trim();
    if (!body || commentSubmitting) return;

    setCommentSubmitting(true);
    setNotice("");

    try {
      const result = await commentsApi.create(postId, body);
      setCommentItems((current) => [result.comment, ...current]);
      setCommentCount((current) => current + 1);
      setCommentText("");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Couldn't post your comment. Try again."
      );
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function deletePost() {
    if (!user || user.id !== authorId || deleting) return;
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true); setNotice("");
    try { await postsApi.remove(postId); setNotice("Post deleted."); onDeleted?.(postId); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Couldn't delete this post."); }
    finally { setDeleting(false); }
  }

  async function sharePost() {
    setNotice("");
    const url = `${window.location.origin}/video/${encodeURIComponent(postId)}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "A moment on VYBE", url });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setNotice("Post link copied.");
      } else {
        setNotice(`Copy this link: ${url}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setNotice(`Couldn't share automatically. Copy this link: ${url}`);
    }
  }

  return (
    <div>
      <div className="engagement">
        <button
          type="button"
          className={liked ? "liked" : ""}
          onClick={() => void toggleLike()}
          disabled={busy !== null}
          aria-label={liked ? "Unlike post" : "Like post"}
          aria-pressed={liked}
        >
          {busy === "like" ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Heart size={17} fill={liked ? "currentColor" : "none"} />
          )}
          {likeCount.toLocaleString()}
        </button>

        <button
          type="button"
          onClick={() => void toggleComments()}
          aria-label="View comments"
          aria-expanded={commentsOpen}
        >
          <MessageCircle size={17} />
          {commentCount.toLocaleString()}
        </button>

        <button type="button" onClick={() => void sharePost()} aria-label="Share post">
          <Share2 size={16} />
          {shares > 0 ? shares.toLocaleString() : "Share"}
        </button>

        {user && authorId === user.id && <button type="button" onClick={() => void deletePost()} disabled={deleting} aria-label="Delete post" title="Delete post">{deleting ? <LoaderCircle size={16} className="animate-spin"/> : <Trash2 size={16}/>} Delete</button>}

        <button
          type="button"
          className={saved ? "liked" : ""}
          onClick={() => void toggleSave()}
          disabled={busy !== null}
          aria-label={saved ? "Unsave post" : "Save post"}
          aria-pressed={saved}
        >
          {busy === "save" ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
          )}
        </button>
      </div>

      {notice && (
        <p className="footer-note" role="status">
          {notice}
        </p>
      )}

      {commentsOpen && (
        <section className="content-panel" aria-label="Post comments" style={{ marginTop: 12 }}>
          <h3>Comments</h3>

          {user ? (
            <form onSubmit={submitComment} style={{ display: "flex", gap: 8, margin: "12px 0" }}>
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Write a comment..."
                maxLength={1000}
                aria-label="Write a comment"
                style={{ flex: 1, minWidth: 0 }}
              />
              <button
                type="submit"
                className="button button-primary"
                disabled={!commentText.trim() || commentSubmitting}
                aria-label="Post comment"
              >
                {commentSubmitting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          ) : (
            <p className="muted">
              <button type="button" onClick={() => requireAuth(`/video/${postId}`)}>
                Sign in
              </button>{" "}
              to join the conversation.
            </p>
          )}

          {commentsLoading ? (
            <p className="muted" role="status">Loading comments…</p>
          ) : commentItems.length === 0 ? (
            <p className="muted">No comments yet. Start the conversation.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {commentItems.map((comment) => (
                <article key={comment.id}>
                  <strong>@{comment.username}</strong>
                  <p style={{ margin: "4px 0" }}>{comment.body}</p>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
