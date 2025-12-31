/**
 * LineItemDetailModal Component
 * Modal for viewing and editing line item details
 */

'use client';

import React from 'react';
import type { LineItem, CheckStatus } from '../../types';

interface LineItemDetailModalProps {
  item: LineItem;
  status: CheckStatus;
  onClose: () => void;
  onTogglePaid: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateAmount: (id: string, amount: number) => void;
}

export function LineItemDetailModal({
  item,
  status,
  onClose,
  onTogglePaid,
  onDelete,
  onUpdateAmount,
}: LineItemDetailModalProps) {
  const [amount, setAmount] = React.useState(Math.abs(item.paidCommission));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleSaveAmount = () => {
    const finalAmount = item.type === 'credit' ? -Math.abs(amount) : amount;
    if (finalAmount !== item.paidCommission) {
      onUpdateAmount(item.id, Math.abs(amount));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--card)] rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs font-medium rounded border ${
              item.type === 'invoice'
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : item.type === 'credit'
                ? 'bg-orange-100 text-orange-700 border-orange-200'
                : 'bg-purple-100 text-purple-700 border-purple-200'
            }`}>
              {item.type === 'invoice' ? 'Invoice' : item.type === 'credit' ? 'Credit' : 'Adjustment'}
            </span>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {item.number || 'No Number'}
            </h2>
            {item.status && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                item.status === 'PAID'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {item.status}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  {item.type === 'invoice' ? 'Invoice Number' : item.type === 'credit' ? 'Credit Number' : 'Adjustment Number'}
                </label>
                <p className="text-sm text-[var(--foreground)] font-medium">
                  {item.number || '-'}
                </p>
              </div>

              {item.type !== 'adjustment' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Order Number
                  </label>
                  <p className="text-sm text-[var(--foreground)] font-medium">
                    {item.orderNumber || '-'}
                  </p>
                </div>
              )}

              {item.type === 'adjustment' && item.factoryName && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Factory
                  </label>
                  <p className="text-sm text-[var(--foreground)] font-medium">
                    {item.factoryName}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Entity Date
                </label>
                <p className="text-sm text-[var(--foreground)]">
                  {formatDate(item.entityDate)}
                </p>
              </div>

              {item.type === 'invoice' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Due Date
                  </label>
                  <p className="text-sm text-[var(--foreground)]">
                    {formatDate(item.dueDate)}
                  </p>
                </div>
              )}

              {item.type === 'credit' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Credit Type
                    </label>
                    <p className="text-sm text-[var(--foreground)]">
                      {item.creditType || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Reason
                    </label>
                    <p className="text-sm text-[var(--foreground)]">
                      {item.reason || '-'}
                    </p>
                  </div>
                </>
              )}

              {item.type === 'adjustment' && (
                <>
                  {item.amount !== undefined && (
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Original Amount
                      </label>
                      <p className="text-sm text-[var(--foreground)] font-medium">
                        ${item.amount.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Reason
                    </label>
                    <p className="text-sm text-[var(--foreground)]">
                      {item.reason || '-'}
                    </p>
                  </div>
                  {item.locked !== undefined && (
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Locked
                      </label>
                      <p className="text-sm text-[var(--foreground)]">
                        {item.locked ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Status
                </label>
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                  item.status === 'PAID' || item.status === 'POSTED'
                    ? 'bg-green-100 text-green-700'
                    : item.status === 'PENDING' || item.status === 'OPEN'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {item.status || 'Unknown'}
                </span>
              </div>

              <div className={item.type !== 'adjustment' ? 'opacity-50' : ''}>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  <span className="flex items-center gap-1.5">
                    Customer
                    {item.type !== 'adjustment' && (
                      <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                        Soon
                      </span>
                    )}
                  </span>
                </label>
                <p className="text-sm text-[var(--foreground)]">
                  {item.customerName || item.customer || '-'}
                </p>
              </div>

              <div className="opacity-50">
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  <span className="flex items-center gap-1.5">
                    Sales Rep
                    <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                      Soon
                    </span>
                  </span>
                </label>
                <p className="text-sm text-[var(--foreground)]">
                  {item.salesRep || '-'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Created At
                </label>
                <p className="text-sm text-[var(--foreground)]">
                  {formatDate(item.createdAt)}
                </p>
              </div>

              {item.url && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    URL
                  </label>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    View in ERP
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Commission Details */}
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
              Commission Details
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--muted)] rounded-lg opacity-50">
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  <span className="flex items-center gap-1.5">
                    Expected Commission
                    <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                      Soon
                    </span>
                  </span>
                </label>
                <p className="text-lg font-semibold text-[var(--muted-foreground)]">
                  ${item.expectedCommission.toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-[var(--muted)] rounded-lg">
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Applied Amount
                </label>
                {status === 'posted' ? (
                  <p className="text-lg font-semibold text-[var(--foreground)]">
                    ${item.paidCommission.toFixed(2)}
                  </p>
                ) : (
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    onBlur={handleSaveAmount}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-white"
                    step="0.01"
                  />
                )}
              </div>

              <div className="p-4 bg-[var(--muted)] rounded-lg opacity-50">
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  <span className="flex items-center gap-1.5">
                    Balance
                    <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                      Soon
                    </span>
                  </span>
                </label>
                <p className="text-lg font-semibold text-[var(--muted-foreground)]">
                  ${item.balance.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Paid Checkbox */}
            {status !== 'posted' && (
              <div className="mt-4 flex items-center gap-2 opacity-50">
                <input
                  type="checkbox"
                  id="paid-checkbox"
                  checked={item.paid}
                  disabled
                  className="w-4 h-4 accent-[var(--primary)] cursor-not-allowed"
                />
                <label
                  htmlFor="paid-checkbox"
                  className="text-sm text-[var(--foreground)] cursor-not-allowed"
                >
                  Mark as Paid
                </label>
                <span className="text-[9px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded font-medium">
                  Coming Soon
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[var(--border)] bg-[var(--muted)]/30">
          {status !== 'posted' ? (
            <button
              onClick={() => onDelete(item.id)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Remove from Check
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
