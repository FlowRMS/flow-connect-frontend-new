'use client';

import React, { useState, useCallback } from 'react';
import type { VisualElement, WarehouseLocation, WarehouseDimensions, WarehouseLocationLevel } from '../types';
import CanvasView from './CanvasView';
import { findVisualElementById, getPathToElement, findLocationById } from '../utils';
import { feetToPixels, pixelsToFeet, PIXELS_PER_FOOT } from './canvas-utils';
import { LevelIcons, levelColors, levelLabels } from '../constants';

interface VisualWarehouseBuilderProps {
  elements: VisualElement[];
  locations: WarehouseLocation[];
  selectedElementId: string | null;
  zoom: number;
  panOffset: { x: number; y: number };
  warehouseDimensions: WarehouseDimensions;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onWarehouseDimensionsChange: (width: number, height: number) => void;
  onElementSelect: (id: string | null) => void;
  onElementMove: (id: string, x: number, y: number) => void;
  onElementResize: (id: string, width: number, height: number) => void;
  onAddChild: (parentId: string, parentType: string) => void;
  onAddSectionAtPosition: (x: number, y: number) => string;
  onAddSection: () => void;
  onDelete: (id: string) => void;
  onWheel: (e: React.WheelEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onZoomChange: (zoom: number) => void;
  onResetView: () => void;
  onSave: () => void;
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  getNextLevelType: (type: string) => WarehouseLocationLevel | null;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  enabledLevels: string[];
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
  onAddSection,
  onDelete,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onResetView,
  onSave,
  onClose,
  onRename,
  getNextLevelType,
  handleZoomIn,
  handleZoomOut,
  enabledLevels,
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
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const selectedElement = selectedElementId ? findVisualElementById(elements, selectedElementId) : null;
  const selectedLocation = selectedElementId ? findLocationById(locations, selectedElementId) : null;
  const pathToSelected = selectedElementId ? getPathToElement(locations, selectedElementId) : [];

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, element: VisualElement, parentId?: string) => {
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
    },
    [onElementSelect]
  );

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

  const handleWarehouseResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.stopPropagation();
      setResizingWarehouse({
        startX: e.clientX,
        startY: e.clientY,
        startWidth: warehouseDimensions.width,
        startHeight: warehouseDimensions.height,
        handle,
      });
    },
    [warehouseDimensions]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [
      draggingElement,
      resizingElement,
      resizingWarehouse,
      zoom,
      warehouseDimensions,
      elements,
      onElementMove,
      onElementResize,
      onWarehouseDimensionsChange,
      onMouseMove,
    ]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setDraggingElement(null);
    setResizingElement(null);
    setResizingWarehouse(null);
    onMouseUp();
  }, [onMouseUp]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-grid')) {
        onElementSelect(null);
        setEditingName(null);
      }
    },
    [onElementSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (draggingFromLibrary) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    },
    [draggingFromLibrary]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
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
    },
    [draggingFromLibrary, canvasRef, panOffset, zoom, warehouseDimensions, onElementMove, onElementSelect, onAddSectionAtPosition]
  );

  // Render hierarchy recursively
  const renderHierarchy = (location: WarehouseLocation, depth: number = 0): React.ReactNode => {
    const colors = levelColors[location.type];
    const hasChildren = location.children && location.children.length > 0;
    const hasProducts = location.products && location.products.length > 0;
    const isSelected = selectedElementId === location.id;
    const isInPath = pathToSelected.includes(location.id);

    return (
      <div key={location.id} className="text-[10px]">
        <div
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-400'
              : isInPath
                ? 'bg-blue-50 dark:bg-blue-900/10'
                : 'hover:bg-[var(--accent)]'
          }`}
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          onClick={() => onElementSelect(location.id)}
        >
          <span className={colors.text}>{LevelIcons[location.type]}</span>
          <span className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-[var(--foreground)]'}`}>
            {location.name}
          </span>
          {hasProducts && (
            <span className="ml-auto text-[9px] px-1 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
              {location.products!.length}
            </span>
          )}
        </div>
        {hasChildren && <div>{location.children!.map((child) => renderHierarchy(child, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Library Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--muted)]/50 flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase mr-2">Library:</span>
          {/* Existing elements from tree */}
          {locations.map((loc) => (
            <div
              key={loc.id}
              draggable
              onDragStart={() => setDraggingFromLibrary({ type: loc.type, id: loc.id })}
              onDragEnd={() => setDraggingFromLibrary(null)}
              className={`flex items-center gap-1 px-2 py-1 rounded border cursor-grab active:cursor-grabbing ${levelColors[loc.type].bg} ${levelColors[loc.type].border} ${levelColors[loc.type].text}`}
            >
              {LevelIcons[loc.type]}
              <span className="text-[10px] font-medium">{loc.name}</span>
            </div>
          ))}
          <div className="w-px h-5 bg-[var(--border)] mx-1" />
          {/* Create new section - can be dragged or clicked */}
          {enabledLevels.includes('section') && (
            <div
              draggable
              onDragStart={() => setDraggingFromLibrary({ type: 'section' })}
              onDragEnd={() => setDraggingFromLibrary(null)}
              onClick={onAddSection}
              className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-grab active:cursor-grabbing"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[10px] font-medium">New Section</span>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-[var(--background)] rounded-lg border border-[var(--border)] px-1">
          <button onClick={handleZoomOut} className="p-1 hover:bg-[var(--accent)] rounded transition-colors" title="Zoom Out">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6" />
            </svg>
          </button>
          <span className="text-[10px] font-medium text-[var(--foreground)] px-1 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1 hover:bg-[var(--accent)] rounded transition-colors" title="Zoom In">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          <div className="w-px h-4 bg-[var(--border)] mx-1" />
          <button onClick={onResetView} className="p-1 hover:bg-[var(--accent)] rounded transition-colors" title="Reset View">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Save/Close */}
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Layout
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas View */}
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

        {/* Right Sidebar */}
        <div className={`bg-[var(--card)] border-l border-[var(--border)] flex flex-col transition-all ${isPanelCollapsed ? 'w-10' : 'w-64'}`}>
          {/* Header with toggle */}
          <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
            {!isPanelCollapsed && <div className="text-xs font-semibold text-[var(--foreground)]">Properties</div>}
            <button
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="p-1 hover:bg-[var(--accent)] rounded transition-colors ml-auto"
            >
              <svg
                className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${isPanelCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {!isPanelCollapsed && (
            <div className="flex-1 overflow-y-auto">
              {/* Warehouse Dimensions */}
              <div className="p-3 border-b border-[var(--border)]">
                <label className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Warehouse Size</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--muted-foreground)]">Width (ft)</label>
                    <input
                      type="number"
                      value={warehouseDimensions.width}
                      onChange={(e) => onWarehouseDimensionsChange(parseInt(e.target.value) || 100, warehouseDimensions.height)}
                      className="w-full mt-0.5 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--muted-foreground)]">Height (ft)</label>
                    <input
                      type="number"
                      value={warehouseDimensions.height}
                      onChange={(e) => onWarehouseDimensionsChange(warehouseDimensions.width, parseInt(e.target.value) || 100)}
                      className="w-full mt-0.5 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Element Properties */}
              {selectedElement && selectedLocation ? (
                <div className="p-3 space-y-3">
                  {/* Element Header */}
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${levelColors[selectedElement.type].bg}`}>
                      <span className={levelColors[selectedElement.type].text}>{LevelIcons[selectedElement.type]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[var(--foreground)] truncate">{selectedElement.name}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">{levelLabels[selectedElement.type]}</div>
                    </div>
                    <button
                      onClick={() => onDelete(selectedElement.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded transition-colors"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Position & Size */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <div>
                      <label className="text-[9px] text-[var(--muted-foreground)]">X (ft)</label>
                      <input
                        type="number"
                        value={pixelsToFeet(selectedElement.x)}
                        onChange={(e) => onElementMove(selectedElement.id, feetToPixels(parseInt(e.target.value) || 0), selectedElement.y ?? 0)}
                        className="w-full mt-0.5 px-1.5 py-1 text-[10px] border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[var(--muted-foreground)]">Y (ft)</label>
                      <input
                        type="number"
                        value={pixelsToFeet(selectedElement.y)}
                        onChange={(e) => onElementMove(selectedElement.id, selectedElement.x ?? 0, feetToPixels(parseInt(e.target.value) || 0))}
                        className="w-full mt-0.5 px-1.5 py-1 text-[10px] border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[var(--muted-foreground)]">W (ft)</label>
                      <input
                        type="number"
                        value={pixelsToFeet(selectedElement.width)}
                        onChange={(e) => onElementResize(selectedElement.id, feetToPixels(parseInt(e.target.value) || 10), selectedElement.height ?? 100)}
                        className="w-full mt-0.5 px-1.5 py-1 text-[10px] border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[var(--muted-foreground)]">H (ft)</label>
                      <input
                        type="number"
                        value={pixelsToFeet(selectedElement.height)}
                        onChange={(e) => onElementResize(selectedElement.id, selectedElement.width ?? 100, feetToPixels(parseInt(e.target.value) || 10))}
                        className="w-full mt-0.5 px-1.5 py-1 text-[10px] border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                      />
                    </div>
                  </div>

                  {/* Hierarchy */}
                  <div className="pt-2 border-t border-[var(--border)]">
                    <div className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Location Hierarchy</div>
                    <div className="max-h-48 overflow-y-auto bg-[var(--background)] rounded p-2">
                      {locations.map((location) => renderHierarchy(location, 0))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-10 h-10 bg-[var(--muted)] rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">Select an element to view properties</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mini-map (bottom-left of canvas) */}
        <div className="absolute bottom-3 left-3 w-36 h-28 bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden shadow-lg" style={{ zIndex: 10 }}>
          <div className="absolute inset-0 p-1.5">
            <div className="relative w-full h-full bg-[var(--background)] rounded overflow-hidden">
              {elements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute rounded-sm ${levelColors[element.type].bg} border ${levelColors[element.type].border}`}
                  style={{
                    left: `${(element.x / feetToPixels(warehouseDimensions.width)) * 100}%`,
                    top: `${(element.y / feetToPixels(warehouseDimensions.height)) * 100}%`,
                    width: `${(element.width / feetToPixels(warehouseDimensions.width)) * 100}%`,
                    height: `${(element.height / feetToPixels(warehouseDimensions.height)) * 100}%`,
                  }}
                />
              ))}
              {/* Viewport indicator */}
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/10 rounded-sm"
                style={{
                  left: `${Math.max(0, (-panOffset.x / zoom - 50) / feetToPixels(warehouseDimensions.width)) * 100}%`,
                  top: `${Math.max(0, (-panOffset.y / zoom - 50) / feetToPixels(warehouseDimensions.height)) * 100}%`,
                  width: `${Math.min(100, (100 / zoom))}%`,
                  height: `${Math.min(100, (100 / zoom))}%`,
                }}
              />
            </div>
          </div>
          <div className="absolute bottom-1 right-1.5 text-[8px] text-[var(--muted-foreground)]">Overview</div>
        </div>

        {/* Help text overlay (bottom-center of canvas) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg pointer-events-none" style={{ zIndex: 10 }}>
          <div className="flex items-center gap-3 text-[10px] text-[var(--muted-foreground)]">
            <span>Double-click to edit</span>
            <span className="w-px h-3 bg-[var(--border)]" />
            <span>Alt+Drag pan</span>
            <span className="w-px h-3 bg-[var(--border)]" />
            <span>Scroll zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
}
