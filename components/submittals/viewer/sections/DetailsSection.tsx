'use client';

import React from 'react';
import type { SpecSheet } from '../../../../lib/types/submittals';
import { ChevronIcon, EditIcon } from './icons';

interface DetailsSectionProps {
  specSheet: SpecSheet;
  numPages: number;
  editableSpecSheetName: string;
  setEditableSpecSheetName: (name: string) => void;
  isEditingSpecSheetName: boolean;
  setIsEditingSpecSheetName: (editing: boolean) => void;
  expanded: boolean;
  onToggle: () => void;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DetailsSection({
  specSheet,
  numPages,
  editableSpecSheetName,
  setEditableSpecSheetName,
  isEditingSpecSheetName,
  setIsEditingSpecSheetName,
  expanded,
  onToggle,
}: DetailsSectionProps) {
  return (
    <div className="border-b border-[var(--border)]">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 transition-colors"
      >
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Details</h3>
        <ChevronIcon expanded={expanded} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Spec Sheet Name</label>
            {isEditingSpecSheetName ? (
              <input
                type="text"
                value={editableSpecSheetName}
                onChange={(e) => setEditableSpecSheetName(e.target.value)}
                onBlur={() => setIsEditingSpecSheetName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingSpecSheetName(false);
                  if (e.key === 'Escape') {
                    setEditableSpecSheetName(specSheet.displayName);
                    setIsEditingSpecSheetName(false);
                  }
                }}
                className="w-full px-2 py-1 text-sm bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)]"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditingSpecSheetName(true)}
                className="flex items-center justify-between px-2 py-1 text-sm text-[var(--foreground)] bg-[var(--muted)]/30 rounded cursor-pointer hover:bg-[var(--muted)]/50 transition-colors"
              >
                <span className="truncate">{editableSpecSheetName}</span>
                <EditIcon />
              </div>
            )}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">Manufacturer</span>
            <span className="text-[var(--foreground)]">{specSheet.manufacturer}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">Pages</span>
            <span className="text-[var(--foreground)]">{numPages}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--muted-foreground)]">File Size</span>
            <span className="text-[var(--foreground)]">{formatFileSize(specSheet.fileSize)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
