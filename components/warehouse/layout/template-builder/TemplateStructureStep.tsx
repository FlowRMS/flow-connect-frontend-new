'use client';

import React from 'react';
import type { TemplateStructureStepProps } from './types';
import { getEnabledLevelOrder, calculateTotalLocations } from './generateTemplateLocations';
import { LevelIcons, levelColors, levelLabels } from '../constants';

export default function TemplateStructureStep({
  enabledLevels,
  config,
  onChange,
}: TemplateStructureStepProps) {
  const orderedLevels = getEnabledLevelOrder(enabledLevels);
  const { total, perLevel } = calculateTotalLocations(config, enabledLevels);

  const handleCountChange = (level: string, value: string) => {
    const num = Math.max(0, Math.min(100, parseInt(value) || 0));
    onChange({
      counts: { ...config.counts, [level]: num },
    });
  };

  return (
    <div className="space-y-4">
      {/* Hierarchy indicator */}
      <div className="px-3 py-2 bg-[var(--muted)] rounded-lg">
        <p className="text-xs text-[var(--muted-foreground)] mb-1">Based on your warehouse configuration:</p>
        <div className="flex items-center gap-1 flex-wrap">
          {orderedLevels.map((level, idx) => (
            <React.Fragment key={level}>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${levelColors[level]?.bg} ${levelColors[level]?.text}`}>
                {levelLabels[level] || level}
              </span>
              {idx < orderedLevels.length - 1 && (
                <svg className="w-3 h-3 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Structure inputs */}
      <div className="space-y-1">
        {orderedLevels.map((level, idx) => {
          const colors = levelColors[level];
          const parentLevel = idx > 0 ? orderedLevels[idx - 1] : null;
          const label = idx === 0
            ? `How many ${(levelLabels[level] || level).toLowerCase()}s?`
            : `${levelLabels[level] || level}s per ${(levelLabels[parentLevel!] || parentLevel!).toLowerCase()}:`;

          return (
            <div
              key={level}
              className="flex items-center gap-3 py-2"
              style={{ paddingLeft: `${idx * 20}px` }}
            >
              {/* Connector line */}
              {idx > 0 && (
                <div className="flex items-center">
                  <span className="text-[var(--muted-foreground)] text-xs">└─</span>
                </div>
              )}

              {/* Icon */}
              <span className={`${colors?.text || ''} flex-shrink-0`}>
                {LevelIcons[level]}
              </span>

              {/* Label */}
              <span className="text-xs text-[var(--foreground)] flex-1 min-w-0">
                {label}
              </span>

              {/* Count input */}
              <input
                type="number"
                min="0"
                max="100"
                value={config.counts[level] || 0}
                onChange={(e) => handleCountChange(level, e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-16 px-2 py-1 text-xs text-center border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {total > 0 && (
        <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
            This will create {total} locations:
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {orderedLevels.map((level) => {
              const count = perLevel[level];
              if (!count) return null;
              return (
                <span
                  key={level}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${levelColors[level]?.bg} ${levelColors[level]?.text}`}
                >
                  {count} {levelLabels[level] || level}{count !== 1 ? 's' : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
