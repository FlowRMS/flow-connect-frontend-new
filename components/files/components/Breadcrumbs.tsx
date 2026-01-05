import React from 'react';
import type { FolderResponse } from '../../lib/graphql/files';

interface BreadcrumbsProps {
  path: FolderResponse[];
  onNavigate: (folderId: string | null) => void;
  isSearching?: boolean;
}

export function Breadcrumbs({ path, onNavigate, isSearching }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 px-6 py-3 text-sm overflow-x-auto">
      {/* Home/Files root */}
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
        <span className="font-medium">Files</span>
      </button>

      {/* Search indicator */}
      {isSearching && (
        <>
          <ChevronRight />
          <span className="px-2 py-1 text-[var(--muted-foreground)]">Search Results</span>
        </>
      )}

      {/* Folder path */}
      {!isSearching && path.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight />
          <button
            onClick={() => onNavigate(folder.id)}
            className={`px-2 py-1 rounded-md transition-colors truncate max-w-[200px] ${
              index === path.length - 1
                ? 'font-medium text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
            title={folder.name}
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0 text-[var(--muted-foreground)]"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
