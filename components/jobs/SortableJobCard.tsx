/**
 * Sortable Job Card Component (for drag-and-drop)
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { JobCard } from './JobCard';
import type { Job } from './types';

interface SortableJobCardProps {
  job: Job;
  onClick: () => void;
}

export function SortableJobCard({ job, onClick }: SortableJobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard job={job} isDragging={isDragging} onClick={onClick} />
    </div>
  );
}
