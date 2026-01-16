/**
 * Product Cross operations hook
 * Handles product crossing state and operations
 */

import { useState, useCallback } from 'react';
import type { Takeoff, TakeoffDocument, ParsedItem } from '../../types';
import {
  crossProducts,
  updateTakeoff as apiUpdateTakeoff,
  updateTakeoffDocument,
  type TakeoffStatusEnum,
} from '../../../lib/graphql/takeoffs';
import { createKnownProductCross } from '../../../lib/graphql/product-crosses';
import { showInfoToast, showErrorToast, showSuccessToast } from '../../../lib/toast';
import type { ProcessingState, CrossType, ProductCrossResult, ItemCrossingState } from '../types';

interface UseProductCrossProps {
  documents: TakeoffDocument[];
  parsedItems: ParsedItem[];
  setParsedItems: React.Dispatch<React.SetStateAction<ParsedItem[]>>;
  selectedTakeoff: Takeoff | null;
  setSelectedTakeoff: React.Dispatch<React.SetStateAction<Takeoff | null>>;
  setTakeoffsData: React.Dispatch<React.SetStateAction<Takeoff[]>>;
}

export function useProductCross({
  documents,
  parsedItems,
  setParsedItems,
  selectedTakeoff,
  setSelectedTakeoff,
  setTakeoffsData,
}: UseProductCrossProps) {
  const [productCrossState, setProductCrossState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });

  const [itemCrossingState, setItemCrossingState] = useState<Record<string, ItemCrossingState>>({});
  const [productCrossResults, setProductCrossResults] = useState<ProductCrossResult[]>([]);
  const [selectedCrossTypes, setSelectedCrossTypes] = useState<CrossType[]>(['SIMPLE', 'UPGRADE', 'VALUE']);

  // Handle cross types change
  const handleCrossTypesChange = useCallback((types: CrossType[]) => {
    setSelectedCrossTypes(types);
  }, []);

  // Handle selecting a cross alternative
  const handleSelectAlternative = useCallback((originalIndex: number, altIndex: number) => {
    setProductCrossResults(prev => prev.map((r, i) => {
      if (i !== originalIndex) return r;
      return {
        ...r,
        alternatives: r.alternatives.map((alt, j) => ({
          ...alt,
          selected: j === altIndex ? !alt.selected : alt.selected,
        })),
      };
    }));
  }, []);

  // Run product cross using AI for all eligible parsed items
  const handleCrossAll = useCallback(async () => {
    const itemsToCross = parsedItems.filter(item => !item.isOurManufacturer);
    if (itemsToCross.length === 0) {
      showInfoToast('No items to cross', { description: 'All items are from our manufacturers.' });
      return;
    }

    setProductCrossState({ isProcessing: true, progress: 0 });

    // Set processing state for each item
    const processingState: Record<string, ItemCrossingState> = {};
    itemsToCross.forEach(item => {
      processingState[item.id] = { isProcessing: true };
    });
    setItemCrossingState(prev => ({ ...prev, ...processingState }));

    try {
      const productsData = itemsToCross.map(item => ({
        id: item.id,
        name: `${item.manufacturer} ${item.partNumber}`.trim(),
        manufacturer: item.manufacturer,
        part_number: item.partNumber,
        description: item.description,
      }));

      const crosses = await crossProducts(productsData, selectedCrossTypes);
      const crossedResults = new Map<string, { manufacturer: string; partNumber: string; description: string }>();

      crosses.forEach((cross, index) => {
        const originalItem = itemsToCross[index];
        if (originalItem && cross.crosses && cross.crosses.length > 0) {
          const alternatives = cross.crosses.flatMap(c => c.alternatives);
          const bestAlternative = alternatives[0];
          if (bestAlternative) {
            crossedResults.set(originalItem.id, {
              manufacturer: bestAlternative.name,
              partNumber: bestAlternative.description?.split(' ')[0] || `OC-${Math.floor(Math.random() * 90000) + 10000}`,
              description: bestAlternative.description || originalItem.description + ' (Crossed)',
            });
          }
        }
      });

      // Update parsed items with crossed data
      setParsedItems(items =>
        items.map(item => {
          if (item.isOurManufacturer) return item;
          const crossedResult = crossedResults.get(item.id);
          if (!crossedResult && !itemsToCross.some(i => i.id === item.id)) return item;

          return {
            ...item,
            isCrossed: true,
            crossedManufacturer: crossedResult?.manufacturer || 'Our Company',
            crossedPartNumber: crossedResult?.partNumber || `OC-${Math.floor(Math.random() * 90000) + 10000}`,
            crossedDescription: crossedResult?.description || item.description + ' (Crossed)',
          };
        })
      );

      showSuccessToast(`Crossed ${itemsToCross.length} items`);

      // Persist crossed items to documents
      await persistCrossedItems(itemsToCross, crossedResults, documents);

      // Persist each cross to known_product_crosses
      for (const item of itemsToCross) {
        const crossedResult = crossedResults.get(item.id);
        if (crossedResult) {
          createKnownProductCross({
            competitorManufacturer: item.manufacturer,
            competitorPartNumber: item.partNumber,
            competitorDescription: item.description || '',
            ourManufacturer: crossedResult.manufacturer,
            ourPartNumber: crossedResult.partNumber,
            ourDescription: crossedResult.description,
          }).catch(err => console.error('Failed to persist cross:', err));
        }
      }
    } catch (error) {
      console.error('Failed to cross all items:', error);
      showErrorToast('Failed to cross items', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fallback: mark all as crossed with generic values
      setParsedItems(items =>
        items.map(item => {
          if (item.isOurManufacturer || item.isCrossed) return item;
          return {
            ...item,
            isCrossed: true,
            crossedManufacturer: 'Our Company',
            crossedPartNumber: `OC-${Math.floor(Math.random() * 90000) + 10000}`,
            crossedDescription: item.description + ' (Crossed)',
          };
        })
      );
    } finally {
      setProductCrossState({ isProcessing: false, progress: 100 });

      // Clear individual item processing states
      const clearState: Record<string, ItemCrossingState> = {};
      itemsToCross.forEach(item => {
        clearState[item.id] = { isProcessing: false };
      });
      setItemCrossingState(prev => ({ ...prev, ...clearState }));

      // Update takeoff status to COMPLETE
      if (selectedTakeoff) {
        try {
          await apiUpdateTakeoff(selectedTakeoff.id, { status: 'COMPLETE' as TakeoffStatusEnum });
          setTakeoffsData(prev =>
            prev.map(t => t.id === selectedTakeoff.id ? { ...t, status: 'Complete' as const } : t)
          );
          setSelectedTakeoff(prev => prev ? { ...prev, status: 'Complete' as const } : null);
        } catch (error) {
          console.error('[handleCrossAll] Failed to update takeoff status:', error);
        }
      }
    }
  }, [parsedItems, selectedCrossTypes, documents, selectedTakeoff, setParsedItems, setTakeoffsData, setSelectedTakeoff]);

  // Cross a single item
  const handleCrossItem = useCallback(async (itemId: string) => {
    const item = parsedItems.find(i => i.id === itemId);
    if (!item || item.isOurManufacturer) return;

    setItemCrossingState(prev => ({ ...prev, [itemId]: { isProcessing: true } }));

    try {
      const productsData = [{
        id: item.id,
        name: `${item.manufacturer} ${item.partNumber}`.trim(),
        manufacturer: item.manufacturer,
        part_number: item.partNumber,
        description: item.description,
      }];

      const crosses = await crossProducts(productsData, selectedCrossTypes);

      if (crosses.length > 0 && crosses[0].crosses && crosses[0].crosses.length > 0) {
        const alternatives = crosses[0].crosses.flatMap(c => c.alternatives);
        const bestAlternative = alternatives[0];

        if (bestAlternative) {
          const crossedManufacturer = bestAlternative.name;
          const crossedPartNumber = bestAlternative.description?.split(' ')[0] || `OC-${Math.floor(Math.random() * 90000) + 10000}`;
          const crossedDescription = bestAlternative.description || item.description + ' (Crossed)';

          setParsedItems(items =>
            items.map(i => i.id === itemId ? {
              ...i,
              isCrossed: true,
              crossedManufacturer,
              crossedPartNumber,
              crossedDescription,
            } : i)
          );

          // Persist to known_product_crosses
          createKnownProductCross({
            competitorManufacturer: item.manufacturer,
            competitorPartNumber: item.partNumber,
            competitorDescription: item.description || '',
            ourManufacturer: crossedManufacturer,
            ourPartNumber: crossedPartNumber,
            ourDescription: crossedDescription,
          }).catch(err => console.error('Failed to persist cross:', err));
        }
      }
    } catch (error) {
      console.error('Failed to cross item:', error);
      setItemCrossingState(prev => ({
        ...prev,
        [itemId]: { isProcessing: false, error: String(error) },
      }));
    } finally {
      setItemCrossingState(prev => ({ ...prev, [itemId]: { isProcessing: false } }));
    }
  }, [parsedItems, selectedCrossTypes, setParsedItems]);

  return {
    productCrossState,
    setProductCrossState,
    itemCrossingState,
    setItemCrossingState,
    productCrossResults,
    setProductCrossResults,
    selectedCrossTypes,
    setSelectedCrossTypes,
    handleCrossTypesChange,
    handleSelectAlternative,
    handleCrossAll,
    handleCrossItem,
  };
}

// Helper to persist crossed items
async function persistCrossedItems(
  itemsToCross: ParsedItem[],
  crossedResults: Map<string, { manufacturer: string; partNumber: string; description: string }>,
  documents: TakeoffDocument[]
) {
  const updatedItemsMap = new Map<string, ParsedItem>();
  itemsToCross.forEach(item => {
    const crossedResult = crossedResults.get(item.id);
    updatedItemsMap.set(item.id, {
      ...item,
      isCrossed: true,
      crossedManufacturer: crossedResult?.manufacturer || 'Our Company',
      crossedPartNumber: crossedResult?.partNumber || `OC-${Math.floor(Math.random() * 90000) + 10000}`,
      crossedDescription: crossedResult?.description || item.description + ' (Crossed)',
    });
  });

  for (const doc of documents) {
    if (!doc.parsedItems || doc.parsedItems.length === 0) continue;

    const updatedDocItems = doc.parsedItems.map(item => {
      const updated = updatedItemsMap.get(item.id);
      return updated || item;
    });

    try {
      await updateTakeoffDocument(doc.id, { parsedItems: updatedDocItems });
    } catch (persistErr) {
      console.error(`[handleCrossAll] Failed to persist items to document ${doc.id}:`, persistErr);
    }
  }
}
