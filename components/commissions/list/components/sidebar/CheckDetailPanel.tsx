/**
 * CheckDetailPanel Component
 * Main sidebar panel that displays check details
 */

import type { CommissionCheck } from '@/lib/types/rms';
import { CheckStatusSection } from './CheckStatusSection';
import { CheckDetailsSection } from './CheckDetailsSection';
import { CheckLineItemsSection } from './CheckLineItemsSection';
import { CheckTotalsSection } from './CheckTotalsSection';

interface CheckDetailPanelProps {
  check: CommissionCheck;
  onClose: () => void;
}

export function CheckDetailPanel({ check, onClose }: CheckDetailPanelProps) {
  return (
    <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto shadow-xl z-40">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {check.checkNumber}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {check.salesRepName}
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
      <div className="p-6 space-y-6">
        {/* Status Section */}
        <CheckStatusSection check={check} />

        {/* Check Details */}
        <CheckDetailsSection check={check} />

        {/* Line Items */}
        <CheckLineItemsSection check={check} />

        {/* Totals */}
        <CheckTotalsSection check={check} />

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
          {check.status === 'draft' && (
            <>
              <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                Edit Check
              </button>
              <button className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
                Post Check
              </button>
            </>
          )}
          {check.status === 'posted' && (
            <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
              Print Check
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

