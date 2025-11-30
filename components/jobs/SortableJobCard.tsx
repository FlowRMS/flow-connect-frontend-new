/**
 * Sortable Job Card Component (for drag-and-drop)
 * Enhanced with better drag feedback and completion handling
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { JobCard } from './JobCard';
import type { Job } from './types';

interface SortableJobCardProps {
  job: Job;
  onClick: () => void;
  onCheckboxChange?: (jobId: string, checked: boolean) => void;
}

export function SortableJobCard({ job, onClick, onCheckboxChange }: SortableJobCardProps) {
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
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  const handleCheckboxChange = (checked: boolean) => {
    onCheckboxChange?.(job.id, checked);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
    >
      <JobCard 
        job={job} 
        isDragging={isDragging} 
        onClick={onClick}
        onCheckboxChange={handleCheckboxChange}
      />
    </div>
  );
}
