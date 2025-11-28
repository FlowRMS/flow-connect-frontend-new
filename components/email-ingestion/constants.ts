/**
 * Email Ingestion Constants and Configuration
 */

import type { DocumentType, EmailStatus } from './types';

// Status badge color mapping
export const STATUS_COLORS: Record<EmailStatus, string> = {
  'Processed': 'bg-green-100 text-green-700',
  'Needs Attention': 'bg-orange-100 text-orange-700',
};

// Document type badge color mapping
export const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  'Quote': 'bg-blue-100 text-blue-700',
  'Order': 'bg-purple-100 text-purple-700',
  'Invoice': 'bg-yellow-100 text-yellow-700',
  'Check': 'bg-green-100 text-green-700',
};

// Entity badge color mapping
export const ENTITY_COLORS = {
  contacts: 'bg-orange-100 text-orange-700',
  companies: 'bg-indigo-100 text-indigo-700',
  jobs: 'bg-green-100 text-green-700',
  preOpportunities: 'bg-pink-100 text-pink-700',
};
