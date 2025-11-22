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
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all cursor-grab active:cursor-grabbing mb-3 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-[var(--foreground)] text-base flex-1 pr-2">{preOpp.name}</h4>
        <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 10h8M10 6v8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="text-gray-600">Amount: <span className="font-semibold text-[var(--foreground)]">{preOpp.value}</span></div>
        <div className="text-gray-600">Deal owner: <span className="text-[var(--foreground)]">{preOpp.owner}</span></div>
        <div className="text-gray-600">Create date: <span className="text-[var(--foreground)]">{new Date(preOpp.dateCreated).toLocaleDateString()}</span></div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
            {preOpp.soldTo.charAt(0)}
          </div>
          <span>{preOpp.soldTo}</span>
        </div>
      </div>

      {preOpp.tags.length > 0 && (
        <div className="mt-3 text-xs text-gray-500">
          Note {Math.floor(Math.random() * 12)} months ago
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <button
            key={i}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              {i === 1 && <rect x="3" y="3" width="14" height="14" rx="2"/>}
              {i === 2 && <path d="M10 3v14M3 10h14" strokeLinecap="round"/>}
              {i === 3 && <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>}
              {i === 4 && <circle cx="10" cy="10" r="7"/>}
            </svg>
          </button>
        ))}
      </div>
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

  const initialPreOpps: PreOpp[] = [
    {
      id: 'PO-2024-001',
      name: 'LED Lighting Package',
      job: 'Downtown Plaza Renovation',
      stage: 'Negotiation',
      value: '$145,000',
      soldTo: 'Miller Electric',
      manufacturer: 'Acuity Brands',
      dateCreated: '2024-11-15',
      expirationDate: '2024-12-15',
      owner: 'Curtis Seare',
      tags: ['Lighting', 'LED'],
    },
    {
      id: 'PO-2024-002',
      name: 'HVAC Controls System',
      job: 'TechCorp HQ Expansion',
      stage: 'Qualified',
      value: '$89,000',
      soldTo: 'Summit Electric',
      manufacturer: 'Johnson Controls',
      dateCreated: '2024-11-18',
      expirationDate: '2024-12-20',
      owner: 'Curtis Seare',
      tags: ['HVAC', 'Controls'],
    },
    {
      id: 'PO-2024-003',
      name: 'Emergency Power Systems',
      job: 'Riverside Medical Center',
      stage: 'Waiting on Factory',
      value: '$234,000',
      soldTo: 'Johnson Controls',
      manufacturer: 'Eaton',
      dateCreated: '2024-11-10',
      expirationDate: '2024-12-10',
      owner: 'Curtis Seare',
      tags: ['Power', 'Emergency'],
    },
    {
      id: 'PO-2024-004',
      name: 'Smart Building Package',
      job: 'Harbor View Apartments',
      stage: 'Negotiation',
      value: '$67,000',
      soldTo: 'Bay Area Electric',
      manufacturer: 'Schneider Electric',
      dateCreated: '2024-11-12',
      expirationDate: '2024-12-18',
      owner: 'Matias Denti',
      tags: ['Smart Building', 'IoT'],
    },
    {
      id: 'PO-2024-005',
      name: 'Lab Specialty Lighting',
      job: 'University Lab Building',
      stage: 'Qualified',
      value: '$123,000',
      soldTo: 'Prime Electric',
      manufacturer: 'Philips',
      dateCreated: '2024-11-20',
      expirationDate: '2024-12-25',
      owner: 'Curtis Seare',
      tags: ['Lighting', 'Specialty'],
    },
    {
      id: 'PO-2024-006',
      name: 'Panel Upgrades',
      job: 'Westside Mall Renovation',
      stage: 'Follow-up',
      value: '$45,000',
      soldTo: 'Advanced Electric',
      manufacturer: 'Siemens',
      dateCreated: '2024-11-08',
      expirationDate: '2024-12-08',
      owner: 'Curtis Seare',
      tags: ['Electrical', 'Panels'],
    },
    {
      id: 'PO-2024-007',
      name: 'Building Automation System',
      job: 'Downtown Plaza Renovation',
      stage: 'Qualified',
      value: '$178,000',
      soldTo: 'Miller Electric',
      manufacturer: 'Lutron',
      dateCreated: '2024-10-28',
      expirationDate: '2024-11-28',
      owner: 'Matias Denti',
      tags: ['Controls', 'Automation'],
    },
    {
      id: 'PO-2024-008',
      name: 'Fire Alarm System',
      job: 'Riverside Medical Center',
      stage: 'Negotiation',
      value: '$92,000',
      soldTo: 'Johnson Controls',
      manufacturer: 'Honeywell',
      dateCreated: '2024-11-05',
      expirationDate: '2024-12-05',
      owner: 'Curtis Seare',
      tags: ['Safety', 'Fire'],
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
    { name: 'Qualified' as const, color: 'bg-blue-50', count: 0 },
    { name: 'Negotiation' as const, color: 'bg-orange-50', count: 0 },
    { name: 'Follow-up' as const, color: 'bg-purple-50', count: 0 },
    { name: 'Waiting on Factory' as const, color: 'bg-gray-50', count: 0 },
  ];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Qualified':
        return 'bg-[var(--info)] text-white';
      case 'Negotiation':
        return 'bg-[var(--warning)] text-white';
      case 'Follow-up':
        return 'bg-[var(--primary)] text-white';
      case 'Waiting on Factory':
        return 'bg-[var(--muted-foreground)] text-white';
      case 'Lost':
        return 'bg-[var(--error)] text-white';
      case 'Converted':
        return 'bg-[var(--success)] text-white';
      default:
        return 'bg-[var(--muted)] text-[var(--foreground)]';
    }
  };

  const getPreOppsByStage = (stage: string) => {
    return preOpps.filter(po => po.stage === stage);
  };

  const totalValue = preOpps
    .filter(po => po.stage !== 'Lost' && po.stage !== 'Converted')
    .reduce((sum, po) => sum + parseFloat(po.value.replace('$', '').replace(',', '')) , 0);

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

    // Check if we're dropping over a stage column
    const targetStage = stages.find(s => `stage-${s.name}` === overId);

    if (targetStage) {
      setPreOpps(prevPreOpps =>
        prevPreOpps.map(po =>
          po.id === activeId
            ? { ...po, stage: targetStage.name }
            : po
        )
      );
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activePreOpp = activeId ? preOpps.find(po => po.id === activeId) : null;

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Pre-Opportunities</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Track quotes and proposals through the pipeline
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
            </svg>
            Create Pre-Opp
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Total Pipeline</div>
          <div className="text-2xl font-semibold text-[var(--foreground)]">
            ${(totalValue / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Active</div>
          <div className="text-2xl font-semibold text-[var(--foreground)]">
            {preOpps.filter(po => po.stage !== 'Lost' && po.stage !== 'Converted').length}
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">In Negotiation</div>
          <div className="text-2xl font-semibold text-[var(--foreground)]">
            {preOpps.filter(po => po.stage === 'Negotiation').length}
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">Converted</div>
          <div className="text-2xl font-semibold text-[var(--success)]">
            {preOpps.filter(po => po.stage === 'Converted').length}
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] border border-[var(--border)]'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] border border-[var(--border)]'
            }`}
          >
            List
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
          <div className="grid grid-cols-4 gap-4">
            {stages.map((stage) => {
              const stagePreOpps = getPreOppsByStage(stage.name);

              return (
                <SortableContext
                  key={stage.name}
                  id={`stage-${stage.name}`}
                  items={stagePreOpps.map(po => po.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col">
                    {/* Column Header */}
                    <div className="bg-gray-50 rounded-t-lg px-4 py-3 mb-0 border-b-2 border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[var(--foreground)] text-base">{stage.name} <span className="text-gray-500 font-normal ml-1">{stagePreOpps.length}</span></h3>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 4l-4 6 4 6M12 4l4 6-4 6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Drop Zone */}
                    <div
                      id={`stage-${stage.name}`}
                      className="bg-gray-50 rounded-b-lg p-4 min-h-[600px]"
                    >
                      {stagePreOpps.map((preOpp) => (
                        <SortablePreOppCard key={preOpp.id} preOpp={preOpp} />
                      ))}
                    </div>
                  </div>
                </SortableContext>
              );
            })}
          </div>

          <DragOverlay>
            {activePreOpp ? <PreOppCard preOpp={activePreOpp} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Name
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Job
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Stage
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Value
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Sold To
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Manufacturer
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Expires
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {preOpps.map((preOpp) => (
              <div
                key={preOpp.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
              >
                <div className="col-span-3">
                  <h3 className="font-medium text-[var(--foreground)] mb-1">{preOpp.name}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">{preOpp.id}</p>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{preOpp.job}</span>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStageColor(preOpp.stage)}`}>
                    {preOpp.stage}
                  </span>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-sm font-medium text-[var(--foreground)]">{preOpp.value}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{preOpp.soldTo}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{preOpp.manufacturer}</span>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {new Date(preOpp.expirationDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
