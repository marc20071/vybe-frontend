import { apiRequest } from "@/services/api-client";
import type { Post } from "@/types/post";
import type { User } from "@/types/user";
export const searchApi={search:(q:string)=>apiRequest<{users:User[];posts:Post[];hashtags:string[]}>(`/search?q=${encodeURIComponent(q)}`)};
