/**
 * Card View Component for Email Ingestion
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
} from '../utils';
import type { Email } from '../types';

interface CardViewProps {
  emails: Email[];
  onEmailClick: (emailId: string) => void;
  onProcessEmail: (emailId: string) => void;
}

export function CardView({ emails, onEmailClick, onProcessEmail }: CardViewProps) {
  if (emails.length === 0) {
    return (
      <div className="text-center py-12">
        <svg width="48" height="48" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4 text-[var(--muted-foreground)]">
          <rect x="2" y="4" width="16" height="12" rx="2"/>
          <path d="M2 7l8 5 8-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-[var(--muted-foreground)]">No emails found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => {
        const entities = parseExtractedEntities(email.extractedEntities);
        const attachments = email.attachments || [];

        return (
          <div
            key={email.id}
            className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onEmailClick(email.id)}
          >
            {/* Email Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    {email.subject}
                  </h3>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(email.status)}`}>
                    {getStatusDisplayName(email.status)}
                  </span>
                  {email.urgency && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getUrgencyColor(email.urgency)}`}>
                      {email.urgency}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--muted-foreground)]">From: </span>
                    <span className="text-[var(--foreground)] font-medium">{email.fromEmail}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">To: </span>
                    <span className="text-[var(--foreground)] font-medium">{email.toEmail}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Received: </span>
                    <span className="text-[var(--foreground)] font-medium">{formatDateLong(email.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {email.summary && (
              <div className="mb-4 p-4 bg-[var(--muted)]/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--primary)]">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
                  </svg>
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    AI Summary
                  </span>
                </div>
                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                  {email.summary}
                </p>
              </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Attachments ({attachments.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <span
                      key={attachment.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getDocumentTypeColor(attachment.documentType || 'other')}`}
                      title={attachment.documentDescription || attachment.name}
                    >
                      {attachment.documentType ? attachment.documentType.replace(/_/g, ' ') : attachment.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Row */}
            <div className="mb-4 flex flex-wrap gap-3 text-xs">
              {email.category && (
                <div>
                  <span className="text-[var(--muted-foreground)]">Category: </span>
                  <span className="text-[var(--foreground)] font-medium capitalize">{email.category}</span>
                </div>
              )}
              {email.sentiment && (
                <div>
                  <span className="text-[var(--muted-foreground)]">Sentiment: </span>
                  <span className={`font-medium capitalize ${getSentimentColor(email.sentiment).replace('bg-', 'text-').replace('-100', '-700')}`}>
                    {email.sentiment}
                  </span>
                </div>
              )}
              {email.requiresResponse !== null && email.requiresResponse !== undefined && (
                <div>
                  <span className="text-[var(--muted-foreground)]">Requires Response: </span>
                  <span className="text-[var(--foreground)] font-medium">{email.requiresResponse ? 'Yes' : 'No'}</span>
                </div>
              )}
            </div>

            {/* Extracted Entities */}
            {entities && Object.keys(entities).some(key => entities[key as keyof typeof entities]?.length) && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Extracted Information
                </h4>
                <div className="space-y-2">
                  {entities.contacts && entities.contacts.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[100px]">Contacts:</span>
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
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[100px]">Companies:</span>
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
                      <span className="text-xs text-[var(--muted-foreground)] min-w-[100px]">Jobs:</span>
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
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            {email.suggestedActions && email.suggestedActions.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Suggested Actions
                </h4>
                <ul className="space-y-1.5">
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

            {/* Action Button */}
            {emailNeedsAttention(email.status) && (
              <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onProcessEmail(email.id);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Mark as Processed
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
