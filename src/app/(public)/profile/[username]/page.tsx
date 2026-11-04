
import type { Metadata } from "next";
import { ProfileHeader } from "@/components/profiles/ProfileHeader";
import { SuggestedAccounts } from "@/components/layout/SuggestedAccounts";

export const metadata: Metadata = {
  title: "Creator profile",
  description: "View creator profiles, posts, and followers on VYBE.",
};

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function ProfilePage({
  params,
}: ProfilePageProps) {
  const { username } = await params;

  return (
    <div className="page-wrap profile-page-layout">
      <main
        className="profile-main-column"
        aria-label={`${username}'s profile`}
      >
        <ProfileHeader username={username} />
      </main>

      <aside
        className="profile-right-column"
        aria-label="Suggested accounts"
      >
        <SuggestedAccounts creators={[]} />
      </aside>
    </div>
  );
}
