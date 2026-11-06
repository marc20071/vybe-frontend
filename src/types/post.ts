
import type { Media } from "@/types/media";

export type Post = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  caption: string;
  media: Media[];
  likeCount: number;
  commentCount: number;
  viewCount?: number;
  repostCount?: number;
  createdAt: string;
  viewerHasLiked?: boolean;
  viewerHasSaved?: boolean;
  viewerHasViewed?: boolean;
  viewerHasReposted?: boolean;
  visibility: "public" | "followers" | "private";
};

export type PaginatedResponse<T> = {
  items: T[];
  nextCursor: string | null;
};
