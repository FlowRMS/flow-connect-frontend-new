'use client';

import React, { useState } from 'react';
import { specSheetCategoryLabels } from '../../../lib/data/submittals-mock';
import type { SpecSheet, SpecSheetCategory } from '../../../lib/types/submittals';

interface DetailsTabProps {
  specSheet: SpecSheet;
  highlightCount: number;
}

const allCategories: SpecSheetCategory[] = [
  'indoor', 'outdoor', 'sports_lighting', 'controls', 'emergency',
  'decorative', 'industrial', 'drives', 'sub_metering', 'cable_tray', 'other'
];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DetailsTab({ specSheet, highlightCount }: DetailsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCategories, setEditedCategories] = useState<SpecSheetCategory[]>(specSheet.categories);

  const toggleCategory = (category: SpecSheetCategory) => {
    setEditedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
          Name
        </label>
        <p className="text-sm font-medium text-[var(--foreground)]">{specSheet.displayName}</p>
      </div>

      {/* Manufacturer */}
      <div>
        <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
          Manufacturer
        </label>
        <p className="text-sm text-[var(--foreground)]">{specSheet.manufacturer}</p>
      </div>

      {/* File Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            File Size
          </label>
          <p className="text-sm text-[var(--foreground)]">{formatFileSize(specSheet.fileSize)}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            Pages
          </label>
          <p className="text-sm text-[var(--foreground)]">{specSheet.pageCount}</p>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            Times Used
          </label>
          <p className="text-sm text-[var(--foreground)]">{specSheet.usageCount}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            Highlights
          </label>
          <p className="text-sm text-[var(--foreground)]">{highlightCount}</p>
        </div>
      </div>

      {/* Upload Info */}
      <div>
        <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
          Uploaded
        </label>
        <p className="text-sm text-[var(--foreground)]">
          {formatDate(specSheet.uploadedAt)} by {specSheet.uploadedBy}
        </p>
      </div>

      {/* Source */}
      {specSheet.sourceUrl && (
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            Source URL
          </label>
          <a
            href={specSheet.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] truncate block"
          >
            {specSheet.sourceUrl}
          </a>
        </div>
      )}

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            Categories
          </label>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>
        {isEditing ? (
          <div className="flex flex-wrap gap-1.5">
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  editedCategories.includes(cat)
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                }`}
              >
                {specSheetCategoryLabels[cat]}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {specSheet.categories.map(cat => (
              <span key={cat} className="px-2 py-1 text-xs bg-[var(--muted)] text-[var(--foreground)] rounded">
                {specSheetCategoryLabels[cat]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
