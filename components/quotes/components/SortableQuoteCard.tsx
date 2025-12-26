'use client';

import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Quote } from '../types';
import { QuoteCard } from './QuoteCard';

interface SortableQuoteCardProps {
  quote: Quote;
  onClick: () => void;
}

export const SortableQuoteCard = React.memo(function SortableQuoteCard({ quote, onClick }: SortableQuoteCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: quote.id });

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
  }), [transform, transition]);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <QuoteCard quote={quote} isDragging={isDragging} onClick={onClick} />
    </div>
  );
});
