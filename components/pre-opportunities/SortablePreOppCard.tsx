/**
 * Sortable PreOpp Card Component
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PreOppCard } from './PreOppCard';
import type { PreOpp } from './types';

interface SortablePreOppCardProps {
  preOpp: PreOpp;
  onClick?: () => void;
}

export function SortablePreOppCard({ preOpp, onClick }: SortablePreOppCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: preOpp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PreOppCard preOpp={preOpp} isDragging={isDragging} onClick={onClick} />
    </div>
  );
}
