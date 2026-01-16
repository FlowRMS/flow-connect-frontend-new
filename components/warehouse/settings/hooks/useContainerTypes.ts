// Container types management hook with backend API integration

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useContainerTypesQuery,
  useCreateContainerType,
  useUpdateContainerType,
  useDeleteContainerType,
  useReorderContainerTypes,
  containerTypesQueryKeys,
  type ContainerType as ApiContainerType,
} from '../api';

// Local container type with 'order' field for backward compatibility with UI
export interface ContainerType {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  order: number;
}

// Convert API response to local format
const toLocalFormat = (ct: ApiContainerType): ContainerType => ({
  id: ct.id,
  name: ct.name,
  length: Number(ct.length),
  width: Number(ct.width),
  height: Number(ct.height),
  weight: Number(ct.weight),
  order: ct.position,
});

export function useContainerTypes() {
  const queryClient = useQueryClient();

  // React Query hooks for backend API
  const { data: apiContainerTypes, isLoading, error } = useContainerTypesQuery();
  const createMutation = useCreateContainerType();
  const updateMutation = useUpdateContainerType();
  const deleteMutation = useDeleteContainerType();
  const reorderMutation = useReorderContainerTypes();

  // Local state for optimistic UI updates and editing
  const [localContainerTypes, setLocalContainerTypes] = useState<ContainerType[]>([]);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [draggedContainerId, setDraggedContainerId] = useState<string | null>(null);
  const [pendingReorder, setPendingReorder] = useState<string[] | null>(null);

  // Refs for tracking modifications
  const pendingUpdatesRef = useRef<Map<string, Partial<ContainerType>>>(new Map());
  const pendingCreatesRef = useRef<Set<string>>(new Set()); // Track locally-created containers not yet saved
  const pendingDeletesRef = useRef<Set<string>>(new Set()); // Track containers to delete on save
  const isSavingRef = useRef(false);
  const localContainerTypesRef = useRef<ContainerType[]>([]); // Ref to access current state in callbacks

  // Keep ref in sync with state
  useEffect(() => {
    localContainerTypesRef.current = localContainerTypes;
  }, [localContainerTypes]);

  // Sync API data to local state (only for containers without pending updates)
  // Skip sync if we're actively dragging (pendingReorder) or have a pending reorder to save (pendingReorderRef)
  useEffect(() => {
    if (apiContainerTypes && !pendingReorder && !pendingReorderRef.current) {
      setLocalContainerTypes((prev) => {
        // If we have no local state yet, use API data
        if (prev.length === 0 && pendingCreatesRef.current.size === 0) {
          return apiContainerTypes.map(toLocalFormat);
        }

        // Only update containers that don't have pending updates
        const pendingIds = new Set(pendingUpdatesRef.current.keys());
        const pendingCreateIds = pendingCreatesRef.current;

        // Map API data but preserve local state for containers with pending edits
        const apiMap = new Map(apiContainerTypes.map((c) => [c.id, toLocalFormat(c)]));
        const prevMap = new Map(prev.map((c) => [c.id, c]));

        // Build merged list: use local state for pending, API data for others
        const merged: ContainerType[] = [];

        // First, add all containers from API (in their order)
        for (const apiContainer of apiContainerTypes) {
          const id = apiContainer.id;
          if (pendingIds.has(id) && prevMap.has(id)) {
            // Keep local state for containers with pending updates
            merged.push(prevMap.get(id)!);
          } else {
            // Use API data for containers without pending updates
            merged.push(toLocalFormat(apiContainer));
          }
        }

        // Add locally-created containers not yet saved to API
        for (const localContainer of prev) {
          if (pendingCreateIds.has(localContainer.id)) {
            merged.push(localContainer);
          }
        }

        return merged;
      });
    }
  }, [apiContainerTypes, pendingReorder]);


  // Track pending modifications (for UI state)
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [hasPendingCreates, setHasPendingCreates] = useState(false);
  const [hasPendingDeletes, setHasPendingDeletes] = useState(false);
  const [hasPendingReorder, setHasPendingReorder] = useState(false);
  const pendingReorderRef = useRef<string[] | null>(null); // Track final order for save

  // Track if there are unsaved changes (includes pending modifications)
  const hasChanges =
    hasPendingChanges ||
    hasPendingCreates ||
    hasPendingDeletes ||
    hasPendingReorder ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    reorderMutation.isPending;

  const addContainer = useCallback(() => {
    const newPosition = localContainerTypesRef.current.length;
    // Generate a temporary local ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newContainer: ContainerType = {
      id: tempId,
      name: 'New Container',
      length: 12,
      width: 12,
      height: 12,
      weight: 0,
      order: newPosition,
    };

    // Add to local state
    setLocalContainerTypes((prev) => [...prev, newContainer]);

    // Track as pending create
    pendingCreatesRef.current.add(tempId);
    setHasPendingCreates(true);

    // Start editing the new container
    setEditingContainerId(tempId);
  }, []);

  const updateContainer = useCallback(
    (id: string, updates: Partial<ContainerType>) => {
      // Update local state immediately for responsive UI
      setLocalContainerTypes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );

      // Track this container as having pending changes
      const existing = pendingUpdatesRef.current.get(id) || {};
      pendingUpdatesRef.current.set(id, { ...existing, ...updates });
      setHasPendingChanges(true);
    },
    []
  );

  // Save all pending changes (called manually by user)
  const saveChanges = useCallback(async () => {
    if (isSavingRef.current) return;

    const hasUpdates = pendingUpdatesRef.current.size > 0;
    const hasCreates = pendingCreatesRef.current.size > 0;
    const hasDeletes = pendingDeletesRef.current.size > 0;
    const hasReorder = pendingReorderRef.current !== null;

    if (!hasUpdates && !hasCreates && !hasDeletes && !hasReorder) return;

    isSavingRef.current = true;

    // Snapshot pending changes
    const updates = new Map(pendingUpdatesRef.current);
    const creates = new Set(pendingCreatesRef.current);
    const deletes = new Set(pendingDeletesRef.current);
    const reorderIds = pendingReorderRef.current ? [...pendingReorderRef.current] : null;

    // Clear refs immediately
    pendingUpdatesRef.current.clear();
    pendingCreatesRef.current.clear();
    pendingDeletesRef.current.clear();
    pendingReorderRef.current = null;
    setHasPendingChanges(false);
    setHasPendingCreates(false);
    setHasPendingDeletes(false);
    setHasPendingReorder(false);

    // Map to track temp ID -> real ID for newly created containers
    const tempToRealId = new Map<string, string>();

    try {
      // 1. Handle deletes first (for existing containers only)
      for (const deleteId of deletes) {
        // Skip if this is a locally-created container that was never saved
        if (deleteId.startsWith('temp-')) continue;

        try {
          await deleteMutation.mutateAsync(deleteId);
        } catch (err) {
          console.error('Failed to delete container type:', err);
        }
      }

      // 2. Handle creates
      for (const tempId of creates) {
        const container = localContainerTypesRef.current.find((c) => c.id === tempId);
        if (!container) continue;

        try {
          const created = await createMutation.mutateAsync({
            name: container.name,
            length: container.length,
            width: container.width,
            height: container.height,
            weight: container.weight,
            position: container.order,
          });

          tempToRealId.set(tempId, created.id);
        } catch (err) {
          console.error('Failed to create container type:', err);
        }
      }

      // 3. Handle updates (only for existing containers, not temp ones)
      for (const [containerId] of updates) {
        // Skip if this was a temp container (handled in creates)
        if (containerId.startsWith('temp-')) continue;

        const current = localContainerTypesRef.current.find((c) => c.id === containerId);
        if (!current) continue;

        try {
          await updateMutation.mutateAsync({
            id: containerId,
            input: {
              name: current.name,
              length: current.length,
              width: current.width,
              height: current.height,
              weight: current.weight,
              position: current.order,
            },
          });
        } catch (err) {
          console.error('Failed to update container type:', err);
        }
      }

      // 4. Update local state to replace temp IDs with real IDs
      if (tempToRealId.size > 0) {
        setLocalContainerTypes((prev) =>
          prev.map((c) => {
            const realId = tempToRealId.get(c.id);
            return realId ? { ...c, id: realId } : c;
          })
        );
      }

      // 5. Handle reorder (if any) - replace temp IDs with real IDs in the order list
      if (reorderIds && reorderIds.length > 0) {
        // Replace temp IDs with real IDs in the reorder list
        const finalOrderIds = reorderIds
          .map((id) => tempToRealId.get(id) || id)
          .filter((id) => !id.startsWith('temp-')); // Filter out any remaining temp IDs (shouldn't happen)

        // Only call reorder if we have real IDs to reorder
        if (finalOrderIds.length > 0) {
          try {
            await reorderMutation.mutateAsync(finalOrderIds);
          } catch (err) {
            console.error('Failed to reorder container types:', err);
          }
        }
      }

      // 6. Invalidate queries to sync with backend after all operations complete
      await queryClient.invalidateQueries({ queryKey: containerTypesQueryKeys.all });
    } catch (err) {
      console.error('Failed to save changes:', err);
      // Revert optimistic update on error
      if (apiContainerTypes) {
        setLocalContainerTypes(apiContainerTypes.map(toLocalFormat));
      }
    }

    isSavingRef.current = false;
  }, [apiContainerTypes, createMutation, updateMutation, deleteMutation, reorderMutation, queryClient]);

  const deleteContainer = useCallback(
    (id: string) => {
      // Remove from local state immediately
      setLocalContainerTypes((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        return filtered.map((c, idx) => ({ ...c, order: idx }));
      });

      // If this is a temp container (never saved), just remove from pending creates
      if (id.startsWith('temp-')) {
        pendingCreatesRef.current.delete(id);
        setHasPendingCreates(pendingCreatesRef.current.size > 0);
      } else {
        // Track for deletion on save
        pendingDeletesRef.current.add(id);
        setHasPendingDeletes(true);
      }

      // Clean up any pending updates for this container
      pendingUpdatesRef.current.delete(id);
    },
    []
  );

  const startDrag = useCallback((containerId: string) => {
    setDraggedContainerId(containerId);
  }, []);

  const handleDragOver = useCallback(
    (targetId: string) => {
      if (!draggedContainerId || draggedContainerId === targetId) return;

      const draggedIndex = localContainerTypes.findIndex((c) => c.id === draggedContainerId);
      const targetIndex = localContainerTypes.findIndex((c) => c.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newContainers = [...localContainerTypes];
      const [draggedItem] = newContainers.splice(draggedIndex, 1);
      newContainers.splice(targetIndex, 0, draggedItem);

      // Update order values locally
      const reordered = newContainers.map((c, idx) => ({ ...c, order: idx }));
      setLocalContainerTypes(reordered);

      // Track the pending reorder (for visual drag state)
      setPendingReorder(reordered.map((c) => c.id));

      // Track for save - store the new order
      pendingReorderRef.current = reordered.map((c) => c.id);
      setHasPendingReorder(true);
    },
    [localContainerTypes, draggedContainerId]
  );

  const endDrag = useCallback(() => {
    // Just clear drag state - reorder will be saved when user clicks Save
    setDraggedContainerId(null);
    setPendingReorder(null);
  }, []);

  const resetChanges = useCallback(() => {
    // Clear all pending changes and refetch from API
    pendingUpdatesRef.current.clear();
    pendingCreatesRef.current.clear();
    pendingDeletesRef.current.clear();
    pendingReorderRef.current = null;
    setHasPendingChanges(false);
    setHasPendingCreates(false);
    setHasPendingDeletes(false);
    setHasPendingReorder(false);
    if (apiContainerTypes) {
      setLocalContainerTypes(apiContainerTypes.map(toLocalFormat));
    }
  }, [apiContainerTypes]);

  const sortedContainers = [...localContainerTypes].sort((a, b) => a.order - b.order);

  return {
    containerTypes: sortedContainers,
    editingContainerId,
    draggedContainerId,
    hasChanges,
    isLoading,
    error,
    addContainer,
    updateContainer,
    deleteContainer,
    saveChanges,
    startDrag,
    handleDragOver,
    endDrag,
    setEditingContainerId,
    resetChanges,
  };
}
