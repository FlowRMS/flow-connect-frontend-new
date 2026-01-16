'use client';

import React from 'react';
import type { SpecSheetFolder } from '../../lib/types/submittals';

interface ManufacturerManagementModalProps {
  onClose: () => void;
  manufacturerList: string[];
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
  manufacturerList,
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
  // Recursive function to render folder tree in modal with drag-drop
  const renderModalFolderTree = (folderList: SpecSheetFolder[], manufacturer: string, depth: number = 0): React.ReactNode => {
    return folderList.map(folder => {
      const childFolders = getChildFoldersFromAll(folder.id, manufacturer);
      const hasChildren = childFolders.length > 0;
      const isFolderExpanded = expandedFolders.has(folder.id);
      const isFolderEditing = editingFolderId === folder.id;
      const specSheetCount = hasChildren && isFolderExpanded ? null : getFolderSpecSheetCount(folder.id, manufacturer);
      const isFolderDragging = draggedFolderId === folder.id;
      const isFolderDragOver = dragOverFolderId === folder.id;

      return (
        <div key={folder.id}>
          <div
            draggable={!isFolderEditing}
            onDragStart={(e) => handleFolderDragStart(e, folder.id)}
            onDragOver={(e) => handleFolderDragOver(e, folder.id)}
            onDragLeave={handleFolderDragLeave}
            onDrop={(e) => handleFolderDrop(e, folder.id, folder.manufacturer)}
            onDragEnd={handleFolderDragEnd}
            className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors group ${
              isFolderDragging
                ? 'opacity-50 bg-[var(--primary)]/10'
                : isFolderDragOver
                ? 'bg-[var(--primary)]/20 ring-2 ring-[var(--primary)] ring-inset'
                : 'hover:bg-[var(--muted)]/50'
            }`}
            style={{ marginLeft: `${depth * 24}px` }}
          >
            {/* Drag handle */}
            <div className="cursor-grab active:cursor-grabbing text-[var(--muted-foreground)] hover:text-[var(--foreground)] opacity-50 group-hover:opacity-100">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="7" cy="6" r="1.5"/>
                <circle cx="13" cy="6" r="1.5"/>
                <circle cx="7" cy="10" r="1.5"/>
                <circle cx="13" cy="10" r="1.5"/>
                <circle cx="7" cy="14" r="1.5"/>
                <circle cx="13" cy="14" r="1.5"/>
              </svg>
            </div>

            {/* Expand/collapse button */}
            <button
              onClick={() => hasChildren && toggleFolder(folder.id)}
              className={`w-5 h-5 flex items-center justify-center ${hasChildren ? 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]' : 'invisible'}`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${isFolderExpanded ? 'rotate-90' : ''}`}
              >
                <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Folder icon */}
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-yellow-500 flex-shrink-0">
              <path d="M3 5a2 2 0 012-2h3.172a2 2 0 011.414.586l.828.828a2 2 0 001.414.586H15a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
            </svg>

            {/* Folder name / edit input */}
            {isFolderEditing ? (
              <input
                type="text"
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') {
                    setEditingFolderId(null);
                    setEditingFolderName('');
                  }
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-2 py-0.5 text-sm border border-[var(--primary)] rounded bg-[var(--background)] focus:outline-none"
              />
            ) : (
              <span
                onClick={() => handleRenameFolder(folder)}
                className="flex-1 text-sm text-[var(--foreground)] cursor-pointer hover:text-[var(--primary)]"
                title="Click to rename"
              >
                {folder.name}
              </span>
            )}

            {/* Folder spec sheet count */}
            {specSheetCount !== null && specSheetCount > 0 && !isFolderEditing && (
              <span className="text-xs text-[var(--muted-foreground)]">{specSheetCount}</span>
            )}

            {/* Folder actions */}
            {!isFolderEditing && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddSubfolder(folder);
                  }}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                  title="Add subfolder"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameFolder(folder);
                  }}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                  title="Rename"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder);
                  }}
                  className="p-1 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete folder"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
          {hasChildren && isFolderExpanded && renderModalFolderTree(childFolders, manufacturer, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          onClose();
          setFolderError(null);
        }}
      />
      <div className="relative bg-[var(--card)] rounded-xl shadow-xl w-full max-w-3xl mx-4 h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h3 className="font-semibold text-[var(--foreground)] text-xl">Manage Manufacturers & Folders</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Drag to reorder, click names to rename, expand to see folder hierarchy</p>
          </div>
          <button
            onClick={() => {
              onClose();
              setFolderError(null);
            }}
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

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {manufacturerList.map((manufacturer, index) => {
              const isEditing = editingManufacturerIndex === index;
              const isDragging = draggedManufacturerIndex === index;
              const isDragOver = dragOverIndex === index;
              const count = manufacturerCounts[manufacturer] || 0;
              const folderCount = getFolderCountForManufacturer(manufacturer);
              const manufacturerFolders = getAllFoldersForManufacturer(manufacturer);
              const isExpanded = expandedManufacturers.has(manufacturer);

              return (
                <div
                  key={manufacturer}
                  className={`rounded-xl border transition-all ${
                    isDragging
                      ? 'opacity-50 border-[var(--primary)] bg-[var(--primary)]/5'
                      : isDragOver
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 border-dashed'
                      : 'border-[var(--border)] bg-[var(--card)]'
                  }`}
                >
                  {/* Manufacturer Header Row */}
                  <div
                    draggable={!isEditing}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {/* Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="7" cy="5" r="1.5"/>
                        <circle cx="13" cy="5" r="1.5"/>
                        <circle cx="7" cy="10" r="1.5"/>
                        <circle cx="13" cy="10" r="1.5"/>
                        <circle cx="7" cy="15" r="1.5"/>
                        <circle cx="13" cy="15" r="1.5"/>
                      </svg>
                    </div>

                    {/* Expand/Collapse */}
                    <button
                      onClick={() => toggleManufacturer(manufacturer)}
                      className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      >
                        <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {/* Manufacturer Icon */}
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                        <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                      </svg>
                    </div>

                    {/* Manufacturer Name / Edit Input */}
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingManufacturerName}
                        onChange={(e) => setEditingManufacturerName(e.target.value)}
                        onBlur={handleSaveManufacturerRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveManufacturerRename();
                          if (e.key === 'Escape') {
                            handleSaveManufacturerRename();
                          }
                        }}
                        autoFocus
                        className="flex-1 px-3 py-1.5 text-sm font-medium border border-[var(--primary)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    ) : (
                      <span
                        onClick={() => handleRenameManufacturer(index)}
                        className="flex-1 text-sm font-semibold text-[var(--foreground)] cursor-pointer hover:text-[var(--primary)]"
                        title="Click to rename"
                      >
                        {manufacturer}
                      </span>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2.5 py-1 rounded-full">
                        {count} sheet{count !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2.5 py-1 rounded-full">
                        {folderCount} folder{folderCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleAddRootFolder(manufacturer);
                          }}
                          className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                          title="Add folder"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleRenameManufacturer(index);
                          }}
                          className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                          title="Rename"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDeleteManufacturer(index);
                          }}
                          className="p-2 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={count > 0 ? `Cannot delete (${count} spec sheets)` : 'Delete'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded Folder Hierarchy */}
                  {isExpanded && (
                    <div
                      className={`border-t border-[var(--border)] bg-[var(--muted)]/20 px-4 py-3 ${
                        draggedFolderId && !dragOverFolderId ? 'ring-2 ring-inset ring-[var(--primary)]/30' : ''
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedFolderId) {
                          setDragOverFolderId(null);
                        }
                      }}
                      onDrop={(e) => handleFolderDrop(e, null, manufacturer)}
                    >
                      {manufacturerFolders.length > 0 ? (
                        <div className="space-y-0.5">
                          {renderModalFolderTree(manufacturerFolders, manufacturer)}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-6 text-center">
                          <div>
                            <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted-foreground)] mx-auto mb-2 opacity-50">
                              <path d="M3 5a2 2 0 012-2h3.172a2 2 0 011.414.586l.828.828a2 2 0 001.414.586H15a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
                            </svg>
                            <p className="text-sm text-[var(--muted-foreground)]">No folders yet</p>
                            <button
                              onClick={() => handleAddRootFolder(manufacturer)}
                              className="mt-2 text-xs text-[var(--primary)] hover:underline"
                            >
                              + Add first folder
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
              {manufacturerList.length} manufacturer{manufacturerList.length !== 1 ? 's' : ''} · {folders.length} folder{folders.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => {
                onClose();
                setFolderError(null);
              }}
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
