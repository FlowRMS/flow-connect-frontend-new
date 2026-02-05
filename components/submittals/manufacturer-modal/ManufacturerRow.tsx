'use client';

import React from 'react';
import { FolderTreeItem } from './FolderTreeItem';
import type { ManufacturerRowProps } from './types';

export function ManufacturerRow({
  manufacturer,
  manufacturerId,
  index,
  isEditing,
  isDragging,
  isDragOver,
  count,
  folderCount,
  manufacturerFolders,
  isExpanded,
  editingManufacturerName,
  setEditingManufacturerName,
  handleSaveManufacturerRename,
  handleRenameManufacturer,
  handleDeleteManufacturer,
  handleAddRootFolder,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragEnd,
  toggleManufacturer,
  draggedFolderId,
  dragOverFolderId,
  setDragOverFolderId,
  handleFolderDrop,
  folderTreeProps,
}: ManufacturerRowProps) {
  return (
    <div
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
              if (e.key === 'Escape') handleSaveManufacturerRename();
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
                handleAddRootFolder(manufacturer, manufacturerId);
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
              {manufacturerFolders.map(folder => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  manufacturer={manufacturer}
                  depth={0}
                  {...folderTreeProps}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 text-center">
              <div>
                <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted-foreground)] mx-auto mb-2 opacity-50">
                  <path d="M3 5a2 2 0 012-2h3.172a2 2 0 011.414.586l.828.828a2 2 0 001.414.586H15a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
                </svg>
                <p className="text-sm text-[var(--muted-foreground)]">No folders yet</p>
                <button
                  onClick={() => handleAddRootFolder(manufacturer, manufacturerId)}
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
}
