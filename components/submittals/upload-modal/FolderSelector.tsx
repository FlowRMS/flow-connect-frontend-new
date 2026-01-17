'use client';

import React from 'react';

interface FolderSelectorProps {
  loadingFolders: boolean;
  folderOptions: string[];
  selectedFolderPath: string;
  setSelectedFolderPath: (path: string) => void;
  showNewFolder: boolean;
  setShowNewFolder: (show: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  handleAddFolder: () => void;
  handleClearFolder: () => void;
}

export function FolderSelector({
  loadingFolders,
  folderOptions,
  selectedFolderPath,
  setSelectedFolderPath,
  showNewFolder,
  setShowNewFolder,
  newFolderName,
  setNewFolderName,
  handleAddFolder,
  handleClearFolder,
}: FolderSelectorProps) {
  if (loadingFolders) {
    return (
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
          Folder <span className="text-[var(--muted-foreground)] font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          Loading folders...
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
        Folder <span className="text-[var(--muted-foreground)] font-normal">(optional)</span>
      </label>
      <div className="space-y-2">
        {selectedFolderPath ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--muted)] rounded-lg">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-yellow-500 flex-shrink-0">
              <path d="M3 4h5l2 2h7a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z"/>
            </svg>
            <span className="flex-1 text-sm text-[var(--foreground)]">{selectedFolderPath}</span>
            <button
              type="button"
              onClick={handleClearFolder}
              className="p-0.5 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ) : folderOptions.length > 0 ? (
          <select
            value={selectedFolderPath}
            onChange={(e) => setSelectedFolderPath(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
          >
            <option value="">No folder (root level)</option>
            {folderOptions.map(path => (
              <option key={path} value={path}>{path}</option>
            ))}
          </select>
        ) : null}

        {showNewFolder ? (
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-yellow-500 flex-shrink-0">
              <path d="M3 4h5l2 2h7a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z"/>
            </svg>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="flex-1 px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFolder();
                } else if (e.key === 'Escape') {
                  setShowNewFolder(false);
                  setNewFolderName('');
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddFolder}
              disabled={!newFolderName.trim()}
              className="px-2 py-1 text-xs font-medium bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName('');
              }}
              className="p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewFolder(true)}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            + Create new folder
          </button>
        )}
      </div>
    </div>
  );
}
