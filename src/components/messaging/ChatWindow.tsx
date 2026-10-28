"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, RefreshCw, Send } from "lucide-react";
import { messagesApi, type Message } from "@/services/messages-api";
import { useAuth } from "@/hooks/useAuth";

export function ChatWindow({ conversationId }: { conversationId: string }) {
  const { user, requireAuth } = useAuth();
  const [items, setItems] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const result = await messagesApi.list(conversationId); setItems(result.items); } catch (err) { setError(err instanceof Error ? err.message : "Couldn't load messages."); } finally { setLoading(false); } }, [conversationId]);
  useEffect(() => { void load(); }, [load]);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!user) { requireAuth(`/messages/${conversationId}`); return; } const body = text.trim(); if (!body || sending) return; setSending(true); setError(""); try { const result = await messagesApi.send(conversationId, body); setItems(current => [...current, result.message]); setText(""); } catch (err) { setError(err instanceof Error ? err.message : "Message was not sent."); } finally { setSending(false); } }
  return <section className="chat-main"><div className="conversation-list-heading"><strong>Conversation</strong><button type="button" className="icon-button" onClick={() => void load()} aria-label="Refresh messages"><RefreshCw size={15}/></button></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="chat-message-list">{loading ? <p className="muted"><LoaderCircle size={14} className="animate-spin"/> Loading messages…</p> : items.map(item => <div key={item.id} className={`chat-bubble ${item.senderId === user?.id ? "mine" : ""}`}><p>{item.body}</p><time>{new Date(item.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</time></div>)}</div><form className="chat-compose" onSubmit={(event) => void submit(event)}><input value={text} onChange={event => setText(event.target.value)} placeholder="Write a message…" aria-label="Write a message" maxLength={5000} disabled={sending}/><button className="button button-primary" disabled={!text.trim() || sending} aria-label="Send message">{sending ? <LoaderCircle size={16} className="animate-spin"/> : <Send size={16}/>}</button></form></section>;
}
