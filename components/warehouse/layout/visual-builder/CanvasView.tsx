'use client';

import React from 'react';
import type { VisualElement, WarehouseDimensions, WarehouseLocationLevel } from '../types';
import CanvasElement from './CanvasElement';
import { feetToPixels } from './canvas-utils';

interface CanvasViewProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  elements: VisualElement[];
  warehouseDimensions: WarehouseDimensions;
  zoom: number;
  panOffset: { x: number; y: number };
  selectedElementId: string | null;
  editingName: string | null;
  draggingFromLibrary: { type: string; id?: string } | null;
  onWheel: (e: React.WheelEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onCanvasClick: (e: React.MouseEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onElementSelect: (id: string | null) => void;
  onElementDragStart: (e: React.MouseEvent, element: VisualElement, parentId?: string) => void;
  onElementResizeStart: (e: React.MouseEvent, element: VisualElement, handle: string) => void;
  onWarehouseResizeStart: (e: React.MouseEvent, handle: string) => void;
  onRename: (id: string, name: string) => void;
  onStartEdit: (id: string | null) => void;
  onAddChild: (parentId: string, parentType: string) => void;
  getNextLevelType: (type: string) => WarehouseLocationLevel | null;
}

export default function CanvasView({
  canvasRef,
  elements,
  warehouseDimensions,
  zoom,
  panOffset,
  selectedElementId,
  editingName,
  draggingFromLibrary,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onCanvasClick,
  onDragOver,
  onDrop,
  onElementSelect,
  onElementDragStart,
  onElementResizeStart,
  onWarehouseResizeStart,
  onRename,
  onStartEdit,
  onAddChild,
  getNextLevelType,
}: CanvasViewProps) {
  const canvasWidth = feetToPixels(warehouseDimensions.width) + 100;
  const canvasHeight = feetToPixels(warehouseDimensions.height) + 100;

  // Recursive render for nested elements
  const renderElement = (element: VisualElement, depth: number = 0, parentId?: string): React.ReactNode => {
    return (
      <CanvasElement
        key={element.id}
        element={element}
        isSelected={selectedElementId === element.id}
        depth={depth}
        parentId={parentId}
        editingName={editingName}
        onSelect={onElementSelect}
        onDragStart={onElementDragStart}
        onResizeStart={onElementResizeStart}
        onRename={onRename}
        onStartEdit={onStartEdit}
        onAddChild={onAddChild}
        getNextLevelType={getNextLevelType}
        renderChild={renderElement}
      />
    );
  };

  return (
    <div
      ref={canvasRef}
      className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 relative"
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onClick={onCanvasClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Canvas Container */}
      <div
        className="relative"
        style={{
          width: canvasWidth * zoom,
          height: canvasHeight * zoom,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
      >
        {/* Grid Background */}
        <div
          className="absolute canvas-grid"
          style={{
            left: 50 * zoom,
            top: 50 * zoom,
            width: feetToPixels(warehouseDimensions.width) * zoom,
            height: feetToPixels(warehouseDimensions.height) * zoom,
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundColor: 'white',
            border: '2px solid var(--border)',
          }}
        />

        {/* Warehouse Floor Label */}
        <div
          className="absolute text-xs text-[var(--muted-foreground)] font-medium"
          style={{
            left: 50 * zoom,
            top: (50 + feetToPixels(warehouseDimensions.height) + 10) * zoom,
          }}
        >
          {warehouseDimensions.width} × {warehouseDimensions.height} ft
        </div>

        {/* Elements Container */}
        <div
          className="absolute"
          style={{
            left: 50 * zoom,
            top: 50 * zoom,
            width: feetToPixels(warehouseDimensions.width) * zoom,
            height: feetToPixels(warehouseDimensions.height) * zoom,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {elements.map((element) => renderElement(element, 0))}
        </div>

        {/* Warehouse Resize Handles */}
        <div
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-12 bg-green-500 rounded cursor-e-resize hover:bg-green-600 opacity-50 hover:opacity-100 transition-opacity"
          style={{
            left: (50 + feetToPixels(warehouseDimensions.width)) * zoom,
            top: (50 + feetToPixels(warehouseDimensions.height) / 2) * zoom,
          }}
          onMouseDown={(e) => onWarehouseResizeStart(e, 'e')}
        />
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-green-500 rounded cursor-s-resize hover:bg-green-600 opacity-50 hover:opacity-100 transition-opacity"
          style={{
            left: (50 + feetToPixels(warehouseDimensions.width) / 2) * zoom,
            top: (50 + feetToPixels(warehouseDimensions.height)) * zoom,
          }}
          onMouseDown={(e) => onWarehouseResizeStart(e, 's')}
        />
        <div
          className="absolute -right-2 -bottom-2 w-5 h-5 bg-green-500 rounded cursor-se-resize hover:bg-green-600 opacity-50 hover:opacity-100 transition-opacity"
          style={{
            left: (50 + feetToPixels(warehouseDimensions.width)) * zoom,
            top: (50 + feetToPixels(warehouseDimensions.height)) * zoom,
          }}
          onMouseDown={(e) => onWarehouseResizeStart(e, 'se')}
        />
      </div>
    </div>
  );
}
