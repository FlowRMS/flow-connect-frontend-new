/**
 * Kanban View for Pre-Opportunities
 * Enhanced with Jobs-style drag-drop, visual feedback, and column styling
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
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
import { useUpdateCRMPreOpportunity, useDeleteCRMPreOpportunity, crmQueryKeys } from '../../hooks/useCRMApi';
import { fetchPreOpportunity } from '../../lib/crm-graphql';
import type { PreOpportunityLandingPage as APIPreOppLandingPage } from '../../lib/crm-graphql';
import { CreatePreOpportunityModal } from '../modals/CreatePreOpportunityModal';
import { preOpportunityToasts } from '../../lib/toast';

// Column status indicator colors (dots) - matching Jobs style
const COLUMN_STATUS_COLORS: Record<PreOpportunityStatus, string> = {
  'QUALIFIED': 'bg-blue-500',
  'NEGOTIATION': 'bg-purple-500',
  'FOLLOW_UP': 'bg-yellow-500',
  'WAITING_ON_FACTORY': 'bg-orange-500',
  'LOST': 'bg-red-500',
  'WON': 'bg-green-500',
};

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

// ============================================================================
// Draggable Card Component - Jobs Style
// ============================================================================

function KanbanCard({ preOpp, onDelete }: { preOpp: PreOpportunityLandingPage; onDelete: (id: string) => void }) {
  const router = useRouter();
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const wasDragged = useRef(false);
  
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

  const statusColor = COLUMN_STATUS_COLORS[preOpp.status] || 'bg-gray-400';

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(preOpp.id);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    wasDragged.current = false;
    // Call the original listener
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartPos.current) {
      const dx = Math.abs(e.clientX - dragStartPos.current.x);
      const dy = Math.abs(e.clientY - dragStartPos.current.y);
      // If moved more than 5px, consider it a drag
      if (dx > 5 || dy > 5) {
        wasDragged.current = true;
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only navigate if we didn't drag
    if (!wasDragged.current && !isDragging) {
      e.preventDefault();
      router.push(`/pre-opportunities/${preOpp.id}`);
    }
    dragStartPos.current = null;
    wasDragged.current = false;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      className={`
        group bg-white border rounded-lg p-2.5 md:p-4 mb-2 md:mb-3
        transition-all duration-200 cursor-pointer relative
        ${isDragging
          ? 'opacity-60 shadow-lg scale-[1.02] rotate-1 border-blue-300'
          : 'hover:shadow-md hover:border-gray-300 border-gray-200'
        }
      `}
    >
      {/* Header Row */}
      <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs md:text-sm font-semibold text-gray-900 leading-tight truncate hover:text-blue-600 transition-colors">
            {preOpp.entityNumber}
          </h4>
          <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">
            {formatDate(preOpp.entityDate)}
          </p>
        </div>
        <button
          onClick={handleDeleteClick}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 md:p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-all flex-shrink-0"
          title="Delete"
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-[14px] md:h-[14px]">
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Value - Highlighted */}
      <div className="text-sm md:text-lg font-bold text-blue-600 mb-2 md:mb-3">
        {formatCurrency(preOpp.total)}
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-2 md:mb-3">
        <span className="inline-flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium bg-gray-100">
          <span className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${statusColor}`}></span>
          <span className="truncate">{getStatusLabel(preOpp.status)}</span>
        </span>
      </div>

      {/* Expiration Date */}
      {preOpp.expDate && (
        <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 pt-2 md:pt-3 border-t border-gray-100 text-[10px] md:text-xs text-gray-500">
          <svg className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="truncate">Exp: {formatDate(preOpp.expDate)}</span>
        </div>
      )}

      {/* Created By */}
      <div className="flex items-center gap-1.5 md:gap-2 pt-2 border-t border-gray-100">
        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] md:text-xs font-semibold shadow-sm flex-shrink-0">
          {preOpp.createdBy?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <span className="text-[10px] md:text-xs text-gray-500 truncate">{preOpp.createdBy}</span>
      </div>

      {/* Drag Handle Indicator - visible on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none hidden md:block">
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// Card Overlay (shown while dragging)
// ============================================================================

function CardOverlay({ preOpp }: { preOpp: PreOpportunityLandingPage }) {
  const statusColor = COLUMN_STATUS_COLORS[preOpp.status] || 'bg-gray-400';
  
  return (
    <div className="bg-white border-2 border-blue-300 rounded-lg p-4 shadow-xl cursor-grabbing w-64 opacity-90">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 leading-tight truncate">
            {preOpp.entityNumber}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(preOpp.entityDate)}
          </p>
        </div>
      </div>
      <div className="text-lg font-bold text-blue-600 mb-2">
        {formatCurrency(preOpp.total)}
      </div>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100">
        <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
        {getStatusLabel(preOpp.status)}
      </span>
    </div>
  );
}

// ============================================================================
// Droppable Column Component - Jobs Style
// ============================================================================

function DroppableColumn({ 
  stage, 
  preOpps, 
  onNewClick, 
  onDelete,
  isOver 
}: { 
  stage: PreOppStage;
  preOpps: PreOpportunityLandingPage[];
  onNewClick: (status: PreOpportunityStatus) => void;
  onDelete: (id: string) => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: stage.name,
  });

  const statusColor = COLUMN_STATUS_COLORS[stage.name] || 'bg-gray-400';

  return (
    <div className="flex flex-col min-w-[140px] sm:min-w-0">
      {/* Column Header - Minimal like Jobs */}
      <div className="flex items-center justify-between px-1.5 md:px-2 py-1.5 md:py-2 mb-2">
        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`}></span>
          <span className="text-xs md:text-sm text-gray-700 font-medium truncate">
            {stage.displayName}
          </span>
          <span className="text-[10px] md:text-xs text-gray-400 font-medium flex-shrink-0">
            {preOpps.length}
          </span>
        </div>
        <button
          onClick={() => onNewClick(stage.name)}
          className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0"
          title={`Add pre-opportunity to ${stage.displayName}`}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Drop Zone */}
      <SortableContext items={preOpps.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`
            min-h-[250px] md:min-h-[400px] rounded-lg p-1.5 md:p-2 transition-all duration-200
            ${isOver
              ? 'bg-blue-50 ring-2 ring-blue-300 ring-opacity-50'
              : 'bg-gray-50/50'
            }
          `}
        >
          {preOpps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-xs">No pre-opportunities</span>
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
        </div>
      </SortableContext>

      {/* Add Card Button - Minimal */}
      <button 
        onClick={() => onNewClick(stage.name)}
        className="flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 
                 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors mt-1"
      >
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
        </svg>
        Add
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
  const queryClient = useQueryClient();
  const updateMutation = useUpdateCRMPreOpportunity();
  const deleteMutation = useDeleteCRMPreOpportunity();
  
  // Modal state for creating new pre-opportunities from column
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialStatus, setCreateModalInitialStatus] = useState<PreOpportunityStatus>('QUALIFIED');
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [preOppToDelete, setPreOppToDelete] = useState<{ id: string; entityNumber: string } | null>(null);
  
  // Active dragging item and over state
  const [activeDragItem, setActiveDragItem] = useState<PreOpportunityLandingPage | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

  // Handle drag over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId(event.over?.id as string || null);
  }, []);

  const applyOptimisticStatusUpdate = useCallback((preOppId: string, targetStatus: PreOpportunityStatus) => {
    // Get all matching query caches (both regular and infinite)
    const queryCache = queryClient.getQueryCache();
    const matchingQueries = queryCache.findAll({
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key.includes('preOpportunityLandingPages');
      },
    });

    // Snapshot all matching caches for potential rollback
    const previousData: Record<string, unknown> = {};
    matchingQueries.forEach((query) => {
      previousData[JSON.stringify(query.queryKey)] = query.state.data;
    });

    // Helper function to update pre-opp status
    const updatePreOppStatus = (preOpp: APIPreOppLandingPage) => {
      if (preOpp.id === preOppId) {
        return { ...preOpp, status: targetStatus as APIPreOppLandingPage['status'] };
      }
      return preOpp;
    };

    // Optimistically update all matching caches
    matchingQueries.forEach((query) => {
      const data = query.state.data;

      // Handle infinite query structure (has pages array)
      if (data && typeof data === 'object' && 'pages' in data) {
        const infiniteData = data as { pages: Array<{ records: APIPreOppLandingPage[]; total: number }>; pageParams: unknown[] };
        queryClient.setQueryData(query.queryKey, {
          ...infiniteData,
          pages: infiniteData.pages.map(page => ({
            ...page,
            records: page.records.map(updatePreOppStatus),
          })),
        });
      }
      // Handle regular array structure
      else if (Array.isArray(data)) {
        queryClient.setQueryData(
          query.queryKey,
          (data as APIPreOppLandingPage[]).map(updatePreOppStatus)
        );
      }
    });

    return previousData;
  }, [queryClient]);

  const getTargetStatus = useCallback((overIdValue: string) => {
    if (stages.some(s => s.name === overIdValue)) {
      return overIdValue as PreOpportunityStatus;
    }
    const targetCard = preOpps.find(p => p.id === overIdValue);
    return targetCard?.status ?? null;
  }, [preOpps, stages]);

  const persistStatusChange = useCallback(async (
    preOppId: string,
    targetStatus: PreOpportunityStatus,
    previousData: Record<string, unknown>,
    entityNumber?: string
  ) => {
    try {
      const fullPreOpp = await fetchPreOpportunity(preOppId);
      if (!fullPreOpp) {
        throw new Error('Failed to fetch pre-opportunity data');
      }

      await updateMutation.mutateAsync({
        id: preOppId,
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
        optimisticStatus: targetStatus,
      });

      if (entityNumber) {
        preOpportunityToasts.statusChanged(entityNumber, getStatusLabel(targetStatus));
      }
    } catch (error) {
      // Rollback all caches on error
      Object.entries(previousData).forEach(([keyStr, data]) => {
        const queryKey = JSON.parse(keyStr);
        queryClient.setQueryData(queryKey, data);
      });
      console.error('Failed to update status:', error);
      preOpportunityToasts.updateError(error instanceof Error ? error.message : 'Failed to update status');
    }
  }, [queryClient, updateMutation]);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveDragItem(null);
    setActiveId(null);
    setOverId(null);
    
    if (!over) return;

    const activePreOppId = String(active.id);
    const draggedItem = preOpps.find(p => p.id === activePreOppId);
    if (!draggedItem) return;

    const targetStatus = getTargetStatus(String(over.id));
    if (!targetStatus || draggedItem.status === targetStatus) return;

    const previousPreOpps = applyOptimisticStatusUpdate(activePreOppId, targetStatus);
    void persistStatusChange(activePreOppId, targetStatus, previousPreOpps, draggedItem.entityNumber);
  }, [applyOptimisticStatusUpdate, getTargetStatus, persistStatusChange, preOpps]);

  // Handle delete
  const handleDelete = (preOppId: string) => {
    const preOpp = preOpps.find(p => p.id === preOppId);
    if (preOpp) {
      setPreOppToDelete({ id: preOppId, entityNumber: preOpp.entityNumber });
      setShowDeleteModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!preOppToDelete) return;

    try {
      await deleteMutation.mutateAsync(preOppToDelete.id);
      preOpportunityToasts.deleteSuccess(preOppToDelete.entityNumber);
      setShowDeleteModal(false);
      setPreOppToDelete(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
      preOpportunityToasts.deleteError(error instanceof Error ? error.message : 'Failed to delete pre-opportunity');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPreOppToDelete(null);
  };

  // Handle new click
  const handleNewClick = (status: PreOpportunityStatus) => {
    setCreateModalInitialStatus(status);
    setIsCreateModalOpen(true);
  };

  // Custom collision detection that prioritizes droppable columns
  const customCollisionDetection = (args: Parameters<typeof pointerWithin>[0]) => {
    // First check for pointer collisions
    const pointerCollisions = pointerWithin(args);
    
    // If we have collisions, prioritize stage columns
    if (pointerCollisions.length > 0) {
      const columnCollision = pointerCollisions.find(c => 
        ['QUALIFIED', 'NEGOTIATION', 'FOLLOW_UP', 'WAITING_ON_FACTORY', 'LOST', 'WON'].includes(String(c.id))
      );
      if (columnCollision) {
        return [columnCollision];
      }
    }
    
    // Fall back to rect intersection for edge cases
    return rectIntersection(args);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 min-w-[600px] lg:min-w-0">
          {stages.map((stage) => {
            const stagePreOpps = getPreOppsByStatus(preOpps, stage.name);
            const isOverColumn = overId === stage.name;

            return (
              <DroppableColumn
                key={stage.name}
                stage={stage}
                preOpps={stagePreOpps}
                onNewClick={handleNewClick}
                onDelete={handleDelete}
                isOver={isOverColumn}
              />
            );
          })}
          </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && preOppToDelete && (
        <DeleteConfirmModal
          entityNumber={preOppToDelete.entityNumber}
          isPending={deleteMutation.isPending}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </>
  );
}
