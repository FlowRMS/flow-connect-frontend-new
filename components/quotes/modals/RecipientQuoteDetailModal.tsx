'use client';

import React from 'react';
import { Recipient, LineItem } from '../types';

interface Totals {
  sellTotal: number;
  l1Total: number;
  l2Total: number;
  l3Total: number;
}

interface RecipientQuoteDetailModalProps {
  selectedRecipient: Recipient | null;
  quoteVersion: number;
  recipientQuoteVersion: number;
  showCompareView: boolean;
  quoteLineItems: LineItem[];
  totals: Totals;
  onClose: () => void;
  onVersionChange: (version: number) => void;
  onToggleCompare: () => void;
}

export function RecipientQuoteDetailModal({
  selectedRecipient,
  quoteVersion,
  recipientQuoteVersion,
  showCompareView,
  quoteLineItems,
  totals,
  onClose,
  onVersionChange,
  onToggleCompare,
}: RecipientQuoteDetailModalProps) {
  if (!selectedRecipient) return null;

  const getRecipientPrice = (item: LineItem) => {
    switch (selectedRecipient.level) {
      case 'Sell': return item.sellPrice;
      case 'L1': return item.level1Price;
      case 'L2': return item.level2Price;
      case 'L3': return item.level3Price;
      default: return item.sellPrice;
    }
  };

  const getRecipientTotal = () => {
    switch (selectedRecipient.level) {
      case 'Sell': return totals.sellTotal;
      case 'L1': return totals.l1Total;
      case 'L2': return totals.l2Total;
      case 'L3': return totals.l3Total;
      default: return totals.sellTotal;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Quote for {selectedRecipient.company}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {selectedRecipient.contact} • {selectedRecipient.email} • {selectedRecipient.level} Pricing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Version Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted-foreground)]">Version:</span>
              <select
                value={recipientQuoteVersion}
                onChange={(e) => onVersionChange(parseInt(e.target.value))}
                className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              >
                {[...Array(quoteVersion)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    v{i + 1} {i + 1 === quoteVersion ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
            {/* Compare Button */}
            <button
              onClick={onToggleCompare}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                showCompareView
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'border-[var(--border)] hover:bg-[var(--muted)]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="6" height="14" rx="1"/>
                <rect x="12" y="3" width="6" height="14" rx="1"/>
                <path d="M8 10h4" strokeLinecap="round"/>
              </svg>
              {showCompareView ? 'Exit Compare' : 'Compare to Original'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {showCompareView ? (
            /* Compare View - Side by Side */
            <div className="flex h-full">
              {/* Original Quote */}
              <div className="flex-1 border-r border-[var(--border)]">
                <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Original Quote (v{quoteVersion})</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">Base pricing from quote</p>
                </div>
                <div className="p-4 overflow-auto max-h-[60vh]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--muted)]/30 sticky top-0">
                      <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                        <th className="px-3 py-2">Part #</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {quoteLineItems.map(item => (
                        <tr key={item.id} className="hover:bg-[var(--muted)]/10">
                          <td className="px-3 py-2 font-mono text-xs">{item.productNumber}</td>
                          <td className="px-3 py-2 text-[var(--foreground)]">{item.description}</td>
                          <td className="px-3 py-2">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">${item.sellPrice.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-medium">${(item.sellPrice * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[var(--muted)]/30 font-semibold">
                      <tr>
                        <td colSpan={4} className="px-3 py-3 text-right">Total:</td>
                        <td className="px-3 py-3 text-right">${totals.sellTotal.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Recipient Quote */}
              <div className="flex-1">
                <div className="px-4 py-3 bg-blue-50 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-blue-900">{selectedRecipient.company} Quote (v{recipientQuoteVersion})</h3>
                  <p className="text-sm text-blue-700">{selectedRecipient.level} pricing level</p>
                </div>
                <div className="p-4 overflow-auto max-h-[60vh]">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-50/50 sticky top-0">
                      <tr className="text-left text-xs font-semibold text-blue-800 uppercase">
                        <th className="px-3 py-2">Part #</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                        <th className="px-3 py-2 text-right">Diff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {quoteLineItems.map(item => {
                        const recipientPrice = getRecipientPrice(item);
                        const diff = recipientPrice - item.sellPrice;
                        const diffPercent = ((recipientPrice - item.sellPrice) / item.sellPrice * 100);
                        return (
                          <tr key={item.id} className="hover:bg-blue-50/30">
                            <td className="px-3 py-2 font-mono text-xs">{item.productNumber}</td>
                            <td className="px-3 py-2 text-[var(--foreground)]">{item.description}</td>
                            <td className="px-3 py-2">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">${recipientPrice.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-medium">${(recipientPrice * item.quantity).toLocaleString()}</td>
                            <td className={`px-3 py-2 text-right text-xs ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {diff !== 0 ? `${diff > 0 ? '+' : ''}${diffPercent.toFixed(1)}%` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-blue-50 font-semibold">
                      <tr>
                        <td colSpan={4} className="px-3 py-3 text-right">Total:</td>
                        <td className="px-3 py-3 text-right text-blue-900">
                          ${getRecipientTotal().toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-green-600">
                          {selectedRecipient.level !== 'Sell' && (
                            <>+{((getRecipientTotal() - totals.sellTotal) / totals.sellTotal * 100).toFixed(1)}%</>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Line Items View */
            <div className="p-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Line Items</p>
                  <p className="text-xl font-semibold text-[var(--foreground)]">{quoteLineItems.length}</p>
                </div>
                <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Price Level</p>
                  <p className="text-xl font-semibold text-[var(--foreground)]">{selectedRecipient.level}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 uppercase tracking-wider">Quote Total</p>
                  <p className="text-xl font-semibold text-blue-700">
                    ${getRecipientTotal().toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
                  <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Status</p>
                  <p className="text-xl font-semibold text-[var(--foreground)]">
                    {selectedRecipient.sent ? (
                      <span className="text-green-600">Sent</span>
                    ) : (
                      <span className="text-yellow-600">Draft</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--muted)]/30">
                    <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      <th className="px-4 py-3">Section</th>
                      <th className="px-4 py-3">Part #</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Manufacturer</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {quoteLineItems.map(item => {
                      const recipientPrice = getRecipientPrice(item);
                      return (
                        <tr key={item.id} className="hover:bg-[var(--muted)]/10">
                          <td className="px-4 py-3 text-[var(--muted-foreground)]">{item.sectionName}</td>
                          <td className="px-4 py-3 font-mono text-xs text-[var(--foreground)]">{item.productNumber}</td>
                          <td className="px-4 py-3 text-[var(--foreground)]">{item.description}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--foreground)]">{item.manufacturers[0]?.name || 'Unknown'}</span>
                              <span className={`w-2 h-2 rounded-full ${
                                item.manufacturers[0]?.approvalStatus === 'approved' ? 'bg-green-500' :
                                item.manufacturers[0]?.approvalStatus === 'conditional' ? 'bg-yellow-500' :
                                item.manufacturers[0]?.approvalStatus === 'not_approved' ? 'bg-red-500' : 'bg-gray-400'
                              }`} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right font-medium">${recipientPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-[var(--foreground)]">
                            ${(recipientPrice * item.quantity).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-[var(--muted)]/30">
                    <tr className="font-semibold">
                      <td colSpan={6} className="px-4 py-3 text-right">Quote Total:</td>
                      <td className="px-4 py-3 text-right text-lg">
                        ${getRecipientTotal().toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between items-center bg-[var(--card)]">
          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
            <span>Version {recipientQuoteVersion} of {quoteVersion}</span>
            {selectedRecipient.sent && (
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <path d="M20 4L9 15l-5-5"/>
                </svg>
                Sent on {selectedRecipient.sent}
                {selectedRecipient.opened && ' • Opened'}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
              Export to PDF
            </button>
            <button className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
              Download Excel
            </button>
            {!selectedRecipient.sent && (
              <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
                Send to {selectedRecipient.company}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
