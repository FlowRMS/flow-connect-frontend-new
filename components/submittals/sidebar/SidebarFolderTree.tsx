'use client';

import React from 'react';
import type { SpecSheetFolder } from '../../../lib/types/submittals';

interface SidebarFolderTreeProps {
  folders: SpecSheetFolder[];
  depth: number;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  expandedFolders: Set<string>;
  toggleFolder: (folderId: string) => void;
  editingFolderId: string | null;
  editingFolderName: string;
  setEditingFolderName: (name: string) => void;
  handleSaveRename: () => void;
  setEditingFolderId: (id: string | null) => void;
  handleFolderContextMenu: (e: React.MouseEvent, folder: SpecSheetFolder) => void;
  selectManufacturerByName: (name: string) => void;
  getFolderCount: (folderId: string) => number;
  getChildFoldersLocal: (parentId: string) => SpecSheetFolder[];
  // Drag & drop for spec sheets
  specSheetDragOverFolderId?: string | null;
  setSpecSheetDragOverFolderId?: (id: string | null) => void;
  onSpecSheetDrop?: (specSheetIdOrIds: string | string[], folderId: string, folderName?: string) => void;
}

export function SidebarFolderTree({
  folders,
  depth,
  selectedFolderId,
  setSelectedFolderId,
  expandedFolders,
  toggleFolder,
  editingFolderId,
  editingFolderName,
  setEditingFolderName,
  handleSaveRename,
  setEditingFolderId,
  handleFolderContextMenu,
  selectManufacturerByName,
  getFolderCount,
  getChildFoldersLocal,
  specSheetDragOverFolderId,
  setSpecSheetDragOverFolderId,
  onSpecSheetDrop,
}: SidebarFolderTreeProps) {
  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (setSpecSheetDragOverFolderId) {
      setSpecSheetDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    if (setSpecSheetDragOverFolderId) {
      setSpecSheetDragOverFolderId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, folder: SpecSheetFolder) => {
    e.preventDefault();
    e.stopPropagation();
    if (setSpecSheetDragOverFolderId) {
      setSpecSheetDragOverFolderId(null);
    }
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'specSheet' && onSpecSheetDrop && folder.id) {
        // Use ids array if available (multi-select), otherwise fall back to single id
        const idsToMove = data.ids && Array.isArray(data.ids) ? data.ids : [data.id];
        onSpecSheetDrop(idsToMove, folder.id, folder.name);
      }
    } catch {
      // Invalid drag data, ignore
    }
  };

  return (
    <>
      {folders.map(folder => {
        const childFolders = getChildFoldersLocal(folder.id);
        const hasChildren = childFolders.length > 0;
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = selectedFolderId === folder.id;
        const isEditing = editingFolderId === folder.id;
        const count = hasChildren && isExpanded ? null : getFolderCount(folder.id);
        const isDragOver = specSheetDragOverFolderId === folder.id;

        return (
          <div key={folder.id}>
            <div
              onClick={() => {
                if (!isEditing) {
                  if (hasChildren) toggleFolder(folder.id);
                  setSelectedFolderId(isSelected ? null : folder.id);
                  if (folder.manufacturer) selectManufacturerByName(folder.manufacturer);
                }
              }}
              onContextMenu={(e) => handleFolderContextMenu(e, folder)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--muted)]/50 transition-colors cursor-pointer group ${
                isSelected ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--foreground)]'
              } ${isDragOver ? 'bg-[var(--primary)]/20 ring-2 ring-[var(--primary)] ring-inset' : ''}`}
              style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
              {hasChildren ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                >
                  <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <span className="w-3 flex-shrink-0" />
              )}
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted-foreground)] flex-shrink-0">
                <path d="M3 5a2 2 0 012-2h3.172a2 2 0 011.414.586l.828.828a2 2 0 001.414.586H15a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"/>
              </svg>
              {isEditing ? (
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
                  className="flex-1 px-1 py-0.5 text-sm border border-[var(--primary)] rounded bg-[var(--background)] focus:outline-none"
                />
              ) : (
                <span className="flex-1 truncate text-left">{folder.name}</span>
              )}
              {count !== null && count > 0 && !isEditing && (
                <span className="text-xs text-[var(--muted-foreground)]">{count}</span>
              )}
              {!isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFolderContextMenu(e, folder);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[var(--muted)] rounded transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="5" r="1"/>
                    <circle cx="10" cy="10" r="1"/>
                    <circle cx="10" cy="15" r="1"/>
                  </svg>
                </button>
              )}
            </div>
            {hasChildren && isExpanded && (
              <SidebarFolderTree
                folders={childFolders}
                depth={depth + 1}
                selectedFolderId={selectedFolderId}
                setSelectedFolderId={setSelectedFolderId}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                editingFolderId={editingFolderId}
                editingFolderName={editingFolderName}
                setEditingFolderName={setEditingFolderName}
                handleSaveRename={handleSaveRename}
                setEditingFolderId={setEditingFolderId}
                handleFolderContextMenu={handleFolderContextMenu}
                selectManufacturerByName={selectManufacturerByName}
                getFolderCount={getFolderCount}
                getChildFoldersLocal={getChildFoldersLocal}
                specSheetDragOverFolderId={specSheetDragOverFolderId}
                setSpecSheetDragOverFolderId={setSpecSheetDragOverFolderId}
                onSpecSheetDrop={onSpecSheetDrop}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
