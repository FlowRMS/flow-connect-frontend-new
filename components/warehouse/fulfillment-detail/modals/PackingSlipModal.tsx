'use client';

import React from 'react';
import { FulfillmentOrder } from '../../api/fulfillmentApi';
import { PackingBoxType } from '../packing/PackingBox';

interface PackingSlipModalProps {
  isOpen: boolean;
  fulfillmentOrder: FulfillmentOrder;
  packingBoxes: PackingBoxType[];
  onClose: () => void;
  onPrint: () => void;
}

export default function PackingSlipModal({
  isOpen,
  fulfillmentOrder,
  packingBoxes,
  onClose,
  onPrint,
}: PackingSlipModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Print Packing Slips</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} packing slip{packingBoxes.length > 1 ? 's' : ''} to print</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center text-[var(--muted-foreground)]">
            <p>Packing slip preview and printing functionality</p>
            <p className="text-sm mt-2">This would show packing slip templates and print options</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20 flex justify-between items-center">
          <div className="text-sm text-[var(--muted-foreground)]">
            {packingBoxes.length} packing slip{packingBoxes.length > 1 ? 's' : ''} will be generated
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onPrint();
                onClose();
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

