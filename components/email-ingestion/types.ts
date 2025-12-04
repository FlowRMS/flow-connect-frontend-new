/**
 * Email Ingestion Types and Interfaces
 */

// Email processing status from API
export type EmailStatusAPI = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

// UI-friendly email status
export type EmailStatus = 'Processed' | 'Needs Attention';

// Document type for attachments
export type DocumentType = 'Quote' | 'Order' | 'Invoice' | 'Check';

// View mode for displaying emails
export type ViewMode = 'card' | 'spreadsheet';

// Filter status type
export type FilterStatus = 'All' | 'Processed' | 'Needs Attention';

// Email attachment from API
export interface EmailAttachment {
  id: string;
  emailId: string;
  name: string;
  contentType: string;
  size: number;
  s3Key: string;
  createdAt: string;
  documentType?: string | null;
  documentDescription?: string | null;
  classificationConfidence?: number | null;
  extractedMetadata?: string | null;
}

// Parsed extracted entities
export interface ExtractedEntities {
  jobs?: string[];
  dates?: string[];
  amounts?: string[];
  contacts?: string[];
  products?: string[];
  companies?: string[];
  reference_numbers?: string[];
}

// Main Email entity from API
export interface Email {
  id: string;
  externalId: string;
  conversationId: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  status: EmailStatusAPI;
  userId?: string | null;
  createdAt: string;
  // AI-processed fields
  summary?: string | null;
  category?: string | null;
  sentiment?: string | null;
  urgency?: string | null;
  requiresResponse?: boolean | null;
  classificationConfidence?: number | null;
  extractedEntities?: string | null;
  suggestedActions?: string[] | null;
  // Attachments
  attachments?: EmailAttachment[];
}

// Mock/UI Email entity for development/display
export interface MockEmail {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  preview: string;
  date: string;
  status: EmailStatus;
  documentTypes: DocumentType[];
  connections: {
    contacts?: string[];
    companies?: string[];
    jobs?: string[];
    preOpportunities?: string[];
  };
  suggestedTasks: string[];
}
