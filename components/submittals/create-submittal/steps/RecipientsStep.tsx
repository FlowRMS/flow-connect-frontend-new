'use client';

import React from 'react';
import type { QuoteRecipient, ManualContacts } from '../types';
import { ROLE_LABELS, ROLE_COLORS } from '../constants';

interface RecipientsStepProps {
  recipients: QuoteRecipient[];
  selectedRecipientIds: Set<string>;
  toggleRecipient: (id: string) => void;
  manualContacts: ManualContacts;
  setManualContacts: React.Dispatch<React.SetStateAction<ManualContacts>>;
}

export function RecipientsStep({
  recipients,
  selectedRecipientIds,
  toggleRecipient,
  manualContacts,
  setManualContacts,
}: RecipientsStepProps) {
  const setManualField = (field: keyof ManualContacts) => (value: string) => {
    setManualContacts(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Quote Recipients Section */}
      {recipients.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--foreground)]">Quote Recipients</p>
            <button
              onClick={() => {
                const allIds = new Set(recipients.map(r => r.id));
                const allSelected = recipients.every(r => selectedRecipientIds.has(r.id));
                recipients.forEach(r => allSelected ? toggleRecipient(r.id) : (!selectedRecipientIds.has(r.id) && toggleRecipient(r.id)));
              }}
              className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
            >
              {recipients.every(r => selectedRecipientIds.has(r.id)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recipients.map(recipient => (
              <label
                key={recipient.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRecipientIds.has(recipient.id)
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border)] hover:bg-[var(--muted)]/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedRecipientIds.has(recipient.id)}
                  onChange={() => toggleRecipient(recipient.id)}
                  className="accent-[var(--primary)] w-4 h-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--foreground)]">{recipient.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${ROLE_COLORS[recipient.role].bg} ${ROLE_COLORS[recipient.role].text}`}>
                      {ROLE_LABELS[recipient.role]}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">{recipient.company}</p>
                </div>
                <div className="text-sm text-[var(--muted-foreground)]">{recipient.email}</div>
              </label>
            ))}
          </div>
        </>
      )}

      {/* Manual Project Contacts */}
      <div className={recipients.length > 0 ? 'pt-4 border-t border-[var(--border)]' : ''}>
        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">
          {recipients.length > 0 ? 'Additional Project Contacts' : 'Project Contacts'}
        </h4>
        <div className="space-y-3">
          {/* Architect */}
          <ContactInput
            label="Architect"
            icon={<ArchitectIcon />}
            iconBg="bg-purple-100"
            name={manualContacts.architectName}
            company={manualContacts.architectCompany}
            onNameChange={setManualField('architectName')}
            onCompanyChange={setManualField('architectCompany')}
          />

          {/* Engineer */}
          <ContactInput
            label="Engineer"
            icon={<EngineerIcon />}
            iconBg="bg-green-100"
            name={manualContacts.engineerName}
            company={manualContacts.engineerCompany}
            onNameChange={setManualField('engineerName')}
            onCompanyChange={setManualField('engineerCompany')}
          />

          {/* Other Contact */}
          <ContactInput
            label="Other Contact"
            icon={<PersonIcon />}
            iconBg="bg-gray-100"
            name={manualContacts.otherContactName}
            company={manualContacts.otherContactCompany}
            onNameChange={setManualField('otherContactName')}
            onCompanyChange={setManualField('otherContactCompany')}
          />
        </div>
      </div>

      {recipients.length === 0 && !manualContacts.architectName && !manualContacts.engineerName && !manualContacts.otherContactName && (
        <p className="text-sm text-[var(--muted-foreground)] text-center py-2">
          Add at least one recipient or project contact to continue.
        </p>
      )}
    </div>
  );
}

// Helper component for contact inputs
function ContactInput({
  label,
  icon,
  iconBg,
  name,
  company,
  onNameChange,
  onCompanyChange,
}: {
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  name: string;
  company: string;
  onNameChange: (value: string) => void;
  onCompanyChange: (value: string) => void;
}) {
  return (
    <div className="p-3 bg-[var(--muted)]/30 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Name"
          className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
        <input
          type="text"
          value={company}
          onChange={(e) => onCompanyChange(e.target.value)}
          placeholder="Company"
          className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
      </div>
    </div>
  );
}

// Icons
function ArchitectIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
      <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
    </svg>
  );
}

function EngineerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
