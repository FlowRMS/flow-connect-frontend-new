'use client';

import React, { useState } from 'react';

interface RepSplitModalProps {
  lineItemId: string;
  lineItemDescription: string;
  currentSplits: { repId: string; repName: string; percentage: number }[];
  availableReps: { id: string; name: string }[];
  onClose: () => void;
  onSave: (splits: { repId: string; repName: string; percentage: number }[]) => void;
  onApplyToSection: (splits: { repId: string; repName: string; percentage: number }[]) => void;
  onApplyToAll: (splits: { repId: string; repName: string; percentage: number }[]) => void;
}

export function RepSplitModal({
  lineItemId,
  lineItemDescription,
  currentSplits,
  availableReps,
  onClose,
  onSave,
  onApplyToSection,
  onApplyToAll,
}: RepSplitModalProps) {
  const [splits, setSplits] = useState<{ repId: string; repName: string; percentage: number }[]>(
    currentSplits.length > 0 ? currentSplits : [{ repId: '', repName: '', percentage: 100 }]
  );
  const [showApplyMenu, setShowApplyMenu] = useState(false);

  const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
  const isValid = totalPercentage === 100 && splits.every(s => s.repId !== '');

  const addRep = () => {
    setSplits([...splits, { repId: '', repName: '', percentage: 0 }]);
  };

  const removeRep = (index: number) => {
    if (splits.length > 1) {
      setSplits(splits.filter((_, i) => i !== index));
    }
  };

  const updateRep = (index: number, repId: string) => {
    const rep = availableReps.find(r => r.id === repId);
    setSplits(splits.map((s, i) =>
      i === index ? { ...s, repId, repName: rep?.name || '' } : s
    ));
  };

  const updatePercentage = (index: number, percentage: number) => {
    setSplits(splits.map((s, i) =>
      i === index ? { ...s, percentage: Math.max(0, Math.min(100, percentage)) } : s
    ));
  };

  const distributeEvenly = () => {
    const evenSplit = Math.floor(100 / splits.length);
    const remainder = 100 - (evenSplit * splits.length);
    setSplits(splits.map((s, i) => ({
      ...s,
      percentage: i === 0 ? evenSplit + remainder : evenSplit
    })));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">Commission Split</h3>
            <p className="text-xs text-[var(--muted-foreground)] truncate max-w-[300px]">{lineItemDescription}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Rep Splits */}
          <div className="space-y-3">
            {splits.map((split, index) => (
              <div key={index} className="flex items-center gap-3">
                <select
                  value={split.repId}
                  onChange={(e) => updateRep(index, e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Select Rep...</option>
                  {availableReps.map(rep => (
                    <option key={rep.id} value={rep.id}>{rep.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={split.percentage}
                    onChange={(e) => updatePercentage(index, parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-2 text-sm text-center border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-[var(--muted-foreground)]">%</span>
                </div>
                {splits.length > 1 && (
                  <button
                    onClick={() => removeRep(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total & Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-3">
              <button
                onClick={addRep}
                className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                </svg>
                Add Rep
              </button>
              <button
                onClick={distributeEvenly}
                className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded transition-colors"
              >
                Split Evenly
              </button>
            </div>
            <div className={`text-sm font-medium ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total: {totalPercentage}%
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border)]">
          <div className="relative">
            <button
              onClick={() => setShowApplyMenu(!showApplyMenu)}
              disabled={!isValid}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply to...
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showApplyMenu && (
              <div className="absolute left-0 bottom-full mb-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[160px] z-10">
                <button
                  onClick={() => { onApplyToSection(splits); setShowApplyMenu(false); }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--muted)] transition-colors"
                >
                  Apply to Section
                </button>
                <button
                  onClick={() => { onApplyToAll(splits); setShowApplyMenu(false); }}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-[var(--muted)] transition-colors"
                >
                  Apply to All Lines
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(splits)}
              disabled={!isValid}
              className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
