'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockInvoices,
  mockSalesReps,
} from '../../lib/data/rms-mock';
import type { OrderSplitRate } from '../../lib/types/rms';
import {
  Invoice,
  invoiceStatusLabels,
  invoiceStatusColors,
} from '../../lib/types/rms';

interface InvoiceDetailContentProps {
  invoiceId: string;
}

export default function InvoiceDetailContent({ invoiceId }: InvoiceDetailContentProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);

  const invoice = useMemo(() => invoices.find(i => i.id === invoiceId), [invoices, invoiceId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (inv: Invoice) => {
    if (inv.status !== 'open' && inv.status !== 'partial_paid') return false;
    return new Date(inv.dueDate) < new Date();
  };

  // Commission split editing functions
  const startEditingSplits = () => {
    if (invoice) {
      setEditedSplits([...invoice.splitRates]);
      setEditingSplits(true);
    }
  };

  const cancelEditingSplits = () => {
    setEditingSplits(false);
    setEditedSplits([]);
  };

  const updateSplitPercentage = (index: number, newPercentage: number) => {
    const updated = [...editedSplits];
    updated[index] = { ...updated[index], splitPercentage: newPercentage };
    if (invoice) {
      updated[index].commissionAmount = (invoice.totalCommission * newPercentage) / 100;
    }
    setEditedSplits(updated);
  };

  const addNewSplit = () => {
    const newSplit: OrderSplitRate = {
      salesRepId: '',
      salesRepName: '',
      splitPercentage: 0,
      commissionAmount: 0,
    };
    setEditedSplits([...editedSplits, newSplit]);
  };

  const removeSplit = (index: number) => {
    setEditedSplits(editedSplits.filter((_, i) => i !== index));
  };

  const updateSplitRep = (index: number, repId: string) => {
    const rep = mockSalesReps.find(r => r.id === repId);
    if (rep) {
      const updated = [...editedSplits];
      updated[index] = { ...updated[index], salesRepId: repId, salesRepName: rep.name };
      setEditedSplits(updated);
    }
  };

  const saveSplits = () => {
    if (invoice) {
      const totalPercentage = editedSplits.reduce((sum, s) => sum + s.splitPercentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Split percentages must total 100%');
        return;
      }

      const updatedInvoice = {
        ...invoice,
        splitRates: editedSplits,
      };
      setInvoices(invoices.map(i => i.id === invoice.id ? updatedInvoice : i));
      setEditingSplits(false);
      setEditedSplits([]);
    }
  };

  const splitPercentageTotal = editedSplits.reduce((sum, s) => sum + s.splitPercentage, 0);

  if (!invoice) {
    return (
      <main className="flex-1 overflow-auto bg-[var(--background)] p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Invoice not found</h2>
          <p className="text-[var(--muted-foreground)] mt-2">The invoice you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/invoices')}
            className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Invoices
          </button>
        </div>
      </main>
    );
  }

  const overdue = isOverdue(invoice);

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{invoice.invoiceNumber}</h1>
              <p className="text-sm text-[var(--muted-foreground)]">{invoice.customerName}</p>
            </div>
          </div>

          {/* Status Tags */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${invoiceStatusColors[invoice.status]}`}>
              {invoiceStatusLabels[invoice.status]}
            </span>
            {overdue && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
                Overdue
              </span>
            )}
            {invoice.isLocked && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Locked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Details */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Invoice Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-[var(--muted-foreground)]">Invoice Date</span>
                  <p className="text-sm font-medium text-[var(--foreground)]">{formatDate(invoice.invoiceDate)}</p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted-foreground)]">Due Date</span>
                  <p className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                {invoice.entryDate && (
                  <div>
                    <span className="text-sm text-[var(--muted-foreground)]">Entry Date</span>
                    <p className="text-sm font-medium text-[var(--foreground)]">{formatDate(invoice.entryDate)}</p>
                  </div>
                )}
                {invoice.paidDate && (
                  <div>
                    <span className="text-sm text-[var(--muted-foreground)]">Paid Date</span>
                    <p className="text-sm font-medium text-green-600">{formatDate(invoice.paidDate)}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-[var(--muted-foreground)]">Order</span>
                  <p className="text-sm font-medium text-[var(--primary)] cursor-pointer hover:underline">
                    {invoice.orderNumber}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-[var(--muted-foreground)]">Manufacturer</span>
                  <p className="text-sm font-medium text-[var(--foreground)]">{invoice.manufacturerName}</p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Line Items ({invoice.lineItems.length})
              </h3>
              <div className="space-y-3">
                {invoice.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[var(--muted)]/30 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">{item.partNumber}</span>
                      <span className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(item.amount)}</span>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] mb-2">{item.description}</p>
                    <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                      <span>Qty: {item.quantity} @ {formatCurrency(item.unitPrice)}</span>
                      <span className="text-green-600">Comm: {formatCurrency(item.commissionAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Right column */}
          <div className="space-y-6">
            {/* Totals */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Invoice Totals</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Subtotal</span>
                  <span className="text-sm text-[var(--foreground)]">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Freight</span>
                  <span className="text-sm text-[var(--foreground)]">{formatCurrency(invoice.freight)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-3">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Total</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Amount Paid</span>
                  <span className="text-sm text-green-600">{formatCurrency(invoice.amountPaid)}</span>
                </div>
                {invoice.amountCredited > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Credits Applied</span>
                    <span className="text-sm text-red-600">-{formatCurrency(invoice.amountCredited)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[var(--border)] pt-3">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Balance Due</span>
                  <span className={`text-sm font-semibold ${invoice.balance > 0 ? 'text-[var(--foreground)]' : 'text-green-600'}`}>
                    {formatCurrency(invoice.balance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">Total Commission</span>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(invoice.totalCommission)}</span>
                </div>
              </div>
            </div>

            {/* Commission Splits */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Commission Splits</h3>
                {!editingSplits ? (
                  <button
                    onClick={startEditingSplits}
                    className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                  >
                    Edit
                  </button>
                ) : (
                  <span className={`text-sm ${Math.abs(splitPercentageTotal - 100) > 0.01 ? 'text-red-500' : 'text-green-600'}`}>
                    Total: {splitPercentageTotal.toFixed(1)}%
                  </span>
                )}
              </div>

              {!editingSplits ? (
                <div className="space-y-2">
                  {invoice.splitRates.map((split, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[var(--muted)]/30 rounded-lg p-3">
                      <div>
                        <span className="text-sm font-medium text-[var(--foreground)]">{split.salesRepName}</span>
                        <span className="ml-2 text-xs text-[var(--muted-foreground)]">{split.splitPercentage}%</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(split.commissionAmount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {editedSplits.map((split, idx) => (
                    <div key={idx} className="bg-[var(--muted)]/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={split.salesRepId}
                          onChange={(e) => updateSplitRep(idx, e.target.value)}
                          className="flex-1 px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                        >
                          <option value="">Select Rep...</option>
                          {mockSalesReps.map(rep => (
                            <option key={rep.id} value={rep.id}>{rep.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeSplit(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={split.splitPercentage}
                          onChange={(e) => updateSplitPercentage(idx, parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.5"
                          className="w-20 px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                        />
                        <span className="text-sm text-[var(--muted-foreground)]">%</span>
                        <span className="ml-auto text-sm font-medium text-green-600">
                          {formatCurrency(split.commissionAmount)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addNewSplit}
                    className="w-full py-2 border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                  >
                    + Add Split
                  </button>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={cancelEditingSplits}
                      className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveSplits}
                      disabled={Math.abs(splitPercentageTotal - 100) > 0.01}
                      className="flex-1 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Actions</h3>
              <div className="space-y-2">
                {(invoice.status === 'open' || invoice.status === 'partial_paid') && invoice.balance > 0 && (
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    Record Payment
                  </button>
                )}
                {invoice.status !== 'void' && invoice.status !== 'paid' && (
                  <button className="w-full px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                    Create Credit
                  </button>
                )}
                <button className="w-full px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
