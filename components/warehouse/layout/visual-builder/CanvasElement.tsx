'use client';

import React, { useState } from 'react';
import type { VisualElement, WarehouseLocationLevel } from '../types';
import { LevelIcons, levelColors, levelLabels } from '../constants';
import { pixelsToFeet, getGridSize, getGridBackgroundStyle } from './canvas-utils';

interface CanvasElementProps {
  element: VisualElement;
  isSelected: boolean;
  depth?: number;
  parentId?: string;
  editingName: string | null;
  onSelect: (id: string) => void;
  onDragStart: (e: React.MouseEvent, element: VisualElement, parentId?: string) => void;
  onResizeStart: (e: React.MouseEvent, element: VisualElement, handle: string) => void;
  onRename: (id: string, name: string) => void;
  onStartEdit: (id: string | null) => void;
  onAddChild: (parentId: string, parentType: string) => void;
  getNextLevelType: (type: string) => WarehouseLocationLevel | null;
  renderChild?: (child: VisualElement, depth: number, parentId: string) => React.ReactNode;
}

export default function CanvasElement({
  element,
  isSelected,
  depth = 0,
  parentId,
  editingName,
  onSelect,
  onDragStart,
  onResizeStart,
  onRename,
  onStartEdit,
  onAddChild,
  getNextLevelType,
  renderChild,
}: CanvasElementProps) {
  const colors = levelColors[element.type];
  const nextType = getNextLevelType(element.type);
  const hasChildren = element.children && element.children.length > 0;
  const gridSize = getGridSize(depth);

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onRename(element.id, e.target.value);
    onStartEdit(null);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onRename(element.id, (e.target as HTMLInputElement).value);
      onStartEdit(null);
    } else if (e.key === 'Escape') {
      onStartEdit(null);
    }
  };

  return (
    <div
      className={`absolute transition-shadow select-none ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
      style={{
        left: element.x ?? 0,
        top: element.y ?? 0,
        width: element.width ?? 100,
        height: element.height ?? 100,
        transform: `rotate(${element.rotation || 0}deg)`,
        zIndex: isSelected ? 100 : 10 - depth,
      }}
    >
      {/* Element Body */}
      <div
        className={`w-full h-full rounded-lg border-2 ${colors.bg} ${colors.border} shadow-sm overflow-hidden flex flex-col cursor-move`}
        onMouseDown={(e) => onDragStart(e, element, parentId)}
      >
        {/* Header */}
        <div className={`px-2 py-1 ${colors.bg} border-b ${colors.border} flex items-center gap-1.5 flex-shrink-0`}>
          <span className={colors.text}>{LevelIcons[element.type]}</span>

          {editingName === element.id ? (
            <input
              type="text"
              defaultValue={element.name}
              className="flex-1 text-[10px] font-medium bg-white dark:bg-gray-800 px-1 rounded border border-blue-500 outline-none min-w-0"
              autoFocus
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={`text-[10px] font-medium ${colors.text} truncate cursor-text`}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onStartEdit(element.id);
              }}
            >
              {element.name}
            </span>
          )}

          <span className="text-[8px] text-[var(--muted-foreground)] ml-auto">
            {pixelsToFeet(element.width)}×{pixelsToFeet(element.height)} ft
          </span>

          {nextType && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(element.id, element.type);
              }}
              className={`flex items-center gap-1 px-1.5 py-1 rounded-md bg-white/40 hover:bg-white/80 shadow-sm ${colors.text} transition-colors`}
              title={`Add ${levelLabels[nextType]}`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {(element.width ?? 0) >= 150 && (
                <span className="text-[9px] font-medium whitespace-nowrap">
                  Add {levelLabels[nextType]}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Children Container with Grid */}
        <div
          className="flex-1 relative overflow-hidden"
          style={getGridBackgroundStyle(gridSize, colors.border)}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onDragStart(e, element, parentId);
            }
          }}
        >
          {/* Render Children */}
          {hasChildren && renderChild && element.children!.map((child) => renderChild(child, depth + 1, element.id))}
        </div>
      </div>

      {/* Resize Handles (only when selected) */}
      {isSelected && (
        <>
          {/* East */}
          <div
            className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-blue-500 rounded cursor-e-resize hover:bg-blue-600"
            onMouseDown={(e) => onResizeStart(e, element, 'e')}
          />
          {/* South */}
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-blue-500 rounded cursor-s-resize hover:bg-blue-600"
            onMouseDown={(e) => onResizeStart(e, element, 's')}
          />
          {/* Southeast */}
          <div
            className="absolute -right-1.5 -bottom-1.5 w-4 h-4 bg-blue-500 rounded cursor-se-resize hover:bg-blue-600"
            onMouseDown={(e) => onResizeStart(e, element, 'se')}
          />
          {/* West */}
          <div
            className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-8 bg-blue-500 rounded cursor-w-resize hover:bg-blue-600"
            onMouseDown={(e) => onResizeStart(e, element, 'w')}
          />
          {/* North */}
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-blue-500 rounded cursor-n-resize hover:bg-blue-600"
            onMouseDown={(e) => onResizeStart(e, element, 'n')}
          />
        </>
      )}
    </div>
  );
}
