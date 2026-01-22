/**
 * Parsing operations hook
 * Handles schedule parsing state and operations
 */

import { useState, useCallback } from 'react';
import type { Takeoff, TakeoffDocument, ParsedItem } from '../../types';
import {
  parseScheduleDocument as parseScheduleDocumentAPI,
  updateTakeoff as apiUpdateTakeoff,
  updateTakeoffDocument,
  type TakeoffStatusEnum,
} from '../../../lib/graphql/takeoffs';
import { takeoffToasts } from '../../../lib/toast';
import type { ProcessingState } from '../types';

interface UseParsingProps {
  documents: TakeoffDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<TakeoffDocument[]>>;
  selectedTakeoff: Takeoff | null;
  setSelectedTakeoff: React.Dispatch<React.SetStateAction<Takeoff | null>>;
  setTakeoffsData: React.Dispatch<React.SetStateAction<Takeoff[]>>;
  setParsedItems: React.Dispatch<React.SetStateAction<ParsedItem[]>>;
}

export function useParsing({
  documents,
  setDocuments,
  selectedTakeoff,
  setSelectedTakeoff,
  setTakeoffsData,
  setParsedItems,
}: UseParsingProps) {
  const [parsingState, setParsingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });

  // Parse schedule documents to extract product items
  const handleParseSchedules = useCallback(async () => {
    if (documents.length === 0) {
      takeoffToasts.parsingError('No documents available. Please upload documents first.');
      return;
    }

    const docsWithUrls = documents.filter(d => d.abridgedUrl || d.documentUrl);
    if (docsWithUrls.length === 0) {
      takeoffToasts.parsingError('Documents do not have URLs. Try refreshing the page.');
      return;
    }

    // Update takeoff status to PARSING
    if (selectedTakeoff) {
      try {
        await apiUpdateTakeoff(selectedTakeoff.id, { status: 'PARSING' as TakeoffStatusEnum });
        setTakeoffsData(prev =>
          prev.map(t => t.id === selectedTakeoff.id ? { ...t, status: 'Parsing' as const } : t)
        );
        setSelectedTakeoff(prev => prev ? { ...prev, status: 'Parsing' as const } : null);
      } catch (error) {
        console.error('[Parsing] Failed to update takeoff status:', error);
      }
    }

    setParsingState({ isProcessing: true, progress: 0 });
    const allParsedItems: ParsedItem[] = [];

    for (let i = 0; i < docsWithUrls.length; i++) {
      const doc = docsWithUrls[i];
      const urlToUse = doc.abridgedUrl || doc.documentUrl;

      setParsingState(prev => ({
        ...prev,
        progress: Math.round((i / docsWithUrls.length) * 100),
        currentItem: doc.name,
      }));

      try {
        const items = await parseScheduleDocumentAPI(urlToUse!, doc.name);

        const itemsWithDocRef: ParsedItem[] = items.map(item => ({
          ...item,
          id: `${doc.id}-${item.id}`,
          isOurManufacturer: item.isOurManufacturer ?? false,
          isCrossed: item.isCrossed ?? false,
        }));

        allParsedItems.push(...itemsWithDocRef);

        // Update document with parsed items in local state
        setDocuments(docs =>
          docs.map(d => d.id === doc.id ? { ...d, parsedItems: itemsWithDocRef } : d)
        );

        // Persist parsed items to database
        try {
          await updateTakeoffDocument(doc.id, { parsedItems: itemsWithDocRef });
        } catch (persistErr) {
          console.error(`[Parsing] Failed to persist parsed items for ${doc.name}:`, persistErr);
        }
      } catch (error) {
        console.error(`Failed to parse ${doc.name}:`, error);
        setParsingState(prev => ({
          ...prev,
          error: `Failed to parse ${doc.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }));
      }
    }

    setParsedItems(allParsedItems);

    // Set message if no items were found after parsing
    const message = allParsedItems.length === 0
      ? `Parsed ${docsWithUrls.length} document(s) but no product items were found.`
      : undefined;

    setParsingState({ isProcessing: false, progress: 100, message });
  }, [documents, selectedTakeoff, setDocuments, setTakeoffsData, setSelectedTakeoff, setParsedItems]);

  return {
    parsingState,
    setParsingState,
    handleParseSchedules,
  };
}
