'use client';

import React, { useRef, useEffect } from 'react';
import type { FolderTreeItemProps } from './types';

export function FolderTreeItem({
  folder,
  manufacturer,
  depth,
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
}: FolderTreeItemProps) {
  const childFolders = getChildFoldersFromAll(folder.id, manufacturer);
  const hasChildren = childFolders.length > 0;
  const isFolderExpanded = expandedFolders.has(folder.id);
  const isFolderEditing = editingFolderId === folder.id;
  const specSheetCount = hasChildren && isFolderExpanded ? null : getFolderSpecSheetCount(folder.id, manufacturer);
  const isFolderDragging = draggedFolderId === folder.id;
  const isFolderDragOver = dragOverFolderId === folder.id;

  // Refs to track blur timeout and edit start time
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editStartTimeRef = useRef<number>(0);

  // Track when edit mode starts to ignore early blur events
  useEffect(() => {
    if (isFolderEditing) {
      editStartTimeRef.current = Date.now();
    }
  }, [isFolderEditing]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleBlur = (e: React.FocusEvent) => {
    // Ignore blur events that happen too quickly after edit mode starts
    // This prevents race conditions during initial render
    const timeSinceEditStart = Date.now() - editStartTimeRef.current;
    if (timeSinceEditStart < 300) {
      // Re-focus the input if blur happened too early
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      return;
    }

    // Check if the new focus target is within the same folder item
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget?.closest('[data-folder-actions]')) {
      return;
    }

    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // On blur, cancel editing without auto-saving
    // User must press Enter to save changes
    blurTimeoutRef.current = setTimeout(() => {
      setEditingFolderId(null);
      setEditingFolderName('');
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Clear blur timeout since we're saving explicitly
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      handleSaveRename();
    }
    if (e.key === 'Escape') {
      // Clear blur timeout since we're canceling
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      setEditingFolderId(null);
      setEditingFolderName('');
    }
  };

  return (
    <div>
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
            ref={inputRef}
            type="text"
            value={editingFolderName}
            onChange={(e) => setEditingFolderName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
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
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" data-folder-actions>
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

      {/* Render children recursively */}
      {hasChildren && isFolderExpanded && childFolders.map(childFolder => (
        <FolderTreeItem
          key={childFolder.id}
          folder={childFolder}
          manufacturer={manufacturer}
          depth={depth + 1}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
          editingFolderId={editingFolderId}
          editingFolderName={editingFolderName}
          setEditingFolderName={setEditingFolderName}
          handleSaveRename={handleSaveRename}
          setEditingFolderId={setEditingFolderId}
          handleRenameFolder={handleRenameFolder}
          handleDeleteFolder={handleDeleteFolder}
          handleAddSubfolder={handleAddSubfolder}
          draggedFolderId={draggedFolderId}
          dragOverFolderId={dragOverFolderId}
          handleFolderDragStart={handleFolderDragStart}
          handleFolderDragOver={handleFolderDragOver}
          handleFolderDragLeave={handleFolderDragLeave}
          handleFolderDrop={handleFolderDrop}
          handleFolderDragEnd={handleFolderDragEnd}
          getChildFoldersFromAll={getChildFoldersFromAll}
          getFolderSpecSheetCount={getFolderSpecSheetCount}
        />
      ))}
    </div>
  );
}
