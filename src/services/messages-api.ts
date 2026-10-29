
import { apiRequest } from "@/services/api-client";

export type MessageReaction = {
  userId: string;
  emoji: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  receipts?: {
    userId: string;
    deliveredAt: string | null;
    readAt: string | null;
  }[];
  messageType?: "text" | "image" | "video" | "file" | "voice" | "system";
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSizeBytes?: number | null;
  attachmentUrl?: string | null;
  deletedForEveryone?: boolean;
  reactions?: MessageReaction[];
};

export type Conversation = {
  id: string;
  kind?: "direct" | "group";
  name?: string | null;
  createdBy?: string | null;
  role?: "admin" | "member";
  memberCount?: number;
  participantId?: string | null;
  title: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  lastMessage?: string;
  lastMessageAt?: string | null;
  unreadCount?: number;
  isRequest?: boolean;
  requestStatus?: "pending" | "accepted" | "declined";
};

export type UploadedAttachment = {
  path: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string | null;
};

export type CallSignal = {
  id: string;
  sender_id: string;
  recipient_id: string;
  call_id: string;
  signal_type: "offer" | "answer" | "ice" | "hangup" | "reject";
  payload: unknown;
  created_at: string;
};

export const messagesApi = {
  conversations: () =>
    apiRequest<{ items: Conversation[] }>("/conversations"),

  createConversation: (username: string) =>
    apiRequest<{ id: string }>("/conversations", {
      method: "POST",
      json: { username },
    }),

  createGroup: (name: string, usernames: string[]) =>
    apiRequest<{ id: string }>("/groups", {
      method: "POST",
      json: { name, usernames },
    }),

  list: (id: string, cursor?: string) =>
    apiRequest<{ items: Message[]; nextCursor: string | null }>(
      `/conversations/${encodeURIComponent(id)}/messages${
        cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""
      }`
    ),

  send: (id: string, body: string) =>
    apiRequest<{ message: Message }>(
      `/conversations/${encodeURIComponent(id)}/messages`,
      {
        method: "POST",
        json: { body },
      }
    ),

  setTyping: (id: string, typing: boolean) =>
    apiRequest<{ typing: boolean }>(
      `/conversations/${encodeURIComponent(id)}/typing`,
      {
        method: "PUT",
        json: { typing },
      }
    ),

  typingStatus: (id: string) =>
    apiRequest<{ typing: boolean }>(
      `/conversations/${encodeURIComponent(id)}/typing`
    ),

  uploadAttachment: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);

    return apiRequest<UploadedAttachment>(
      `/conversations/${encodeURIComponent(id)}/attachments`,
      {
        method: "POST",
        body: form,
      }
    );
  },

  sendAttachment: (
    id: string,
    attachment: UploadedAttachment,
    messageType: "image" | "video" | "file" | "voice",
    body = ""
  ) =>
    apiRequest<{ message: Message }>(
      `/conversations/${encodeURIComponent(id)}/attachments/message`,
      {
        method: "POST",
        json: {
          path: attachment.path,
          name: attachment.name,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          messageType,
          body,
        },
      }
    ),

  react: (id: string, messageId: string, emoji: string) =>
    apiRequest<{ active: boolean }>(
      `/conversations/${encodeURIComponent(id)}/messages/${encodeURIComponent(messageId)}/reactions`,
      {
        method: "POST",
        json: { emoji },
      }
    ),

  unsend: (id: string, messageId: string) =>
    apiRequest<{ deleted: boolean }>(
      `/conversations/${encodeURIComponent(id)}/messages/${encodeURIComponent(messageId)}`,
      {
        method: "DELETE",
      }
    ),

  hideMessage: (id: string, messageId: string) =>
    apiRequest<{ hidden: boolean }>(
      `/conversations/${encodeURIComponent(id)}/messages/${encodeURIComponent(messageId)}/hide`,
      {
        method: "POST",
      }
    ),

  addMember: (id: string, username: string) =>
    apiRequest<{ added: boolean }>(
      `/conversations/${encodeURIComponent(id)}/members`,
      {
        method: "POST",
        json: { username },
      }
    ),

  deleteGroup: (id: string) =>
    apiRequest<{ deleted: boolean }>(
      `/conversations/${encodeURIComponent(id)}/group`,
      {
        method: "DELETE",
      }
    ),

  clearHistory: (id: string) =>
    apiRequest<{ cleared: boolean }>(
      `/conversations/${encodeURIComponent(id)}/clear`,
      {
        method: "POST",
      }
    ),

  leaveGroup: (id: string) =>
    apiRequest<{ left: boolean }>(
      `/conversations/${encodeURIComponent(id)}/leave`,
      {
        method: "POST",
      }
    ),

  sendSignal: (
    id: string,
    input: {
      recipientId: string;
      callId: string;
      signalType: CallSignal["signal_type"];
      payload?: unknown;
    }
  ) =>
    apiRequest<{ sent: boolean }>(
      `/conversations/${encodeURIComponent(id)}/call-signals`,
      {
        method: "POST",
        json: input,
      }
    ),

  receiveSignals: (id: string, after?: string) =>
    apiRequest<{ items: CallSignal[] }>(
      `/conversations/${encodeURIComponent(id)}/call-signals${
        after ? `?after=${encodeURIComponent(after)}` : ""
      }`
    ),
};