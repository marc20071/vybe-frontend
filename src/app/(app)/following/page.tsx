"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { VideoFeed } from "@/components/feed/VideoFeed";
export default function FollowingPage() {
  const { user, loading, requireAuth } = useAuth();
  if (loading) return <div className="page-wrap"><h1 className="page-title">Following</h1><div className="skeleton skeleton-media" /></div>;
  if (!user) return <div className="page-wrap"><p className="eyebrow">YOUR PEOPLE, YOUR PACE</p><h1 className="page-title">Following</h1><section className="empty-state"><h2>Sign in to see your circle.</h2><p className="muted">Follow creators and their public posts will appear here.</p><button type="button" className="button button-primary" onClick={() => requireAuth("/following")}>Sign in to continue</button><Link href="/explore" className="button button-secondary">Find creators</Link></section></div>;
  return <div className="page-wrap"><p className="eyebrow">YOUR PEOPLE, YOUR PACE</p><h1 className="page-title">Following</h1><p className="muted">The latest public posts from creators you follow.</p><VideoFeed initialTab="Following" /></div>;
}
