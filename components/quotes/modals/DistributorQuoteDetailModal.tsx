'use client';

import React from 'react';
import { DistributorQuote, DistributorQuoteLine, CrossAuditLog } from '../types';

interface DistributorQuoteDetailModalProps {
  selectedDistributorQuote: DistributorQuote | null;
  distributorQuoteLines: DistributorQuoteLine[];
  crossAuditLog: CrossAuditLog[];
  onClose: () => void;
}

export function DistributorQuoteDetailModal({
  selectedDistributorQuote,
  distributorQuoteLines,
  crossAuditLog,
  onClose,
}: DistributorQuoteDetailModalProps) {
  if (!selectedDistributorQuote) return null;

  const filteredLines = distributorQuoteLines.filter(
    line => line.distributorQuoteId === selectedDistributorQuote.id
  );

  const filteredAuditLog = crossAuditLog.filter(
    log => log.distributorDomain === selectedDistributorQuote.distributorDomain
  ).slice(0, 3);

  const linesTotal = filteredLines
    .filter(line => line.finalPrice)
    .reduce((sum, line) => sum + (line.finalPrice! * line.quantity), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)] z-10">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {selectedDistributorQuote.distributorName} Quote
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">{selectedDistributorQuote.distributorDomain}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Original Total</p>
              <p className="text-xl font-semibold text-[var(--foreground)]">${selectedDistributorQuote.originalTotal.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 uppercase tracking-wider">Discounted Total</p>
              <p className="text-xl font-semibold text-green-700">${selectedDistributorQuote.discountedTotal.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 uppercase tracking-wider">Total Savings</p>
              <p className="text-xl font-semibold text-blue-700">${selectedDistributorQuote.totalDiscount.toLocaleString()}</p>
              <p className="text-xs text-blue-500">({(selectedDistributorQuote.discountPercent * 100).toFixed(1)}% off)</p>
            </div>
            <div className="p-4 bg-[var(--muted)]/30 rounded-lg">
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Line Status</p>
              <p className="text-xl font-semibold text-[var(--foreground)]">{selectedDistributorQuote.linesApproved}/{selectedDistributorQuote.totalLines}</p>
              <p className="text-xs text-[var(--muted-foreground)]">approved lines</p>
            </div>
          </div>

          {/* Status Alert */}
          {selectedDistributorQuote.linesRequiringCross > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                  <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
                  <path d="M3 17l7-12 7 12H3z"/>
                </svg>
                <div>
                  <p className="font-medium text-yellow-800">{selectedDistributorQuote.linesRequiringCross} lines require cross-reference</p>
                  <p className="text-sm text-yellow-700">These products are not carried by {selectedDistributorQuote.distributorName} and need alternative suggestions.</p>
                </div>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3">Line Items</h3>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--muted)]/30">
                  <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Manufacturer</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Original</th>
                    <th className="px-4 py-3 text-right">Discounted</th>
                    <th className="px-4 py-3 text-right">Ext. Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredLines.map(line => (
                    <tr key={line.id} className={`hover:bg-[var(--muted)]/20 ${line.status === 'requires_cross' ? 'bg-yellow-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm">{line.finalSku || line.originalSku}</div>
                        {line.finalSku && line.finalSku !== line.originalSku && (
                          <div className="text-xs text-[var(--muted-foreground)] line-through">{line.originalSku}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{line.description}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>{(line.finalManufacturer || line.originalManufacturer).replace('.com', '')}</div>
                        {line.finalManufacturer && line.finalManufacturer !== line.originalManufacturer && (
                          <div className="text-xs text-[var(--muted-foreground)] line-through">{line.originalManufacturer.replace('.com', '')}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{line.priceCategory || '—'}</td>
                      <td className="px-4 py-3 text-sm text-center">{line.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right">${line.originalPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                        {line.finalPrice ? `$${line.finalPrice.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {line.finalPrice ? `$${(line.finalPrice * line.quantity).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          line.status === 'approved' ? 'bg-green-100 text-green-700' :
                          line.status === 'requires_cross' ? 'bg-yellow-100 text-yellow-700' :
                          line.status === 'crossed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {line.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[var(--muted)]/30">
                  <tr className="font-semibold">
                    <td colSpan={7} className="px-4 py-3 text-right">Total:</td>
                    <td className="px-4 py-3 text-right text-green-600">
                      ${linesTotal.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Audit Trail */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-3">Pricing Audit Log</h3>
            <div className="space-y-2">
              {filteredAuditLog.map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-[var(--muted)]/20 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--muted-foreground)]">{new Date(log.timestamp).toLocaleString()}</span>
                    <span className="font-medium">{log.skuBefore}</span>
                    {log.skuAfter !== log.skuBefore && (
                      <>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                          <path d="M5 10h10M12 7l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-medium text-blue-600">{log.skuAfter}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      {log.priceCategoryApplied} (-{(log.discountPercent * 100).toFixed(0)}%)
                    </span>
                    {log.crossSource && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                        {log.crossSource} cross
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between items-center sticky bottom-0 bg-[var(--card)]">
          <button className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            Export to PDF
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Close
            </button>
            {selectedDistributorQuote.status === 'requires_cross' && (
              <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors">
                Resolve Cross References
              </button>
            )}
            {selectedDistributorQuote.status === 'ready_to_send' && (
              <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors">
                Send to Distributor
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
