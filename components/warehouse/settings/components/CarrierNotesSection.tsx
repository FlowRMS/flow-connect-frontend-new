import React from 'react';
import type { ShippingCarrier } from '../types';

interface CarrierNotesSectionProps {
  carrier: ShippingCarrier;
  onUpdate: (updates: Partial<ShippingCarrier>) => void;
}

export default function CarrierNotesSection({ carrier, onUpdate }: CarrierNotesSectionProps) {
  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Notes
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">
            Remarks (visible to team)
          </label>
          <textarea
            value={carrier.remarks || ''}
            onChange={(e) => onUpdate({ remarks: e.target.value })}
            placeholder="Notes visible to the team..."
            rows={2}
            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">
            Internal Notes (admin only)
          </label>
          <textarea
            value={carrier.internalNotes || ''}
            onChange={(e) => onUpdate({ internalNotes: e.target.value })}
            placeholder="Private notes for administrators..."
            rows={2}
            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
