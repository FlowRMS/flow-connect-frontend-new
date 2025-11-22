'use client';

import React, { useState } from 'react';
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
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Job = {
  id: string;
  name: string;
  status: 'Backlog' | 'Bidding' | 'Active' | 'On Hold' | 'Won';
  type: string;
  value: string;
  startDate: string;
  gc: string;
  ec: string;
  owner: string;
  tags: string[];
};

function JobCard({ job, isDragging }: { job: Job; isDragging?: boolean }) {
  const ownerInitials = job.owner.split(' ').map(n => n[0]).join('');
  const ownerColors = ['bg-orange-500', 'bg-teal-500', 'bg-green-500', 'bg-purple-500'];
  const colorIndex = job.id.charCodeAt(job.id.length - 1) % ownerColors.length;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-md p-3 mb-2 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <input type="checkbox" className="mt-1 accent-gray-400" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{job.name}</h4>
        </div>
        <div className={`w-5 h-5 rounded-full ${ownerColors[colorIndex]} flex items-center justify-center text-white text-[10px] font-semibold`}>
          {ownerInitials}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        <span className="font-mono text-gray-500">{job.id}</span>
      </div>

      {job.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {job.tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SortableJobCard({ job }: { job: Job }) {
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
      <JobCard job={job} isDragging={isDragging} />
    </div>
  );
}

export default function JobsContent() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeId, setActiveId] = useState<string | null>(null);

  const initialJobs: Job[] = [
    {
      id: 'J-001',
      name: 'Downtown Plaza Renovation',
      status: 'Active',
      type: 'Commercial',
      value: '$2.3M',
      startDate: '2024-03-15',
      gc: 'Turner Construction',
      ec: 'Miller Electric',
      owner: 'Sarah Johnson',
      tags: ['Lighting', 'Controls'],
    },
    {
      id: 'J-002',
      name: 'TechCorp HQ Expansion',
      status: 'Bidding',
      type: 'Office',
      value: '$1.8M',
      startDate: '2024-04-01',
      gc: 'Hensel Phelps',
      ec: 'Summit Electric',
      owner: 'Marcus Chen',
      tags: ['HVAC', 'Data Center'],
    },
    {
      id: 'J-003',
      name: 'Riverside Medical Center',
      status: 'Active',
      type: 'Healthcare',
      value: '$4.2M',
      startDate: '2024-02-20',
      gc: 'McCarthy Building',
      ec: 'Johnson Controls',
      owner: 'Sarah Johnson',
      tags: ['Critical Systems'],
    },
    {
      id: 'J-004',
      name: 'Harbor View Apartments',
      status: 'Won',
      type: 'Residential',
      value: '$890K',
      startDate: '2024-05-10',
      gc: 'Swinerton Builders',
      ec: 'Bay Area Electric',
      owner: 'Marcus Chen',
      tags: ['Multi-family'],
    },
    {
      id: 'J-005',
      name: 'University Lab Building',
      status: 'Bidding',
      type: 'Education',
      value: '$3.1M',
      startDate: '2024-06-01',
      gc: 'Skanska USA',
      ec: 'Prime Electric',
      owner: 'David Torres',
      tags: ['Lab Systems', 'Specialty'],
    },
    {
      id: 'J-006',
      name: 'Westside Mall Renovation',
      status: 'On Hold',
      type: 'Retail',
      value: '$1.2M',
      startDate: '2024-07-15',
      gc: 'Layton Construction',
      ec: 'Advanced Electric',
      owner: 'Sarah Johnson',
      tags: ['Retail'],
    },
    {
      id: 'J-007',
      name: 'City Center Office Tower',
      status: 'Backlog',
      type: 'Office',
      value: '$5.5M',
      startDate: '2024-08-01',
      gc: 'Turner Construction',
      ec: 'Summit Electric',
      owner: 'Marcus Chen',
      tags: ['High-rise', 'Commercial'],
    },
    {
      id: 'J-008',
      name: 'Airport Terminal Expansion',
      status: 'Backlog',
      type: 'Infrastructure',
      value: '$12.3M',
      startDate: '2024-09-01',
      gc: 'Hensel Phelps',
      ec: 'Miller Electric',
      owner: 'David Torres',
      tags: ['Infrastructure', 'Critical'],
    },
  ];

  const [jobs, setJobs] = useState<Job[]>(initialJobs);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const stages = [
    { name: 'Backlog' as const },
    { name: 'Bidding' as const },
    { name: 'Active' as const },
    { name: 'On Hold' as const },
    { name: 'Won' as const },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Backlog':
        return 'bg-gray-500 text-white';
      case 'Bidding':
        return 'bg-blue-500 text-white';
      case 'Active':
        return 'bg-yellow-500 text-white';
      case 'On Hold':
        return 'bg-purple-500 text-white';
      case 'Won':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getJobsByStatus = (status: string) => {
    return jobs.filter(job => job.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const targetStage = stages.find(s => `stage-${s.name}` === overId);

    if (targetStage) {
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === activeId
            ? { ...job, status: targetStage.name }
            : job
        )
      );
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeJob = activeId ? jobs.find(job => job.id === activeId) : null;

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Jobs</h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
            </svg>
            Add Job
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              viewMode === 'kanban'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              viewMode === 'list'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            List
          </button>
        </div>

        <div className="flex gap-2 pb-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
            </svg>
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="14" height="14" rx="2"/>
              <path d="M8 3v4M12 3v4" strokeLinecap="round"/>
            </svg>
            Display
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
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
                        <h3 className="font-semibold text-sm text-gray-900">
                          {stage.name}
                          <span className="ml-2 text-gray-500 font-normal">{stageJobs.length}</span>
                        </h3>
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
                        <SortableJobCard key={job.id} job={job} />
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
            {activeJob ? <JobCard job={activeJob} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Job Name
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Status
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Type
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Value
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              GC
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              EC
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Tags
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
              >
                <div className="col-span-3">
                  <h3 className="font-medium text-[var(--foreground)] mb-1">{job.name}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">{job.id}</p>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{job.type}</span>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-sm font-medium text-[var(--foreground)]">{job.value}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{job.gc}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{job.ec}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1 flex-wrap">
                  {job.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
