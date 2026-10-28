"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { commentsApi, type Comment } from "@/services/comments-api";

export function CommentList({ postId }: { postId: string }) {
  const { user, requireAuth } = useAuth();
  const [comment, setComment] = useState("");
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { const result = await commentsApi.list(postId); setItems(result.items); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't load comments."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [postId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) { requireAuth(`/video/${postId}`); return; }
    const body = comment.trim();
    if (!body || sending) return;
    setSending(true); setError("");
    try { const result = await commentsApi.create(postId, body); setItems((current) => [result.comment, ...current]); setComment(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't post your comment."); }
    finally { setSending(false); }
  }

  return <section className="content-panel"><h2>Comments</h2><form onSubmit={(event) => void submit(event)}><div className="form-field"><label htmlFor={`comment-${postId}`}>Add a comment</label><textarea id={`comment-${postId}`} rows={3} value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder="Say something thoughtful…" /></div><button className="button button-primary" disabled={!comment.trim() || sending}>{sending ? <LoaderCircle size={16} className="animate-spin"/> : <Send size={16}/>} {sending ? "Posting…" : "Post comment"}</button></form>{error && <p className="form-error" role="alert">{error}</p>}{loading ? <p className="muted" role="status">Loading comments…</p> : items.length ? <div className="comment-list">{items.map((item) => <article key={item.id}><strong>@{item.username}</strong><p>{item.body}</p><time>{new Date(item.createdAt).toLocaleString()}</time></article>)}</div> : <p className="muted">No comments yet.</p>}</section>;
}
