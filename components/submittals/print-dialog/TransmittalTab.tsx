'use client';

import React from 'react';
import type { TransmittalPurpose, TransmittalAttachment } from '../../../lib/types/submittals';

const TRANSMITTAL_ATTACHED: { value: TransmittalAttachment; label: string }[] = [
  { value: 'drawings', label: 'Drawings' },
  { value: 'specifications', label: 'Specifications' },
  { value: 'prints', label: 'Prints' },
  { value: 'information', label: 'Information' },
  { value: 'plans', label: 'Plans' },
  { value: 'submittals', label: 'Submittals' },
];

const TRANSMITTAL_FOR: { value: TransmittalPurpose; label: string }[] = [
  { value: 'prior_approval', label: 'Prior Approval' },
  { value: 'resubmit_for_approval', label: 'Resubmittal for Approval' },
  { value: 'record', label: 'Record' },
  { value: 'approval', label: 'Approval' },
  { value: 'corrections', label: 'Corrections' },
  { value: 'bids_due_on', label: 'Bids Due On' },
  { value: 'approval_as_submitted', label: 'Approval as Submitted' },
  { value: 'for_your_use', label: 'Your Use' },
  { value: 'approval_as_noted', label: 'Approval as Noted' },
  { value: 'review_and_comment', label: 'Review and Comment' },
];

interface TransmittalTabProps {
  attachedItems: Set<string>;
  toggleAttached: (value: string) => void;
  attachedOther: string;
  setAttachedOther: (v: string) => void;
  transmittedFor: Set<TransmittalPurpose>;
  toggleTransmittedFor: (value: TransmittalPurpose) => void;
  transmittedForOther: string;
  setTransmittedForOther: (v: string) => void;
  copies: number;
  setCopies: (v: number) => void;
}

export function TransmittalTab({
  attachedItems, toggleAttached,
  attachedOther, setAttachedOther,
  transmittedFor, toggleTransmittedFor,
  transmittedForOther, setTransmittedForOther,
  copies, setCopies,
}: TransmittalTabProps) {
  return (
    <div className="space-y-6">
      {/* Attached */}
      <div>
        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Attached</h4>
        <div className="grid grid-cols-3 gap-x-6 gap-y-2">
          {TRANSMITTAL_ATTACHED.map(item => (
            <label key={item.value} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={attachedItems.has(item.value)}
                onChange={() => toggleAttached(item.value)}
                className="w-4 h-4 accent-[var(--primary)] rounded"
              />
              <span className="text-sm text-[var(--foreground)]">{item.label}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm text-[var(--foreground)]">Other:</span>
          <input
            type="text"
            value={attachedOther}
            onChange={(e) => setAttachedOther(e.target.value)}
            className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
      </div>

      {/* For */}
      <div>
        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">For</h4>
        <div className="grid grid-cols-3 gap-x-6 gap-y-2">
          {TRANSMITTAL_FOR.map(item => (
            <label key={item.value} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={transmittedFor.has(item.value)}
                onChange={() => toggleTransmittedFor(item.value)}
                className="w-4 h-4 accent-[var(--primary)] rounded"
              />
              <span className="text-sm text-[var(--foreground)]">{item.label}</span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm text-[var(--foreground)]">Other:</span>
          <input
            type="text"
            value={transmittedForOther}
            onChange={(e) => setTransmittedForOther(e.target.value)}
            className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
      </div>

      {/* Copies */}
      <div>
        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Copies</h4>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--foreground)]">Copies:</span>
          <input
            type="number"
            min="1"
            value={copies}
            onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
            className="w-20 px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
          <span className="text-sm text-[var(--muted-foreground)]">(prints on the transmittal only - does not affect printing)</span>
        </div>
      </div>
    </div>
  );
}
