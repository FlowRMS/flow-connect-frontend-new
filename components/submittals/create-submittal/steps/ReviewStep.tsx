'use client';

import React from 'react';
import type { TransmittalPurpose } from '../../../../lib/types/submittals';
import type { QuoteRecipient, QuoteLineItem, QuoteForSubmittal, ManualContacts } from '../types';
import { TRANSMITTAL_PURPOSES, ROLE_LABELS, ROLE_COLORS } from '../constants';

interface ReviewStepProps {
  submittalName: string;
  selectedQuotes: QuoteForSubmittal[];
  selectedRecipients: QuoteRecipient[];
  selectedItemIds: Set<string>;
  lineItems: QuoteLineItem[];
  transmittalPurpose: TransmittalPurpose;
  notes: string;
  manualContacts: ManualContacts;
}

export function ReviewStep({
  submittalName,
  selectedQuotes,
  selectedRecipients,
  selectedItemIds,
  lineItems,
  transmittalPurpose,
  notes,
  manualContacts,
}: ReviewStepProps) {
  const selectedItems = lineItems.filter(li => selectedItemIds.has(li.id));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
        <SummaryRow label="Submittal Name" value={submittalName} />
        {selectedQuotes.length > 0 && (
          <SummaryRow
            label={`Source Quote${selectedQuotes.length > 1 ? 's' : ''}`}
            value={selectedQuotes.map(q => q.id).join(', ')}
          />
        )}
        <SummaryRow label="Recipients" value={String(selectedRecipients.length)} />
        <SummaryRow label="Items" value={String(selectedItemIds.size)} />
        <SummaryRow
          label="Transmittal Purpose"
          value={TRANSMITTAL_PURPOSES.find(p => p.value === transmittalPurpose)?.label || ''}
        />
        {notes && (
          <div>
            <span className="text-sm text-[var(--muted-foreground)]">Notes</span>
            <p className="text-sm text-[var(--foreground)] mt-1">{notes}</p>
          </div>
        )}
      </div>

      {/* Selected Recipients */}
      {selectedRecipients.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Selected Recipients</h4>
          <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)] max-h-32 overflow-y-auto">
            {selectedRecipients.map(recipient => (
              <div key={recipient.id} className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">{recipient.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${ROLE_COLORS[recipient.role].bg} ${ROLE_COLORS[recipient.role].text}`}>
                    {ROLE_LABELS[recipient.role]}
                  </span>
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">{recipient.company}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Items */}
      <div>
        <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Selected Items</h4>
        <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)] max-h-48 overflow-y-auto">
          {selectedItems.map(item => (
            <div key={item.id} className="px-3 py-2 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-[var(--foreground)]">{item.catalogNumber}</span>
                <span className="text-xs text-[var(--muted-foreground)] ml-2">{item.manufacturer}</span>
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">Qty: {item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Project Contacts */}
      {(manualContacts.architectName || manualContacts.engineerName || manualContacts.otherContactName) && (
        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">Project Contacts</h4>
          <div className="border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
            {manualContacts.architectName && (
              <ContactRow
                name={manualContacts.architectName}
                company={manualContacts.architectCompany}
                role="Architect"
                iconBg="bg-purple-100"
                roleBg="bg-purple-100"
                roleText="text-purple-700"
              />
            )}
            {manualContacts.engineerName && (
              <ContactRow
                name={manualContacts.engineerName}
                company={manualContacts.engineerCompany}
                role="Engineer"
                iconBg="bg-green-100"
                roleBg="bg-green-100"
                roleText="text-green-700"
              />
            )}
            {manualContacts.otherContactName && (
              <ContactRow
                name={manualContacts.otherContactName}
                company={manualContacts.otherContactCompany}
                role="Other"
                iconBg="bg-gray-100"
                roleBg="bg-gray-100"
                roleText="text-gray-700"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
    </div>
  );
}

function ContactRow({
  name,
  company,
  role,
  iconBg,
  roleBg,
  roleText,
}: {
  name: string;
  company: string;
  role: string;
  iconBg: string;
  roleBg: string;
  roleText: string;
}) {
  return (
    <div className="px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-5 h-5 rounded-full ${iconBg} flex items-center justify-center`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <span className="text-sm font-medium text-[var(--foreground)]">{name}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${roleBg} ${roleText}`}>{role}</span>
      </div>
      {company && <span className="text-xs text-[var(--muted-foreground)]">{company}</span>}
    </div>
  );
}
