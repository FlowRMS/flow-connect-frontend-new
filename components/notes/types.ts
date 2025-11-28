/**
 * Note Types and Interfaces
 */

// Note type
export interface Note {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdDate: string;
  tags: string[];
  entityType?: string;
  entityName?: string;
  mentions: string[];
  attachments: number;
  comments: number;
}

// Comment type
export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
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
