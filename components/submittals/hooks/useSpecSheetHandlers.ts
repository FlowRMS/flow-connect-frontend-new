'use client';

import { useCallback } from 'react';
import type { Submittal, SpecSheetMatchStatus } from '../../../lib/types/submittals';

interface UseSpecSheetHandlersParams {
  submittal: Submittal;
  selectedItemId: string | null;
  selectedSpecSheetForHighlight: string | null;
  onUpdate?: (updates: Partial<Submittal>) => void;
  setShowSpecSheetPicker: (show: boolean) => void;
  setShowHighlightPicker: (show: boolean) => void;
  setSelectedSpecSheetForHighlight: (id: string | null) => void;
}

export function useSpecSheetHandlers({
  submittal,
  selectedItemId,
  selectedSpecSheetForHighlight,
  onUpdate,
  setShowSpecSheetPicker,
  setShowHighlightPicker,
  setSelectedSpecSheetForHighlight,
}: UseSpecSheetHandlersParams) {
  const handleAttachSpecSheet = useCallback((specSheetId: string) => {
    if (!selectedItemId || !onUpdate) return;

    const updatedItems = submittal.items.map(item => {
      if (item.id === selectedItemId) {
        return {
          ...item,
          specSheetId,
          matchStatus: 'matched_no_highlight' as SpecSheetMatchStatus,
        };
      }
      return item;
    });

    onUpdate({ items: updatedItems });
    setShowSpecSheetPicker(false);
    setSelectedSpecSheetForHighlight(specSheetId);
    setShowHighlightPicker(true);
  }, [selectedItemId, submittal.items, onUpdate, setShowSpecSheetPicker, setSelectedSpecSheetForHighlight, setShowHighlightPicker]);

  const handleAttachHighlightVersion = useCallback((highlightVersionId: string) => {
    if (!selectedItemId || !onUpdate) return;

    const updatedItems = submittal.items.map(item => {
      if (item.id === selectedItemId) {
        return {
          ...item,
          // Include the spec sheet ID that was selected in the previous step
          specSheetId: selectedSpecSheetForHighlight || item.specSheetId,
          highlightDefinitionId: highlightVersionId,
          matchStatus: 'matched_with_highlight' as SpecSheetMatchStatus,
        };
      }
      return item;
    });

    onUpdate({ items: updatedItems });
    setShowHighlightPicker(false);
    setSelectedSpecSheetForHighlight(null);
  }, [selectedItemId, selectedSpecSheetForHighlight, submittal.items, onUpdate, setShowHighlightPicker, setSelectedSpecSheetForHighlight]);

  const handleSkipHighlightVersion = useCallback(() => {
    // When skipping highlight selection, still attach the spec sheet
    if (selectedItemId && selectedSpecSheetForHighlight && onUpdate) {
      const updatedItems = submittal.items.map(item => {
        if (item.id === selectedItemId) {
          return {
            ...item,
            specSheetId: selectedSpecSheetForHighlight,
            matchStatus: 'matched_no_highlight' as SpecSheetMatchStatus,
          };
        }
        return item;
      });
      onUpdate({ items: updatedItems });
    }
    setShowHighlightPicker(false);
    setSelectedSpecSheetForHighlight(null);
  }, [selectedItemId, selectedSpecSheetForHighlight, submittal.items, onUpdate, setShowHighlightPicker, setSelectedSpecSheetForHighlight]);

  const handleRemoveSpecSheet = useCallback(async (itemId: string) => {
    if (!onUpdate) return;

    // Find the item and update it
    const updatedItems = submittal.items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          specSheetId: undefined,
          highlightDefinitionId: undefined,
          matchStatus: 'no_match' as SpecSheetMatchStatus,
        };
      }
      return item;
    });

    await onUpdate({ items: updatedItems });
  }, [submittal.items, onUpdate]);

  const handleEditHighlights = useCallback((specSheetId: string | undefined) => {
    if (specSheetId) {
      setSelectedSpecSheetForHighlight(specSheetId);
      setShowHighlightPicker(true);
    }
  }, [setSelectedSpecSheetForHighlight, setShowHighlightPicker]);

  return {
    handleAttachSpecSheet,
    handleAttachHighlightVersion,
    handleSkipHighlightVersion,
    handleRemoveSpecSheet,
    handleEditHighlights,
  };
}
