'use client';

import React from 'react';
import type { Rep } from '../types';

interface RepSplit {
  repId: string;
  repName: string;
  percentage: number;
}

interface GenericRepSplitsModalProps {
  show: boolean;
  title: string;
  subtitle: string;
  splits: RepSplit[];
  availableReps: Rep[];
  onClose: () => void;
  onCancel: () => void;
  onSetSplits: React.Dispatch<React.SetStateAction<RepSplit[]>>;
}

export function GenericRepSplitsModal({
  show,
  title,
  subtitle,
  splits,
  availableReps,
  onClose,
  onCancel,
  onSetSplits,
}: GenericRepSplitsModalProps) {
  if (!show) return null;

  const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
  const isValid = totalPercentage === 100;

  const handleRepChange = (index: number, repId: string) => {
    const newRep = availableReps.find(r => r.id === repId);
    if (newRep) {
      onSetSplits(prev => prev.map((s, i) =>
        i === index ? { ...s, repId: newRep.id, repName: newRep.name } : s
      ));
    }
  };

  const handlePercentageChange = (index: number, rawValue: string) => {
    const value = Math.min(100, Math.max(0, parseInt(rawValue.replace(/[^0-9]/g, '')) || 0));
    const otherRepsCount = splits.length - 1;
    if (otherRepsCount > 0) {
      const remaining = 100 - value;
      const perRep = Math.floor(remaining / otherRepsCount);
      const remainder = remaining - (perRep * otherRepsCount);
      let extraAssigned = 0;
      onSetSplits(prev => prev.map((s, i) => {
        if (i === index) {
          return { ...s, percentage: value };
        } else {
          const extraPercent = extraAssigned < remainder ? 1 : 0;
          extraAssigned++;
          return { ...s, percentage: Math.max(0, perRep + extraPercent) };
        }
      }));
    } else {
      onSetSplits(prev => prev.map((s, i) =>
        i === index ? { ...s, percentage: value } : s
      ));
    }
  };

  const handleRemove = (index: number) => {
    const remaining = splits.filter((_, i) => i !== index);
    const newCount = remaining.length;
    const perRep = Math.floor(100 / newCount);
    const remainder = 100 - (perRep * newCount);
    let extraAssigned = 0;
    onSetSplits(remaining.map(s => {
      const extraPercent = extraAssigned < remainder ? 1 : 0;
      extraAssigned++;
      return { ...s, percentage: perRep + extraPercent };
    }));
  };

  const handleAdd = () => {
    const usedRepIds = new Set(splits.map(s => s.repId));
    const availableRep = availableReps.find(r => !usedRepIds.has(r.id));
    if (availableRep) {
      const newCount = splits.length + 1;
      const perRep = Math.floor(100 / newCount);
      const remainder = 100 - (perRep * newCount);
      let extraAssigned = 0;
      const updatedSplits = splits.map(s => {
        const extraPercent = extraAssigned < remainder ? 1 : 0;
        extraAssigned++;
        return { ...s, percentage: perRep + extraPercent };
      });
      const newRepPercent = perRep + (extraAssigned < remainder ? 1 : 0);
      onSetSplits([...updatedSplits, { repId: availableRep.id, repName: availableRep.name, percentage: newRepPercent }]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{subtitle}</p>
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
            {splits.map((split, index) => (
              <div key={split.repId} className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg">
                <div className="flex-1">
                  <select
                    value={split.repId}
                    onChange={(e) => handleRepChange(index, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    {availableReps.map(rep => (
                      <option
                        key={rep.id}
                        value={rep.id}
                        disabled={splits.some(s => s.repId === rep.id && s.repId !== split.repId)}
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
                    onChange={(e) => handlePercentageChange(index, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-16 px-2 py-2 bg-white border border-[var(--border)] rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent [appearance:textfield]"
                  />
                  <span className="text-sm text-[var(--muted-foreground)]">%</span>
                </div>
                {splits.length > 1 && (
                  <button
                    onClick={() => handleRemove(index)}
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
          {splits.length < availableReps.length && (
            <button
              onClick={handleAdd}
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
            onClick={onCancel}
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
