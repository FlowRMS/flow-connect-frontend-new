'use client';

import React from 'react';
import { FulfillmentOrderStatus, fulfillmentOrderStatusLabels } from '@/lib/types/warehouse';

const statusSteps: FulfillmentOrderStatus[] = ['PENDING', 'RELEASED', 'PICKING', 'PACKING', 'SHIPPING', 'SHIPPED'];

interface StatusProgressProps {
  currentStatus: FulfillmentOrderStatus;
  viewingStatus: FulfillmentOrderStatus | null;
  onStatusClick: (status: FulfillmentOrderStatus) => void;
  onBackToCurrent: () => void;
}

export default function StatusProgress({
  currentStatus,
  viewingStatus,
  onStatusClick,
  onBackToCurrent,
}: StatusProgressProps) {
  const getStatusStepIndex = (status: FulfillmentOrderStatus) => {
    const index = statusSteps.indexOf(status);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getStatusStepIndex(currentStatus);

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 mb-4">
      {viewingStatus && viewingStatus !== currentStatus && (
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border)]">
          <span className="text-xs text-[var(--muted-foreground)]">
            Viewing: <span className="font-medium text-[var(--foreground)]">{fulfillmentOrderStatusLabels[viewingStatus]}</span>
            <span className="mx-2">•</span>
            Actual status: <span className="font-medium text-[var(--primary)]">{fulfillmentOrderStatusLabels[currentStatus]}</span>
          </span>
          <button
            onClick={onBackToCurrent}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            Back to current
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        {statusSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isViewing = viewingStatus === step;

          return (
            <React.Fragment key={step}>
              <button
                onClick={() => onStatusClick(step)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium relative ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                  }`}
                >
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    index + 1
                  )}
                  {isViewing && !isCurrent && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <span className={`text-xs ${
                  isViewing && !isCurrent
                    ? 'text-amber-600 font-medium'
                    : isCurrent
                      ? 'text-[var(--primary)] font-medium'
                      : 'text-[var(--muted-foreground)]'
                }`}>
                  {fulfillmentOrderStatusLabels[step]}
                </span>
              </button>
              {index < statusSteps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-[var(--muted)]'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

