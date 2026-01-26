'use client';

import { useState, useCallback, useRef } from 'react';

export interface SelectionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface DragPosition {
  x: number;
  y: number;
}

interface UseLassoSelectionOptions {
  enabled: boolean;
  minDragDistance?: number;
  onSelectionComplete: (selectionRect: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }) => void;
}

interface UseLassoSelectionReturn {
  isDragging: boolean;
  selectionRect: SelectionRect | null;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
  };
}

export function useLassoSelection({
  enabled,
  minDragDistance = 10,
  onSelectionComplete,
}: UseLassoSelectionOptions): UseLassoSelectionReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<DragPosition | null>(null);
  const [dragEnd, setDragEnd] = useState<DragPosition | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      if (e.button !== 0) return; // Left click only

      setIsDragging(true);
      const pos = { x: e.clientX, y: e.clientY };
      setDragStart(pos);
      setDragEnd(pos);
    },
    [enabled]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || !isDragging) return;
      setDragEnd({ x: e.clientX, y: e.clientY });
    },
    [enabled, isDragging]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }

    // Calculate the selection rectangle
    const selRect = {
      left: Math.min(dragStart.x, dragEnd.x),
      right: Math.max(dragStart.x, dragEnd.x),
      top: Math.min(dragStart.y, dragEnd.y),
      bottom: Math.max(dragStart.y, dragEnd.y),
    };

    // Check if drag distance meets threshold
    const dragDistance = Math.sqrt(
      Math.pow(dragEnd.x - dragStart.x, 2) + Math.pow(dragEnd.y - dragStart.y, 2)
    );

    if (dragDistance > minDragDistance) {
      onSelectionComplete(selRect);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, minDragDistance, onSelectionComplete]);

  // Calculate the visual selection rectangle
  const selectionRect: SelectionRect | null =
    isDragging && dragStart && dragEnd
      ? {
          left: Math.min(dragStart.x, dragEnd.x),
          top: Math.min(dragStart.y, dragEnd.y),
          width: Math.abs(dragEnd.x - dragStart.x),
          height: Math.abs(dragEnd.y - dragStart.y),
        }
      : null;

  return {
    isDragging,
    selectionRect,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
  };
}

// Helper to check if an element's bounding box intersects with a selection rectangle
export function elementIntersectsSelection(
  element: Element,
  selectionRect: { left: number; right: number; top: number; bottom: number }
): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.left < selectionRect.right &&
    rect.right > selectionRect.left &&
    rect.top < selectionRect.bottom &&
    rect.bottom > selectionRect.top
  );
}
