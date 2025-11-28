/**
 * Email Ingestion Utility Functions
 */

import { STATUS_COLORS, DOCUMENT_TYPE_COLORS } from './constants';
import type { DocumentType, EmailStatus } from './types';

/**
 * Get status badge color classes
 */
export function getStatusColor(status: EmailStatus): string {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Get document type badge color classes
 */
export function getDocumentTypeColor(type: DocumentType): string {
  return DOCUMENT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-700';
}

/**
 * Format date string to short format (MM/DD/YYYY)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format date string to long format with time
 */
export function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
