'use client';

import React, { useState } from 'react';

interface WinProbabilityBadgeProps {
  probability: number;
  approvalStatus?: 'clear' | 'pending' | 'blocked';
}

export function WinProbabilityBadge({ probability, approvalStatus = 'clear' }: WinProbabilityBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  let bgColor = 'bg-green-100 text-green-700';
  let trendIcon = '▲';
  if (probability < 40) {
    bgColor = 'bg-red-100 text-red-700';
    trendIcon = '▼';
  } else if (probability < 70) {
    bgColor = 'bg-yellow-100 text-yellow-700';
    trendIcon = '─';
  }

  // Generate mock factors based on probability
  const factors = [
    { positive: probability >= 50, text: probability >= 50 ? 'Price 5% below avg won quotes' : 'Price higher than avg won quotes' },
    { positive: probability >= 45, text: probability >= 45 ? 'Strong history with customer' : 'Limited history with customer' },
    { positive: probability >= 60, text: probability >= 60 ? 'Preferred manufacturer' : 'Non-preferred manufacturer' },
    { positive: approvalStatus === 'clear', text: approvalStatus === 'clear' ? 'All manufacturers approved' : 'Pending manufacturer approvals' },
    { positive: false, text: '2 competitors on this job' },
  ];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${bgColor} cursor-help flex items-center gap-1`}>
        {probability}% {trendIcon}
      </span>

      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-3 w-72">
          <div className="text-sm font-semibold text-[var(--foreground)] mb-2">
            Win Probability: {probability}%
          </div>

          <div className="space-y-1.5 text-xs mb-3">
            <div className="text-[var(--muted-foreground)] font-medium">Key Factors:</div>
            {factors.map((factor, idx) => (
              <div key={idx} className="flex items-start gap-2">
                {factor.positive ? (
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 flex-shrink-0 mt-0.5">
                    <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500 flex-shrink-0 mt-0.5">
                    <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
                  </svg>
                )}
                <span className="text-[var(--foreground)]">{factor.text}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
            Similar quotes won: 8 of 11 (73%)
          </div>

          {/* Arrow pointer */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-1px]">
            <div className="w-2 h-2 bg-[var(--card)] border-l border-t border-[var(--border)] rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
}
