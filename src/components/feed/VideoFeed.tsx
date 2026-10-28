
"use client";

import { useState } from "react";
import { useFeed } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import { PostActions } from "@/components/posts/PostActions";
import { FeedLoader } from "@/components/feed/FeedLoader";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/profiles/FollowButton";

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

export function VideoFeed({ initialTab = "For you" }: { initialTab?: "For you" | "Following" }) {
  const [tab, setTab] = useState<"For you" | "Following">(initialTab);
  const { user, requireAuth } = useAuth();

  const mode = tab === "Following" ? "following" : "for-you";
  const { items, loading, error, hasMore, loadMore, refresh } =
    useFeed(mode);

  function changeTab(nextTab: "For you" | "Following") {
    if (nextTab === "Following" && !user) {
      requireAuth("/following");
      return;
    }

    setTab(nextTab);
  }

  return (
    <section>
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
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 9,
              background: "#67e8b5",
            }}
          />
          {tab === "Following" ? "Posts from people you follow" : "Latest posts"}
        </span>
      </div>

      {error && (
        <div className="content-panel" role="alert">
          <p>We couldn't load your feed.</p>
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
        const creatorName = post.displayName || post.username || "VYBE user";
        const username = post.username || "user";

        return (
          <article className="video-card" key={post.id}>
            <div className="video-frame">
              {media?.url ? (
                media.type === "video" ? (
                  <video
                    key={media.url}
                    src={media.url}
                    poster={media.thumbnailUrl}
                    controls
                    playsInline
                    preload="metadata"
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      background: "#000",
                    }}
                  >
                    Your browser does not support video playback.
                  </video>
                ) : (
                  <img
                    src={media.url}
                    alt={media.altText || post.caption || "VYBE post"}
                    loading="lazy"
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      background: "#000",
                    }}
                  />
                )
              ) : (
                <div
                  className="content-panel"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    minHeight: 260,
                  }}
                >
                  <p className="muted">Media is unavailable for this post.</p>
                </div>
              )}
            </div>

            <div className="video-side">
              <div className="creator-row">
<Avatar name={creatorName} src={post.avatarUrl} />

                <div className="creator-meta">
                  <div className="creator-name">{creatorName}</div>
                  <div className="creator-handle">
                    @{username}
                    {post.createdAt ? ` · ${formatPostDate(post.createdAt)}` : ""}
                  </div>
                </div>

                {user?.username?.toLowerCase() !== username.toLowerCase() && <FollowButton username={username} />}
              </div>

              <h2 className="video-title">{post.caption || "A moment on VYBE"}</h2>

              <div className="video-spacer" />
<PostActions
  postId={post.id}
  likes={post.likeCount}
  comments={post.commentCount}
  shares={0}
  viewerHasLiked={post.viewerHasLiked}
  viewerHasSaved={post.viewerHasSaved}
/>
            </div>
          </article>
        );
      })}

      {!loading && !error && items.length === 0 && (
        <div className="content-panel">
          <h3>{tab === "Following" ? "Your feed is waiting" : "No posts yet"}</h3>
          <p className="muted">
            {tab === "Following"
              ? "Follow creators to see their posts here."
              : "Be among the first to share a moment on VYBE."}
          </p>
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="feed-skeleton-list" role="status" aria-label="Loading posts">
          {Array.from({ length: 2 }, (_, index) => <div className="post-skeleton" key={index}><div className="skeleton skeleton-media" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /></div>)}
        </div>
      )}
      {loading && items.length > 0 && <p className="footer-note" role="status">Loading more posts…</p>}

      {!loading && hasMore && items.length > 0 && (
        <FeedLoader loading={loading} onLoadMore={() => void loadMore()} />
      )}
    </section>
  );
}
