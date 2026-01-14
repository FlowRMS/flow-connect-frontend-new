'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FulfillmentOrder, FulfillmentOrderStatus } from '../api/fulfillmentApi';
import { fulfillmentOrderStatusColors, fulfillmentOrderStatusLabels } from '@/lib/types/warehouse';

interface FulfillmentHeaderProps {
  fulfillmentOrder: FulfillmentOrder;
  onSave: () => void;
  onContinue: () => void;
  canContinue: boolean;
  continueButtonText: string;
  continueButtonColor: string;
  blockedReason?: string;
}

export default function FulfillmentHeader({
  fulfillmentOrder,
  onSave,
  onContinue,
  canContinue,
  continueButtonText,
  continueButtonColor,
  blockedReason,
}: FulfillmentHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4 mb-4">
      <button
        onClick={() => router.push('/warehouse/fulfillment')}
        className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {fulfillmentOrder.fulfillmentOrderNumber}
          </h1>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${fulfillmentOrderStatusColors[fulfillmentOrder.status]}`}>
            {fulfillmentOrderStatusLabels[fulfillmentOrder.status]}
          </span>
          {/* FO Lock Indicator */}
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-200" title="Order lines are locked to this fulfillment order">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Locked
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-[var(--muted-foreground)]">From order:</span>
          <Link
            href={`/orders/${fulfillmentOrder.orderId}`}
            className="text-sm text-[var(--primary)] hover:underline font-medium"
          >
            {fulfillmentOrder.orderNumber}
          </Link>
          <span className="text-sm text-[var(--muted-foreground)]">|</span>
          <span className="text-sm text-[var(--muted-foreground)]">{fulfillmentOrder.customerName}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Save Button - Always visible */}
        <button
          onClick={onSave}
          className="px-5 py-2.5 border-2 border-[var(--border)] rounded-lg font-semibold text-sm hover:bg-[var(--muted)] transition-colors"
        >
          Save
        </button>

        {/* Dynamic Continue Button based on status */}
        {canContinue ? (
          <button
            onClick={onContinue}
            className={`px-5 py-2.5 ${continueButtonColor} text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {continueButtonText}
          </button>
        ) : blockedReason ? (
          <button
            disabled
            className={`px-5 py-2.5 ${continueButtonColor} text-white rounded-lg font-semibold text-sm cursor-not-allowed flex items-center gap-2 opacity-90`}
            title={blockedReason}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {continueButtonText}
          </button>
        ) : null}

        {fulfillmentOrder.status === 'SHIPPED' && (
          <button
            disabled
            className="px-5 py-2.5 bg-gray-400 text-white rounded-lg font-semibold text-sm cursor-not-allowed flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Completed
          </button>
        )}
      </div>
    </div>
  );
}

