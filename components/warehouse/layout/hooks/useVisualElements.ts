// Visual Elements Hook

import { useState, useCallback, useEffect } from 'react';
import type { WarehouseLocation, VisualElement, WarehouseDimensions } from '../types';
import { buildVisualElements, updateLocationInTree } from '../utils';
import { DEFAULT_WAREHOUSE_DIMENSIONS } from '../constants';

export interface UseVisualElementsProps {
  locations: WarehouseLocation[];
  setLocations: React.Dispatch<React.SetStateAction<WarehouseLocation[]>>;
}

export function useVisualElements({ locations, setLocations }: UseVisualElementsProps) {
  // State
  const [visualElements, setVisualElements] = useState<VisualElement[]>(() => buildVisualElements(locations));
  const [warehouseDimensions, setWarehouseDimensions] = useState<WarehouseDimensions>(DEFAULT_WAREHOUSE_DIMENSIONS);

  // Sync visual elements when locations change
  useEffect(() => {
    setVisualElements(buildVisualElements(locations));
  }, [locations]);

  // Move element on canvas
  const handleElementMove = useCallback(
    (elementId: string, newX: number, newY: number) => {
      // Update visual elements
      setVisualElements((prev) => {
        const updateElement = (elements: VisualElement[]): VisualElement[] => {
          return elements.map((el) => {
            if (el.id === elementId) {
              return { ...el, x: newX, y: newY };
            }
            if (el.children) {
              return { ...el, children: updateElement(el.children) };
            }
            return el;
          });
        };
        return updateElement(prev);
      });

      // Sync back to locations
      setLocations((prev) => updateLocationInTree(prev, elementId, { x: newX, y: newY }));
    },
    [setLocations]
  );

  // Resize element
  const handleElementResize = useCallback(
    (elementId: string, newWidth: number, newHeight: number) => {
      const constrainedWidth = Math.max(40, newWidth);
      const constrainedHeight = Math.max(40, newHeight);

      // Update visual elements
      setVisualElements((prev) => {
        const updateElement = (elements: VisualElement[]): VisualElement[] => {
          return elements.map((el) => {
            if (el.id === elementId) {
              return { ...el, width: constrainedWidth, height: constrainedHeight };
            }
            if (el.children) {
              return { ...el, children: updateElement(el.children) };
            }
            return el;
          });
        };
        return updateElement(prev);
      });

      // Sync to locations
      setLocations((prev) => updateLocationInTree(prev, elementId, { width: constrainedWidth, height: constrainedHeight }));
    },
    [setLocations]
  );

  // Rotate element
  const handleElementRotate = useCallback((elementId: string, newRotation: number) => {
    const normalizedRotation = newRotation % 360;

    // Update visual elements
    setVisualElements((prev) => {
      const updateElement = (elements: VisualElement[]): VisualElement[] => {
        return elements.map((el) => {
          if (el.id === elementId) {
            return { ...el, rotation: normalizedRotation };
          }
          if (el.children) {
            return { ...el, children: updateElement(el.children) };
          }
          return el;
        });
      };
      return updateElement(prev);
    });

    // Sync to locations
    setLocations((prev) => updateLocationInTree(prev, elementId, { rotation: normalizedRotation }));
  }, [setLocations]);

  return {
    // State
    visualElements,
    warehouseDimensions,

    // Setters
    setVisualElements,
    setWarehouseDimensions,

    // Handlers
    handleElementMove,
    handleElementResize,
    handleElementRotate,
  };
}
