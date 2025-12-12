'use client';

import React, { useState, useMemo } from 'react';

type FieldConfig = {
  key: string;
  label: string;
  type?: 'dimension' | 'measure';
};

type Props = {
  title: string;
  description: string;
  availableFields: FieldConfig[];
  data: Record<string, unknown>[];
  defaultRows?: string[];
  defaultColumns?: string[];
  defaultValues?: string[];
};

export default function PivotTable({
  title,
  description,
  availableFields,
  data,
  defaultRows = [],
  defaultColumns = [],
  defaultValues = [],
}: Props) {
  const [selectedRows, setSelectedRows] = useState<string[]>(defaultRows);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(defaultColumns);
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultValues);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [checkedFields, setCheckedFields] = useState<Set<string>>(
    new Set([...defaultRows, ...defaultColumns, ...defaultValues])
  );

  // Get unique values for columns
  const columnValues = useMemo(() => {
    if (selectedColumns.length === 0) return [];
    const colKey = selectedColumns[0];
    const uniqueValues = [...new Set(data.map(d => String(d[colKey])))];
    return uniqueValues.slice(0, 6); // Limit to 6 columns for display
  }, [data, selectedColumns]);

  // Aggregate data based on row groupings
  const aggregatedData = useMemo(() => {
    if (selectedRows.length === 0) return [];

    const groups: Record<string, Record<string, string | number>> = {};

    data.forEach(row => {
      const rowKey = selectedRows.map(r => String(row[r])).join('|');

      if (!groups[rowKey]) {
        groups[rowKey] = {};
        selectedRows.forEach(r => {
          groups[rowKey][r] = row[r] as string | number;
        });
      }

      if (selectedColumns.length > 0 && selectedValues.length > 0) {
        const colKey = selectedColumns[0];
        const colValue = String(row[colKey]);
        const valueKey = selectedValues[0];
        const value = (row[valueKey] as number) || 0;

        if (!groups[rowKey][colValue]) {
          groups[rowKey][colValue] = 0;
        }
        (groups[rowKey][colValue] as number) += value;
      }
    });

    return Object.values(groups);
  }, [data, selectedRows, selectedColumns, selectedValues]);

  const toggleField = (fieldKey: string) => {
    setCheckedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey);
        setSelectedRows(r => r.filter(k => k !== fieldKey));
        setSelectedColumns(c => c.filter(k => k !== fieldKey));
        setSelectedValues(v => v.filter(k => k !== fieldKey));
      } else {
        newSet.add(fieldKey);
      }
      return newSet;
    });
  };

  const addToRows = (fieldKey: string) => {
    if (!selectedRows.includes(fieldKey)) {
      setSelectedRows([...selectedRows, fieldKey]);
      setSelectedColumns(c => c.filter(k => k !== fieldKey));
      setSelectedValues(v => v.filter(k => k !== fieldKey));
    }
  };

  const addToColumns = (fieldKey: string) => {
    if (!selectedColumns.includes(fieldKey)) {
      setSelectedColumns([fieldKey]);
      setSelectedRows(r => r.filter(k => k !== fieldKey));
      setSelectedValues(v => v.filter(k => k !== fieldKey));
    }
  };

  const addToValues = (fieldKey: string) => {
    if (!selectedValues.includes(fieldKey)) {
      setSelectedValues([fieldKey]);
      setSelectedRows(r => r.filter(k => k !== fieldKey));
      setSelectedColumns(c => c.filter(k => k !== fieldKey));
    }
  };

  const removeFromRows = (fieldKey: string) => {
    setSelectedRows(r => r.filter(k => k !== fieldKey));
  };

  const removeFromColumns = (fieldKey: string) => {
    setSelectedColumns(c => c.filter(k => k !== fieldKey));
  };

  const removeFromValues = (fieldKey: string) => {
    setSelectedValues(v => v.filter(k => k !== fieldKey));
  };

  const formatValue = (value: unknown) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`;
      } else if (value >= 1000) {
        return `$${value.toLocaleString()}`;
      }
      return value.toLocaleString();
    }
    return String(value || '');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 mb-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span className="font-medium text-[var(--foreground)]">Filter by Date Range</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Filter By</span>
              <select className="bg-[var(--input)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm">
                <option>Entity Date</option>
                <option>Created Date</option>
                <option>Modified Date</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Period</span>
              <select className="bg-[var(--input)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm">
                <option>Custom Range</option>
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Quarter</option>
                <option>This Year</option>
                <option>Last Year</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Start Date</span>
              <input
                type="date"
                className="bg-[var(--input)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center pt-5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider mb-1">End Date</span>
              <input
                type="date"
                className="bg-[var(--input)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="ml-auto">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <span>Advanced Filters</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
              >
                <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* YTD Mode */}
        <div className="mt-4 flex items-center gap-2">
          <input type="checkbox" id="ytd-mode" className="w-4 h-4 rounded border-[var(--border)]" />
          <label htmlFor="ytd-mode" className="text-sm text-[var(--foreground)]">Enable YTD Mode</label>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--muted-foreground)]">
            ({data.length} records)
          </span>
          <button className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 015.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            Expand
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Date Format
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17,21 17,13 7,13 7,21"/>
              <polyline points="7,3 7,8 15,8"/>
            </svg>
            Save View
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
            Manage Views
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>
            </svg>
            Sort
            <span className="bg-white text-orange-500 text-xs px-1.5 py-0.5 rounded-full font-bold">1</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            Clean
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--success)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Pivot Table Container */}
      <div className="flex gap-4">
        {/* Field Selector */}
        <div className="w-64 bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 shrink-0">
          {/* Available Fields */}
          <div className="mb-4">
            <div className="text-xs text-[var(--muted-foreground)] font-medium mb-2">AVAILABLE FIELDS</div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {availableFields.map(field => (
                <label key={field.key} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[var(--muted)] px-2 rounded">
                  <span className="text-[var(--muted-foreground)]">::</span>
                  <input
                    type="checkbox"
                    checked={checkedFields.has(field.key)}
                    onChange={() => toggleField(field.key)}
                    className="w-4 h-4 rounded border-[var(--border)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] font-medium mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
              </svg>
              ROWS
            </div>
            <div className="space-y-1 min-h-[40px] bg-[var(--muted)] rounded p-2">
              {selectedRows.map(key => {
                const field = availableFields.find(f => f.key === key);
                return (
                  <div key={key} className="flex items-center justify-between bg-[var(--card)] rounded px-2 py-1">
                    <span className="text-sm">{field?.label || key}</span>
                    <button onClick={() => removeFromRows(key)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
              {checkedFields.size > 0 && selectedRows.length === 0 && (
                <div className="text-xs text-[var(--muted-foreground)] text-center py-2">
                  Drag fields here
                </div>
              )}
            </div>
          </div>

          {/* Columns */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] font-medium mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
              </svg>
              COLUMNS
            </div>
            <div className="space-y-1 min-h-[40px] bg-[var(--muted)] rounded p-2">
              {selectedColumns.map(key => {
                const field = availableFields.find(f => f.key === key);
                return (
                  <div key={key} className="flex items-center justify-between bg-[var(--card)] rounded px-2 py-1">
                    <span className="text-sm">{field?.label || key}</span>
                    <button onClick={() => removeFromColumns(key)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Values */}
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] font-medium mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/>
                <path d="M18 17V9M13 17V5M8 17v-3"/>
              </svg>
              VALUES
            </div>
            <div className="space-y-1 min-h-[40px] bg-[var(--muted)] rounded p-2">
              {selectedValues.map(key => {
                const field = availableFields.find(f => f.key === key);
                return (
                  <div key={key} className="flex items-center justify-between bg-[var(--card)] rounded px-2 py-1">
                    <span className="text-sm">{field?.label || key} <span className="text-xs text-[var(--muted-foreground)]">SUM</span></span>
                    <button onClick={() => removeFromValues(key)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="mt-4 space-y-2">
            {Array.from(checkedFields).filter(k =>
              !selectedRows.includes(k) && !selectedColumns.includes(k) && !selectedValues.includes(k)
            ).map(key => {
              const field = availableFields.find(f => f.key === key);
              return (
                <div key={key} className="flex gap-1">
                  <button
                    onClick={() => addToRows(key)}
                    className="flex-1 text-xs px-2 py-1 bg-[var(--muted)] hover:bg-[var(--primary)] hover:text-white rounded transition-colors"
                  >
                    + Row
                  </button>
                  <button
                    onClick={() => addToColumns(key)}
                    className="flex-1 text-xs px-2 py-1 bg-[var(--muted)] hover:bg-[var(--primary)] hover:text-white rounded transition-colors"
                  >
                    + Col
                  </button>
                  <button
                    onClick={() => addToValues(key)}
                    className="flex-1 text-xs px-2 py-1 bg-[var(--muted)] hover:bg-[var(--primary)] hover:text-white rounded transition-colors"
                  >
                    + Val
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pivot Table */}
        <div className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--muted)]">
                <tr>
                  {selectedRows.map(rowKey => {
                    const field = availableFields.find(f => f.key === rowKey);
                    return (
                      <th key={rowKey} className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider border-r border-[var(--border)]">
                        {field?.label || rowKey}
                      </th>
                    );
                  })}
                  {columnValues.map(colVal => (
                    <th key={colVal} className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                      {colVal}
                      {selectedValues.length > 0 && (
                        <div className="text-[10px] font-normal normal-case mt-0.5">
                          {availableFields.find(f => f.key === selectedValues[0])?.label || selectedValues[0]}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {aggregatedData.slice(0, 20).map((row, idx) => (
                  <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                    {selectedRows.map(rowKey => (
                      <td key={rowKey} className="px-4 py-3 text-sm text-[var(--foreground)] border-r border-[var(--border)]">
                        {String(row[rowKey] || '')}
                      </td>
                    ))}
                    {columnValues.map(colVal => (
                      <td key={colVal} className="px-4 py-3 text-sm text-right text-[var(--foreground)]">
                        {formatValue(row[colVal])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
