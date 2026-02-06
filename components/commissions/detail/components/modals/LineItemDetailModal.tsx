/**
 * LineItemDetailModal Component
 * Modal for viewing and editing line item details
 * For invoices, fetches full invoice data and displays line items
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LineItem, CheckStatus } from '../../types';
import { fetchInvoiceById, type Invoice } from '@/components/lib/graphql/invoices';
import { fetchOrderById, type Order } from '@/components/lib/graphql/orders';

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
  const router = useRouter();
  const [amount, setAmount] = React.useState(Math.abs(item.paidCommission));

  // Invoice-specific state
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  // Fetch invoice details when the modal opens for an invoice item
  useEffect(() => {
    const loadInvoiceDetails = async () => {
      if (item.type !== 'invoice' || !item.invoiceId) return;

      setIsLoadingInvoice(true);
      try {
        const invoiceData = await fetchInvoiceById(item.invoiceId);
        setInvoice(invoiceData);

        // If invoice has an orderId, fetch the order for customer/job info
        if (invoiceData?.orderId) {
          const orderData = await fetchOrderById(invoiceData.orderId);
          setOrder(orderData);
        }
      } catch (err) {
        console.error('Failed to load invoice details:', err);
      } finally {
        setIsLoadingInvoice(false);
      }
    };

    loadInvoiceDetails();
  }, [item.type, item.invoiceId]);

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

  const formatCurrency = (value?: number | string) => {
    if (value === undefined || value === null) return '-';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '-';
    return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  };

  const formatPercentage = (value?: number | string) => {
    if (value === undefined || value === null) return '-';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '-';
    return `${numValue.toFixed(2)}%`;
  };

  const handleSaveAmount = () => {
    const finalAmount = item.type === 'credit' ? -Math.abs(amount) : amount;
    if (finalAmount !== item.paidCommission) {
      onUpdateAmount(item.id, Math.abs(amount));
    }
  };

  // For invoices, render a different layout with line items
  if (item.type === 'invoice') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal - wider for invoice details */}
        <div className="relative bg-[var(--card)] rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 text-xs font-medium rounded border bg-blue-100 text-blue-700 border-blue-200">
                Invoice
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
            {isLoadingInvoice ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]"></div>
                <span className="ml-3 text-[var(--muted-foreground)]">Loading invoice details...</span>
              </div>
            ) : (
              <>
                {/* Header Info Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                    Invoice Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Invoice Number
                      </label>
                      <p className="text-sm text-[var(--foreground)] font-medium">
                        {item.number || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Invoice Date
                      </label>
                      <p className="text-sm text-[var(--foreground)]">
                        {formatDate(item.entityDate || invoice?.entityDate)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Due Date
                      </label>
                      <p className="text-sm text-[var(--foreground)]">
                        {formatDate(item.dueDate || invoice?.dueDate)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Order Number
                      </label>
                      <p className="text-sm text-[var(--foreground)] font-medium">
                        {invoice?.order?.orderNumber || item.orderNumber || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Customer
                      </label>
                      <p className="text-sm text-[var(--foreground)]">
                        {order?.soldToCustomer?.companyName || order?.billToCustomer?.companyName || '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        End User
                      </label>
                      <p className="text-sm text-[var(--foreground)]">
                        {order?.billToCustomer?.companyName !== order?.soldToCustomer?.companyName
                          ? order?.billToCustomer?.companyName
                          : '-'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Job
                      </label>
                      <p className="text-sm text-[var(--foreground)]">
                        {order?.job?.jobName || '-'}
                      </p>
                    </div>

                    {item.invoiceId && (
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                          Actions
                        </label>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/invoices/${item.invoiceId}`);
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
                        >
                          Go to Invoice
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Line Items Section */}
                {invoice?.details && invoice.details.length > 0 && (
                  <div className="border-t border-[var(--border)] pt-6">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                      Line Items
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                            <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">
                              Part #
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">
                              Description
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">
                              Unit Price
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">
                              Quantity
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">
                              Line Total
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">
                              Comm %
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">
                              Commission $
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.details.map((detail, index) => (
                            <tr
                              key={detail.id || index}
                              className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30"
                            >
                              <td className="px-3 py-3 text-[var(--foreground)] font-medium">
                                {detail.product?.factoryPartNumber || detail.productNameAdhoc || '-'}
                              </td>
                              <td className="px-3 py-3 text-[var(--muted-foreground)]">
                                {detail.product?.description || detail.productDescriptionAdhoc || '-'}
                              </td>
                              <td className="px-3 py-3 text-right text-[var(--foreground)]">
                                {formatCurrency(detail.unitPrice)}
                              </td>
                              <td className="px-3 py-3 text-right text-[var(--foreground)]">
                                {detail.quantity || '-'}
                              </td>
                              <td className="px-3 py-3 text-right text-[var(--foreground)] font-medium">
                                {formatCurrency(detail.total)}
                              </td>
                              <td className="px-3 py-3 text-right text-[var(--foreground)]">
                                {formatPercentage(detail.commissionRate)}
                              </td>
                              <td className="px-3 py-3 text-right text-[var(--foreground)] font-medium">
                                {formatCurrency(detail.totalLineCommission)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[var(--muted)]/50 font-medium">
                            <td colSpan={4} className="px-3 py-3 text-right text-[var(--foreground)]">
                              Invoice Totals:
                            </td>
                            <td className="px-3 py-3 text-right text-[var(--foreground)]">
                              {formatCurrency(invoice.balance?.total)}
                            </td>
                            <td className="px-3 py-3 text-right text-[var(--foreground)]">
                              {formatPercentage(invoice.balance?.commissionRate)}
                            </td>
                            <td className="px-3 py-3 text-right text-[var(--foreground)]">
                              {formatCurrency(invoice.balance?.commission)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Commission Details for Check */}
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                    Commission on Check
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
                        ${Number(item.expectedCommission).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--muted)] rounded-lg">
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Applied Amount
                      </label>
                      {status === 'posted' ? (
                        <p className="text-lg font-semibold text-[var(--foreground)]">
                          ${Number(item.paidCommission).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </p>
                      ) : (
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                          onBlur={handleSaveAmount}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-white"
                          step="0.0001"
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
                        ${Number(item.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
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

  // Original layout for credits and adjustments

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
              item.type === 'credit'
                ? 'bg-orange-100 text-orange-700 border-orange-200'
                : 'bg-purple-100 text-purple-700 border-purple-200'
            }`}>
              {item.type === 'credit' ? 'Credit' : 'Adjustment'}
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
                  {item.type === 'credit' ? 'Credit Number' : 'Adjustment Number'}
                </label>
                <p className="text-sm text-[var(--foreground)] font-medium">
                  {item.number || '-'}
                </p>
              </div>

              {item.type === 'credit' && (
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
                        ${Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
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
                  ${Number(item.expectedCommission).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </p>
              </div>

              <div className="p-4 bg-[var(--muted)] rounded-lg">
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Applied Amount
                </label>
                {status === 'posted' ? (
                  <p className="text-lg font-semibold text-[var(--foreground)]">
                    ${Number(item.paidCommission).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </p>
                ) : (
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    onBlur={handleSaveAmount}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-white"
                    step="0.0001"
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
                  ${Number(item.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
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
