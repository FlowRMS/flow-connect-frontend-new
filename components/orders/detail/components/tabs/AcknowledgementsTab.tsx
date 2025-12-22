/**
 * AcknowledgementsTab Component
 * Displays acknowledgements for the order
 */

'use client';

import React from 'react';

interface AcknowledgementsTabProps {
  onAddAcknowledgement: () => void;
}

export function AcknowledgementsTab({ onAddAcknowledgement }: AcknowledgementsTabProps) {
  return (
    <div className="space-y-4">
      {/* Acknowledgements Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Ack #</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Ack Date</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Part Number</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Description</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Ordered Qty</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Ack Qty</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Remaining</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Ship Date</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {/* Mock acknowledgement data */}
            <tr className="hover:bg-[var(--muted)]/20">
              <td className="px-4 py-3 font-medium text-[var(--primary)]">ACK-78901</td>
              <td className="px-4 py-3">12/05/2024</td>
              <td className="px-4 py-3">LBL4-LP840</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">4ft LED Low Bay, 4000K</td>
              <td className="px-4 py-3 text-right">100</td>
              <td className="px-4 py-3 text-right">50</td>
              <td className="px-4 py-3 text-right text-amber-600">50</td>
              <td className="px-4 py-3">12/15/2024</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Partial</span>
              </td>
            </tr>
            <tr className="hover:bg-[var(--muted)]/20">
              <td className="px-4 py-3 font-medium text-[var(--primary)]">ACK-78902</td>
              <td className="px-4 py-3">12/08/2024</td>
              <td className="px-4 py-3">LBL4-LP840</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">4ft LED Low Bay, 4000K</td>
              <td className="px-4 py-3 text-right">100</td>
              <td className="px-4 py-3 text-right">50</td>
              <td className="px-4 py-3 text-right text-green-600">0</td>
              <td className="px-4 py-3">12/20/2024</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Complete</span>
              </td>
            </tr>
            <tr className="hover:bg-[var(--muted)]/20">
              <td className="px-4 py-3 font-medium text-[var(--primary)]">ACK-78903</td>
              <td className="px-4 py-3">12/10/2024</td>
              <td className="px-4 py-3">WHL-2X4-35</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">2x4 LED Panel, 3500K</td>
              <td className="px-4 py-3 text-right">25</td>
              <td className="px-4 py-3 text-right">25</td>
              <td className="px-4 py-3 text-right text-green-600">0</td>
              <td className="px-4 py-3">12/18/2024</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Complete</span>
              </td>
            </tr>
          </tbody>
          <tfoot className="bg-[var(--muted)]/20 border-t border-[var(--border)]">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right font-semibold">Totals:</td>
              <td className="px-4 py-3 text-right font-semibold">125</td>
              <td className="px-4 py-3 text-right font-semibold">125</td>
              <td className="px-4 py-3 text-right font-semibold text-amber-600">50</td>
              <td colSpan={2} className="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Acknowledgement Button */}
      <div className="flex justify-end">
        <button
          onClick={onAddAcknowledgement}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
          </svg>
          Add Acknowledgement
        </button>
      </div>
    </div>
  );
}
