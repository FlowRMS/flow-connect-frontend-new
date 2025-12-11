/**
 * Note Types and Interfaces
 * These types match the GraphQL API schema
 */

// Conversation/Comment type from API
export interface NoteConversation {
  id: string;
  noteId: string;
  content: string;
  createdAt: string;
}

// Note type from API
export interface Note {
  id: string;
  title: string;
  content: string;
  mentions: string;
  tags: string;
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
  createdBy: string;
  createdAt: string;
}

// Input types for mutations
export interface CreateNoteInput {
  title: string;
  content: string;
  mentions?: string;
  tags?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  mentions?: string;
  tags?: string;
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
  createdBy: string;
  createdAt: string;
  conversationCount?: number;
}
