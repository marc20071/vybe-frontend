
"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  CheckCheck,
  LoaderCircle,
  MessageCircle,
  Minus,
  MoreHorizontal,
  Search,
  Send,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import {
  messagesApi,
  type Conversation,
  type Message,
} from "@/services/messages-api";

type ChatView = "conversations" | "chat";

function getMessagePreview(message: Message): string {
  if (message.deletedForEveryone) return "Message unsent";

  if (message.body?.trim()) return message.body;

  switch (message.messageType) {
    case "image":
      return "Photo";
    case "video":
      return "Video";
    case "voice":
      return "Voice message";
    case "file":
      return message.attachmentName || "File";
    case "system":
      return "Conversation update";
    default:
      return "Message";
  }
}

function formatMessageTime(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatConversationTime(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const difference = now.getTime() - date.getTime();

  if (difference < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getConversationName(conversation: Conversation): string {
  if (conversation.kind === "group") {
    return conversation.name || conversation.title || "Group chat";
  }

  return (
    conversation.displayName ||
    conversation.title ||
    conversation.username ||
    "VYBE user"
  );
}

function getConversationAvatar(conversation: Conversation) {
  return conversation.avatarUrl || null;
}

export function FloatingChat() {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [view, setView] = useState<ChatView>("conversations");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const loadingMessagesIdRef = useRef<string | null>(null);
  const messagesRequestIdRef = useRef(0);
  const sendingRef = useRef(false);

  const isAuthenticated = Boolean(user);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoadingConversations(true);

      const response = await messagesApi.conversations();
      const items = response.items || [];

      setConversations(items);

      setUnreadCount(
        items.reduce(
          (total, conversation) =>
            total + Math.max(0, conversation.unreadCount || 0),
          0
        )
      );

      setActiveConversation((current) => {
        if (!current) return null;

        return (
          items.find((item) => item.id === current.id) || current
        );
      });
    } catch {
      // Preserve already-loaded conversations if a background refresh fails.
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated]);

  const loadMessages = useCallback(
    async (conversationId: string, showLoading = false) => {
      const requestId = ++messagesRequestIdRef.current;

      if (showLoading) {
        setLoadingMessages(true);
        setError("");
      }

      try {
        const response = await messagesApi.list(conversationId);

        if (
          requestId !== messagesRequestIdRef.current ||
          activeConversationIdRef.current !== conversationId
        ) {
          return;
        }

        const items = response.items || [];

        setMessages((current) => {
          // Preserve the current list if the active conversation changed.
          if (activeConversationIdRef.current !== conversationId) {
            return current;
          }

          return items;
        });
      } catch (err) {
        if (
          requestId === messagesRequestIdRef.current &&
          activeConversationIdRef.current === conversationId
        ) {
          if (showLoading) {
            setError(
              err instanceof Error
                ? err.message
                : "Unable to load this conversation."
            );
          }
        }
      } finally {
        if (requestId === messagesRequestIdRef.current) {
          setLoadingMessages(false);
          loadingMessagesIdRef.current = null;
        }
      }
    },
    []
  );

  const selectConversation = useCallback(
    async (conversation: Conversation) => {
      activeConversationIdRef.current = conversation.id;
      loadingMessagesIdRef.current = conversation.id;

      setActiveConversation(conversation);
      setMessages([]);
      setDraft("");
      setOtherTyping(false);
      setError("");
      setView("chat");
      setLoadingMessages(true);

      await loadMessages(conversation.id, true);

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    },
    [loadMessages]
  );

  const backToConversations = useCallback(() => {
    activeConversationIdRef.current = null;
    loadingMessagesIdRef.current = null;
    messagesRequestIdRef.current += 1;

    setActiveConversation(null);
    setMessages([]);
    setOtherTyping(false);
    setError("");
    setView("conversations");

    void loadConversations();
  }, [loadConversations]);

  const openPopup = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    void loadConversations();
  }, [loadConversations]);

  const closePopup = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const minimizePopup = useCallback(() => {
    setIsMinimized(true);
  }, []);

  useEffect(() => {
    if (!isOpen || isMinimized || !isAuthenticated) return;

    void loadConversations();

    const interval = window.setInterval(() => {
      void loadConversations();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [
    isOpen,
    isMinimized,
    isAuthenticated,
    loadConversations,
  ]);

  useEffect(() => {
    if (
      !isOpen ||
      isMinimized ||
      view !== "chat" ||
      !activeConversation
    ) {
      return;
    }

    const conversationId = activeConversation.id;

    void loadMessages(conversationId);

    const interval = window.setInterval(() => {
      void loadMessages(conversationId);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [
    isOpen,
    isMinimized,
    view,
    activeConversation?.id,
    loadMessages,
  ]);

  useEffect(() => {
    if (
      !isOpen ||
      isMinimized ||
      view !== "chat" ||
      !activeConversation
    ) {
      setOtherTyping(false);
      return;
    }

    const conversationId = activeConversation.id;
    let cancelled = false;

    const checkTyping = async () => {
      try {
        const result = await messagesApi.typingStatus(conversationId);

        if (!cancelled) {
          setOtherTyping(Boolean(result.typing));
        }
      } catch {
        if (!cancelled) {
          setOtherTyping(false);
        }
      }
    };

    void checkTyping();

    const interval = window.setInterval(() => {
      void checkTyping();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    isOpen,
    isMinimized,
    view,
    activeConversation?.id,
  ]);

  useEffect(() => {
    if (!isOpen || isMinimized || view !== "chat") return;

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isOpen, isMinimized, view, otherTyping]);

  useEffect(() => {
    if (!isOpen || isMinimized || view !== "chat") return;

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        if (view === "chat") {
          backToConversations();
        } else {
          closePopup();
        }
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isMinimized, view, backToConversations, closePopup]);

  const filteredConversations = conversations.filter((conversation) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return true;

    return [
      conversation.title,
      conversation.name,
      conversation.displayName,
      conversation.username,
    ].some((value) => value?.toLowerCase().includes(query));
  });

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const conversationId = activeConversation?.id;
    const body = draft.trim();

    if (!conversationId || !body || sendingRef.current) return;

    sendingRef.current = true;
    setSending(true);
    setError("");

    try {
      const response = await messagesApi.send(conversationId, body);

      if (activeConversationIdRef.current !== conversationId) return;

      setMessages((current) => {
        const exists = current.some(
          (message) => message.id === response.message.id
        );

        return exists ? current : [...current, response.message];
      });

      setDraft("");

      void loadConversations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Your message could not be sent. Please try again."
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleComposerKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      const form = event.currentTarget.form;

      if (form) {
        form.requestSubmit();
      }
    }
  }

  function renderMessage(message: Message) {
    const isOwnMessage = message.senderId === user?.id;

    return (
      <div
        key={message.id}
        className={`floating-chat-message-row ${
          isOwnMessage ? "own" : "received"
        }`}
      >
        <div
          className={`floating-chat-message ${
            isOwnMessage ? "own" : "received"
          }`}
        >
          {message.deletedForEveryone ? (
            <p className="floating-chat-unsent">
              This message was unsent.
            </p>
          ) : (
            <>
              {message.body && (
                <p className="floating-chat-message-body">
                  {message.body}
                </p>
              )}

              {message.messageType === "image" &&
                message.attachmentUrl && (
                  <a
                    href={message.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="floating-chat-attachment"
                  >
                    <img
                      src={message.attachmentUrl}
                      alt={message.attachmentName || "Image"}
                      loading="lazy"
                    />
                  </a>
                )}

              {message.messageType === "video" &&
                message.attachmentUrl && (
                  <video
                    src={message.attachmentUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="floating-chat-video"
                  />
                )}

              {message.messageType === "voice" &&
                message.attachmentUrl && (
                  <audio
                    src={message.attachmentUrl}
                    controls
                    preload="metadata"
                    className="floating-chat-audio"
                  />
                )}

              {message.messageType === "file" &&
                message.attachmentUrl && (
                  <a
                    href={message.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="floating-chat-file"
                  >
                    {message.attachmentName || "Download file"}
                  </a>
                )}
            </>
          )}

          <div className="floating-chat-message-meta">
            <time dateTime={message.createdAt}>
              {formatMessageTime(message.createdAt)}
            </time>

            {isOwnMessage && (
              <span aria-label="Sent message">
                {message.receipts?.some((receipt) => receipt.readAt) ? (
                  <CheckCheck size={13} />
                ) : (
                  <Check size={13} />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="floating-chat-root">
      <button
        type="button"
        className="messages-quick-access"
        aria-label={isOpen ? "Close quick messages" : "Open quick messages"}
        aria-expanded={isOpen && !isMinimized}
        onClick={() => {
          if (!isOpen) {
            openPopup();
          } else if (isMinimized) {
            setIsMinimized(false);
          } else {
            closePopup();
          }
        }}
      >
        <span className="messages-icon">
          <MessageCircle size={23} strokeWidth={2.2} />
          {unreadCount > 0 && (
            <span className="floating-chat-shortcut-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </span>

        <span className="messages-text">
          <span className="messages-title">Messages</span>
          <span className="messages-subtitle">
            Chat without leaving your feed
          </span>
        </span>

        <span className="messages-arrow" aria-hidden="true">
          →
        </span>
      </button>

      {isOpen && (
        <section
          className={`floating-chat-panel ${
            isMinimized ? "minimized" : ""
          }`}
          aria-label="Quick messages"
        >
          <header className="floating-chat-header">
            {view === "chat" && !isMinimized ? (
              <button
                type="button"
                className="floating-chat-icon-button"
                aria-label="Back to conversations"
                onClick={backToConversations}
              >
                <ArrowLeft size={19} />
              </button>
            ) : (
              <div className="floating-chat-heading-icon">
                <MessageCircle size={19} />
              </div>
            )}

            <div className="floating-chat-header-title">
              <strong>
                {view === "chat" && activeConversation
                  ? getConversationName(activeConversation)
                  : "Messages"}
              </strong>

              <span>
                {view === "chat"
                  ? otherTyping
                    ? "Typing…"
                    : "Conversation"
                  : "Your conversations"}
              </span>
            </div>

            {view === "chat" && activeConversation && (
              <Link
                href={`/messages/${encodeURIComponent(
                  activeConversation.id
                )}`}
                className="floating-chat-full-page-link"
                title="Open full conversation"
                aria-label="Open full conversation"
              >
                <MoreHorizontal size={19} />
              </Link>
            )}

            <button
              type="button"
              className="floating-chat-icon-button"
              aria-label="Minimize quick messages"
              onClick={minimizePopup}
            >
              <Minus size={19} />
            </button>

            <button
              type="button"
              className="floating-chat-icon-button"
              aria-label="Close quick messages"
              onClick={closePopup}
            >
              <X size={19} />
            </button>
          </header>

          {!isMinimized && (
            <>
              {view === "conversations" ? (
                <>
                  <div className="floating-chat-search">
                    <Search size={17} />

                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                      placeholder="Search conversations"
                      aria-label="Search conversations"
                    />
                  </div>

                  <div className="floating-chat-conversation-list">
                    {loadingConversations &&
                      conversations.length === 0 && (
                        <div className="floating-chat-state">
                          <LoaderCircle
                            className="floating-chat-spinner"
                            size={22}
                          />
                          <span>Loading conversations…</span>
                        </div>
                      )}

                    {!loadingConversations &&
                      filteredConversations.length === 0 && (
                        <div className="floating-chat-state">
                          <MessageCircle size={27} />
                          <strong>No conversations found</strong>
                          <span>
                            Start a conversation from a profile or open
                            the full Messages page.
                          </span>
                        </div>
                      )}

                    {filteredConversations.map((conversation) => (
                      <button
                        type="button"
                        key={conversation.id}
                        className="floating-chat-conversation"
                        onClick={() => {
                          void selectConversation(conversation);
                        }}
                      >
                        <Avatar
                          name={getConversationName(conversation)}
                          src={getConversationAvatar(conversation)}
                          size={46}
                        />

                        <span className="floating-chat-conversation-info">
                          <span className="floating-chat-conversation-top">
                            <strong>
                              {getConversationName(conversation)}
                            </strong>

                            <time>
                              {formatConversationTime(
                                conversation.lastMessageAt
                              )}
                            </time>
                          </span>

                          <span className="floating-chat-conversation-bottom">
                            <span>
                              {conversation.isRequest
                                ? "Message request"
                                : conversation.lastMessage ||
                                  "Start chatting"}
                            </span>

                            {(conversation.unreadCount || 0) > 0 && (
                              <span className="floating-chat-unread-badge">
                                {(conversation.unreadCount || 0) > 99
                                  ? "99+"
                                  : conversation.unreadCount}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    ))}

                    {loadingConversations &&
                      conversations.length > 0 && (
                        <div className="floating-chat-refresh-indicator">
                          <LoaderCircle
                            className="floating-chat-spinner"
                            size={14}
                          />
                          Updating conversations…
                        </div>
                      )}
                  </div>

                  <footer className="floating-chat-footer">
                    <Link
                      href="/messages"
                      className="floating-chat-open-messages"
                      onClick={closePopup}
                    >
                      Open full Messages
                      <ArrowUp size={15} />
                    </Link>
                  </footer>
                </>
              ) : (
                <>
                  <div className="floating-chat-active-person">
                    <Avatar
                      name={
                        activeConversation
                          ? getConversationName(activeConversation)
                          : "VYBE user"
                      }
                      src={
                        activeConversation
                          ? getConversationAvatar(activeConversation)
                          : null
                      }
                      size={34}
                    />

                    <div>
                      <strong>
                        {activeConversation
                          ? getConversationName(activeConversation)
                          : "Conversation"}
                      </strong>

                      <span>
                        {otherTyping
                          ? "Typing…"
                          : activeConversation?.kind === "group"
                            ? `${activeConversation.memberCount || 0} members`
                            : `@${activeConversation?.username || "user"}`}
                      </span>
                    </div>
                  </div>

                  <div className="floating-chat-message-list">
                    {loadingMessages && messages.length === 0 && (
                      <div className="floating-chat-state">
                        <LoaderCircle
                          className="floating-chat-spinner"
                          size={22}
                        />
                        <span>Loading messages…</span>
                      </div>
                    )}

                    {!loadingMessages &&
                      !error &&
                      messages.length === 0 && (
                        <div className="floating-chat-state">
                          <MessageCircle size={27} />
                          <strong>No messages yet</strong>
                          <span>Send a message to start chatting.</span>
                        </div>
                      )}

                    {messages.map(renderMessage)}

                    {otherTyping && (
                      <div className="floating-chat-typing">
                        <span />
                        <span />
                        <span />
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {error && (
                    <div className="floating-chat-error" role="alert">
                      <span>{error}</span>

                      <button
                        type="button"
                        onClick={() => {
                          if (activeConversation) {
                            void loadMessages(
                              activeConversation.id,
                              true
                            );
                          }
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  <form
                    className="floating-chat-composer"
                    onSubmit={handleSend}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder="Write a message…"
                      aria-label="Write a message"
                      maxLength={5000}
                      autoComplete="off"
                      disabled={!activeConversation || sending}
                    />

                    <button
                      type="submit"
                      disabled={!draft.trim() || sending}
                      aria-label="Send message"
                    >
                      {sending ? (
                        <LoaderCircle
                          size={18}
                          className="floating-chat-spinner"
                        />
                      ) : (
                        <Send size={17} />
                      )}
                    </button>
                  </form>

                  <footer className="floating-chat-footer">
                    <Link
                      href={
                        activeConversation
                          ? `/messages/${encodeURIComponent(
                              activeConversation.id
                            )}`
                          : "/messages"
                      }
                      className="floating-chat-open-messages"
                      onClick={closePopup}
                    >
                      Open full conversation
                      <ArrowUp size={15} />
                    </Link>
                  </footer>
                </>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
