'use client';

import React from 'react';
import type { LevelNaming, NamingType } from './types';
import { levelColors } from '../constants';

interface NamingConventionSelectorProps {
  level: string;
  label: string;
  config: LevelNaming;
  onChange: (config: LevelNaming) => void;
}

const namingOptions: { value: NamingType; label: string; example: string }[] = [
  { value: 'letters', label: 'A, B, C...', example: 'A, B, C... Z' },
  { value: 'numbers', label: '1, 2, 3...', example: '1, 2, 3...' },
  { value: 'custom', label: 'Custom', example: 'Your values' },
];

export default function NamingConventionSelector({
  level,
  label,
  config,
  onChange,
}: NamingConventionSelectorProps) {
  const colors = levelColors[level];

  return (
    <div className={`p-3 rounded-lg border ${colors?.border || 'border-[var(--border)]'} ${colors?.bg || ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-semibold ${colors?.text || ''}`}>{label}</span>
      </div>

      {/* Prefix */}
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-[var(--muted-foreground)] w-12">Prefix:</label>
        <input
          type="text"
          value={config.prefix}
          onChange={(e) => onChange({ ...config, prefix: e.target.value })}
          placeholder={`${label}-`}
          className="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Type selection */}
      <div className="flex items-center gap-1 mb-2">
        <label className="text-xs text-[var(--muted-foreground)] w-12">Type:</label>
        <div className="flex gap-1">
          {namingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange({ ...config, type: option.value })}
              className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                config.type === option.value
                  ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400'
                  : 'border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Continue after max toggle (only for letters) */}
      {config.type === 'letters' && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--muted-foreground)] w-12"></label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.continueAfterMax}
              onChange={(e) => onChange({ ...config, continueAfterMax: e.target.checked })}
              className="w-3 h-3 rounded border-[var(--border)]"
            />
            <span className="text-[10px] text-[var(--muted-foreground)]">
              Continue after Z (AA, AB, AC...)
            </span>
          </label>
        </div>
      )}

      {/* Custom values input */}
      {config.type === 'custom' && (
        <div className="flex items-center gap-2 mt-1">
          <label className="text-xs text-[var(--muted-foreground)] w-12">Values:</label>
          <input
            type="text"
            value={config.customValues?.join(', ') || ''}
            onChange={(e) =>
              onChange({
                ...config,
                customValues: e.target.value.split(',').map((v) => v.trim()).filter(Boolean),
              })
            }
            placeholder="e.g. North, South, East, West"
            className="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}
