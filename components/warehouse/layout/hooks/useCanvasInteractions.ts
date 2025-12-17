// Canvas Interactions Hook

import { useState, useCallback } from 'react';
import { MIN_ZOOM, MAX_ZOOM } from '../constants';

export function useCanvasInteractions() {
  // State
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Zoom in
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, prev + 0.1));
  }, []);

  // Zoom out
  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(MIN_ZOOM, prev - 0.1));
  }, []);

  // Reset view to defaults
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Handle mouse wheel for zoom (with Ctrl/Cmd key)
  const handleCanvasWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * delta)));
    }
  }, []);

  // Start panning (middle mouse button or Alt + left click)
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  // Pan the canvas
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - lastPanPoint.x;
        const dy = e.clientY - lastPanPoint.y;
        setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    },
    [isPanning, lastPanPoint]
  );

  // Stop panning
  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Select element
  const handleElementSelect = useCallback((id: string | null) => {
    setSelectedElementId(id);
  }, []);

  return {
    // State
    zoom,
    panOffset,
    isPanning,
    lastPanPoint,
    selectedElementId,

    // Setters
    setZoom,
    setPanOffset,
    setIsPanning,
    setLastPanPoint,
    setSelectedElementId,

    // Handlers
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleCanvasWheel,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleElementSelect,
  };
}
