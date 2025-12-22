/**
 * RecordPaymentModal Component
 * Modal for recording payments on invoices
 */

'use client';

import React, { useState } from 'react';
import type { Invoice } from '@/lib/types/rms';
import { formatCurrency } from '../../utils';

interface RecordPaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSave: (updatedInvoice: Invoice) => void;
}

export function RecordPaymentModal({
  invoice,
  onClose,
  onSave,
}: RecordPaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState(invoice.balance);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<
    'check' | 'wire' | 'ach' | 'credit_card'
  >('check');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const remainingBalance = invoice.balance - paymentAmount;
  const isFullPayment = paymentAmount >= invoice.balance;
  const isValidAmount = paymentAmount > 0 && paymentAmount <= invoice.balance;

  const handleSave = () => {
    if (!isValidAmount) return;

    const newAmountPaid = invoice.amountPaid + paymentAmount;
    const newBalance =
      invoice.total - newAmountPaid - invoice.amountCredited;
    const newStatus =
      newBalance <= 0
        ? 'paid'
        : newAmountPaid > 0
        ? 'partial_paid'
        : invoice.status;

    const updatedInvoice: Invoice = {
      ...invoice,
      status: newStatus as Invoice['status'],
      amountPaid: newAmountPaid,
      balance: Math.max(0, newBalance),
      paidDate: newStatus === 'paid' ? paymentDate : invoice.paidDate,
      isLocked: newStatus === 'paid' ? true : invoice.isLocked,
    };

    onSave(updatedInvoice);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Record Payment
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {invoice.invoiceNumber}
            </p>
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
        <div className="p-6 space-y-4">
          {/* Invoice Summary */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">
                Invoice Total
              </span>
              <span className="text-[var(--foreground)]">
                {formatCurrency(invoice.total)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">
                Previously Paid
              </span>
              <span className="text-green-600">
                {formatCurrency(invoice.amountPaid)}
              </span>
            </div>
            {invoice.amountCredited > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">
                  Credits Applied
                </span>
                <span className="text-red-600">
                  -{formatCurrency(invoice.amountCredited)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t border-[var(--border)] pt-2">
              <span className="text-[var(--foreground)]">Balance Due</span>
              <span className="text-[var(--foreground)]">
                {formatCurrency(invoice.balance)}
              </span>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Payment Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.balance}
                value={paymentAmount}
                onChange={(e) =>
                  setPaymentAmount(parseFloat(e.target.value) || 0)
                }
                className="w-full pl-8 pr-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <div className="flex justify-between mt-2">
              <button
                onClick={() => setPaymentAmount(invoice.balance)}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                Pay Full Balance
              </button>
              {paymentAmount !== invoice.balance && (
                <span
                  className={`text-xs ${
                    remainingBalance > 0
                      ? 'text-[var(--muted-foreground)]'
                      : 'text-green-600'
                  }`}
                >
                  Remaining: {formatCurrency(Math.max(0, remainingBalance))}
                </span>
              )}
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as typeof paymentMethod)
              }
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="check">Check</option>
              <option value="wire">Wire Transfer</option>
              <option value="ach">ACH</option>
              <option value="credit_card">Credit Card</option>
            </select>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Reference / Check Number
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., Check #1234"
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional payment notes..."
              className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
            />
          </div>

          {/* Full Payment Notice */}
          {isFullPayment && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">
                  This will mark the invoice as fully paid
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Commission will become available for this invoice.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValidAmount}
            className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

