import { useState, useCallback } from 'react';
import type { SpecSheet } from '../../../lib/types/submittals';
import { useMoveSpecSheetToFolder } from '../api/useSpecSheetsApi';
import { showSuccessToast, showErrorToast } from '../../lib/toast';

interface UseSpecSheetMultiSelectParams {
  filteredSpecSheets: SpecSheet[];
  loadAllManufacturerFolders: (forceRefresh?: boolean) => void;
}

export function useSpecSheetMultiSelect({
  filteredSpecSheets,
  loadAllManufacturerFolders,
}: UseSpecSheetMultiSelectParams) {
  const [selectedSpecSheetIds, setSelectedSpecSheetIds] = useState<Set<string>>(new Set());
  const [specSheetDragOverFolderId, setSpecSheetDragOverFolderId] = useState<string | null>(null);

  const moveSpecSheetToFolderMutation = useMoveSpecSheetToFolder();

  const toggleSpecSheetSelection = useCallback((id: string, isCtrlOrCmd: boolean) => {
    setSelectedSpecSheetIds(prev => {
      const next = new Set(prev);
      if (isCtrlOrCmd) {
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      } else {
        if (next.has(id) && next.size === 1) {
          next.clear();
        } else {
          next.clear();
          next.add(id);
        }
      }
      return next;
    });
  }, []);

  const selectAllVisibleSpecSheets = useCallback(() => {
    setSelectedSpecSheetIds(new Set(filteredSpecSheets.map(s => s.id)));
  }, [filteredSpecSheets]);

  const clearSpecSheetSelection = useCallback(() => {
    setSelectedSpecSheetIds(new Set());
  }, []);

  const handleSpecSheetDrop = useCallback(async (
    specSheetIdOrIds: string | string[],
    folderId: string,
    folderName?: string
  ) => {
    const ids = Array.isArray(specSheetIdOrIds) ? specSheetIdOrIds : [specSheetIdOrIds];
    const count = ids.length;

    try {
      await Promise.all(
        ids.map(id =>
          moveSpecSheetToFolderMutation.mutateAsync({
            specSheetId: id,
            folderId,
          })
        )
      );

      showSuccessToast(
        count === 1 ? 'Spec sheet moved' : `${count} spec sheets moved`,
        { description: folderName ? `Moved to ${folderName}` : 'Moved successfully' }
      );

      clearSpecSheetSelection();
      loadAllManufacturerFolders(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to move spec sheet(s)';
      showErrorToast('Failed to move spec sheet(s)', { description: message });
    }
  }, [moveSpecSheetToFolderMutation, clearSpecSheetSelection, loadAllManufacturerFolders]);

  return {
    selectedSpecSheetIds,
    setSelectedSpecSheetIds,
    toggleSpecSheetSelection,
    selectAllVisibleSpecSheets,
    clearSpecSheetSelection,
    specSheetDragOverFolderId,
    setSpecSheetDragOverFolderId,
    onSpecSheetDrop: handleSpecSheetDrop,
  };
}
