import { apiRequest } from "@/services/api-client";
import type { Post } from "@/types/post";
export const savedApi = { list: () => apiRequest<{ items: Post[] }>("/posts/saved") };
