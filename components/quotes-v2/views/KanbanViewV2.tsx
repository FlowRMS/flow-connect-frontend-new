'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import type { QuoteV2, QuotePipelineStage } from '../types';
import { QuoteCardV2 } from '../components/QuoteCardV2';

interface KanbanViewV2Props {
  quotes: QuoteV2[];
  onQuoteClick: (quote: QuoteV2) => void;
  onStageChange?: (quoteId: string, newStage: QuotePipelineStage) => Promise<void>;
}

// Use API pipeline stage enum values for Kanban columns
const pipelineStages: QuotePipelineStage[] = [
  'DISCOVERY',
  'PROSPECT',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
];

function getStageHeaderColor(stage: QuotePipelineStage): string {
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

// Format stage name for display (e.g., CLOSED_WON -> Closed Won)
function formatStageName(stage: QuotePipelineStage): string {
  return stage
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

export function KanbanViewV2({ quotes, onQuoteClick, onStageChange }: KanbanViewV2Props) {
  // Drag and drop state
  const [draggedQuote, setDraggedQuote] = useState<QuoteV2 | null>(null);
  const [dragOverStage, setDragOverStage] = useState<QuotePipelineStage | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const dragCounter = useRef<Record<string, number>>({});

  // Group quotes by pipelineStage (API enum)
  const quotesByStage = useMemo(() => {
    const grouped: Record<QuotePipelineStage, QuoteV2[]> = {
      DISCOVERY: [],
      PROSPECT: [],
      QUALIFICATION: [],
      PROPOSAL: [],
      NEGOTIATION: [],
      CLOSED_WON: [],
      CLOSED_LOST: [],
    };

    quotes.forEach((quote) => {
      const stage = quote.pipelineStage || 'DISCOVERY';
      if (grouped[stage]) {
        grouped[stage].push(quote);
      }
    });

    return grouped;
  }, [quotes]);

  // Calculate totals per stage
  const stageTotals = useMemo(() => {
    const totals: Record<QuotePipelineStage, number> = {
      DISCOVERY: 0,
      PROSPECT: 0,
      QUALIFICATION: 0,
      PROPOSAL: 0,
      NEGOTIATION: 0,
      CLOSED_WON: 0,
      CLOSED_LOST: 0,
    };

    quotes.forEach((quote) => {
      const stage = quote.pipelineStage || 'DISCOVERY';
      if (totals[stage] !== undefined) {
        totals[stage] += Number(quote.quoteAmount) || 0;
      }
    });

    return totals;
  }, [quotes]);

  const formatTotal = (amount: number): string => {
    const numAmount = Number(amount) || 0;
    if (numAmount >= 1000000) {
      return `$${(numAmount / 1000000).toFixed(1)}M`;
    }
    if (numAmount >= 1000) {
      return `$${(numAmount / 1000).toFixed(0)}K`;
    }
    return `$${numAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, quote: QuoteV2) => {
    setDraggedQuote(quote);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', quote.id);
    // Add a slight delay to show visual feedback
    const target = e.currentTarget;
    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 0);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    setDraggedQuote(null);
    setDragOverStage(null);
    dragCounter.current = {};
    e.currentTarget.style.opacity = '1';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, stage: QuotePipelineStage) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current[stage] = (dragCounter.current[stage] || 0) + 1;
    if (draggedQuote && draggedQuote.pipelineStage !== stage) {
      setDragOverStage(stage);
    }
  }, [draggedQuote]);

  const handleDragLeave = useCallback((e: React.DragEvent, stage: QuotePipelineStage) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current[stage] = (dragCounter.current[stage] || 0) - 1;
    if (dragCounter.current[stage] <= 0) {
      dragCounter.current[stage] = 0;
      if (dragOverStage === stage) {
        setDragOverStage(null);
      }
    }
  }, [dragOverStage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetStage: QuotePipelineStage) => {
    e.preventDefault();
    e.stopPropagation();

    setDragOverStage(null);
    dragCounter.current = {};

    if (!draggedQuote || !onStageChange) return;
    if (draggedQuote.pipelineStage === targetStage) return;

    setIsUpdating(draggedQuote.id);

    try {
      await onStageChange(draggedQuote.id, targetStage);
    } catch (error) {
      console.error('Failed to update quote stage:', error);
    } finally {
      setIsUpdating(null);
      setDraggedQuote(null);
    }
  }, [draggedQuote, onStageChange]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 h-full">
      {pipelineStages.map((stage) => {
        const stageQuotes = quotesByStage[stage];
        const count = stageQuotes.length;
        const total = stageTotals[stage];
        const isDropTarget = dragOverStage === stage && draggedQuote?.pipelineStage !== stage;

        return (
          <div
            key={stage}
            className={`flex-shrink-0 w-[220px] flex flex-col rounded-lg transition-colors ${
              isDropTarget
                ? 'bg-indigo-50 ring-2 ring-indigo-300'
                : 'bg-gray-50'
            }`}
            onDragEnter={(e) => handleDragEnter(e, stage)}
            onDragLeave={(e) => handleDragLeave(e, stage)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            {/* Column Header */}
            <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${getStageHeaderColor(stage).split(' ')[1]}`}>
                    {formatStageName(stage)}
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
                <div
                  key={quote.id}
                  draggable={!!onStageChange}
                  onDragStart={(e) => handleDragStart(e, quote)}
                  onDragEnd={handleDragEnd}
                  className={`${isUpdating === quote.id ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <QuoteCardV2
                    quote={quote}
                    isDragging={draggedQuote?.id === quote.id}
                    onClick={() => onQuoteClick(quote)}
                  />
                </div>
              ))}

              {/* Drop indicator when empty or as placeholder */}
              {isDropTarget && stageQuotes.length === 0 && (
                <div className="border-2 border-dashed border-indigo-300 rounded-md p-4 text-center text-sm text-indigo-500">
                  Drop here
                </div>
              )}

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
