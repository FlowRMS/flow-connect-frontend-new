'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DndContext, DragOverlay, closestCenter, DragStartEvent, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import type { Quote } from '../types';
import { SortableQuoteCard, QuoteCard } from '../components';
import { stages } from '../config';

// ============================================================================
// Helper Functions
// ============================================================================

function getStageColor(stageName: string): { bg: string; text: string; border: string } {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    Draft: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    Review: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    Sent: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    Negotiating: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    Won: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    Lost: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    Dormant: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
  };
  return colorMap[stageName] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
}

function getStageHeaderColor(stageName: string): string {
  const colorMap: Record<string, string> = {
    Draft: 'bg-gray-200',
    Review: 'bg-blue-200',
    Sent: 'bg-purple-200',
    Negotiating: 'bg-yellow-200',
    Won: 'bg-green-200',
    Lost: 'bg-red-200',
    Dormant: 'bg-gray-300',
  };
  return colorMap[stageName] || 'bg-gray-200';
}

// ============================================================================
// DroppableColumn Component
// ============================================================================

interface DroppableColumnProps {
  stage: string;
  stageColor: string;
  quoteCount: number;
  totalValue: string;
  children: React.ReactNode;
}

function DroppableColumn({ stage, stageColor, quoteCount, totalValue, children }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `stage-${stage}` });
  const colors = getStageColor(stage);
  const headerColor = getStageHeaderColor(stage);

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 flex flex-col rounded-lg border ${colors.border} ${
        isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
    >
      {/* Column Header */}
      <div className={`${headerColor} rounded-t-lg px-3 py-2.5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-sm ${colors.text}`}>{stage}</h3>
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
            >
              {quoteCount}
            </span>
          </div>
          <button className="p-1 hover:bg-white/50 rounded transition-colors">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={colors.text}
            >
              <circle cx="8" cy="4" r="1" fill="currentColor" />
              <circle cx="8" cy="8" r="1" fill="currentColor" />
              <circle cx="8" cy="12" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-0.5">{totalValue}</p>
      </div>

      {/* Column Body */}
      <div
        className={`flex-1 ${colors.bg} p-2 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)] rounded-b-lg`}
      >
        {children}
        {quoteCount === 0 && (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            No quotes in {stage.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// KanbanView Component
// ============================================================================

interface KanbanViewProps {
  quotes: Quote[];
  onQuoteSelect: (quote: Quote) => void;
}

export function KanbanView({ quotes, onQuoteSelect }: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localQuotes, setLocalQuotes] = useState<Quote[]>(quotes);

  // Sync localQuotes when quotes prop changes
  useEffect(() => {
    setLocalQuotes(quotes);
  }, [quotes]);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group quotes by stage
  const quotesByStage = useMemo(() => {
    const grouped: Record<string, Quote[]> = {};
    stages.forEach((stage) => {
      grouped[stage.name] = [];
    });
    localQuotes.forEach((quote) => {
      if (grouped[quote.stage]) {
        grouped[quote.stage].push(quote);
      }
    });
    return grouped;
  }, [localQuotes]);

  // Calculate stage totals
  const stageTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    stages.forEach((stage) => {
      const stageQuotes = quotesByStage[stage.name] || [];
      totals[stage.name] = stageQuotes.reduce((sum, q) => sum + q.valueNumber, 0);
    });
    return totals;
  }, [quotesByStage]);

  // Format currency for display
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeQuoteId = active.id as string;
      const overId = over.id as string;

      // Check if dropped on a stage column
      if (overId.startsWith('stage-')) {
        const newStage = overId.replace('stage-', '') as Quote['stage'];

        setLocalQuotes((prevQuotes) =>
          prevQuotes.map((quote) =>
            quote.id === activeQuoteId ? { ...quote, stage: newStage } : quote
          )
        );
      } else {
        // Dropped on another quote - find which stage that quote belongs to
        const overQuote = localQuotes.find((q) => q.id === overId);
        if (overQuote) {
          const newStage = overQuote.stage;

          setLocalQuotes((prevQuotes) =>
            prevQuotes.map((quote) =>
              quote.id === activeQuoteId ? { ...quote, stage: newStage } : quote
            )
          );
        }
      }
    },
    [localQuotes]
  );

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Get the active quote for drag overlay
  const activeQuote = useMemo(
    () => (activeId ? localQuotes.find((q) => q.id === activeId) : null),
    [activeId, localQuotes]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 p-6 overflow-x-auto min-h-full">
        {stages.map((stage) => {
          const stageQuotes = quotesByStage[stage.name] || [];
          const stageTotal = stageTotals[stage.name] || 0;

          return (
            <DroppableColumn
              key={stage.name}
              stage={stage.name}
              stageColor={stage.color}
              quoteCount={stageQuotes.length}
              totalValue={formatCurrency(stageTotal)}
            >
              <SortableContext
                items={stageQuotes.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                {stageQuotes.map((quote) => (
                  <SortableQuoteCard
                    key={quote.id}
                    quote={quote}
                    onClick={() => onQuoteSelect(quote)}
                  />
                ))}
              </SortableContext>
            </DroppableColumn>
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeQuote && <QuoteCard quote={activeQuote} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}

export default KanbanView;
