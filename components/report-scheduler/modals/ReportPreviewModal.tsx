/**
 * Report Preview Modal - Shows a preview of the report
 */

import React from 'react';
import type { Report } from '../types';
import { PreviewContent } from '../components/PreviewContent';

interface ReportPreviewModalProps {
  report: Report | null;
  onClose: () => void;
}

export function ReportPreviewModal({
  report,
  onClose,
}: ReportPreviewModalProps) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {report.name}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {report.dateFilter} · {report.assignedTo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-8">
          <PreviewContent types={report.types} />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--card)] px-6 py-4 border-t border-[var(--border)] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
