/**
 * Note Types and Interfaces
 * These types match the GraphQL API schema
 */

// Creator info for conversations
export interface ConversationCreatedBy {
  id: string;
  authProviderId?: string;
  email?: string;
  enabled?: boolean;
  firstName?: string;
  fullName?: string;
  inside?: boolean;
  lastName?: string;
  outside?: boolean;
  role?: string;
  username?: string;
}

// Conversation/Comment type from API
export interface NoteConversation {
  id: string;
  noteId: string;
  content: string;
  createdAt: string;
  createdBy?: ConversationCreatedBy;
}

// Note type from API
export interface Note {
  id: string;
  title: string;
  content: string;
  mentions: string | string[]; // API returns array of UUIDs when fetching
  tags: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

// NoteLandingPage type from API (used for listing notes)
export interface NoteLandingPage {
  id: string;
  title: string;
  content: string;
  linkedEntities: Array<{
    entityType: string;
    id: string;
    title: string;
  }>;
  tags: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

// Input types for mutations
export interface CreateNoteInput {
  title: string;
  content: string;
  mentions?: string;
  tags?: string;
  isPublic?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  mentions?: string;
  tags?: string;
  isPublic?: boolean;
}

export interface AddNoteConversationInput {
  noteId: string;
  content: string;
}

export interface UpdateNoteConversationInput {
  noteId: string;
  content: string;
}

// Legacy Comment type for backward compatibility
export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

// Entity link type for linking notes to other entities
export interface EntityLink {
  type: 'COMPANY' | 'CONTACT' | 'JOB' | 'TASK';
  id: string;
  name: string;
}

// View mode type
export type ViewMode = 'grid' | 'list' | 'read';

// Summarize filter options
export interface SummarizeFilters {
  dateRange: 'all' | 'yesterday' | 'last-week' | 'current-year';
  createdBy: string[];
  tags: string[];
  entityTypes: string[];
  summaryType: 'brief' | 'detailed' | 'action-items';
}

// Linked title item parsed from linkedTitles string
export interface LinkedTitle {
  type: string;
  name: string;
}

// Helper type for parsed Note (with arrays instead of comma-separated strings)
export interface ParsedNote {
  id: string;
  title: string;
  content: string;
  mentions: string[];
  tags: string[];
  linkedTitles: LinkedTitle[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  conversationCount?: number;
}
