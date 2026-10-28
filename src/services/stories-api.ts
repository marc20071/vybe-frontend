import { apiRequest } from "@/services/api-client";
export type StoryMusic = { provider: string; trackId: string; title: string; artist: string; audioUrl: string; startSeconds?: number; durationSeconds?: number; licenseUrl?: string | null; imageUrl?: string | null };
export type Story = { id: string; userId: string; username: string; displayName: string; avatarUrl?: string | null; type: "text" | "image" | "video"; mediaUrl: string; text: string; textStyle: Record<string, unknown>; music: StoryMusic | null; originalAudioMuted: boolean; musicVolume: number; originalVolume: number; visibility: "public" | "followers" | "private"; likeCount: number; viewerHasLiked: boolean; createdAt: string; expiresAt: string };
export type StoryComment = { id: string; storyId: string; userId: string; username: string; displayName: string; avatarUrl?: string | null; body: string; createdAt: string };
export type MusicTrack = StoryMusic;
export const storiesApi = {
  list: () => apiRequest<{ items: Story[] }>("/stories"),
  create: (input: { type: "text" | "image" | "video"; mediaId?: string; text?: string; textStyle?: Record<string, unknown>; visibility?: "public" | "followers" | "private"; music?: StoryMusic | null; originalAudioMuted?: boolean; musicVolume?: number; originalVolume?: number }) => apiRequest<{ story: Story }>("/stories", { method: "POST", json: input }),
  update: (id: string, input: Partial<{ text: string; textStyle: Record<string, unknown>; visibility: "public" | "followers" | "private"; music: StoryMusic | null; originalAudioMuted: boolean; musicVolume: number; originalVolume: number }>) => apiRequest<{ story: Story }>(`/stories/${encodeURIComponent(id)}`, { method: "PATCH", json: input }),
  remove: (id: string) => apiRequest<void>(`/stories/${encodeURIComponent(id)}`, { method: "DELETE" }),
  view: (id: string) => apiRequest<void>(`/stories/${encodeURIComponent(id)}/views`, { method: "POST" }),
  like: (id: string) => apiRequest<{ liked: boolean; likeCount: number }>(`/stories/${encodeURIComponent(id)}/likes`, { method: "POST" }),
  unlike: (id: string) => apiRequest<{ liked: boolean; likeCount: number }>(`/stories/${encodeURIComponent(id)}/likes`, { method: "DELETE" }),
  comments: (id: string) => apiRequest<{ items: StoryComment[] }>(`/stories/${encodeURIComponent(id)}/comments`),
  comment: (id: string, body: string) => apiRequest<{ comment: StoryComment }>(`/stories/${encodeURIComponent(id)}/comments`, { method: "POST", json: { body } }),
  viewers: (id: string) => apiRequest<{ items: { userId: string; username: string; displayName: string; avatarUrl?: string | null; viewedAt: string }[] }>(`/stories/${encodeURIComponent(id)}/views`),
  searchMusic: (q: string) => apiRequest<{ items: MusicTrack[] }>(`/stories/music/search?q=${encodeURIComponent(q)}`),
};
