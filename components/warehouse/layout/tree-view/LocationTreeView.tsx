'use client';

import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { WarehouseLocation, WarehouseLocationLevel, AvailableProduct } from '../types';
import { LevelIcons, levelColors, levelLabels } from '../constants';
import LocationNode from './LocationNode';

interface LocationTreeViewProps {
  locations: WarehouseLocation[];
  draggedItem: WarehouseLocation | null;
  expandedNodes: Set<string>;
  editingId: string | null;
  searchQuery: string;
  showProductSearch: string | null;
  productSearchQuery: string;
  filteredProducts: AvailableProduct[];
  isSearchingProducts?: boolean;
  enabledLevels: WarehouseLocationLevel[];
  onToggle: (id: string) => void;
  onStartEdit: (id: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string, parentType: string) => void;
  onAddSection: () => void;
  onBulkAdd: () => void;
  isBottomLevel: (type: string) => boolean;
  getNextLevelType: (type: string) => WarehouseLocationLevel | null;
  onShowProductSearch: (binId: string | null) => void;
  onProductSearchChange: (query: string) => void;
  onAddProduct: (binId: string, product: AvailableProduct) => void;
  onRemoveProduct: (binId: string, productAssignmentId: string, productId: string) => void;
  onSearchQueryChange: (query: string) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export default function LocationTreeView({
  locations,
  draggedItem,
  expandedNodes,
  editingId,
  searchQuery,
  showProductSearch,
  productSearchQuery,
  filteredProducts,
  isSearchingProducts = false,
  enabledLevels,
  onToggle,
  onStartEdit,
  onRename,
  onDelete,
  onAddChild,
  onAddSection,
  onBulkAdd,
  isBottomLevel,
  getNextLevelType,
  onShowProductSearch,
  onProductSearchChange,
  onAddProduct,
  onRemoveProduct,
  onSearchQueryChange,
  onDragStart,
  onDragEnd,
}: LocationTreeViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <>
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-[var(--border)] flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Add Section Button */}
        {enabledLevels.includes('section') && (
          <button
            onClick={onAddSection}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Section
          </button>
        )}

        {/* Bulk Add Button */}
        {enabledLevels.includes('section') && (
          <button
            onClick={onBulkAdd}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Bulk Add
          </button>
        )}
      </div>

      {/* Tree Content */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-y-auto p-2">
          {locations.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-[var(--muted)] rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">No locations yet. Click "+ Section" to start.</p>
            </div>
          ) : (
            // Location Tree
            <SortableContext items={locations.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              {locations.map((location) => (
                <LocationNode
                  key={location.id}
                  location={location}
                  depth={0}
                  expandedNodes={expandedNodes}
                  editingId={editingId}
                  showProductSearch={showProductSearch}
                  productSearchQuery={productSearchQuery}
                  filteredProducts={filteredProducts}
                  isSearchingProducts={isSearchingProducts}
                  onToggle={onToggle}
                  onStartEdit={onStartEdit}
                  onRename={onRename}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                  isBottomLevel={isBottomLevel}
                  getNextLevelType={getNextLevelType}
                  onShowProductSearch={onShowProductSearch}
                  onProductSearchChange={onProductSearchChange}
                  onAddProduct={onAddProduct}
                  onRemoveProduct={onRemoveProduct}
                />
              ))}
            </SortableContext>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedItem && (
            <div
              className={`px-3 py-1.5 rounded-lg border ${levelColors[draggedItem.type].bg} ${levelColors[draggedItem.type].border} shadow-lg`}
            >
              <div className="flex items-center gap-2">
                <span className={levelColors[draggedItem.type].text}>{LevelIcons[draggedItem.type]}</span>
                <span className="text-xs font-medium">{draggedItem.name}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Footer - Level Legend */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] bg-[var(--card)] flex-shrink-0">
        <div className="flex items-center gap-1">
          {enabledLevels.map((level) => (
            <span
              key={level}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${levelColors[level]?.bg} ${levelColors[level]?.text}`}
            >
              {levelLabels[level]}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
