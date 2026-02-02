import { useState } from 'react';
import type { SpecSheetFolder } from '../../../../lib/types/submittals';
import {
  useCreateFolder,
  useRenameFolder,
  useDeleteFolder,
} from '../../api/useSpecSheetsApi';
import { showConfirmToast, showSuccessToast, showErrorToast } from '../../../lib/toast';

interface UseFolderCRUDParams {
  folders: SpecSheetFolder[];
  selectedManufacturerId: string | null;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  findManufacturerIdByName: (name: string) => string | null;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedManufacturers: React.Dispatch<React.SetStateAction<Set<string>>>;
  reloadManufacturerFolders: (manufacturerId: string) => Promise<void>;
}

export function useFolderCRUD({
  folders,
  selectedManufacturerId,
  selectedFolderId,
  setSelectedFolderId,
  findManufacturerIdByName,
  setExpandedFolders,
  setExpandedManufacturers,
  reloadManufacturerFolders,
}: UseFolderCRUDParams) {
  // Editing state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingFolderManufacturer, setEditingFolderManufacturer] = useState('');

  // New folder state
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [newFolderManufacturer, setNewFolderManufacturer] = useState('');
  const [newFolderManufacturerId, setNewFolderManufacturerId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  // Error state
  const [folderError, setFolderError] = useState<string | null>(null);

  const createFolderMutation = useCreateFolder();
  const renameFolderMutation = useRenameFolder();
  const deleteFolderMutation = useDeleteFolder();

  const handleRenameFolder = (folder: SpecSheetFolder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
    setEditingFolderManufacturer(folder.manufacturer || '');
  };

  const handleSaveRename = async () => {
    if (!editingFolderId || !editingFolderName.trim()) {
      setEditingFolderId(null);
      setEditingFolderName('');
      setEditingFolderManufacturer('');
      return;
    }

    const factoryId = editingFolderManufacturer
      ? findManufacturerIdByName(editingFolderManufacturer)
      : selectedManufacturerId;

    if (!factoryId) {
      setFolderError('Could not determine manufacturer for folder rename');
      setEditingFolderId(null);
      setEditingFolderName('');
      setEditingFolderManufacturer('');
      return;
    }

    setFolderError(null);
    try {
      await renameFolderMutation.mutateAsync({
        factoryId,
        folderId: editingFolderId,
        newName: editingFolderName.trim(),
      });
      await reloadManufacturerFolders(factoryId);
      showSuccessToast('Folder renamed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rename folder';
      setFolderError(errorMessage);
      showErrorToast('Failed to rename folder', { description: errorMessage });
    } finally {
      setEditingFolderId(null);
      setEditingFolderName('');
      setEditingFolderManufacturer('');
    }
  };

  const handleDeleteFolder = async (folder: SpecSheetFolder) => {
    const hasSubfolders = folders.some(f => f.parentId === folder.id);

    if (hasSubfolders) {
      showErrorToast('Cannot delete folder', {
        description: 'This folder contains subfolders. Delete them first.',
      });
      return;
    }

    if ((folder.specSheetCount || 0) > 0) {
      showErrorToast('Cannot delete folder', {
        description: 'This folder contains spec sheets. Move or delete them first.',
      });
      return;
    }

    const confirmed = await showConfirmToast(`Delete folder "${folder.name}"?`, {
      confirmLabel: 'Delete',
    });

    if (confirmed) {
      setFolderError(null);
      const factoryId = findManufacturerIdByName(folder.manufacturer || '') || selectedManufacturerId;
      if (!factoryId) {
        showErrorToast('Failed to delete folder', { description: 'Could not determine manufacturer' });
        return;
      }
      try {
        await deleteFolderMutation.mutateAsync({ factoryId, folderId: folder.id });
        if (selectedFolderId === folder.id) setSelectedFolderId(null);
        await reloadManufacturerFolders(factoryId);
        showSuccessToast('Folder deleted');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete folder';
        setFolderError(errorMessage);
        showErrorToast('Failed to delete folder', { description: errorMessage });
      }
    }
  };

  const handleAddSubfolder = (parentFolder: SpecSheetFolder) => {
    setNewFolderParentId(parentFolder.id);
    setNewFolderManufacturer(parentFolder.manufacturer || '');
    const mfrId = findManufacturerIdByName(parentFolder.manufacturer || '');
    setNewFolderManufacturerId(mfrId || selectedManufacturerId || '');
    setNewFolderName('');
    setShowAddFolderModal(true);
  };

  const handleAddRootFolder = (manufacturer: string, manufacturerId?: string) => {
    setNewFolderParentId(null);
    setNewFolderManufacturer(manufacturer);
    const id = manufacturerId || findManufacturerIdByName(manufacturer);
    setNewFolderManufacturerId(id || '');
    setNewFolderName('');
    setShowAddFolderModal(true);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !newFolderManufacturerId) return;
    setFolderError(null);
    try {
      await createFolderMutation.mutateAsync({
        factoryId: newFolderManufacturerId,
        parentFolderId: newFolderParentId,
        folderName: newFolderName.trim(),
      });
      setShowAddFolderModal(false);
      setNewFolderName('');
      if (newFolderParentId) setExpandedFolders(prev => new Set([...prev, newFolderParentId!]));
      if (newFolderManufacturer) setExpandedManufacturers(prev => new Set([...prev, newFolderManufacturer]));
      await reloadManufacturerFolders(newFolderManufacturerId);
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to create folder');
    }
  };

  return {
    // Editing state
    editingFolderId,
    setEditingFolderId,
    editingFolderName,
    setEditingFolderName,

    // New folder state
    showAddFolderModal,
    setShowAddFolderModal,
    newFolderParentId,
    newFolderManufacturer,
    newFolderName,
    setNewFolderName,

    // Error state
    folderError,
    setFolderError,

    // Loading states
    isSavingFolder: renameFolderMutation.isPending || deleteFolderMutation.isPending,
    isCreatingFolder: createFolderMutation.isPending,

    // Handlers
    handleRenameFolder,
    handleSaveRename,
    handleDeleteFolder,
    handleAddSubfolder,
    handleAddRootFolder,
    handleCreateFolder,
  };
}
