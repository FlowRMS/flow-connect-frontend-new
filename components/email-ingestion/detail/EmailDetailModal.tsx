/**
 * Email Detail Modal Component
 */

'use client';

import React from 'react';
import { getStatusColor, getDocumentTypeColor, formatDateLong } from '../utils';
import { ENTITY_COLORS } from '../constants';
import type { Email } from '../types';

interface EmailDetailModalProps {
  email: Email;
  onClose: () => void;
  onProcessEmail: (emailId: string) => void;
}

export function EmailDetailModal({ email, onClose, onProcessEmail }: EmailDetailModalProps) {
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
            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(email.status)}`}>
              {email.status}
            </span>
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
                <div className="text-sm text-[var(--foreground)]">{email.sender}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  To
                </label>
                <div className="text-sm text-[var(--foreground)]">{email.recipient}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Ingested
                </label>
                <div className="text-sm text-[var(--foreground)]">{formatDateLong(email.date)}</div>
              </div>
            </div>

            {/* Email Preview */}
            <div>
              <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                Message
              </label>
              <div className="p-4 bg-[var(--muted)]/30 rounded-lg text-sm text-[var(--foreground)] leading-relaxed">
                {email.preview}
              </div>
            </div>

            {/* Document Types */}
            {email.documentTypes.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Detected Documents
                </label>
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
            <div>
              <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                Related Entities
              </label>
              <div className="space-y-2">
                {email.connections.contacts && email.connections.contacts.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-[var(--muted-foreground)] min-w-[120px]">Contacts:</span>
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
                    <span className="text-xs text-[var(--muted-foreground)] min-w-[120px]">Companies:</span>
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
                    <span className="text-xs text-[var(--muted-foreground)] min-w-[120px]">Jobs:</span>
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
                    <span className="text-xs text-[var(--muted-foreground)] min-w-[120px]">Pre-Opportunities:</span>
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
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                  Suggested Tasks
                </label>
                <ul className="space-y-2">
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
          {email.status === 'Needs Attention' && (
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
              Process Email
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
