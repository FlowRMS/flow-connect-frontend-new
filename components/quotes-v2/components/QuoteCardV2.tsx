'use client';

import React from 'react';
import type { QuoteV2, QuotePipelineStage } from '../types';

interface QuoteCardV2Props {
  quote: QuoteV2;
  isDragging?: boolean;
  onClick?: () => void;
}

// Format pipeline stage for display (e.g., CLOSED_WON -> Closed Won)
function formatPipelineStage(stage?: QuotePipelineStage): string {
  if (!stage) return 'Discovery';
  return stage
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function getPipelineStageColor(stage?: QuotePipelineStage): string {
  switch (stage) {
    case 'DISCOVERY':
      return 'bg-gray-100 text-gray-700';
    case 'PROSPECT':
      return 'bg-slate-100 text-slate-700';
    case 'QUALIFICATION':
      return 'bg-blue-100 text-blue-700';
    case 'PROPOSAL':
      return 'bg-purple-100 text-purple-700';
    case 'NEGOTIATION':
      return 'bg-yellow-100 text-yellow-700';
    case 'CLOSED_WON':
      return 'bg-green-100 text-green-700';
    case 'CLOSED_LOST':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export const QuoteCardV2 = React.memo(function QuoteCardV2({
  quote,
  isDragging,
  onClick,
}: QuoteCardV2Props) {
  const ownerColors = ['bg-orange-500', 'bg-teal-500', 'bg-green-500', 'bg-purple-500', 'bg-blue-500', 'bg-cyan-500'];
  const colorIndex = quote.id.charCodeAt(quote.id.length - 1) % ownerColors.length;

  // Use soldToCustomerName or billToCustomerName for display, with fallback
  const customerName = quote.soldToCustomerName || quote.billToCustomerName || 'Unknown';
  const ownerInitials = customerName.split(' ').map(n => n[0]).join('').substring(0, 2) || '??';

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-md p-3 mb-2 hover:shadow-md transition-all cursor-pointer ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      {/* Header row with checkbox, quote number as heading, and owner avatar */}
      <div className="flex items-start gap-2 mb-2">
        <input
          type="checkbox"
          className="mt-1 accent-gray-400"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate font-mono">{quote.quoteNumber}</h4>
          <p className="text-xs text-gray-500 truncate">{customerName}</p>
        </div>
        <div
          className={`w-5 h-5 rounded-full ${ownerColors[colorIndex]} flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0`}
        >
          {ownerInitials}
        </div>
      </div>

      {/* Pipeline Stage and Status badges */}
      <div className="flex items-center gap-2 text-xs mb-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPipelineStageColor(quote.pipelineStage)}`}>
          {formatPipelineStage(quote.pipelineStage)}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs ${
          quote.status === 'OPEN' ? 'bg-green-50 text-green-600' :
          quote.status === 'ORDERED' ? 'bg-blue-50 text-blue-600' :
          quote.status === 'EXPIRED' ? 'bg-yellow-50 text-yellow-600' :
          quote.status === 'LOST' ? 'bg-red-50 text-red-600' :
          'bg-gray-50 text-gray-600'
        }`}>
          {quote.status}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">
          ${Number(quote.quoteAmount || 0).toLocaleString()}
        </span>
        {quote.quoteDate && (
          <span className="text-xs text-gray-400">
            {new Date(quote.quoteDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
});

export default QuoteCardV2;
