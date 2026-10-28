import { apiRequest } from "@/services/api-client";
export type Comment={id:string;postId:string;userId:string;username:string;body:string;createdAt:string};
export const commentsApi={list:(postId:string,cursor?:string)=>apiRequest<{items:Comment[];nextCursor:string|null}>(`/posts/${encodeURIComponent(postId)}/comments${cursor?`?cursor=${encodeURIComponent(cursor)}`:""}`),create:(postId:string,body:string)=>apiRequest<{comment:Comment}>(`/posts/${encodeURIComponent(postId)}/comments`,{method:"POST",json:{body}})};
