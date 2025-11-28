/**
 * Kanban View for Jobs
 */

import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableJobCard } from '../SortableJobCard';
import { JobCard } from '../JobCard';
import type { Job, JobStage } from '../types';

interface KanbanViewProps {
  jobs: Job[];
  stages: JobStage[];
  activeId: string | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
  onJobClick: (job: Job) => void;
  onCreateJobClick: () => void;
}

export function KanbanView({
  jobs,
  stages,
  activeId,
  onDragStart,
  onDragEnd,
  onDragCancel,
  onJobClick,
  onCreateJobClick,
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="grid grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageJobs = getJobsByStatus(stage.name);

          return (
            <SortableContext
              key={stage.name}
              id={`stage-${stage.name}`}
              items={stageJobs.map(job => job.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col">
                {/* Column Header */}
                <div className="flex items-center justify-between px-3 py-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 font-medium">
                      {stage.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6h12M4 10h12M4 14h12" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  id={`stage-${stage.name}`}
                  className="min-h-[500px]"
                >
                  {stageJobs.map((job) => (
                    <SortableJobCard key={job.id} job={job} onClick={() => onJobClick(job)} />
                  ))}
                </div>

                {/* Add Card Button */}
                <button 
                  onClick={onCreateJobClick}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors mt-2"
                >
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
        {activeJob ? <JobCard job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
