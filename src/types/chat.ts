export type Attachment = {
  fileName: string;
  filePath: string;
  fileType?: string;
  fileSize?: number;
};

export type Participant = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export type Conversation = {
  id: string;
  title?: string | null;
  isGroup: boolean;
  participants: Participant[];
  lastMessage?: {
    id: string;
    senderId: string;
    content?: string;
    attachments?: Attachment[];
    createdAt: string;
  } | null;
  lastMessageAt: string;
  unreadCount: number;
  lastReadAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderName?: string;
  senderEmail?: string;
  content?: string;
  attachments: Attachment[];
  createdAt: string;
};
