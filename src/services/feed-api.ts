import { apiRequest } from "@/services/api-client";
import type { Post,PaginatedResponse } from "@/types/post";
export const feedApi={forYou:(cursor?:string)=>apiRequest<PaginatedResponse<Post>>(`/feed${cursor?`?cursor=${encodeURIComponent(cursor)}`:""}`),following:(cursor?:string)=>apiRequest<PaginatedResponse<Post>>(`/feed/following${cursor?`?cursor=${encodeURIComponent(cursor)}`:""}`)};
