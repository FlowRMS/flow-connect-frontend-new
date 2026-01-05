import React, { useCallback } from 'react';
import type { FileResponse } from '../../lib/graphql/files';
import { formatFileSize, getFileExtension } from '../../lib/graphql/files';

interface FileCardProps {
  file: FileResponse;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onCheckboxClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDownload: () => void;
}

export function FileCard({
  file,
  isSelected,
  isHighlighted,
  onClick,
  onDoubleClick,
  onCheckboxClick,
  onContextMenu,
  onDownload,
}: FileCardProps) {
  const extension = getFileExtension(file.fileName);
  const iconColor = getFileIconColor(file.fileType);

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
          absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all z-10
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

      {/* Download button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload();
        }}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--card)] border border-[var(--border)] opacity-0 group-hover:opacity-100 hover:bg-[var(--muted)] transition-all shadow-sm z-10"
        title="Download"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <path d="M7 10l5 5 5-5" />
          <path d="M12 15V3" />
        </svg>
      </button>

      {/* File icon with extension badge */}
      <div className="w-16 h-16 flex items-center justify-center mb-2 relative transition-transform group-hover:scale-105">
        <FileIcon color={iconColor} />
        {extension && (
          <span
            className={`absolute -bottom-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${getExtensionBadgeColor(file.fileType)}`}
          >
            {extension}
          </span>
        )}
      </div>

      {/* File name */}
      <span
        className="text-sm font-medium text-[var(--foreground)] text-center truncate max-w-full px-1"
        title={file.fileName}
      >
        {file.fileName}
      </span>

      {/* File size */}
      <span className="text-xs text-[var(--muted-foreground)]">
        {formatFileSize(file.fileSize)}
      </span>
    </div>
  );
}

function FileIcon({ color }: { color: string }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      className={color}
    >
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getFileIconColor(fileType?: string): string {
  if (!fileType) return 'text-gray-400';

  const type = fileType.toLowerCase();
  if (type.includes('image')) return 'text-purple-500';
  if (type.includes('pdf')) return 'text-red-500';
  if (type.includes('word') || type.includes('doc')) return 'text-blue-500';
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('xls')) return 'text-green-500';
  if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return 'text-orange-500';
  if (type.includes('video')) return 'text-pink-500';
  if (type.includes('audio')) return 'text-yellow-500';
  if (type.includes('zip') || type.includes('archive')) return 'text-amber-500';
  if (type.includes('text') || type.includes('plain')) return 'text-slate-500';

  return 'text-gray-400';
}

function getExtensionBadgeColor(fileType?: string): string {
  if (!fileType) return 'bg-gray-500 text-white';

  const type = fileType.toLowerCase();
  if (type.includes('image')) return 'bg-purple-500 text-white';
  if (type.includes('pdf')) return 'bg-red-500 text-white';
  if (type.includes('word') || type.includes('doc')) return 'bg-blue-500 text-white';
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('xls')) return 'bg-green-500 text-white';
  if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return 'bg-orange-500 text-white';
  if (type.includes('video')) return 'bg-pink-500 text-white';
  if (type.includes('audio')) return 'bg-yellow-500 text-black';
  if (type.includes('zip') || type.includes('archive')) return 'bg-amber-500 text-white';

  return 'bg-gray-500 text-white';
}
