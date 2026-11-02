
"use client";

import Link from "next/link";
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

  const visibleCreators = creators
    .filter(
      (creator, index, all) =>
        creator.username &&
        creator.username.toLowerCase() !== user?.username?.toLowerCase() &&
        all.findIndex(
          (item) =>
            item.username.toLowerCase() === creator.username.toLowerCase()
        ) === index
    )
    .slice(0, 6);

  return (
    <aside className="suggested-accounts">
      <div className="suggested-heading">
        <h3>Discover creators</h3>
        <Link href="/explore">See all</Link>
      </div>

      {visibleCreators.length ? (
        <div className="suggested-list">
          {visibleCreators.map((creator) => (
            <div className="suggested-account" key={creator.username}>
              <Link
                href={`/profile/${creator.username}`}
                className="suggested-account-profile"
              >
                <Avatar
                  name={creator.displayName || creator.username}
                  src={creator.avatarUrl}
                  size={40}
                />
                <span>
                  <strong>{creator.displayName || creator.username}</strong>
                  <small>@{creator.username}</small>
                </span>
              </Link>

              <FollowButton username={creator.username} />
            </div>
          ))}
        </div>
      ) : (
        <p className="muted suggested-empty">
          More creators will appear here as posts load.
        </p>
      )}

      <div className="suggested-footer">
        <Link href="/explore">Explore more people on VYBE</Link>
      </div>
    </aside>
  );
}
