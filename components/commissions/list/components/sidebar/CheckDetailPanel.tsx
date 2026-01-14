/**
 * CheckDetailPanel Component
 * Main sidebar panel that displays check details
 */

import { useRouter } from 'next/navigation';
import type { CommissionCheck } from '@/lib/types/rms';
import { CheckStatusSection } from './CheckStatusSection';
import { CheckDetailsSection } from './CheckDetailsSection';
import { CheckLineItemsSection } from './CheckLineItemsSection';
import { CheckTotalsSection } from './CheckTotalsSection';

interface CheckDetailPanelProps {
  check: CommissionCheck;
  onClose: () => void;
  onPostCheck?: (checkId: string) => void;
  onUnpostCheck?: (checkId: string) => void;
  isUpdating?: boolean;
}

export function CheckDetailPanel({
  check,
  onClose,
  onPostCheck,
  onUnpostCheck,
  isUpdating = false,
}: CheckDetailPanelProps) {
  const router = useRouter();
  const status = check.status?.toUpperCase();
  const isPosted = status === 'POSTED';
  const isOpen = status === 'OPEN' || status === 'DRAFT';

  const handleEditClick = () => {
    router.push(`/commissions/${check.id}`);
  };

  const handlePostClick = () => {
    if (onPostCheck) {
      onPostCheck(check.id);
    }
  };

  const handleUnpostClick = () => {
    if (onUnpostCheck) {
      onUnpostCheck(check.id);
    }
  };

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
          {isOpen && (
            <>
              <button
                onClick={handleEditClick}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Edit Check
              </button>
              <button
                onClick={handlePostClick}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Posting...
                  </>
                ) : (
                  'Post Check'
                )}
              </button>
            </>
          )}
          {isPosted && (
            <>
              <button
                onClick={handleEditClick}
                className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                View Check
              </button>
              <button
                onClick={handleUnpostClick}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Unposting...
                  </>
                ) : (
                  'Unpost Check'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
