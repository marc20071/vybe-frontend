"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { messagesApi, type Conversation } from "@/services/messages-api";
import { Avatar } from "@/components/ui/Avatar";

export function ConversationList() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() { setLoading(true); setError(""); try { const result = await messagesApi.conversations(); setItems(result.items); } catch (err) { setError(err instanceof Error ? err.message : "Couldn't load conversations."); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  return <div className="chat-list"><div className="conversation-list-heading"><h3>Messages</h3><button type="button" className="icon-button" onClick={() => void load()} aria-label="Refresh conversations"><RefreshCw size={15}/></button></div>{loading ? <p className="muted" role="status"><LoaderCircle size={14} className="animate-spin"/> Loading conversations…</p> : error ? <p className="form-error" role="alert">{error}</p> : items.length ? items.map(item => <Link href={`/messages/${item.id}`} key={item.id} className="conversation-row"><Avatar name={item.displayName || item.username} src={item.avatarUrl} small/><span className="conversation-copy"><strong>{item.displayName || item.title}</strong><span className="muted">{item.lastMessage || "No messages yet"}</span></span></Link>) : <p className="muted">No conversations yet.</p>}</div>;
}
