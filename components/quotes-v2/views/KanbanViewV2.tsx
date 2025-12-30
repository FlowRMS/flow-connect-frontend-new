'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import type { QuoteV2, QuotePipelineStage } from '../types';
import { QuoteCardV2 } from '../components/QuoteCardV2';

interface KanbanViewV2Props {
  quotes: QuoteV2[];
  onQuoteClick: (quote: QuoteV2) => void;
  onStageChange?: (quoteId: string, newStage: QuotePipelineStage) => Promise<void>;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
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

export function KanbanViewV2({ quotes, onQuoteClick, onStageChange, onLoadMore, hasMore, isLoadingMore }: KanbanViewV2Props) {
  // Drag and drop state
  const [draggedQuote, setDraggedQuote] = useState<QuoteV2 | null>(null);
  const [dragOverStage, setDragOverStage] = useState<QuotePipelineStage | null>(null);
  const [updatingQuotes, setUpdatingQuotes] = useState<Set<string>>(new Set());
  const dragCounter = useRef<Record<string, number>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Optimistic state - tracks quotes that have been moved locally but API hasn't responded yet
  const [optimisticMoves, setOptimisticMoves] = useState<Map<string, QuotePipelineStage>>(new Map());

  // Group quotes by pipelineStage (API enum) - with optimistic updates applied
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
      // Use optimistic stage if available, otherwise use actual stage
      const stage = optimisticMoves.get(quote.id) || quote.pipelineStage || 'DISCOVERY';
      if (grouped[stage]) {
        grouped[stage].push(quote);
      }
    });

    return grouped;
  }, [quotes, optimisticMoves]);

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

  const handleDrop = useCallback((e: React.DragEvent, targetStage: QuotePipelineStage) => {
    e.preventDefault();
    e.stopPropagation();

    setDragOverStage(null);
    dragCounter.current = {};

    if (!draggedQuote || !onStageChange) return;

    // Get current stage (could be from optimistic move or original)
    const currentStage = optimisticMoves.get(draggedQuote.id) || draggedQuote.pipelineStage;
    if (currentStage === targetStage) return;

    const quoteId = draggedQuote.id;

    // OPTIMISTIC UPDATE: Move the card immediately in the UI
    setOptimisticMoves(prev => new Map(prev).set(quoteId, targetStage));
    setUpdatingQuotes(prev => new Set(prev).add(quoteId));
    setDraggedQuote(null);

    // Fire and forget - don't await, let the UI update immediately
    onStageChange(quoteId, targetStage)
      .then(() => {
        // Success - remove from optimistic moves (API data will reflect the change)
        setOptimisticMoves(prev => {
          const next = new Map(prev);
          next.delete(quoteId);
          return next;
        });
      })
      .catch((error) => {
        console.error('Failed to update quote stage:', error);
        // ROLLBACK: Remove optimistic move so it goes back to original position
        setOptimisticMoves(prev => {
          const next = new Map(prev);
          next.delete(quoteId);
          return next;
        });
      })
      .finally(() => {
        setUpdatingQuotes(prev => {
          const next = new Set(prev);
          next.delete(quoteId);
          return next;
        });
      });
  }, [draggedQuote, onStageChange, optimisticMoves]);

  // Vertical scroll handler for loading more quotes (within any column)
  const handleColumnScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;

    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    // Load more when scrolled near the bottom of any column (within 200px)
    if (scrollHeight - scrollTop - clientHeight < 200) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoadingMore]);

  return (
    <div
      ref={scrollContainerRef}
      className="flex gap-3 overflow-x-auto pb-4 h-full"
    >
      {pipelineStages.map((stage) => {
        const stageQuotes = quotesByStage[stage];
        const count = stageQuotes.length;
        const total = stageTotals[stage];
        // Check if this is a valid drop target - considering optimistic moves
        const draggedQuoteCurrentStage = draggedQuote
          ? (optimisticMoves.get(draggedQuote.id) || draggedQuote.pipelineStage)
          : null;
        const isDropTarget = dragOverStage === stage && draggedQuoteCurrentStage !== stage;

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
            <div
              className="flex-1 overflow-y-auto p-2 min-h-0"
              onScroll={handleColumnScroll}
            >
              {stageQuotes.map((quote) => (
                <div
                  key={quote.id}
                  draggable={!!onStageChange && !updatingQuotes.has(quote.id)}
                  onDragStart={(e) => handleDragStart(e, quote)}
                  onDragEnd={handleDragEnd}
                  className={`transition-opacity ${updatingQuotes.has(quote.id) ? 'opacity-70' : ''}`}
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

      {/* Loading indicator for infinite scroll - shows as an extra column on the right */}
      {isLoadingMore && (
        <div className="flex-shrink-0 w-[100px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
        </div>
      )}

      {/* Show load more button if there are more quotes to load */}
      {hasMore && !isLoadingMore && (
        <div className="flex-shrink-0 w-[100px] flex items-center justify-center">
          <button
            onClick={onLoadMore}
            className="text-xs text-indigo-600 hover:text-indigo-700 underline"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

export default KanbanViewV2;
