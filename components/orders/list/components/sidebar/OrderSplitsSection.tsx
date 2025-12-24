/**
 * OrderSplitsSection Component
 * Displays and edits commission splits
 */

import type { Order, OrderSplitRate } from '@/lib/types/rms';
import { formatCurrency } from '../../utils';
import { mockSalesReps } from '@/lib/data/rms-mock';

interface OrderSplitsSectionProps {
  order: Order;
  editingSplits: boolean;
  editedSplits: OrderSplitRate[];
  splitPercentageTotal: number;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveSplits: () => void;
  onUpdateSplitPercentage: (index: number, percentage: number) => void;
  onAddNewSplit: () => void;
  onRemoveSplit: (index: number) => void;
  onUpdateSplitRep: (index: number, repId: string) => void;
}

export function OrderSplitsSection({
  order,
  editingSplits,
  editedSplits,
  splitPercentageTotal,
  onStartEditing,
  onCancelEditing,
  onSaveSplits,
  onUpdateSplitPercentage,
  onAddNewSplit,
  onRemoveSplit,
  onUpdateSplitRep,
}: OrderSplitsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Commission Splits
        </h3>
        {!editingSplits ? (
          <button
            onClick={onStartEditing}
            className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
          >
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs ${
                Math.abs(splitPercentageTotal - 100) > 0.01
                  ? 'text-red-500'
                  : 'text-green-600'
              }`}
            >
              Total: {splitPercentageTotal.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {!editingSplits ? (
        <div className="space-y-2">
          {order.splitRates.map((split, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-[var(--muted)]/30 rounded-lg p-3"
            >
              <div>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {split.salesRepName}
                </span>
                <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                  {split.splitPercentage}%
                </span>
              </div>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(split.commissionAmount)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {editedSplits.map((split, idx) => (
            <div
              key={idx}
              className="bg-[var(--muted)]/30 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <select
                  value={split.salesRepId}
                  onChange={(e) => onUpdateSplitRep(idx, e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Select Rep...</option>
                  {mockSalesReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onRemoveSplit(idx)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove split"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={split.splitPercentage}
                  onChange={(e) =>
                    onUpdateSplitPercentage(idx, parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  max="100"
                  step="0.5"
                  className="w-20 px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                />
                <span className="text-sm text-[var(--muted-foreground)]">%</span>
                <span className="ml-auto text-sm font-medium text-green-600">
                  {formatCurrency(split.commissionAmount)}
                </span>
              </div>
            </div>
          ))}

          <button
            onClick={onAddNewSplit}
            className="w-full py-2 border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          >
            + Add Split
          </button>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onCancelEditing}
              className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSaveSplits}
              disabled={Math.abs(splitPercentageTotal - 100) > 0.01}
              className="flex-1 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
