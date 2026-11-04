
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Users,
  LoaderCircle,
  RefreshCw,
  ArrowUpRight,
  Plus,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { messagesApi, type Conversation } from "@/services/messages-api";
import { Avatar } from "@/components/ui/Avatar";

export default function MessagesPage() {
  const { user, loading: authLoading, requireAuth } = useAuth();

  const [items, setItems] = useState<Conversation[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupUsernames, setGroupUsernames] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await messagesApi.conversations();
      setItems(result.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't load conversations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void load();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, load]);

  useEffect(() => {
    const target =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("to")
        : null;

    if (!user || !target) return;

    let cancelled = false;

    messagesApi
      .createConversation(target)
      .then((result) => {
        if (!cancelled) {
          window.location.replace(`/messages/${result.id}`);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Couldn't start the conversation."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || creating) return;

    const cleanGroupName = groupName.trim();

    if (!cleanGroupName) {
      setError("Enter a group name.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const names = groupUsernames
        .split(",")
        .map((value) => value.trim().replace(/^@/, ""))
        .filter(Boolean);

      const result = await messagesApi.createGroup(
        cleanGroupName,
        names
      );

      window.location.href = `/messages/${result.id}`;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't create the group."
      );
    } finally {
      setCreating(false);
    }
  }

  async function startConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      requireAuth("/messages");
      return;
    }

    const cleanUsername = username.trim().replace(/^@/, "");

    if (!cleanUsername || creating) return;

    setCreating(true);
    setError("");

    try {
      const result =
        await messagesApi.createConversation(cleanUsername);

      window.location.href = `/messages/${result.id}`;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't start the conversation."
      );
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="messages-workspace">
        <div className="messages-loading">
          <LoaderCircle size={25} className="animate-spin" />
          <span>Loading your conversations...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="messages-workspace">
        <section className="empty-state">
          <MessageCircle size={30} color="#c4b5fd" />
          <h2>Good conversations start here.</h2>
          <p className="muted">
            Sign in to message other creators privately.
          </p>
          <button
            type="button"
            className="button button-primary"
            onClick={() => requireAuth("/messages")}
          >
            Sign in
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="messages-workspace">
      <aside
        className="chat-fullscreen-sidebar"
        aria-label="Your conversations"
      >
        <div className="chat-fullscreen-sidebar-head">
          <div>
            <h1>Messages</h1>
            <span className="messages-count">
              {items.length} conversations
            </span>
          </div>

          <div className="messages-head-actions">
            <button
              type="button"
              className="icon-button"
              aria-label="Create group"
              title="Create group"
              onClick={() => setShowGroupForm((value) => !value)}
            >
              <Users size={17} />
            </button>

            <button
              type="button"
              className="icon-button"
              aria-label="Refresh conversations"
              title="Refresh"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        <div className="chat-fullscreen-search">
          <form onSubmit={(event) => void startConversation(event)}>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Start chat with @username"
              aria-label="Username to message"
              maxLength={30}
              required
            />

            <button
              type="submit"
              className="icon-button"
              aria-label="Start conversation"
              disabled={creating || !username.trim()}
            >
              {creating ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Plus size={17} />
              )}
            </button>
          </form>
        </div>

        {showGroupForm && (
          <form
            className="group-create-form"
            onSubmit={(event) => void createGroup(event)}
          >
            <strong>Create a group</strong>

            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Group name"
              aria-label="Group name"
              maxLength={80}
              required
            />

            <input
              value={groupUsernames}
              onChange={(event) =>
                setGroupUsernames(event.target.value)
              }
              placeholder="Member usernames, comma-separated"
              aria-label="Member usernames"
            />

            <p className="muted">
              You will be the group admin. Add usernames separated
              by commas.
            </p>

            <button
              type="submit"
              className="button button-primary"
              disabled={creating || !groupName.trim()}
            >
              {creating ? (
                <>
                  <LoaderCircle
                    size={15}
                    className="animate-spin"
                  />
                  Creating group...
                </>
              ) : (
                "Create group"
              )}
            </button>
          </form>
        )}

        {error && (
          <p className="form-error messages-error" role="alert">
            {error}
          </p>
        )}

        <div className="chat-fullscreen-list">
          {items.map((item) => (
            <Link
              href={`/messages/${item.id}`}
              key={item.id}
              className="chat-fullscreen-row"
            >
              <Avatar
                name={item.displayName || item.username}
                src={item.avatarUrl}
                size={46}
              />

              <span className="chat-fullscreen-row-copy">
                <strong>{item.displayName || item.title}</strong>
                <span>
                  {item.isRequest || item.requestStatus === "pending"
                    ? "Message request"
                    : item.lastMessage || "No messages yet"}
                </span>
              </span>

              {(item.unreadCount || 0) > 0 && (
                <span
                  className="chat-unread-badge"
                  aria-label={`${item.unreadCount} unread messages`}
                >
                  {item.unreadCount! > 99
                    ? "99+"
                    : item.unreadCount}
                </span>
              )}
            </Link>
          ))}

          {items.length === 0 && (
            <div className="messages-no-chats">
              <MessageCircle size={30} />
              <strong>No conversations yet</strong>
              <p>
                Enter a username above or open a creator&apos;s
                profile and tap Message.
              </p>
            </div>
          )}
        </div>
      </aside>

      <section className="chat-fullscreen-main is-list">
        <div className="chat-empty-state">
          <MessageCircle size={45} />
          <strong>Your conversations, all in one place.</strong>
          <span>
            Select a conversation on the left, or start a new chat.
          </span>

          <Link
            href="/explore"
            className="button button-primary messages-discover-button"
          >
            Discover creators
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>

      <style jsx global>{`
        .messages-workspace {
          display: flex;
          width: 100%;
          min-width: 0;
          height: calc(100dvh - 80px);
          min-height: 0;
          overflow: hidden;
        }

        .messages-workspace .chat-fullscreen-sidebar {
          display: flex;
          flex-direction: column;
          flex: 0 0 350px;
          width: 350px;
          max-width: 42%;
          min-width: 260px;
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }

        .messages-workspace .chat-fullscreen-sidebar-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px;
        }

        .messages-workspace .chat-fullscreen-sidebar-head h1 {
          margin: 0;
          font-size: 23px;
        }

        .messages-count {
          display: block;
          margin-top: 4px;
          color: var(--muted, #888);
          font-size: 12px;
        }

        .messages-head-actions {
          display: flex;
          gap: 7px;
        }

        .messages-workspace .chat-fullscreen-search {
          padding: 0 14px 14px;
        }

        .messages-workspace .chat-fullscreen-search form {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .messages-workspace .chat-fullscreen-search input {
          min-width: 0;
          flex: 1;
        }

        .messages-workspace .chat-fullscreen-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
        }

        .messages-workspace .chat-fullscreen-row {
          position: relative;
          min-width: 0;
        }

        .messages-workspace .chat-fullscreen-row-copy {
          min-width: 0;
          flex: 1;
        }

        .messages-workspace .chat-fullscreen-row-copy strong,
        .messages-workspace .chat-fullscreen-row-copy span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chat-unread-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 21px;
          height: 21px;
          padding: 0 6px;
          border-radius: 999px;
          background: #7c3aed;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          margin-left: auto;
          flex-shrink: 0;
        }

        .messages-error {
          margin: 0;
          padding: 8px 14px;
        }

        .messages-no-chats {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 35px 20px;
          text-align: center;
          color: var(--muted, #888);
        }

        .messages-no-chats strong {
          color: var(--foreground, inherit);
        }

        .messages-no-chats p {
          margin: 0;
          font-size: 13px;
        }

        .messages-workspace .chat-fullscreen-main {
          flex: 1;
          min-width: 0;
          min-height: 0;
        }

        .messages-discover-button {
          margin-top: 18px;
        }

        .messages-loading {
          display: flex;
          min-height: 45vh;
          width: 100%;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--muted, #888);
        }

        @media (max-width: 760px) {
          .messages-workspace {
            height: calc(100dvh - 64px);
            min-height: 0;
          }

          .messages-workspace .chat-fullscreen-sidebar {
            flex: 1 1 auto;
            width: 100%;
            max-width: none;
            min-width: 0;
            border-right: 0;
          }

          .messages-workspace .chat-fullscreen-main {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
