import { useState, useMemo, useRef, useEffect } from 'react';
import { useFoldersByFactory } from '../api/useSpecSheetsApi';
import type { SpecSheetFolder } from '../../../lib/types/submittals';
import { fetchFoldersByFactory as fetchFoldersApi, type FolderResponse } from '../../lib/graphql/spec-sheets';
import { convertToSpecSheetFolders } from './folderUtils';
import { useFolderCRUD } from './spec-sheets-folders/useFolderCRUD';
import { useFolderDragDrop } from './spec-sheets-folders/useFolderDragDrop';
import { useFolderHelpers } from './spec-sheets-folders/useFolderHelpers';
import type { Manufacturer, FolderContextMenu } from './spec-sheets-folders/types';

interface UseSpecSheetsFoldersParams {
  selectedManufacturerId: string | null;
  manufacturers: Manufacturer[];
}

export function useSpecSheetsFolders({
  selectedManufacturerId,
  manufacturers,
}: UseSpecSheetsFoldersParams) {
  // UI state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [expandedManufacturers, setExpandedManufacturers] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<FolderContextMenu | null>(null);

  // All manufacturers folders cache
  const [allManufacturerFolders, setAllManufacturerFolders] = useState<Record<string, FolderResponse[]>>({});
  const [isLoadingAllFolders, setIsLoadingAllFolders] = useState(false);
  const hasLoadedFoldersRef = useRef(false);
  const manufacturerIdsRef = useRef<string>('');

  // Fetch folders for selected manufacturer
  const { data: foldersData, isLoading: isLoadingFolders } = useFoldersByFactory(selectedManufacturerId);

  // Convert API folders to SpecSheetFolder array
  const folders: SpecSheetFolder[] = useMemo(() => {
    if (!foldersData) return [];
    const selectedMfr = manufacturers.find(m => m.id === selectedManufacturerId);
    return convertToSpecSheetFolders(foldersData, selectedMfr?.name || '');
  }, [foldersData, selectedManufacturerId, manufacturers]);

  // Load all manufacturer folders
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
            foldersMap[m.id] = await fetchFoldersApi(m.id);
          } catch {
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

  // Reload folders for a single manufacturer (more efficient than reloading all)
  const reloadManufacturerFolders = async (manufacturerId: string) => {
    try {
      const folders = await fetchFoldersApi(manufacturerId);
      setAllManufacturerFolders(prev => ({
        ...prev,
        [manufacturerId]: folders,
      }));
    } catch {
      // Keep existing data on error
    }
  };

  useEffect(() => {
    if (!manufacturers || manufacturers.length === 0) return;
    const currentIds = manufacturers.map(m => m.id).sort().join(',');
    if (!hasLoadedFoldersRef.current || manufacturerIdsRef.current !== currentIds) {
      loadAllManufacturerFolders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacturers.length]);

  // Helpers
  const helpers = useFolderHelpers({
    manufacturers,
    allManufacturerFolders,
    folders,
    selectedManufacturerId,
  });

  // CRUD operations
  const crud = useFolderCRUD({
    folders,
    selectedManufacturerId,
    selectedFolderId,
    setSelectedFolderId,
    findManufacturerIdByName: helpers.findManufacturerIdByName,
    setExpandedFolders,
    setExpandedManufacturers,
    reloadManufacturerFolders,
  });

  // Drag & drop
  const dragDrop = useFolderDragDrop({
    folders,
    findManufacturerIdByName: helpers.findManufacturerIdByName,
    setFolderError: crud.setFolderError,
    reloadManufacturerFolders,
  });

  // Context menu handler
  const handleFolderContextMenu = (e: React.MouseEvent, folder: SpecSheetFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ folder, position: { x: e.clientX, y: e.clientY } });
  };

  // Toggle handlers
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

  return {
    // State
    expandedFolders,
    selectedFolderId,
    setSelectedFolderId,
    expandedManufacturers,
    contextMenu,
    setContextMenu,
    folders,
    isLoadingFolders,
    isLoadingAllFolders,

    // CRUD state & handlers
    editingFolderId: crud.editingFolderId,
    setEditingFolderId: crud.setEditingFolderId,
    editingFolderName: crud.editingFolderName,
    setEditingFolderName: crud.setEditingFolderName,
    showAddFolderModal: crud.showAddFolderModal,
    setShowAddFolderModal: crud.setShowAddFolderModal,
    newFolderParentId: crud.newFolderParentId,
    newFolderManufacturer: crud.newFolderManufacturer,
    newFolderName: crud.newFolderName,
    setNewFolderName: crud.setNewFolderName,
    folderError: crud.folderError,
    setFolderError: crud.setFolderError,
    isSavingFolder: crud.isSavingFolder || dragDrop.isMovingFolder,
    isCreatingFolder: crud.isCreatingFolder,
    handleRenameFolder: crud.handleRenameFolder,
    handleSaveRename: crud.handleSaveRename,
    handleDeleteFolder: crud.handleDeleteFolder,
    handleAddSubfolder: crud.handleAddSubfolder,
    handleAddRootFolder: crud.handleAddRootFolder,
    handleCreateFolder: crud.handleCreateFolder,

    // Drag & drop state & handlers
    draggedFolderId: dragDrop.draggedFolderId,
    dragOverFolderId: dragDrop.dragOverFolderId,
    setDragOverFolderId: dragDrop.setDragOverFolderId,
    handleFolderDragStart: dragDrop.handleFolderDragStart,
    handleFolderDragOver: dragDrop.handleFolderDragOver,
    handleFolderDragLeave: dragDrop.handleFolderDragLeave,
    handleFolderDrop: dragDrop.handleFolderDrop,
    handleFolderDragEnd: dragDrop.handleFolderDragEnd,

    // Helpers
    ...helpers,

    // Other handlers
    toggleFolder,
    toggleManufacturer,
    handleFolderContextMenu,
    loadAllManufacturerFolders,
  };
}
