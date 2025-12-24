import React from 'react';
import type { WarehouseWithSettings } from '../types';
import { LevelIcons, levelColors } from '../constants';

interface LocationHierarchySectionProps {
  warehouse: WarehouseWithSettings;
  onToggleLevel: (level: string) => void;
  onShowLayout: () => void;
  onShowQRCodes: () => void;
}

export default function LocationHierarchySection({
  warehouse,
  onToggleLevel,
  onShowLayout,
  onShowQRCodes,
}: LocationHierarchySectionProps) {
  const enabledLevels = warehouse.settings.locationLevels.filter((l) => l.enabled);

  return (
    <div>
      {/* Location Hierarchy - Tree View */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-[var(--foreground)]">Location Hierarchy</h3>
        </div>
        <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3">
          <div className="space-y-1">
            {warehouse.settings.locationLevels.map((level, index) => (
              <div
                key={level.level}
                className="flex items-center justify-between py-1.5"
                style={{ paddingLeft: index * 20 }}
              >
                <div className="flex items-center gap-2">
                  {index > 0 && (
                    <svg
                      className="w-4 h-4 text-[var(--muted-foreground)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                  <div
                    className={`p-1.5 rounded ${level.enabled ? levelColors[index] : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}
                  >
                    {LevelIcons[level.level]}
                  </div>
                  <span
                    className={`text-sm font-medium ${level.enabled ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] line-through'}`}
                  >
                    {level.label}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={level.enabled}
                    onChange={() => onToggleLevel(level.level)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>

          {/* Example Path */}
          {enabledLevels.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-sm">
              <span className="text-[var(--muted-foreground)]">Example:</span>
              <span className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5 font-mono text-xs">
                {enabledLevels.map((l, i) => (
                  <span key={l.level}>
                    {i > 0 && <span className="text-[var(--muted-foreground)]">-</span>}
                    <span>
                      {l.level === 'section' && 'A'}
                      {l.level === 'aisle' && '1'}
                      {l.level === 'shelf' && '3'}
                      {l.level === 'bay' && '2'}
                      {l.level === 'row' && '1'}
                      {l.level === 'bin' && 'B'}
                    </span>
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>

        {/* View/Edit Warehouse Layout Button */}
        <button
          onClick={onShowLayout}
          className="w-full mt-3 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          View/Edit Warehouse Layout
        </button>
      </div>

      {/* QR Codes Button */}
      <div>
        <button
          onClick={onShowQRCodes}
          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          See and Print QR Codes
        </button>
      </div>
    </div>
  );
}
