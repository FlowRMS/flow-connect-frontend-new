'use client';

import React from 'react';

interface HighlightVersion {
  id: string;
  name: string;
  versionNumber: number;
  description?: string | null;
  regions?: unknown[];
}

interface HighlightVersionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightVersions: HighlightVersion[];
  isLoading: boolean;
  onSelectVersion: (versionId: string) => void;
  onSkip: () => void;
}

export function HighlightVersionPickerModal({
  isOpen,
  onClose,
  highlightVersions,
  isLoading,
  onSelectVersion,
  onSkip,
}: HighlightVersionPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
      <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Select Highlight Version</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
            </div>
          ) : highlightVersions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--muted-foreground)]">No highlight versions available for this spec sheet.</p>
              <button
                onClick={onSkip}
                className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Continue Without Highlights
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                Select a highlight version to use with this spec sheet:
              </p>
              {highlightVersions.map(version => (
                <button
                  key={version.id}
                  onClick={() => onSelectVersion(version.id)}
                  className="w-full p-3 text-left rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{version.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Version {version.versionNumber}
                        {version.description && ` • ${version.description}`}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">
                      {version.regions?.length || 0} highlight{(version.regions?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              ))}
              <button
                onClick={onSkip}
                className="w-full mt-2 px-4 py-2 text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors"
              >
                Skip - No Highlights
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
