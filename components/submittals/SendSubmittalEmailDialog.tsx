'use client';

import React, { useState, useMemo } from 'react';
import type {
  Submittal,
  SubmittalRevision,
  SubmittalStakeholder,
  EmailSendRecord,
} from '../../lib/types/submittals';

interface SendSubmittalEmailDialogProps {
  submittal: Submittal;
  revision: SubmittalRevision;
  onClose: () => void;
  onSend: (emailRecord: Omit<EmailSendRecord, 'id' | 'sentAt'>) => void;
  onSkip: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SendSubmittalEmailDialog({
  submittal,
  revision,
  onClose,
  onSend,
  onSkip,
}: SendSubmittalEmailDialogProps) {
  // Gather all stakeholders with emails
  const allStakeholders = useMemo(() => {
    const all: SubmittalStakeholder[] = [
      ...submittal.customers,
      ...submittal.engineers,
      ...submittal.architects,
    ];
    return all.filter(s => s.email);
  }, [submittal]);

  // Pre-select recipients based on addressedTo from output options
  const preSelectedEmails = useMemo(() => {
    return revision.outputOptions.addressedTo
      .filter(s => s.email)
      .map(s => s.email!);
  }, [revision.outputOptions.addressedTo]);

  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(
    preSelectedEmails.length > 0 ? preSelectedEmails : allStakeholders.map(s => s.email!)
  );
  const [customRecipient, setCustomRecipient] = useState('');
  const [showAddRecipient, setShowAddRecipient] = useState(false);

  // Generate default subject
  const isResubmit = revision.outputOptions.transmittedFor.includes('resubmit_for_approval');
  const defaultSubject = isResubmit
    ? `Resubmittal - ${submittal.jobName} - Rev ${revision.revisionNumber}`
    : `Submittal - ${submittal.jobName} - Rev ${revision.revisionNumber}`;

  const [subject, setSubject] = useState(defaultSubject);

  // Generate default body
  const defaultBody = isResubmit
    ? `Please find attached the revised submittal package for ${submittal.jobName}.\n\nChanges have been made per your comments on the previous revision. Please review and provide your approval.`
    : `Please find attached the submittal package for ${submittal.jobName}.\n\nPlease review and provide your approval at your earliest convenience.`;

  const [body, setBody] = useState(defaultBody);

  const [sending, setSending] = useState(false);

  const toggleRecipient = (email: string) => {
    setSelectedRecipients(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const addCustomRecipient = () => {
    if (customRecipient && customRecipient.includes('@') && !selectedRecipients.includes(customRecipient)) {
      setSelectedRecipients(prev => [...prev, customRecipient]);
      setCustomRecipient('');
      setShowAddRecipient(false);
    }
  };

  const removeRecipient = (email: string) => {
    setSelectedRecipients(prev => prev.filter(e => e !== email));
  };

  const handleSend = async () => {
    if (selectedRecipients.length === 0) return;

    setSending(true);
    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    onSend({
      sentBy: 'Current User', // Would come from auth context
      recipients: selectedRecipients,
      subject,
      body,
      attachmentUrl: revision.generatedPdfUrl || '',
      attachmentName: revision.generatedPdfName || `Submittal_R${revision.revisionNumber}.pdf`,
      attachmentSize: revision.generatedPdfSize || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Send Submittal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              To
            </label>
            <div className="border border-[var(--border)] rounded-lg p-3 min-h-[60px]">
              <div className="flex flex-wrap gap-2">
                {selectedRecipients.map(email => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--muted)] rounded text-sm"
                  >
                    {email}
                    <button
                      onClick={() => removeRecipient(email)}
                      className="p-0.5 hover:bg-[var(--background)] rounded"
                    >
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </span>
                ))}
                {showAddRecipient ? (
                  <input
                    type="email"
                    value={customRecipient}
                    onChange={(e) => setCustomRecipient(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomRecipient()}
                    onBlur={() => {
                      if (!customRecipient) setShowAddRecipient(false);
                    }}
                    placeholder="Enter email..."
                    autoFocus
                    className="flex-1 min-w-[150px] px-2 py-1 text-sm bg-transparent border-0 outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setShowAddRecipient(true)}
                    className="px-2 py-1 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>

            {/* Quick add from stakeholders */}
            {allStakeholders.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {allStakeholders.filter(s => !selectedRecipients.includes(s.email!)).map(s => (
                  <button
                    key={s.contactId}
                    onClick={() => toggleRecipient(s.email!)}
                    className="px-2 py-1 text-xs bg-[var(--muted)]/50 hover:bg-[var(--muted)] rounded transition-colors"
                  >
                    + {s.contactName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
            />
          </div>

          {/* Attachment */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-600">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" />
                  <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">
                  {revision.generatedPdfName || `Submittal_R${revision.revisionNumber}.pdf`}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formatFileSize(revision.generatedPdfSize || 0)}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            I&apos;ll send it myself
          </button>
          <button
            onClick={handleSend}
            disabled={selectedRecipients.length === 0 || sending}
            className="px-6 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
