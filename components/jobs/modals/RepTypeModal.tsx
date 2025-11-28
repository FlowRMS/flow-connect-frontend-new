/**
 * Rep Type Modal Component
 */

import React from 'react';
import type { RepType } from '../types';
import { REP_TYPE_CONFIG } from '../constants';

interface RepTypeModalProps {
  isOpen: boolean;
  currentType: RepType;
  onClose: () => void;
  onSelect: (type: RepType) => void;
}

export function RepTypeModal({ isOpen, currentType, onClose, onSelect }: RepTypeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Select Rep Type</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Choose your rep type to customize contact types and terminology
          </p>
          {(Object.keys(REP_TYPE_CONFIG) as Array<RepType>).map((type) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`w-full text-left p-4 border rounded-lg transition-all ${
                currentType === type
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20'
                  : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[var(--foreground)]">{REP_TYPE_CONFIG[type].label}</h3>
                {currentType === type && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--primary)]">
                    <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Contact types: {REP_TYPE_CONFIG[type].contactTypes.join(', ')}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
