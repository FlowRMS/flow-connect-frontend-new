'use client';

import React from 'react';
import { TerritoryTreeItem } from './TerritoryTreeItem';
import { type TerritoryTreeNode } from '../api/useTerritories';
import { type TerritoryType } from '../../lib/graphql/territories';

interface TerritoryTreeProps {
  tree: TerritoryTreeNode[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (node: TerritoryTreeNode) => void;
  onAddRegion: () => void;
  onAddChild: (parentId: string, parentType: TerritoryType) => void;
  onDelete: (node: TerritoryTreeNode) => void;
}

export function TerritoryTree({
  tree,
  isLoading,
  selectedId,
  onSelect,
  onAddRegion,
  onAddChild,
  onDelete,
}: TerritoryTreeProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-10 bg-[var(--muted)]/50 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-[var(--muted-foreground)]"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="font-medium text-[var(--foreground)] mb-1">No territories yet</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Create your first region to start building your territory hierarchy.
        </p>
        <button
          onClick={onAddRegion}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Add Region
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {tree.map((region) => (
        <TerritoryTreeItem
          key={region.id}
          node={region}
          level={0}
          selectedId={selectedId}
          onSelect={onSelect}
          onAddChild={onAddChild}
          onDelete={onDelete}
          defaultExpanded
        />
      ))}
    </div>
  );
}

interface TerritoryTreeHeaderProps {
  onAddRegion: () => void;
  totalCount: number;
}

export function TerritoryTreeHeader({ onAddRegion, totalCount }: TerritoryTreeHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
      <div>
        <h3 className="font-medium text-[var(--foreground)]">Territory Hierarchy</h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          {totalCount} territor{totalCount !== 1 ? 'ies' : 'y'}
        </p>
      </div>
      <button
        onClick={onAddRegion}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Add Region
      </button>
    </div>
  );
}
