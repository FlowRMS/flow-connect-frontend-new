'use client';

import React, { useState } from 'react';

type FilterOption = {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'range';
  options?: { value: string; label: string }[];
};

type SavedFilter = {
  id: string;
  name: string;
  filters: Record<string, string | string[]>;
};

type AdvancedFiltersProps = {
  filterOptions: FilterOption[];
  savedFilters?: SavedFilter[];
  onApply: (filters: Record<string, string | string[]>) => void;
  onSave?: (name: string, filters: Record<string, string | string[]>) => void;
  onDeleteSaved?: (id: string) => void;
};

export default function AdvancedFilters({
  filterOptions,
  savedFilters = [],
  onApply,
  onSave,
  onDeleteSaved
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [showSavedFilters, setShowSavedFilters] = useState(false);

  const activeFilterCount = Object.keys(activeFilters).filter(k => {
    const val = activeFilters[k];
    return val && (Array.isArray(val) ? val.length > 0 : val !== '');
  }).length;

  const handleFilterChange = (id: string, value: string | string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleApply = () => {
    onApply(activeFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setActiveFilters({});
    onApply({});
  };

  const handleSave = () => {
    if (filterName.trim() && onSave) {
      onSave(filterName.trim(), activeFilters);
      setFilterName('');
      setSaveDialogOpen(false);
    }
  };

  const handleLoadSaved = (saved: SavedFilter) => {
    setActiveFilters(saved.filters);
    onApply(saved.filters);
    setShowSavedFilters(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
          activeFilterCount > 0
            ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
            : 'bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-[400px] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--foreground)]">Advanced Filters</h3>
              <div className="flex items-center gap-2">
                {savedFilters.length > 0 && (
                  <button
                    onClick={() => setShowSavedFilters(!showSavedFilters)}
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    Saved Filters
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Saved Filters List */}
            {showSavedFilters && savedFilters.length > 0 && (
              <div className="p-3 border-b border-[var(--border)] bg-[var(--muted)]">
                <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-2">Saved Filters</div>
                <div className="space-y-1">
                  {savedFilters.map(saved => (
                    <div key={saved.id} className="flex items-center justify-between p-2 bg-[var(--card)] rounded hover:bg-[var(--muted)] transition-colors">
                      <button
                        onClick={() => handleLoadSaved(saved)}
                        className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
                      >
                        {saved.name}
                      </button>
                      {onDeleteSaved && (
                        <button
                          onClick={() => onDeleteSaved(saved.id)}
                          className="p-1 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Options */}
            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
              {filterOptions.map(filter => (
                <div key={filter.id}>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    {filter.label}
                  </label>

                  {filter.type === 'select' && filter.options && (
                    <select
                      value={(activeFilters[filter.id] as string) || ''}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      <option value="">All</option>
                      {filter.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}

                  {filter.type === 'multiselect' && filter.options && (
                    <div className="flex flex-wrap gap-2">
                      {filter.options.map(opt => {
                        const selected = (activeFilters[filter.id] as string[] || []).includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              const current = (activeFilters[filter.id] as string[]) || [];
                              const updated = selected
                                ? current.filter(v => v !== opt.value)
                                : [...current, opt.value];
                              handleFilterChange(filter.id, updated);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {filter.type === 'date' && (
                    <input
                      type="date"
                      value={(activeFilters[filter.id] as string) || ''}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  )}

                  {filter.type === 'range' && filter.options && (
                    <select
                      value={(activeFilters[filter.id] as string) || ''}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      <option value="">Any</option>
                      {filter.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            {/* Save Dialog */}
            {saveDialogOpen && (
              <div className="p-4 border-t border-[var(--border)] bg-[var(--muted)]">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Filter Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="e.g., Q4 Pipeline Review"
                    className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <button
                    onClick={handleSave}
                    disabled={!filterName.trim()}
                    className="px-3 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setSaveDialogOpen(false)}
                    className="px-3 py-2 bg-[var(--background)] text-[var(--foreground)] text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Clear All
                </button>
                {onSave && !saveDialogOpen && activeFilterCount > 0 && (
                  <button
                    onClick={() => setSaveDialogOpen(true)}
                    className="px-3 py-1.5 text-sm text-[var(--primary)] hover:underline"
                  >
                    Save Filter
                  </button>
                )}
              </div>
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
