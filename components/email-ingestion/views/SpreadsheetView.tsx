/**
 * Spreadsheet View Component for Email Ingestion
 */

'use client';

import React from 'react';
import { getStatusColor, getDocumentTypeColor, formatDate } from '../utils';
import { ENTITY_COLORS } from '../constants';
import type { Email } from '../types';

interface SpreadsheetViewProps {
  emails: Email[];
  onEmailClick: (emailId: string) => void;
  onProcessEmail: (emailId: string) => void;
}

export function SpreadsheetView({ emails, onEmailClick, onProcessEmail }: SpreadsheetViewProps) {
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
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                From
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                To
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                Documents
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                Connections
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                Tasks
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {emails.map((email) => (
              <tr
                key={email.id}
                className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                onClick={() => onEmailClick(email.id)}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded text-xs font-medium ${getStatusColor(email.status)}`}>
                    {email.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--foreground)]">
                  {formatDate(email.date)}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                  <div className="max-w-[150px] truncate">{email.sender}</div>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                  <div className="max-w-[150px] truncate">{email.recipient}</div>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                  <div className="max-w-[300px] font-medium">{email.subject}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {email.documentTypes.length > 0 ? (
                      email.documentTypes.map((type, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${getDocumentTypeColor(type)}`}
                        >
                          {type}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--muted-foreground)]">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[250px]">
                    {email.connections.contacts?.map((contact, idx) => (
                      <span
                        key={`contact-${idx}`}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${ENTITY_COLORS.contacts}`}
                      >
                        {contact}
                      </span>
                    ))}
                    {email.connections.companies?.map((company, idx) => (
                      <span
                        key={`company-${idx}`}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${ENTITY_COLORS.companies}`}
                      >
                        {company}
                      </span>
                    ))}
                    {email.connections.jobs?.map((job, idx) => (
                      <span
                        key={`job-${idx}`}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${ENTITY_COLORS.jobs}`}
                      >
                        {job}
                      </span>
                    ))}
                    {email.connections.preOpportunities?.map((preOpp, idx) => (
                      <span
                        key={`preopp-${idx}`}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${ENTITY_COLORS.preOpportunities}`}
                      >
                        {preOpp}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-[var(--foreground)]">
                    {email.suggestedTasks.length > 0 ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                        {email.suggestedTasks.length} task{email.suggestedTasks.length !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[var(--muted-foreground)]">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {email.status === 'Needs Attention' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProcessEmail(email.id);
                      }}
                      className="px-3 py-1.5 bg-[var(--primary)] text-white rounded text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors"
                    >
                      Process
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--muted-foreground)]">Processed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
