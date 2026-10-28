import { apiRequest } from "@/services/api-client";
export type FollowStatus = { following: boolean; followerCount: number; isPrivate?: boolean; requestPending?: boolean };
export const followsApi = {
  follow: (username: string) => apiRequest<{ requestPending?: boolean; following?: boolean }>(`/users/${encodeURIComponent(username)}/follow`, { method: "PUT" }),
  unfollow: (username: string) => apiRequest<{ following?: boolean }>(`/users/${encodeURIComponent(username)}/follow`, { method: "DELETE" }),
  status: (username: string) => apiRequest<FollowStatus>(`/users/${encodeURIComponent(username)}/follow-status`),
};
