'use client';

import React from 'react';
import type { SpecSheetFolder } from '../../lib/types/submittals';
import { ManufacturerRow } from './manufacturer-modal';

interface ManufacturerManagementModalProps {
  onClose: () => void;
  manufacturers: { id: string; name: string }[];
  manufacturerCounts: Record<string, number>;
  expandedManufacturers: Set<string>;
  toggleManufacturer: (manufacturer: string) => void;
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
  editingManufacturerIndex: number | null;
  editingManufacturerName: string;
  setEditingManufacturerName: (name: string) => void;
  handleRenameManufacturer: (index: number) => void;
  handleSaveManufacturerRename: () => void;
  handleDeleteManufacturer: (index: number) => void;
  handleAddManufacturer: () => void;
  draggedManufacturerIndex: number | null;
  dragOverIndex: number | null;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (index: number) => void;
  handleDragEnd: () => void;
  getAllFoldersForManufacturer: (manufacturer: string) => SpecSheetFolder[];
  getChildFoldersFromAll: (parentId: string, manufacturer: string) => SpecSheetFolder[];
  getFolderCountForManufacturer: (manufacturer: string) => number;
  getFolderSpecSheetCount: (folderId: string, manufacturer: string) => number;
  editingFolderId: string | null;
  editingFolderName: string;
  setEditingFolderName: (name: string) => void;
  handleRenameFolder: (folder: SpecSheetFolder) => void;
  handleSaveRename: () => void;
  setEditingFolderId: (id: string | null) => void;
  handleDeleteFolder: (folder: SpecSheetFolder) => void;
  handleAddSubfolder: (folder: SpecSheetFolder) => void;
  handleAddRootFolder: (manufacturer: string, manufacturerId?: string) => void;
  draggedFolderId: string | null;
  dragOverFolderId: string | null;
  handleFolderDragStart: (e: React.DragEvent, folderId: string) => void;
  handleFolderDragOver: (e: React.DragEvent, folderId: string) => void;
  handleFolderDragLeave: (e: React.DragEvent) => void;
  handleFolderDrop: (e: React.DragEvent, targetFolderId: string | null, targetManufacturer?: string) => void;
  handleFolderDragEnd: () => void;
  setDragOverFolderId: (id: string | null) => void;
  folderError: string | null;
  setFolderError: (error: string | null) => void;
  isSavingFolder: boolean;
  isLoadingFolders: boolean;
  isLoadingAllFolders: boolean;
  folders: SpecSheetFolder[];
}

export function ManufacturerManagementModal({
  onClose,
  manufacturers,
  manufacturerCounts,
  expandedManufacturers,
  toggleManufacturer,
  expandedFolders,
  toggleFolder,
  editingManufacturerIndex,
  editingManufacturerName,
  setEditingManufacturerName,
  handleRenameManufacturer,
  handleSaveManufacturerRename,
  handleDeleteManufacturer,
  handleAddManufacturer,
  draggedManufacturerIndex,
  dragOverIndex,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  getAllFoldersForManufacturer,
  getChildFoldersFromAll,
  getFolderCountForManufacturer,
  getFolderSpecSheetCount,
  editingFolderId,
  editingFolderName,
  setEditingFolderName,
  handleRenameFolder,
  handleSaveRename,
  setEditingFolderId,
  handleDeleteFolder,
  handleAddSubfolder,
  handleAddRootFolder,
  draggedFolderId,
  dragOverFolderId,
  handleFolderDragStart,
  handleFolderDragOver,
  handleFolderDragLeave,
  handleFolderDrop,
  handleFolderDragEnd,
  setDragOverFolderId,
  folderError,
  setFolderError,
  isSavingFolder,
  isLoadingFolders,
  isLoadingAllFolders,
  folders,
}: ManufacturerManagementModalProps) {
  const folderTreeProps = {
    expandedFolders,
    toggleFolder,
    editingFolderId,
    editingFolderName,
    setEditingFolderName,
    handleSaveRename,
    setEditingFolderId,
    handleRenameFolder,
    handleDeleteFolder,
    handleAddSubfolder,
    draggedFolderId,
    dragOverFolderId,
    handleFolderDragStart,
    handleFolderDragOver,
    handleFolderDragLeave,
    handleFolderDrop,
    handleFolderDragEnd,
    getChildFoldersFromAll,
    getFolderSpecSheetCount,
  };

  const handleClose = () => {
    onClose();
    setFolderError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-[var(--card)] rounded-xl shadow-xl w-full max-w-3xl mx-4 h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h3 className="font-semibold text-[var(--foreground)] text-xl">Manage Manufacturers & Folders</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Drag to reorder, click names to rename, expand to see folder hierarchy</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Error Banner */}
        {folderError && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v4M10 14h.01"/>
              </svg>
              <span className="text-sm">{folderError}</span>
            </div>
            <button
              onClick={() => setFolderError(null)}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {(isSavingFolder || isLoadingFolders || isLoadingAllFolders) && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-xl">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg">
              <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--muted-foreground)]">
                {isSavingFolder ? 'Saving...' : 'Loading folders...'}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {manufacturers.map((mfr, index) => (
              <ManufacturerRow
                key={mfr.id}
                manufacturer={mfr.name}
                manufacturerId={mfr.id}
                index={index}
                isEditing={editingManufacturerIndex === index}
                isDragging={draggedManufacturerIndex === index}
                isDragOver={dragOverIndex === index}
                count={manufacturerCounts[mfr.name] || 0}
                folderCount={getFolderCountForManufacturer(mfr.name)}
                manufacturerFolders={getAllFoldersForManufacturer(mfr.name)}
                isExpanded={expandedManufacturers.has(mfr.name)}
                editingManufacturerName={editingManufacturerName}
                setEditingManufacturerName={setEditingManufacturerName}
                handleSaveManufacturerRename={handleSaveManufacturerRename}
                handleRenameManufacturer={handleRenameManufacturer}
                handleDeleteManufacturer={handleDeleteManufacturer}
                handleAddRootFolder={handleAddRootFolder}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                handleDragEnd={handleDragEnd}
                toggleManufacturer={toggleManufacturer}
                draggedFolderId={draggedFolderId}
                dragOverFolderId={dragOverFolderId}
                setDragOverFolderId={setDragOverFolderId}
                handleFolderDrop={handleFolderDrop}
                folderTreeProps={folderTreeProps}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <button
            onClick={handleAddManufacturer}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            Add Manufacturer
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--muted-foreground)]">
              {manufacturers.length} manufacturer{manufacturers.length !== 1 ? 's' : ''} · {folders.length} folder{folders.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
