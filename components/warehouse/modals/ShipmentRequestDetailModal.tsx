'use client';

import React from 'react';
import {
  ShipmentRequest,
  shipmentRequestStatusColors,
  shipmentRequestStatusLabels,
  shipmentRequestMethodLabels,
  ShipmentRequestStatus,
} from '@/lib/types/warehouse';

interface ShipmentRequestDetailModalProps {
  request: ShipmentRequest;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onUpdateStatus?: (status: ShipmentRequestStatus) => void;
}

export default function ShipmentRequestDetailModal({
  request,
  onClose,
  onConfirm,
  onCancel,
  onUpdateStatus,
}: ShipmentRequestDetailModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const canConfirm = request.status === 'PENDING' || request.status === 'SENT';
  const canCancel = request.status !== 'RECEIVED' && request.status !== 'CANCELLED';
  const canMarkShipped = request.status === 'CONFIRMED';

  const getMethodIcon = () => {
    switch (request.requestMethod) {
      case 'EMAIL':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        );
      case 'CALL':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
          </svg>
        );
      case 'MANUFACTURER_SYSTEM':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        );
    }
  };

  const getMethodColor = () => {
    switch (request.requestMethod) {
      case 'EMAIL':
        return 'bg-blue-100 text-blue-700';
      case 'CALL':
        return 'bg-green-100 text-green-700';
      case 'MANUFACTURER_SYSTEM':
        return 'bg-purple-100 text-purple-700';
    }
  };

  const getPriorityColor = () => {
    switch (request.priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'expedited':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{request.requestNumber}</h2>
              <span className={`px-2 py-1 rounded text-xs font-medium ${shipmentRequestStatusColors[request.status]}`}>
                {shipmentRequestStatusLabels[request.status]}
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Request to {request.vendorName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[var(--muted)]/30 rounded-lg p-4">
              <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Requested Delivery</div>
              <div className="text-lg font-semibold text-[var(--foreground)] mt-1">{formatShortDate(request.requestedDeliveryDate)}</div>
            </div>
            <div className="bg-[var(--muted)]/30 rounded-lg p-4">
              <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Total Items</div>
              <div className="text-lg font-semibold text-[var(--foreground)] mt-1">{request.items.length} products</div>
            </div>
            <div className="bg-[var(--muted)]/30 rounded-lg p-4">
              <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Total Quantity</div>
              <div className="text-lg font-semibold text-[var(--foreground)] mt-1">{request.totalQuantity} units</div>
            </div>
          </div>

          {/* Request Details */}
          <div className="bg-[var(--muted)]/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Request Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--muted-foreground)]">Vendor:</span>
                <span className="ml-2 text-[var(--foreground)]">{request.vendorName}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Warehouse:</span>
                <span className="ml-2 text-[var(--foreground)]">{request.warehouseName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--muted-foreground)]">Request Method:</span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${getMethodColor()}`}>
                  {getMethodIcon()}
                  {shipmentRequestMethodLabels[request.requestMethod]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--muted-foreground)]">Priority:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPriorityColor()}`}>
                  {request.priority}
                </span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Created:</span>
                <span className="ml-2 text-[var(--foreground)]">{formatDate(request.createdAt)}</span>
              </div>
              {request.createdBy && (
                <div>
                  <span className="text-[var(--muted-foreground)]">Created By:</span>
                  <span className="ml-2 text-[var(--foreground)]">{request.createdBy}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info (for email requests) */}
          {request.requestMethod === 'EMAIL' && request.contactName && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email Contact
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Contact:</span>
                  <span className="ml-2 text-blue-900 font-medium">{request.contactName}</span>
                </div>
                <div>
                  <span className="text-blue-700">Email:</span>
                  <span className="ml-2 text-blue-900">{request.contactEmail}</span>
                </div>
                {request.emailSentAt && (
                  <div className="col-span-2">
                    <span className="text-blue-700">Email Sent:</span>
                    <span className="ml-2 text-blue-900">{formatDate(request.emailSentAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirmation Info (for call/system requests) */}
          {(request.requestMethod === 'CALL' || request.requestMethod === 'MANUFACTURER_SYSTEM') && request.confirmedAt && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Request Confirmation
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-700">Confirmed At:</span>
                  <span className="ml-2 text-green-900">{formatDate(request.confirmedAt)}</span>
                </div>
                {request.confirmedBy && (
                  <div>
                    <span className="text-green-700">Confirmed By:</span>
                    <span className="ml-2 text-green-900">{request.confirmedBy}</span>
                  </div>
                )}
                {request.confirmationNotes && (
                  <div className="col-span-2">
                    <span className="text-green-700">Notes:</span>
                    <p className="mt-1 text-green-900 bg-green-100 rounded p-2">{request.confirmationNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Line Items */}
          <div>
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Requested Items</h3>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Part Number</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Current Stock</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Requested</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {request.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{item.partNumber}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={item.currentStock <= (item.reorderPoint || 0) ? 'text-red-600 font-medium' : 'text-[var(--foreground)]'}>
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground)] text-right font-medium">{item.requestedQuantity}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[var(--muted)]/30">
                    <td colSpan={3} className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">Total</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)] text-right">{request.totalQuantity}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {request.notes && (
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">Notes</h3>
              <p className="text-sm text-[var(--muted-foreground)] bg-[var(--muted)]/20 rounded-lg p-3">
                {request.notes}
              </p>
            </div>
          )}

          {/* Linked Delivery */}
          {request.linkedShipmentId && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-indigo-900 mb-2 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 16v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h1"/>
                  <rect x="9" y="3" width="12" height="14" rx="2" ry="2"/>
                </svg>
                Linked Delivery
              </h3>
              <p className="text-sm text-indigo-700">
                This request is linked to incoming delivery <span className="font-mono font-medium">{request.linkedShipmentId}</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {canMarkShipped && onUpdateStatus && (
              <button
                onClick={() => onUpdateStatus('SHIPPED')}
                className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
              >
                Mark as Shipped
              </button>
            )}
            {canCancel && onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              >
                Cancel Request
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Close
            </button>
            {canConfirm && onConfirm && (
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Confirm Request
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
