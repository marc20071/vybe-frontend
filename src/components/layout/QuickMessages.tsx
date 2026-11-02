
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageCircle,
  X,
  ArrowLeft,
  Send,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import {
  messagesApi,
  type Conversation,
  type Message,
} from "@/services/messages-api";
import { Avatar } from "@/components/ui/Avatar";

export function QuickMessages() {
  const { user, requireAuth } = useAuth();

  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    if (!user) return;

    setLoadingChats(true);
    setError("");

    try {
      const result = await messagesApi.conversations();
      setConversations(result.items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't load conversations."
      );
    } finally {
      setLoadingChats(false);
    }
  }, [user]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    setError("");

    try {
      const result = await messagesApi.list(conversationId);
      setMessages(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (open && user) void loadConversations();
  }, [open, user, loadConversations]);

  useEffect(() => {
    if (open && selected) void loadMessages(selected.id);
  }, [open, selected, loadMessages]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = draft.trim();
    if (!body || !selected || sending) return;

    setSending(true);
    setError("");

    try {
      const result = await messagesApi.send(selected.id, body);
      setMessages((current) => [...current, result.message]);
      setDraft("");

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selected.id
            ? { ...conversation, lastMessage: body, lastMessageAt: result.message.createdAt }
            : conversation
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  function togglePanel() {
    if (!user) {
      requireAuth("/messages");
      return;
    }

    setOpen((value) => !value);
    setSelected(null);
    setMessages([]);
    setError("");
  }

  return (
    <>
      <button
        type="button"
        className="quick-messages-trigger"
        onClick={togglePanel}
        aria-label={open ? "Close quick messages" : "Open quick messages"}
        title="Messages"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        <span>Messages</span>
      </button>

      {open && user && (
        <aside className="quick-messages-panel" aria-label="Quick messages">
          <header className="quick-messages-header">
            {selected ? (
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setSelected(null);
                  setMessages([]);
                  setError("");
                }}
                aria-label="Back to conversations"
              >
                <ArrowLeft size={19} />
              </button>
            ) : (
              <MessageCircle size={20} />
            )}

            <strong>
              {selected
                ? selected.displayName || selected.title
                : "Messages"}
            </strong>

            <button
              type="button"
              className="icon-button"
              onClick={() => {
                if (selected) void loadMessages(selected.id);
                else void loadConversations();
              }}
              aria-label="Refresh"
            >
              <RefreshCw size={17} />
            </button>

            <button
              type="button"
              className="icon-button"
              onClick={() => setOpen(false)}
              aria-label="Close messages"
            >
              <X size={19} />
            </button>
          </header>

          {error && (
            <p className="form-error quick-messages-error" role="alert">
              {error}
            </p>
          )}

          {!selected ? (
            <div className="quick-messages-list">
              {loadingChats ? (
                <div className="quick-messages-loading">
                  <LoaderCircle className="animate-spin" size={22} />
                  <span>Loading conversations...</span>
                </div>
              ) : conversations.length ? (
                conversations.map((conversation) => (
                  <button
                    type="button"
                    className="quick-conversation-row"
                    key={conversation.id}
                    onClick={() => setSelected(conversation)}
                  >
                    <Avatar
                      name={conversation.displayName || conversation.title}
                      src={conversation.avatarUrl}
                      size={42}
                    />
                    <span className="quick-conversation-copy">
                      <strong>
                        {conversation.displayName || conversation.title}
                      </strong>
                      <span>
                        {conversation.isRequest ||
                        conversation.requestStatus === "pending"
                          ? "Message request"
                          : conversation.lastMessage || "No messages yet"}
                      </span>
                    </span>
                    {(conversation.unreadCount || 0) > 0 && (
                      <span className="quick-unread">
                        {conversation.unreadCount! > 99
                          ? "99+"
                          : conversation.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="quick-messages-empty">
                  <MessageCircle size={30} />
                  <strong>No conversations yet</strong>
                  <span>Start a conversation with a creator.</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="quick-chat-profile">
                <Avatar
                  name={selected.displayName || selected.title}
                  src={selected.avatarUrl}
                  size={34}
                />
                <div>
                  <strong>{selected.displayName || selected.title}</strong>
                  <span>@{selected.username}</span>
                </div>
                <a href={`/messages/${selected.id}`} title="Open full chat">
                  Open
                </a>
              </div>

              <div className="quick-chat-messages">
                {loadingMessages ? (
                  <div className="quick-messages-loading">
                    <LoaderCircle className="animate-spin" size={22} />
                    <span>Loading messages...</span>
                  </div>
                ) : messages.length ? (
                  messages.map((message) => {
                    const own = message.senderId === user.id;

                    return (
                      <div
                        key={message.id}
                        className={`quick-message-bubble ${
                          own ? "own" : "received"
                        }`}
                      >
                        {message.deletedForEveryone
                          ? "This message was deleted"
                          : message.body || (
                              message.messageType === "image"
                                ? "Image attachment"
                                : message.messageType === "video"
                                  ? "Video attachment"
                                  : message.messageType === "voice"
                                    ? "Voice message"
                                    : "Attachment"
                            )}
                      </div>
                    );
                  })
                ) : (
                  <div className="quick-messages-empty">
                    <span>No messages yet. Say hello!</span>
                  </div>
                )}
              </div>

              <form className="quick-chat-compose" onSubmit={sendMessage}>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message..."
                  aria-label="Write a message"
                  maxLength={5000}
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  aria-label="Send message"
                >
                  {sending ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </>
          )}
        </aside>
      )}
    </>
  );
}
