'use client';

import React, { useMemo } from 'react';
import type { QuoteV2, QuoteV2Stage } from '../types';
import { QuoteCardV2 } from '../components/QuoteCardV2';

interface KanbanViewV2Props {
  quotes: QuoteV2[];
  onQuoteClick: (quote: QuoteV2) => void;
}

const stages: QuoteV2Stage[] = ['Draft', 'Review', 'Sent', 'Negotiating', 'Won', 'Lost', 'Dormant'];

function getStageHeaderColor(stage: QuoteV2Stage): string {
  switch (stage) {
    case 'Draft':
      return 'bg-gray-100 text-gray-700';
    case 'Review':
      return 'bg-blue-100 text-blue-700';
    case 'Sent':
      return 'bg-purple-100 text-purple-700';
    case 'Negotiating':
      return 'bg-yellow-100 text-yellow-700';
    case 'Won':
      return 'bg-green-100 text-green-700';
    case 'Lost':
      return 'bg-red-100 text-red-700';
    case 'Dormant':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function KanbanViewV2({ quotes, onQuoteClick }: KanbanViewV2Props) {
  const quotesByStage = useMemo(() => {
    const grouped: Record<QuoteV2Stage, QuoteV2[]> = {
      Draft: [],
      Review: [],
      Sent: [],
      Negotiating: [],
      Won: [],
      Lost: [],
      Dormant: [],
    };

    quotes.forEach((quote) => {
      if (grouped[quote.stage]) {
        grouped[quote.stage].push(quote);
      }
    });

    return grouped;
  }, [quotes]);

  const stageTotals = useMemo(() => {
    const totals: Record<QuoteV2Stage, number> = {
      Draft: 0,
      Review: 0,
      Sent: 0,
      Negotiating: 0,
      Won: 0,
      Lost: 0,
      Dormant: 0,
    };

    quotes.forEach((quote) => {
      if (totals[quote.stage] !== undefined) {
        totals[quote.stage] += quote.quoteAmount;
      }
    });

    return totals;
  }, [quotes]);

  const formatTotal = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 h-full">
      {stages.map((stage) => {
        const stageQuotes = quotesByStage[stage];
        const count = stageQuotes.length;
        const total = stageTotals[stage];

        return (
          <div
            key={stage}
            className="flex-shrink-0 w-[220px] flex flex-col bg-gray-50 rounded-lg"
          >
            {/* Column Header */}
            <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${getStageHeaderColor(stage).split(' ')[1]}`}>
                    {stage}
                  </span>
                  <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded">
                    {count}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{formatTotal(total)}</span>
              </div>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
              {stageQuotes.map((quote) => (
                <QuoteCardV2
                  key={quote.id}
                  quote={quote}
                  onClick={() => onQuoteClick(quote)}
                />
              ))}

              {/* Add New Button */}
              <button
                className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 5v10M5 10h10" strokeLinecap="round" />
                </svg>
                New
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default KanbanViewV2;
