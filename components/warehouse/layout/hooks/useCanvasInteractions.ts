// Canvas Interactions Hook
// Provides smooth infinite canvas experience with:
// - Right-click drag to pan (like Figma/design tools)
// - Alt+left-click or middle mouse to pan
// - Scroll wheel to zoom (cursor-centered)
// - Space+drag to pan

import { useState, useCallback, useEffect, useRef } from 'react';
import { MIN_ZOOM, MAX_ZOOM } from '../constants';

export function useCanvasInteractions() {
  // State
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 50, y: 50 }); // Start with some padding
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Track if right mouse is being held for panning
  const isRightMouseDown = useRef(false);

  // Handle spacebar for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Zoom in
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, +(prev + 0.1).toFixed(1)));
  }, []);

  // Zoom out
  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(MIN_ZOOM, +(prev - 0.1).toFixed(1)));
  }, []);

  // Reset view to defaults
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 50, y: 50 });
  }, []);

  // Handle mouse wheel for zoom (cursor-centered) with smooth zoom
  const handleCanvasWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Get cursor position relative to the canvas container
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Smoother zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;

    setZoom((prevZoom) => {
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom * zoomFactor));
      const actualZoomFactor = newZoom / prevZoom;

      // Adjust pan offset to keep cursor position stationary during zoom
      setPanOffset((prevPan) => ({
        x: mouseX - (mouseX - prevPan.x) * actualZoomFactor,
        y: mouseY - (mouseY - prevPan.y) * actualZoomFactor,
      }));

      return newZoom;
    });
  }, []);

  // Start panning (right-click, middle mouse button, Alt + left click, or Space + left click)
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Right-click to pan
    if (e.button === 2) {
      e.preventDefault();
      isRightMouseDown.current = true;
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // Middle mouse button, Alt + left click, or Space + left click to pan
    if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, [isSpacePressed]);

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
  const handleCanvasMouseUp = useCallback((e?: React.MouseEvent) => {
    if (e?.button === 2) {
      isRightMouseDown.current = false;
    }
    setIsPanning(false);
  }, []);

  // Prevent context menu on right-click (we use it for panning)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Select element
  const handleElementSelect = useCallback((id: string | null) => {
    setSelectedElementId(id);
  }, []);

  // Get cursor style based on current state
  const getCursorStyle = useCallback(() => {
    if (isPanning) return 'grabbing';
    if (isSpacePressed) return 'grab';
    return 'default';
  }, [isPanning, isSpacePressed]);

  return {
    // State
    zoom,
    panOffset,
    isPanning,
    lastPanPoint,
    selectedElementId,
    isSpacePressed,

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
    handleContextMenu,
    handleElementSelect,
    getCursorStyle,
  };
}
