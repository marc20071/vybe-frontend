"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Heart,
  MessageCircle,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import {
  notificationsApi,
  type Notification,
} from "@/services/notifications-api";
import { usersApi } from "@/services/users-api";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/hooks/useAuth";

const iconFor = (type: string) => {
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes("follow")) {
    return UserPlus;
  }

  if (
    normalizedType.includes("comment") ||
    normalizedType.includes("message")
  ) {
    return MessageCircle;
  }

  return Heart;
};

type FollowRequest = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const { user, loading: authLoading, requireAuth } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<Notification[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [result, requests] = await Promise.all([
        notificationsApi.list(),
        usersApi.followRequests(),
      ]);

      setItems(result.items);
      setFollowRequests(requests.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't load notifications."
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

  async function clearAll() {
    if (
      !items.length ||
      !window.confirm("Clear all notifications? This cannot be undone.")
    ) {
      return;
    }

    setError("");

    try {
      await notificationsApi.clear();
      setItems([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not clear notifications."
      );
    }
  }

  async function markRead(item: Notification) {
    if (item.readAt) return;

    try {
      await notificationsApi.markRead(item.id);

      setItems((current) =>
        current.map((value) =>
          value.id === item.id
            ? { ...value, readAt: new Date().toISOString() }
            : value
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't mark notification as read."
      );
    }
  }

  async function respondToRequest(id: string, approve: boolean) {
    try {
      await usersApi.respondFollowRequest(id, approve);

      setFollowRequests((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update follow request."
      );
    }
  }

  if (authLoading || loading) {
    return (
      <div className="page-wrap">
        <h1 className="page-title">Notifications</h1>
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-wrap">
        <h1 className="page-title">Notifications</h1>

        <section className="empty-state">
          <Bell size={30} color="#c4b5fd" />
          <h2>Keep up with your people.</h2>
          <p className="muted">
            Sign in to see your notifications.
          </p>

          <button
            type="button"
            className="button button-primary"
            onClick={() => requireAuth("/notifications")}
          >
            Sign in
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <p className="eyebrow">THE LITTLE THINGS THAT ADD UP</p>

      <h1 className="page-title">Notifications</h1>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <p className="muted">
          Updates about activity on your account.
        </p>

        <button
          type="button"
          className="button button-secondary"
          onClick={() => void clearAll()}
          disabled={!items.length}
        >
          Clear notifications
        </button>
      </div>

      {error && (
        <section className="content-panel" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => void load()}
          >
            <RefreshCw size={15} /> Try again
          </button>
        </section>
      )}

      {!error && items.length === 0 && followRequests.length === 0 && (
        <section className="empty-state">
          <Bell size={30} color="#c4b5fd" />
          <h2>You&apos;re all caught up.</h2>
          <p className="muted">
            New activity will appear here.
          </p>

          <Link href="/" className="button button-secondary">
            Back to feed
          </Link>
        </section>
      )}

      {followRequests.length > 0 && (
        <section
          className="content-panel"
          style={{ marginTop: 18 }}
        >
          <div className="section-heading">
            <UserPlus size={18} />
            <h2>Follow requests</h2>
            <span className="muted">{followRequests.length}</span>
          </div>

          {followRequests.map((request) => (
            <div
              className="notification-request-row"
              key={request.id}
            >
              <Link
                href={`/profile/${encodeURIComponent(request.username)}`}
              >
                <Avatar
                  name={request.displayName || request.username}
                  src={request.avatarUrl}
                  size={42}
                />
              </Link>

              <div className="notification-request-copy">
                <Link
                  href={`/profile/${encodeURIComponent(request.username)}`}
                >
                  <strong>
                    {request.displayName || request.username}
                  </strong>
                </Link>

                <p
                  className="muted"
                  style={{ margin: "2px 0", fontSize: 12 }}
                >
                  @{request.username} ·{" "}
                  {new Date(request.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="notification-request-actions">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() =>
                    void respondToRequest(request.id, true)
                  }
                >
                  Approve
                </button>

                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() =>
                    void respondToRequest(request.id, false)
                  }
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section
        className="content-panel"
        style={{ marginTop: 18 }}
      >
        {items.map((item) => {
          const Icon = iconFor(item.type);

          return (
            <button
              type="button"
              key={item.id}
              className={`notification-row ${
                item.readAt ? "is-read" : "is-unread"
              }`}
              onClick={() => {
                void markRead(item);

                const kind = item.type.toLowerCase();

                if (kind.includes("message")) {
                  router.push("/messages");
                } else if (item.actorUsername) {
                  router.push(
                    `/profile/${encodeURIComponent(item.actorUsername)}`
                  );
                }
              }}
            >
              <span className="notification-icon">
                <Icon size={18} />
              </span>

              <span className="notification-copy">
                <strong>{item.message}</strong>

                <span className="muted">
                  {item.actorUsername
                    ? `@${item.actorUsername} · `
                    : ""}
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </span>

              {!item.readAt && (
                <span
                  className="notification-dot"
                  aria-label="Unread"
                />
              )}
            </button>
          );
        })}
      </section>
    </div>
  );
}