import { apiRequest } from "@/services/api-client";
import type { Post } from "@/types/post";
import type { User } from "@/types/user";

export type Profile = User & { followerCount: number; followingCount: number; postCount: number; isPrivate?:boolean; viewerFollows?:boolean; followRequestPending?:boolean; privateContent?:boolean };
export type PrivacyPreferences = { isPrivate: boolean; messagePrivacy: "everyone" | "followers" | "nobody" };
export const usersApi = {
  followRequests: () => apiRequest<{items:{id:string;username:string;displayName:string;avatarUrl?:string|null;createdAt:string}[]}>("/users/me/follow-requests"),
  respondFollowRequest: (id:string, approve:boolean) => apiRequest<{approved:boolean}>(`/users/me/follow-requests/${encodeURIComponent(id)}/${approve?"approve":"reject"}`,{method:"POST"}),
  preferences: () => apiRequest<PrivacyPreferences>("/users/me/preferences"),
  updatePreferences: (input: Partial<PrivacyPreferences>) => apiRequest<PrivacyPreferences>("/users/me/preferences", { method: "PATCH", json: input }),
  profile: (username: string) => apiRequest<{ user: Profile }>(`/users/${encodeURIComponent(username)}`),
  posts: (username: string) => apiRequest<{ items: Post[] }>(`/users/${encodeURIComponent(username)}/posts`),
  updateProfile: (input: { displayName?: string; bio?: string; avatarMediaId?: string; avatarUrl?: null }) =>
    apiRequest<{ user: User }>("/users/me/profile", { method: "PATCH", json: input }),
  blockedUsers: () => apiRequest<{ items: { userId: string; username: string; displayName: string; avatarUrl?: string | null; blockedAt: string }[] }>("/users/me/blocks"),
  blockUser: (username: string) => apiRequest<{ blocked: boolean; username: string }>(`/users/${encodeURIComponent(username)}/block`, { method: "POST" }),
  unblockUser: (username: string) => apiRequest<{ blocked: boolean; username: string }>(`/users/${encodeURIComponent(username)}/block`, { method: "DELETE" }),
};
