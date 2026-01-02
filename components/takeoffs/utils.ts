/**
 * Take-Off Utility Functions
 */

import { STATUS_COLORS, DEFAULT_STATUS_COLOR, ABRIDGMENT_REDUCTION_FACTOR, ABRIDGMENT_PAGE_THRESHOLD } from './constants';
import type { TakeoffStatus, TakeoffDocument, ParsedItem, DocumentClassification } from './types';

/**
 * Get status badge color
 */
export function getStatusColor(status: TakeoffStatus): string {
  return STATUS_COLORS[status] || DEFAULT_STATUS_COLOR;
}

/**
 * Calculate abridged page count
 */
export function calculateAbridgedPages(totalPages: number): number {
  return Math.floor(totalPages * ABRIDGMENT_REDUCTION_FACTOR);
}

/**
 * Check if document can be abridged
 */
export function canAbridgeDocument(doc: TakeoffDocument): boolean {
  return doc.pages > ABRIDGMENT_PAGE_THRESHOLD && !doc.abridged;
}

/**
 * Abridge a single document
 */
export function abridgeDocument(doc: TakeoffDocument): TakeoffDocument {
  if (!canAbridgeDocument(doc)) return doc;
  
  return {
    ...doc,
    abridged: true,
    abridgedPages: calculateAbridgedPages(doc.pages),
  };
}

/**
 * Classify a document
 */
export function classifyDocument(
  docs: TakeoffDocument[], 
  docId: string, 
  classification: DocumentClassification
): TakeoffDocument[] {
  return docs.map(doc => 
    doc.id === docId ? { ...doc, classification } : doc
  );
}

/**
 * Get items that can be selected for crossing
 */
export function getSelectableItems(items: ParsedItem[]): ParsedItem[] {
  return items.filter(item => !item.isOurManufacturer && !item.isCrossed);
}

/**
 * Determine the initial step based on takeoff status
 * Maps status to appropriate step in 6-step workflow
 */
export function getInitialStep(status: TakeoffStatus): import('./types').TakeoffStep {
  switch (status) {
    case 'Complete':
      return 'approvals';
    case 'Parsing':
      return 'parsing';
    case 'Abridgment':
      return 'abridgment';
    case 'Classification':
    default:
      return 'review';
  }
}

