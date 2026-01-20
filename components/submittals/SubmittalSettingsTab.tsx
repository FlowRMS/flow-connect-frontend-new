'use client';

import React, { useState } from 'react';

interface SubmittalSettingsTabProps {
  editingJobName: string;
  setEditingJobName: (value: string) => void;
  editingJobLocation: string;
  setEditingJobLocation: (value: string) => void;
  editingBidDate: string;
  setEditingBidDate: (value: string) => void;
  editingTags: string[];
  newTagInput: string;
  setNewTagInput: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  hasSettingsChanges: boolean;
  onSaveSettings: () => void;
  onDeleteSubmittal?: () => void;
  isSaving?: boolean;
}

export function SubmittalSettingsTab({
  editingJobName,
  setEditingJobName,
  editingJobLocation,
  setEditingJobLocation,
  editingBidDate,
  setEditingBidDate,
  editingTags,
  newTagInput,
  setNewTagInput,
  onAddTag,
  onRemoveTag,
  hasSettingsChanges,
  onSaveSettings,
  onDeleteSubmittal,
  isSaving,
}: SubmittalSettingsTabProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDeleteSubmittal?.();
    setShowDeleteConfirm(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Job Name
          </label>
          <input
            type="text"
            value={editingJobName}
            onChange={(e) => setEditingJobName(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Job Location
          </label>
          <input
            type="text"
            value={editingJobLocation}
            onChange={(e) => setEditingJobLocation(e.target.value)}
            placeholder="Enter job location..."
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Bid Date
          </label>
          <input
            type="date"
            value={editingBidDate}
            onChange={(e) => setEditingBidDate(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {editingTags.map((tag, i) => (
              <span key={i} className="px-2 py-1 text-xs bg-[var(--muted)] rounded-full flex items-center gap-1">
                {tag}
                <button
                  onClick={() => onRemoveTag(tag)}
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddTag()}
              placeholder="Add a tag..."
              className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
            <button
              onClick={onAddTag}
              disabled={!newTagInput.trim()}
              className="px-3 py-2 text-sm bg-[var(--muted)] hover:bg-[var(--muted)]/70 rounded-lg transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Save button */}
        {hasSettingsChanges && (
          <div className="pt-4 border-t border-[var(--border)]">
            <button
              onClick={onSaveSettings}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}

        <div className={`${hasSettingsChanges ? '' : 'pt-4 border-t border-[var(--border)]'}`}>
          <button
            onClick={handleDeleteClick}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete Submittal
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="10" y1="11" x2="10" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="14" y1="11" x2="14" y2="17" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Delete Submittal</h3>
                <p className="text-sm text-[var(--muted-foreground)]">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Are you sure you want to delete this submittal? All items, revisions, and associated data will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Submittal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
