"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, RefreshCw } from "lucide-react";
import { savedApi } from "@/services/saved-api";
import { PostCard } from "@/components/posts/PostCard";
import { useAuth } from "@/hooks/useAuth";
import type { Post } from "@/types/post";

export default function SavedPage() {
  const { user, loading: authLoading, requireAuth } = useAuth();

  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await savedApi.list();
      setItems(result.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn&apos;t load saved posts."
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

  if (authLoading || loading) {
    return (
      <div className="page-wrap">
        <h1 className="page-title">Saved moments</h1>

        <div className="feed-skeleton-list">
          <div className="skeleton skeleton-media" />
          <div className="skeleton skeleton-line" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-wrap">
        <h1 className="page-title">Saved moments</h1>

        <section className="empty-state">
          <Bookmark size={30} color="#c4b5fd" />
          <h2>Your collection is private.</h2>
          <p className="muted">
            Sign in to save posts and return to them later.
          </p>

          <button
            type="button"
            className="button button-primary"
            onClick={() => requireAuth("/saved")}
          >
            Sign in
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <p className="eyebrow">KEEP THE GOOD STUFF CLOSE</p>
      <h1 className="page-title">Saved moments</h1>
      <p className="muted">Posts you&apos;ve saved for later.</p>

      {error && (
        <section className="content-panel" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => void load()}
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </section>
      )}

      {!error && items.length === 0 && (
        <section className="empty-state">
          <Bookmark size={30} color="#c4b5fd" />
          <h2>No saved posts yet.</h2>
          <p className="muted">
            Tap the bookmark on a post to keep it here.
          </p>

          <Link href="/" className="button button-primary">
            Explore the feed
          </Link>
        </section>
      )}

      {items.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}