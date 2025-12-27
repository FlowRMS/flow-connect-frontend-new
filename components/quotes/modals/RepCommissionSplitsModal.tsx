'use client';

import React from 'react';
import type { Rep } from '../types';

interface RepSplit {
  repId: string;
  repName: string;
  percentage: number;
}

interface RepCommissionSplitsModalProps {
  show: boolean;
  repCommissionSplits: RepSplit[];
  availableOutsideReps: Rep[];
  onClose: () => void;
  onCancel: () => void;
  onSetRepCommissionSplits: React.Dispatch<React.SetStateAction<RepSplit[]>>;
  onSetSplitCommission: (value: boolean) => void;
}

export function RepCommissionSplitsModal({
  show,
  repCommissionSplits,
  availableOutsideReps,
  onClose,
  onCancel,
  onSetRepCommissionSplits,
  onSetSplitCommission,
}: RepCommissionSplitsModalProps) {
  if (!show) return null;

  const totalPercentage = repCommissionSplits.reduce((sum, split) => sum + split.percentage, 0);
  const isValid = totalPercentage === 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Commission Splits</h2>
            <p className="text-sm text-[var(--muted-foreground)]">Divide commission among outside reps</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Total percentage indicator */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <span className={`text-sm font-medium ${isValid ? 'text-green-700' : 'text-yellow-700'}`}>
              Total: {totalPercentage}%
            </span>
            {!isValid && (
              <span className="text-xs text-yellow-600">
                Must equal 100%
              </span>
            )}
            {isValid && (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>

          {/* Rep splits list */}
          <div className="space-y-3">
            {repCommissionSplits.map((split, index) => (
              <div key={split.repId} className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg">
                <div className="flex-1">
                  <select
                    value={split.repId}
                    onChange={(e) => {
                      const newRep = availableOutsideReps.find(r => r.id === e.target.value);
                      if (newRep) {
                        onSetRepCommissionSplits(prev => prev.map((s, i) =>
                          i === index ? { ...s, repId: newRep.id, repName: newRep.name } : s
                        ));
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    {availableOutsideReps.map(rep => (
                      <option
                        key={rep.id}
                        value={rep.id}
                        disabled={repCommissionSplits.some(s => s.repId === rep.id && s.repId !== split.repId)}
                      >
                        {rep.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24 flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={split.percentage}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9]/g, '');
                      const value = Math.min(100, Math.max(0, parseInt(rawValue) || 0));
                      const otherRepsCount = repCommissionSplits.length - 1;
                      if (otherRepsCount > 0) {
                        const remaining = 100 - value;
                        const perRep = Math.floor(remaining / otherRepsCount);
                        const remainder = remaining - (perRep * otherRepsCount);
                        let extraAssigned = 0;
                        onSetRepCommissionSplits(prev => prev.map((s, i) => {
                          if (i === index) {
                            return { ...s, percentage: value };
                          } else {
                            const extraPercent = extraAssigned < remainder ? 1 : 0;
                            extraAssigned++;
                            return { ...s, percentage: Math.max(0, perRep + extraPercent) };
                          }
                        }));
                      } else {
                        onSetRepCommissionSplits(prev => prev.map((s, i) =>
                          i === index ? { ...s, percentage: value } : s
                        ));
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-16 px-2 py-2 bg-white border border-[var(--border)] rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent [appearance:textfield]"
                  />
                  <span className="text-sm text-[var(--muted-foreground)]">%</span>
                </div>
                {repCommissionSplits.length > 1 && (
                  <button
                    onClick={() => {
                      const remaining = repCommissionSplits.filter((_, i) => i !== index);
                      const newCount = remaining.length;
                      const perRep = Math.floor(100 / newCount);
                      const remainder = 100 - (perRep * newCount);
                      let extraAssigned = 0;
                      onSetRepCommissionSplits(remaining.map(s => {
                        const extraPercent = extraAssigned < remainder ? 1 : 0;
                        extraAssigned++;
                        return { ...s, percentage: perRep + extraPercent };
                      }));
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove rep"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add rep button */}
          {repCommissionSplits.length < availableOutsideReps.length && (
            <button
              onClick={() => {
                const usedRepIds = new Set(repCommissionSplits.map(s => s.repId));
                const availableRep = availableOutsideReps.find(r => !usedRepIds.has(r.id));
                if (availableRep) {
                  const newCount = repCommissionSplits.length + 1;
                  const perRep = Math.floor(100 / newCount);
                  const remainder = 100 - (perRep * newCount);
                  let extraAssigned = 0;
                  const updatedSplits = repCommissionSplits.map(s => {
                    const extraPercent = extraAssigned < remainder ? 1 : 0;
                    extraAssigned++;
                    return { ...s, percentage: perRep + extraPercent };
                  });
                  const newRepPercent = perRep + (extraAssigned < remainder ? 1 : 0);
                  onSetRepCommissionSplits([...updatedSplits, { repId: availableRep.id, repName: availableRep.name, percentage: newRepPercent }]);
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
              </svg>
              Add Rep
            </button>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={() => {
              onSetSplitCommission(false);
              onSetRepCommissionSplits([]);
              onCancel();
            }}
            className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            disabled={!isValid}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
