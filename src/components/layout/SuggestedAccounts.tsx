
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Users, ArrowRight } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/profiles/FollowButton";

export type SuggestedCreator = {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
};

export function SuggestedAccounts({
  creators,
}: {
  creators: SuggestedCreator[];
}) {
  const { user } = useAuth();

  const visibleCreators = useMemo(() => {
    const currentUsername = user?.username?.toLowerCase();

    const uniqueCreators = creators.filter(
      (creator, index, all) =>
        Boolean(creator.username?.trim()) &&
        creator.username.toLowerCase() !== currentUsername &&
        all.findIndex(
          (item) =>
            item.username.toLowerCase() ===
            creator.username.toLowerCase()
        ) === index
    );

    return uniqueCreators.slice(0, 6);
  }, [creators, user?.username]);

  return (
    <aside className="suggested-accounts">
      <div className="suggested-heading">
        <div className="suggested-heading-title">
          <h3>Discover creators</h3>
          <span>People you may like</span>
        </div>

        <Link
          href="/explore"
          className="suggested-see-all"
          aria-label="Explore all creators"
        >
          See all
        </Link>
      </div>

      {visibleCreators.length > 0 ? (
        <div className="suggested-list">
          {visibleCreators.map((creator) => {
            const displayName =
              creator.displayName?.trim() || creator.username;

            return (
              <div
                className="suggested-account"
                key={creator.username.toLowerCase()}
              >
                <Link
                  href={`/profile/${encodeURIComponent(
                    creator.username
                  )}`}
                  className="suggested-account-profile"
                >
                  <Avatar
                    name={displayName}
                    src={creator.avatarUrl || null}
                    size={40}
                  />

                  <span className="suggested-account-info">
                    <strong title={displayName}>
                      {displayName}
                    </strong>

                    <small>@{creator.username}</small>
                  </span>
                </Link>

                <FollowButton username={creator.username} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="suggested-empty">
          <Users size={23} />

          <strong>Discover new creators</strong>

          <p>
            More people will appear here as creators and posts become
            available.
          </p>

          <Link href="/explore">
            Explore creators
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="suggested-footer">
        <Link href="/explore">
          Explore more people on VYBE
          <ArrowRight size={14} />
        </Link>
      </div>
    </aside>
  );
}
