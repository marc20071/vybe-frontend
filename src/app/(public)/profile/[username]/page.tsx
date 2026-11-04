
import type { Metadata } from "next";
import { ProfileHeader } from "@/components/profiles/ProfileHeader";
import { SuggestedAccounts } from "@/components/layout/SuggestedAccounts";

export const metadata: Metadata = {
  title: "Creator profile",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <div className="page-wrap profile-page-layout">
      <main className="profile-main-column">
        <ProfileHeader username={username} />
      </main>

      <aside
        className="profile-right-column"
        aria-label="Suggested accounts"
      >
        <SuggestedAccounts creators={[]} />
      </aside>

      <style jsx global>{`
        .profile-page-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          align-items: start;
          gap: 24px;
          width: 100%;
        }

        .profile-main-column {
          min-width: 0;
        }

        .profile-right-column {
          min-width: 0;
          position: sticky;
          top: 24px;
        }

        @media (max-width: 1050px) {
          .profile-page-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .profile-right-column {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
