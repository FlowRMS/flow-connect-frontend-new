'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  fetchRootFolders,
  fetchFolderWithContents,
  buildFolderPath,
  uploadFile,
  deleteFile,
  deleteFolder,
  createFolder,
  updateFolder,
  getFilePresignedUrl,
  searchFiles,
  searchFolders,
  fetchFilesByLinkedEntity,
  type FolderResponse,
  type FolderWithContents,
  type FileResponse,
  type FileEntityType,
} from '../lib/graphql/files';
import { showSuccessToast, showErrorToast } from '../lib/toast';
import { Breadcrumbs } from './components/Breadcrumbs';
import { Toolbar } from './components/Toolbar';
import { GridView } from './components/GridView';
import { ListView } from './components/ListView';
import { QuickAccess } from './components/QuickAccess';
import { EmptyState } from './components/EmptyState';
import { DropZoneOverlay } from './components/DropZoneOverlay';
import { ContextMenu, ContextMenuIcons, type ContextMenuItem } from './components/ContextMenu';
import { CreateFolderModal } from './modals/CreateFolderModal';
import { FilePreviewModal } from './modals/FilePreviewModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { RenameModal } from './modals/RenameModal';
import { ItemDetailsModal } from './modals/ItemDetailsModal';
import { MoveItemModal } from './modals/MoveItemModal';
import { LinkFileToEntityModal } from './modals/LinkFileToEntityModal';
import { EntityModeSelector, type SelectedEntity, type EntityModeEntityType } from './components/EntityModeSelector';
import { useFileSelection } from './hooks/useFileSelection';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export type ViewMode = 'grid' | 'list';
export type SortField = 'name' | 'date' | 'size' | 'type';
export type SortDirection = 'asc' | 'desc';

export interface SelectedItem {
  id: string;
  type: 'file' | 'folder';
  name: string;
}

interface ContextMenuState {
  x: number;
  y: number;
  itemId: string;
  itemType: 'file' | 'folder';
}

// Pagination constants
const ITEMS_PER_PAGE = 100;

export default function FilesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFolderId = searchParams.get('folder') || null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Data state
  const [folders, setFolders] = useState<FolderResponse[]>([]);
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [folderPath, setFolderPath] = useState<FolderResponse[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderWithContents | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileResponse[]>([]);

  // Pagination
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ folders: FolderResponse[]; files: FileResponse[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);

  // Context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Modal state
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [isCreatingFolderInline, setIsCreatingFolderInline] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileResponse | null>(null);
  const [itemsToDelete, setItemsToDelete] = useState<SelectedItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameItem, setRenameItem] = useState<{ id: string; type: 'file' | 'folder'; name: string; description?: string } | null>(null);
  const [detailsItem, setDetailsItem] = useState<{ item: FolderResponse | FileResponse; type: 'file' | 'folder' } | null>(null);
  const [moveItem, setMoveItem] = useState<{ id: string; type: 'file' | 'folder'; name: string } | null>(null);
  const [linkFileItem, setLinkFileItem] = useState<FileResponse | null>(null);

  // Entity mode state
  const [isEntityMode, setIsEntityMode] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [entityFiles, setEntityFiles] = useState<FileResponse[]>([]);
  const [isLoadingEntityFiles, setIsLoadingEntityFiles] = useState(false);

  // Selection
  const {
    selectedItems,
    handleItemClick,
    handleCheckboxClick,
    selectAll,
    clearSelection,
    isSelected,
    isHighlighted,
    getSelectedItemsList,
  } = useFileSelection(folders, files);

  // Load folder contents
  const loadContents = useCallback(async () => {
    setIsLoading(true);
    clearSelection();
    setDisplayLimit(ITEMS_PER_PAGE);

    try {
      if (currentFolderId) {
        // Load folder with contents
        const folderData = await fetchFolderWithContents(currentFolderId);
        if (folderData) {
          setCurrentFolder(folderData);
          setFolders(folderData.children || []);
          setFiles(folderData.files || []);

          // Build breadcrumb path
          const path = await buildFolderPath(currentFolderId);
          setFolderPath(path);
        }
      } else {
        // Load root folders
        const rootFolders = await fetchRootFolders();
        setFolders(rootFolders);
        setFiles([]);
        setCurrentFolder(null);
        setFolderPath([]);

        // Load recent files for Quick Access (only at root)
        try {
          const recent = await searchFiles('', 8);
          setRecentFiles(recent.slice(0, 8));
        } catch {
          // Ignore errors for recent files
        }
      }
    } catch (error) {
      console.error('Failed to load contents:', error);
      showErrorToast('Failed to load files', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId, clearSelection]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  // Search handler
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [folderResults, fileResults] = await Promise.all([
          searchFolders(searchTerm, 50),
          searchFiles(searchTerm, 50),
        ]);
        setSearchResults({ folders: folderResults, files: fileResults });
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Load entity files when entity is selected
  useEffect(() => {
    if (!selectedEntity) {
      setEntityFiles([]);
      return;
    }

    const loadEntityFiles = async () => {
      setIsLoadingEntityFiles(true);
      try {
        const files = await fetchFilesByLinkedEntity(
          selectedEntity.type as FileEntityType,
          selectedEntity.id
        );
        setEntityFiles(files);
      } catch (error) {
        console.error('Failed to load entity files:', error);
        showErrorToast('Failed to load files', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        setEntityFiles([]);
      } finally {
        setIsLoadingEntityFiles(false);
      }
    };

    loadEntityFiles();
  }, [selectedEntity]);

  // Handle exiting entity mode
  const handleExitEntityMode = useCallback(() => {
    setIsEntityMode(false);
    setSelectedEntity(null);
    setEntityFiles([]);
    clearSelection();
  }, [clearSelection]);

  // Load more items on scroll
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      setDisplayLimit(prev => prev + ITEMS_PER_PAGE);
    }
  }, []);

  // Navigation
  const navigateToFolder = useCallback((folderId: string | null) => {
    clearSelection();
    setSearchTerm('');
    setSearchResults(null);
    setContextMenu(null);
    if (folderId) {
      router.push(`/files?folder=${folderId}`);
    } else {
      router.push('/files');
    }
  }, [router, clearSelection]);

  // Double-click handlers
  const handleFolderDoubleClick = useCallback((folder: FolderResponse) => {
    navigateToFolder(folder.id);
  }, [navigateToFolder]);

  const handleFileDoubleClick = useCallback((file: FileResponse) => {
    setPreviewFile(file);
  }, []);

  // Context menu handler
  const handleContextMenu = useCallback((id: string, type: 'file' | 'folder', event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY, itemId: id, itemType: type });
  }, []);

  // Get context menu items based on item type
  const getContextMenuItems = useCallback((): ContextMenuItem[] => {
    if (!contextMenu) return [];

    const { itemId, itemType } = contextMenu;
    const items: ContextMenuItem[] = [];

    // Check both regular arrays and search results
    const allFolders = searchResults ? searchResults.folders : folders;
    const allFiles = searchResults ? searchResults.files : files;

    if (itemType === 'folder') {
      const folder = allFolders.find(f => f.id === itemId);
      if (!folder) return [];

      items.push(
        { id: 'open', label: 'Open', icon: ContextMenuIcons.open, onClick: () => navigateToFolder(itemId) },
        { id: 'rename', label: 'Rename', icon: ContextMenuIcons.rename, onClick: () => setRenameItem({ id: itemId, type: 'folder', name: folder.name, description: folder.description }) },
        { id: 'move', label: 'Move To...', icon: ContextMenuIcons.move, onClick: () => setMoveItem({ id: itemId, type: 'folder', name: folder.name }) },
        { id: 'info', label: 'Get Info', icon: ContextMenuIcons.info, onClick: () => setDetailsItem({ item: folder, type: 'folder' }) },
        { id: 'delete', label: 'Delete', icon: ContextMenuIcons.delete, onClick: () => setItemsToDelete([{ id: itemId, type: 'folder', name: folder.name }]), danger: true, divider: true }
      );
    } else {
      const file = allFiles.find(f => f.id === itemId);
      if (!file) return [];

      items.push(
        { id: 'preview', label: 'Preview', icon: ContextMenuIcons.preview, onClick: () => setPreviewFile(file) },
        { id: 'download', label: 'Download', icon: ContextMenuIcons.download, onClick: () => handleDownload(file) },
        { id: 'link', label: 'Link to Entity...', icon: ContextMenuIcons.copy, onClick: () => setLinkFileItem(file), divider: true },
        { id: 'move', label: 'Move To...', icon: ContextMenuIcons.move, onClick: () => setMoveItem({ id: itemId, type: 'file', name: file.fileName }) },
        { id: 'info', label: 'Get Info', icon: ContextMenuIcons.info, onClick: () => setDetailsItem({ item: file, type: 'file' }) },
        { id: 'delete', label: 'Delete', icon: ContextMenuIcons.delete, onClick: () => setItemsToDelete([{ id: itemId, type: 'file', name: file.fileName }]), danger: true, divider: true }
      );
    }

    return items;
  }, [contextMenu, folders, files, searchResults, navigateToFolder]);

  // Upload handlers
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: fileList.length });

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgress({ current: i + 1, total: fileList.length });

        await uploadFile({
          file,
          fileName: file.name,
          folderId: currentFolderId || undefined,
          fileEntityType: 'UNDEFINED', // Files uploaded from /files page are not linked to specific entity types
        });
      }

      showSuccessToast('Files uploaded', {
        description: `${fileList.length} file(s) uploaded successfully`,
      });
      await loadContents();
    } catch (error) {
      showErrorToast('Upload failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [currentFolderId, loadContents]);

  // Drag and drop handlers (only allow in folders, not at root)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentFolderId) {
      setIsDragging(true);
    }
  }, [currentFolderId]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (currentFolderId) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload, currentFolderId]);

  // Delete handlers
  const handleDeleteClick = useCallback(() => {
    const items = getSelectedItemsList();
    if (items.length > 0) {
      setItemsToDelete(items);
    }
  }, [getSelectedItemsList]);

  const confirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      for (const item of itemsToDelete) {
        if (item.type === 'folder') {
          await deleteFolder(item.id);
        } else {
          await deleteFile(item.id);
        }
      }

      showSuccessToast('Items deleted', {
        description: `${itemsToDelete.length} item(s) deleted successfully`,
      });
      clearSelection();
      setItemsToDelete([]);
      await loadContents();
    } catch (error) {
      showErrorToast('Delete failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [itemsToDelete, clearSelection, loadContents]);

  // Create folder handler (for modal)
  const handleCreateFolder = useCallback(async (name: string, description?: string) => {
    try {
      await createFolder({
        name,
        description,
        parentId: currentFolderId || undefined,
      });
      showSuccessToast('Folder created', {
        description: `"${name}" created successfully`,
      });
      setShowCreateFolderModal(false);
      await loadContents();
    } catch (error) {
      showErrorToast('Failed to create folder', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }, [currentFolderId, loadContents]);

  // Inline folder creation handler (Windows-style)
  const handleCreateFolderInline = useCallback(async (name: string) => {
    try {
      await createFolder({
        name,
        parentId: currentFolderId || undefined,
      });
      showSuccessToast('Folder created', {
        description: `"${name}" created successfully`,
      });
      setIsCreatingFolderInline(false);
      await loadContents();
    } catch (error) {
      showErrorToast('Failed to create folder', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }, [currentFolderId, loadContents]);

  // Start inline folder creation
  const startInlineFolderCreation = useCallback(() => {
    setIsCreatingFolderInline(true);
    clearSelection();
  }, [clearSelection]);

  // Rename handler
  const handleRename = useCallback(async (name: string, description?: string) => {
    if (!renameItem) return;

    try {
      if (renameItem.type === 'folder') {
        await updateFolder({
          folderId: renameItem.id,
          name,
          description,
        });
        showSuccessToast('Folder updated', {
          description: `"${name}" updated successfully`,
        });
      }
      // File rename would need a separate API endpoint
      setRenameItem(null);
      await loadContents();
    } catch (error) {
      showErrorToast('Failed to rename', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }, [renameItem, loadContents]);

  // Move handler
  const handleMove = useCallback(async (destinationFolderId: string | null) => {
    if (!moveItem) return;

    try {
      if (moveItem.type === 'folder') {
        await updateFolder({
          folderId: moveItem.id,
          parentId: destinationFolderId || undefined,
        });
      }
      // File move would update the file's folderId
      showSuccessToast('Item moved', {
        description: `"${moveItem.name}" moved successfully`,
      });
      setMoveItem(null);
      await loadContents();
    } catch (error) {
      showErrorToast('Failed to move', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }, [moveItem, loadContents]);

  // Download handler
  const handleDownload = useCallback(async (file: FileResponse) => {
    try {
      const url = await getFilePresignedUrl(file.id);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      showErrorToast('Download failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDelete: handleDeleteClick,
    onSelectAll: selectAll,
    onEscape: () => {
      clearSelection();
      setContextMenu(null);
    },
    onEnter: () => {
      const items = getSelectedItemsList();
      if (items.length === 1) {
        if (items[0].type === 'folder') {
          const folder = folders.find(f => f.id === items[0].id);
          if (folder) handleFolderDoubleClick(folder);
        } else {
          const file = files.find(f => f.id === items[0].id);
          if (file) handleFileDoubleClick(file);
        }
      }
    },
  });

  // Sort items
  const sortItems = useCallback(<T extends { name?: string; fileName?: string; createdAt?: string; fileSize?: number; fileType?: string }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          const nameA = ('fileName' in a ? a.fileName : a.name) || '';
          const nameB = ('fileName' in b ? b.fileName : b.name) || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'date':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'size':
          comparison = (a.fileSize || 0) - (b.fileSize || 0);
          break;
        case 'type':
          comparison = (a.fileType || '').localeCompare(b.fileType || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [sortField, sortDirection]);

  // Get display items (sorted, possibly filtered by search, paginated)
  const sortedFolders = useMemo(() => searchResults ? sortItems(searchResults.folders) : sortItems(folders), [searchResults, folders, sortItems]);
  const sortedFiles = useMemo(() => searchResults ? sortItems(searchResults.files) : sortItems(files), [searchResults, files, sortItems]);

  // Apply pagination
  const displayFolders = useMemo(() => sortedFolders.slice(0, displayLimit), [sortedFolders, displayLimit]);
  const displayFiles = useMemo(() => {
    const remainingSlots = Math.max(0, displayLimit - sortedFolders.length);
    return sortedFiles.slice(0, remainingSlots);
  }, [sortedFiles, sortedFolders.length, displayLimit]);

  const totalItems = sortedFolders.length + sortedFiles.length;
  const displayedItems = displayFolders.length + displayFiles.length;
  const hasMore = displayedItems < totalItems;

  const isEmpty = sortedFolders.length === 0 && sortedFiles.length === 0;
  const selectedCount = selectedItems.size;

  return (
    <main
      className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header with breadcrumbs and toolbar */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--card)]">
        {isEntityMode ? (
          <EntityModeSelector
            selectedEntity={selectedEntity}
            onSelectEntity={setSelectedEntity}
            onExitEntityMode={handleExitEntityMode}
          />
        ) : (
          <>
            <Breadcrumbs
              path={folderPath}
              onNavigate={navigateToFolder}
              isSearching={!!searchTerm}
            />
            <Toolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedCount={selectedCount}
              onUpload={handleUploadClick}
              onNewFolder={viewMode === 'grid' ? startInlineFolderCreation : () => setShowCreateFolderModal(true)}
              onDelete={handleDeleteClick}
              onViewFilesByEntity={() => setIsEntityMode(true)}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              isSearching={isSearching}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={(field, direction) => {
                setSortField(field);
                setSortDirection(direction);
              }}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              canUpload={!!currentFolderId}
            />
          </>
        )}
      </div>

      {/* Quick Access Section (only at root and not searching, not in entity mode) */}
      {!isEntityMode && !currentFolderId && !searchTerm && recentFiles.length > 0 && (
        <QuickAccess
          recentFiles={recentFiles}
          onFileClick={handleFileDoubleClick}
        />
      )}

      {/* Main content area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-auto p-6 relative"
        onScroll={handleScroll}
        onClick={() => {
          clearSelection();
          setContextMenu(null);
        }}
      >
        {isEntityMode ? (
          // Entity Mode: Show files linked to selected entity
          isLoadingEntityFiles ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[var(--muted-foreground)]">Loading files...</p>
              </div>
            </div>
          ) : !selectedEntity ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-600">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path d="M14 2v6h6" />
                    <circle cx="11" cy="14" r="3" />
                    <path d="M21 21l-2.5-2.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">View Files by Entity</h3>
                <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
                  Select an entity type above and search for an entity to view its linked files.
                </p>
              </div>
            </div>
          ) : entityFiles.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted-foreground)]">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No Files Linked</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  This entity doesn&apos;t have any files linked to it yet.
                </p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div onClick={(e) => e.stopPropagation()}>
              <GridView
                folders={[]}
                files={sortItems(entityFiles)}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                onItemClick={handleItemClick}
                onCheckboxClick={handleCheckboxClick}
                onFolderDoubleClick={handleFolderDoubleClick}
                onFileDoubleClick={handleFileDoubleClick}
                onContextMenu={handleContextMenu}
                onDownload={handleDownload}
                isCreatingFolder={false}
                onCreateFolder={async () => {}}
                onCancelCreateFolder={() => {}}
              />
            </div>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <ListView
                folders={[]}
                files={sortItems(entityFiles)}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                onItemClick={handleItemClick}
                onCheckboxClick={handleCheckboxClick}
                onFolderDoubleClick={handleFolderDoubleClick}
                onFileDoubleClick={handleFileDoubleClick}
                onContextMenu={handleContextMenu}
                onDownload={handleDownload}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={(field, direction) => {
                  setSortField(field);
                  setSortDirection(direction);
                }}
              />
            </div>
          )
        ) : (
          // Normal Mode: Show folder contents
          isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
              </div>
            </div>
          ) : isEmpty ? (
            <EmptyState
              isSearch={!!searchTerm}
              searchTerm={searchTerm}
              onUpload={handleUploadClick}
              onNewFolder={() => setShowCreateFolderModal(true)}
            />
          ) : viewMode === 'grid' ? (
            <div onClick={(e) => e.stopPropagation()}>
              <GridView
                folders={displayFolders}
                files={displayFiles}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                onItemClick={handleItemClick}
                onCheckboxClick={handleCheckboxClick}
                onFolderDoubleClick={handleFolderDoubleClick}
                onFileDoubleClick={handleFileDoubleClick}
                onContextMenu={handleContextMenu}
                onDownload={handleDownload}
                isCreatingFolder={isCreatingFolderInline}
                onCreateFolder={handleCreateFolderInline}
                onCancelCreateFolder={() => setIsCreatingFolderInline(false)}
              />
              {hasMore && (
                <div className="flex justify-center py-8">
                  <button
                    onClick={() => setDisplayLimit(prev => prev + ITEMS_PER_PAGE)}
                    className="px-4 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                  >
                    Load more ({displayedItems} of {totalItems})
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <ListView
                folders={displayFolders}
                files={displayFiles}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                onItemClick={handleItemClick}
                onCheckboxClick={handleCheckboxClick}
                onFolderDoubleClick={handleFolderDoubleClick}
                onFileDoubleClick={handleFileDoubleClick}
                onContextMenu={handleContextMenu}
                onDownload={handleDownload}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={(field, direction) => {
                  setSortField(field);
                  setSortDirection(direction);
                }}
              />
              {hasMore && (
                <div className="flex justify-center py-8">
                  <button
                    onClick={() => setDisplayLimit(prev => prev + ITEMS_PER_PAGE)}
                    className="px-4 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                  >
                    Load more ({displayedItems} of {totalItems})
                  </button>
                </div>
              )}
            </div>
          )
        )}

        {/* Drop zone overlay */}
        <DropZoneOverlay isVisible={isDragging} />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Modals */}
      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onSubmit={handleCreateFolder}
      />

      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
      />

      <DeleteConfirmModal
        isOpen={itemsToDelete.length > 0}
        items={itemsToDelete}
        isPending={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setItemsToDelete([])}
      />

      <RenameModal
        isOpen={!!renameItem}
        currentName={renameItem?.name || ''}
        itemType={renameItem?.type || 'folder'}
        description={renameItem?.description}
        onClose={() => setRenameItem(null)}
        onSubmit={handleRename}
      />

      <ItemDetailsModal
        item={detailsItem?.item || null}
        type={detailsItem?.type || 'file'}
        isOpen={!!detailsItem}
        onClose={() => setDetailsItem(null)}
      />

      <MoveItemModal
        isOpen={!!moveItem}
        itemName={moveItem?.name || ''}
        itemType={moveItem?.type || 'folder'}
        currentFolderId={currentFolderId}
        excludeFolderId={moveItem?.type === 'folder' ? moveItem.id : undefined}
        onClose={() => setMoveItem(null)}
        onMove={handleMove}
      />

      {/* Link File to Entity Modal */}
      {linkFileItem && (
        <LinkFileToEntityModal
          isOpen={!!linkFileItem}
          fileId={linkFileItem.id}
          fileName={linkFileItem.fileName}
          onClose={() => setLinkFileItem(null)}
          onSuccess={() => setLinkFileItem(null)}
        />
      )}
    </main>
  );
}
