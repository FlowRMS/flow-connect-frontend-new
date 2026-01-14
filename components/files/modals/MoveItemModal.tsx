'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchRootFolders, fetchFoldersByParent, type FolderResponse } from '../../lib/graphql/files';

interface MoveItemModalProps {
  isOpen: boolean;
  itemName: string;
  itemType: 'file' | 'folder';
  currentFolderId: string | null;
  excludeFolderId?: string; // For folders, exclude the folder being moved
  onClose: () => void;
  onMove: (destinationFolderId: string | null) => Promise<void>;
}

interface FolderNode extends FolderResponse {
  children?: FolderNode[];
  isLoading?: boolean;
  isExpanded?: boolean;
}

export function MoveItemModal({
  isOpen,
  itemName,
  itemType,
  currentFolderId,
  excludeFolderId,
  onClose,
  onMove,
}: MoveItemModalProps) {
  const [rootFolders, setRootFolders] = useState<FolderNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderChildren, setFolderChildren] = useState<Map<string, FolderNode[]>>(new Map());
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());

  // Load root folders
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      setSelectedFolderId(null);
      setExpandedFolders(new Set());
      setFolderChildren(new Map());

      fetchRootFolders()
        .then((folders) => {
          const filtered = excludeFolderId
            ? folders.filter(f => f.id !== excludeFolderId)
            : folders;
          setRootFolders(filtered);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load folders');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, excludeFolderId]);

  // Load children for a folder
  const loadChildren = useCallback(async (folderId: string) => {
    if (folderChildren.has(folderId)) return;

    setLoadingFolders(prev => new Set(prev).add(folderId));

    try {
      const children = await fetchFoldersByParent(folderId);
      const filtered = excludeFolderId
        ? children.filter(f => f.id !== excludeFolderId)
        : children;
      setFolderChildren(prev => new Map(prev).set(folderId, filtered));
    } catch (err) {
      console.error('Failed to load folder children:', err);
    } finally {
      setLoadingFolders(prev => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
    }
  }, [excludeFolderId, folderChildren]);

  // Toggle folder expansion
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
        loadChildren(folderId);
      }
      return next;
    });
  }, [loadChildren]);

  // Handle move
  const handleMove = async () => {
    setIsMoving(true);
    setError(null);

    try {
      await onMove(selectedFolderId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move item');
    } finally {
      setIsMoving(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isMoving) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isMoving, onClose]);

  if (!isOpen) return null;

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isLoadingChildren = loadingFolders.has(folder.id);
    const children = folderChildren.get(folder.id) || [];
    const isCurrentFolder = folder.id === currentFolderId;

    return (
      <div key={folder.id}>
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
            ${selectedFolderId === folder.id
              ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
              : isCurrentFolder
                ? 'bg-[var(--muted)]/50 opacity-50 cursor-not-allowed'
                : 'hover:bg-[var(--muted)]'
            }
          `}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => !isCurrentFolder && setSelectedFolderId(folder.id)}
        >
          {/* Expand/collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isCurrentFolder) toggleFolder(folder.id);
            }}
            className="w-5 h-5 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {isLoadingChildren ? (
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </button>

          {/* Folder icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-500 flex-shrink-0">
            <path
              d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>

          {/* Folder name */}
          <span className="text-sm truncate flex-1">{folder.name}</span>

          {/* Current location indicator */}
          {isCurrentFolder && (
            <span className="text-xs text-[var(--muted-foreground)]">(current)</span>
          )}

          {/* Selected indicator */}
          {selectedFolderId === folder.id && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[var(--primary)]">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </div>

        {/* Children */}
        {isExpanded && children.length > 0 && (
          <div>
            {children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Move {itemType === 'folder' ? 'Folder' : 'File'}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] truncate max-w-[200px]" title={itemName}>
                {itemName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isMoving}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Root option */}
          <div
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-2
              ${selectedFolderId === null
                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                : currentFolderId === null
                  ? 'bg-[var(--muted)]/50 opacity-50 cursor-not-allowed'
                  : 'hover:bg-[var(--muted)]'
              }
            `}
            onClick={() => currentFolderId !== null && setSelectedFolderId(null)}
          >
            <div className="w-5" />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
            <span className="text-sm">Root (Files)</span>
            {currentFolderId === null && (
              <span className="text-xs text-[var(--muted-foreground)]">(current)</span>
            )}
            {selectedFolderId === null && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[var(--primary)] ml-auto">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>

          <div className="border-t border-[var(--border)] pt-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : rootFolders.length === 0 ? (
              <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">
                No folders available
              </div>
            ) : (
              rootFolders.map(folder => renderFolder(folder))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isMoving}
            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={isMoving || (selectedFolderId === currentFolderId)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50"
          >
            {isMoving ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Moving...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Move Here
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
