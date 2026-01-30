'use client';

import React, { useState } from 'react';
import type { SavedViewState } from '@/components/lib/graphql/settings';

interface SaveViewButtonProps {
  onSave: (viewState: SavedViewState) => Promise<boolean>;
  onClear?: () => Promise<boolean>;
  getCurrentViewState: () => SavedViewState;
  hasSavedView?: boolean;
  isSaving?: boolean;
}

export function SaveViewButton({
  onSave,
  onClear,
  getCurrentViewState,
  hasSavedView = false,
  isSaving = false
}: SaveViewButtonProps) {
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCleared, setShowCleared] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const viewState = getCurrentViewState();
      const success = await onSave(viewState);
      if (success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!onClear) return;
    setClearing(true);
    try {
      const success = await onClear();
      if (success) {
        setShowCleared(true);
        setTimeout(() => setShowCleared(false), 2000);
      }
    } finally {
      setClearing(false);
    }
  };

  const isLoading = saving || clearing || isSaving;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleSave}
        disabled={isLoading}
        className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
          showSuccess
            ? 'border-green-500 text-green-600 bg-green-50'
            : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Save current filters and sorting as your default view"
      >
        {saving ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
        ) : showSuccess ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 10l4 4 6-8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 4h10l2 2v10a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h1" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="6" y="2" width="8" height="6" rx="1" />
            <path d="M10 5v2" strokeLinecap="round" />
          </svg>
        )}
        {showSuccess ? 'Saved!' : 'Save View'}
      </button>

      {hasSavedView && onClear && (
        <button
          onClick={handleClear}
          disabled={isLoading}
          className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
            showCleared
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-red-600 hover:border-red-300'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Clear saved view and reset to defaults"
        >
          {clearing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          ) : showCleared ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 10l4 4 6-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {showCleared ? 'Cleared!' : 'Clear View'}
        </button>
      )}
    </div>
  );
}

export default SaveViewButton;
