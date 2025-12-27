'use client';

import React from 'react';
import type { LineItem } from '../types';

interface PriceLookupModalProps {
  show: string | null;
  quoteLineItems: LineItem[];
  priceLookupTargetPrice: string;
  onClose: () => void;
  onSetPriceLookupTargetPrice: (value: string) => void;
  onApply: (price: number) => void;
}

export function PriceLookupModal({
  show,
  quoteLineItems,
  priceLookupTargetPrice,
  onClose,
  onSetPriceLookupTargetPrice,
  onApply,
}: PriceLookupModalProps) {
  if (!show) return null;

  // Get the line item for this product
  const lineItem = quoteLineItems.find(li => li.productNumber === show);
  const basePrice = lineItem?.basePrice || 245;
  const currentSellPrice = lineItem?.sellPrice || 275;
  const overageShare = lineItem?.manufacturers[0].overageShare || 0.90;

  // Commission bands
  const bands = [
    { band: 1, minPrice: basePrice, rate: 0.10, overageEligible: true },
    { band: 2, minPrice: basePrice * 0.90, rate: 0.08, overageEligible: false },
    { band: 3, minPrice: basePrice * 0.80, rate: 0.06, overageEligible: false },
    { band: 4, minPrice: 0, rate: 0.04, overageEligible: false },
  ];

  // Calculate which band the current price falls into
  const getCurrentBand = (price: number) => {
    if (price >= basePrice) return 1;
    if (price >= basePrice * 0.90) return 2;
    if (price >= basePrice * 0.80) return 3;
    return 4;
  };

  const currentBand = getCurrentBand(currentSellPrice);
  const targetPrice = priceLookupTargetPrice ? parseFloat(priceLookupTargetPrice) : currentSellPrice;
  const targetBand = getCurrentBand(targetPrice);
  const targetBandData = bands[targetBand - 1];

  const targetOverage = targetPrice - basePrice;
  const targetOveragePercent = basePrice > 0 ? (targetOverage / basePrice) * 100 : 0;
  const targetCommission = targetBandData.overageEligible
    ? (basePrice * targetBandData.rate) + (Math.max(0, targetOverage) * overageShare)
    : (targetPrice * targetBandData.rate);

  // Historical overage
  const avgHistoricalOverage = lineItem
    ? lineItem.quotedPriceHistory.reduce((sum, p, i) => sum + p - lineItem.priceHistory[i], 0) / lineItem.priceHistory.length
    : 30;
  const avgHistoricalOveragePercent = lineItem && lineItem.priceHistory.length > 0
    ? (avgHistoricalOverage / (lineItem.priceHistory.reduce((a, b) => a + b, 0) / lineItem.priceHistory.length)) * 100
    : 12;

  const handleClose = () => {
    onSetPriceLookupTargetPrice('');
    onClose();
  };

  const handleApply = () => {
    if (priceLookupTargetPrice) {
      onApply(parseFloat(priceLookupTargetPrice));
    }
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--card)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Price Lookup: {show}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Manufacturer Info */}
          <div className="flex items-center justify-between p-3 bg-[var(--muted)]/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Manufacturer</p>
              <p className="text-sm text-[var(--muted-foreground)]">{lineItem?.manufacturers[0].name || 'Acuity Brands'}</p>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <circle cx="10" cy="10" r="7"/>
                <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm text-green-600">Approved</span>
            </div>
          </div>

          {/* Price Calculator */}
          <div className="p-4 border border-[var(--primary)]/30 bg-[var(--primary)]/5 rounded-lg">
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                <rect x="3" y="3" width="14" height="14" rx="2"/>
                <path d="M7 7h6M7 10h6M7 13h4"/>
              </svg>
              Price Calculator
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Target Sell Price</label>
                <div className="flex items-center gap-1">
                  <span className="text-sm">$</span>
                  <input
                    type="number"
                    value={priceLookupTargetPrice}
                    onChange={(e) => onSetPriceLookupTargetPrice(e.target.value)}
                    placeholder={currentSellPrice.toFixed(2)}
                    className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Base Price</label>
                <p className="text-sm font-medium py-1.5">${basePrice.toFixed(2)}</p>
              </div>
            </div>

            {/* Calculator Results */}
            <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xs text-[var(--muted-foreground)]">Overage</p>
                <p className={`text-lg font-semibold ${targetOverage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${targetOverage.toFixed(2)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">{targetOveragePercent.toFixed(1)}%</p>
              </div>
              <div className="text-center border-x border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)]">Band</p>
                <p className={`text-lg font-semibold ${targetBand === 1 ? 'text-green-600' : targetBand === 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {targetBand}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">{(targetBandData.rate * 100).toFixed(0)}% rate</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[var(--muted-foreground)]">Commission</p>
                <p className="text-lg font-semibold text-blue-600">
                  ${targetCommission.toFixed(2)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {targetBandData.overageEligible ? `+${(overageShare * 100).toFixed(0)}% overage` : 'flat rate'}
                </p>
              </div>
            </div>
          </div>

          {/* Commission Bands Table */}
          <div>
            <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">Commission Bands</h4>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--muted)]/30">
                  <tr className="text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                    <th className="px-3 py-2">Band</th>
                    <th className="px-3 py-2">Price Range</th>
                    <th className="px-3 py-2">Rate</th>
                    <th className="px-3 py-2">Overage</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {bands.map((band, idx) => {
                    const isTarget = targetBand === band.band;
                    const isCurrent = currentBand === band.band && !priceLookupTargetPrice;
                    const priceRange = idx === 0
                      ? `≥ $${basePrice.toFixed(2)}`
                      : idx === bands.length - 1
                        ? `< $${bands[idx - 1].minPrice.toFixed(2)}`
                        : `$${band.minPrice.toFixed(2)}-$${bands[idx - 1].minPrice.toFixed(2)}`;
                    return (
                      <tr key={band.band} className={isTarget ? 'bg-[var(--primary)]/10' : isCurrent ? 'bg-green-50' : ''}>
                        <td className="px-3 py-2">
                          <span className={`flex items-center gap-2 ${isTarget || isCurrent ? 'font-medium' : ''}`}>
                            {isTarget && (
                              <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
                            )}
                            {isCurrent && !isTarget && (
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            )}
                            {band.band}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm">{priceRange}</td>
                        <td className="px-3 py-2 text-sm font-medium">{(band.rate * 100).toFixed(0)}%</td>
                        <td className="px-3 py-2">
                          {band.overageEligible ? (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                              <path d="M5 10l3 3 7-7"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => onSetPriceLookupTargetPrice(band.minPrice.toFixed(2))}
                            className="text-xs text-[var(--primary)] hover:underline"
                          >
                            Use
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Average */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Historical Avg Overage:</span> ${avgHistoricalOverage.toFixed(2)} ({avgHistoricalOveragePercent.toFixed(1)}%)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Based on last 12 months of quoted prices
            </p>
          </div>

          {/* Current Status */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              <span className="font-medium">Current:</span> Band {currentBand} (Sell ${currentSellPrice.toFixed(2)}, Base ${basePrice.toFixed(2)})
            </p>
            <p className="text-xs text-green-600 mt-1">
              Overage: ${(currentSellPrice - basePrice).toFixed(2)} ({((currentSellPrice - basePrice) / basePrice * 100).toFixed(1)}%)
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between sticky bottom-0 bg-[var(--card)]">
          <button
            onClick={() => onSetPriceLookupTargetPrice('')}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Reset Calculator
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Close
            </button>
            {priceLookupTargetPrice && (
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                Apply ${parseFloat(priceLookupTargetPrice).toFixed(2)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
