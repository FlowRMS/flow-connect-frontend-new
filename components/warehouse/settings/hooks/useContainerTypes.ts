// Container types management hook with backend API integration

import { useState, useCallback, useEffect } from 'react';
import {
  useContainerTypesQuery,
  useCreateContainerType,
  useUpdateContainerType,
  useDeleteContainerType,
  useReorderContainerTypes,
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

  // Sync API data to local state
  useEffect(() => {
    if (apiContainerTypes && !pendingReorder) {
      setLocalContainerTypes(apiContainerTypes.map(toLocalFormat));
    }
  }, [apiContainerTypes, pendingReorder]);

  // Track if there are unsaved changes
  const hasChanges =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    reorderMutation.isPending;

  const addContainer = useCallback(async () => {
    const newPosition = localContainerTypes.length;

    try {
      const created = await createMutation.mutateAsync({
        name: 'New Container',
        length: 12,
        width: 12,
        height: 12,
        weight: 0,
        position: newPosition,
      });

      // Start editing the newly created container
      setEditingContainerId(created.id);
    } catch (err) {
      console.error('Failed to create container type:', err);
    }
  }, [localContainerTypes.length, createMutation]);

  const updateContainer = useCallback(
    async (id: string, updates: Partial<ContainerType>) => {
      // Optimistically update local state
      setLocalContainerTypes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );

      // Find the current container to get all required fields
      const current = localContainerTypes.find((c) => c.id === id);
      if (!current) return;

      try {
        await updateMutation.mutateAsync({
          id,
          input: {
            name: updates.name ?? current.name,
            length: updates.length ?? current.length,
            width: updates.width ?? current.width,
            height: updates.height ?? current.height,
            weight: updates.weight ?? current.weight,
            position: updates.order ?? current.order,
          },
        });
      } catch (err) {
        console.error('Failed to update container type:', err);
        // Revert optimistic update on error
        if (apiContainerTypes) {
          setLocalContainerTypes(apiContainerTypes.map(toLocalFormat));
        }
      }
    },
    [localContainerTypes, apiContainerTypes, updateMutation]
  );

  const deleteContainer = useCallback(
    async (id: string) => {
      // Optimistically update local state
      const filtered = localContainerTypes.filter((c) => c.id !== id);
      const reordered = filtered.map((c, idx) => ({ ...c, order: idx }));
      setLocalContainerTypes(reordered);

      try {
        await deleteMutation.mutateAsync(id);

        // If there are remaining containers, reorder them on the backend
        if (reordered.length > 0) {
          const orderedIds = reordered.map((c) => c.id);
          await reorderMutation.mutateAsync(orderedIds);
        }
      } catch (err) {
        console.error('Failed to delete container type:', err);
        // Revert optimistic update on error
        if (apiContainerTypes) {
          setLocalContainerTypes(apiContainerTypes.map(toLocalFormat));
        }
      }
    },
    [localContainerTypes, apiContainerTypes, deleteMutation, reorderMutation]
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

      // Track the pending reorder
      setPendingReorder(reordered.map((c) => c.id));
    },
    [localContainerTypes, draggedContainerId]
  );

  const endDrag = useCallback(async () => {
    if (draggedContainerId && pendingReorder) {
      try {
        await reorderMutation.mutateAsync(pendingReorder);
      } catch (err) {
        console.error('Failed to reorder container types:', err);
        // Revert optimistic update on error
        if (apiContainerTypes) {
          setLocalContainerTypes(apiContainerTypes.map(toLocalFormat));
        }
      }
    }
    setDraggedContainerId(null);
    setPendingReorder(null);
  }, [draggedContainerId, pendingReorder, apiContainerTypes, reorderMutation]);

  const resetChanges = useCallback(() => {
    // Refetch from API
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
    startDrag,
    handleDragOver,
    endDrag,
    setEditingContainerId,
    resetChanges,
  };
}
