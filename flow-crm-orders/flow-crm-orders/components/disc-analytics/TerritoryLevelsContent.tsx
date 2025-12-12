'use client';

import React, { useState } from 'react';

type TerritoryLevel = {
  level: number;
  label: string;
};

const defaultLevels: TerritoryLevel[] = [
  { level: 1, label: 'Branch' },
  { level: 2, label: 'Area' },
  { level: 3, label: 'District' },
  { level: 4, label: 'Region' },
  { level: 5, label: 'Operation' },
  { level: 6, label: 'Department' },
  { level: 7, label: 'Division' },
  { level: 8, label: 'Company' },
];

export default function TerritoryLevelsContent() {
  const [levels, setLevels] = useState<TerritoryLevel[]>(defaultLevels);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleLabelChange = (levelNumber: number, newLabel: string) => {
    setLevels(prev =>
      prev.map(l =>
        l.level === levelNumber ? { ...l, label: newLabel } : l
      )
    );
    setHasChanges(true);
    setSaveMessage(null);
  };

  const handleSave = () => {
    // In a real app, this would save to backend/database
    setHasChanges(false);
    setSaveMessage('Territory level labels saved successfully.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleReset = () => {
    setLevels(defaultLevels);
    setHasChanges(true);
    setSaveMessage(null);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Territory Level Labels</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Define custom labels for each territory hierarchy level.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
            Save
          </button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
          {saveMessage}
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {/* Card Header */}
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--foreground)]">Level Configuration</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            These labels are used throughout the system when displaying territory hierarchies.
          </p>
        </div>

        {/* Table */}
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="bg-[#1e3a5f] text-white">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold w-1/3">Level</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Territory Label</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((level, index) => (
                <tr
                  key={level.level}
                  className={`border-b border-[var(--border)] ${
                    index % 2 === 0 ? 'bg-amber-50/50 dark:bg-amber-900/10' : 'bg-[var(--card)]'
                  }`}
                >
                  <td className="px-6 py-3 text-sm text-[var(--foreground)]">
                    Level {level.level}
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      value={level.label}
                      onChange={(e) => handleLabelChange(level.level, e.target.value)}
                      className="w-full max-w-md px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                      placeholder={`Enter label for Level ${level.level}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            {levels.length} levels configured
          </p>
          {hasChanges && (
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              You have unsaved changes
            </p>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">How Territory Levels Work</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Level 1 is typically the smallest/most granular territory unit (e.g., Branch)</li>
          <li>Level 8 is typically the largest/highest level in the hierarchy (e.g., Company)</li>
          <li>These labels appear in territory dropdowns, reports, and data views</li>
          <li>Changing labels here will update them across all DISC Analytics views</li>
        </ul>
      </div>
    </div>
  );
}
