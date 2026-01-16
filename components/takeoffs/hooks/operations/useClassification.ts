/**
 * Classification operations hook
 * Handles document classification state and operations
 */

import { useState, useCallback } from 'react';
import type { TakeoffDocument, DocumentClassification, DocumentDiscipline } from '../../types';
import { classifyDocument as classifyDocumentLocal } from '../../utils';
import { updateTakeoffDocument } from '../../../lib/graphql/takeoffs';
import type { ProcessingState } from '../types';

interface UseClassificationProps {
  documents: TakeoffDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<TakeoffDocument[]>>;
}

export function useClassification({ documents, setDocuments }: UseClassificationProps) {
  const [classificationState, setClassificationState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });

  // Classify a single document
  const handleClassifyDocument = useCallback(async (
    docId: string,
    classification: DocumentClassification
  ) => {
    // Update local state immediately for responsive UI
    setDocuments(docs => classifyDocumentLocal(docs, docId, classification));

    // Persist to backend
    try {
      await updateTakeoffDocument(docId, {
        classification: classification || null,
      });
    } catch (error) {
      console.error('[Classification] Backend update failed:', error);
    }
  }, [setDocuments]);

  // Bulk classify documents (used by auto-classification)
  const handleBulkClassifyDocuments = useCallback(async (
    classifications: Record<string, DocumentClassification>
  ) => {
    // Update all documents in a single state update
    setDocuments(docs => docs.map(doc => {
      if (classifications[doc.id]) {
        return { ...doc, classification: classifications[doc.id] };
      }
      return doc;
    }));

    // Persist each to backend (in parallel)
    const persistPromises = Object.entries(classifications).map(async ([docId, classification]) => {
      try {
        await updateTakeoffDocument(docId, { classification: classification || null });
      } catch (error) {
        console.error(`[Classification] Backend update failed for ${docId}:`, error);
      }
    });

    await Promise.all(persistPromises);
  }, [setDocuments]);

  // Change document discipline
  const handleChangeDiscipline = useCallback(async (
    docId: string,
    discipline: DocumentDiscipline
  ) => {
    // Update local state immediately
    setDocuments(docs => docs.map(d => d.id === docId ? { ...d, discipline } : d));

    // Persist to backend
    try {
      await updateTakeoffDocument(docId, { discipline: discipline || null });
    } catch (error) {
      console.error('Failed to persist discipline:', error);
    }
  }, [setDocuments]);

  return {
    classificationState,
    setClassificationState,
    handleClassifyDocument,
    handleBulkClassifyDocuments,
    handleChangeDiscipline,
  };
}
