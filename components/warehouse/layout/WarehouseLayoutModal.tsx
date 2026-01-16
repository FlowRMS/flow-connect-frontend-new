'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { WarehouseLayoutModalProps, ViewMode, AvailableProduct } from './types';
import { useLocationManagement, useCanvasInteractions, useVisualElements } from './hooks';
import { LocationTreeView } from './tree-view';
import { VisualWarehouseBuilder } from './visual-builder';
import { ModalHeader, ModalFooter } from './shared';
import { filterLocations, findLocationById } from './utils';
import { searchProducts } from '@/components/lib/graphql/pre-opportunities';

export default function WarehouseLayoutModal({
  isOpen,
  onClose,
  locationLevels,
  onSave,
  warehouseName,
  warehouseId,
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

  // Product search state
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  // Fetch products when search query changes (with debounce)
  useEffect(() => {
    const query = locationManagement.productSearchQuery?.trim();
    if (!query || query.length < 1) {
      setAvailableProducts([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingProducts(true);
      try {
        const results = await searchProducts(query);
        const mapped: AvailableProduct[] = results.map((p) => ({
          id: p.id,
          name: p.factoryPartNumber,
          partNumber: p.factoryPartNumber,
          factoryName: p.description || undefined,
        }));
        setAvailableProducts(mapped);
      } catch (error) {
        console.error('Failed to search products:', error);
        setAvailableProducts([]);
      } finally {
        setIsSearchingProducts(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [locationManagement.productSearchQuery]);

  // Products are already filtered by backend search, no need for client-side filtering
  const filteredProducts = availableProducts;

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

  // Save handler - saves locations to backend
  const handleSave = useCallback(async () => {
    try {
      await locationManagement.saveLocations();
      onSave(locationLevels);
      onClose();
    } catch (error) {
      console.error('Failed to save locations:', error);
      // TODO: Show error toast
    }
  }, [locationManagement, locationLevels, onSave, onClose]);

  if (!isOpen) return null;

  // Show loading state
  if (locationManagement.isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[var(--card)] rounded-lg p-8 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
          <p className="text-[var(--muted-foreground)]">Loading warehouse locations...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (locationManagement.error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[var(--card)] rounded-lg p-8 flex flex-col items-center gap-4 max-w-md">
          <div className="text-red-500 text-lg font-medium">Failed to load locations</div>
          <p className="text-[var(--muted-foreground)] text-center">
            {locationManagement.error.message}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--muted)] rounded-md hover:bg-[var(--muted)]/80"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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
            isSearchingProducts={isSearchingProducts}
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
            isSaving={locationManagement.isSaving}
            onWheel={canvasInteractions.handleCanvasWheel}
            onMouseDown={canvasInteractions.handleCanvasMouseDown}
            onMouseMove={canvasInteractions.handleCanvasMouseMove}
            onMouseUp={canvasInteractions.handleCanvasMouseUp}
            onContextMenu={canvasInteractions.handleContextMenu}
            isPanning={canvasInteractions.isPanning}
            isSpacePressed={canvasInteractions.isSpacePressed}
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
        {viewMode === 'tree' && (
          <ModalFooter
            onSave={handleSave}
            onCancel={onClose}
            isSaving={locationManagement.isSaving}
            hasUnsavedChanges={locationManagement.hasUnsavedChanges}
          />
        )}
      </div>
    </div>
  );
}
