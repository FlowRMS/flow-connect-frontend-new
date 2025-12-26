'use client';

import React from 'react';
import type { Quote } from '../types';
import { WinProbabilityBadge } from './WinProbabilityBadge';

interface QuoteCardProps {
  quote: Quote;
  isDragging?: boolean;
  onClick?: () => void;
}

export const QuoteCard = React.memo(function QuoteCard({ quote, isDragging, onClick }: QuoteCardProps) {
  const ownerInitials = quote.owner.split(' ').map(n => n[0]).join('');
  const ownerColors = ['bg-orange-500', 'bg-teal-500', 'bg-green-500', 'bg-purple-500', 'bg-blue-500'];
  const colorIndex = quote.id.charCodeAt(quote.id.length - 1) % ownerColors.length;

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-md p-3 mb-2 hover:shadow-md transition-all cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <input type="checkbox" className="mt-1 accent-gray-400" onClick={e => e.stopPropagation()} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{quote.name}</h4>
          <p className="text-xs text-gray-500 truncate">{quote.billToCustomer}</p>
        </div>
        <div className={`w-5 h-5 rounded-full ${ownerColors[colorIndex]} flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0`}>
          {ownerInitials}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        <span className="font-mono text-gray-500">{quote.id}</span>
        <span className="text-gray-400">v{quote.version}</span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900">{quote.value}</span>
        <WinProbabilityBadge probability={quote.winProbability} approvalStatus={quote.approvalStatus} />
      </div>


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
