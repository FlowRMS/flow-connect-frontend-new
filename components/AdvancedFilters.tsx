'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export type FilterOperator = 'EQ' | 'NE' | 'ILIKE' | 'LIKE' | 'BEGINS_WITH' | 'ENDS_WITH' | 'IS_NULL' | 'IS_NOT_NULL' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'IN';

export type ActiveFilter = {
  columnName: string;
  operator: FilterOperator;
  value?: string;
  values?: string[];
};

export type ActiveSort = {
  columnName: string;
  direction: 'ASC' | 'DESC';
};

type FilterOption = {
  id: string;
  label: string;
  type: 'dropdown' | 'date' | 'text' | 'number';
  columnName?: string; // API column name for filtering
  available?: boolean; // Whether this filter is available in the API
  options?: string[]; // Available options for dropdown filters
};

type AdvancedFiltersProps = {
  filterOptions: FilterOption[];
  onFilterChange?: (filter: ActiveFilter | undefined) => void;
  onFiltersChange?: (filters: ActiveFilter[]) => void; // Support multiple filters
  activeFilter?: ActiveFilter;
  activeFilters?: ActiveFilter[]; // Support multiple active filters
};

// Stable empty array to prevent unnecessary re-renders
const EMPTY_FILTERS: ActiveFilter[] = [];

export default function AdvancedFilters({ 
  filterOptions, 
  onFilterChange, 
  onFiltersChange,
  activeFilter,
  activeFilters,
}: AdvancedFiltersProps) {
  // Use stable reference for empty array
  const stableActiveFilters = activeFilters ?? EMPTY_FILTERS;
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedFilterId, setExpandedFilterId] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [localFilters, setLocalFilters] = useState<ActiveFilter[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Create a stable key for the filters to compare
  const filtersKey = useMemo(() => {
    if (stableActiveFilters.length > 0) {
      return JSON.stringify(stableActiveFilters);
    }
    if (activeFilter) {
      return JSON.stringify([activeFilter]);
    }
    return '';
  }, [stableActiveFilters, activeFilter]);

  // Sync local filters with prop - use filtersKey for stable comparison
  useEffect(() => {
    if (stableActiveFilters.length > 0) {
      setLocalFilters(stableActiveFilters);
    } else if (activeFilter) {
      setLocalFilters([activeFilter]);
    } else {
      setLocalFilters([]);
    }
  }, [filtersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setExpandedFilterId(null);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Initialize selected values when opening a filter that has active values
  useEffect(() => {
    if (expandedFilterId) {
      const option = filterOptions.find(o => o.id === expandedFilterId);
      if (option && option.columnName) {
        // Find existing filter for this column
        const existingFilter = localFilters.find(f => f.columnName === option.columnName);
        if (existingFilter) {
          if (existingFilter.operator === 'IN' && existingFilter.values) {
            setSelectedValues(existingFilter.values);
          } else if (existingFilter.value) {
            setSelectedValues([existingFilter.value]);
          } else {
            setSelectedValues([]);
          }
        } else {
          setSelectedValues([]);
        }
      } else {
        setSelectedValues([]);
      }
    } else {
      setSelectedValues([]);
    }
  }, [expandedFilterId, localFilters, filterOptions]);

  const handleFilterOptionClick = (option: FilterOption) => {
    if (option.available === false) return;
    
    if (expandedFilterId === option.id) {
      setExpandedFilterId(null);
    } else {
      setExpandedFilterId(option.id);
      setFilterValue('');
    }
  };

  const handleApplyFilter = (option: FilterOption, value: string, operator: FilterOperator = 'ILIKE') => {
    if (!option.columnName) return;
    
    const newFilter: ActiveFilter = {
      columnName: option.columnName,
      operator,
      value: value.trim(),
    };
    
    // Update local filters - add or replace filter for this column
    const newFilters = localFilters.filter(f => f.columnName !== option.columnName);
    if (value.trim()) {
      newFilters.push(newFilter);
    }
    setLocalFilters(newFilters);
    
    // Notify parent
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else if (onFilterChange) {
      // Backward compatibility - use the first filter
      onFilterChange(newFilters.length > 0 ? newFilters[0] : undefined);
    }
    setExpandedFilterId(null);
    setFilterValue('');
  };

  const handleApplyMultiSelect = (option: FilterOption) => {
    if (!option.columnName) return;
    
    // Update local filters
    let newFilters = localFilters.filter(f => f.columnName !== option.columnName);
    
    if (selectedValues.length > 0) {
      newFilters.push({
        columnName: option.columnName,
        operator: 'IN',
        values: selectedValues,
        value: selectedValues.join(','),
      });
    }
    
    setLocalFilters(newFilters);

    // Notify parent
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else if (onFilterChange) {
      // Backward compatibility - use the first filter or undefined if no filters
      onFilterChange(newFilters.length > 0 ? newFilters[0] : undefined);
    }
    setExpandedFilterId(null);
  };

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter(v => v !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
  };

  const handleClearFilter = (columnName?: string) => {
    if (columnName) {
      // Clear specific filter
      const newFilters = localFilters.filter(f => f.columnName !== columnName);
      setLocalFilters(newFilters);
      if (onFiltersChange) {
        onFiltersChange(newFilters);
      } else if (onFilterChange) {
        onFilterChange(newFilters.length > 0 ? newFilters[0] : undefined);
      }
    } else {
      // Clear all filters
      setLocalFilters([]);
      if (onFiltersChange) {
        onFiltersChange([]);
      } else if (onFilterChange) {
        onFilterChange(undefined);
      }
    }
    setFilterValue('');
    setExpandedFilterId(null);
  };

  const activeFilterCount = localFilters.length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger Button */}
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (isExpanded) setExpandedFilterId(null);
        }}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors ${
          localFilters.length > 0 
            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
            : 'border-[var(--border)] hover:bg-[var(--muted)]'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h14M7 10h10M11 14h6" strokeLinecap="round"/>
        </svg>
        Advanced Filters
        {activeFilterCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-[var(--primary)] text-white text-xs rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Expanded Filter Panel - Fixed positioning with full height */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 pointer-events-none">
          <div 
            className="w-full max-w-4xl bg-white rounded-xl p-6 shadow-2xl pointer-events-auto overflow-visible border border-gray-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
                  <p className="text-sm text-gray-500">{filterOptions.filter(f => f.available !== false).length} available filters</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setExpandedFilterId(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Active Filters Display */}
            {localFilters.length > 0 && (
              <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-blue-700">Active:</span>
                  {localFilters.map((filter, index) => {
                    const option = filterOptions.find(o => o.columnName === filter.columnName);
                    const label = option?.label || filter.columnName;
                    return (
                      <span key={index} className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm flex items-center gap-2 border border-gray-200 shadow-sm">
                        <span className="font-medium text-gray-900">{label}:</span>
                        <span className="text-gray-600">
                          {filter.operator === 'IN' && filter.values 
                            ? filter.values.join(', ') 
                            : filter.value}
                        </span>
                        <button 
                          onClick={() => handleClearFilter(filter.columnName)} 
                          className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-red-500"
                        >
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter By Field - With inline dropdowns */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
                </svg>
                <h4 className="text-sm font-semibold text-gray-700">Filter By Field</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filterOptions.map((option) => (
                  <div key={option.id} className="relative">
                    <button 
                      onClick={() => handleFilterOptionClick(option)}
                      disabled={option.available === false}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        option.available === false
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          : expandedFilterId === option.id
                            ? 'bg-blue-600 text-white shadow-lg border border-blue-600'
                            : localFilters.some(f => f.columnName === option.columnName)
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {option.label}
                        {option.available === false && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-normal">Soon</span>
                        )}
                      </span>
                      {option.available !== false && (
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 20 20" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          className={`transition-transform ${expandedFilterId === option.id ? 'rotate-180' : ''}`}
                        >
                          <path d="M5 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>

                    {/* Inline Dropdown for filter value - expanded to show all options */}
                    {expandedFilterId === option.id && option.available !== false && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-10 overflow-hidden">
                        {/* Multi-select Dropdown - Show all options without scrolling */}
                        <div className="flex flex-col">
                            <div className="p-3 border-b border-gray-100">
                              <input
                                type="text"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                placeholder={`Search ${option.label.toLowerCase()}...`}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                              />
                            </div>
                            <div className="p-2 max-h-80 overflow-y-auto">
                              {(option.options || [])
                                .filter(opt => opt.toLowerCase().includes(filterValue.toLowerCase()))
                                .map((opt) => (
                                  <label key={opt} className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedValues.includes(opt)}
                                      onChange={() => toggleValue(opt)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{opt}</span>
                                  </label>
                                ))}
                                {(!option.options || option.options.length === 0) && (
                                  <div className="px-2 py-2 text-sm text-gray-500 text-center">No options available</div>
                                )}
                                {option.options && option.options.filter(opt => opt.toLowerCase().includes(filterValue.toLowerCase())).length === 0 && option.options.length > 0 && (
                                  <div className="px-2 py-2 text-sm text-gray-500 text-center">No options found</div>
                                )}
                            </div>
                            <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                              <span className="text-xs text-gray-500">{selectedValues.length} selected</span>
                              <button
                                onClick={() => handleApplyMultiSelect(option)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Clear All Button */}
            {localFilters.length > 0 && (
              <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    handleClearFilter();
                  }}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors border border-red-200"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
          
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 -z-10 pointer-events-auto"
            onClick={() => {
              setIsExpanded(false);
              setExpandedFilterId(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
