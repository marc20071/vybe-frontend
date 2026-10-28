"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, RefreshCw, UserRound, Hash } from "lucide-react";
import { searchApi } from "@/services/search-api";
import type { Post } from "@/types/post";
import type { User } from "@/types/user";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/profiles/FollowButton";
import { PostCard } from "@/components/posts/PostCard";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const searchRun = useRef(0);

  async function runSearch(value: string) {
    const requestId = ++searchRun.current;
    const term = value.trim();
    setError(""); setSearched(Boolean(term));
    if (!term) { setUsers([]); setPosts([]); setHashtags([]); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await searchApi.search(term);
      if (requestId === searchRun.current) { setUsers(result.users); setPosts(result.posts); setHashtags(result.hashtags); }
    } catch (err) {
      if (requestId === searchRun.current) setError(err instanceof Error ? err.message : "Search is temporarily unavailable.");
    } finally { if (requestId === searchRun.current) setLoading(false); }
  }

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q") || "";
    if (initial) { setQuery(initial); void runSearch(initial); }
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term) { searchRun.current++; setUsers([]); setPosts([]); setHashtags([]); setSearched(false); setLoading(false); return; }
    const timer = window.setTimeout(() => { void runSearch(term); }, 100);
    return () => window.clearTimeout(timer);
  }, [query]);

  return <div className="page-wrap">
    <p className="eyebrow">THE INTERNET, WITH BETTER VIBES</p>
    <h1 className="page-title">Explore VYBE</h1>
    <p className="muted">Find creators and public posts by username or caption.</p>
    <form className="explore-search" onSubmit={(event) => { event.preventDefault(); void runSearch(query); }}>
      <Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search creators or posts" aria-label="Search creators or posts" maxLength={80}/><button type="submit" className="button button-primary" disabled={loading || !query.trim()}>{loading ? <RefreshCw size={15} className="animate-spin"/> : "Search"}</button>
    </form>
    {loading && <div className="feed-skeleton-list" role="status" aria-label="Searching"><div className="skeleton skeleton-line"/><div className="skeleton skeleton-media"/></div>}
    {error && <section className="content-panel" role="alert"><p>{error}</p><button type="button" className="button button-secondary" onClick={() => void runSearch(query)}><RefreshCw size={15}/> Try again</button></section>}
    {!loading && searched && !error && <>
      {hashtags.length > 0 && <div className="tag-row explore-tags">{hashtags.map((tag) => <button key={tag} type="button" className="tag" onClick={() => { setQuery(tag.slice(1)); void runSearch(tag.slice(1)); }}><Hash size={11} style={{display:"inline",verticalAlign:"middle"}}/> {tag}</button>)}</div>}
      <section className="explore-results-section"><div className="section-heading"><UserRound size={18}/><h2>Creators</h2><span className="muted">{users.length}</span></div>
        {users.length ? <div className="creator-results">{users.map((creator) => <article className="creator-result" key={creator.id}><Link href={`/profile/${creator.username}`} className="creator-result-main"><Avatar name={creator.displayName || creator.username} src={creator.avatarUrl} size={48}/><span><strong>{creator.displayName || creator.username}</strong><span className="muted">@{creator.username}</span><span className="muted" style={{fontSize:12}}>{(creator.followerCount ?? 0).toLocaleString()} followers · {(creator.followingCount ?? 0).toLocaleString()} following · {(creator.postCount ?? 0).toLocaleString()} posts</span>{creator.bio && <span className="creator-result-bio">{creator.bio}</span>}</span></Link><FollowButton username={creator.username}/></article>)}</div> : <p className="muted">No matching creators found.</p>}
      </section>
      <section className="explore-results-section"><div className="section-heading"><Search size={18}/><h2>Posts</h2><span className="muted">{posts.length}</span></div>
        {posts.length ? posts.map((post) => <PostCard key={post.id} post={post}/>) : <p className="muted">No public posts matched that search.</p>}
      </section>
    </>}
    {!loading && !searched && !error && <section className="empty-state explore-empty"><span className="heading-spark" style={{margin:"0 auto 16px"}}><Search size={20}/></span><h2 style={{fontFamily:"Space Grotesk"}}>Follow your curiosity.</h2><p className="muted">Search for a creator's username or a phrase from a public post.</p></section>}
  </div>;
}
