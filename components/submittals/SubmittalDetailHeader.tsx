'use client';

import React from 'react';
import type { Submittal, SubmittalConfig } from '../../lib/types/submittals';
import { defaultSubmittalConfig } from '../../lib/types/submittals';
import { submittalStatusLabels, submittalStatusColors } from '../../lib/data/submittals-mock';

interface SubmittalDetailHeaderProps {
  submittal: Submittal;
  onOpenConfig: () => void;
  onPrint?: () => void;
  onClose: () => void;
}

export function SubmittalDetailHeader({
  submittal,
  onOpenConfig,
  onPrint,
  onClose,
}: SubmittalDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{submittal.jobName}</h2>
            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${submittalStatusColors[submittal.status].bg} ${submittalStatusColors[submittal.status].text}`}>
              {submittalStatusLabels[submittal.status]}
            </span>
            {submittal.currentRevision > 0 && (
              <span className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded">
                Rev {submittal.currentRevision}
              </span>
            )}
          </div>
          {submittal.jobLocation && (
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{submittal.jobLocation}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenConfig}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          title="Submittal Configuration"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          Configure
        </button>
        <button
          onClick={onPrint}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 16v2a2 2 0 002 2h8a2 2 0 002-2v-2M10 4v10M6 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Print
        </button>
        <button
          onClick={onPrint}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2v6h6M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Generate Submittal
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
