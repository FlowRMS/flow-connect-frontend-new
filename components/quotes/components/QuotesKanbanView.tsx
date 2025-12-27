'use client';

import React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { SensorDescriptor, SensorOptions } from '@dnd-kit/core';
import type { Quote } from '../types';
import { QuoteCard, SortableQuoteCard } from './index';

interface QuotesKanbanViewProps {
  stages: { name: string }[];
  quotesByStage: Record<string, Quote[]>;
  sensors: SensorDescriptor<SensorOptions>[];
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
  handleQuoteSelect: (quote: Quote) => void;
  activeQuote: Quote | null | undefined;
}

export function QuotesKanbanView({
  stages,
  quotesByStage,
  sensors,
  handleDragStart,
  handleDragEnd,
  handleDragCancel,
  handleQuoteSelect,
  activeQuote,
}: QuotesKanbanViewProps) {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-6 gap-4">
        {stages.map((stage) => {
          const stageQuotes = quotesByStage[stage.name] || [];
          const stageTotal = stageQuotes.reduce((sum, q) => sum + q.valueNumber, 0);
          const stageQuoteIds = stageQuotes.map(quote => quote.id);

          return (
            <SortableContext
              key={stage.name}
              id={`stage-${stage.name}`}
              items={stageQuoteIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col">
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-2 mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-gray-900">
                      {stage.name}
                      <span className="ml-2 text-gray-500 font-normal">{stageQuotes.length}</span>
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500">${(stageTotal / 1000000).toFixed(1)}M</span>
                </div>

                {/* Drop Zone */}
                <div
                  id={`stage-${stage.name}`}
                  className="min-h-[500px]"
                >
                  {stageQuotes.map((quote) => (
                    <SortableQuoteCard key={quote.id} quote={quote} onClick={() => handleQuoteSelect(quote)} />
                  ))}
                </div>

                {/* Add Card Button */}
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors mt-2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                  </svg>
                  New
                </button>
              </div>
            </SortableContext>
          );
        })}
      </div>

      <DragOverlay>
        {activeQuote ? <QuoteCard quote={activeQuote} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
