'use client';

import React from 'react';
import type { LineItem, OutsideRepSplit } from '../types';
import type { Rep } from '../types';

interface CommissionSplitsModalProps {
  show: boolean;
  item: LineItem | null;
  applyToAllLines: boolean;
  availableOutsideReps: Rep[];
  onClose: () => void;
  onSetApplyToAllLines: (value: boolean) => void;
  onUpdateLineItem: (itemId: string, outsideRepSplits: OutsideRepSplit[]) => void;
  onUpdateItem: (item: LineItem | null) => void;
  onApplyToAll: (outsideRepSplits: OutsideRepSplit[]) => void;
}

export function CommissionSplitsModal({
  show,
  item,
  applyToAllLines,
  availableOutsideReps,
  onClose,
  onSetApplyToAllLines,
  onUpdateLineItem,
  onUpdateItem,
  onApplyToAll,
}: CommissionSplitsModalProps) {
  if (!show || !item) return null;

  const handleRepChange = (index: number, repId: string) => {
    const rep = availableOutsideReps.find(r => r.id === repId);
    if (rep) {
      const newSplits = item.outsideRepSplits.map((s, i) =>
        i === index ? { ...s, repId: rep.id, repName: rep.name } : s
      );
      onUpdateLineItem(item.id, newSplits);
      onUpdateItem({ ...item, outsideRepSplits: newSplits });
    }
  };

  const handlePercentageChange = (index: number, percentage: number) => {
    const newSplits = item.outsideRepSplits.map((s, i) =>
      i === index ? { ...s, percentage } : s
    );
    onUpdateLineItem(item.id, newSplits);
    onUpdateItem({ ...item, outsideRepSplits: newSplits });
  };

  const handleRemoveSplit = (index: number) => {
    const newSplits = item.outsideRepSplits.filter((_, i) => i !== index);
    onUpdateLineItem(item.id, newSplits);
    onUpdateItem({ ...item, outsideRepSplits: newSplits });
  };

  const handleAddRep = () => {
    const usedRepIds = item.outsideRepSplits.map(s => s.repId);
    const availableRep = availableOutsideReps.find(r => !usedRepIds.includes(r.id));
    if (availableRep) {
      const newSplit = { repId: availableRep.id, repName: availableRep.name, percentage: 0 };
      const newSplits = [...item.outsideRepSplits, newSplit];
      onUpdateLineItem(item.id, newSplits);
      onUpdateItem({ ...item, outsideRepSplits: newSplits });
    }
  };

  const handleSave = () => {
    if (applyToAllLines) {
      onApplyToAll([...item.outsideRepSplits]);
    }
    onClose();
  };

  const total = item.outsideRepSplits.reduce((sum, s) => sum + s.percentage, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Commission Splits</h2>
            <p className="text-sm text-[var(--muted-foreground)]">{item.productNumber} - {item.description.slice(0, 40)}...</p>
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
          {/* Current Splits */}
          <div className="space-y-3">
            {item.outsideRepSplits.map((split, index) => (
              <div key={split.repId} className="flex items-center gap-3">
                <select
                  value={split.repId}
                  onChange={(e) => handleRepChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {availableOutsideReps.map(rep => (
                    <option key={rep.id} value={rep.id}>{rep.name}</option>
                  ))}
                </select>
                <div className="relative w-24">
                  <input
                    type="number"
                    value={split.percentage}
                    onChange={(e) => handlePercentageChange(index, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 pr-7 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">%</span>
                </div>
                {item.outsideRepSplits.length > 1 && (
                  <button
                    onClick={() => handleRemoveSplit(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Rep Button */}
          <button
            onClick={handleAddRep}
            className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
            </svg>
            Add Rep
          </button>

          {/* Total Percentage Warning */}
          {total !== 100 ? (
            <div className={`text-sm px-3 py-2 rounded-lg ${total > 100 ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
              Total: {total}% — {total > 100 ? 'Exceeds' : 'Does not equal'} 100%
            </div>
          ) : (
            <div className="text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700">
              Total: 100% ✓
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <input
              type="checkbox"
              checked={applyToAllLines}
              onChange={(e) => onSetApplyToAllLines(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Apply to all line items
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
