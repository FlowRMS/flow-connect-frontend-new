/**
 * Kanban View for Pre-Opportunities with Drag-and-Drop Support
 */

'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getPreOppsByStatus, formatCurrency, formatDate, getStatusLabel } from '../utils';
import type { PreOpportunityLandingPage, PreOppStage, PreOpportunityStatus } from '../types';
import { useUpdateCRMPreOpportunity, useDeleteCRMPreOpportunity } from '../../hooks/useCRMApi';
import { fetchPreOpportunity } from '../../lib/crm-graphql';
import { CreatePreOpportunityModal } from '../modals/CreatePreOpportunityModal';
import { preOpportunityToasts } from '../../lib/toast';
import { CloseIcon, PlusIcon, DragIndicator } from '../components/icons';

// ============================================================================
// Types
// ============================================================================

interface KanbanViewProps {
  preOpps: PreOpportunityLandingPage[];
  stages: PreOppStage[];
  activeId: string | null;
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
  onRefresh: () => void;
}

interface KanbanCardProps {
  preOpp: PreOpportunityLandingPage;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

interface DroppableColumnProps {
  stage: PreOppStage;
  preOpps: PreOpportunityLandingPage[];
  onNewClick: (status: PreOpportunityStatus) => void;
  onDelete: (id: string) => void;
}

// ============================================================================
// Draggable Card Component
// ============================================================================

function KanbanCard({ preOpp, onDelete, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: preOpp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <Link href={`/pre-opportunities/${preOpp.id}`} className="flex-1">
            <div className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors">
              {preOpp.entityNumber}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(preOpp.entityDate)}
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(preOpp.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
              title="Delete"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Value */}
        <div className="text-lg font-bold text-blue-600">
          {formatCurrency(preOpp.total)}
        </div>

        {/* Expiration */}
        {preOpp.expDate && (
          <div className="text-xs text-gray-600">
            Exp: {formatDate(preOpp.expDate)}
          </div>
        )}

        {/* Created By */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          By: {preOpp.createdBy}
        </div>

        {/* Drag indicator */}
        <div className="flex items-center justify-center pt-1">
          <DragIndicator />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Card Overlay (shown while dragging)
// ============================================================================

function CardOverlay({ preOpp }: { preOpp: PreOpportunityLandingPage }) {
  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-xl cursor-grabbing w-64">
      <div className="space-y-2">
        <div className="font-semibold text-sm text-gray-900">
          {preOpp.entityNumber}
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(preOpp.entityDate)}
        </div>
        <div className="text-lg font-bold text-blue-600">
          {formatCurrency(preOpp.total)}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Droppable Column Component
// ============================================================================

function DroppableColumn({ stage, preOpps, onNewClick, onDelete }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.name,
  });

  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 font-medium">
            {stage.displayName}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {preOpps.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNewClick(stage.name)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={`Add new ${stage.displayName}`}
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[500px] p-2 rounded-lg transition-colors ${
          isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'bg-gray-50/50'
        }`}
      >
        <SortableContext items={preOpps.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {preOpps.length === 0 ? (
            <div className={`p-4 text-center text-sm text-gray-400 border-2 border-dashed rounded-lg transition-colors ${
              isOver ? 'border-blue-300 bg-blue-100/50' : 'border-gray-200'
            }`}>
              {isOver ? 'Drop here' : `No ${stage.displayName.toLowerCase()} opportunities`}
            </div>
          ) : (
            preOpps.map((preOpp) => (
              <KanbanCard
                key={preOpp.id}
                preOpp={preOpp}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* Add Card Button */}
      <button
        onClick={() => onNewClick(stage.name)}
        className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors mt-2 border-2 border-dashed border-gray-200"
      >
        <PlusIcon />
        New
      </button>
    </div>
  );
}

// ============================================================================
// Main Kanban View Component
// ============================================================================

export function KanbanView({
  preOpps,
  stages,
  activeId,
  setActiveId,
  onRefresh,
}: KanbanViewProps) {
  const updateMutation = useUpdateCRMPreOpportunity();
  const deleteMutation = useDeleteCRMPreOpportunity();
  
  // Modal state for creating new pre-opportunities from column
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialStatus, setCreateModalInitialStatus] = useState<PreOpportunityStatus>('DRAFT');
  
  // Active dragging item
  const [activeDragItem, setActiveDragItem] = useState<PreOpportunityLandingPage | null>(null);

  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const draggedItem = preOpps.find(p => p.id === active.id);
    if (draggedItem) {
      setActiveDragItem(draggedItem);
      setActiveId(active.id as string);
    }
  }, [preOpps, setActiveId]);

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveDragItem(null);
    setActiveId(null);
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find the item being dragged
    const draggedItem = preOpps.find(p => p.id === activeId);
    if (!draggedItem) return;
    
    // Determine the target status
    let targetStatus: PreOpportunityStatus;
    
    // Check if we're dropping on a column (stage name) or on another card
    const isColumn = stages.some(s => s.name === overId);
    
    if (isColumn) {
      targetStatus = overId as PreOpportunityStatus;
    } else {
      // Dropping on another card - find which column that card is in
      const targetCard = preOpps.find(p => p.id === overId);
      if (!targetCard) return;
      targetStatus = targetCard.status;
    }
    
    // Only update if status changed
    if (draggedItem.status !== targetStatus) {
      try {
        // Fetch full pre-opportunity data to get all required fields
        const fullPreOpp = await fetchPreOpportunity(activeId);
        if (!fullPreOpp) {
          throw new Error('Failed to fetch pre-opportunity data');
        }

        // Build the update payload with all required fields
        await updateMutation.mutateAsync({
          id: activeId,
          entityNumber: fullPreOpp.entityNumber,
          entityDate: fullPreOpp.entityDate,
          status: targetStatus,
          soldToCustomerId: fullPreOpp.soldToCustomerId,
          billToCustomerId: fullPreOpp.billToCustomerId,
          soldToCustomerAddressId: fullPreOpp.soldToCustomerAddressId,
          billToCustomerAddressId: fullPreOpp.billToCustomerAddressId,
          jobId: fullPreOpp.jobId,
          expDate: fullPreOpp.expDate,
          acceptDate: fullPreOpp.acceptDate,
          reviseDate: fullPreOpp.reviseDate,
          customerRef: fullPreOpp.customerRef,
          paymentTerms: fullPreOpp.paymentTerms,
          freightTerms: fullPreOpp.freightTerms,
          details: fullPreOpp.details?.map(d => ({
            id: d.id,
            itemNumber: d.itemNumber,
            productId: d.productId,
            productCpnId: d.productCpnId,
            quantity: d.quantity,
            unitPrice: d.unitPrice,
            discountRate: d.discountRate,
            leadTime: d.leadTime,
            endUserId: d.endUserId,
          })) || [],
        });
        preOpportunityToasts.statusChanged(draggedItem.entityNumber, getStatusLabel(targetStatus));
        onRefresh();
      } catch (error) {
        console.error('Failed to update status:', error);
        preOpportunityToasts.updateError(error instanceof Error ? error.message : 'Failed to update status');
      }
    }
  }, [preOpps, stages, updateMutation, onRefresh, setActiveId]);

  // Handle delete
  const handleDelete = async (preOppId: string) => {
    const preOpp = preOpps.find(p => p.id === preOppId);
    if (!confirm('Are you sure you want to delete this pre-opportunity?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(preOppId);
      preOpportunityToasts.deleteSuccess(preOpp?.entityNumber || 'Pre-Opportunity');
      onRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
      preOpportunityToasts.deleteError(error instanceof Error ? error.message : 'Failed to delete pre-opportunity');
    }
  };

  // Handle new click
  const handleNewClick = (status: PreOpportunityStatus) => {
    setCreateModalInitialStatus(status);
    setIsCreateModalOpen(true);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-5 gap-4">
          {stages.map((stage) => {
            const stagePreOpps = getPreOppsByStatus(preOpps, stage.name);

            return (
              <DroppableColumn
                key={stage.name}
                stage={stage}
                preOpps={stagePreOpps}
                onNewClick={handleNewClick}
                onDelete={handleDelete}
              />
            );
          })}
        </div>

        {/* Drag Overlay - the floating card while dragging */}
        <DragOverlay dropAnimation={null}>
          {activeDragItem ? (
            <CardOverlay preOpp={activeDragItem} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreatePreOpportunityModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            onRefresh();
          }}
          initialStatus={createModalInitialStatus}
        />
      )}
    </>
  );
}
