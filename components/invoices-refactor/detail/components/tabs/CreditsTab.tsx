/**
 * CreditsTab Component
 * Displays credits for invoice line items (inherited from linked orders)
 */

'use client';

import React from 'react';
import type { Invoice } from '@/lib/types/rms';
import type { LineItemCredit } from '../../types';
import { formatCurrency } from '../../utils';

interface CreditsTabProps {
  invoice: Invoice;
  lineItemCredits: Record<string, LineItemCredit>;
}

export function CreditsTab({ invoice, lineItemCredits }: CreditsTabProps) {
  const creditsEntries = Object.entries(lineItemCredits);

  if (creditsEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mx-auto text-[var(--muted-foreground)] mb-4"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" strokeLinecap="round" />
        </svg>
        <p className="text-[var(--muted-foreground)]">
          No credits on this invoice
        </p>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Credits are inherited from linked order line items
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--muted)]/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                Credit ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                Line Item
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                Credit Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                Credit Total
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                Original Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                Original Total
              </th>
            </tr>
          </thead>
          <tbody>
            {creditsEntries.map(([lineItemId, credit]) => {
              const lineItem = invoice.lineItems.find((li) => li.id === lineItemId);
              const unitPrice =
                lineItem?.unitPrice || credit.originalTotal / credit.originalQty;
              const creditTotal = credit.creditQty * unitPrice;
              return (
                <tr key={lineItemId} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-sm font-medium">
                    {credit.creditName}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                      </svg>
                      {credit.creditType.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {lineItem?.partNumber ||
                      lineItem?.description ||
                      'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                    -{credit.creditQty}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                    {formatCurrency(-creditTotal)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {credit.originalQty}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCurrency(credit.originalTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

