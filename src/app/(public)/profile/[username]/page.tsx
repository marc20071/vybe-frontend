import type { Metadata } from "next";
import { ProfileHeader } from "@/components/profiles/ProfileHeader";
export const metadata: Metadata = { title: "Creator profile" };
export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <div className="page-wrap"><ProfileHeader username={username} /></div>;
}
