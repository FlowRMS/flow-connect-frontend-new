/**
 * Take-Off Utility Functions
 */

import { STATUS_COLORS, DEFAULT_STATUS_COLOR, ABRIDGMENT_REDUCTION_FACTOR, ABRIDGMENT_PAGE_THRESHOLD } from './constants';
import type { TakeoffStatus, TakeoffDocument, ParsedItem, DocumentClassification, DocumentCategory } from './types';

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
 * Abridge all eligible documents
 */
export function abridgeAllDocuments(docs: TakeoffDocument[]): TakeoffDocument[] {
  return docs.map(doc => abridgeDocument(doc));
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
 * Generate a random crossed part number
 */
export function generateCrossedPartNumber(): string {
  return `OC-${Math.floor(Math.random() * 90000) + 10000}`;
}

/**
 * Cross a single item
 */
export function crossItem(item: ParsedItem): ParsedItem {
  if (item.isOurManufacturer) return item;
  
  return {
    ...item,
    isCrossed: true,
    crossedManufacturer: 'Our Company',
    crossedPartNumber: generateCrossedPartNumber(),
    crossedDescription: item.description + ' (Crossed)',
  };
}

/**
 * Cross multiple items by IDs
 */
export function crossItems(items: ParsedItem[], itemIds: Set<string>): ParsedItem[] {
  return items.map(item => 
    itemIds.has(item.id) && !item.isOurManufacturer ? crossItem(item) : item
  );
}

/**
 * Cross all competitor items
 */
export function crossAllItems(items: ParsedItem[]): ParsedItem[] {
  return items.map(item => 
    !item.isOurManufacturer ? crossItem(item) : item
  );
}

/**
 * Get items that can be selected for crossing
 */
export function getSelectableItems(items: ParsedItem[]): ParsedItem[] {
  return items.filter(item => !item.isOurManufacturer && !item.isCrossed);
}

/**
 * Count documents by classification
 */
export function countDocumentsByClassification(docs: TakeoffDocument[]): DocumentCategory[] {
  const counts: Record<DocumentClassification, number> = {
    'Fixture Schedules': 0,
    'Specifications': 0,
    'Blueprints': 0,
    'Other Docs': 0,
    'Irrelevant': 0,
    '': 0,
  };

  docs.forEach(doc => {
    if (doc.classification) {
      counts[doc.classification]++;
    }
  });

  return [
    { id: 'Fixture Schedules', label: 'Fixture Schedules', count: counts['Fixture Schedules'] },
    { id: 'Specifications', label: 'Specifications', count: counts['Specifications'] },
    { id: 'Blueprints', label: 'Blueprints', count: counts['Blueprints'] },
    { id: 'Other Docs', label: 'Other Docs', count: counts['Other Docs'] },
    { id: 'Irrelevant', label: 'Irrelevant', count: counts['Irrelevant'] },
  ];
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

/**
 * Get document counts by category (for list view badges)
 */
export function getDocumentCountsByCategory(docs: TakeoffDocument[]): {
  fixtureSchedules: number;
  specifications: number;
  blueprints: number;
  otherDocs: number;
  irrelevant: number;
} {
  const counts = {
    fixtureSchedules: 0,
    specifications: 0,
    blueprints: 0,
    otherDocs: 0,
    irrelevant: 0,
  };

  docs.forEach(doc => {
    switch (doc.classification) {
      case 'Fixture Schedules':
        counts.fixtureSchedules++;
        break;
      case 'Specifications':
        counts.specifications++;
        break;
      case 'Blueprints':
        counts.blueprints++;
        break;
      case 'Other Docs':
        counts.otherDocs++;
        break;
      case 'Irrelevant':
        counts.irrelevant++;
        break;
    }
  });

  return counts;
}

/**
 * Create a new takeoff from upload
 */
export function createNewTakeoff(title: string = 'New Takeoff Project'): import('./types').Takeoff {
  return {
    id: 'TO-NEW',
    title,
    source: 'Manual Upload',
    createdBy: 'Current User',
    createdDate: new Date().toISOString().split('T')[0],
    status: 'Classification',
  };
}
