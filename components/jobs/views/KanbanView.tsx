/**
 * Kanban View for Jobs
 * Enhanced with better drag-drop, visual feedback, and column styling
 */

import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableJobCard } from '../SortableJobCard';
import { JobCard } from '../JobCard';
import type { Job, JobStage } from '../types';

// Column status indicator colors (dots)
const COLUMN_STATUS_COLORS: Record<string, string> = {
  'Backlog': 'bg-gray-400',
  'Bidding': 'bg-blue-500',
  'Active': 'bg-amber-500',
  'On Hold': 'bg-purple-500',
  'Won': 'bg-green-500',
};

// Droppable Column Component
function DroppableColumn({ 
  stage, 
  children, 
  isOver 
}: { 
  stage: JobStage; 
  children: React.ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: `stage-${stage.name}`,
    data: {
      type: 'column',
      stageName: stage.name,
    },
  });

  const showHighlight = isOver || isDroppableOver;

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[500px] rounded-lg p-3 transition-all duration-200
        ${showHighlight 
          ? 'bg-blue-50/80 ring-2 ring-blue-400/50' 
          : 'bg-[var(--muted)]/30'
        }
      `}
    >
      {children}
    </div>
  );
}

interface KanbanViewProps {
  jobs: Job[];
  stages: JobStage[];
  activeId: string | null;
  overId?: string | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragCancel: () => void;
  onJobClick: (job: Job) => void;
  onCreateJobClick: (statusName?: string) => void;
  onJobCheckboxChange?: (jobId: string, checked: boolean) => void;
}

export function KanbanView({
  jobs,
  stages,
  activeId,
  overId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragCancel,
  onJobClick,
  onCreateJobClick,
  onJobCheckboxChange,
}: KanbanViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getJobsByStatus = (status: string) => {
    return jobs.filter((job) => job.status === status);
  };

  const activeJob = activeId ? jobs.find((job) => job.id === activeId) : null;

  // Custom collision detection that prioritizes droppable columns
  const customCollisionDetection = (args: Parameters<typeof pointerWithin>[0]) => {
    // First check for column intersections
    const pointerCollisions = pointerWithin(args);
    
    // If we have collisions, prioritize stage columns
    if (pointerCollisions.length > 0) {
      const columnCollision = pointerCollisions.find(c => 
        String(c.id).startsWith('stage-')
      );
      if (columnCollision) {
        return [columnCollision];
      }
    }
    
    // Fall back to rect intersection for edge cases
    return rectIntersection(args);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragCancel={onDragCancel}
    >
      <div className="grid grid-cols-5 gap-6 min-w-full">
        {stages.map((stage) => {
          const stageJobs = getJobsByStatus(stage.name);
          const isOverColumn = overId === `stage-${stage.name}`;
          const statusColor = COLUMN_STATUS_COLORS[stage.name] || 'bg-gray-400';

          return (
            <div key={stage.name} className="flex flex-col">
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-3 mb-3 bg-[var(--card)] rounded-lg border border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`}></span>
                  <span className="text-sm text-[var(--foreground)] font-semibold">
                    {stage.name}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-0.5 rounded-full font-medium">
                    {stageJobs.length}
                  </span>
                </div>
                <button 
                  onClick={() => onCreateJobClick(stage.name)}
                  className="p-1.5 hover:bg-[var(--muted)] rounded-md transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  title={`Add job to ${stage.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Drop Zone */}
              <SortableContext
                id={`stage-${stage.name}`}
                items={stageJobs.map(job => job.id)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableColumn stage={stage} isOver={isOverColumn}>
                  {stageJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                      <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-xs">No jobs</span>
                    </div>
                  ) : (
                    stageJobs.map((job) => (
                      <SortableJobCard 
                        key={job.id} 
                        job={job} 
                        onClick={() => onJobClick(job)}
                        onCheckboxChange={onJobCheckboxChange}
                      />
                    ))
                  )}
                </DroppableColumn>
              </SortableContext>

              {/* Add Card Button */}
              <button 
                onClick={() => onCreateJobClick(stage.name)}
                className="flex items-center justify-center gap-1.5 py-2.5 mt-2 text-xs text-[var(--muted-foreground)] 
                         hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 rounded-lg transition-colors border border-dashed border-[var(--border)] hover:border-[var(--primary)]/50"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                </svg>
                Add Job
              </button>
            </div>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeJob ? (
          <div className="opacity-90">
            <JobCard job={activeJob} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
