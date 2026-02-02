import { useState, useMemo, useRef, useEffect } from 'react';
import {
  useFoldersByFactory,
  useCreateFolder,
  useRenameFolder,
  useDeleteFolder,
  useMoveFolder,
} from '../api/useSpecSheetsApi';
import type { SpecSheetFolder } from '../../../lib/types/submittals';
import { fetchFoldersByFactory as fetchFoldersApi, type FolderResponse } from '../../lib/graphql/spec-sheets';
import { showConfirmToast, showSuccessToast, showErrorToast } from '../../lib/toast';
import { convertToSpecSheetFolders } from './folderUtils';

interface Manufacturer {
  id: string;
  name: string;
}

interface UseSpecSheetsFoldersParams {
  selectedManufacturerId: string | null;
  manufacturers: Manufacturer[];
}

export function useSpecSheetsFolders({
  selectedManufacturerId,
  manufacturers,
}: UseSpecSheetsFoldersParams) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [allManufacturerFolders, setAllManufacturerFolders] = useState<Record<string, FolderResponse[]>>({});
  const [isLoadingAllFolders, setIsLoadingAllFolders] = useState(false);
  const hasLoadedFoldersRef = useRef(false);

  const [contextMenu, setContextMenu] = useState<{ folder: SpecSheetFolder; position: { x: number; y: number } } | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [newFolderManufacturer, setNewFolderManufacturer] = useState<string>('');
  const [newFolderManufacturerId, setNewFolderManufacturerId] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [expandedManufacturers, setExpandedManufacturers] = useState<Set<string>>(new Set());

  const { data: foldersData, isLoading: isLoadingFolders } = useFoldersByFactory(selectedManufacturerId);

  const createFolderMutation = useCreateFolder();
  const renameFolderMutation = useRenameFolder();
  const deleteFolderMutation = useDeleteFolder();
  const moveFolderMutation = useMoveFolder();

  const isSavingFolder = renameFolderMutation.isPending || deleteFolderMutation.isPending || moveFolderMutation.isPending;
  const isCreatingFolder = createFolderMutation.isPending;

  // Track manufacturer IDs to prevent refetching on array reference changes
  const manufacturerIdsRef = useRef<string>('');

  const loadAllManufacturerFolders = async (force = false) => {
    if (!manufacturers || manufacturers.length === 0) return;
    if (isLoadingAllFolders) return;

    const currentIds = manufacturers.map(m => m.id).sort().join(',');
    if (hasLoadedFoldersRef.current && !force && manufacturerIdsRef.current === currentIds) return;

    setIsLoadingAllFolders(true);
    try {
      const foldersMap: Record<string, FolderResponse[]> = {};
      await Promise.all(
        manufacturers.map(async (m) => {
          try {
            const folders = await fetchFoldersApi(m.id);
            foldersMap[m.id] = folders;
          } catch (error) {
            console.error(`Failed to fetch folders for manufacturer ${m.id}:`, error);
            foldersMap[m.id] = [];
          }
        })
      );
      setAllManufacturerFolders(foldersMap);
      hasLoadedFoldersRef.current = true;
      manufacturerIdsRef.current = currentIds;
    } finally {
      setIsLoadingAllFolders(false);
    }
  };

  useEffect(() => {
    if (!manufacturers || manufacturers.length === 0) return;

    const currentIds = manufacturers.map(m => m.id).sort().join(',');
    // Only load if IDs actually changed or never loaded
    if (!hasLoadedFoldersRef.current || manufacturerIdsRef.current !== currentIds) {
      loadAllManufacturerFolders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacturers.length]);

  const findManufacturerIdByName = (name: string): string | null => {
    const found = manufacturers.find(m => m.name === name);
    return found?.id || null;
  };

  // Convert API folders to SpecSheetFolder array with hierarchy built from parentId
  const folders: SpecSheetFolder[] = useMemo(() => {
    if (!foldersData) return [];
    const selectedMfr = manufacturers.find(m => m.id === selectedManufacturerId);
    const manufacturerName = selectedMfr?.name || '';
    return convertToSpecSheetFolders(foldersData, manufacturerName);
  }, [foldersData, selectedManufacturerId, manufacturers]);

  const getFolderPath = (folderId: string): string | null => {
    const folder = folders.find(f => f.id === folderId);
    return folder?.folderPath || null;
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: SpecSheetFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ folder, position: { x: e.clientX, y: e.clientY } });
  };

  const handleRenameFolder = (folder: SpecSheetFolder) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const handleSaveRename = async () => {
    if (!editingFolderId || !editingFolderName.trim() || !selectedManufacturerId) {
      setEditingFolderId(null);
      setEditingFolderName('');
      return;
    }
    setFolderError(null);
    try {
      // New API uses factoryId, folderId and newName
      await renameFolderMutation.mutateAsync({
        factoryId: selectedManufacturerId,
        folderId: editingFolderId,
        newName: editingFolderName.trim()
      });
      loadAllManufacturerFolders(true);
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to rename folder');
    } finally {
      setEditingFolderId(null);
      setEditingFolderName('');
    }
  };

  const handleDeleteFolder = async (folder: SpecSheetFolder) => {
    // Check for subfolders first
    const hasSubfolders = folders.some(f => f.parentId === folder.id);

    if (hasSubfolders) {
      showErrorToast('Cannot delete folder', {
        description: 'This folder contains subfolders. Delete them first.',
      });
      return;
    }

    // Check if folder has direct spec sheets
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
      // Find factoryId from manufacturer name
      const factoryId = findManufacturerIdByName(folder.manufacturer || '') || selectedManufacturerId;
      if (!factoryId) {
        showErrorToast('Failed to delete folder', { description: 'Could not determine manufacturer' });
        return;
      }
      try {
        // New API uses factoryId and folderId
        await deleteFolderMutation.mutateAsync({ factoryId, folderId: folder.id });
        if (selectedFolderId === folder.id) setSelectedFolderId(null);
        loadAllManufacturerFolders(true);
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
    // Find the manufacturer ID from the parent folder's manufacturer name
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
      // New API uses factoryId, parentFolderId, and folderName
      await createFolderMutation.mutateAsync({
        factoryId: newFolderManufacturerId,
        parentFolderId: newFolderParentId,
        folderName: newFolderName.trim()
      });
      setShowAddFolderModal(false);
      setNewFolderName('');
      if (newFolderParentId) setExpandedFolders(prev => new Set([...prev, newFolderParentId!]));
      if (newFolderManufacturer) setExpandedManufacturers(prev => new Set([...prev, newFolderManufacturer]));
      loadAllManufacturerFolders(true);
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : 'Failed to create folder');
    }
  };

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

  const handleFolderDrop = async (e: React.DragEvent, targetFolderId: string | null, targetManufacturer?: string) => {
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

    // Find the factoryId from manufacturer name
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

  // Get root folders (parentId === null) for a manufacturer
  const getAllFoldersForManufacturer = (manufacturerName: string): SpecSheetFolder[] => {
    const manufacturerData = manufacturers.find(m => m.name === manufacturerName);
    if (!manufacturerData) return [];
    const apiFolders = allManufacturerFolders[manufacturerData.id] || [];
    if (apiFolders.length === 0) return [];

    const allFolders = convertToSpecSheetFolders(apiFolders, manufacturerName);
    // Return only root folders (no parent)
    return allFolders.filter(f => f.parentId === null);
  };

  const getFoldersForManufacturer = (manufacturer: string) => getAllFoldersForManufacturer(manufacturer);

  const getChildFoldersFromAll = (parentId: string, manufacturerName: string): SpecSheetFolder[] => {
    const manufacturerData = manufacturers.find(m => m.name === manufacturerName);
    if (!manufacturerData) return [];
    const apiFolders = allManufacturerFolders[manufacturerData.id] || [];
    if (apiFolders.length === 0) return [];

    const allFolders = convertToSpecSheetFolders(apiFolders, manufacturerName);
    return allFolders.filter(f => f.parentId === parentId);
  };

  const getFolderCountForManufacturer = (manufacturerName: string): number => {
    const manufacturerData = manufacturers.find(m => m.name === manufacturerName);
    if (!manufacturerData) return 0;
    return (allManufacturerFolders[manufacturerData.id] || []).length;
  };

  const getFolderSpecSheetCount = (folderId: string, manufacturerName: string): number => {
    const manufacturerData = manufacturers.find(m => m.name === manufacturerName);
    if (!manufacturerData) return 0;
    const apiFolders = allManufacturerFolders[manufacturerData.id] || [];
    const folder = apiFolders.find(f => f.id === folderId);
    return folder?.specSheetCount || 0;
  };

  const getChildFoldersLocal = (parentId: string) => folders.filter(f => f.parentId === parentId);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const toggleManufacturer = (manufacturer: string) => {
    setExpandedManufacturers(prev => {
      const next = new Set(prev);
      if (next.has(manufacturer)) next.delete(manufacturer);
      else next.add(manufacturer);
      return next;
    });
  };

  const getFolderCount = (folderId: string): number => {
    const folder = folders.find(f => f.id === folderId);
    return folder?.specSheetCount || 0;
  };

  return {
    // State
    expandedFolders,
    selectedFolderId,
    setSelectedFolderId,
    expandedManufacturers,
    contextMenu,
    setContextMenu,
    editingFolderId,
    setEditingFolderId,
    editingFolderName,
    setEditingFolderName,
    showAddFolderModal,
    setShowAddFolderModal,
    newFolderParentId,
    newFolderManufacturer,
    newFolderName,
    setNewFolderName,
    draggedFolderId,
    dragOverFolderId,
    setDragOverFolderId,
    folderError,
    setFolderError,
    folders,
    isSavingFolder,
    isCreatingFolder,
    isLoadingFolders,
    isLoadingAllFolders,

    // Handlers
    toggleFolder,
    toggleManufacturer,
    handleFolderContextMenu,
    handleRenameFolder,
    handleSaveRename,
    handleDeleteFolder,
    handleAddSubfolder,
    handleAddRootFolder,
    handleCreateFolder,
    handleFolderDragStart,
    handleFolderDragOver,
    handleFolderDragLeave,
    handleFolderDrop,
    handleFolderDragEnd,
    getFoldersForManufacturer,
    getAllFoldersForManufacturer,
    getChildFoldersFromAll,
    getFolderCountForManufacturer,
    getFolderSpecSheetCount,
    getChildFoldersLocal,
    getFolderCount,
    loadAllManufacturerFolders,
  };
}
