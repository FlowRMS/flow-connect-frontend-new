/**
 * AcknowledgementDetailModal Component
 * Modal for viewing acknowledgement details
 */

'use client';

import React, { useEffect, useState } from 'react';
import type { AcknowledgementLandingPage, OrderAcknowledgement, OrderAcknowledgementDetail } from '../../../../api/acknowledgementsApi';
import { fetchAcknowledgementById } from '../../../../api/acknowledgementsApi';
import { CreatedByBadge } from '@/components/ui/CreatedByBadge';

interface AcknowledgementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  acknowledgement: AcknowledgementLandingPage | null;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function AcknowledgementDetailModal({
  isOpen,
  onClose,
  acknowledgement,
  onEdit,
  onDelete,
  isDeleting = false,
}: AcknowledgementDetailModalProps) {
  const [fullAcknowledgement, setFullAcknowledgement] = useState<OrderAcknowledgement | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch full acknowledgement details when modal opens
  useEffect(() => {
    if (isOpen && acknowledgement?.id) {
      setIsLoadingDetails(true);
      fetchAcknowledgementById(acknowledgement.id)
        .then((data) => {
          setFullAcknowledgement(data);
        })
        .catch((error) => {
          console.error('Error fetching acknowledgement details:', error);
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });
    } else {
      setFullAcknowledgement(null);
    }
  }, [isOpen, acknowledgement?.id]);

  if (!isOpen || !acknowledgement) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get line items from full acknowledgement details
  const lineItemDetails = fullAcknowledgement?.details || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    {acknowledgement.orderAcknowledgementNumber || `ACK #${acknowledgement.id.substring(0, 8)}`}
                  </h2>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {acknowledgement.creationType || 'MANUAL'}
                  </span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                  Order #{acknowledgement.orderNumber || '-'}
                </p>
                <CreatedByBadge
                  createdBy={acknowledgement.createdBy}
                  createdAt={acknowledgement.createdAt}
                  size="sm"
                  className="mt-2"
                />
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
            <div>
              <div className="text-sm font-medium text-blue-600/70 mb-1">Acknowledged Quantity</div>
              <div className="text-3xl font-bold text-blue-900">{acknowledgement.quantity || '-'}</div>
            </div>
          </div>

          {/* Acknowledgement Details */}
          <div className="bg-[var(--muted)]/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v4M10 14v.01"/>
              </svg>
              Acknowledgement Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--muted-foreground)] block text-xs mb-0.5">Order Date</span>
                <span className="font-medium">{formatDate(acknowledgement.orderEntityDate)}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)] block text-xs mb-0.5">Created At</span>
                <span className="font-medium">{formatDate(acknowledgement.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="bg-[var(--muted)]/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h14v14H3z"/>
                <path d="M7 7h6M7 11h6"/>
              </svg>
              Line Items ({lineItemDetails.length})
            </h3>
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-4">
                <svg className="animate-spin h-5 w-5 text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="ml-2 text-sm text-[var(--muted-foreground)]">Loading line items...</span>
              </div>
            ) : lineItemDetails.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lineItemDetails.map((detail, index) => (
                  <div
                    key={detail.id || index}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-[var(--border)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded">
                          #{detail.orderDetail?.itemNumber || index + 1}
                        </span>
                        <span className="text-sm font-medium text-[var(--foreground)] truncate">
                          {detail.orderDetail?.productNameAdhoc || detail.orderDetail?.productDescriptionAdhoc || 'Line Item'}
                        </span>
                      </div>
                      {detail.orderDetail?.productDescriptionAdhoc && detail.orderDetail?.productNameAdhoc && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 truncate">
                          {detail.orderDetail.productDescriptionAdhoc}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="text-sm font-semibold text-[var(--foreground)]">
                        Qty: {detail.orderDetail?.quantity || '-'}
                      </div>
                      {detail.orderDetail?.unitPrice && (
                        <div className="text-xs text-[var(--muted-foreground)]">
                          ${parseFloat(detail.orderDetail.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}/ea
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                No line items linked to this acknowledgement
              </p>
            )}
          </div>

          {/* Order Details */}
          <div className="bg-[var(--muted)]/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="14" height="14" rx="2"/>
                <path d="M3 8h14"/>
                <path d="M7 2v4"/>
                <path d="M13 2v4"/>
              </svg>
              Order Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--muted-foreground)] block text-xs mb-0.5">Order Number</span>
                <span className="font-medium text-[var(--primary)]">{acknowledgement.orderNumber || '-'}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)] block text-xs mb-0.5">Order Date</span>
                <span className="font-medium">{formatDate(acknowledgement.orderEntityDate)}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)] block text-xs mb-0.5">Customer</span>
                <span className="font-medium">{acknowledgement.soldToCustomerName || '-'}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)] block text-xs mb-0.5">Factory</span>
                <span className="font-medium">{acknowledgement.factoryName || '-'}</span>
              </div>
            </div>
          </div>

          {/* Product Information */}
          {acknowledgement.productName && (
            <div className="bg-[var(--muted)]/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h14v14H3z"/>
                  <path d="M7 7h6M7 11h6"/>
                </svg>
                Product Information
              </h3>
              <div className="text-sm">
                <span className="text-[var(--muted-foreground)] block text-xs mb-0.5">Product</span>
                <span className="font-medium">{acknowledgement.productName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20">
          <div className="flex items-center justify-end gap-3">
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h12M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 10v5M12 10v5M5 6l1 11a2 2 0 002 2h4a2 2 0 002-2l1-11"/>
                  </svg>
                )}
                Delete
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-[var(--primary)] border border-[var(--primary)]/30 rounded-lg hover:bg-[var(--primary)]/10 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9-3.5 1 1-3.5 9-9z"/>
                </svg>
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
