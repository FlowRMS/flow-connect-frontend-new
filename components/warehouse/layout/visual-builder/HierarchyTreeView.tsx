'use client';

import React from 'react';
import type { WarehouseLocation } from '../types';
import { LevelIcons, levelColors } from '../constants';

interface HierarchyTreeViewProps {
  locations: WarehouseLocation[];
  selectedElementId: string | null;
  pathToSelected: string[];
  onElementSelect: (id: string | null) => void;
}

export default function HierarchyTreeView({
  locations,
  selectedElementId,
  pathToSelected,
  onElementSelect,
}: HierarchyTreeViewProps) {
  const renderHierarchyNode = (location: WarehouseLocation, depth: number = 0): React.ReactNode => {
    const colors = levelColors[location.type];
    const hasChildren = location.children && location.children.length > 0;
    const hasProducts = location.products && location.products.length > 0;
    const isSelected = selectedElementId === location.id;
    const isInPath = pathToSelected.includes(location.id);

    return (
      <div key={location.id} className="text-[10px]">
        <div
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-400'
              : isInPath
                ? 'bg-blue-50 dark:bg-blue-900/10'
                : 'hover:bg-[var(--accent)]'
          }`}
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          onClick={() => onElementSelect(location.id)}
        >
          <span className={colors.text}>{LevelIcons[location.type]}</span>
          <span className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-[var(--foreground)]'}`}>
            {location.name}
          </span>
          {hasProducts && (
            <span className="ml-auto text-[9px] px-1 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
              {location.products!.length}
            </span>
          )}
        </div>
        {hasChildren && (
          <div>
            {location.children!.map((child) => renderHierarchyNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute right-4 top-4 w-56 max-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-[var(--border)] overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--muted)]">
        <div className="text-xs font-semibold text-[var(--foreground)]">Hierarchy</div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {locations.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)] text-xs">
            No locations yet
          </div>
        ) : (
          locations.map((location) => renderHierarchyNode(location, 0))
        )}
      </div>
    </div>
  );
}
