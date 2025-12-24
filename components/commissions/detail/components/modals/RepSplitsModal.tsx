/**
 * RepSplitsModal Component
 * Modal for configuring commission splits among sales reps
 */

'use client';

import React from 'react';
import type { RepSplit } from '../../types';

interface RepSplitsModalProps {
  tempRepSplits: RepSplit[];
  totalSplitPercentage: number;
  availableReps: string[];
  onAddRep: () => void;
  onRemoveRep: (index: number) => void;
  onUpdateRepSplit: (
    index: number,
    field: keyof RepSplit,
    value: string | number
  ) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function RepSplitsModal({
  tempRepSplits,
  totalSplitPercentage,
  availableReps,
  onAddRep,
  onRemoveRep,
  onUpdateRepSplit,
  onSave,
  onCancel,
}: RepSplitsModalProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] bg-[var(--card)] rounded-lg shadow-xl z-50">
        <div className="p-4 border-b border-[var(--border)] flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              Outside Rep Commission Splits
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Divide commission among outside reps
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-[var(--muted)] rounded"
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
        <div className="p-4">
          {/* Total Percentage Indicator */}
          <div
            className={`mb-4 px-4 py-3 rounded-lg flex items-center justify-between ${
              totalSplitPercentage === 100
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <span
              className={`font-medium ${
                totalSplitPercentage === 100
                  ? 'text-green-700'
                  : 'text-red-700'
              }`}
            >
              Total: {totalSplitPercentage}%
            </span>
            {totalSplitPercentage === 100 && (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-green-600"
              >
                <path
                  d="M5 10l3 3 7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          {/* Rep Split Rows */}
          <div className="space-y-3">
            {tempRepSplits.map((split, index) => (
              <div key={index} className="flex items-center gap-3">
                <select
                  value={split.repName}
                  onChange={(e) =>
                    onUpdateRepSplit(index, 'repName', e.target.value)
                  }
                  className="flex-1 px-3 py-2 bg-white border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  <option value="">Select rep...</option>
                  {availableReps.map((rep) => (
                    <option key={rep} value={rep}>
                      {rep}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={split.percentage}
                    onChange={(e) =>
                      onUpdateRepSplit(
                        index,
                        'percentage',
                        Number(e.target.value)
                      )
                    }
                    className="w-20 px-3 py-2 bg-white border border-[var(--border)] rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  <span className="text-sm text-[var(--muted-foreground)]">
                    %
                  </span>
                </div>
                {tempRepSplits.length > 1 && (
                  <button
                    onClick={() => onRemoveRep(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M6 6h8M8 6V4h4v2M4 6h12v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Rep Button */}
          <button
            onClick={onAddRep}
            className="mt-4 w-full px-4 py-3 border-2 border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span>
            Add Rep
          </button>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={totalSplitPercentage !== 100}
            className={`px-4 py-2 rounded-lg text-sm text-white transition-colors ${
              totalSplitPercentage === 100
                ? 'bg-[var(--primary)] hover:bg-[var(--primary)]/90'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}

