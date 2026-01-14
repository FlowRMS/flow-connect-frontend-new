import React from 'react';
import type { ActiveFilter, FilterOption } from '../types';
import { parseDateString } from '../utils';

type ActiveFiltersProps = {
  localFilters: ActiveFilter[];
  filterOptions: FilterOption[];
  onClearFilter: (columnName?: string) => void;
};

export function ActiveFilters({ localFilters, filterOptions, onClearFilter }: ActiveFiltersProps) {
  if (localFilters.length === 0) {
    return null;
  }

  // Group date filters together (GTE and LTE for the same column)
  const groupedFilters = new Map<string, { label: string; start?: string; end?: string; other?: ActiveFilter }>();
  
  localFilters.forEach((filter, idx) => {
    const option = filterOptions.find(o => o.columnName === filter.columnName);
    const label = option?.label || filter.columnName;
    
    // Group date and month filters (GTE and LTE) together
    if ((option?.type === 'date' || option?.type === 'month') && (filter.operator === 'GTE' || filter.operator === 'LTE')) {
      if (!groupedFilters.has(filter.columnName)) {
        groupedFilters.set(filter.columnName, { label });
      }
      const group = groupedFilters.get(filter.columnName)!;
      if (filter.operator === 'GTE') {
        group.start = filter.value;
      } else if (filter.operator === 'LTE') {
        group.end = filter.value;
      }
    } else {
      // Non-date filters or other operators - use unique key
      groupedFilters.set(`${filter.columnName}-${filter.operator}-${idx}`, { 
        label, 
        other: filter 
      });
    }
  });

  return (
    <div className="mb-4 sm:mb-6 bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-100">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs sm:text-sm font-medium text-blue-700">Active:</span>
        {Array.from(groupedFilters.entries()).map(([key, group]) => {
          // Date range or month filter
          if (group.start || group.end) {
            const startDate = group.start ? parseDateString(group.start) : null;
            const endDate = group.end ? parseDateString(group.end) : null;
            // For date and month filters, key is the columnName
            const dateColumn = key;
            const option = filterOptions.find(o => o.columnName === dateColumn);
            
            return (
              <span key={key} className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white text-gray-700 rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-2 border border-gray-200 shadow-sm">
                <span className="font-medium text-gray-900">{group.label}:</span>
                <span className="text-gray-600">
                  {option?.type === 'month' && startDate ? (
                    // For month filters, show as "Month YYYY"
                    `${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                  ) : startDate && endDate ? (
                    // For date range filters, show full range
                    `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  ) : startDate ? (
                    `From ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  ) : endDate ? (
                    `Until ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  ) : (
                    ''
                  )}
                </span>
                <button
                  onClick={() => onClearFilter(dateColumn)}
                  className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-red-500"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-3.5 sm:h-3.5">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </span>
            );
          }
          
          // Other filters
          if (group.other) {
            const filter = group.other;
            const operatorText = 
              filter.operator === 'EQ' ? 'Equal to' :
              filter.operator === 'GT' ? 'Greater than' :
              filter.operator === 'GTE' ? 'Greater than or equal to' :
              filter.operator === 'LT' ? 'Less than' :
              filter.operator === 'LTE' ? 'Less than or equal to' :
              '';
            
            const displayValue = filter.operator === 'IN' && filter.values
              ? filter.values.join(', ')
              : filter.operator && ['GT', 'GTE', 'LT', 'LTE'].includes(filter.operator) && operatorText
                ? `${operatorText} ${filter.value}`
                : filter.value;
            
            return (
              <span key={key} className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white text-gray-700 rounded-lg text-xs sm:text-sm flex items-center gap-1 sm:gap-2 border border-gray-200 shadow-sm">
                <span className="font-medium text-gray-900">{group.label}:</span>
                <span className="text-gray-600 truncate max-w-[100px] sm:max-w-none">
                  {displayValue}
                </span>
                <button
                  onClick={() => onClearFilter(filter.columnName)}
                  className="ml-1 p-0.5 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-red-500"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-3.5 sm:h-3.5">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                </button>
              </span>
            );
          }
          
          return null;
        })}
      </div>
    </div>
  );
}

