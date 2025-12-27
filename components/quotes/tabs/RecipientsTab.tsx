'use client';

import React from 'react';
import type { Quote, LineItem, Recipient, DistributorQuote } from '../types';

interface Totals {
  baseTotal: number;
  sellTotal: number;
  l1Total: number;
  l2Total: number;
  l3Total: number;
  overage: number;
  commission: number;
}

interface RecipientsTabProps {
  quoteLineItems: LineItem[];
  selectedQuote: Quote;
  totals: Totals;
  quoteDistributorQuotes: DistributorQuote[];
  onShowDistributorModal: () => void;
  onShowApprovalRequestModal: () => void;
  onSelectRecipient: (recipient: Recipient, version: number) => void;
  onSelectDistributorQuote: (quote: DistributorQuote) => void;
}

export function RecipientsTab({
  quoteLineItems,
  selectedQuote,
  totals,
  quoteDistributorQuotes,
  onShowDistributorModal,
  onShowApprovalRequestModal,
  onSelectRecipient,
  onSelectDistributorQuote,
}: RecipientsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Recipients</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Manage quote recipients, distributor quotes, and send quotes</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            Add Recipient
          </button>
          <button
            onClick={onShowDistributorModal}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="14" height="14" rx="2"/>
              <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
            </svg>
            Generate All Distributor Quotes
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h12v12l-3-3H7l-3 3V4z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Send to Selected
          </button>
        </div>
      </div>

      {/* Approval Warning */}
      {quoteLineItems.some(li => li.manufacturers[0].approvalStatus === 'not_approved') && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600 mt-0.5">
              <path d="M10 6v4M10 14h.01"/>
              <circle cx="10" cy="10" r="7"/>
            </svg>
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800">Approval Warning</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {quoteLineItems.filter(li => li.manufacturers[0].approvalStatus === 'not_approved').length} manufacturers on this quote need approval from {selectedQuote.soldToCustomer}:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                {Object.entries(
                  quoteLineItems
                    .filter(li => li.manufacturers[0].approvalStatus === 'not_approved')
                    .reduce((acc, li) => {
                      const mfr = li.manufacturers[0].name;
                      if (!acc[mfr]) acc[mfr] = { lines: 0, value: 0 };
                      acc[mfr].lines++;
                      acc[mfr].value += li.sellPrice * li.quantity;
                      return acc;
                    }, {} as Record<string, { lines: number; value: number }>)
                ).map(([name, data]) => (
                  <li key={name}>• {name} ({data.lines} lines, ${data.value.toLocaleString()})</li>
                ))}
              </ul>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={onShowApprovalRequestModal}
                  className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                >
                  Request Approvals Now
                </button>
                <button className="px-3 py-1.5 text-sm text-yellow-700 hover:underline">
                  Send Anyway (Not Recommended)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipients Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--muted)]/30">
            <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" className="accent-[var(--primary)]" />
              </th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Distributor Quote</th>
              <th className="px-4 py-3">Sent</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {((): Recipient[] => [
              { id: 'rec-1', company: 'Graybar Electric', contact: 'John Smith', email: 'john@graybar.com', level: 'Sell', price: totals.sellTotal, sent: 'Mar 15', opened: true, distributorQuote: quoteDistributorQuotes.find(dq => dq.distributorName === 'Graybar Electric') || null, version: 3 },
              { id: 'rec-2', company: 'HD Supply', contact: 'Sarah Lee', email: 'sarah@hdsupply.com', level: 'L1', price: totals.l1Total, sent: null, opened: false, distributorQuote: quoteDistributorQuotes.find(dq => dq.distributorName === 'HD Supply') || null, version: 2 },
              { id: 'rec-3', company: selectedQuote.soldToCustomer, contact: 'Mike Johnson', email: 'mike@turner.com', level: 'Sell', price: totals.sellTotal, sent: 'Mar 15', opened: true, distributorQuote: null, version: 3 },
              { id: 'rec-4', company: 'Echo Electric', contact: 'Amy Wong', email: 'amy@echo.com', level: 'L1', price: totals.l1Total, sent: null, opened: false, distributorQuote: null, version: 1 },
            ])().map((recipient, idx) => (
              <tr key={idx} className="hover:bg-[var(--muted)]/20 cursor-pointer" onClick={() => onSelectRecipient(recipient, recipient.version)}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="accent-[var(--primary)]"
                    defaultChecked={!recipient.sent}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-[var(--primary)] hover:underline">{recipient.company}</td>
                <td className="px-4 py-3 text-[var(--foreground)]">{recipient.contact}</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">{recipient.email}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select className="px-2 py-1 text-sm border border-[var(--border)] rounded bg-white" defaultValue={recipient.level}>
                    <option value="Sell">Sell</option>
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                    <option value="L3">L3</option>
                  </select>
                </td>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">${recipient.price.toLocaleString()}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {recipient.distributorQuote ? (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        recipient.distributorQuote.status === 'ready_to_send' ? 'bg-green-100 text-green-700' :
                        recipient.distributorQuote.status === 'requires_cross' ? 'bg-yellow-100 text-yellow-700' :
                        recipient.distributorQuote.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {recipient.distributorQuote.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <button
                        onClick={() => onSelectDistributorQuote(recipient.distributorQuote!)}
                        className="text-xs text-[var(--primary)] hover:underline"
                      >
                        View
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        alert(`Creating distributor quote for ${recipient.company}...`);
                      }}
                      className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                    >
                      + Create
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  {recipient.sent ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--muted-foreground)]">{recipient.sent}</span>
                      {recipient.opened && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">Opened</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--muted-foreground)]">—</span>
                  )}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="10" cy="5" r="1"/>
                      <circle cx="10" cy="10" r="1"/>
                      <circle cx="10" cy="15" r="1"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Send History */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Send History</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3 p-3 bg-[var(--muted)]/20 rounded-lg">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 mt-0.5">
              <path d="M20 4L9 15l-5-5"/>
            </svg>
            <div className="flex-1">
              <p className="text-sm text-[var(--foreground)]">
                <span className="font-medium">Quote sent to Graybar Electric</span> - John Smith
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Mar 15, 2024 at 2:30 PM • Sell Price: $2,450,000 • Opened Mar 15 at 3:45 PM
              </p>
            </div>
            <button className="text-sm text-[var(--primary)] hover:underline">Resend</button>
          </div>
          <div className="flex items-start gap-3 p-3 bg-[var(--muted)]/20 rounded-lg">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600 mt-0.5">
              <path d="M20 4L9 15l-5-5"/>
            </svg>
            <div className="flex-1">
              <p className="text-sm text-[var(--foreground)]">
                <span className="font-medium">Quote sent to {selectedQuote.soldToCustomer}</span> - Mike Johnson
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Mar 15, 2024 at 2:30 PM • Sell Price: $2,450,000 • Opened Mar 16 at 9:15 AM
              </p>
            </div>
            <button className="text-sm text-[var(--primary)] hover:underline">Resend</button>
          </div>
        </div>
      </div>
    </div>
  );
}
