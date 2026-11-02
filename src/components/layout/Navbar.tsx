
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, Plus, LogIn } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { BrandMark } from "@/components/ui/BrandMark";

export function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (value) router.push(`/explore?q=${encodeURIComponent(value)}`);
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="VYBE home">
          <BrandMark />
          <span className="brand-word">VYBE</span>
        </Link>

        <form className="search-box" onSubmit={submitSearch}>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people, posts and ideas..."
            aria-label="Search VYBE"
          />
        </form>

        <div className="top-actions">
          <Link
            href="/notifications"
            className="icon-button desktop-action"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={19} />
          </Link>

          {loading ? (
            <Avatar name="Loading profile" loading small />
          ) : user ? (
            <>
              <Link
                href="/upload"
                className="button button-primary desktop-action"
              >
                <Plus size={17} />
                Create
              </Link>
              <Link
                href={`/profile/${user.username}`}
                aria-label="Your profile"
              >
                <Avatar
                  name={user.displayName || user.username}
                  src={user.avatarUrl}
                  small
                />
              </Link>
            </>
          ) : (
            <Link href="/login" className="button button-primary">
              <LogIn size={16} />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
