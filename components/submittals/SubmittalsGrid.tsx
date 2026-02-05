'use client';

import React from 'react';
import { submittalStatusLabels, submittalStatusColors } from '../../lib/data/submittals-mock';
import type { SubmittalDisplay } from './types/submittal-transforms';

interface SubmittalsGridProps {
  submittals: SubmittalDisplay[];
  onSelectSubmittal: (id: string) => void;
}

export function SubmittalsGrid({ submittals, onSelectSubmittal }: SubmittalsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {submittals.map((submittal) => (
        <div
          key={submittal.id}
          className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectSubmittal(submittal.id)}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${submittalStatusColors[submittal.status]?.bg || 'bg-gray-100'} ${submittalStatusColors[submittal.status]?.text || 'text-gray-800'}`}>
                {submittalStatusLabels[submittal.status] || submittal.status}
              </span>
              {submittal.currentRevision > 0 && (
                <span className="text-xs text-[var(--muted-foreground)]">Rev {submittal.currentRevision}</span>
              )}
            </div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1 line-clamp-1">{submittal.jobName}</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-3">#{submittal.submittalNumber}</p>
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>{submittal.items.length} items</span>
              <span>{new Date(submittal.submittalDate).toLocaleDateString()}</span>
            </div>
          </div>
          {submittal.items.length > 0 && (
            <div className="px-4 py-2 bg-[var(--muted)]/30 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${(submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length / submittal.items.length) * 100}%`
                    }}
                  />
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {Math.round((submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length / submittal.items.length) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
