/**
 * Navigation operations hook
 * Handles takeoff selection, navigation, and CRUD operations
 */

import { useCallback } from 'react';
import type { Takeoff, TakeoffDocument, ParsedItem, TakeoffStep, DocumentClassification } from '../../types';
import {
  fetchTakeoff,
  deleteTakeoff as apiDeleteTakeoff,
} from '../../../lib/graphql/takeoffs';
import { showInfoToast, showSuccessToast, showErrorToast } from '../../../lib/toast';
import { getInitialStep } from '../../utils';
import { safeParseParsedItems } from '../types';

interface UseNavigationProps {
  selectedTakeoff: Takeoff | null;
  setSelectedTakeoff: React.Dispatch<React.SetStateAction<Takeoff | null>>;
  setTakeoffsData: React.Dispatch<React.SetStateAction<Takeoff[]>>;
  setViewMode: React.Dispatch<React.SetStateAction<'list' | 'detail'>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<TakeoffStep>>;
  setDocuments: React.Dispatch<React.SetStateAction<TakeoffDocument[]>>;
  setParsedItems: React.Dispatch<React.SetStateAction<ParsedItem[]>>;
  setSelectedItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  documents: TakeoffDocument[];
  parsedItems: ParsedItem[];
}

export function useNavigation({
  selectedTakeoff,
  setSelectedTakeoff,
  setTakeoffsData,
  setViewMode,
  setCurrentStep,
  setDocuments,
  setParsedItems,
  setSelectedItems,
  documents,
  parsedItems,
}: UseNavigationProps) {
  // Select a takeoff and load its documents
  const handleSelectTakeoff = useCallback(async (takeoff: Takeoff) => {
    // Set initial takeoff from list (may have partial data)
    setSelectedTakeoff(takeoff);
    setViewMode('detail');
    setCurrentStep(getInitialStep(takeoff.status));

    let docs = takeoff.documents || [];
    let fullTakeoffData: Takeoff | null = null;

    // Always fetch full takeoff data to ensure we have latest status and documents
    try {
      const fullTakeoff = await fetchTakeoff(takeoff.id);
      if (fullTakeoff) {
        // Format documents first
        if (fullTakeoff.documents && fullTakeoff.documents.length > 0) {
          docs = fullTakeoff.documents.map(doc => formatDocument(doc));
        }

        // Update selectedTakeoff with FULL data (including latest status)
        // Keep original takeoff fields and override with fresh API data
        fullTakeoffData = {
          ...takeoff,
          status: fullTakeoff.status as Takeoff['status'],
          documents: docs, // Use formatted documents
        };
        setSelectedTakeoff(fullTakeoffData);
        setCurrentStep(getInitialStep(fullTakeoffData.status));
      }
    } catch (error) {
      console.error('[handleSelectTakeoff] Failed to fetch takeoff:', error);
    }

    if (docs.length > 0) {
      setDocuments(docs);
      const allParsedItems: ParsedItem[] = [];
      docs.forEach(doc => {
        if (doc.parsedItems) {
          allParsedItems.push(...doc.parsedItems);
        }
      });
      setParsedItems(allParsedItems);
    } else {
      console.warn('[handleSelectTakeoff] No documents found for takeoff');
      setDocuments([]);
    }
  }, [setSelectedTakeoff, setViewMode, setCurrentStep, setDocuments, setParsedItems]);

  // Go back to list view
  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedTakeoff(null);
    setDocuments([]);
    setParsedItems([]);
    setSelectedItems(new Set());
  }, [setViewMode, setSelectedTakeoff, setDocuments, setParsedItems, setSelectedItems]);

  // Create quote from takeoff
  const handleCreateQuote = useCallback(async () => {
    if (!selectedTakeoff) return;
    showInfoToast('Creating Quote', { description: 'Preparing quote data...' });

    try {
      const quoteData = {
        takeoffId: selectedTakeoff.id,
        title: selectedTakeoff.title,
        metadata: selectedTakeoff.metadata,
        documents: documents.map(d => ({
          id: d.id,
          name: d.name,
          parsedItems: d.parsedItems,
        })),
        parsedItems,
      };

      sessionStorage.setItem('takeoff_quote_data', JSON.stringify(quoteData));
      window.location.href = '/quotes/new?from=takeoff';
    } catch (e) {
      console.error('Failed to store quote data:', e);
    }
  }, [selectedTakeoff, documents, parsedItems]);

  // Delete takeoff
  const handleDeleteTakeoff = useCallback(async (takeoffId: string) => {
    try {
      await apiDeleteTakeoff(takeoffId);
      setTakeoffsData(prev => prev.filter(t => t.id !== takeoffId));
      if (selectedTakeoff?.id === takeoffId) {
        handleBackToList();
      }
      showSuccessToast('Takeoff Deleted');
    } catch (err) {
      console.error('Failed to delete takeoff:', err);
      showErrorToast('Failed to Delete Takeoff', { description: err instanceof Error ? err.message : 'Unknown error' });
    }
  }, [selectedTakeoff, handleBackToList, setTakeoffsData]);

  return {
    handleSelectTakeoff,
    handleBackToList,
    handleCreateQuote,
    handleDeleteTakeoff,
  };
}

// Helper to format document from API response
function formatDocument(doc: {
  id: string;
  name: string;
  fileSize: number;
  createdAt: string;
  classification?: string | null;
  confidence?: number | null;
  pages: number;
  abridged: boolean;
  abridgedPages?: number | null;
  reductionPercentage?: number | null;
  documentUrl?: string | null;
  pageAnalyses?: unknown;
  products?: unknown;
  parsedItems?: unknown;
}): TakeoffDocument {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    id: doc.id,
    name: doc.name,
    type: 'PDF' as const,
    size: formatSize(doc.fileSize),
    uploadDate: doc.createdAt,
    classification: (doc.classification || '') as DocumentClassification,
    confidence: doc.confidence || 0,
    pages: doc.pages,
    abridged: doc.abridged,
    abridgedPages: doc.abridgedPages ?? undefined,
    reductionPercentage: doc.reductionPercentage ?? undefined,
    documentUrl: doc.documentUrl ?? undefined,
    pageAnalyses: doc.pageAnalyses as TakeoffDocument['pageAnalyses'],
    products: doc.products as TakeoffDocument['products'],
    parsedItems: safeParseParsedItems(doc.parsedItems),
  };
}
