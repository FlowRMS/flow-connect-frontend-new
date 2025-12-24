// Location Management Hook

import { useState, useCallback } from 'react';
import type { WarehouseLocation, WarehouseLocationLevel, AvailableProduct } from '../types';
import { buildLocationTree, updateLocationInTree, removeLocationFromTree, addLocationToTree } from '../utils';
import { levelLabels } from '../constants';

export interface UseLocationManagementProps {
  warehouseId?: string;
  enabledLevels: WarehouseLocationLevel[];
}

export function useLocationManagement({ warehouseId = 'WH-001', enabledLevels }: UseLocationManagementProps) {
  // State
  const [locations, setLocations] = useState<WarehouseLocation[]>(() => buildLocationTree(warehouseId));
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['SEC-001', 'SEC-002', 'AISLE-001', 'AISLE-002'])
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState<string | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Helper: Get next level type after current type
  const getNextLevelType = useCallback(
    (currentType: string): WarehouseLocationLevel | null => {
      const typeOrder: WarehouseLocationLevel[] = ['section', 'aisle', 'shelf', 'bay', 'row', 'bin'];
      const currentIndex = typeOrder.indexOf(currentType as WarehouseLocationLevel);
      for (let i = currentIndex + 1; i < typeOrder.length; i++) {
        if (enabledLevels.includes(typeOrder[i])) return typeOrder[i];
      }
      return null;
    },
    [enabledLevels]
  );

  // Helper: Check if this is the bottom level
  const isBottomLevel = useCallback(
    (type: string): boolean => {
      return getNextLevelType(type) === null;
    },
    [getNextLevelType]
  );

  // Toggle node expanded/collapsed
  const toggleNode = useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Add child location to a parent
  const addChildLocation = useCallback(
    (parentId: string, parentType: string) => {
      const nextType = getNextLevelType(parentType);
      if (!nextType) return;

      const newEntity: WarehouseLocation = {
        id: `${nextType.toUpperCase()}-${Date.now()}`,
        name: `New ${levelLabels[nextType]}`,
        type: nextType,
        parentId,
        isActive: true,
        children: [],
        products: [],
      };

      setLocations((prev) => addLocationToTree(prev, parentId, newEntity));
      setExpandedNodes((prev) => new Set([...prev, parentId]));
      setTimeout(() => setEditingId(newEntity.id), 50);
    },
    [getNextLevelType]
  );

  // Add a new root section
  const addSection = useCallback(() => {
    const newSection: WarehouseLocation = {
      id: `SECTION-${Date.now()}`,
      name: 'New Section',
      type: 'section',
      isActive: true,
      children: [],
      products: [],
    };
    setLocations((prev) => [...prev, newSection]);
    setTimeout(() => setEditingId(newSection.id), 50);
  }, []);

  // Add section at specific position (for visual builder)
  const addSectionAtPosition = useCallback((x: number, y: number) => {
    const newSection: WarehouseLocation = {
      id: `SECTION-${Date.now()}`,
      name: 'New Section',
      type: 'section',
      isActive: true,
      x,
      y,
      width: 300,
      height: 200,
      children: [],
      products: [],
    };
    setLocations((prev) => [...prev, newSection]);
    return newSection.id;
  }, []);

  // Rename a location
  const renameLocation = useCallback((id: string, newName: string) => {
    if (!newName.trim()) return;
    setLocations((prev) => updateLocationInTree(prev, id, { name: newName }));
    setEditingId(null);
  }, []);

  // Delete a location
  const deleteLocation = useCallback((id: string) => {
    setLocations((prev) => removeLocationFromTree(prev, id));
  }, []);

  // Update location properties
  const updateLocation = useCallback((id: string, updates: Partial<WarehouseLocation>) => {
    setLocations((prev) => updateLocationInTree(prev, id, updates));
  }, []);

  // Add product to bin
  const addProduct = useCallback((binId: string, product: AvailableProduct) => {
    setLocations((prev) => {
      const addProductToLocation = (items: WarehouseLocation[]): WarehouseLocation[] => {
        return items.map((item) => {
          if (item.id === binId) {
            const newProduct = {
              id: `PROD-${Date.now()}`,
              productId: product.id,
              productName: product.name,
              partNumber: product.partNumber,
              quantity: 0,
            };
            return { ...item, products: [...(item.products || []), newProduct] };
          }
          if (item.children) return { ...item, children: addProductToLocation(item.children) };
          return item;
        });
      };
      return addProductToLocation(prev);
    });
    setShowProductSearch(null);
    setProductSearchQuery('');
  }, []);

  // Remove product from bin
  const removeProduct = useCallback((binId: string, productAssignmentId: string) => {
    setLocations((prev) => {
      const removeProductFromLocation = (items: WarehouseLocation[]): WarehouseLocation[] => {
        return items.map((item) => {
          if (item.id === binId) {
            return { ...item, products: (item.products || []).filter((p) => p.id !== productAssignmentId) };
          }
          if (item.children) return { ...item, children: removeProductFromLocation(item.children) };
          return item;
        });
      };
      return removeProductFromLocation(prev);
    });
  }, []);

  return {
    // State
    locations,
    expandedNodes,
    editingId,
    searchQuery,
    showProductSearch,
    productSearchQuery,

    // Setters
    setLocations,
    setExpandedNodes,
    setEditingId,
    setSearchQuery,
    setShowProductSearch,
    setProductSearchQuery,

    // Handlers
    toggleNode,
    addChildLocation,
    addSection,
    addSectionAtPosition,
    renameLocation,
    deleteLocation,
    updateLocation,
    addProduct,
    removeProduct,

    // Helpers
    getNextLevelType,
    isBottomLevel,
  };
}
