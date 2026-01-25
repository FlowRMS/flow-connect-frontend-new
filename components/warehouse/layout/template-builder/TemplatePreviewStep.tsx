'use client';

import React, { useState } from 'react';
import type { TemplatePreviewStepProps } from './types';
import type { WarehouseLocation } from '../types';
import { LevelIcons, levelColors, levelLabels } from '../constants';

export default function TemplatePreviewStep({
  locations,
  enabledLevels,
}: TemplatePreviewStepProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Auto-expand first section and its first children
    const expanded = new Set<string>();
    if (locations.length > 0) {
      expanded.add(locations[0].id);
      if (locations[0].children?.[0]) {
        expanded.add(locations[0].children[0].id);
      }
    }
    return expanded;
  });

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Calculate summary
  const summary: Record<string, number> = {};
  function countLocations(locs: WarehouseLocation[]) {
    for (const loc of locs) {
      summary[loc.type] = (summary[loc.type] || 0) + 1;
      if (loc.children?.length) {
        countLocations(loc.children);
      }
    }
  }
  countLocations(locations);
  const total = Object.values(summary).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-3">
      {/* Tree preview */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
        <div className="p-2">
          {locations.map((location) => (
            <PreviewNode
              key={location.id}
              location={location}
              depth={0}
              expandedNodes={expandedNodes}
              onToggle={toggleNode}
            />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Summary:</p>
        <div className="space-y-0.5">
          {enabledLevels.map((level) => {
            const count = summary[level];
            if (!count) return null;
            return (
              <div key={level} className="flex items-center gap-2">
                <span className={`${levelColors[level]?.text} flex-shrink-0`}>
                  {LevelIcons[level]}
                </span>
                <span className="text-xs text-[var(--foreground)]">
                  {count} {levelLabels[level] || level}{count !== 1 ? 's' : ''}
                </span>
              </div>
            );
          })}
          <div className="border-t border-[var(--border)] mt-1 pt-1">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Total: {total} locations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewNode({
  location,
  depth,
  expandedNodes,
  onToggle,
}: {
  location: WarehouseLocation;
  depth: number;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = location.children && location.children.length > 0;
  const isExpanded = expandedNodes.has(location.id);
  const colors = levelColors[location.type];

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-0.5 hover:bg-[var(--muted)] rounded px-1 cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => hasChildren && onToggle(location.id)}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <svg
            className={`w-3 h-3 text-[var(--muted-foreground)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <span className="w-3" />
        )}

        {/* Icon */}
        <span className={`${colors?.text || ''} flex-shrink-0`}>
          {LevelIcons[location.type]}
        </span>

        {/* Name */}
        <span className="text-xs text-[var(--foreground)]">{location.name}</span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {location.children!.map((child) => (
            <PreviewNode
              key={child.id}
              location={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
