/**
 * Email Detail Modal Component
 */

'use client';

import React from 'react';
import {
  getStatusColor,
  getDocumentTypeColor,
  formatDateLong,
  parseExtractedEntities,
  getStatusDisplayName,
  getUrgencyColor,
  getSentimentColor,
  emailNeedsAttention,
  formatFileSize,
  cleanEmailBody,
} from '../utils';
import type { Email } from '../types';

interface EmailDetailModalProps {
  email: Email;
  onClose: () => void;
  onProcessEmail: (emailId: string) => void;
}

export function EmailDetailModal({ email, onClose, onProcessEmail }: EmailDetailModalProps) {
  const entities = parseExtractedEntities(email.extractedEntities);
  const attachments = email.attachments || [];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2">{email.subject}</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(email.status)}`}>
                {getStatusDisplayName(email.status)}
              </span>
              {email.urgency && (
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getUrgencyColor(email.urgency)}`}>
                  {email.urgency}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] ml-4"
          >
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-4">
            {/* Email Info */}
            <div className="grid grid-cols-3 gap-4 pb-6 border-b border-[var(--border)]">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  From
                </label>
                <div className="text-sm text-[var(--foreground)]">{email.fromEmail}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  To
                </label>
                <div className="text-sm text-[var(--foreground)]">{email.toEmail}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Received
                </label>
                <div className="text-sm text-[var(--foreground)]">{formatDateLong(email.createdAt)}</div>
              </div>
            </div>

            {/* AI Summary */}
            {email.summary && (
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  AI Summary
                </label>
                <div className="p-4 bg-[var(--muted)]/30 rounded-lg text-sm text-[var(--foreground)] leading-relaxed">
                  {email.summary}
                </div>
              </div>
            )}

            {/* Full Email Body */}
            <div>
              <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                Full Message
              </label>
              <div className="p-4 bg-[var(--muted)]/30 rounded-lg text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                {cleanEmailBody(email.body)}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-3 gap-4">
              {email.category && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <div className="text-sm text-[var(--foreground)] capitalize">{email.category}</div>
                </div>
              )}
              {email.sentiment && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                    Sentiment
                  </label>
                  <div className={`text-sm font-medium capitalize ${getSentimentColor(email.sentiment).replace('bg-', 'text-').replace('-100', '-700')}`}>
                    {email.sentiment}
                  </div>
                </div>
              )}
              {email.requiresResponse !== null && email.requiresResponse !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                    Requires Response
                  </label>
                  <div className="text-sm text-[var(--foreground)]">{email.requiresResponse ? 'Yes' : 'No'}</div>
                </div>
              )}
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Attachments ({attachments.length})
                </label>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-start justify-between p-3 bg-[var(--muted)]/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {attachment.name}
                          </span>
                          {attachment.documentType && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDocumentTypeColor(attachment.documentType)}`}>
                              {attachment.documentType.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        {attachment.documentDescription && (
                          <p className="text-xs text-[var(--muted-foreground)] mb-1">
                            {attachment.documentDescription}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                          <span>{formatFileSize(attachment.size)}</span>
                          <span>{attachment.contentType}</span>
                          {attachment.classificationConfidence && (
                            <span>Confidence: {Math.round(attachment.classificationConfidence * 100)}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Entities */}
            {entities && Object.keys(entities).some(key => entities[key as keyof typeof entities]?.length) && (
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Extracted Information
                </label>
                <div className="space-y-2">
                  {entities.contacts && entities.contacts.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[120px]">Contacts:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {entities.contacts.map((contact, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700"
                          >
                            {contact}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {entities.companies && entities.companies.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[120px]">Companies:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {entities.companies.map((company, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700"
                          >
                            {company}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {entities.jobs && entities.jobs.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[120px]">Jobs:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {entities.jobs.map((job, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-green-100 text-green-700"
                          >
                            {job}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {entities.reference_numbers && entities.reference_numbers.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[120px]">Reference #:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {entities.reference_numbers.map((ref, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            {email.suggestedActions && email.suggestedActions.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Suggested Actions
                </label>
                <ul className="space-y-2">
                  {email.suggestedActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0 text-[var(--muted-foreground)]">
                        <circle cx="10" cy="10" r="7"/>
                        <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Fixed */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3 bg-white rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Close
          </button>
          {emailNeedsAttention(email.status) && (
            <button
              onClick={() => {
                onProcessEmail(email.id);
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Mark as Processed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
