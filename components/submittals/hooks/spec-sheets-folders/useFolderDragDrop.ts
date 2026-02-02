import { useState } from 'react';
import type { SpecSheetFolder } from '../../../../lib/types/submittals';
import { useMoveFolder } from '../../api/useSpecSheetsApi';
import { showSuccessToast, showErrorToast } from '../../../lib/toast';

interface UseFolderDragDropParams {
  folders: SpecSheetFolder[];
  findManufacturerIdByName: (name: string) => string | null;
  setFolderError: (error: string | null) => void;
  loadAllManufacturerFolders: (force?: boolean) => Promise<void>;
}

export function useFolderDragDrop({
  folders,
  findManufacturerIdByName,
  setFolderError,
  loadAllManufacturerFolders,
}: UseFolderDragDropParams) {
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const moveFolderMutation = useMoveFolder();

  const handleFolderDragStart = (e: React.DragEvent, folderId: string) => {
    e.stopPropagation();
    setDraggedFolderId(folderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedFolderId && draggedFolderId !== folderId) {
      const isChild = (parentId: string, childId: string): boolean => {
        const children = folders.filter(f => f.parentId === parentId);
        if (children.some(c => c.id === childId)) return true;
        return children.some(c => isChild(c.id, childId));
      };
      if (!isChild(draggedFolderId, folderId)) setDragOverFolderId(folderId);
    }
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverFolderId(null);
  };

  const handleFolderDrop = async (
    e: React.DragEvent,
    targetFolderId: string | null,
    targetManufacturer?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedFolderId || draggedFolderId === targetFolderId) {
      setDraggedFolderId(null);
      setDragOverFolderId(null);
      return;
    }

    if (!targetManufacturer) {
      setFolderError('Could not determine target manufacturer');
      setDraggedFolderId(null);
      setDragOverFolderId(null);
      return;
    }

    const factoryId = findManufacturerIdByName(targetManufacturer);
    if (!factoryId) {
      setFolderError('Could not determine manufacturer for folder move');
      setDraggedFolderId(null);
      setDragOverFolderId(null);
      return;
    }

    setFolderError(null);
    try {
      await moveFolderMutation.mutateAsync({
        factoryId,
        folderId: draggedFolderId,
        newParentId: targetFolderId,
      });
      loadAllManufacturerFolders(true);
      showSuccessToast('Folder moved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move folder';
      setFolderError(errorMessage);
      showErrorToast('Failed to move folder', { description: errorMessage });
    } finally {
      setDraggedFolderId(null);
      setDragOverFolderId(null);
    }
  };

  const handleFolderDragEnd = () => {
    setDraggedFolderId(null);
    setDragOverFolderId(null);
  };

  return {
    draggedFolderId,
    dragOverFolderId,
    setDragOverFolderId,
    isMovingFolder: moveFolderMutation.isPending,
    handleFolderDragStart,
    handleFolderDragOver,
    handleFolderDragLeave,
    handleFolderDrop,
    handleFolderDragEnd,
  };
}
