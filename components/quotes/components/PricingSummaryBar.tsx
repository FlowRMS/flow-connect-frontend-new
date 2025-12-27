'use client';

import React from 'react';

interface PriceLevel {
  id: number;
  percent: number;
  description?: string;
}

interface Totals {
  baseTotal: number;
  sellTotal: number;
  commission: number;
  overage: number;
}

interface PricingSummaryBarProps {
  totals: Totals;
  quoteViewMode: 'simple' | 'overage';
  quotePriceLevels: PriceLevel[];
  priceLevelColors: string[];
}

export function PricingSummaryBar({
  totals,
  quoteViewMode,
  quotePriceLevels,
  priceLevelColors,
}: PricingSummaryBarProps) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0 px-6 py-2 flex items-center justify-end">
      <div className="relative group">
        <div className="flex items-center gap-3 text-xs cursor-pointer">
          <span className="text-[var(--muted-foreground)]">
            Base Price: <span className="font-medium text-[var(--foreground)]">${totals.baseTotal.toLocaleString()}</span>
          </span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            Sell Price: <span className="font-semibold text-[var(--foreground)]">${totals.sellTotal.toLocaleString()}</span>
          </span>
          <span className="text-[var(--muted-foreground)]">|</span>
          <span className="text-[var(--muted-foreground)]">
            Commission: <span className="font-medium text-purple-600">${totals.commission.toLocaleString()}</span>
          </span>
          {quoteViewMode === 'overage' && (
            <>
              <span className="text-[var(--muted-foreground)]">|</span>
              <span className="text-[var(--muted-foreground)]">
                Overage: <span className="font-medium text-orange-600">${totals.overage.toLocaleString()} ({totals.baseTotal > 0 ? ((totals.overage / totals.baseTotal) * 100).toFixed(1) : 0}%)</span>
              </span>
              <span className="text-[var(--muted-foreground)]">|</span>
              <span className="text-[var(--muted-foreground)]">
                Earnings: <span className="font-semibold text-green-600">${(totals.overage + totals.commission).toLocaleString()} ({totals.sellTotal > 0 ? (((totals.overage + totals.commission) / totals.sellTotal) * 100).toFixed(1) : 0}%)</span>
              </span>
            </>
          )}
        </div>

        {/* Hover Tooltip with Price Levels */}
        <div className="absolute top-full right-0 mt-2 bg-white border border-[var(--border)] rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[500px]">
          <div className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Level</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Base Price</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Sell Price</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Commission</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Overage</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {/* Sell Row */}
                <tr className="border-b border-[var(--border)]/50 bg-[var(--muted)]/20">
                  <td className="py-2 px-2 font-medium text-[var(--foreground)]">Sell</td>
                  <td className="py-2 px-2 text-right text-[var(--foreground)]">${totals.baseTotal.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-[var(--foreground)]">${totals.sellTotal.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-purple-600">${totals.commission.toLocaleString()} ({totals.sellTotal > 0 ? ((totals.commission / totals.sellTotal) * 100).toFixed(1) : 0}%)</td>
                  <td className="py-2 px-2 text-right text-orange-600">${totals.overage.toLocaleString()} ({totals.baseTotal > 0 ? ((totals.overage / totals.baseTotal) * 100).toFixed(1) : 0}%)</td>
                  <td className="py-2 px-2 text-right font-semibold text-green-600">${(totals.overage + totals.commission).toLocaleString()} ({totals.sellTotal > 0 ? (((totals.overage + totals.commission) / totals.sellTotal) * 100).toFixed(1) : 0}%)</td>
                </tr>
                {/* Dynamic Price Level Rows */}
                {quotePriceLevels.map((level, index) => {
                  const levelSellPrice = totals.sellTotal * (1 + level.percent / 100);
                  const levelOverage = levelSellPrice - totals.baseTotal;
                  const levelCommission = totals.commission * (1 + level.percent / 100);
                  const levelEarnings = levelOverage + levelCommission;
                  return (
                    <tr key={level.id} className="border-b border-[var(--border)]/50 last:border-b-0">
                      <td className={`py-2 px-2 font-medium ${priceLevelColors[index % priceLevelColors.length]}`}>L{index + 1}</td>
                      <td className="py-2 px-2 text-right text-[var(--foreground)]">${totals.baseTotal.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-[var(--foreground)]">${levelSellPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="py-2 px-2 text-right text-purple-600">${levelCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({levelSellPrice > 0 ? ((levelCommission / levelSellPrice) * 100).toFixed(1) : 0}%)</td>
                      <td className="py-2 px-2 text-right text-orange-600">${levelOverage.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({totals.baseTotal > 0 ? ((levelOverage / totals.baseTotal) * 100).toFixed(1) : 0}%)</td>
                      <td className="py-2 px-2 text-right font-semibold text-green-600">${levelEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({levelSellPrice > 0 ? ((levelEarnings / levelSellPrice) * 100).toFixed(1) : 0}%)</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
