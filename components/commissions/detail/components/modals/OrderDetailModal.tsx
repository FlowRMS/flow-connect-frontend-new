/**
 * OrderDetailModal Component
 * Modal for viewing order details when clicking on order number in commission line items
 */

'use client';

import React, { useEffect, useState } from 'react';
import { fetchOrderById, type Order } from '@/components/lib/graphql/orders';
import { fetchUserById } from '@/components/lib/api/search';

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
}

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outsideRepNames, setOutsideRepNames] = useState<string[]>([]);

  useEffect(() => {
    const loadOrder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const orderData = await fetchOrderById(orderId);
        setOrder(orderData);

        // Fetch outside rep names if available
        if (orderData?.details && orderData.details.length > 0) {
          const firstDetail = orderData.details[0];
          if (firstDetail?.outsideSplitRates && firstDetail.outsideSplitRates.length > 0) {
            const userIds = firstDetail.outsideSplitRates
              .map(rate => rate.userId)
              .filter((id): id is string => !!id);

            // Fetch user names in parallel
            const userPromises = userIds.map(userId => fetchUserById(userId));
            const users = await Promise.all(userPromises);
            const names = users
              .filter(user => user !== null)
              .map(user => user!.fullName || `${user!.firstName || ''} ${user!.lastName || ''}`.trim() || user!.email || '-');
            setOutsideRepNames(names);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

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
    return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value?: number | string) => {
    if (value === undefined || value === null) return '-';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '-';
    return `${numValue.toFixed(2)}%`;
  };

  // Get outside rep name from fetched user data
  const getOutsideRepDisplay = () => {
    if (outsideRepNames.length === 0) return '-';
    return outsideRepNames.join(', ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--card)] rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 text-xs font-medium rounded border bg-emerald-100 text-emerald-700 border-emerald-200">
              Order
            </span>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {isLoading ? 'Loading...' : order?.orderNumber || 'Order Details'}
            </h2>
            {order?.headerStatus && (
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                order.headerStatus === 'SHIPPED'
                  ? 'bg-green-100 text-green-700'
                  : order.headerStatus === 'CANCELLED'
                  ? 'bg-red-100 text-red-700'
                  : order.headerStatus === 'DRAFT'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {order.headerStatus}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
              <span className="ml-3 text-[var(--muted-foreground)]">Loading order details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : order ? (
            <>
              {/* Header Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                  Order Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Order Number
                    </label>
                    <p className="text-sm text-[var(--foreground)] font-medium">
                      {order.orderNumber}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Order Date
                    </label>
                    <p className="text-sm text-[var(--foreground)]">
                      {formatDate(order.entityDate)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Customer
                    </label>
                    <p className="text-sm text-[var(--foreground)]">
                      {order.soldToCustomer?.companyName || order.billToCustomer?.companyName || '-'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      End User
                    </label>
                    <p className="text-sm text-[var(--foreground)]">
                      {order.billToCustomer?.companyName !== order.soldToCustomer?.companyName
                        ? order.billToCustomer?.companyName
                        : '-'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Job
                    </label>
                    <p className="text-sm text-[var(--foreground)]">
                      {order.job?.jobName || '-'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Due Date
                    </label>
                    <p className="text-sm text-[var(--foreground)]">
                      {formatDate(order.dueDate)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      Outside Rep
                    </label>
                    <p className="text-sm text-[var(--foreground)]">
                      {getOutsideRepDisplay()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Line Items Section */}
              <div className="border-t border-[var(--border)] pt-6">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                  Line Items
                </h3>

                {order.details && order.details.length > 0 ? (
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
                        {order.details.map((detail, index) => (
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
                            Order Totals:
                          </td>
                          <td className="px-3 py-3 text-right text-[var(--foreground)]">
                            {formatCurrency(order.balance?.total)}
                          </td>
                          <td className="px-3 py-3 text-right text-[var(--foreground)]">
                            {formatPercentage(order.balance?.commissionRate)}
                          </td>
                          <td className="px-3 py-3 text-right text-[var(--foreground)]">
                            {formatCurrency(order.balance?.commission)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="text-[var(--muted-foreground)] text-center py-4">
                    No line items found for this order.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--muted-foreground)]">Order not found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-[var(--border)] bg-[var(--muted)]/30">
          {order?.url && (
            <a
              href={order.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors mr-2"
            >
              View in ERP
            </a>
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
