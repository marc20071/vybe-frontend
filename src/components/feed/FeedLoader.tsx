"use client";

import { LoaderCircle, ArrowDown } from "lucide-react";

export function FeedLoader({ onLoadMore, loading = false }: { onLoadMore: () => void; loading?: boolean }) {
  return (
    <div style={{ display: "grid", placeItems: "center", padding: "10px 0 24px" }}>
      <button type="button" className="button button-secondary" onClick={onLoadMore} disabled={loading}>
        {loading ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowDown size={15} />}
        {loading ? "Loading…" : "Load more moments"}
      </button>
    </div>
  );
}
