'use client';

import React, { useRef, useEffect } from 'react';
import type { SpecSheetFolder } from '../../lib/types/submittals';

interface FolderContextMenuProps {
  folder: SpecSheetFolder;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddSubfolder: () => void;
}

export function FolderContextMenu({
  position,
  onClose,
  onRename,
  onDelete,
  onAddSubfolder
}: FolderContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
      style={{ top: position.y, left: position.x }}
    >
      <button
        onClick={() => { onAddSubfolder(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
        </svg>
        Add Subfolder
      </button>
      <button
        onClick={() => { onRename(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 010 3L12 12l-4 1 1-4 6.5-6.5a2.121 2.121 0 013 0z"/>
        </svg>
        Rename
      </button>
      <div className="border-t border-[var(--border)] my-1" />
      <button
        onClick={() => { onDelete(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h14M8 6V4h4v2M17 6v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6"/>
        </svg>
        Delete Folder
      </button>
    </div>
  );
}
