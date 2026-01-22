/**
 * Shared types for takeoffs hooks
 */

import type { ParsedItem, TakeoffDocument } from '../types';

// Processing state for AI operations
export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  currentItem?: string;
  error?: string;
  message?: string;
}

// Upload progress state
export interface FileUploadProgress {
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

// Per-document progress tracking
export interface DocumentProgress {
  progress: number;
  status: 'pending' | 'processing' | 'complete' | 'error';
  error?: string;
  logs: string[];
}

// Item crossing state
export interface ItemCrossingState {
  isProcessing: boolean;
  error?: string;
}

// Cross types
export type CrossType = 'SIMPLE' | 'UPGRADE' | 'VALUE';

// Product alternative from cross
export interface ProductAlternative {
  name: string;
  description: string;
  price?: number | null;
  source?: string | null;
  crossType: CrossType;
  attributes?: Record<string, string>;
  reasoning?: string;
  selected?: boolean;
}

// Product cross result
export interface ProductCrossResult {
  id?: string;
  original: {
    manufacturer: string;
    partNumber: string;
    description: string;
    attributes?: Record<string, string>;
  };
  alternatives: ProductAlternative[];
}

// Helper to safely parse parsedItems which may come as array, JSON string, or null
export function safeParseParsedItems(parsedItems: unknown): ParsedItem[] | undefined {
  if (!parsedItems) return undefined;

  if (Array.isArray(parsedItems)) {
    return parsedItems.map(item => ({
      id: item.id || crypto.randomUUID(),
      manufacturer: item.manufacturer,
      partNumber: item.partNumber,
      description: item.description,
      quantity: item.quantity,
      isOurManufacturer: item.isOurManufacturer || false,
      isCrossed: item.isCrossed || false,
    }));
  }

  if (typeof parsedItems === 'string') {
    try {
      const parsed = JSON.parse(parsedItems);
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          id: item.id || crypto.randomUUID(),
          manufacturer: item.manufacturer,
          partNumber: item.partNumber,
          description: item.description,
          quantity: item.quantity,
          isOurManufacturer: item.isOurManufacturer || false,
          isCrossed: item.isCrossed || false,
        }));
      }
    } catch {
      console.warn('Failed to parse parsedItems string:', parsedItems);
    }
  }

  return undefined;
}

// Shared state interface for the main hook
export interface TakeoffsSharedState {
  documents: TakeoffDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<TakeoffDocument[]>>;
  parsedItems: ParsedItem[];
  setParsedItems: React.Dispatch<React.SetStateAction<ParsedItem[]>>;
  selectedTakeoff: import('../types').Takeoff | null;
  setSelectedTakeoff: React.Dispatch<React.SetStateAction<import('../types').Takeoff | null>>;
  currentUserName: string;
}
