/**
 * Email Ingestion Utility Functions
 */

import type { EmailStatusAPI, ExtractedEntities, FilterStatus } from './types';

/**
 * Get status badge color classes based on API status
 */
export function getStatusColor(status: EmailStatusAPI): string {
  const colors: Record<EmailStatusAPI, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    PROCESSED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Get document type badge color classes
 */
export function getDocumentTypeColor(type: string): string {
  const colors: Record<string, string> = {
    quote: 'bg-blue-100 text-blue-700',
    purchase_order: 'bg-purple-100 text-purple-700',
    invoice: 'bg-yellow-100 text-yellow-700',
    payment_receipt: 'bg-green-100 text-green-700',
    contract: 'bg-indigo-100 text-indigo-700',
    spreadsheet: 'bg-pink-100 text-pink-700',
    other: 'bg-gray-100 text-gray-700',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
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

/**
 * Parse extracted entities JSON string
 * Handles both simple string arrays and complex object arrays
 */
export function parseExtractedEntities(entitiesStr?: string | null): ExtractedEntities {
  if (!entitiesStr) {
    return {};
  }
  try {
    const parsed = JSON.parse(entitiesStr);

    // Convert complex objects to simple string arrays
    const result: ExtractedEntities = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) {
        // If array contains objects, extract display values
        result[key as keyof ExtractedEntities] = value.map(item => {
          if (typeof item === 'string') {
            return item;
          } else if (typeof item === 'object' && item !== null) {
            // Extract a displayable string from object
            return item.name || item.email || item.title || JSON.stringify(item);
          }
          return String(item);
        });
      } else if (typeof value === 'string') {
        result[key as keyof ExtractedEntities] = [value];
      }
    }

    return result;
  } catch {
    return {};
  }
}

/**
 * Map API status to filter status
 */
export function mapStatusToFilter(status: EmailStatusAPI): FilterStatus {
  if (status === 'PROCESSED') {
    return 'Processed';
  }
  // PENDING, PROCESSING, and FAILED all count as "Needs Attention"
  return 'Needs Attention';
}

/**
 * Check if email needs attention based on status
 */
export function emailNeedsAttention(status: EmailStatusAPI): boolean {
  return status !== 'PROCESSED';
}

/**
 * Get display name for email status
 */
export function getStatusDisplayName(status: EmailStatusAPI): string {
  const names: Record<EmailStatusAPI, string> = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    PROCESSED: 'Processed',
    FAILED: 'Failed',
  };
  return names[status] || status;
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get urgency color classes
 */
export function getUrgencyColor(urgency?: string | null): string {
  if (!urgency) return 'bg-gray-100 text-gray-700';

  const colors: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };
  return colors[urgency.toLowerCase()] || 'bg-gray-100 text-gray-700';
}

/**
 * Get sentiment color classes
 */
export function getSentimentColor(sentiment?: string | null): string {
  if (!sentiment) return 'bg-gray-100 text-gray-700';

  const colors: Record<string, string> = {
    positive: 'bg-green-100 text-green-700',
    neutral: 'bg-gray-100 text-gray-700',
    negative: 'bg-red-100 text-red-700',
  };
  return colors[sentiment.toLowerCase()] || 'bg-gray-100 text-gray-700';
}

/**
 * Strip HTML tags and decode HTML entities from email body
 * Returns clean, readable text
 */
export function cleanEmailBody(html?: string | null): string {
  if (!html) return '';

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Convert Windows line breaks to Unix
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  return text;
}
