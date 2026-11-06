
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useFeed } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import { PostActions } from "@/components/posts/PostActions";
import { FeedLoader } from "@/components/feed/FeedLoader";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/profiles/FollowButton";
import { SuggestedAccounts } from "@/components/layout/SuggestedAccounts";
import { FloatingChat } from "@/components/messaging/FloatingChat";
import { postsApi } from "@/services/posts-api";

function formatPostDate(date: string) {
  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return "";

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 60000),
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString();
}

/**
 * Records one authenticated view after at least 50% of the
 * post has remained visible for one second.
 *
 * The backend must enforce one view per account per post.
 */
function PostViewTracker({ postId }: { postId: string }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || sentRef.current) return;

    if (!("IntersectionObserver" in window)) return;

    let active = true;

    const clearDwellTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry) return;

        const visible =
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.5;

        if (!visible) {
          clearDwellTimer();
          return;
        }

        if (timerRef.current || sentRef.current) return;

        timerRef.current = setTimeout(() => {
          timerRef.current = null;

          if (!active || sentRef.current) return;

          sentRef.current = true;

          void postsApi
            .recordView(postId)
            .then((result) => {
              if (!active) return;

              window.dispatchEvent(
                new CustomEvent("vybe:post-view-count", {
                  detail: {
                    postId,
                    viewCount: result.viewCount,
                  },
                }),
              );
            })
            .catch((error) => {
              // Permit another attempt if the request failed.
              sentRef.current = false;

              console.error(
                "Could not record post view:",
                error,
              );
            });
        }, 1000);
      },
      {
        threshold: [0, 0.5, 1],
      },
    );

    observer.observe(element);

    return () => {
      active = false;
      observer.disconnect();
      clearDwellTimer();
    };
  }, [postId]);

  return (
    <div
      ref={elementRef}
      className="post-view-tracker"
      aria-hidden="true"
    />
  );
}

export function VideoFeed({
  initialTab = "For you",
}: {
  initialTab?: "For you" | "Following";
}) {
  const [tab, setTab] = useState<"For you" | "Following">(
    initialTab,
  );

  const { user, requireAuth } = useAuth();

  const mode =
    tab === "Following" ? "following" : "for-you";

  const {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useFeed(mode);

  const creators = useMemo(
    () =>
      items
        .filter((post) => Boolean(post.username))
        .map((post) => ({
          username: post.username || "",
          displayName:
            post.displayName ||
            post.username ||
            "VYBE creator",
          avatarUrl: post.avatarUrl,
        })),
    [items],
  );

  // Refresh the feed when a post is deleted.
  useEffect(() => {
    const handlePostDeleted = () => {
      void refresh();
    };

    window.addEventListener(
      "vybe:post-deleted",
      handlePostDeleted,
    );

    return () => {
      window.removeEventListener(
        "vybe:post-deleted",
        handlePostDeleted,
      );
    };
  }, [refresh]);

  function changeTab(nextTab: "For you" | "Following") {
    if (nextTab === "Following" && !user) {
      requireAuth("/following");
      return;
    }

    setTab(nextTab);
  }

  return (
    <div className="home-feed-layout">
      <section className="feed-column">
        <div className="feed-toolbar">
          <div className="feed-tabs">
            {(["For you", "Following"] as const).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  className={`feed-tab ${
                    tab === item ? "active" : ""
                  }`}
                  onClick={() => changeTab(item)}
                  aria-pressed={tab === item}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <span className="feed-note">
            <span className="feed-live-dot" />
            {tab === "Following"
              ? "Posts from people you follow"
              : "Discover what's happening"}
          </span>
        </div>

        {error && (
          <div className="content-panel" role="alert">
            <p>We couldn&apos;t load your feed.</p>
            <p className="muted">{error}</p>

            <button
              type="button"
              className="button button-secondary"
              onClick={() => void refresh()}
            >
              Try again
            </button>
          </div>
        )}

        {items.map((post) => {
          const media = post.media?.[0];

          const creatorName =
            post.displayName ||
            post.username ||
            "VYBE user";

          const username = post.username || "user";

          return (
            <article
              className="video-card instagram-post"
              key={post.id}
            >
              <PostViewTracker postId={post.id} />

              <header className="instagram-post-header">
                <Link
                  href={`/profile/${encodeURIComponent(username)}`}
                  className="instagram-author"
                >
                  <Avatar
                    name={creatorName}
                    src={post.avatarUrl}
                    size={42}
                  />

                  <span className="instagram-author-meta">
                    <strong>{creatorName}</strong>

                    <small>
                      @{username}
                      {post.createdAt
                        ? ` · ${formatPostDate(post.createdAt)}`
                        : ""}
                    </small>
                  </span>
                </Link>

                {user?.username?.toLowerCase() !==
                  username.toLowerCase() && (
                  <FollowButton username={username} />
                )}
              </header>

              {post.caption && (
                <div className="instagram-caption instagram-caption-top">
                  <Link
                    href={`/profile/${encodeURIComponent(username)}`}
                  >
                    <strong>{username}</strong>
                  </Link>{" "}
                  {post.caption}
                </div>
              )}

              <div className="instagram-post-media">
                {media?.url ? (
                  media.type === "video" ? (
                    <video
                      key={media.url}
                      src={media.url}
                      poster={media.thumbnailUrl}
                      controls
                      muted
                      playsInline
                      loop
                      preload="metadata"
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <img
                      src={media.url}
                      alt={
                        media.altText ||
                        post.caption ||
                        "VYBE post"
                      }
                      loading="lazy"
                    />
                  )
                ) : (
                  <div className="instagram-media-unavailable">
                    <span>
                      Media is unavailable for this post.
                    </span>
                  </div>
                )}
              </div>

              <div className="instagram-post-content">
                <PostActions
                  postId={post.id}
                  authorId={post.userId}
                  likes={post.likeCount}
                  comments={post.commentCount}
                  shares={0}
                  viewCount={post.viewCount ?? 0}
                  repostCount={post.repostCount ?? 0}
                  viewerHasLiked={post.viewerHasLiked}
                  viewerHasSaved={post.viewerHasSaved}
                  viewerHasReposted={post.viewerHasReposted}
                  onDeleted={() => {
                    window.dispatchEvent(
                      new CustomEvent("vybe:post-deleted"),
                    );
                  }}
                />
              </div>
            </article>
          );
        })}

        {!loading && !error && items.length === 0 && (
          <div className="content-panel">
            <h3>
              {tab === "Following"
                ? "Your feed is waiting"
                : "No posts yet"}
            </h3>

            <p className="muted">
              {tab === "Following"
                ? "Follow creators to see their posts here."
                : "Be among the first to share a moment on VYBE."}
            </p>

            <Link
              href="/explore"
              className="button button-secondary"
            >
              Discover creators
            </Link>
          </div>
        )}

        {loading && items.length === 0 && (
          <div className="feed-skeleton-list" role="status">
            {Array.from({ length: 2 }, (_, index) => (
              <div className="post-skeleton" key={index}>
                <div className="skeleton skeleton-media" />
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line short" />
              </div>
            ))}
          </div>
        )}

        {loading && items.length > 0 && (
          <p className="footer-note" role="status">
            Loading more posts...
          </p>
        )}

        {!loading && hasMore && items.length > 0 && (
          <FeedLoader
            loading={loading}
            onLoadMore={() => void loadMore()}
          />
        )}
      </section>

      <aside className="feed-right-column feed-sidebar-stack">
        <section className="feed-suggested-section">
          <SuggestedAccounts creators={creators} />
        </section>

        <section className="feed-quick-messages-section">
          <FloatingChat />
        </section>
      </aside>
    </div>
  );
}
