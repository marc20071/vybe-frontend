import { apiRequest } from "@/services/api-client";
import type { Post } from "@/types/post";
export const postsApi={get:(id:string)=>apiRequest<{post:Post}>(`/posts/${encodeURIComponent(id)}`),create:(input:{caption:string;mediaId:string;visibility?:"public"|"followers"|"private"})=>apiRequest<{post:Post}>("/posts",{method:"POST",json:input}),remove:(id:string)=>apiRequest<void>(`/posts/${encodeURIComponent(id)}`,{method:"DELETE"})};
