'use client';

import React from 'react';
import { priceLevelColors } from '../config';

interface PriceLevel {
  id: number;
  percent: number;
  description: string;
}

interface SettingsTabProps {
  showEndUserPerLine: boolean;
  setShowEndUserPerLine: (value: boolean) => void;
  showCommissionSplits: boolean;
  setShowCommissionSplits: (value: boolean) => void;
  showInsideRepSplits: boolean;
  setShowInsideRepSplits: (value: boolean) => void;
  customerPartNumberSource: 'soldTo' | 'endUser';
  setCustomerPartNumberSource: (value: 'soldTo' | 'endUser') => void;
  quotePriceLevels: PriceLevel[];
  setQuotePriceLevels: React.Dispatch<React.SetStateAction<PriceLevel[]>>;
}

export function SettingsTab({
  showEndUserPerLine,
  setShowEndUserPerLine,
  showCommissionSplits,
  setShowCommissionSplits,
  showInsideRepSplits,
  setShowInsideRepSplits,
  customerPartNumberSource,
  setCustomerPartNumberSource,
  quotePriceLevels,
  setQuotePriceLevels,
}: SettingsTabProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
      <div className="space-y-5">
        {/* End User Toggle - Simple row */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEndUserPerLine(!showEndUserPerLine)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
              showEndUserPerLine ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                showEndUserPerLine ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-[var(--foreground)]">Specify end user per line item</span>
        </div>

        {/* Outside Rep Commission Splits Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCommissionSplits(!showCommissionSplits)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
              showCommissionSplits ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                showCommissionSplits ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--foreground)]">Outside rep at line item level</span>
            <span className="text-xs text-[var(--muted-foreground)]">{showCommissionSplits ? 'Set outside rep per line item' : 'Set outside rep in header'}</span>
          </div>
        </div>

        {/* Inside Rep Commission Splits Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInsideRepSplits(!showInsideRepSplits)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
              showInsideRepSplits ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                showInsideRepSplits ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--foreground)]">Inside rep at line item level</span>
            <span className="text-xs text-[var(--muted-foreground)]">{showInsideRepSplits ? 'Set inside rep per line item' : 'Set inside rep in header'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border)]"></div>

        {/* Customer Part Number Source Toggle */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Customer Part Number Source</span>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="customerPartNumberSource"
                checked={customerPartNumberSource === 'soldTo'}
                onChange={() => setCustomerPartNumberSource('soldTo')}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--muted-foreground)]">Sold To Customer</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="customerPartNumberSource"
                checked={customerPartNumberSource === 'endUser'}
                onChange={() => setCustomerPartNumberSource('endUser')}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--muted-foreground)]">End User</span>
            </label>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border)]"></div>

        {/* Price Level Markups - Vertical Layout (moved to bottom) */}
        <div className="space-y-3">
          {quotePriceLevels.map((level, index) => (
            <div key={level.id} className="flex items-center gap-4">
              <span className={`w-8 text-sm font-medium ${priceLevelColors[index % priceLevelColors.length]}`}>L{index + 1}</span>
              <div className="relative w-24">
                <input
                  type="text"
                  inputMode="decimal"
                  value={level.percent}
                  onChange={(e) => setQuotePriceLevels(prev => prev.map(l =>
                    l.id === level.id ? { ...l, percent: parseFloat(e.target.value) || 0 } : l
                  ))}
                  className="w-full px-3 py-1.5 pr-7 border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--background)] text-[var(--foreground)] text-sm"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-[var(--muted-foreground)]">%</span>
              </div>
              <input
                type="text"
                value={level.description}
                onChange={(e) => setQuotePriceLevels(prev => prev.map(l =>
                  l.id === level.id ? { ...l, description: e.target.value } : l
                ))}
                placeholder="Description"
                className="flex-1 px-3 py-1.5 border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--background)] text-[var(--foreground)] text-sm text-[var(--muted-foreground)]"
              />
              {quotePriceLevels.length > 1 && (
                <button
                  onClick={() => setQuotePriceLevels(prev => prev.filter(l => l.id !== level.id))}
                  className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors flex-shrink-0"
                  title="Remove level"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 10h12" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Add Level Button */}
          <button
            onClick={() => {
              const maxId = Math.max(...quotePriceLevels.map(l => l.id));
              const lastPercent = quotePriceLevels[quotePriceLevels.length - 1]?.percent || 20;
              setQuotePriceLevels(prev => [...prev, {
                id: maxId + 1,
                percent: lastPercent + 5,
                description: ''
              }]);
            }}
            className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors mt-2"
          >
            <span className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
              </svg>
            </span>
            Add price level
          </button>
        </div>
      </div>
    </div>
  );
}
