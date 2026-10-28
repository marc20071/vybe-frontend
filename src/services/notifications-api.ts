import { apiRequest } from "@/services/api-client";
export type Notification={id:string;type:string;actorUsername:string;message:string;createdAt:string;readAt:string|null};
export const notificationsApi={list:()=>apiRequest<{items:Notification[]}>("/notifications"),markRead:(id:string)=>apiRequest<void>(`/notifications/${encodeURIComponent(id)}/read`,{method:"PUT"}),clear:()=>apiRequest<void>("/notifications",{method:"DELETE"})};
