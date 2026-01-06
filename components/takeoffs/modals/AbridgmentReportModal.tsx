/**
 * Abridgment Report Modal Component
 * Displays page-by-page analysis from document abridgement
 */

import React from 'react';
import type { TakeoffDocument, AbridgmentReportItem } from '../types';

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

  // Transform pageAnalyses from document to AbridgmentReportItem format
  // Handle case where pageAnalyses might not be an array
  const reportItems: AbridgmentReportItem[] = Array.isArray(document.pageAnalyses)
    ? document.pageAnalyses.map(pa => ({
        page: pa.pageNumber,
        included: pa.isRelevant,
        reason: pa.reasoning || pa.mainTopic || 'No reasoning provided',
      }))
    : [];

  const hasNoData = reportItems.length === 0;

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
            {/* Download Abridged PDF Button */}
            {document.abridgedUrl && (
              <button
                onClick={async () => {
                  try {
                    // Use proxy to avoid CORS issues
                    const proxyUrl = `/api/document-proxy?url=${encodeURIComponent(document.abridgedUrl!)}`;
                    const response = await fetch(proxyUrl);

                    if (!response.ok) {
                      console.error('Failed to download abridged PDF:', response.status);
                      // Fallback to opening in new tab
                      window.open(document.abridgedUrl, '_blank');
                      return;
                    }

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const link = window.document.createElement('a');
                    link.href = url;
                    // Generate filename from document name
                    const baseName = document.name.replace(/\.[^/.]+$/, '');
                    link.download = `${baseName}_abridged.pdf`;
                    link.click();
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error downloading abridged PDF:', error);
                    // Fallback to opening in new tab
                    window.open(document.abridgedUrl, '_blank');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 3v10m0 0l-3-3m3 3l3-3M3 17h14" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Abridged PDF
              </button>
            )}
            <button
              onClick={() => {
                // Generate CSV content for Excel
                const csvContent = [
                  ['Page', 'Included', 'Reason'].join(','),
                  ...reportItems.map(item => [
                    item.page,
                    item.included ? 'Yes' : 'No',
                    `"${item.reason.replace(/"/g, '""')}"`,
                  ].join(',')),
                ].join('\n');

                // Create and trigger download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = window.document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `abridgment-report-${document.name.replace(/\.[^/.]+$/, '')}.csv`;
                link.click();
                URL.revokeObjectURL(link.href);
              }}
              disabled={hasNoData}
              className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          {hasNoData ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Abridgment Data</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                {document.abridged
                  ? 'This document has been abridged but detailed page analysis is not available.'
                  : 'This document has not been abridged yet. Run the abridgment process to generate a report.'}
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="flex items-center gap-6 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <span className="text-[var(--muted-foreground)]">Total Pages: </span>
                  <span className="font-medium text-[var(--foreground)]">{reportItems.length}</span>
                </div>
                <div className="text-sm">
                  <span className="text-[var(--muted-foreground)]">Included: </span>
                  <span className="font-medium text-green-600">{reportItems.filter(i => i.included).length}</span>
                </div>
                <div className="text-sm">
                  <span className="text-[var(--muted-foreground)]">Excluded: </span>
                  <span className="font-medium text-red-600">{reportItems.filter(i => !i.included).length}</span>
                </div>
                {document.reductionPercentage && (
                  <div className="text-sm">
                    <span className="text-[var(--muted-foreground)]">Reduction: </span>
                    <span className="font-medium text-purple-600">{document.reductionPercentage.toFixed(1)}%</span>
                  </div>
                )}
              </div>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
