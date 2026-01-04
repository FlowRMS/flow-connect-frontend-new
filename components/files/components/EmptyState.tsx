import React from 'react';

interface EmptyStateProps {
  isSearch: boolean;
  searchTerm: string;
  onUpload: () => void;
  onNewFolder: () => void;
}

export function EmptyState({ isSearch, searchTerm, onUpload, onNewFolder }: EmptyStateProps) {
  if (isSearch) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16">
        <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[var(--muted-foreground)]"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">No results found</h3>
        <p className="text-sm text-[var(--muted-foreground)] max-w-md">
          No files or folders match &quot;{searchTerm}&quot;. Try a different search term.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-16">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center mb-6">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-[var(--primary)]"
        >
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">This folder is empty</h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-md">
        Get started by uploading files or creating a new folder to organize your documents.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onNewFolder}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            <path d="M12 11v6M9 14h6" />
          </svg>
          New Folder
        </button>
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <path d="M17 8l-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
          Upload Files
        </button>
      </div>
    </div>
  );
}
