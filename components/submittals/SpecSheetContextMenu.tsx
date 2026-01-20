'use client';

import React, { useRef, useEffect } from 'react';
import type { SpecSheet } from '../../lib/types/submittals';

interface SpecSheetContextMenuProps {
  specSheet: SpecSheet;
  position: { x: number; y: number };
  onClose: () => void;
  onView: () => void;
  onRename: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export function SpecSheetContextMenu({
  specSheet,
  position,
  onClose,
  onView,
  onRename,
  onDownload,
  onDelete,
}: SpecSheetContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.right > viewportWidth) {
      menuRef.current.style.left = `${viewportWidth - rect.width - 8}px`;
    }
    if (rect.bottom > viewportHeight) {
      menuRef.current.style.top = `${viewportHeight - rect.height - 8}px`;
    }
  }, [position]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
      style={{ top: position.y, left: position.x }}
    >
      <button
        onClick={() => { onView(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 10s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="10" cy="10" r="3"/>
        </svg>
        View
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
      <button
        onClick={() => { onDownload(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 3v10M6 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 17h14" strokeLinecap="round"/>
        </svg>
        Download
      </button>
      <div className="border-t border-[var(--border)] my-1" />
      <button
        onClick={() => { onDelete(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h14M8 6V4h4v2M17 6v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6"/>
        </svg>
        Delete
      </button>
    </div>
  );
}
