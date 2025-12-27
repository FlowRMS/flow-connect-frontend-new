'use client';

import React from 'react';
import type { QuoteV2 } from '../types';

interface QuoteCardV2Props {
  quote: QuoteV2;
  isDragging?: boolean;
  onClick?: () => void;
}

function getWinProbabilityColor(probability: number, approvalStatus: string) {
  if (approvalStatus === 'blocked') {
    return { bg: 'bg-red-100', text: 'text-red-700', arrow: 'text-red-500' };
  }
  if (probability >= 70) {
    return { bg: 'bg-green-100', text: 'text-green-700', arrow: 'text-green-500' };
  }
  if (probability >= 40) {
    return { bg: 'bg-yellow-100', text: 'text-yellow-700', arrow: 'text-yellow-500' };
  }
  return { bg: 'bg-red-100', text: 'text-red-700', arrow: 'text-red-500' };
}

export const QuoteCardV2 = React.memo(function QuoteCardV2({
  quote,
  isDragging,
  onClick,
}: QuoteCardV2Props) {
  const ownerColors = ['bg-orange-500', 'bg-teal-500', 'bg-green-500', 'bg-purple-500', 'bg-blue-500', 'bg-cyan-500'];
  const colorIndex = quote.id.charCodeAt(quote.id.length - 1) % ownerColors.length;
  const ownerInitials = quote.billToCustomerName.split(' ').map(n => n[0]).join('').substring(0, 2);

  const probColors = getWinProbabilityColor(quote.winProbability, quote.approvalStatus);
  const isDown = quote.winProbability < 50;

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-md p-3 mb-2 hover:shadow-md transition-all cursor-pointer ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      {/* Header row with checkbox, name, and owner avatar */}
      <div className="flex items-start gap-2 mb-2">
        <input
          type="checkbox"
          className="mt-1 accent-gray-400"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{quote.jobName}</h4>
          <p className="text-xs text-gray-500 truncate">{quote.billToCustomerName}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-full ${ownerColors[colorIndex]} flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0`}
        >
          {ownerInitials}
        </div>
      </div>

      {/* Quote number and version */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        <span className="font-mono text-gray-500">{quote.quoteNumber}</span>
        <span className="text-gray-400">v{quote.version}</span>
      </div>

      {/* Value and win probability */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900">
          ${quote.quoteAmount.toLocaleString()}
        </span>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${probColors.bg}`}>
          <span className={`text-xs font-medium ${probColors.text}`}>
            {quote.winProbability}%
          </span>
          {isDown ? (
            <svg width="12" height="12" viewBox="0 0 12 12" className={probColors.arrow}>
              <path d="M6 9L2 5h8L6 9z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" className={probColors.arrow}>
              <path d="M6 3L10 7H2L6 3z" fill="currentColor" />
            </svg>
          )}
        </div>
      </div>

      {/* Tags */}
      {quote.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {quote.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

export default QuoteCardV2;
