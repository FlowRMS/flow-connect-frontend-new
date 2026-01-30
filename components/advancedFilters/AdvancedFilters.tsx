'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import './AdvancedFilters.css';
import type { FilterOperator, ActiveFilter, ActiveSort, FilterOption, AdvancedFiltersProps } from './types';
import { parseDateString, formatDateToISO, formatDateToBackend } from './utils';
import { ActiveFilters } from './components/ActiveFilters';
import { TextFilter } from './components/filter-types/TextFilter';
import { NumberFilter } from './components/filter-types/NumberFilter';
import { DropdownFilter } from './components/filter-types/DropdownFilter';
import { DateRangeFilter } from './components/filter-types/DateRangeFilter';
import { BooleanFilter } from './components/filter-types/BooleanFilter';
import { MonthYearFilter } from './components/filter-types/MonthYearFilter';
import { FactoryFilter } from './components/filter-types/FactoryFilter';
import { CategoryFilter } from './components/filter-types/CategoryFilter';
import { CompanyFilter } from './components/filter-types/CompanyFilter';
import { CompanyTypeFilter } from './components/filter-types/CompanyTypeFilter';

// Re-export types for backward compatibility
export type { FilterOperator, ActiveFilter, ActiveSort, FilterOption };

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
  const [numberOperator, setNumberOperator] = useState<FilterOperator>('EQ');
  const [textOperator, setTextOperator] = useState<FilterOperator>('ILIKE');
  const [booleanValue, setBooleanValue] = useState<'all' | 'true' | 'false' | null>(null);
  const [localFilters, setLocalFilters] = useState<ActiveFilter[]>([]);
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState<Date | null>(null);

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

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
        setExpandedFilterId(null);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isExpanded]);

  // Initialize selected values when opening a filter that has active values
  useEffect(() => {
    if (expandedFilterId) {
      const option = filterOptions.find(o => o.id === expandedFilterId);
      if (option && option.columnName) {
        // Find existing filters for this column (date filters use two: GTE and LTE)
        const existingFilters = localFilters.filter(f => f.columnName === option.columnName);
        
        if (option.type === 'boolean') {
          // For boolean filters, check if there's an active filter
          const booleanFilter = existingFilters.find(f => f.operator === 'EQ');
          if (booleanFilter && booleanFilter.value) {
            setBooleanValue(booleanFilter.value === 'true' ? 'true' : 'false');
          } else {
            setBooleanValue('all');
          }
        } else if (option.type === 'date') {
          // For date filters, look for GTE (start) and LTE (end) filters
          const startFilter = existingFilters.find(f => f.operator === 'GTE');
          const endFilter = existingFilters.find(f => f.operator === 'LTE');
          
          if (startFilter?.value) {
            setDateRangeStart(parseDateString(startFilter.value));
          } else {
            setDateRangeStart(null);
          }
          
          if (endFilter?.value) {
            setDateRangeEnd(parseDateString(endFilter.value));
          } else {
            setDateRangeEnd(null);
          }
          
          setFilterValue('');
          setSelectedValues([]);
        } else if (option.type === 'month') {
          // For month filters, look for GTE filter (start of month)
          // We use the GTE filter value to determine the selected month/year
          const startFilter = existingFilters.find(f => f.operator === 'GTE');
          
          if (startFilter?.value) {
            const date = parseDateString(startFilter.value);
            if (date) {
              // Set to first day of the month to match the picker
              setSelectedMonthYear(new Date(date.getFullYear(), date.getMonth(), 1));
            } else {
              setSelectedMonthYear(null);
            }
          } else {
            setSelectedMonthYear(null);
          }
          
          setFilterValue('');
          setSelectedValues([]);
        } else if (option.type === 'factory' || option.type === 'category' || option.type === 'company' || option.type === 'companyType') {
          // For factory/category/company/companyType filters, look for IN operator with values
          const existingFilter = existingFilters.find(f => f.operator === 'IN' && f.values);
          if (existingFilter && existingFilter.values) {
            setSelectedValues(existingFilter.values);
            setFilterValue('');
          } else {
            setSelectedValues([]);
            setFilterValue('');
          }
        } else if (existingFilters.length > 0) {
          const existingFilter = existingFilters[0];
          if (existingFilter.operator === 'IN' && existingFilter.values) {
            setSelectedValues(existingFilter.values);
            setFilterValue('');
          } else if (existingFilter.value) {
            // For dropdown filters, set selectedValues
            if (option.type === 'dropdown') {
              setSelectedValues([existingFilter.value]);
            } else {
              // For text and number filters, set filterValue
              setFilterValue(existingFilter.value);
              setSelectedValues([]);
            }
            // If it's a number filter, also set the operator
            if (option.type === 'number' && ['EQ', 'GT', 'GTE', 'LT', 'LTE'].includes(existingFilter.operator)) {
              setNumberOperator(existingFilter.operator);
            }
          } else {
            setSelectedValues([]);
            setFilterValue('');
          }
        } else {
          setSelectedValues([]);
          setFilterValue('');
          setDateRangeStart(null);
          setDateRangeEnd(null);
          // Reset to default operator for number filters
          if (option.type === 'number') {
            setNumberOperator('EQ');
          }
        }
      } else {
        setSelectedValues([]);
        setFilterValue('');
        setDateRangeStart(null);
        setDateRangeEnd(null);
      }
    } else {
      setSelectedValues([]);
      setFilterValue('');
      setNumberOperator('EQ');
      setDateRangeStart(null);
      setDateRangeEnd(null);
    }
  }, [expandedFilterId, localFilters, filterOptions]);

  const handleFilterOptionClick = (option: FilterOption) => {
    if (option.available === false) return;
    
    if (expandedFilterId === option.id) {
      setExpandedFilterId(null);
    } else {
      setExpandedFilterId(option.id);
      setFilterValue('');
      // Reset number operator to default when opening a number filter
      if (option.type === 'number') {
        setNumberOperator('EQ');
      }
      // Reset date range when opening a date filter
      if (option.type === 'date') {
        setDateRangeStart(null);
        setDateRangeEnd(null);
      }
      // Reset month/year when opening a month filter
      if (option.type === 'month') {
        // Don't reset if there's already a filter for this column
        const existingFilters = localFilters.filter(f => f.columnName === option.columnName);
        if (existingFilters.length === 0) {
          setSelectedMonthYear(null);
        }
      }
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
    setIsExpanded(false);
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
        // Note: Don't set value for IN operator - API expects only values array
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
    setIsExpanded(false);
  };

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter(v => v !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
  };

  const handleApplyNumberFilter = (option: FilterOption, value: string) => {
    if (!option.columnName) return;
    
    const newFilter: ActiveFilter = {
      columnName: option.columnName,
      operator: numberOperator,
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
    setIsExpanded(false);
  };

  const handleApplyDateRangeFilter = (option: FilterOption) => {
    if (!option.columnName) return;
    
    // Remove existing date filters for this column
    const newFilters = localFilters.filter(f => 
      f.columnName !== option.columnName || (f.operator !== 'GTE' && f.operator !== 'LTE')
    );
    
    // Add GTE filter for start date
    if (dateRangeStart) {
      newFilters.push({
        columnName: option.columnName,
        operator: 'GTE',
        value: formatDateToBackend(dateRangeStart),
      });
    }
    
    // Add LTE filter for end date
    if (dateRangeEnd) {
      newFilters.push({
        columnName: option.columnName,
        operator: 'LTE',
        value: formatDateToBackend(dateRangeEnd),
      });
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
    setDateRangeStart(null);
    setDateRangeEnd(null);
    setIsExpanded(false);
  };

  const handleApplyMonthYearFilter = (option: FilterOption) => {
    if (!option.columnName || !selectedMonthYear) return;
    
    // Remove existing month filters for this column (GTE and LTE)
    const newFilters = localFilters.filter(f => 
      f.columnName !== option.columnName || (f.operator !== 'GTE' && f.operator !== 'LTE')
    );
    
    // Calculate first and last day of the selected month
    const year = selectedMonthYear.getFullYear();
    const month = selectedMonthYear.getMonth();
    
    // Always use YYYY-MM-DD format (without time) for month filters
    // First day of month: YYYY-MM-01
    const monthStr = String(month + 1).padStart(2, '0');
    const firstDay = `${year}-${monthStr}-01`;
    
    // Last day of month: get the last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const lastDay = `${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`;
    
    // Add GTE filter for start of month
    newFilters.push({
      columnName: option.columnName,
      operator: 'GTE',
      value: firstDay,
    });
    
    // Add LTE filter for end of month
    newFilters.push({
      columnName: option.columnName,
      operator: 'LTE',
      value: lastDay,
    });
    
    setLocalFilters(newFilters);
    
    // Notify parent
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else if (onFilterChange) {
      // Backward compatibility - use the first filter
      onFilterChange(newFilters.length > 0 ? newFilters[0] : undefined);
    }
    setExpandedFilterId(null);
    setSelectedMonthYear(null);
    setIsExpanded(false);
  };

  const handleApplyBooleanFilter = (option: FilterOption, value: 'all' | 'true' | 'false') => {
    if (!option.columnName) return;
    
    // Remove existing filter for this column
    const newFilters = localFilters.filter(f => f.columnName !== option.columnName);
    
    // Add filter only if value is not 'all'
    if (value !== 'all') {
      newFilters.push({
        columnName: option.columnName,
        operator: 'EQ',
        value: value, // 'true' or 'false' as string
      });
    }
    
    setLocalFilters(newFilters);
    
    // Notify parent
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else if (onFilterChange) {
      onFilterChange(newFilters.length > 0 ? newFilters[0] : undefined);
    }
    setExpandedFilterId(null);
    setBooleanValue(null);
  };

  const handleClearFilter = (columnName?: string) => {
    if (columnName) {
      // Clear specific filter (for date and month filters, this removes both GTE and LTE)
      const option = filterOptions.find(o => o.columnName === columnName);
      const isDateOrMonthFilter = option?.type === 'date' || option?.type === 'month';
      
      const newFilters = localFilters.filter(f => {
        if (f.columnName !== columnName) return true;
        if (isDateOrMonthFilter && (f.operator === 'GTE' || f.operator === 'LTE')) return false;
        return true;
      });
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
    setDateRangeStart(null);
    setDateRangeEnd(null);
    setBooleanValue(null);
    setIsExpanded(false);
  };

  const activeFilterCount = localFilters.length;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          if (isExpanded) setExpandedFilterId(null);
        }}
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-md transition-colors ${
          localFilters.length > 0
            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
            : 'border-[var(--border)] hover:bg-[var(--muted)]'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
          <path d="M3 6h14M7 10h10M11 14h6" strokeLinecap="round"/>
        </svg>
        <span className="hidden sm:inline">Advanced Filters</span>
        <span className="sm:hidden">Filters</span>
        {activeFilterCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-[var(--primary)] text-white text-xs rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Expanded Filter Panel - Rendered via Portal to escape stacking context */}
      {isExpanded && typeof document !== 'undefined' && createPortal(
        <div>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/30"
            onClick={() => {
              setIsExpanded(false);
              setExpandedFilterId(null);
            }}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-4 sm:pt-10 px-2 sm:px-4 pointer-events-none">
            <div
              className="w-full max-w-4xl bg-white rounded-xl shadow-2xl pointer-events-auto border border-gray-200 max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header - Fixed */}
            <div className="flex-shrink-0 flex items-start justify-between p-3 sm:p-6 pb-3 sm:pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-2.5 bg-indigo-50 rounded-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" className="sm:w-5 sm:h-5">
                    <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Advanced Filters</h3>
                  <p className="text-xs sm:text-sm text-gray-500">{filterOptions.filter(f => f.available !== false).length} available filters</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setExpandedFilterId(null);
                }}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 pt-4 sm:pt-6 pb-8">
              {/* Active Filters Display */}
              <ActiveFilters 
                localFilters={localFilters}
                filterOptions={filterOptions}
                onClearFilter={handleClearFilter}
              />

              {/* Filter By Field - With inline dropdowns */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
                  </svg>
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700">Filter By Field</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {filterOptions.map((option) => (
                  <PopoverPrimitive.Root
                    key={option.id}
                    open={expandedFilterId === option.id && option.available !== false}
                    onOpenChange={(open) => {
                      if (open) {
                        handleFilterOptionClick(option);
                      } else {
                        setExpandedFilterId(null);
                      }
                    }}
                  >
                    <PopoverPrimitive.Trigger asChild>
                      <button 
                        onClick={() => handleFilterOptionClick(option)}
                        disabled={option.available === false}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          option.available === false
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : expandedFilterId === option.id
                              ? 'bg-indigo-600 text-white shadow-lg border border-indigo-600'
                              : localFilters.some(f => f.columnName === option.columnName)
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
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
                    </PopoverPrimitive.Trigger>

                    {/* Popover Content for filter value */}
                    {expandedFilterId === option.id && option.available !== false && (
                      <PopoverPrimitive.Portal>
                        <PopoverPrimitive.Content
                          side="bottom"
                          align="start"
                          sideOffset={4}
                          className="z-[10000] bg-white rounded-lg shadow-xl overflow-hidden"
                          style={{ 
                            width: option.type === 'date' ? '320px' : option.type === 'month' ? '240px' : 'var(--radix-popover-trigger-width)' 
                          }}
                          onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                        {option.type === 'number' ? (
                          <NumberFilter
                            option={option}
                            filterValue={filterValue}
                            numberOperator={numberOperator}
                            onFilterValueChange={setFilterValue}
                            onOperatorChange={setNumberOperator}
                            onApply={handleApplyNumberFilter}
                          />
                        ) : option.type === 'date' ? (
                          <DateRangeFilter
                            option={option}
                            dateRangeStart={dateRangeStart}
                            dateRangeEnd={dateRangeEnd}
                            onDateRangeChange={(start, end) => {
                              setDateRangeStart(start);
                              setDateRangeEnd(end);
                            }}
                            onApply={handleApplyDateRangeFilter}
                          />
                        ) : option.type === 'month' ? (
                          <MonthYearFilter
                            option={option}
                            selectedMonthYear={selectedMonthYear}
                            onMonthYearChange={setSelectedMonthYear}
                            onApply={handleApplyMonthYearFilter}
                          />
                        ) : option.type === 'dropdown' ? (
                          <DropdownFilter
                            option={option}
                            filterValue={filterValue}
                            selectedValues={selectedValues}
                            onFilterValueChange={setFilterValue}
                            onToggleValue={toggleValue}
                            onApply={handleApplyMultiSelect}
                          />
                        ) : option.type === 'boolean' ? (
                          <BooleanFilter
                            option={option}
                            selectedValue={booleanValue}
                            onValueChange={(value) => {
                              setBooleanValue(value);
                              handleApplyBooleanFilter(option, value);
                            }}
                            onClear={() => {
                              setBooleanValue(null);
                              handleClearFilter(option.columnName);
                            }}
                            hasActiveFilter={localFilters.some(f => f.columnName === option.columnName)}
                          />
                        ) : option.type === 'factory' ? (
                          <FactoryFilter
                            option={option}
                            selectedValues={selectedValues}
                            onToggleValue={toggleValue}
                            onApply={handleApplyMultiSelect}
                            onClear={() => {
                              setSelectedValues([]);
                              handleClearFilter(option.columnName);
                            }}
                            hasActiveFilter={selectedValues.length > 0}
                          />
                        ) : option.type === 'category' ? (
                          <CategoryFilter
                            option={option}
                            selectedValues={selectedValues}
                            onToggleValue={toggleValue}
                            onApply={handleApplyMultiSelect}
                            onClear={() => {
                              setSelectedValues([]);
                              handleClearFilter(option.columnName);
                            }}
                            hasActiveFilter={selectedValues.length > 0}
                            factoryId={undefined}
                          />
                        ) : option.type === 'company' ? (
                          <CompanyFilter
                            option={option}
                            selectedValues={selectedValues}
                            onToggleValue={toggleValue}
                            onApply={handleApplyMultiSelect}
                            onClear={() => {
                              setSelectedValues([]);
                              handleClearFilter(option.columnName);
                            }}
                            hasActiveFilter={selectedValues.length > 0}
                          />
                        ) : option.type === 'companyType' ? (
                          <CompanyTypeFilter
                            option={option}
                            selectedValues={selectedValues}
                            onToggleValue={toggleValue}
                            onApply={handleApplyMultiSelect}
                            onClear={() => {
                              setSelectedValues([]);
                              handleClearFilter(option.columnName);
                            }}
                            hasActiveFilter={selectedValues.length > 0}
                          />
                        ) : (
                          <TextFilter
                            option={option}
                            filterValue={filterValue}
                            textOperator={textOperator}
                            onFilterValueChange={setFilterValue}
                            onOperatorChange={setTextOperator}
                            onApply={handleApplyFilter}
                          />
                        )}
                        </PopoverPrimitive.Content>
                      </PopoverPrimitive.Portal>
                    )}
                  </PopoverPrimitive.Root>
                ))}
              </div>
            </div>
            </div>

            {/* Footer - Fixed */}
            {localFilters.length > 0 && (
              <div className="flex-shrink-0 flex justify-end p-3 sm:p-6 pt-4 border-t border-gray-100 bg-white">
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
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
