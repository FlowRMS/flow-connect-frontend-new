/**
 * Abridgment Report Modal Component
 */

import React from 'react';
import type { TakeoffDocument, AbridgmentReportItem } from '../types';
import { mockAbridgmentReport } from '../mockData';

interface AbridgmentReportModalProps {
  isOpen: boolean;
  document: TakeoffDocument | null;
  onClose: () => void;
}

export function AbridgmentReportModal({
  isOpen,
  document,
  onClose,
}: AbridgmentReportModalProps) {
  if (!isOpen || !document) return null;

  // In a real app, this would come from an API based on document ID
  const reportItems: AbridgmentReportItem[] = mockAbridgmentReport;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Abridgment Report</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{document.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => alert('Downloading Excel report...')}
              className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Download Excel
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Included
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {reportItems.map((item) => (
                  <tr key={item.page} className="hover:bg-[var(--muted)]/20">
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                      Page {item.page}
                    </td>
                    <td className="px-6 py-4">
                      {item.included ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Yes
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                      {item.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
