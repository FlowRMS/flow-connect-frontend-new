'use client';

import React, { useState, useRef, useCallback } from 'react';
import type { WarehouseLayoutModalProps, ViewMode, AvailableProduct } from './types';
import { useLocationManagement, useCanvasInteractions, useVisualElements } from './hooks';
import { LocationTreeView } from './tree-view';
import { VisualWarehouseBuilder } from './visual-builder';
import { ModalHeader, ModalFooter } from './shared';
import { filterLocations, findLocationById } from './utils';
import { mockInventory } from '@/lib/data/warehouse-mock';

export default function WarehouseLayoutModal({
  isOpen,
  onClose,
  locationLevels,
  onSave,
  warehouseName,
  warehouseId = 'WH-001',
}: WarehouseLayoutModalProps) {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [draggedItem, setDraggedItem] = useState<any>(null);

  // Canvas ref
  const canvasRef = useRef<HTMLDivElement>(null);

  // Get enabled levels
  const enabledLevels = locationLevels.filter((l) => l.enabled).map((l) => l.level);

  // Initialize hooks
  const locationManagement = useLocationManagement({ warehouseId, enabledLevels });
  const canvasInteractions = useCanvasInteractions();
  const visualElements = useVisualElements({
    locations: locationManagement.locations,
    setLocations: locationManagement.setLocations,
  });

  // Filter locations for search
  const filteredLocations = locationManagement.searchQuery
    ? filterLocations(locationManagement.locations, locationManagement.searchQuery)
    : locationManagement.locations;

  // Available products for assignment
  const availableProducts: AvailableProduct[] = mockInventory.map((inv) => ({
    id: inv.productId,
    name: inv.productName,
    partNumber: inv.partNumber,
    factoryName: inv.factoryName,
  }));

  // Filter products
  const filteredProducts = locationManagement.productSearchQuery
    ? availableProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(locationManagement.productSearchQuery.toLowerCase()) ||
          p.partNumber.toLowerCase().includes(locationManagement.productSearchQuery.toLowerCase()) ||
          p.factoryName?.toLowerCase().includes(locationManagement.productSearchQuery.toLowerCase())
      )
    : availableProducts;

  // Drag handlers for tree view
  const handleDragStart = useCallback(
    (event: any) => {
      const item = findLocationById(locationManagement.locations, event.active.id as string);
      setDraggedItem(item || null);
    },
    [locationManagement.locations]
  );

  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;
      setDraggedItem(null);
      if (!over || active.id === over.id) return;

      const activeItem = findLocationById(locationManagement.locations, active.id as string);
      const overItem = findLocationById(locationManagement.locations, over.id as string);
      if (
        !activeItem ||
        !overItem ||
        activeItem.type !== overItem.type ||
        activeItem.parentId !== overItem.parentId
      )
        return;

      // Reorder logic
      locationManagement.setLocations((prev) => {
        const reorder = (items: any[]): any[] => {
          const activeIndex = items.findIndex((i) => i.id === active.id);
          const overIndex = items.findIndex((i) => i.id === over.id);
          if (activeIndex !== -1 && overIndex !== -1) {
            const newItems = [...items];
            const [removed] = newItems.splice(activeIndex, 1);
            newItems.splice(overIndex, 0, removed);
            return newItems;
          }
          return items.map((item) => ({ ...item, children: item.children ? reorder(item.children) : undefined }));
        };
        return reorder(prev);
      });
    },
    [locationManagement]
  );

  // Save handler
  const handleSave = useCallback(() => {
    onSave(locationLevels);
    onClose();
  }, [locationLevels, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] w-full h-full overflow-hidden flex flex-col">
        {/* Header */}
        <ModalHeader
          warehouseName={warehouseName}
          viewMode={viewMode}
          locations={locationManagement.locations}
          onViewModeChange={setViewMode}
          onClose={onClose}
        />

        {/* Tree View */}
        {viewMode === 'tree' && (
          <LocationTreeView
            locations={filteredLocations}
            draggedItem={draggedItem}
            expandedNodes={locationManagement.expandedNodes}
            editingId={locationManagement.editingId}
            searchQuery={locationManagement.searchQuery}
            showProductSearch={locationManagement.showProductSearch}
            productSearchQuery={locationManagement.productSearchQuery}
            filteredProducts={filteredProducts}
            enabledLevels={enabledLevels}
            onToggle={locationManagement.toggleNode}
            onStartEdit={locationManagement.setEditingId}
            onRename={locationManagement.renameLocation}
            onDelete={locationManagement.deleteLocation}
            onAddChild={locationManagement.addChildLocation}
            onAddSection={locationManagement.addSection}
            isBottomLevel={locationManagement.isBottomLevel}
            getNextLevelType={locationManagement.getNextLevelType}
            onShowProductSearch={locationManagement.setShowProductSearch}
            onProductSearchChange={locationManagement.setProductSearchQuery}
            onAddProduct={locationManagement.addProduct}
            onRemoveProduct={locationManagement.removeProduct}
            onSearchQueryChange={locationManagement.setSearchQuery}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        )}

        {/* Visual Builder */}
        {viewMode === 'visual' && (
          <VisualWarehouseBuilder
            elements={visualElements.visualElements}
            locations={locationManagement.locations}
            selectedElementId={canvasInteractions.selectedElementId}
            zoom={canvasInteractions.zoom}
            panOffset={canvasInteractions.panOffset}
            warehouseDimensions={visualElements.warehouseDimensions}
            canvasRef={canvasRef}
            onWarehouseDimensionsChange={(w, h) => visualElements.setWarehouseDimensions({ width: w, height: h })}
            onElementSelect={canvasInteractions.handleElementSelect}
            onElementMove={visualElements.handleElementMove}
            onElementResize={visualElements.handleElementResize}
            onAddChild={locationManagement.addChildLocation}
            onAddSectionAtPosition={locationManagement.addSectionAtPosition}
            onAddSection={locationManagement.addSection}
            onDelete={locationManagement.deleteLocation}
            onSave={handleSave}
            onClose={onClose}
            onWheel={canvasInteractions.handleCanvasWheel}
            onMouseDown={canvasInteractions.handleCanvasMouseDown}
            onMouseMove={canvasInteractions.handleCanvasMouseMove}
            onMouseUp={canvasInteractions.handleCanvasMouseUp}
            onZoomChange={canvasInteractions.setZoom}
            onResetView={canvasInteractions.handleResetView}
            onRename={locationManagement.renameLocation}
            getNextLevelType={locationManagement.getNextLevelType}
            handleZoomIn={canvasInteractions.handleZoomIn}
            handleZoomOut={canvasInteractions.handleZoomOut}
            enabledLevels={enabledLevels}
          />
        )}

        {/* Footer - only for tree view */}
        {viewMode === 'tree' && <ModalFooter onSave={handleSave} onCancel={onClose} />}
      </div>
    </div>
  );
}
