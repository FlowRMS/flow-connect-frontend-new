'use client';

import React from 'react';
import type { TemplateNamingStepProps, LevelNaming } from './types';
import { getEnabledLevelOrder, generateSequentialName } from './generateTemplateLocations';
import { levelLabels } from '../constants';
import NamingConventionSelector from './NamingConventionSelector';

export default function TemplateNamingStep({
  enabledLevels,
  config,
  onChange,
}: TemplateNamingStepProps) {
  const orderedLevels = getEnabledLevelOrder(enabledLevels);

  const handleLevelChange = (level: string, levelConfig: LevelNaming) => {
    onChange({
      ...config,
      levels: { ...config.levels, [level]: levelConfig },
    });
  };

  // Generate example path based on current config
  const examplePath = orderedLevels.map((level, idx) => {
    const levelNaming = config.levels[level] || { prefix: `${levelLabels[level] || level}-`, type: 'numbers' as const, continueAfterMax: false };
    const parentName = idx > 0 && config.includeParentName
      ? orderedLevels.slice(0, idx).map((prevLevel) => {
          const prevNaming = config.levels[prevLevel] || { prefix: `${levelLabels[prevLevel] || prevLevel}-`, type: 'numbers' as const, continueAfterMax: false };
          return generateSequentialName(0, prevNaming);
        }).join('-')
      : undefined;
    return generateSequentialName(0, levelNaming, parentName, config.includeParentName);
  }).join(' → ');

  return (
    <div className="space-y-3">
      {/* Naming selectors for each enabled level */}
      {orderedLevels.map((level) => (
        <NamingConventionSelector
          key={level}
          level={level}
          label={levelLabels[level] || level}
          config={config.levels[level] || { prefix: `${levelLabels[level] || level}-`, type: 'numbers', continueAfterMax: false }}
          onChange={(levelConfig) => handleLevelChange(level, levelConfig)}
        />
      ))}

      {/* Include parent name toggle */}
      {orderedLevels.length > 1 && (
        <div className="px-3 py-2 bg-[var(--muted)] rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeParentName}
              onChange={(e) => onChange({ ...config, includeParentName: e.target.checked })}
              className="w-3.5 h-3.5 rounded border-[var(--border)]"
            />
            <span className="text-xs text-[var(--foreground)]">Include parent name in children</span>
          </label>
          {config.includeParentName && (
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1 ml-5">
              Example: {examplePath}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
