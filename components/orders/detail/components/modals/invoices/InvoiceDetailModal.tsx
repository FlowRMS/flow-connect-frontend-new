/**
 * InvoiceDetailModal Component
 * Modal for viewing invoice details with beautiful presentation
 */

'use client';

import React from 'react';
import type { Invoice, OrderInvoice } from '../../../../api/invoicesApi';
import { formatCurrency } from '../../../utils';
import { CreatedByBadge } from '@/components/ui/CreatedByBadge';

// Status Configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  OPEN: { label: 'Open', color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-200' },
  PARTIAL: { label: 'Partial', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-200' },
  PAID: { label: 'Paid', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200' },
  VOID: { label: 'Void', color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-200' },
  POSTED: { label: 'Posted', color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-200' },
  PENDING: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-200' },
};

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: OrderInvoice | null;
  invoiceDetails: Invoice | null;
  isLoading?: boolean;
}

export function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  invoiceDetails,
  isLoading = false,
}: InvoiceDetailModalProps) {
  if (!isOpen || !invoice) return null;

  const statusConfig = invoice.status ? STATUS_CONFIG[invoice.status] : null;
  const details = invoiceDetails;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border)] bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  <path d="M13 3v5a1 1 0 001 1h5"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    {invoice.invoiceNumber || `Invoice #${invoice.id.substring(0, 8)}`}
                  </h2>
                  {statusConfig && (
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                      {statusConfig.label}
                    </span>
                  )}
                  {invoice.locked && (
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                      </svg>
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Invoice Details
                </p>
                {details?.createdBy && (
                  <CreatedByBadge
                    createdBy={details.createdBy.fullName || details.createdBy.email}
                    createdAt={details.createdAt}
                    size="sm"
                    className="mt-2"
                  />
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3" />
                <p className="text-sm text-[var(--muted-foreground)]">Loading invoice details...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                  <div className="text-sm font-medium text-indigo-600/70 mb-1">Total Amount</div>
                  <div className="text-3xl font-bold text-indigo-600">
                    {formatCurrency(details?.balance?.total || 0)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100">
                  <div className="text-sm font-medium text-emerald-600/70 mb-1">Commission</div>
                  <div className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(details?.balance?.commission || 0)}
                  </div>
                </div>
              </div>

              {/* Invoice Information */}
              <div className="bg-[var(--muted)]/20 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="8"/>
                    <path d="M10 6v4M10 14v.01"/>
                  </svg>
                  Invoice Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
                  <div>
                    <span className="text-[var(--muted-foreground)] block text-xs mb-1">Invoice Date</span>
                    <span className="font-medium">{formatDate(invoice.entityDate)}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)] block text-xs mb-1">Due Date</span>
                    <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)] block text-xs mb-1">Created At</span>
                    <span className="font-medium">{formatDate(invoice.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)] block text-xs mb-1">Status</span>
                    {statusConfig ? (
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    ) : (
                      <span className="font-medium">-</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)] block text-xs mb-1">Creation Type</span>
                    <span className="font-medium capitalize">{invoice.creationType?.toLowerCase() || '-'}</span>
                  </div>
                  {details?.factory && (
                    <div>
                      <span className="text-[var(--muted-foreground)] block text-xs mb-1">Factory</span>
                      <span className="font-medium">{details.factory.title || '-'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Balance Details */}
              {details?.balance && (
                <div className="bg-[var(--muted)]/20 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2M12 6v2m0 8v2"/>
                    </svg>
                    Balance Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-[var(--border)]">
                      <span className="text-[var(--muted-foreground)] block text-xs mb-1">Subtotal</span>
                      <span className="font-semibold text-lg">{formatCurrency(details.balance.subtotal || 0)}</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[var(--border)]">
                      <span className="text-[var(--muted-foreground)] block text-xs mb-1">Discount</span>
                      <span className="font-semibold text-lg text-red-600">-{formatCurrency(details.balance.discount || 0)}</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[var(--border)]">
                      <span className="text-[var(--muted-foreground)] block text-xs mb-1">Total</span>
                      <span className="font-semibold text-lg">{formatCurrency(details.balance.total || 0)}</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-[var(--border)]">
                      <span className="text-[var(--muted-foreground)] block text-xs mb-1">Paid</span>
                      <span className="font-semibold text-lg text-emerald-600">{formatCurrency(details.balance.paidBalance || 0)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items */}
              {details?.details && details.details.length > 0 && (
                <div className="bg-[var(--muted)]/20 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                    </svg>
                    Line Items ({details.details.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          <th className="text-left py-2 px-3 font-semibold text-[var(--muted-foreground)] text-xs">#</th>
                          <th className="text-left py-2 px-3 font-semibold text-[var(--muted-foreground)] text-xs">Product</th>
                          <th className="text-right py-2 px-3 font-semibold text-[var(--muted-foreground)] text-xs">Qty</th>
                          <th className="text-right py-2 px-3 font-semibold text-[var(--muted-foreground)] text-xs">Unit Price</th>
                          <th className="text-right py-2 px-3 font-semibold text-[var(--muted-foreground)] text-xs">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.details.map((item, index) => (
                          <tr key={item.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--muted)]/30">
                            <td className="py-2.5 px-3 text-[var(--muted-foreground)]">{item.itemNumber || index + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium">{item.productNameAdhoc || item.product?.factoryPartNumber || '-'}</div>
                              {item.productDescriptionAdhoc && (
                                <div className="text-xs text-[var(--muted-foreground)] truncate max-w-[200px]">
                                  {item.productDescriptionAdhoc}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">{item.quantity || 0}</td>
                            <td className="py-2.5 px-3 text-right">{formatCurrency(parseFloat(item.unitPrice || '0'))}</td>
                            <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(item.total || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[var(--muted)]/40">
                          <td colSpan={4} className="py-2.5 px-3 text-right font-semibold">Total:</td>
                          <td className="py-2.5 px-3 text-right font-bold text-indigo-600">
                            {formatCurrency(details.balance?.total || 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Order Reference */}
              {details?.order && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 flex-shrink-0 mt-0.5">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-blue-700 mb-1">Linked Order</p>
                    <p className="text-blue-600">
                      This invoice is linked to order <span className="font-semibold">{details.order.orderNumber}</span>
                      {details.order.soldToCustomer?.companyName && (
                        <> for <span className="font-semibold">{details.order.soldToCustomer.companyName}</span></>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20">
          <div className="flex items-center justify-end gap-3">
            {details?.url && (
              <a
                href={details.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 6H6a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-4M14 2h4m0 0v4m0-4L10 10"/>
                </svg>
                Open Invoice
              </a>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
