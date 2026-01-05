import React, { useCallback } from 'react';
import type { FolderResponse } from '../../lib/graphql/files';

interface FolderCardProps {
  folder: FolderResponse;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onCheckboxClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function FolderCard({
  folder,
  isSelected,
  isHighlighted,
  onClick,
  onDoubleClick,
  onCheckboxClick,
  onContextMenu,
}: FolderCardProps) {
  // Prevent text selection on double click
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.detail > 1) {
      e.preventDefault();
    }
  }, []);

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={onContextMenu}
      className={`
        group relative flex flex-col items-center p-4 rounded-xl cursor-default transition-all duration-150 select-none
        hover:bg-[var(--muted)]/50
        ${isHighlighted ? 'bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]' : ''}
      `}
    >
      {/* Selection checkbox */}
      <button
        onClick={onCheckboxClick}
        className={`
          absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
          ${isSelected
            ? 'bg-[var(--primary)] border-[var(--primary)]'
            : 'border-[var(--border)] bg-[var(--card)] opacity-0 group-hover:opacity-100 hover:border-[var(--primary)]'
          }
        `}
      >
        {isSelected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </button>

      {/* Folder icon */}
      <div className="w-16 h-16 flex items-center justify-center mb-2 transition-transform group-hover:scale-105">
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          className="text-blue-500"
        >
          <path
            d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M2 8h20"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Folder name */}
      <span
        className="text-sm font-medium text-[var(--foreground)] text-center truncate max-w-full px-1"
        title={folder.name}
      >
        {folder.name}
      </span>

      {/* Folder description */}
      {folder.description && (
        <span
          className="text-xs text-[var(--muted-foreground)] text-center truncate max-w-full mt-0.5"
          title={folder.description}
        >
          {folder.description}
        </span>
      )}
    </div>
  );
}
