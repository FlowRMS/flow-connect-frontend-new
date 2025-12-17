'use client';

import React from 'react';
import type { VisualElement, WarehouseDimensions } from '../types';
import { levelColors } from '../constants';
import { feetToPixels } from './canvas-utils';

interface MiniMapProps {
  elements: VisualElement[];
  warehouseDimensions: WarehouseDimensions;
  zoom: number;
  panOffset: { x: number; y: number };
  viewportWidth: number;
  viewportHeight: number;
  onViewportClick: (x: number, y: number) => void;
}

export default function MiniMap({
  elements,
  warehouseDimensions,
  zoom,
  panOffset,
  viewportWidth,
  viewportHeight,
  onViewportClick,
}: MiniMapProps) {
  const miniMapScale = 0.1; // 10% scale
  const canvasWidth = feetToPixels(warehouseDimensions.width);
  const canvasHeight = feetToPixels(warehouseDimensions.height);

  const miniMapWidth = canvasWidth * miniMapScale;
  const miniMapHeight = canvasHeight * miniMapScale;

  // Calculate viewport rectangle in minimap coordinates
  const viewportRect = {
    x: (-panOffset.x / zoom) * miniMapScale,
    y: (-panOffset.y / zoom) * miniMapScale,
    width: (viewportWidth / zoom) * miniMapScale,
    height: (viewportHeight / zoom) * miniMapScale,
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / miniMapScale) * zoom;
    const clickY = ((e.clientY - rect.top) / miniMapScale) * zoom;
    onViewportClick(clickX, clickY);
  };

  return (
    <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-[var(--border)] p-2">
      <div className="text-[10px] font-medium text-[var(--muted-foreground)] mb-1">Mini Map</div>
      <div
        className="relative bg-[var(--muted)] cursor-pointer"
        style={{ width: miniMapWidth, height: miniMapHeight }}
        onClick={handleClick}
      >
        {/* Warehouse floor */}
        <div className="absolute inset-0 bg-white dark:bg-gray-900 border border-[var(--border)]" />

        {/* Elements */}
        {elements.map((element) => {
          const colors = levelColors[element.type];
          return (
            <div
              key={element.id}
              className={`absolute ${colors.bg} ${colors.border} border opacity-70`}
              style={{
                left: element.x * miniMapScale,
                top: element.y * miniMapScale,
                width: element.width * miniMapScale,
                height: element.height * miniMapScale,
              }}
            />
          );
        })}

        {/* Viewport indicator */}
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
          style={{
            left: viewportRect.x,
            top: viewportRect.y,
            width: viewportRect.width,
            height: viewportRect.height,
          }}
        />
      </div>
    </div>
  );
}
