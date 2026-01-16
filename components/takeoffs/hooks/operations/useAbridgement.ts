/**
 * Abridgement operations hook
 * Handles document abridgement state and operations
 */

import { useState, useCallback, useRef } from 'react';
import type { Takeoff, TakeoffDocument } from '../../types';
import { statusApiMap } from '../../types';
import {
  abridgeDocument as abridgeDocumentAPI,
  updateTakeoff as apiUpdateTakeoff,
  updateTakeoffDocument,
  type UpdateTakeoffDocumentInput,
  type TakeoffStatusEnum,
  type AbridgementResult,
} from '../../../lib/graphql/takeoffs';
import type { ProcessingState, DocumentProgress } from '../types';

interface UseAbridgementProps {
  documents: TakeoffDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<TakeoffDocument[]>>;
  selectedTakeoff: Takeoff | null;
  setSelectedTakeoff: React.Dispatch<React.SetStateAction<Takeoff | null>>;
  setTakeoffsData: React.Dispatch<React.SetStateAction<Takeoff[]>>;
}

// Per-document state for single doc operations (used by ClassificationTab for Retry button)
export interface DocumentAbridgeState {
  isProcessing: boolean;
  error?: string;
}

export function useAbridgement({
  documents,
  setDocuments,
  selectedTakeoff,
  setSelectedTakeoff,
  setTakeoffsData,
}: UseAbridgementProps) {
  // Use refs to always have the latest values in callbacks
  // This avoids stale closure issues when retrying after partial failures
  // Update synchronously on every render (not in useEffect) to ensure immediate availability
  const selectedTakeoffRef = useRef<Takeoff | null>(selectedTakeoff);
  selectedTakeoffRef.current = selectedTakeoff;

  const documentsRef = useRef<TakeoffDocument[]>(documents);
  documentsRef.current = documents;

  const [abridgementState, setAbridgementState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });

  const [documentAbridgementProgress, setDocumentAbridgementProgress] = useState<
    Record<string, DocumentProgress>
  >({});

  // State for individual document abridge operations (tracks per-doc isProcessing and error for Retry button)
  const [documentAbridgeState, setDocumentAbridgeState] = useState<
    Record<string, DocumentAbridgeState>
  >({});

  // Helper to add a log message to a document's progress
  const addDocumentLog = useCallback((docId: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setDocumentAbridgementProgress(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        logs: [...(prev[docId]?.logs || []), `[${timestamp}] ${message}`],
      },
    }));
  }, []);

  // Update takeoff status helper - uses ref to always get latest takeoff
  const updateTakeoffStatus = useCallback(async (status: TakeoffStatusEnum, displayStatus: Takeoff['status']) => {
    const currentTakeoff = selectedTakeoffRef.current;
    if (!currentTakeoff) {
      console.warn('[Abridgement] Cannot update status: no takeoff selected');
      return;
    }
    // Skip if already at target status or Complete
    if (currentTakeoff.status === displayStatus) {
      return; // Already at this status
    }
    if (currentTakeoff.status === 'Complete') {
      console.warn('[Abridgement] Cannot update status: takeoff is Complete');
      return;
    }
    try {
      await apiUpdateTakeoff(currentTakeoff.id, { status });
      setTakeoffsData(prev =>
        prev.map(t => t.id === currentTakeoff.id ? { ...t, status: displayStatus } : t)
      );
      setSelectedTakeoff(prev => prev ? { ...prev, status: displayStatus } : null);
      // Update ref immediately so subsequent calls have fresh data
      if (selectedTakeoffRef.current) {
        selectedTakeoffRef.current = { ...selectedTakeoffRef.current, status: displayStatus };
      }
    } catch (error) {
      console.error('[Abridgement] Failed to update takeoff status:', error);
    }
  }, [setTakeoffsData, setSelectedTakeoff]);

  // Abridge a single document using AI with retry logic
  const handleAbridgeDocument = useCallback(async (docId: string) => {
    // Use ref to get latest documents (avoids stale closure in Flow 2: open existing takeoff)
    const currentDocs = documentsRef.current;
    const doc = currentDocs.find(d => d.id === docId);
    if (!doc || !doc.documentUrl) {
      console.error('Document not found or has no URL');
      return;
    }

    // Check BEFORE processing if this is the last doc that needs abridging
    // Use ref to ensure we have latest documents state
    const otherDocsNeedingAbridge = currentDocs.filter(d =>
      d.id !== docId && d.documentUrl && !d.abridged
    );
    const willBeLastDoc = otherDocsNeedingAbridge.length === 0;

    // Set per-document state (clears any previous error)
    setDocumentAbridgeState(prev => ({
      ...prev,
      [docId]: { isProcessing: true, error: undefined },
    }));
    setAbridgementState({ isProcessing: true, progress: 0, currentItem: doc.name });

    const MAX_RETRIES = 3;
    let result: AbridgementResult | null = null;
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await abridgeDocumentAPI(
          doc.documentUrl,
          doc.name,
          ['Extract relevant product and fixture information', 'Keep pages with specifications and schedules']
        );
        if (result) break;
      } catch (apiError) {
        const errorMsg = apiError instanceof Error ? apiError.message : 'API error';
        lastError = errorMsg;
        console.error(`[Abridge] Attempt ${attempt}/${MAX_RETRIES} failed:`, errorMsg);
        if (attempt < MAX_RETRIES) {
          const waitTime = attempt * 5000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // Handle result
    if (result?.success) {
      const actualPages = result.originalPages || doc.pages;
      const effectiveAbridgedUrl = result.wasAbridged ? result.abridgedUrl : undefined;

      setDocuments(docs =>
        docs.map(d =>
          d.id === docId
            ? {
                ...d,
                pages: actualPages,
                abridged: true,
                abridgedPages: result!.abridgedPages || actualPages,
                reductionPercentage: result!.reductionPercentage || 0,
                abridgedUrl: effectiveAbridgedUrl || undefined,
                pageAnalyses: result!.pageAnalyses || undefined,
              }
            : d
        )
      );

      await updateTakeoffDocument(docId, {
        pages: actualPages,
        abridged: true,
        abridgedPages: result.abridgedPages || actualPages,
        abridgedUrl: effectiveAbridgedUrl || null,
        reductionPercentage: result.reductionPercentage,
        pageAnalyses: result.pageAnalyses as unknown as UpdateTakeoffDocumentInput['pageAnalyses'],
      });

      // Clear per-document state on success
      setDocumentAbridgeState(prev => ({
        ...prev,
        [docId]: { isProcessing: false, error: undefined },
      }));

      // Update documentsRef immediately so willBeLastDoc calculation is accurate for next retry
      documentsRef.current = documentsRef.current.map(d =>
        d.id === docId ? { ...d, abridged: true } : d
      );

      // Update takeoff status if this was the last document needing abridging
      // The 'Complete' check is handled inside updateTakeoffStatus
      if (willBeLastDoc) {
        await updateTakeoffStatus('ABRIDGMENT', 'Abridgment');
      }
    } else {
      // Set error for Retry button
      const errorMsg = result?.error || lastError || 'Abridgement failed after retries';
      setDocumentAbridgeState(prev => ({
        ...prev,
        [docId]: { isProcessing: false, error: errorMsg },
      }));
      setAbridgementState(prev => ({ ...prev, error: errorMsg }));
    }

    setAbridgementState({ isProcessing: false, progress: 100 });
  }, [setDocuments, updateTakeoffStatus]);

  // Abridge all documents
  const handleAbridgeAll = useCallback(async () => {
    // Use ref to get latest documents (avoids stale closure in Flow 2: open existing takeoff)
    const currentDocs = documentsRef.current;
    // Only check d.abridged, not abridgedUrl (docs with 0% reduction have no URL but are still processed)
    const docsToAbridge = currentDocs.filter(d =>
      d.documentUrl && !d.abridged
    );

    if (docsToAbridge.length === 0) return;

    await updateTakeoffStatus('ABRIDGMENT', 'Abridgment');
    setAbridgementState({ isProcessing: true, progress: 0 });

    // Initialize per-document progress
    const initialProgress: Record<string, DocumentProgress> = {};
    docsToAbridge.forEach(doc => {
      initialProgress[doc.id] = { progress: 0, status: 'pending', logs: [] };
    });
    setDocumentAbridgementProgress(initialProgress);

    for (let i = 0; i < docsToAbridge.length; i++) {
      const doc = docsToAbridge[i];

      setAbridgementState(prev => ({
        ...prev,
        progress: Math.round((i / docsToAbridge.length) * 100),
        currentItem: doc.name,
      }));

      setDocumentAbridgementProgress(prev => ({
        ...prev,
        [doc.id]: { progress: 10, status: 'processing', logs: [] },
      }));
      addDocumentLog(doc.id, '🔄 Starting SMART abridgment...');

      try {
        const result = await abridgeDocumentWithRetry(doc, addDocumentLog, setDocumentAbridgementProgress);

        if (result.success) {
          const actualPages = result.originalPages || doc.pages;
          const abridgedPages = result.abridgedPages || actualPages;
          const effectiveAbridgedUrl = result.wasAbridged ? result.abridgedUrl : undefined;

          setDocuments(docs =>
            docs.map(d =>
              d.id === doc.id
                ? {
                    ...d,
                    pages: actualPages,
                    abridged: true,
                    abridgedPages,
                    reductionPercentage: result.reductionPercentage || 0,
                    abridgedUrl: effectiveAbridgedUrl || undefined,
                    pageAnalyses: result.pageAnalyses || undefined,
                  }
                : d
            )
          );

          await updateTakeoffDocument(doc.id, {
            pages: actualPages,
            abridged: true,
            abridgedPages,
            abridgedUrl: effectiveAbridgedUrl || null,
            reductionPercentage: result.reductionPercentage,
            pageAnalyses: result.pageAnalyses as unknown as UpdateTakeoffDocumentInput['pageAnalyses'],
          });

          addDocumentLog(doc.id, '✅ Smart abridgment complete!');
          setDocumentAbridgementProgress(prev => ({
            ...prev,
            [doc.id]: { ...prev[doc.id], progress: 100, status: 'complete' },
          }));
        } else {
          const errorMsg = result.error || 'Abridgement failed';
          addDocumentLog(doc.id, `❌ Error: ${errorMsg}`);
          setDocumentAbridgementProgress(prev => ({
            ...prev,
            [doc.id]: { ...prev[doc.id], progress: 0, status: 'error', error: errorMsg },
          }));
        }
      } catch (error) {
        console.error(`Failed to abridge ${doc.name}:`, error);
        addDocumentLog(doc.id, `❌ Error: ${error instanceof Error ? error.message : 'Failed'}`);
        setDocumentAbridgementProgress(prev => ({
          ...prev,
          [doc.id]: { ...prev[doc.id], progress: 0, status: 'error', error: String(error) },
        }));
      }

      // Delay between documents
      if (i < docsToAbridge.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    setAbridgementState({ isProcessing: false, progress: 100 });
  }, [addDocumentLog, updateTakeoffStatus, setDocuments]);

  return {
    abridgementState,
    setAbridgementState,
    documentAbridgementProgress,
    setDocumentAbridgementProgress,
    documentAbridgeState,
    setDocumentAbridgeState,
    handleAbridgeDocument,
    handleAbridgeAll,
    addDocumentLog,
  };
}

// Helper function for retry logic
async function abridgeDocumentWithRetry(
  doc: TakeoffDocument,
  addDocumentLog: (docId: string, message: string) => void,
  setDocumentAbridgementProgress: React.Dispatch<React.SetStateAction<Record<string, DocumentProgress>>>
): Promise<AbridgementResult> {
  const MAX_RETRIES = 3;
  let result: AbridgementResult | null = null;
  let lastError: unknown = null;

  addDocumentLog(doc.id, '⬇️ Downloading PDF from storage...');
  setDocumentAbridgementProgress(prev => ({
    ...prev,
    [doc.id]: { ...prev[doc.id], progress: 20 },
  }));

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      result = await abridgeDocumentAPI(
        doc.documentUrl!,
        doc.name,
        ['Extract relevant product and fixture information', 'Keep pages with specifications and schedules']
      );
      if (result) break;
    } catch (apiError) {
      lastError = apiError;
      if (attempt < MAX_RETRIES) {
        const waitTime = attempt * 5000;
        addDocumentLog(doc.id, `⏳ API busy, retrying in ${waitTime / 1000}s... (attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  if (!result && lastError) throw lastError;
  if (!result) {
    return {
      success: false,
      error: 'API unavailable after retries',
      abridgedUrl: null,
      originalPages: null,
      abridgedPages: null,
      reductionPercentage: null,
      pageAnalyses: null,
      wasAbridged: false,
    };
  }

  return result;
}
