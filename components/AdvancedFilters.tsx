'use client';

import React, { useState } from 'react';

type FilterOption = {
  id: string;
  label: string;
  type: 'dropdown' | 'date' | 'text' | 'number';
};

type TimeRange = 'all' | 'yesterday' | 'lastWeek' | 'current' | 'last' | 'last2' | 'last3';

type AdvancedFiltersProps = {
  filterOptions: FilterOption[];
  onFilterChange?: (filters: Record<string, any>) => void;
};

export default function AdvancedFilters({ filterOptions, onFilterChange }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('all');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const timeRangeOptions = [
    { value: 'all', label: 'All Years' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'current', label: 'Current Year' },
    { value: 'last', label: 'Last Year' },
    { value: 'last2', label: 'Last 2 Years' },
    { value: 'last3', label: 'Last 3 Years' },
  ];

  const handleTimeRangeChange = (range: TimeRange) => {
    setSelectedTimeRange(range);
    if (onFilterChange) {
      onFilterChange({ ...filters, timeRange: range });
    }
  };

  return (
    <div className="relative inline-block">
      {/* Trigger Button - Original Style */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
        </svg>
        Filter
      </button>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-screen max-w-4xl bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-6 shadow-lg z-50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
                <p className="text-sm text-white/80">{filterOptions.length} available filters</p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2">
                <path d="M15 8l-5 5-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="mb-6 bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <h4 className="text-sm font-semibold text-white">Year Range</h4>
            </div>
            <div className="flex gap-2 flex-wrap">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTimeRangeChange(option.value as TimeRange)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTimeRange === option.value
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {filterOptions.map((option) => (
              <div key={option.id} className="relative">
                <button className="w-full flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors">
                  <span>{option.label}</span>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
