// Container types management hook

import { useState, useCallback } from 'react';
import type { ContainerType } from '../types';
import { mockContainerTypes } from '../mockData';

export function useContainerTypes() {
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>(mockContainerTypes);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [draggedContainerId, setDraggedContainerId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const addContainer = useCallback(() => {
    const newContainer: ContainerType = {
      id: `CT${Date.now()}`,
      name: 'New Container',
      length: 12,
      width: 12,
      height: 12,
      weight: 0,
      order: containerTypes.length,
    };
    setContainerTypes((prev) => [...prev, newContainer]);
    setEditingContainerId(newContainer.id);
    setHasChanges(true);
  }, [containerTypes.length]);

  const updateContainer = useCallback((id: string, updates: Partial<ContainerType>) => {
    setContainerTypes((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    setHasChanges(true);
  }, []);

  const deleteContainer = useCallback((id: string) => {
    const filtered = containerTypes.filter((c) => c.id !== id);
    // Re-order remaining containers
    const reordered = filtered.map((c, idx) => ({ ...c, order: idx }));
    setContainerTypes(reordered);
    setHasChanges(true);
  }, [containerTypes]);

  const startDrag = useCallback((containerId: string) => {
    setDraggedContainerId(containerId);
  }, []);

  const handleDragOver = useCallback(
    (targetId: string) => {
      if (!draggedContainerId || draggedContainerId === targetId) return;

      const draggedIndex = containerTypes.findIndex((c) => c.id === draggedContainerId);
      const targetIndex = containerTypes.findIndex((c) => c.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newContainers = [...containerTypes];
      const [draggedItem] = newContainers.splice(draggedIndex, 1);
      newContainers.splice(targetIndex, 0, draggedItem);

      // Update order values
      const reordered = newContainers.map((c, idx) => ({ ...c, order: idx }));
      setContainerTypes(reordered);
    },
    [containerTypes, draggedContainerId]
  );

  const endDrag = useCallback(() => {
    if (draggedContainerId) {
      setHasChanges(true);
    }
    setDraggedContainerId(null);
  }, [draggedContainerId]);

  const resetChanges = useCallback(() => {
    setHasChanges(false);
  }, []);

  const sortedContainers = [...containerTypes].sort((a, b) => a.order - b.order);

  return {
    containerTypes: sortedContainers,
    editingContainerId,
    draggedContainerId,
    hasChanges,
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
