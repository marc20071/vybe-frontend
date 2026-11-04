
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useFeed } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import { PostActions } from "@/components/posts/PostActions";
import { FeedLoader } from "@/components/feed/FeedLoader";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/profiles/FollowButton";
import { SuggestedAccounts } from "@/components/layout/SuggestedAccounts";
import { FloatingChat } from "@/components/messaging/FloatingChat";

function formatPostDate(date: string) {
  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return "";

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 60000)
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString();
}

export function VideoFeed({
  initialTab = "For you",
}: {
  initialTab?: "For you" | "Following";
}) {
  const [tab, setTab] = useState<"For you" | "Following">(initialTab);
  const { user, requireAuth } = useAuth();

  const mode = tab === "Following" ? "following" : "for-you";

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
            post.displayName || post.username || "VYBE creator",
          avatarUrl: post.avatarUrl,
        })),
    [items]
  );

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
            {(["For you", "Following"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`feed-tab ${tab === item ? "active" : ""}`}
                onClick={() => changeTab(item)}
              >
                {item}
              </button>
            ))}
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
            post.displayName || post.username || "VYBE user";
          const username = post.username || "user";

          return (
            <article
              className="video-card instagram-post"
              key={post.id}
            >
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

              <div className="instagram-post-media">
                {media?.url ? (
                  media.type === "video" ? (
                    <video
                      key={media.url}
                      src={media.url}
                      poster={media.thumbnailUrl}
                      controls
                      autoPlay
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
                  likes={post.likeCount}
                  comments={post.commentCount}
                  shares={0}
                  viewerHasLiked={post.viewerHasLiked}
                  viewerHasSaved={post.viewerHasSaved}
                />

                <div className="instagram-caption">
                  <Link
                    href={`/profile/${encodeURIComponent(username)}`}
                  >
                    <strong>{username}</strong>
                  </Link>{" "}
                  {post.caption || "A moment on VYBE."}
                </div>
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

      <div className="feed-right-column">
        <SuggestedAccounts creators={creators} />
      </div>

      <FloatingChat />
    </div>
  );
}
