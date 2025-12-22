/**
 * CreditsTab Component
 * Displays credits for the order
 */

'use client';

import React from 'react';

interface CreditsTabProps {
  onAddCredit: () => void;
}

export function CreditsTab({ onAddCredit }: CreditsTabProps) {
  return (
    <div className="space-y-4">
      {/* Credits Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Credit #</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Part Number</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Reason</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Qty</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Credit Amount</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Comm. %</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Comm. Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {/* Mock credit data */}
            <tr className="hover:bg-[var(--muted)]/20">
              <td className="px-4 py-3 font-medium text-[var(--primary)]">CR-001234</td>
              <td className="px-4 py-3">12/10/2024</td>
              <td className="px-4 py-3">LBL4-LP840</td>
              <td className="px-4 py-3">Defective unit</td>
              <td className="px-4 py-3 text-right">2</td>
              <td className="px-4 py-3 text-right text-red-600">-$570.00</td>
              <td className="px-4 py-3 text-right">0.75%</td>
              <td className="px-4 py-3 text-right text-red-600">-$4.28</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Posted</span>
              </td>
            </tr>
            <tr className="hover:bg-[var(--muted)]/20">
              <td className="px-4 py-3 font-medium text-[var(--primary)]">CR-001235</td>
              <td className="px-4 py-3">12/12/2024</td>
              <td className="px-4 py-3">LBL4-LP840</td>
              <td className="px-4 py-3">Price adjustment</td>
              <td className="px-4 py-3 text-right">5</td>
              <td className="px-4 py-3 text-right text-red-600">-$142.50</td>
              <td className="px-4 py-3 text-right">0.75%</td>
              <td className="px-4 py-3 text-right text-red-600">-$1.07</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>
              </td>
            </tr>
          </tbody>
          <tfoot className="bg-[var(--muted)]/20 border-t border-[var(--border)]">
            <tr>
              <td colSpan={5} className="px-4 py-3 text-right font-semibold">Totals:</td>
              <td className="px-4 py-3 text-right font-semibold text-red-600">-$712.50</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-right font-semibold text-red-600">-$5.35</td>
              <td className="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Credit Button */}
      <div className="flex justify-end">
        <button
          onClick={onAddCredit}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
          </svg>
          Add Credit
        </button>
      </div>
    </div>
  );
}
