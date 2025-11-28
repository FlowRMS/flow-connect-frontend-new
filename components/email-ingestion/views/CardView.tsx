/**
 * Card View Component for Email Ingestion
 */

'use client';

import React from 'react';
import { getStatusColor, getDocumentTypeColor, formatDateLong } from '../utils';
import { ENTITY_COLORS } from '../constants';
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
      {emails.map((email) => (
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
                  {email.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-[var(--muted-foreground)]">From: </span>
                  <span className="text-[var(--foreground)] font-medium">{email.sender}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">To: </span>
                  <span className="text-[var(--foreground)] font-medium">{email.recipient}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Ingested: </span>
                  <span className="text-[var(--foreground)] font-medium">{formatDateLong(email.date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          <div className="mb-4 p-4 bg-[var(--muted)]/30 rounded-lg">
            <p className="text-sm text-[var(--foreground)] leading-relaxed">
              {email.preview}
            </p>
          </div>

          {/* Document Types */}
          {email.documentTypes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                Detected Documents
              </h4>
              <div className="flex flex-wrap gap-2">
                {email.documentTypes.map((type, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getDocumentTypeColor(type)}`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Connections */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
              Related Entities
            </h4>
            <div className="space-y-2">
              {email.connections.contacts && email.connections.contacts.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[var(--muted-foreground)] min-w-[100px]">Contacts:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {email.connections.contacts.map((contact, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded text-xs font-medium ${ENTITY_COLORS.contacts}`}
                      >
                        {contact}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {email.connections.companies && email.connections.companies.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[var(--muted-foreground)] min-w-[100px]">Companies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {email.connections.companies.map((company, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded text-xs font-medium ${ENTITY_COLORS.companies}`}
                      >
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {email.connections.jobs && email.connections.jobs.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[var(--muted-foreground)] min-w-[100px]">Jobs:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {email.connections.jobs.map((job, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded text-xs font-medium ${ENTITY_COLORS.jobs}`}
                      >
                        {job}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {email.connections.preOpportunities && email.connections.preOpportunities.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[var(--muted-foreground)] min-w-[100px]">Pre-Opportunities:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {email.connections.preOpportunities.map((preOpp, idx) => (
                      <span
                        key={idx}
                        className={`px-2.5 py-1 rounded text-xs font-medium ${ENTITY_COLORS.preOpportunities}`}
                      >
                        {preOpp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Suggested Tasks */}
          {email.suggestedTasks.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                Suggested Tasks
              </h4>
              <ul className="space-y-1.5">
                {email.suggestedTasks.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0 text-[var(--muted-foreground)]">
                      <circle cx="10" cy="10" r="7"/>
                      <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Button */}
          {email.status === 'Needs Attention' && (
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
                Process Email
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
