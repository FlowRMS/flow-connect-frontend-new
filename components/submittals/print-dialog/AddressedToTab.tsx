'use client';

import React from 'react';
import type { SubmittalStakeholder } from '../../../lib/types/submittals';

const ROLE_LABELS: Record<SubmittalStakeholder['role'], string> = {
  customer: 'Customer',
  architect: 'Architect',
  engineer: 'Engineer',
  gc: 'General Contractor',
  ec: 'Electrical Contractor',
  other: 'Other',
};

interface AddressedToTabProps {
  contacts: SubmittalStakeholder[];
  selectedContactIds: Set<string>;
  toggleContactSelection: (contactId: string) => void;
  selectAllContacts: () => void;
  selectNoneContacts: () => void;
}

export function AddressedToTab({
  contacts,
  selectedContactIds,
  toggleContactSelection,
  selectAllContacts,
  selectNoneContacts,
}: AddressedToTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--foreground)]">Address a copy to ...</p>

      {/* Table */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
                <th className="w-10 px-3 py-2 text-left font-medium text-[var(--foreground)]">Sel</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">Name</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">Company</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">Role</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">EMail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-[var(--muted-foreground)]">
                    {/* Empty state - just like the legacy system shows empty table */}
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr
                    key={contact.contactId}
                    className={`hover:bg-[var(--muted)]/30 transition-colors cursor-pointer ${
                      selectedContactIds.has(contact.contactId) ? 'bg-[var(--primary)]/5' : ''
                    }`}
                    onClick={() => toggleContactSelection(contact.contactId)}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedContactIds.has(contact.contactId)}
                        onChange={() => toggleContactSelection(contact.contactId)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 accent-[var(--primary)] rounded"
                      />
                    </td>
                    <td className="px-3 py-2 text-[var(--foreground)]">{contact.contactName}</td>
                    <td className="px-3 py-2 text-[var(--foreground)]">{contact.companyName || ''}</td>
                    <td className="px-3 py-2 text-[var(--foreground)]">{ROLE_LABELS[contact.role]}</td>
                    <td className="px-3 py-2 text-[var(--foreground)]">{contact.email || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          className="px-4 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
        >
          Add Contact
        </button>
        <button
          onClick={selectNoneContacts}
          className="px-4 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
        >
          Select None
        </button>
        <button
          onClick={selectAllContacts}
          className="px-4 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
        >
          Select All
        </button>
      </div>
    </div>
  );
}
