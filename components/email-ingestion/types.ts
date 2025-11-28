/**
 * Email Ingestion Types and Interfaces
 */

// Document types that can be detected in emails
export type DocumentType = 'Quote' | 'Order' | 'Invoice' | 'Check';

// Email processing status
export type EmailStatus = 'Processed' | 'Needs Attention';

// View mode for displaying emails
export type ViewMode = 'card' | 'spreadsheet';

// Email connections to other entities
export interface EmailConnections {
  contacts?: string[];
  companies?: string[];
  jobs?: string[];
  preOpportunities?: string[];
}

// Main Email entity
export interface Email {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  preview: string;
  date: string;
  status: EmailStatus;
  documentTypes: DocumentType[];
  connections: EmailConnections;
  suggestedTasks: string[];
}

// Filter status type
export type FilterStatus = 'All' | 'Processed' | 'Needs Attention';
