'use client';

import React, { useState } from 'react';
import { TerritoryBadge } from './TerritoryBadge';
import { type TerritoryTreeNode } from '../api/useTerritories';
import { type TerritoryType, getChildTerritoryType } from '../../lib/graphql/territories';

interface TerritoryTreeItemProps {
  node: TerritoryTreeNode;
  level: number;
  selectedId: string | null;
  onSelect: (node: TerritoryTreeNode) => void;
  onAddChild: (parentId: string, parentType: TerritoryType) => void;
  onDelete: (node: TerritoryTreeNode) => void;
  defaultExpanded?: boolean;
}

export function TerritoryTreeItem({
  node,
  level,
  selectedId,
  onSelect,
  onAddChild,
  onDelete,
  defaultExpanded = false,
}: TerritoryTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasChildren = node.children && node.children.length > 0;
  const canHaveChildren = getChildTerritoryType(node.territoryType) !== null;
  const isSelected = selectedId === node.id;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelect(node);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddChild(node.id, node.territoryType);
    setIsExpanded(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(node);
  };

  // Get summary of geographic coverage
  const getGeographySummary = (): string | null => {
    const parts: string[] = [];
    const fullNode = node as TerritoryTreeNode & {
      stateCodes?: string[];
      countyCodes?: string[];
      cityNames?: string[];
      zipCodes?: string[];
    };

    if (fullNode.stateCodes?.length) {
      parts.push(`${fullNode.stateCodes.length} state${fullNode.stateCodes.length !== 1 ? 's' : ''}`);
    }
    if (fullNode.countyCodes?.length) {
      parts.push(`${fullNode.countyCodes.length} count${fullNode.countyCodes.length !== 1 ? 'ies' : 'y'}`);
    }
    if (fullNode.cityNames?.length) {
      parts.push(`${fullNode.cityNames.length} cit${fullNode.cityNames.length !== 1 ? 'ies' : 'y'}`);
    }
    if (fullNode.zipCodes?.length) {
      parts.push(`${fullNode.zipCodes.length} zip${fullNode.zipCodes.length !== 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? parts.join(', ') : null;
  };

  // Get split rates summary
  const getSplitsSummary = (): string | null => {
    if (!node.splitRates || node.splitRates.length === 0) return null;
    return `${node.splitRates.length} rep${node.splitRates.length !== 1 ? 's' : ''}`;
  };

  const geographySummary = getGeographySummary();
  const splitsSummary = getSplitsSummary();

  return (
    <div>
      <div
        className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30'
            : 'hover:bg-[var(--muted)]/50'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={handleToggleExpand}
          className={`w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--muted)] transition-colors ${
            !hasChildren && !canHaveChildren ? 'invisible' : ''
          }`}
        >
          {hasChildren || canHaveChildren ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`text-[var(--muted-foreground)] transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            >
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)]/50" />
          )}
        </button>

        {/* Territory Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[var(--foreground)] truncate">
              {node.name}
            </span>
            <TerritoryBadge type={node.territoryType} />
            {!node.active && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-500">
                Inactive
              </span>
            )}
          </div>
          {(geographySummary || splitsSummary) && (
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--muted-foreground)]">
              {geographySummary && <span>{geographySummary}</span>}
              {geographySummary && splitsSummary && <span>•</span>}
              {splitsSummary && <span>{splitsSummary}</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canHaveChildren && (
            <button
              onClick={handleAddChild}
              className="p-1 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--primary)]"
              title={`Add ${getChildTerritoryType(node.territoryType)?.toLowerCase()}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-50 text-[var(--muted-foreground)] hover:text-red-500"
            title="Delete territory"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="mt-1">
          {node.children!.map((child) => (
            <TerritoryTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
