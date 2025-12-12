'use client';

import React, { useState, useEffect, useCallback } from 'react';

type FieldConfig = {
  key: string;
  label: string;
  type?: 'dimension' | 'measure';
};

type FiltersType = {
  states: string[];
  categories: string[];
  years: number[];
};

export default function DataSearchPivot() {
  const [availableFields, setAvailableFields] = useState<FieldConfig[]>([]);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [columnValues, setColumnValues] = useState<string[]>([]);
  const [filters, setFilters] = useState<FiltersType>({ states: [], categories: [], years: [] });
  const [loading, setLoading] = useState(true);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [checkedFields, setCheckedFields] = useState<Set<string>>(new Set());

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchPivotData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (selectedRows.length > 0) params.append('rows', selectedRows.join(','));
      if (selectedColumns.length > 0) params.append('columns', selectedColumns.join(','));
      if (selectedValues.length > 0) params.append('values', selectedValues.join(','));
      if (selectedState) params.append('state', selectedState);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedYear) params.append('year', selectedYear);

      const response = await fetch(`/api/disc/data-search/pivot?${params}`);
      const result = await response.json();

      setAvailableFields(result.availableFields);
      setData(result.data);
      setColumnValues(result.columnValues);
      setFilters(result.filters);
    } catch (error) {
      console.error('Failed to fetch pivot data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedRows, selectedColumns, selectedValues, selectedState, selectedCategory, selectedYear]);

  useEffect(() => {
    fetchPivotData();
  }, [fetchPivotData]);

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

  const moveToRows = (fieldKey: string) => {
    setSelectedColumns(c => c.filter(k => k !== fieldKey));
    setSelectedValues(v => v.filter(k => k !== fieldKey));
    if (!selectedRows.includes(fieldKey)) {
      setSelectedRows(r => [...r, fieldKey]);
    }
  };

  const moveToColumns = (fieldKey: string) => {
    setSelectedRows(r => r.filter(k => k !== fieldKey));
    setSelectedValues(v => v.filter(k => k !== fieldKey));
    if (!selectedColumns.includes(fieldKey)) {
      setSelectedColumns(c => [...c, fieldKey]);
    }
  };

  const moveToValues = (fieldKey: string) => {
    setSelectedRows(r => r.filter(k => k !== fieldKey));
    setSelectedColumns(c => c.filter(k => k !== fieldKey));
    if (!selectedValues.includes(fieldKey)) {
      setSelectedValues(v => [...v, fieldKey]);
    }
  };

  const clearFilters = () => {
    setSelectedState('');
    setSelectedCategory('');
    setSelectedYear('');
  };

  const dimensions = availableFields.filter(f => f.type === 'dimension');
  const measures = availableFields.filter(f => f.type === 'measure');

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Data Search Pivot</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Create pivot table analysis of Data Search records</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Filters</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted-foreground)]">State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-3 py-2 bg-[var(--input)] border border-[var(--input-border)] rounded-lg text-sm min-w-[120px]"
              >
                <option value="">All States</option>
                {filters.states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted-foreground)]">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-[var(--input)] border border-[var(--input-border)] rounded-lg text-sm min-w-[120px]"
              >
                <option value="">All Categories</option>
                {filters.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted-foreground)]">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 bg-[var(--input)] border border-[var(--input-border)] rounded-lg text-sm min-w-[100px]"
              >
                <option value="">All Years</option>
                {filters.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Field Selection Panel */}
        <div className="w-64 bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 overflow-y-auto flex-shrink-0">
          <h3 className="font-semibold text-[var(--foreground)] mb-3">Available Fields</h3>

          {/* Dimensions */}
          <div className="mb-4">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Dimensions</div>
            {dimensions.map(field => (
              <div key={field.key} className="flex items-center justify-between py-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedFields.has(field.key)}
                    onChange={() => toggleField(field.key)}
                    className="rounded border-[var(--border)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">{field.label}</span>
                </label>
                {checkedFields.has(field.key) && (
                  <div className="flex gap-1">
                    <button onClick={() => moveToRows(field.key)} className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">R</button>
                    <button onClick={() => moveToColumns(field.key)} className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">C</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Measures */}
          <div>
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Measures</div>
            {measures.map(field => (
              <div key={field.key} className="flex items-center justify-between py-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedFields.has(field.key)}
                    onChange={() => toggleField(field.key)}
                    className="rounded border-[var(--border)]"
                  />
                  <span className="text-sm text-[var(--foreground)]">{field.label}</span>
                </label>
                {checkedFields.has(field.key) && (
                  <button onClick={() => moveToValues(field.key)} className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200">V</button>
                )}
              </div>
            ))}
          </div>

          {/* Current Selection */}
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Configuration</div>
            <div className="space-y-2 text-xs">
              <div><span className="text-blue-600">Rows:</span> {selectedRows.length > 0 ? selectedRows.join(', ') : 'None'}</div>
              <div><span className="text-green-600">Columns:</span> {selectedColumns.length > 0 ? selectedColumns.join(', ') : 'None'}</div>
              <div><span className="text-purple-600">Values:</span> {selectedValues.length > 0 ? selectedValues.join(', ') : 'None'}</div>
            </div>
          </div>
        </div>

        {/* Pivot Table */}
        <div className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-[var(--muted-foreground)]">Loading...</div>
            </div>
          ) : selectedRows.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-[var(--muted-foreground)]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 opacity-50">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 3v18"/>
                </svg>
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">Data Search Pivot Table</h3>
                <p className="text-sm">Select row fields from the left panel to build your pivot table.</p>
                <p className="text-sm mt-1">Add columns and values for cross-tabulation.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-auto flex-1 p-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {selectedRows.map(rowKey => (
                      <th key={rowKey} className="px-3 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider bg-[var(--muted)] border border-[var(--border)]">
                        {availableFields.find(f => f.key === rowKey)?.label || rowKey}
                      </th>
                    ))}
                    {columnValues.length > 0 ? (
                      columnValues.map(colVal => (
                        <th key={colVal} className="px-3 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider bg-[var(--muted)] border border-[var(--border)]">
                          {colVal}
                        </th>
                      ))
                    ) : selectedValues.length > 0 ? (
                      <th className="px-3 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider bg-[var(--muted)] border border-[var(--border)]">
                        Total Value
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      {selectedRows.map(rowKey => (
                        <td key={rowKey} className="px-3 py-2 text-sm text-[var(--foreground)] border border-[var(--border)]">
                          {String(row[rowKey] ?? '')}
                        </td>
                      ))}
                      {columnValues.length > 0 ? (
                        columnValues.map(colVal => (
                          <td key={colVal} className="px-3 py-2 text-sm text-right text-[var(--foreground)] border border-[var(--border)]">
                            {typeof row[colVal] === 'number' ? row[colVal].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(row[colVal] ?? '-')}
                          </td>
                        ))
                      ) : selectedValues.length > 0 ? (
                        <td className="px-3 py-2 text-sm text-right text-[var(--foreground)] border border-[var(--border)]">
                          {typeof row['total_value'] === 'number' ? row['total_value'].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length === 0 && (
                <div className="text-center text-[var(--muted-foreground)] py-8">
                  No data matches the current configuration.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
