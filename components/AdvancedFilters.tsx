'use client';

import React, { useState, useRef, useEffect } from 'react';

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
  activeFilter?: ActiveFilter;
};

export default function AdvancedFilters({ 
  filterOptions, 
  onFilterChange, 
  activeFilter,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedFilterId, setExpandedFilterId] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

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
    if (expandedFilterId && activeFilter) {
      const option = filterOptions.find(o => o.id === expandedFilterId);
      if (option && option.columnName === activeFilter.columnName) {
        if (activeFilter.operator === 'IN' && activeFilter.values) {
          setSelectedValues(activeFilter.values);
        } else if (activeFilter.value) {
          // If it's a single value filter but we're opening a dropdown, 
          // we might want to pre-select it if it matches one of the options
          setSelectedValues([activeFilter.value]);
        } else {
          setSelectedValues([]);
        }
      } else {
        setSelectedValues([]);
      }
    } else {
      setSelectedValues([]);
    }
  }, [expandedFilterId, activeFilter, filterOptions]);

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
    
    if (onFilterChange) {
      onFilterChange({
        columnName: option.columnName,
        operator,
        value: value.trim(),
      });
    }
    setExpandedFilterId(null);
    setFilterValue('');
  };

  const handleApplyMultiSelect = (option: FilterOption) => {
    if (!option.columnName) return;
    
    if (selectedValues.length === 0) {
      // If no values selected, clear the filter for this column
      if (activeFilter?.columnName === option.columnName) {
        handleClearFilter();
      }
      setExpandedFilterId(null);
      return;
    }

    if (onFilterChange) {
      onFilterChange({
        columnName: option.columnName,
        operator: 'IN',
        values: selectedValues,
        value: selectedValues.join(','), // Fallback for display or simple APIs
      });
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

  const handleClearFilter = () => {
    if (onFilterChange) {
      onFilterChange(undefined);
    }
    setFilterValue('');
    setExpandedFilterId(null);
  };

  const activeFilterCount = activeFilter ? 1 : 0;

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger Button */}
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (isExpanded) setExpandedFilterId(null);
        }}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors ${
          activeFilter 
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

      {/* Expanded Filter Panel - Fixed positioning */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pointer-events-none">
          <div 
            className="w-full max-w-4xl bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 shadow-2xl pointer-events-auto max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
                  <p className="text-sm text-white/80">{filterOptions.filter(f => f.available !== false).length} available filters</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setExpandedFilterId(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Active Filters Display */}
            {activeFilter && (
              <div className="mb-6 bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white/80">Active:</span>
                  <span className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm flex items-center gap-2">
                    <span className="font-medium">{activeFilter.columnName}:</span>
                    <span className="text-white/90">
                      {activeFilter.operator === 'IN' && activeFilter.values 
                        ? activeFilter.values.join(', ') 
                        : activeFilter.value}
                    </span>
                    <button onClick={handleClearFilter} className="ml-1 p-0.5 hover:bg-white/20 rounded transition-colors">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </span>
                </div>
              </div>
            )}

            {/* Filter By Field - With inline dropdowns */}
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
                </svg>
                <h4 className="text-sm font-semibold text-white">Filter By Field</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filterOptions.map((option) => (
                  <div key={option.id} className="relative">
                    <button 
                      onClick={() => handleFilterOptionClick(option)}
                      disabled={option.available === false}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        option.available === false
                          ? 'bg-white/5 text-white/40 cursor-not-allowed'
                          : expandedFilterId === option.id
                            ? 'bg-white text-blue-600 shadow-lg'
                            : activeFilter?.columnName === option.columnName
                              ? 'bg-white/90 text-blue-600 shadow-md'
                              : 'bg-white/20 hover:bg-white/30 text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {option.label}
                        {option.available === false && (
                          <span className="px-1.5 py-0.5 bg-yellow-500/40 text-yellow-100 text-xs rounded font-normal">Soon</span>
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

                    {/* Inline Dropdown for filter value */}
                    {expandedFilterId === option.id && option.available !== false && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-10 overflow-hidden">
                        {/* Multi-select Dropdown - Always show for fields with options */}
                        <div className="flex flex-col max-h-64">
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
                            <div className="overflow-y-auto flex-1 p-2">
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
            {activeFilter && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    handleClearFilter();
                  }}
                  className="px-4 py-2 bg-red-500/30 hover:bg-red-500/40 text-white rounded-lg text-sm font-medium transition-colors"
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
