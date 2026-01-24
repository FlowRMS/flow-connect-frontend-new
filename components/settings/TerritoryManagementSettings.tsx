'use client';

import React, { useState, useMemo } from 'react';
import {
  TerritoryTree,
  TerritoryTreeHeader,
  TerritoryDetailPanel,
  TerritoryFormModal,
  DeleteTerritoryModal,
  useTerritoryTree,
  useTerritory,
  useCreateTerritory,
  useUpdateTerritory,
  useDeleteTerritory,
  type TerritoryTreeNode,
  type TerritoryType,
  type TerritoryInput,
  getChildTerritoryType,
} from '../territories';

export default function TerritoryManagementSettings() {
  const { tree, isLoading, refetch } = useTerritoryTree();
  const createTerritory = useCreateTerritory();
  const updateTerritory = useUpdateTerritory();
  const deleteTerritoryMutation = useDeleteTerritory();

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTerritoryId, setEditingTerritoryId] = useState<string | null>(null);
  const [parentForNew, setParentForNew] = useState<{
    id: string;
    type: TerritoryType;
    name: string;
  } | null>(null);

  // Delete confirmation state
  const [deletingTerritory, setDeletingTerritory] = useState<TerritoryTreeNode | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Get the territory being edited
  const { data: editingTerritory } = useTerritory(editingTerritoryId);

  // Count total territories
  const totalCount = useMemo(() => {
    let count = 0;
    const countNodes = (nodes: TerritoryTreeNode[]) => {
      nodes.forEach((node) => {
        count++;
        if (node.children) {
          countNodes(node.children);
        }
      });
    };
    countNodes(tree);
    return count;
  }, [tree]);

  // Filter tree by search term
  const filteredTree = useMemo(() => {
    if (!searchTerm) return tree;

    const filterNode = (node: TerritoryTreeNode): TerritoryTreeNode | null => {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.code.toLowerCase().includes(searchTerm.toLowerCase());

      const filteredChildren = node.children
        ?.map(filterNode)
        .filter((n): n is TerritoryTreeNode => n !== null);

      if (matchesSearch || (filteredChildren && filteredChildren.length > 0)) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
      return null;
    };

    return tree.map(filterNode).filter((n): n is TerritoryTreeNode => n !== null);
  }, [tree, searchTerm]);

  // Check if deleting territory has children
  const deletingHasChildren = useMemo(() => {
    if (!deletingTerritory) return false;
    return deletingTerritory.children && deletingTerritory.children.length > 0;
  }, [deletingTerritory]);

  // Handlers
  const handleAddRegion = () => {
    setEditingTerritoryId(null);
    setParentForNew(null);
    setIsFormModalOpen(true);
  };

  const handleAddChild = (parentId: string, parentType: TerritoryType) => {
    const findNode = (nodes: TerritoryTreeNode[]): TerritoryTreeNode | null => {
      for (const node of nodes) {
        if (node.id === parentId) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const parentNode = findNode(tree);
    if (parentNode) {
      setEditingTerritoryId(null);
      setParentForNew({
        id: parentId,
        type: parentType,
        name: parentNode.name,
      });
      setIsFormModalOpen(true);
    }
  };

  const handleSelect = (node: TerritoryTreeNode) => {
    setSelectedId(node.id);
  };

  const handleEdit = () => {
    if (selectedId) {
      setEditingTerritoryId(selectedId);
      setParentForNew(null);
      setIsFormModalOpen(true);
    }
  };

  const handleDelete = (node: TerritoryTreeNode) => {
    setDeletingTerritory(node);
  };

  const handleConfirmDelete = async () => {
    if (deletingTerritory) {
      await deleteTerritoryMutation.mutateAsync(deletingTerritory.id);
      if (selectedId === deletingTerritory.id) {
        setSelectedId(null);
      }
      setDeletingTerritory(null);
    }
  };

  const handleSave = async (input: TerritoryInput): Promise<{ id: string }> => {
    let savedId: string;
    if (editingTerritoryId) {
      const result = await updateTerritory.mutateAsync({ id: editingTerritoryId, input });
      savedId = result.id;
    } else {
      const result = await createTerritory.mutateAsync(input);
      setSelectedId(result.id);
      savedId = result.id;
    }
    // Note: Don't close modal or reset state here - the modal will handle that after manager changes
    refetch();
    return { id: savedId };
  };

  const handleCloseDetail = () => {
    setSelectedId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-[var(--muted-foreground)]">
              Create and manage your territory hierarchy. Territories can be assigned geographic
              boundaries and outside rep commission splits.
            </p>
            <div className="p-3 bg-[var(--muted)]/50 rounded-lg border border-[var(--border)]">
              <p className="text-sm text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--foreground)]">Hierarchy: </span>
                Region → Subregion → Territory. Splits cascade down: most granular level with
                splits applies, unless the customer has direct splits assigned.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search territories..."
          className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-[350px_1fr] gap-6 min-h-[500px]">
        {/* Left Panel - Tree */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden flex flex-col">
          <TerritoryTreeHeader onAddRegion={handleAddRegion} totalCount={totalCount} />
          <div className="flex-1 overflow-y-auto">
            <TerritoryTree
              tree={filteredTree}
              isLoading={isLoading}
              selectedId={selectedId}
              onSelect={handleSelect}
              onAddRegion={handleAddRegion}
              onAddChild={handleAddChild}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <TerritoryDetailPanel
            territoryId={selectedId}
            onEdit={handleEdit}
            onClose={handleCloseDetail}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span>
          {searchTerm
            ? `Showing ${filteredTree.length} matching region${filteredTree.length !== 1 ? 's' : ''}`
            : `${totalCount} territor${totalCount !== 1 ? 'ies' : 'y'} total`}
        </span>
      </div>

      {/* Form Modal */}
      <TerritoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingTerritoryId(null);
          setParentForNew(null);
        }}
        onSave={handleSave}
        territory={editingTerritory}
        parentId={parentForNew?.id}
        parentType={parentForNew?.type}
        parentName={parentForNew?.name}
      />

      {/* Delete Confirmation Modal */}
      {deletingTerritory && (
        <DeleteTerritoryModal
          isOpen={!!deletingTerritory}
          onClose={() => setDeletingTerritory(null)}
          onConfirm={handleConfirmDelete}
          territory={deletingTerritory}
          hasChildren={deletingHasChildren}
        />
      )}
    </div>
  );
}
