export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type MessageType = 'TEXT' | 'TOOL_CALL' | 'TOOL_RESULT';
export type ChatStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

export interface ChatMessage {
  chatId: string;
  content: string;
  createdAt: string;
  documentReferences?: DocumentReference[];
  id: string;
  messageType: MessageType;
  metaData?: string | null;
  role: MessageRole;
  toolArgs?: string | null;
  toolName?: string | null;
}

export interface Chat {
  createdAt: string;
  followUpSuggestions: string[];
  id: string;
  messages?: ChatMessage[];
  sessionId: string;
  status: ChatStatus;
  title: string;
  userId: string;
  folderId?: string | null;
}

export interface ChatFolder {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface DocumentReference {
  contentPreview: string;
  documentId: string;
  fileName: string;
  pageNumber: string;
  similarityScore: number;
}

export interface ChatStreamResponse {
  approvalRequired?: boolean;
  chatId: string;
  followUpSuggestions: string[];
  isFinal: boolean;
  message: string;
  documentReferences?: DocumentReference[];
}




