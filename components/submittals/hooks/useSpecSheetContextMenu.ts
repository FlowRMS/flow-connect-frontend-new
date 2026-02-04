import { useState, useCallback } from 'react';
import type { SpecSheet } from '../../../lib/types/submittals';
import { useUpdateSpecSheet, useDeleteSpecSheet } from '../api/useSpecSheetsApi';
import { showSuccessToast, showErrorToast } from '../../lib/toast';

interface SpecSheetContextMenuState {
  specSheet: SpecSheet;
  position: { x: number; y: number };
}

interface UseSpecSheetContextMenuParams {
  selectedSpecSheet: SpecSheet | null;
  setSelectedSpecSheet: (sheet: SpecSheet | null) => void;
  selectedSpecSheetIds: Set<string>;
  setSelectedSpecSheetIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function useSpecSheetContextMenu({
  selectedSpecSheet,
  setSelectedSpecSheet,
  selectedSpecSheetIds,
  setSelectedSpecSheetIds,
}: UseSpecSheetContextMenuParams) {
  const [specSheetContextMenu, setSpecSheetContextMenu] = useState<SpecSheetContextMenuState | null>(null);
  const [renamingSpecSheetId, setRenamingSpecSheetId] = useState<string | null>(null);
  const [renamingSpecSheetName, setRenamingSpecSheetName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<SpecSheet | null>(null);

  const updateSpecSheetMutation = useUpdateSpecSheet();
  const deleteSpecSheetMutation = useDeleteSpecSheet();

  const handleSpecSheetContextMenu = useCallback((e: React.MouseEvent, specSheet: SpecSheet) => {
    e.preventDefault();
    setSpecSheetContextMenu({
      specSheet,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const handleSpecSheetView = useCallback((specSheet: SpecSheet) => {
    setSelectedSpecSheet(specSheet);
    setSpecSheetContextMenu(null);
  }, [setSelectedSpecSheet]);

  const handleSpecSheetRename = useCallback((specSheet: SpecSheet) => {
    setRenamingSpecSheetId(specSheet.id);
    setRenamingSpecSheetName(specSheet.displayName);
    setSpecSheetContextMenu(null);
  }, []);

  const handleSpecSheetSaveRename = useCallback(async () => {
    if (!renamingSpecSheetId || !renamingSpecSheetName.trim()) {
      setRenamingSpecSheetId(null);
      setRenamingSpecSheetName('');
      return;
    }

    try {
      await updateSpecSheetMutation.mutateAsync({
        id: renamingSpecSheetId,
        input: { displayName: renamingSpecSheetName.trim() },
      });
      showSuccessToast('Spec sheet renamed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename spec sheet';
      showErrorToast('Failed to rename', { description: message });
    } finally {
      setRenamingSpecSheetId(null);
      setRenamingSpecSheetName('');
    }
  }, [renamingSpecSheetId, renamingSpecSheetName, updateSpecSheetMutation]);

  const handleSpecSheetDownload = useCallback(async (specSheet: SpecSheet) => {
    setSpecSheetContextMenu(null);

    try {
      const response = await fetch(specSheet.fileUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = specSheet.fileName || `${specSheet.displayName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(specSheet.fileUrl, '_blank');
    }
  }, []);

  const handleSpecSheetDelete = useCallback((specSheet: SpecSheet) => {
    setShowDeleteConfirm(specSheet);
    setSpecSheetContextMenu(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!showDeleteConfirm) return;

    try {
      await deleteSpecSheetMutation.mutateAsync(showDeleteConfirm.id);
      showSuccessToast('Spec sheet deleted', { description: showDeleteConfirm.displayName });

      if (selectedSpecSheet?.id === showDeleteConfirm.id) {
        setSelectedSpecSheet(null);
      }
      setSelectedSpecSheetIds(prev => {
        const next = new Set(prev);
        next.delete(showDeleteConfirm.id);
        return next;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete spec sheet';

      if (errorMessage.toLowerCase().includes('linked to other records') || errorMessage.toLowerCase().includes('constraint')) {
        showErrorToast('Cannot delete spec sheet', {
          description: 'This spec sheet has highlights or is used in submittals. Remove those references first.'
        });
      } else {
        showErrorToast('Failed to delete', { description: errorMessage });
      }
    } finally {
      setShowDeleteConfirm(null);
    }
  }, [showDeleteConfirm, deleteSpecSheetMutation, selectedSpecSheet, setSelectedSpecSheet, setSelectedSpecSheetIds]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(null);
  }, []);

  return {
    specSheetContextMenu,
    setSpecSheetContextMenu,
    handleSpecSheetContextMenu,
    handleSpecSheetView,
    handleSpecSheetRename,
    handleSpecSheetDownload,
    handleSpecSheetDelete,
    renamingSpecSheetId,
    renamingSpecSheetName,
    setRenamingSpecSheetName,
    handleSpecSheetSaveRename,
    setRenamingSpecSheetId,
    showDeleteConfirm,
    handleConfirmDelete,
    handleCancelDelete,
  };
}
