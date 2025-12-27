'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { Quote } from '../types';

export function useKanbanDnD(
  quotes: Quote[],
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>
) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Memoize stages array to prevent re-renders
  const stages = useMemo<{ name: Quote['stage'] }[]>(() => [
    { name: 'Draft' },
    { name: 'Review' },
    { name: 'Sent' },
    { name: 'Negotiating' },
    { name: 'Won' },
    { name: 'Lost' },
    { name: 'Dormant' },
  ], []);

  const getQuotesByStage = useCallback((stage: string) => {
    return quotes.filter(quote => quote.stage === stage);
  }, [quotes]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeQuoteId = active.id as string;
    const overId = over.id as string;

    const targetStage = stages.find(s => `stage-${s.name}` === overId);

    if (targetStage) {
      setQuotes(prevQuotes =>
        prevQuotes.map(quote =>
          quote.id === activeQuoteId
            ? { ...quote, stage: targetStage.name }
            : quote
        )
      );
    }

    setActiveId(null);
  }, [stages, setQuotes]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const activeQuote = useMemo(() =>
    activeId ? quotes.find(quote => quote.id === activeId) : null,
    [activeId, quotes]
  );

  // Memoize quotes grouped by stage for kanban view
  const quotesByStage = useMemo(() => {
    const grouped: Record<string, Quote[]> = {};
    stages.forEach(stage => {
      grouped[stage.name] = quotes.filter(quote => quote.stage === stage.name);
    });
    return grouped;
  }, [quotes, stages]);

  return {
    activeId,
    sensors,
    stages,
    getQuotesByStage,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    activeQuote,
    quotesByStage,
  };
}
