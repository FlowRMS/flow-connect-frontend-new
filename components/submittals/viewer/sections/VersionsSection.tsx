'use client';

import React from 'react';
import type { HighlightVersion } from '../../hooks/useSpecSheetViewer';
import { ChevronIcon, EditIcon, TrashIcon } from './icons';

interface VersionsSectionProps {
  versions: HighlightVersion[];
  selectedVersionId: string;
  onVersionSelect: (id: string) => void;
  onShowSaveModal: () => void;
  editingVersionId: string | null;
  setEditingVersionId: (id: string | null) => void;
  editingVersionName: string;
  setEditingVersionName: (name: string) => void;
  onRenameVersion: (id: string, name: string) => void;
  onDeleteVersion: (id: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function VersionsSection({
  versions,
  selectedVersionId,
  onVersionSelect,
  onShowSaveModal,
  editingVersionId,
  setEditingVersionId,
  editingVersionName,
  setEditingVersionName,
  onRenameVersion,
  onDeleteVersion,
  expanded,
  onToggle,
}: VersionsSectionProps) {
  return (
    <div className="border-b border-[var(--border)]">
      <div
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Versions</h3>
          <span className="text-[10px] px-1.5 py-0.5 bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
            {versions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onShowSaveModal(); }}
            className="text-xs px-2 py-1 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors"
          >
            + New
          </button>
          <ChevronIcon expanded={expanded} />
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 space-y-2 max-h-40 overflow-y-auto">
          {versions.map(version => (
            <div
              key={version.id}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${
                version.id === selectedVersionId
                  ? 'bg-[var(--primary)]/10 border border-[var(--primary)]'
                  : 'bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50'
              }`}
              onClick={() => onVersionSelect(version.id)}
            >
              {editingVersionId === version.id ? (
                <input
                  type="text"
                  value={editingVersionName}
                  onChange={(e) => setEditingVersionName(e.target.value)}
                  onBlur={() => onRenameVersion(version.id, editingVersionName)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onRenameVersion(version.id, editingVersionName);
                    if (e.key === 'Escape') {
                      setEditingVersionId(null);
                      setEditingVersionName('');
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-0.5 text-xs bg-[var(--background)] border border-[var(--border)] rounded text-[var(--foreground)]"
                  autoFocus
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--foreground)] truncate">{version.name}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">
                      {version.regions.length} highlights
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingVersionId(version.id);
                        setEditingVersionName(version.name);
                      }}
                      className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                      title="Rename"
                    >
                      <EditIcon size={10} />
                    </button>
                    {versions.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteVersion(version.id);
                        }}
                        className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                        title="Delete"
                      >
                        <TrashIcon size={10} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
