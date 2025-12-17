'use client';

import React, { useState, useCallback } from 'react';
import type { VisualElement, WarehouseLocation, WarehouseDimensions, WarehouseLocationLevel } from '../types';
import CanvasView from './CanvasView';
import LibraryToolbar from './LibraryToolbar';
import PropertiesPanel from './PropertiesPanel';
import HierarchyTreeView from './HierarchyTreeView';
import MiniMap from './MiniMap';
import { findVisualElementById, getPathToElement } from '../utils';
import { feetToPixels, PIXELS_PER_FOOT } from './canvas-utils';

interface VisualWarehouseBuilderProps {
  elements: VisualElement[];
  locations: WarehouseLocation[];
  selectedElementId: string | null;
  zoom: number;
  panOffset: { x: number; y: number };
  warehouseDimensions: WarehouseDimensions;
  canvasRef: React.RefObject<HTMLDivElement>;
  onWarehouseDimensionsChange: (width: number, height: number) => void;
  onElementSelect: (id: string | null) => void;
  onElementMove: (id: string, x: number, y: number) => void;
  onElementResize: (id: string, width: number, height: number) => void;
  onAddChild: (parentId: string, parentType: string) => void;
  onAddSectionAtPosition: (x: number, y: number) => string;
  onDelete: (id: string) => void;
  onWheel: (e: React.WheelEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onZoomChange: (zoom: number) => void;
  onResetView: () => void;
  onRename: (id: string, name: string) => void;
  getNextLevelType: (type: string) => WarehouseLocationLevel | null;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
}

export default function VisualWarehouseBuilder({
  elements,
  locations,
  selectedElementId,
  zoom,
  panOffset,
  warehouseDimensions,
  canvasRef,
  onWarehouseDimensionsChange,
  onElementSelect,
  onElementMove,
  onElementResize,
  onAddChild,
  onAddSectionAtPosition,
  onDelete,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onResetView,
  onRename,
  getNextLevelType,
  handleZoomIn,
  handleZoomOut,
}: VisualWarehouseBuilderProps) {
  const [draggingElement, setDraggingElement] = useState<{
    id: string;
    startX: number;
    startY: number;
    elementX: number;
    elementY: number;
    parentId?: string;
  } | null>(null);
  const [resizingElement, setResizingElement] = useState<{
    id: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    handle: string;
  } | null>(null);
  const [resizingWarehouse, setResizingWarehouse] = useState<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    handle: string;
  } | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [draggingFromLibrary, setDraggingFromLibrary] = useState<{ type: string; id?: string } | null>(null);

  const selectedElement = selectedElementId ? findVisualElementById(elements, selectedElementId) : null;
  const pathToSelected = selectedElementId ? getPathToElement(locations, selectedElementId) : [];

  const handleElementMouseDown = useCallback((e: React.MouseEvent, element: VisualElement, parentId?: string) => {
    e.stopPropagation();
    onElementSelect(element.id);
    setDraggingElement({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      elementX: element.x,
      elementY: element.y,
      parentId,
    });
  }, [onElementSelect]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, element: VisualElement, handle: string) => {
    e.stopPropagation();
    setResizingElement({
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width,
      startHeight: element.height,
      handle,
    });
  }, []);

  const handleWarehouseResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setResizingWarehouse({
      startX: e.clientX,
      startY: e.clientY,
      startWidth: warehouseDimensions.width,
      startHeight: warehouseDimensions.height,
      handle,
    });
  }, [warehouseDimensions]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingElement) {
      const dx = (e.clientX - draggingElement.startX) / zoom;
      const dy = (e.clientY - draggingElement.startY) / zoom;

      let maxX = feetToPixels(warehouseDimensions.width) - 20;
      let maxY = feetToPixels(warehouseDimensions.height) - 20;

      if (draggingElement.parentId) {
        const parent = findVisualElementById(elements, draggingElement.parentId);
        if (parent) {
          const draggedEl = findVisualElementById(elements, draggingElement.id);
          maxX = parent.width - (draggedEl?.width || 50) - 5;
          maxY = parent.height - (draggedEl?.height || 30) - 25;
        }
      }

      const newX = Math.max(0, Math.min(maxX, draggingElement.elementX + dx));
      const newY = Math.max(0, Math.min(maxY, draggingElement.elementY + dy));
      onElementMove(draggingElement.id, newX, newY);
    } else if (resizingElement) {
      const dx = (e.clientX - resizingElement.startX) / zoom;
      const dy = (e.clientY - resizingElement.startY) / zoom;
      let newWidth = resizingElement.startWidth;
      let newHeight = resizingElement.startHeight;

      if (resizingElement.handle.includes('e')) newWidth = resizingElement.startWidth + dx;
      if (resizingElement.handle.includes('w')) newWidth = resizingElement.startWidth - dx;
      if (resizingElement.handle.includes('s')) newHeight = resizingElement.startHeight + dy;
      if (resizingElement.handle.includes('n')) newHeight = resizingElement.startHeight - dy;

      onElementResize(resizingElement.id, Math.max(30, newWidth), Math.max(30, newHeight));
    } else if (resizingWarehouse) {
      const dx = (e.clientX - resizingWarehouse.startX) / zoom / PIXELS_PER_FOOT;
      const dy = (e.clientY - resizingWarehouse.startY) / zoom / PIXELS_PER_FOOT;
      let newWidth = resizingWarehouse.startWidth;
      let newHeight = resizingWarehouse.startHeight;

      if (resizingWarehouse.handle.includes('e')) newWidth = resizingWarehouse.startWidth + dx;
      if (resizingWarehouse.handle.includes('s')) newHeight = resizingWarehouse.startHeight + dy;

      onWarehouseDimensionsChange(Math.max(50, Math.round(newWidth)), Math.max(50, Math.round(newHeight)));
    } else {
      onMouseMove(e);
    }
  }, [draggingElement, resizingElement, resizingWarehouse, zoom, warehouseDimensions, elements, onElementMove, onElementResize, onWarehouseDimensionsChange, onMouseMove]);

  const handleCanvasMouseUp = useCallback(() => {
    setDraggingElement(null);
    setResizingElement(null);
    setResizingWarehouse(null);
    onMouseUp();
  }, [onMouseUp]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-grid')) {
      onElementSelect(null);
      setEditingName(null);
    }
  }, [onElementSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (draggingFromLibrary) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, [draggingFromLibrary]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (draggingFromLibrary && canvasRef.current) {
      e.preventDefault();

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - canvasRect.left - panOffset.x) / zoom;
      const rawY = (e.clientY - canvasRect.top - panOffset.y) / zoom;

      const dropX = Math.max(0, Math.min(feetToPixels(warehouseDimensions.width) - 300, rawX - 50));
      const dropY = Math.max(0, Math.min(feetToPixels(warehouseDimensions.height) - 200, rawY - 50));

      if (draggingFromLibrary.id) {
        onElementMove(draggingFromLibrary.id, dropX, dropY);
        onElementSelect(draggingFromLibrary.id);
      } else if (draggingFromLibrary.type === 'section') {
        const newId = onAddSectionAtPosition(dropX, dropY);
        onElementSelect(newId);
      }

      setDraggingFromLibrary(null);
    }
  }, [draggingFromLibrary, canvasRef, panOffset, zoom, warehouseDimensions, onElementMove, onElementSelect, onAddSectionAtPosition]);

  const handleElementUpdate = useCallback((id: string, updates: Partial<VisualElement>) => {
    if (updates.x !== undefined && updates.y !== undefined) {
      onElementMove(id, updates.x, updates.y);
    }
    if (updates.width !== undefined && updates.height !== undefined) {
      onElementResize(id, updates.width, updates.height);
    }
    if (updates.name !== undefined) {
      onRename(id, updates.name);
    }
  }, [onElementMove, onElementResize, onRename]);

  return (
    <>
      <CanvasView
        canvasRef={canvasRef}
        elements={elements}
        warehouseDimensions={warehouseDimensions}
        zoom={zoom}
        panOffset={panOffset}
        selectedElementId={selectedElementId}
        editingName={editingName}
        draggingFromLibrary={draggingFromLibrary}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onCanvasClick={handleCanvasClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onElementSelect={onElementSelect}
        onElementDragStart={handleElementMouseDown}
        onElementResizeStart={handleResizeMouseDown}
        onWarehouseResizeStart={handleWarehouseResizeMouseDown}
        onRename={onRename}
        onStartEdit={setEditingName}
        onAddChild={onAddChild}
        getNextLevelType={getNextLevelType}
      />

      <LibraryToolbar
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={onResetView}
        onDragStart={(type) => setDraggingFromLibrary({ type })}
      />

      <HierarchyTreeView
        locations={locations}
        selectedElementId={selectedElementId}
        pathToSelected={pathToSelected}
        onElementSelect={onElementSelect}
      />

      {selectedElement && (
        <PropertiesPanel
          selectedElement={selectedElement}
          onUpdate={handleElementUpdate}
          onDelete={onDelete}
          onClose={() => onElementSelect(null)}
        />
      )}

      <MiniMap
        elements={elements}
        warehouseDimensions={warehouseDimensions}
        zoom={zoom}
        panOffset={panOffset}
        viewportWidth={canvasRef.current?.clientWidth || 800}
        viewportHeight={canvasRef.current?.clientHeight || 600}
        onViewportClick={(x, y) => {
          // Center viewport on clicked position
          onMouseDown({ clientX: x, clientY: y } as React.MouseEvent);
        }}
      />
    </>
  );
}
