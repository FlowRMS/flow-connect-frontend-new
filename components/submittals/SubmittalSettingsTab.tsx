'use client';

import React from 'react';

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
}: SubmittalSettingsTabProps) {
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
              className="px-4 py-2 text-sm bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}

        <div className={`${hasSettingsChanges ? '' : 'pt-4 border-t border-[var(--border)]'}`}>
          <button className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            Delete Submittal
          </button>
        </div>
      </div>
    </div>
  );
}
