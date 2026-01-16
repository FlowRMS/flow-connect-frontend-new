'use client';

import React from 'react';
import type { SpecSheetFolder } from '../../lib/types/submittals';

interface AddFolderModalProps {
  onClose: () => void;
  newFolderParentId: string | null;
  newFolderManufacturer: string;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  handleCreateFolder: () => void;
  isCreatingFolder: boolean;
  folderError: string | null;
  setFolderError: (error: string | null) => void;
  folders: SpecSheetFolder[];
}

export function AddFolderModal({
  onClose,
  newFolderParentId,
  newFolderManufacturer,
  newFolderName,
  setNewFolderName,
  handleCreateFolder,
  isCreatingFolder,
  folderError,
  setFolderError,
  folders,
}: AddFolderModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-[var(--card)] rounded-xl shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">
            {newFolderParentId ? 'Add Subfolder' : 'Add Folder'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') onClose();
              }}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
          {newFolderManufacturer && (
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              This folder will be created under <span className="font-medium">{newFolderManufacturer}</span>
              {newFolderParentId && (
                <>
                  {' '}inside <span className="font-medium">{folders.find(f => f.id === newFolderParentId)?.name}</span>
                </>
              )}
            </p>
          )}
          {/* Error message */}
          {folderError && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{folderError}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                onClose();
                setFolderError(null);
              }}
              disabled={isCreatingFolder}
              className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || isCreatingFolder}
              className="px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreatingFolder && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isCreatingFolder ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
