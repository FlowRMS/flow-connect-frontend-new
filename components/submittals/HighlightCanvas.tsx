'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { HighlightRegion, HighlightShape } from '../../lib/types/submittals';

interface HighlightCanvasProps {
  width: number;
  height: number;
  regions: HighlightRegion[];
  onRegionsChange: (regions: HighlightRegion[]) => void;
  activeTool: HighlightShape | 'select';
  activeColor: string;
  strokeWidth: number;
  pageNumber: number;
  zoom: number;
  selectedRegionId?: string;
  onRegionSelect?: (id: string | null) => void;
}

interface Point {
  x: number;
  y: number;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

export default function HighlightCanvas({
  width,
  height,
  regions,
  onRegionsChange,
  activeTool,
  activeColor,
  strokeWidth,
  pageNumber,
  zoom,
  selectedRegionId,
  onRegionSelect,
}: HighlightCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Filter regions for current page
  const pageRegions = regions.filter(r => r.pageNumber === pageNumber);

  // Convert pixel coordinates to percentage
  const toPercentage = useCallback((point: Point): Point => ({
    x: (point.x / width) * 100,
    y: (point.y / height) * 100,
  }), [width, height]);

  // Convert percentage to pixel coordinates
  const toPixels = useCallback((point: Point): Point => ({
    x: (point.x / 100) * width,
    y: (point.y / 100) * height,
  }), [width, height]);

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Canvas is already sized to account for zoom, so just get position relative to canvas
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Check if point is on a resize handle
  const findResizeHandle = useCallback((point: Point, region: HighlightRegion): ResizeHandle => {
    const handleSize = 12; // Handle size in pixels
    const px = toPercentage(point);

    const x = region.x;
    const y = region.y;
    const w = region.width;
    const h = region.height;

    // Convert handle size to percentage
    const hsPctX = (handleSize / width) * 100;
    const hsPctY = (handleSize / height) * 100;

    // Check corners first (they take priority)
    // Top-left
    if (px.x >= x - hsPctX && px.x <= x + hsPctX && px.y >= y - hsPctY && px.y <= y + hsPctY) return 'nw';
    // Top-right
    if (px.x >= x + w - hsPctX && px.x <= x + w + hsPctX && px.y >= y - hsPctY && px.y <= y + hsPctY) return 'ne';
    // Bottom-left
    if (px.x >= x - hsPctX && px.x <= x + hsPctX && px.y >= y + h - hsPctY && px.y <= y + h + hsPctY) return 'sw';
    // Bottom-right
    if (px.x >= x + w - hsPctX && px.x <= x + w + hsPctX && px.y >= y + h - hsPctY && px.y <= y + h + hsPctY) return 'se';

    // Check edges
    // Top edge
    if (px.x >= x + hsPctX && px.x <= x + w - hsPctX && px.y >= y - hsPctY && px.y <= y + hsPctY) return 'n';
    // Bottom edge
    if (px.x >= x + hsPctX && px.x <= x + w - hsPctX && px.y >= y + h - hsPctY && px.y <= y + h + hsPctY) return 's';
    // Left edge
    if (px.x >= x - hsPctX && px.x <= x + hsPctX && px.y >= y + hsPctY && px.y <= y + h - hsPctY) return 'w';
    // Right edge
    if (px.x >= x + w - hsPctX && px.x <= x + w + hsPctX && px.y >= y + hsPctY && px.y <= y + h - hsPctY) return 'e';

    return null;
  }, [toPercentage, width, height]);

  // Check if point is inside a region
  const findRegionAtPoint = useCallback((point: Point): HighlightRegion | null => {
    const px = toPercentage(point);
    for (let i = pageRegions.length - 1; i >= 0; i--) {
      const region = pageRegions[i];
      if (
        px.x >= region.x &&
        px.x <= region.x + region.width &&
        px.y >= region.y &&
        px.y <= region.y + region.height
      ) {
        return region;
      }
    }
    return null;
  }, [pageRegions, toPercentage]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e);

    // Check if clicking on a selected region's resize handle
    if (selectedRegionId) {
      const selectedRegion = regions.find(r => r.id === selectedRegionId);
      if (selectedRegion && selectedRegion.pageNumber === pageNumber) {
        const handle = findResizeHandle(pos, selectedRegion);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setResizeStart({
            x: selectedRegion.x,
            y: selectedRegion.y,
            width: selectedRegion.width,
            height: selectedRegion.height,
          });
          setStartPoint(pos);
          return;
        }
      }
    }

    if (activeTool === 'select') {
      const region = findRegionAtPoint(pos);
      if (region) {
        onRegionSelect?.(region.id);
        setIsDragging(true);
        const regionPixels = toPixels({ x: region.x, y: region.y });
        setDragOffset({
          x: pos.x - regionPixels.x,
          y: pos.y - regionPixels.y,
        });
      } else {
        onRegionSelect?.(null);
      }
    } else {
      // If clicking inside a region while using a draw tool, select it instead
      const region = findRegionAtPoint(pos);
      if (region) {
        onRegionSelect?.(region.id);
        setIsDragging(true);
        const regionPixels = toPixels({ x: region.x, y: region.y });
        setDragOffset({
          x: pos.x - regionPixels.x,
          y: pos.y - regionPixels.y,
        });
      } else {
        // Start drawing new region
        onRegionSelect?.(null);
        setIsDrawing(true);
        setStartPoint(pos);
        setCurrentPoint(pos);
      }
    }
  }, [activeTool, getMousePos, findRegionAtPoint, findResizeHandle, onRegionSelect, toPixels, selectedRegionId, regions, pageNumber]);

  // Update cursor based on position
  const updateCursor = useCallback((pos: Point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (selectedRegionId) {
      const selectedRegion = regions.find(r => r.id === selectedRegionId);
      if (selectedRegion && selectedRegion.pageNumber === pageNumber) {
        const handle = findResizeHandle(pos, selectedRegion);
        if (handle) {
          const cursorMap: Record<string, string> = {
            'nw': 'nwse-resize',
            'se': 'nwse-resize',
            'ne': 'nesw-resize',
            'sw': 'nesw-resize',
            'n': 'ns-resize',
            's': 'ns-resize',
            'e': 'ew-resize',
            'w': 'ew-resize',
          };
          canvas.style.cursor = cursorMap[handle] || 'default';
          return;
        }
      }
    }

    const region = findRegionAtPoint(pos);
    if (region) {
      canvas.style.cursor = 'move';
    } else {
      canvas.style.cursor = activeTool === 'select' ? 'default' : 'crosshair';
    }
  }, [selectedRegionId, regions, pageNumber, findResizeHandle, findRegionAtPoint, activeTool]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e);

    if (isDrawing) {
      setCurrentPoint(pos);
    } else if (isResizing && selectedRegionId && resizeStart && startPoint && resizeHandle) {
      const deltaX = ((pos.x - startPoint.x) / width) * 100;
      const deltaY = ((pos.y - startPoint.y) / height) * 100;

      let newX = resizeStart.x;
      let newY = resizeStart.y;
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;

      // Apply resize based on handle
      switch (resizeHandle) {
        case 'nw':
          newX = resizeStart.x + deltaX;
          newY = resizeStart.y + deltaY;
          newWidth = resizeStart.width - deltaX;
          newHeight = resizeStart.height - deltaY;
          break;
        case 'ne':
          newY = resizeStart.y + deltaY;
          newWidth = resizeStart.width + deltaX;
          newHeight = resizeStart.height - deltaY;
          break;
        case 'sw':
          newX = resizeStart.x + deltaX;
          newWidth = resizeStart.width - deltaX;
          newHeight = resizeStart.height + deltaY;
          break;
        case 'se':
          newWidth = resizeStart.width + deltaX;
          newHeight = resizeStart.height + deltaY;
          break;
        case 'n':
          newY = resizeStart.y + deltaY;
          newHeight = resizeStart.height - deltaY;
          break;
        case 's':
          newHeight = resizeStart.height + deltaY;
          break;
        case 'w':
          newX = resizeStart.x + deltaX;
          newWidth = resizeStart.width - deltaX;
          break;
        case 'e':
          newWidth = resizeStart.width + deltaX;
          break;
      }

      // Ensure minimum size and boundaries
      const minSize = 1; // 1% minimum
      if (newWidth < minSize) {
        if (resizeHandle.includes('w')) {
          newX = resizeStart.x + resizeStart.width - minSize;
        }
        newWidth = minSize;
      }
      if (newHeight < minSize) {
        if (resizeHandle.includes('n')) {
          newY = resizeStart.y + resizeStart.height - minSize;
        }
        newHeight = minSize;
      }

      // Keep within bounds
      newX = Math.max(0, Math.min(100 - newWidth, newX));
      newY = Math.max(0, Math.min(100 - newHeight, newY));

      onRegionsChange(regions.map(r =>
        r.id === selectedRegionId
          ? { ...r, x: newX, y: newY, width: newWidth, height: newHeight }
          : r
      ));
    } else if (isDragging && selectedRegionId) {
      const newX = ((pos.x - dragOffset.x) / width) * 100;
      const newY = ((pos.y - dragOffset.y) / height) * 100;

      const region = regions.find(r => r.id === selectedRegionId);
      if (region) {
        onRegionsChange(regions.map(r =>
          r.id === selectedRegionId
            ? { ...r, x: Math.max(0, Math.min(100 - r.width, newX)), y: Math.max(0, Math.min(100 - r.height, newY)) }
            : r
        ));
      }
    }

    // Update cursor based on hover position
    updateCursor(pos);
  }, [isDrawing, isDragging, isResizing, selectedRegionId, getMousePos, dragOffset, width, height, regions, onRegionsChange, resizeStart, startPoint, resizeHandle, updateCursor]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDrawing && startPoint && currentPoint && activeTool !== 'select') {
      const start = toPercentage(startPoint);
      const end = toPercentage(currentPoint);

      const newRegion: HighlightRegion = {
        id: `region-${Date.now()}`,
        pageNumber,
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
        shape: activeTool,
        color: activeColor,
        strokeWidth: activeTool !== 'highlight' ? strokeWidth : undefined,
      };

      // Only add if it has some size
      if (newRegion.width > 0.5 && newRegion.height > 0.5) {
        onRegionsChange([...regions, newRegion]);
      }
    }

    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStart(null);
    setStartPoint(null);
    setCurrentPoint(null);
  }, [isDrawing, startPoint, currentPoint, activeTool, activeColor, strokeWidth, pageNumber, regions, onRegionsChange, toPercentage]);

  // Draw regions on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw existing regions
    pageRegions.forEach(region => {
      const x = (region.x / 100) * width;
      const y = (region.y / 100) * height;
      const w = (region.width / 100) * width;
      const h = (region.height / 100) * height;

      const isSelected = region.id === selectedRegionId;

      switch (region.shape) {
        case 'highlight':
          ctx.fillStyle = region.color + '80'; // 50% opacity
          ctx.fillRect(x, y, w, h);
          break;

        case 'rectangle':
          ctx.fillStyle = region.color + '80'; // 50% opacity fill
          ctx.strokeStyle = region.color;
          ctx.lineWidth = region.strokeWidth || 2;
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
          break;

        case 'oval':
          ctx.fillStyle = region.color + '80'; // 50% opacity fill
          ctx.strokeStyle = region.color;
          ctx.lineWidth = region.strokeWidth || 2;
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;

        case 'arrow':
          ctx.strokeStyle = region.color;
          ctx.fillStyle = region.color;
          ctx.lineWidth = region.strokeWidth || 2;

          // Draw line
          ctx.beginPath();
          ctx.moveTo(x, y + h);
          ctx.lineTo(x + w, y);
          ctx.stroke();

          // Draw arrowhead
          const angle = Math.atan2(-h, w);
          const headLen = 10;
          ctx.beginPath();
          ctx.moveTo(x + w, y);
          ctx.lineTo(
            x + w - headLen * Math.cos(angle - Math.PI / 6),
            y - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            x + w - headLen * Math.cos(angle + Math.PI / 6),
            y - headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
          break;

        case 'underline':
          ctx.strokeStyle = region.color;
          ctx.lineWidth = region.strokeWidth || 2;
          ctx.beginPath();
          ctx.moveTo(x, y + h);
          ctx.lineTo(x + w, y + h);
          ctx.stroke();
          break;

        case 'text':
          // Text box - draw border and text
          ctx.strokeStyle = region.color;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(x, y, w, h);
          ctx.setLineDash([]);
          if (region.annotation) {
            ctx.fillStyle = region.color;
            ctx.font = '14px sans-serif';
            ctx.fillText(region.annotation, x + 4, y + 16);
          }
          break;
      }

      // Draw selection handles
      if (isSelected) {
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
        ctx.setLineDash([]);

        // Handle size
        const handleSize = 8;
        ctx.fillStyle = '#2196F3';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        // Helper to draw a handle
        const drawHandle = (hx: number, hy: number) => {
          ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
          ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
        };

        // Corner handles
        drawHandle(x, y);           // nw
        drawHandle(x + w, y);       // ne
        drawHandle(x, y + h);       // sw
        drawHandle(x + w, y + h);   // se

        // Edge handles (midpoints)
        drawHandle(x + w / 2, y);       // n
        drawHandle(x + w / 2, y + h);   // s
        drawHandle(x, y + h / 2);       // w
        drawHandle(x + w, y + h / 2);   // e
      }
    });

    // Draw current drawing preview
    if (isDrawing && startPoint && currentPoint && activeTool !== 'select') {
      const x = Math.min(startPoint.x, currentPoint.x);
      const y = Math.min(startPoint.y, currentPoint.y);
      const w = Math.abs(currentPoint.x - startPoint.x);
      const h = Math.abs(currentPoint.y - startPoint.y);

      ctx.save();
      ctx.globalAlpha = 0.5;

      switch (activeTool) {
        case 'highlight':
          ctx.fillStyle = activeColor;
          ctx.fillRect(x, y, w, h);
          break;

        case 'rectangle':
          ctx.fillStyle = activeColor + '80'; // 50% opacity fill
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = strokeWidth;
          ctx.fillRect(x, y, w, h);
          ctx.strokeRect(x, y, w, h);
          break;

        case 'oval':
          ctx.fillStyle = activeColor + '80'; // 50% opacity fill
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = strokeWidth;
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;

        case 'arrow':
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = strokeWidth;
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(currentPoint.x, currentPoint.y);
          ctx.stroke();
          break;

        case 'underline':
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = strokeWidth;
          ctx.beginPath();
          ctx.moveTo(x, y + h);
          ctx.lineTo(x + w, y + h);
          ctx.stroke();
          break;

        case 'text':
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(x, y, w, h);
          ctx.setLineDash([]);
          break;
      }

      ctx.restore();
    }
  }, [pageRegions, selectedRegionId, isDrawing, startPoint, currentPoint, activeTool, activeColor, strokeWidth, width, height]);

  // Handle delete key for selected region
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRegionId) {
        onRegionsChange(regions.filter(r => r.id !== selectedRegionId));
        onRegionSelect?.(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRegionId, regions, onRegionsChange, onRegionSelect]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 cursor-crosshair"
      style={{
        cursor: activeTool === 'select' ? 'default' : 'crosshair',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}

// Region display component for read-only view
export function HighlightRegionDisplay({
  region,
  containerWidth,
  containerHeight,
}: {
  region: HighlightRegion;
  containerWidth: number;
  containerHeight: number;
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${region.x}%`,
    top: `${region.y}%`,
    width: `${region.width}%`,
    height: `${region.height}%`,
    pointerEvents: 'none',
  };

  switch (region.shape) {
    case 'highlight':
      return (
        <div
          style={{
            ...style,
            backgroundColor: region.color,
            opacity: 0.5,
          }}
        />
      );

    case 'rectangle':
      return (
        <div
          style={{
            ...style,
            border: `${region.strokeWidth || 2}px solid ${region.color}`,
          }}
        />
      );

    case 'oval':
      return (
        <div
          style={{
            ...style,
            border: `${region.strokeWidth || 2}px solid ${region.color}`,
            borderRadius: '50%',
          }}
        />
      );

    default:
      return null;
  }
}
