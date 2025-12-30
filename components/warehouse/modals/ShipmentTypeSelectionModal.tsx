'use client';

import React from 'react';

export type ShipmentCreationType = 'expected' | 'arriving';

interface ShipmentTypeSelectionModalProps {
  onClose: () => void;
  onSelect: (type: ShipmentCreationType) => void;
}

export default function ShipmentTypeSelectionModal({ onClose, onSelect }: ShipmentTypeSelectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Delivery Record</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              What type of delivery are you recording?
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          <button
            onClick={() => onSelect('expected')}
            className="w-full p-4 border border-[var(--border)] rounded-lg text-left hover:border-[var(--primary)] hover:bg-[var(--muted)]/30 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">Expected in the Future</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Record a delivery that is scheduled to arrive at a later date. Set up expected items, vendor details, and tracking information.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect('arriving')}
            className="w-full p-4 border border-[var(--border)] rounded-lg text-left hover:border-[var(--primary)] hover:bg-[var(--muted)]/30 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">Arriving Now</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Record a delivery that has just arrived or is currently being received. Start receiving immediately without pre-set expected items.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
