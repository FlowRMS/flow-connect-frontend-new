/**
 * Kanban View for Pre-Opportunities
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
import { SortablePreOppCard } from '../SortablePreOppCard';
import { PreOppCard } from '../PreOppCard';
import { getPreOppsByStage } from '../utils';
import type { PreOpp, PreOppStage } from '../types';

interface KanbanViewProps {
  preOpps: PreOpp[];
  setPreOpps: React.Dispatch<React.SetStateAction<PreOpp[]>>;
  stages: PreOppStage[];
  activeId: string | null;
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function KanbanView({
  preOpps,
  setPreOpps,
  stages,
  activeId,
  setActiveId,
}: KanbanViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-6 gap-4">
        {stages.map((stage) => {
          const stagePreOpps = getPreOppsByStage(preOpps, stage.name);

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
  );
}
