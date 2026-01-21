// Location Management Hook

import { useState, useCallback, useEffect } from 'react';
import type { WarehouseLocation, WarehouseLocationLevel, AvailableProduct } from '../types';
import {
  buildLocationTreeFromApi,
  buildEmptyLocationTree,
  updateLocationInTree,
  removeLocationFromTree,
  addLocationToTree,
  convertLocationsToApiInput,
} from '../utils';
import { levelLabels } from '../constants';
import {
  useWarehouseLocationTreeQuery,
  useBulkSaveWarehouseLocations,
  useBulkAssignProductsToLocations,
  useBulkRemoveProductsFromLocations,
} from '../../settings/api/useWarehouseLocationsApi';

/** Check if a string is a valid UUID */
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export interface UseLocationManagementProps {
  warehouseId?: string;
  enabledLevels: WarehouseLocationLevel[];
}

export function useLocationManagement({ warehouseId, enabledLevels }: UseLocationManagementProps) {
  // Fetch locations from API
  const {
    data: apiLocations,
    isLoading,
    error,
    refetch,
  } = useWarehouseLocationTreeQuery(warehouseId || null);

  // Bulk save mutation
  const bulkSaveMutation = useBulkSaveWarehouseLocations();

  // Product assignment mutations (bulk for efficiency)
  const bulkAssignMutation = useBulkAssignProductsToLocations();
  const bulkRemoveMutation = useBulkRemoveProductsFromLocations();

  // Local state for locations (initialized from API)
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track pending product removals for save (products to remove from DB)
  const [pendingProductRemovals, setPendingProductRemovals] = useState<
    Array<{ locationId: string; productId: string }>
  >([]);

  // Update local state when API data changes
  useEffect(() => {
    if (apiLocations) {
      setLocations(buildLocationTreeFromApi(apiLocations));
      setHasUnsavedChanges(false);
      // Clear pending product removals when data refreshes from server
      setPendingProductRemovals([]);
    } else if (!isLoading && !error) {
      setLocations(buildEmptyLocationTree());
    }
  }, [apiLocations, isLoading, error]);

  // Track changes - wrap setLocations to track unsaved changes
  const setLocationsWithTracking = useCallback(
    (updater: WarehouseLocation[] | ((prev: WarehouseLocation[]) => WarehouseLocation[])) => {
      setLocations(updater);
      setHasUnsavedChanges(true);
    },
    []
  );

  // Helper to collect NEW products (with temp IDs like PROD-xxx) from local state
  const collectNewProductsFromLocations = useCallback(
    (locs: WarehouseLocation[]): Array<{ tempLocationId: string; productId: string; quantity: number }> => {
      const result: Array<{ tempLocationId: string; productId: string; quantity: number }> = [];
      const traverse = (items: WarehouseLocation[]) => {
        for (const item of items) {
          if (item.products && item.products.length > 0) {
            for (const product of item.products) {
              // Only include products with temp IDs (newly added, not yet saved)
              // Real UUIDs mean they already exist in the database
              if (product.id.startsWith('PROD-')) {
                result.push({
                  tempLocationId: item.id,
                  productId: product.productId,
                  quantity: product.quantity,
                });
              }
            }
          }
          if (item.children) {
            traverse(item.children);
          }
        }
      };
      traverse(locs);
      return result;
    },
    []
  );

  // Save to backend
  const saveLocations = useCallback(async () => {
    if (!warehouseId) return;

    // Collect NEW products (with temp IDs) from current local state BEFORE saving
    // This captures products added in this session on both new and existing locations
    const newProducts = collectNewProductsFromLocations(locations);

    // 1. Save location structure first
    const apiInput = convertLocationsToApiInput(locations);
    const savedLocations = await bulkSaveMutation.mutateAsync({
      warehouseId,
      locations: apiInput,
    });

    // 2. Build a mapping from temp IDs to real UUIDs
    // The bulk save returns locations in the same order as input (flattened)
    const tempIdToRealId = new Map<string, string>();
    apiInput.forEach((input, index) => {
      if (savedLocations[index]) {
        // Map both the real ID (if existed) and temp ID (if new) to the saved ID
        if (input.id) {
          tempIdToRealId.set(input.id, savedLocations[index].id);
        }
        if (input.tempId) {
          tempIdToRealId.set(input.tempId, savedLocations[index].id);
        }
      }
    });

    // 3. Process product removals in bulk (single API call)
    const removalsToProcess = pendingProductRemovals
      .map((removal) => {
        const realLocationId = tempIdToRealId.get(removal.locationId) || removal.locationId;
        if (isValidUUID(realLocationId)) {
          return { locationId: realLocationId, productId: removal.productId };
        }
        return null;
      })
      .filter((r): r is { locationId: string; productId: string } => r !== null);

    if (removalsToProcess.length > 0) {
      try {
        await bulkRemoveMutation.mutateAsync({
          removals: removalsToProcess,
          warehouseId,
        });
      } catch (e) {
        console.error('Failed to bulk remove product assignments:', e);
      }
    }

    // 4. Process new product additions in bulk (single API call)
    const assignmentsToProcess = newProducts
      .map((addition) => {
        const realLocationId = tempIdToRealId.get(addition.tempLocationId) || addition.tempLocationId;
        if (isValidUUID(realLocationId)) {
          return {
            locationId: realLocationId,
            productId: addition.productId,
            quantity: addition.quantity,
          };
        }
        return null;
      })
      .filter((a): a is { locationId: string; productId: string; quantity: number } => a !== null);

    if (assignmentsToProcess.length > 0) {
      try {
        await bulkAssignMutation.mutateAsync({
          assignments: assignmentsToProcess,
          warehouseId,
        });
      } catch (e) {
        console.error('Failed to bulk assign products:', e);
      }
    }

    // 5. Clear pending changes and refresh
    setPendingProductRemovals([]);
    setHasUnsavedChanges(false);
    await refetch();
  }, [
    warehouseId,
    locations,
    pendingProductRemovals,
    collectNewProductsFromLocations,
    bulkSaveMutation,
    bulkAssignMutation,
    bulkRemoveMutation,
    refetch,
  ]);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
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

      setLocationsWithTracking((prev) => addLocationToTree(prev, parentId, newEntity));
      setExpandedNodes((prev) => new Set([...prev, parentId]));
      setTimeout(() => setEditingId(newEntity.id), 50);
    },
    [getNextLevelType, setLocationsWithTracking]
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
    setLocationsWithTracking((prev) => [...prev, newSection]);
    setTimeout(() => setEditingId(newSection.id), 50);
  }, [setLocationsWithTracking]);

  // Add section at specific position (for visual builder)
  const addSectionAtPosition = useCallback(
    (x: number, y: number) => {
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
      setLocationsWithTracking((prev) => [...prev, newSection]);
      return newSection.id;
    },
    [setLocationsWithTracking]
  );

  // Rename a location
  const renameLocation = useCallback(
    (id: string, newName: string) => {
      if (!newName.trim()) return;
      setLocationsWithTracking((prev) => updateLocationInTree(prev, id, { name: newName }));
      setEditingId(null);
    },
    [setLocationsWithTracking]
  );

  // Delete a location
  const deleteLocation = useCallback(
    (id: string) => {
      setLocationsWithTracking((prev) => removeLocationFromTree(prev, id));
    },
    [setLocationsWithTracking]
  );

  // Update location properties
  const updateLocation = useCallback(
    (id: string, updates: Partial<WarehouseLocation>) => {
      setLocationsWithTracking((prev) => updateLocationInTree(prev, id, updates));
    },
    [setLocationsWithTracking]
  );

  // Add product to bin
  const addProduct = useCallback(
    (binId: string, product: AvailableProduct) => {
      // Update local state - products with PROD- prefix IDs will be saved on next save
      setLocationsWithTracking((prev) => {
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
    },
    [setLocationsWithTracking]
  );

  // Remove product from bin
  const removeProduct = useCallback(
    (binId: string, productAssignmentId: string, productId: string) => {
      // Track for API call on save - only for products that exist in DB (real UUIDs)
      // Products with PROD- prefix are local-only and don't need API removal
      if (isValidUUID(binId) && isValidUUID(productAssignmentId)) {
        setPendingProductRemovals((prev) => [...prev, { locationId: binId, productId }]);
      }

      // Update local state
      setLocationsWithTracking((prev) => {
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
    },
    [setLocationsWithTracking]
  );

  return {
    // State
    locations,
    expandedNodes,
    editingId,
    searchQuery,
    showProductSearch,
    productSearchQuery,

    // Loading state
    isLoading,
    error,
    hasUnsavedChanges,
    isSaving: bulkSaveMutation.isPending,

    // Setters
    setLocations: setLocationsWithTracking,
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
    saveLocations,

    // Helpers
    getNextLevelType,
    isBottomLevel,
  };
}
