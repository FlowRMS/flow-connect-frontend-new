/**
 * AdjustmentDetailModal Component
 * Modal for viewing adjustment details with beautiful presentation
 */

'use client';

import React from 'react';
import type { AdjustmentLandingPage, AllocationMethod, AdjustmentStatus } from '../../../../api/adjustmentsApi';
import { formatCurrency } from '../../../utils';
import { CreatedByBadge } from '@/components/ui/CreatedByBadge';

// Allocation Method Configuration
const ALLOCATION_METHOD_CONFIG: Record<AllocationMethod, { label: string; color: string; bgColor: string }> = {
  REP_SPLIT: { label: 'Rep Split', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  CUSTOMER: { label: 'Customer', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  CHECK: { label: 'Check', color: 'text-purple-700', bgColor: 'bg-purple-100' },
};

// Status Configuration
const STATUS_CONFIG: Record<AdjustmentStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  POSTED: { label: 'Posted', color: 'text-green-700', bgColor: 'bg-green-100' },
  VOID: { label: 'Void', color: 'text-red-700', bgColor: 'bg-red-100' },
};

interface AdjustmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  adjustment: AdjustmentLandingPage | null;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function AdjustmentDetailModal({
  isOpen,
  onClose,
  adjustment,
  onEdit,
  onDelete,
  isDeleting = false,
}: AdjustmentDetailModalProps) {
  if (!isOpen || !adjustment) return null;

  const statusConfig = adjustment.status ? STATUS_CONFIG[adjustment.status] : null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">
                    {adjustment.adjustmentNumber || `Adjustment #${adjustment.id.substring(0, 8)}`}
                  </h2>
                  {statusConfig && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  )}
                  {adjustment.locked && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                      </svg>
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                  Commission Adjustment
                </p>
                <CreatedByBadge
                  createdBy={adjustment.createdBy}
                  createdAt={adjustment.createdAt}
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
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <div className="text-sm font-medium text-indigo-600/70 mb-1">Adjustment Amount</div>
            <div className="text-4xl font-bold text-indigo-600">{formatCurrency(parseFloat(adjustment.amount || '0'))}</div>
          </div>

          {/* Adjustment Details */}
          <div className="bg-[var(--muted)]/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v4M10 14v.01"/>
              </svg>
              Adjustment Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--muted-foreground)] block text-xs mb-0.5">Adjustment Date</span>
                <span className="font-medium">{formatDate(adjustment.entityDate)}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)] block text-xs mb-0.5">Created At</span>
                <span className="font-medium">{formatDate(adjustment.createdAt)}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)] block text-xs mb-0.5">Status</span>
                {statusConfig ? (
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                ) : (
                  <span className="font-medium">-</span>
                )}
              </div>
            </div>
            {adjustment.reason && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <span className="text-[var(--muted-foreground)] block text-xs mb-1">Reason / Notes</span>
                <p className="text-sm">{adjustment.reason}</p>
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 flex-shrink-0 mt-0.5">
              <circle cx="10" cy="10" r="8"/>
              <path d="M10 6v4M10 14v.01"/>
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Note</p>
              <p className="text-blue-600">
                This is a summary view. To see full adjustment details including split rates and factory information,
                use the Edit button to open the full adjustment editor.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20">
          <div className="flex items-center justify-end gap-3">
            {!adjustment.locked && onDelete && (
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
            {!adjustment.locked && onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9-3.5 1 1-3.5 9-9z"/>
                </svg>
                Edit Adjustment
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
