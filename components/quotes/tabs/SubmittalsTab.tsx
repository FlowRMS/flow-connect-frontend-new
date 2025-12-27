'use client';

import React from 'react';
import type { Submittal, SubmittalItem } from '../../../lib/types/submittals';
import {
  submittalStatusLabels,
  submittalStatusColors,
  matchStatusLabels,
  matchStatusColors,
} from '../../../lib/data/submittals-mock';

interface SubmittalsTabProps {
  submittals: Submittal[];
  selectedQuoteId: string;
  onSetPrintSubmittal: (submittal: Submittal) => void;
  onShowCreateSubmittalModal: () => void;
  onEditSubmittal: (submittalId: string) => void;
  onSelectSubmittalForDetail: (submittal: Submittal) => void;
}

export function SubmittalsTab({
  submittals,
  selectedQuoteId,
  onSetPrintSubmittal,
  onShowCreateSubmittalModal,
  onEditSubmittal,
  onSelectSubmittalForDetail,
}: SubmittalsTabProps) {
  const quoteSubmittals = submittals.filter(s => s.quoteIds.includes(selectedQuoteId));
  const hasSubmittals = quoteSubmittals.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Submittals</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {hasSubmittals
              ? `${quoteSubmittals.length} submittal${quoteSubmittals.length > 1 ? 's' : ''} for this quote`
              : 'Manage product submittals and documentation for this quote'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasSubmittals && (
            <button
              onClick={() => onSetPrintSubmittal(quoteSubmittals[0])}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create PDF
            </button>
          )}
          <button
            onClick={onShowCreateSubmittalModal}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            Create Submittal
          </button>
        </div>
      </div>

      {/* Existing Submittals */}
      {hasSubmittals && (
        <div className="space-y-4">
          {quoteSubmittals.map((submittal) => (
            <div key={submittal.id} className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden hover:border-[var(--primary)]/50 transition-colors cursor-pointer" onClick={() => onSelectSubmittalForDetail(submittal)}>
              {/* Submittal Header */}
              <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--foreground)]">{submittal.jobName}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${submittalStatusColors[submittal.status].bg} ${submittalStatusColors[submittal.status].text}`}>
                        {submittalStatusLabels[submittal.status]}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Rev {submittal.currentRevision} • {submittal.items.length} items • Updated {new Date(submittal.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSubmittal(submittal.id);
                    }}
                    className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
                    title="Configure"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                  </button>
                  {submittal.revisions.length > 0 && submittal.revisions[submittal.currentRevision]?.generatedPdfUrl && (
                    <button onClick={(e) => e.stopPropagation()} className="px-3 py-1 text-xs bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors">
                      Download PDF
                    </button>
                  )}
                </div>
              </div>

              {/* Meta Information Bar */}
              <div className="px-4 py-2 bg-[var(--background)] border-b border-[var(--border)] flex items-center gap-6 text-xs" onClick={(e) => e.stopPropagation()}>
                {/* Architect */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSubmittal(submittal.id);
                  }}
                  className="flex items-center gap-1.5 hover:bg-[var(--muted)] px-2 py-1 -mx-2 -my-1 rounded transition-colors"
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                      <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                    </svg>
                  </div>
                  <span className="text-[var(--muted-foreground)]">Architect:</span>
                  <span className="text-[var(--foreground)] font-medium">
                    {submittal.architects.length > 0 ? submittal.architects[0].contactName : <span className="italic text-[var(--muted-foreground)]">+ Add</span>}
                  </span>
                </button>

                <div className="w-px h-4 bg-[var(--border)]" />

                {/* Engineer */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSubmittal(submittal.id);
                  }}
                  className="flex items-center gap-1.5 hover:bg-[var(--muted)] px-2 py-1 -mx-2 -my-1 rounded transition-colors"
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                  </div>
                  <span className="text-[var(--muted-foreground)]">Engineer:</span>
                  <span className="text-[var(--foreground)] font-medium">
                    {submittal.engineers.length > 0 ? submittal.engineers[0].contactName : <span className="italic text-[var(--muted-foreground)]">+ Add</span>}
                  </span>
                </button>

                <div className="w-px h-4 bg-[var(--border)]" />

                {/* Customer */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSubmittal(submittal.id);
                  }}
                  className="flex items-center gap-1.5 hover:bg-[var(--muted)] px-2 py-1 -mx-2 -my-1 rounded transition-colors"
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <span className="text-[var(--muted-foreground)]">Customer:</span>
                  <span className="text-[var(--foreground)] font-medium">
                    {submittal.customers.length > 0 ? submittal.customers[0].contactName : <span className="italic text-[var(--muted-foreground)]">+ Add</span>}
                  </span>
                </button>
              </div>

              {/* Submittal Items */}
              <table className="w-full" onClick={(e) => e.stopPropagation()}>
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Manufacturer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Spec Sheet</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {submittal.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--muted)]/20">
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-[var(--muted)] text-xs font-semibold text-[var(--foreground)]">
                          {item.fixtureType}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">{item.catalogNumber}</p>
                          <p className="text-xs text-[var(--muted-foreground)] truncate max-w-[200px]">{item.description}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-[var(--foreground)]">{item.manufacturer}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${matchStatusColors[item.matchStatus].bg} ${matchStatusColors[item.matchStatus].text}`}>
                          {item.matchStatus === 'matched_with_highlight' && (
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M16 6l-8 8-4-4" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {item.matchStatus === 'matched_no_highlight' && (
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="10" cy="10" r="8"/>
                              <path d="M10 6v4" strokeLinecap="round"/>
                              <circle cx="10" cy="14" r="0.5" fill="currentColor"/>
                            </svg>
                          )}
                          {item.matchStatus === 'no_match' && (
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="10" cy="10" r="8"/>
                              <path d="M7 7l6 6M13 7l-6 6" strokeLinecap="round"/>
                            </svg>
                          )}
                          {matchStatusLabels[item.matchStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={(e) => e.stopPropagation()} className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]">
                          {item.matchStatus === 'no_match' ? 'Attach' : item.matchStatus === 'matched_no_highlight' ? 'Highlight' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Submittal Footer Stats */}
              <div className="px-4 py-2 bg-[var(--muted)]/20 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {submittal.items.filter(i => i.matchStatus === 'matched_with_highlight').length} ready
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    {submittal.items.filter(i => i.matchStatus === 'matched_no_highlight').length} need highlights
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    {submittal.items.filter(i => i.matchStatus === 'no_match').length} missing spec sheets
                  </span>
                </div>
                {submittal.customers.length > 0 && (
                  <span>To: {submittal.customers.map(c => c.companyName || c.contactName).join(', ')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasSubmittals && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No submittals yet</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">Create a submittal package to send spec sheets to engineers and architects</p>
          <button
            onClick={onShowCreateSubmittalModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            Create Submittal
          </button>
        </div>
      )}
    </div>
  );
}
