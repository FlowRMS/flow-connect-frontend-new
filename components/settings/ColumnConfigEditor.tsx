'use client';

import React from 'react';

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  group?: string;
}

interface ColumnConfigEditorProps {
  columns: ColumnConfig[];
  onChange: (columns: ColumnConfig[]) => void;
  title?: string;
  groupBy?: boolean;
}

export function ColumnConfigEditor({
  columns,
  onChange,
  title = 'Column Configuration',
  groupBy = true,
}: ColumnConfigEditorProps) {
  const handleToggle = (key: string) => {
    const newColumns = columns.map((col) =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    onChange(newColumns);
  };

  const handleSelectAll = () => {
    const newColumns = columns.map((col) => ({ ...col, visible: true }));
    onChange(newColumns);
  };

  const handleDeselectAll = () => {
    const newColumns = columns.map((col) => ({ ...col, visible: false }));
    onChange(newColumns);
  };

  // Group columns if groupBy is enabled
  const groupedColumns = groupBy
    ? columns.reduce(
        (acc, col) => {
          const group = col.group || 'Other';
          if (!acc[group]) acc[group] = [];
          acc[group].push(col);
          return acc;
        },
        {} as Record<string, ColumnConfig[]>
      )
    : { All: columns };

  const visibleCount = columns.filter((c) => c.visible).length;

  return (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--card)]">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-[var(--foreground)]">{title}</h4>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {visibleCount} of {columns.length} columns visible
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            className="px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
      <div className="p-4 max-h-80 overflow-y-auto">
        {Object.entries(groupedColumns).map(([group, cols]) => (
          <div key={group} className="mb-4 last:mb-0">
            {groupBy && Object.keys(groupedColumns).length > 1 && (
              <h5 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                {group}
              </h5>
            )}
            <div className="grid grid-cols-2 gap-2">
              {cols.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--muted)] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => handleToggle(col.key)}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-offset-0"
                  />
                  <span className="text-sm text-[var(--foreground)]">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ColumnConfigEditor;
