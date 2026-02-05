import { useState, useCallback, useRef } from 'react';
import type { HighlightRegion, HighlightShape } from '../../../lib/types/submittals';

interface Point {
  x: number;
  y: number;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

interface UseHighlightCanvasParams {
  width: number;
  height: number;
  regions: HighlightRegion[];
  onRegionsChange: (regions: HighlightRegion[]) => void;
  activeTool: HighlightShape | 'select';
  activeColor: string;
  strokeWidth: number;
  pageNumber: number;
  selectedRegionId?: string;
  onRegionSelect?: (id: string | null) => void;
}

export function useHighlightCanvas({
  width,
  height,
  regions,
  onRegionsChange,
  activeTool,
  activeColor,
  strokeWidth,
  pageNumber,
  selectedRegionId,
  onRegionSelect,
}: UseHighlightCanvasParams) {
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
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Check if point is on a resize handle
  const findResizeHandle = useCallback((point: Point, region: HighlightRegion): ResizeHandle => {
    const handleSize = 12;
    const px = toPercentage(point);
    const x = region.x;
    const y = region.y;
    const w = region.width;
    const h = region.height;
    const hsPctX = (handleSize / width) * 100;
    const hsPctY = (handleSize / height) * 100;

    // Check corners first
    if (px.x >= x - hsPctX && px.x <= x + hsPctX && px.y >= y - hsPctY && px.y <= y + hsPctY) return 'nw';
    if (px.x >= x + w - hsPctX && px.x <= x + w + hsPctX && px.y >= y - hsPctY && px.y <= y + hsPctY) return 'ne';
    if (px.x >= x - hsPctX && px.x <= x + hsPctX && px.y >= y + h - hsPctY && px.y <= y + h + hsPctY) return 'sw';
    if (px.x >= x + w - hsPctX && px.x <= x + w + hsPctX && px.y >= y + h - hsPctY && px.y <= y + h + hsPctY) return 'se';

    // Check edges
    if (px.x >= x + hsPctX && px.x <= x + w - hsPctX && px.y >= y - hsPctY && px.y <= y + hsPctY) return 'n';
    if (px.x >= x + hsPctX && px.x <= x + w - hsPctX && px.y >= y + h - hsPctY && px.y <= y + h + hsPctY) return 's';
    if (px.x >= x - hsPctX && px.x <= x + hsPctX && px.y >= y + hsPctY && px.y <= y + h - hsPctY) return 'w';
    if (px.x >= x + w - hsPctX && px.x <= x + w + hsPctX && px.y >= y + hsPctY && px.y <= y + h - hsPctY) return 'e';

    return null;
  }, [toPercentage, width, height]);

  // Check if point is inside a region
  const findRegionAtPoint = useCallback((point: Point): HighlightRegion | null => {
    const px = toPercentage(point);
    for (let i = pageRegions.length - 1; i >= 0; i--) {
      const region = pageRegions[i];
      if (px.x >= region.x && px.x <= region.x + region.width &&
          px.y >= region.y && px.y <= region.y + region.height) {
        return region;
      }
    }
    return null;
  }, [pageRegions, toPercentage]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e);

    if (selectedRegionId) {
      const selectedRegion = regions.find(r => r.id === selectedRegionId);
      if (selectedRegion && selectedRegion.pageNumber === pageNumber) {
        const handle = findResizeHandle(pos, selectedRegion);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setResizeStart({ x: selectedRegion.x, y: selectedRegion.y, width: selectedRegion.width, height: selectedRegion.height });
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
        setDragOffset({ x: pos.x - regionPixels.x, y: pos.y - regionPixels.y });
      } else {
        onRegionSelect?.(null);
      }
    } else {
      const region = findRegionAtPoint(pos);
      if (region) {
        onRegionSelect?.(region.id);
        setIsDragging(true);
        const regionPixels = toPixels({ x: region.x, y: region.y });
        setDragOffset({ x: pos.x - regionPixels.x, y: pos.y - regionPixels.y });
      } else {
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
            'nw': 'nwse-resize', 'se': 'nwse-resize', 'ne': 'nesw-resize', 'sw': 'nesw-resize',
            'n': 'ns-resize', 's': 'ns-resize', 'e': 'ew-resize', 'w': 'ew-resize',
          };
          canvas.style.cursor = cursorMap[handle] || 'default';
          return;
        }
      }
    }

    const region = findRegionAtPoint(pos);
    canvas.style.cursor = region ? 'move' : (activeTool === 'select' ? 'default' : 'crosshair');
  }, [selectedRegionId, regions, pageNumber, findResizeHandle, findRegionAtPoint, activeTool]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e);

    if (isDrawing) {
      setCurrentPoint(pos);
    } else if (isResizing && selectedRegionId && resizeStart && startPoint && resizeHandle) {
      const deltaX = ((pos.x - startPoint.x) / width) * 100;
      const deltaY = ((pos.y - startPoint.y) / height) * 100;

      let newX = resizeStart.x, newY = resizeStart.y;
      let newWidth = resizeStart.width, newHeight = resizeStart.height;

      switch (resizeHandle) {
        case 'nw': newX += deltaX; newY += deltaY; newWidth -= deltaX; newHeight -= deltaY; break;
        case 'ne': newY += deltaY; newWidth += deltaX; newHeight -= deltaY; break;
        case 'sw': newX += deltaX; newWidth -= deltaX; newHeight += deltaY; break;
        case 'se': newWidth += deltaX; newHeight += deltaY; break;
        case 'n': newY += deltaY; newHeight -= deltaY; break;
        case 's': newHeight += deltaY; break;
        case 'w': newX += deltaX; newWidth -= deltaX; break;
        case 'e': newWidth += deltaX; break;
      }

      const minSize = 1;
      if (newWidth < minSize) { if (resizeHandle.includes('w')) newX = resizeStart.x + resizeStart.width - minSize; newWidth = minSize; }
      if (newHeight < minSize) { if (resizeHandle.includes('n')) newY = resizeStart.y + resizeStart.height - minSize; newHeight = minSize; }

      newX = Math.max(0, Math.min(100 - newWidth, newX));
      newY = Math.max(0, Math.min(100 - newHeight, newY));

      onRegionsChange(regions.map(r => r.id === selectedRegionId ? { ...r, x: newX, y: newY, width: newWidth, height: newHeight } : r));
    } else if (isDragging && selectedRegionId) {
      const newX = ((pos.x - dragOffset.x) / width) * 100;
      const newY = ((pos.y - dragOffset.y) / height) * 100;
      const region = regions.find(r => r.id === selectedRegionId);
      if (region) {
        onRegionsChange(regions.map(r => r.id === selectedRegionId
          ? { ...r, x: Math.max(0, Math.min(100 - r.width, newX)), y: Math.max(0, Math.min(100 - r.height, newY)) }
          : r
        ));
      }
    }

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

  return {
    canvasRef,
    pageRegions,
    isDrawing,
    startPoint,
    currentPoint,
    selectedRegionId,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
