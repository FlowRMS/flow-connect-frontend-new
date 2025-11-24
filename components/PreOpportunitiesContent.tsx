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
import AdvancedFilters from './AdvancedFilters';

type PreOpp = {
  id: string;
  name: string;
  job: string;
  stage: 'Qualified' | 'Negotiation' | 'Follow-up' | 'Waiting on Factory' | 'Lost' | 'Converted';
  value: string;
  soldTo: string;
  manufacturer: string;
  dateCreated: string;
  expirationDate: string;
  owner: string;
  tags: string[];
};

function PreOppCard({ preOpp, isDragging }: { preOpp: PreOpp; isDragging?: boolean }) {
  const ownerInitials = preOpp.owner.split(' ').map(n => n[0]).join('');
  const ownerColors = ['bg-orange-500', 'bg-teal-500', 'bg-green-500', 'bg-purple-500'];
  const colorIndex = preOpp.id.charCodeAt(preOpp.id.length - 1) % ownerColors.length;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-md p-3 mb-2 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <input type="checkbox" className="mt-1 accent-gray-400" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{preOpp.name}</h4>
        </div>
        <div className={`w-5 h-5 rounded-full ${ownerColors[colorIndex]} flex items-center justify-center text-white text-[10px] font-semibold`}>
          {ownerInitials}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        <span className="font-mono text-gray-500">{preOpp.id}</span>
      </div>

      {preOpp.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {preOpp.tags.map((tag, idx) => (
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

function SortablePreOppCard({ preOpp }: { preOpp: PreOpp }) {
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
      <PreOppCard preOpp={preOpp} isDragging={isDragging} />
    </div>
  );
}

export default function PreOpportunitiesContent() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeId, setActiveId] = useState<string | null>(null);

  const preOppFilterOptions = [
    { id: 'preopp-id', label: 'Pre-Opp ID', type: 'text' as const },
    { id: 'preopp-name', label: 'Pre-Opp Name', type: 'text' as const },
    { id: 'stage', label: 'Stage', type: 'dropdown' as const },
    { id: 'job', label: 'Job', type: 'text' as const },
    { id: 'value-min', label: 'Min Value', type: 'number' as const },
    { id: 'value-max', label: 'Max Value', type: 'number' as const },
    { id: 'sold-to', label: 'Sold To', type: 'dropdown' as const },
    { id: 'manufacturer', label: 'Manufacturer', type: 'dropdown' as const },
    { id: 'owner', label: 'Owner', type: 'dropdown' as const },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const },
  ];

  const initialPreOpps: PreOpp[] = [
    {
      id: 'PO-001',
      name: 'Downtown Plaza LED Upgrade',
      job: 'J-001',
      stage: 'Qualified',
      value: '$45,000',
      soldTo: 'Turner Construction',
      manufacturer: 'Acuity Brands',
      dateCreated: '2024-01-15',
      expirationDate: '2024-04-15',
      owner: 'Sarah Johnson',
      tags: ['Lighting', 'LED'],
    },
    {
      id: 'PO-002',
      name: 'TechCorp Emergency Lighting',
      job: 'J-002',
      stage: 'Negotiation',
      value: '$28,500',
      soldTo: 'Hensel Phelps',
      manufacturer: 'Eaton',
      dateCreated: '2024-01-20',
      expirationDate: '2024-03-20',
      owner: 'Marcus Chen',
      tags: ['Emergency', 'Controls'],
    },
    {
      id: 'PO-003',
      name: 'Medical Center Backup Power',
      job: 'J-003',
      stage: 'Follow-up',
      value: '$95,000',
      soldTo: 'McCarthy Building',
      manufacturer: 'Schneider Electric',
      dateCreated: '2024-02-01',
      expirationDate: '2024-05-01',
      owner: 'Sarah Johnson',
      tags: ['Critical', 'Power'],
    },
    {
      id: 'PO-004',
      name: 'Westside Mall EV Chargers',
      job: 'J-006',
      stage: 'Waiting on Factory',
      value: '$125,000',
      soldTo: 'Gilbane Building',
      manufacturer: 'ChargePoint',
      dateCreated: '2024-02-10',
      expirationDate: '2024-06-10',
      owner: 'David Torres',
      tags: ['EV', 'Infrastructure'],
    },
    {
      id: 'PO-005',
      name: 'Harbor Apartments Smart Controls',
      job: 'J-004',
      stage: 'Converted',
      value: '$62,000',
      soldTo: 'Turner Construction',
      manufacturer: 'Lutron',
      dateCreated: '2024-01-05',
      expirationDate: '2024-03-05',
      owner: 'Marcus Chen',
      tags: ['Smart Home', 'Controls'],
    },
    {
      id: 'PO-006',
      name: 'University Lab Specialty Lighting',
      job: 'J-005',
      stage: 'Negotiation',
      value: '$78,500',
      soldTo: 'Hensel Phelps',
      manufacturer: 'Signify',
      dateCreated: '2024-02-15',
      expirationDate: '2024-05-15',
      owner: 'David Torres',
      tags: ['Lab Systems', 'Specialty'],
    },
    {
      id: 'PO-007',
      name: 'City Center Office Tower Fixtures',
      job: 'J-007',
      stage: 'Qualified',
      value: '$52,000',
      soldTo: 'Turner Construction',
      manufacturer: 'Cooper Lighting',
      dateCreated: '2024-01-25',
      expirationDate: '2024-04-25',
      owner: 'Marcus Chen',
      tags: ['High-rise', 'Commercial'],
    },
    {
      id: 'PO-008',
      name: 'Airport Terminal Exit Signs',
      job: 'J-008',
      stage: 'Qualified',
      value: '$38,000',
      soldTo: 'Hensel Phelps',
      manufacturer: 'Philips',
      dateCreated: '2024-02-20',
      expirationDate: '2024-06-20',
      owner: 'David Torres',
      tags: ['Infrastructure', 'Safety'],
    },
  ];

  const [preOpps, setPreOpps] = useState<PreOpp[]>(initialPreOpps);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const stages = [
    { name: 'Qualified' as const },
    { name: 'Negotiation' as const },
    { name: 'Follow-up' as const },
    { name: 'Waiting on Factory' as const },
    { name: 'Lost' as const },
    { name: 'Converted' as const },
  ];

  const getPreOppsByStage = (stage: string) => {
    return preOpps.filter(preOpp => preOpp.stage === stage);
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
      setPreOpps(prevPreOpps =>
        prevPreOpps.map(preOpp =>
          preOpp.id === activeId
            ? { ...preOpp, stage: targetStage.name }
            : preOpp
        )
      );
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activePreOpp = activeId ? preOpps.find(preOpp => preOpp.id === activeId) : null;

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Pre-Opportunities</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block mr-1">
                  <rect x="3" y="3" width="5" height="14"/>
                  <rect x="12" y="3" width="5" height="14"/>
                </svg>
                Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block mr-1">
                  <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
                </svg>
                List
              </button>
            </div>

            <AdvancedFilters filterOptions={preOppFilterOptions} />

            <button className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6l7 7 7-7" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              Add Pre-Opportunity
            </button>
          </div>
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
          <div className="grid grid-cols-6 gap-4">
            {stages.map((stage) => {
              const stagePreOpps = getPreOppsByStage(stage.name);

              return (
                <SortableContext
                  key={stage.name}
                  id={`stage-${stage.name}`}
                  items={stagePreOpps.map(preOpp => preOpp.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col">
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-3 py-2 mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-gray-900">
                          {stage.name}
                          <span className="ml-2 text-gray-500 font-normal">{stagePreOpps.length}</span>
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
                      {stagePreOpps.map((preOpp) => (
                        <SortablePreOppCard key={preOpp.id} preOpp={preOpp} />
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
            {activePreOpp ? <PreOppCard preOpp={activePreOpp} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    <input type="checkbox" className="accent-[var(--primary)]" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Job</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Sold To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {preOpps.map((preOpp) => (
                  <tr key={preOpp.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="accent-[var(--primary)]" />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">{preOpp.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{preOpp.name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{preOpp.job}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded bg-[var(--muted)] text-[var(--foreground)] text-xs">
                        {preOpp.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">{preOpp.value}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{preOpp.soldTo}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{preOpp.owner}</td>
                    <td className="px-4 py-3 text-sm">
                      <button className="text-[var(--primary)] hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
