'use client';

import React from 'react';
import { submittalStatusLabels, submittalStatusColors } from '../../lib/data/submittals-mock';
import type { SubmittalDisplay } from './types/submittal-transforms';

interface SubmittalsListProps {
  submittals: SubmittalDisplay[];
  onSelectSubmittal: (id: string) => void;
}

export function SubmittalsList({ submittals, onSelectSubmittal }: SubmittalsListProps) {
  return (
    <div className="space-y-4">
      {submittals.map((submittal) => (
        <div
          key={submittal.id}
          className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectSubmittal(submittal.id)}
        >
          <div className="px-5 py-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-base font-semibold text-[var(--foreground)]">{submittal.jobName}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${submittalStatusColors[submittal.status]?.bg || 'bg-gray-100'} ${submittalStatusColors[submittal.status]?.text || 'text-gray-800'}`}>
                  {submittalStatusLabels[submittal.status] || submittal.status}
                </span>
                {submittal.currentRevision > 0 && (
                  <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">
                    Rev {submittal.currentRevision}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-2">#{submittal.submittalNumber}</p>
              <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                <span>{new Date(submittal.submittalDate).toLocaleDateString()}</span>
                <span>{submittal.items.length} items</span>
                {submittal.customers.length > 0 && submittal.customers[0].companyName && (
                  <span>{submittal.customers[0].companyName}</span>
                )}
              </div>
            </div>
          </div>

          {submittal.items.length > 0 && (
            <div className="px-5 pb-4">
              <div className="flex flex-wrap gap-2">
                {submittal.items.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 px-2 py-1 bg-[var(--muted)]/50 rounded text-xs">
                    <span className="font-medium">{item.fixtureType}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      item.matchStatus === 'matched_with_highlight' ? 'bg-green-500' :
                      item.matchStatus === 'matched_no_highlight' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                ))}
                {submittal.items.length > 5 && (
                  <span className="px-2 py-1 text-xs text-[var(--muted-foreground)]">
                    +{submittal.items.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="px-5 py-3 bg-[var(--muted)]/30 border-t border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length} ready
              </span>
              <span className="flex items-center gap-1 text-yellow-600">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                {submittal.items.filter(i => i.matchStatus === 'matched_no_highlight').length} need highlights
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {submittal.items.filter(i => i.matchStatus === 'no_match').length} missing
              </span>
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">
              Updated {new Date(submittal.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
