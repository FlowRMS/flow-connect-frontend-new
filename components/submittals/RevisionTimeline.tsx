'use client';

import React from 'react';
import type {
  Submittal,
  SubmittalRevision,
  ReturnedPdf,
  EmailSendRecord,
  ChangeAnalysis,
  ItemChange,
} from '../../lib/types/submittals';

interface RevisionTimelineProps {
  submittal: Submittal;
  onSendEmail?: (revision: SubmittalRevision) => void;
  onUploadReturned?: (revision: SubmittalRevision) => void;
  onViewPdf?: (url: string, name: string) => void;
  onResubmit?: (revision: SubmittalRevision, returnedPdf: ReturnedPdf) => void;
  onViewAnalysis?: (returnedPdf: ReturnedPdf) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700';
    case 'approved_as_noted':
      return 'bg-blue-100 text-blue-700';
    case 'revise':
    case 'revise_and_resubmit':
      return 'bg-amber-100 text-amber-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'approved_as_noted':
      return 'Approved as Noted';
    case 'revise':
      return 'Revise';
    case 'revise_and_resubmit':
      return 'Revise & Resubmit';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}

function ItemChangeStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-green-600">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'approved_as_noted':
      return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-blue-600">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'revise':
      return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-amber-600">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M10 6v5M10 13v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'rejected':
      return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-red-600">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function RevisionTimeline({
  submittal,
  onSendEmail,
  onUploadReturned,
  onViewPdf,
  onResubmit,
  onViewAnalysis,
}: RevisionTimelineProps) {
  // Sort revisions newest first
  const sortedRevisions = [...submittal.revisions].sort(
    (a, b) => b.revisionNumber - a.revisionNumber
  );

  if (sortedRevisions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center">
        <div>
          <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No revisions yet</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Generate your first submittal revision when all items are ready
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedRevisions.map((revision, index) => {
        const isCurrent = revision.revisionNumber === submittal.currentRevision;
        const hasReturnedPdfs = revision.returnedPdfs.length > 0;
        const latestReturned = hasReturnedPdfs ? revision.returnedPdfs[revision.returnedPdfs.length - 1] : null;
        const needsResubmit = latestReturned?.changeAnalysis?.overallStatus === 'revise_and_resubmit' ||
          latestReturned?.changeAnalysis?.itemChanges.some(c => c.status === 'revise' || c.status === 'rejected');

        return (
          <div
            key={revision.revisionNumber}
            className={`border rounded-lg overflow-hidden ${
              isCurrent ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/20' : 'border-[var(--border)]'
            }`}
          >
            {/* Revision Header */}
            <div className="px-4 py-3 bg-[var(--muted)]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  Revision {revision.revisionNumber}
                </span>
                {isCurrent && (
                  <span className="px-2 py-0.5 text-xs bg-[var(--primary)]/10 text-[var(--primary)] rounded font-medium">
                    Current
                  </span>
                )}
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">
                {formatDate(revision.generatedAt)}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Generated PDF Section */}
              {revision.generatedPdfUrl && (
                <div className="flex items-center justify-between bg-[var(--muted)]/20 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-600">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" />
                        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" />
                        <path d="M9 15h6M9 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {revision.generatedPdfName || `Submittal_R${revision.revisionNumber}.pdf`}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatFileSize(revision.generatedPdfSize || 0)} • Generated by {revision.generatedBy}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewPdf?.(revision.generatedPdfUrl!, revision.generatedPdfName || `Submittal_R${revision.revisionNumber}.pdf`)}
                      className="px-3 py-1.5 text-sm text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                    >
                      View PDF
                    </button>
                    {isCurrent && (
                      <button
                        onClick={() => onSendEmail?.(revision)}
                        className="px-3 py-1.5 text-sm text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <path d="M22 6l-10 7L2 6" />
                        </svg>
                        Send Email
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Emails Sent Section */}
              {revision.emailsSent && revision.emailsSent.length > 0 && (
                <div className="border-l-2 border-blue-300 pl-4 space-y-2">
                  {revision.emailsSent.map((email) => (
                    <div key={email.id} className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                      <span>
                        Sent to <span className="text-[var(--foreground)]">{email.recipients.join(', ')}</span>
                      </span>
                      <span className="text-xs">• {formatDateTime(email.sentAt)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Returned PDFs Section */}
              {hasReturnedPdfs && (
                <div className="space-y-3">
                  {revision.returnedPdfs.map((returnedPdf) => (
                    <div key={returnedPdf.id} className="border border-[var(--border)] rounded-lg overflow-hidden">
                      {/* Returned PDF Header */}
                      <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                            <path d="M3 10h18M3 10l4-4M3 10l4 4" />
                          </svg>
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            Returned from {returnedPdf.returnedBy.contactName}
                          </span>
                          {returnedPdf.changeAnalysis && (
                            <span className={`px-2 py-0.5 text-xs rounded font-medium ${getStatusColor(returnedPdf.changeAnalysis.overallStatus)}`}>
                              {getStatusLabel(returnedPdf.changeAnalysis.overallStatus)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {formatDate(returnedPdf.receivedDate)}
                        </span>
                      </div>

                      <div className="p-4 space-y-3">
                        {/* PDF Info */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-100 rounded flex items-center justify-center">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" />
                                <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-[var(--foreground)]">{returnedPdf.fileName}</p>
                              <p className="text-xs text-[var(--muted-foreground)]">
                                {formatFileSize(returnedPdf.fileSize)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => onViewPdf?.(returnedPdf.fileUrl, returnedPdf.fileName)}
                            className="px-3 py-1.5 text-sm text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                          >
                            View PDF
                          </button>
                        </div>

                        {/* Notes */}
                        {returnedPdf.notes && (
                          <p className="text-sm text-[var(--muted-foreground)] italic">
                            &quot;{returnedPdf.notes}&quot;
                          </p>
                        )}

                        {/* Change Analysis Summary */}
                        {returnedPdf.changeAnalysis && returnedPdf.changeAnalysis.itemChanges.length > 0 && (
                          <div className="bg-[var(--muted)]/20 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-[var(--foreground)]">
                                Changes Detected ({returnedPdf.changeAnalysis.itemChanges.length} items)
                              </p>
                              <button
                                onClick={() => onViewAnalysis?.(returnedPdf)}
                                className="text-xs text-[var(--primary)] hover:underline"
                              >
                                View Details
                              </button>
                            </div>
                            <div className="space-y-1.5">
                              {returnedPdf.changeAnalysis.itemChanges.slice(0, 3).map((change) => (
                                <div key={change.id} className="flex items-start gap-2 text-sm">
                                  <ItemChangeStatusIcon status={change.status} />
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-[var(--foreground)]">
                                      {change.fixtureType}
                                    </span>
                                    <span className="text-[var(--muted-foreground)]"> - </span>
                                    <span className="text-[var(--muted-foreground)] truncate">
                                      {change.notes[0]}
                                    </span>
                                    {change.resolved && (
                                      <span className="ml-2 text-xs text-green-600">(Resolved)</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {returnedPdf.changeAnalysis.itemChanges.length > 3 && (
                                <p className="text-xs text-[var(--muted-foreground)] pl-6">
                                  +{returnedPdf.changeAnalysis.itemChanges.length - 3} more items
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Resubmit Button (only for latest returned PDF that needs resubmission and this is the current revision) */}
                        {isCurrent && returnedPdf === latestReturned && needsResubmit && (
                          <div className="pt-2">
                            <button
                              onClick={() => onResubmit?.(revision, returnedPdf)}
                              className="w-full px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 4v6h-6M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                              </svg>
                              Resubmit with Changes
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Returned PDF Button */}
              {isCurrent && revision.emailsSent && revision.emailsSent.length > 0 && (
                <button
                  onClick={() => onUploadReturned?.(revision)}
                  className="w-full px-4 py-3 text-sm text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  Upload Returned PDF
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
