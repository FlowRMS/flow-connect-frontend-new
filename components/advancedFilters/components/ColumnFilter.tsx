'use client';

import React, { useState, useEffect, useMemo } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { FilterOperator, FilterOption, ActiveFilter } from '../types';
import { TextFilter } from './filter-types/TextFilter';
import { DropdownFilter } from './filter-types/DropdownFilter';
import { NumberFilter } from './filter-types/NumberFilter';
import { DateRangeFilter } from './filter-types/DateRangeFilter';
import { BooleanFilter } from './filter-types/BooleanFilter';
import { MonthYearFilter } from './filter-types/MonthYearFilter';
import { FactoryFilter } from './filter-types/FactoryFilter';
import { CategoryFilter } from './filter-types/CategoryFilter';
import { CompanyFilter } from './filter-types/CompanyFilter';
import { CompanyTypeFilter } from './filter-types/CompanyTypeFilter';
import { parseDateString, formatDateToBackend } from '../utils';

export type ColumnFilterType =
  | 'text'
  | 'dropdown'
  | 'number'
  | 'date'
  | 'boolean'
  | 'month'
  | 'factory'
  | 'category'
  | 'company'
  | 'companyType';

// Keep ColumnFilterValue for backward compatibility during migration
export interface ColumnFilterValue {
  // For text and number filters
  text?: string;
  // For dropdown filters (multi-select)
  selected?: string[];
  // For date filters
  dateStart?: string;
  dateEnd?: string;
  // For number filters
  operator?: FilterOperator;
}

export interface ColumnFilterProps {
  type: ColumnFilterType;
  columnName: string;
  value: ActiveFilter[]; // Changed to ActiveFilter[]
  onChange: (filters: ActiveFilter[]) => void; // Changed to ActiveFilter[]
  options?: string[]; // For dropdown filters
  placeholder?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  filterOption?: FilterOption; // Optional: full filter option with numberFormat, etc.
  factoryId?: string; // Optional: factory ID for category filter
}

/**
 * Reusable column filter component that renders the appropriate filter UI
 * based on the filter type. Uses the existing filter components from advancedFilters.
 */
export function ColumnFilter({
  type,
  columnName,
  value,
  onChange,
  options = [],
  placeholder,
  isOpen,
  onToggle,
  filterOption: externalFilterOption,
  factoryId,
}: ColumnFilterProps) {
  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : [];
  
  // Extract values from ActiveFilter[] based on type
  const getTextValue = () => {
    const filter = safeValue.find(f => f.columnName === columnName && f.value);
    return filter?.value || '';
  };

  const getSelectedValues = () => {
    const filter = safeValue.find(f => f.columnName === columnName && f.operator === 'IN' && f.values);
    return filter?.values || [];
  };

  // Get factoryId from active filters (for category filter)
  const getFactoryIdFromFilters = () => {
    // Look for factoryTitle filter in the parent filters
    // This is a bit of a hack - we need to check if there's a factory filter active
    // Since we don't have direct access to all filters, we'll need to pass this as a prop
    // For now, return undefined and handle it in the component that uses ColumnFilter
    return undefined;
  };

  const getDateStart = () => {
    const filter = safeValue.find(f => f.columnName === columnName && f.operator === 'GTE' && f.value);
    return filter?.value ? parseDateString(filter.value) : null;
  };

  const getDateEnd = () => {
    const filter = safeValue.find(f => f.columnName === columnName && f.operator === 'LTE' && f.value);
    return filter?.value ? parseDateString(filter.value) : null;
  };

  const getOperator = () => {
    const filter = safeValue.find(f => f.columnName === columnName && f.value);
    return filter?.operator;
  };

  const [localTextValue, setLocalTextValue] = useState(getTextValue());
  const [localSelectedValues, setLocalSelectedValues] = useState<string[]>(getSelectedValues());
  const [localDateStart, setLocalDateStart] = useState<Date | null>(getDateStart());
  const [localDateEnd, setLocalDateEnd] = useState<Date | null>(getDateEnd());
  const [localMonthYear, setLocalMonthYear] = useState<Date | null>(() => {
    // For month filters, extract from GTE filter (start of month)
    if (type === 'month') {
      const gteFilter = safeValue.find(f => f.columnName === columnName && f.operator === 'GTE' && f.value);
      if (gteFilter?.value) {
        // Parse YYYY-MM-DD format to Date
        const date = parseDateString(gteFilter.value);
        return date;
      }
    }
    return null;
  });
  const [localNumberOperator, setLocalNumberOperator] = useState<FilterOperator>(
    getOperator() || 'EQ'
  );
  const [localTextOperator, setLocalTextOperator] = useState<FilterOperator>(() => {
    const op = getOperator();
    if (type === 'text' && op) {
      return op;
    }
    return 'ILIKE'; // Default to 'Contains' for text filters
  });
  const [localBooleanValue, setLocalBooleanValue] = useState<'all' | 'true' | 'false' | null>(() => {
    const textVal = getTextValue();
    if (textVal === 'true') return 'true';
    if (textVal === 'false') return 'false';
    return 'all';
  });

  // Sync local state with prop value when popover opens or value changes
  useEffect(() => {
    setLocalTextValue(getTextValue());
    setLocalSelectedValues(getSelectedValues());
    setLocalDateStart(getDateStart());
    setLocalDateEnd(getDateEnd());
    const op = getOperator();
    if (op) {
      if (type === 'number') {
        setLocalNumberOperator(op);
      } else if (type === 'text') {
        setLocalTextOperator(op);
      }
    }
    // Sync boolean value
    if (type === 'boolean') {
      const textVal = getTextValue();
      if (textVal === 'true') {
        setLocalBooleanValue('true');
      } else if (textVal === 'false') {
        setLocalBooleanValue('false');
      } else {
        setLocalBooleanValue('all');
      }
    }
  }, [value, type, columnName]);

  // Determine if filter has an active value - check prop value
  // safeValue should already contain only filters for this column when passed from parent
  const hasActiveFilterInValue = useMemo(() => {
    // If value is not an array or is empty, no active filter
    if (!Array.isArray(safeValue) || safeValue.length === 0) {
      return false;
    }
    
    // Check if any filter in safeValue has a valid value
    // Note: safeValue should already be filtered by column when passed from parent component
    // So we check all filters in the array (they should all be for this column)
    // But we also verify columnName matches as a safety check
    for (const filter of safeValue) {
      if (!filter) continue;
      
      // Safety check: verify the filter matches this column
      // This is important because safeValue might contain filters for other columns in edge cases
      if (filter.columnName && filter.columnName !== columnName) {
        continue;
      }
      
      // Check based on type - any filter with a valid value means it's active
      if (type === 'text' || type === 'number') {
        if (filter.value && String(filter.value).trim() !== '') {
          return true;
        }
      } else if (type === 'dropdown') {
        if (filter.values && Array.isArray(filter.values) && filter.values.length > 0) {
          return true;
        }
      } else if (type === 'boolean') {
        if (filter.value === 'true' || filter.value === 'false') {
          return true;
        }
      } else if (type === 'date') {
        // For date filters, check if there's a GTE or LTE filter with a value
        if ((filter.operator === 'GTE' || filter.operator === 'LTE') && filter.value) {
          return true;
        }
      } else if (type === 'factory' || type === 'category' || type === 'company') {
        if (filter.values && Array.isArray(filter.values) && filter.values.length > 0) {
          return true;
        }
      }
    }
    
    return false;
  }, [safeValue, type, columnName]);

  // Calculate hasValue - prioritize prop value over local state
  // This ensures the badge shows when filters are applied from backend
  const hasValue = useMemo(() => {
    // First check if there are active filters in the prop value
    if (hasActiveFilterInValue) return true;
    
    // Then check local state (for when user is configuring but hasn't applied yet)
    if (type === 'text' || type === 'number') {
      return localTextValue.trim() !== '';
    }
    if (type === 'dropdown') {
      return localSelectedValues.length > 0;
    }
    if (type === 'boolean') {
      return localBooleanValue !== 'all' && localBooleanValue !== null;
    }
    if (type === 'date') {
      return localDateStart !== null || localDateEnd !== null;
    }
    if (type === 'factory' || type === 'category' || type === 'company' || type === 'companyType') {
      return localSelectedValues.length > 0;
    }
    return false;
  }, [hasActiveFilterInValue, type, localTextValue, localSelectedValues, localBooleanValue, localDateStart, localDateEnd]);

  // Create filter option for internal components
  // Use external filterOption if provided (includes numberFormat, etc.), otherwise create one
  const filterOption: FilterOption = externalFilterOption || {
    id: columnName,
    label: columnName,
    type: type as 'text' | 'dropdown' | 'number' | 'date' | 'boolean',
    columnName,
    options: type === 'dropdown' ? options : undefined,
  };

  // Helper to remove existing filters for this column and add new ones
  const updateFilters = (newFilters: ActiveFilter[]) => {
    const otherFilters = safeValue.filter(f => f.columnName !== columnName);
    onChange([...otherFilters, ...newFilters]);
  };

  const handleTextApply = (option: FilterOption, val: string, operator?: FilterOperator) => {
    const trimmedVal = val.trim();
    if (trimmedVal) {
      updateFilters([{
        columnName,
        operator: operator || localTextOperator,
        value: trimmedVal,
      }]);
    } else {
      // Remove filter if empty
      const otherFilters = safeValue.filter(f => f.columnName !== columnName);
      onChange(otherFilters);
    }
    onToggle();
  };

  const handleDropdownApply = () => {
    if (localSelectedValues.length > 0) {
      updateFilters([{
        columnName,
        operator: 'IN',
        values: localSelectedValues,
      }]);
    } else {
      // Remove filter if empty
      const otherFilters = safeValue.filter(f => f.columnName !== columnName);
      onChange(otherFilters);
    }
    onToggle();
  };

  const handleNumberApply = () => {
    const trimmedVal = localTextValue.trim();
    if (trimmedVal) {
      updateFilters([{
        columnName,
        operator: localNumberOperator,
        value: trimmedVal,
      }]);
    } else {
      // Remove filter if empty
      const otherFilters = safeValue.filter(f => f.columnName !== columnName);
      onChange(otherFilters);
    }
    onToggle();
  };

  const handleDateApply = () => {
    const newFilters: ActiveFilter[] = [];
    if (localDateStart) {
      newFilters.push({
        columnName,
        operator: 'GTE',
        value: formatDateToBackend(localDateStart),
      });
    }
    if (localDateEnd) {
      newFilters.push({
        columnName,
        operator: 'LTE',
        value: formatDateToBackend(localDateEnd),
      });
    }
    if (newFilters.length > 0) {
      updateFilters(newFilters);
    } else {
      // Remove filter if empty
      const otherFilters = safeValue.filter(f => f.columnName !== columnName);
      onChange(otherFilters);
    }
    onToggle();
  };

  const handleMonthYearApply = (option: FilterOption) => {
    if (!localMonthYear) {
      // Remove filter if empty
      const otherFilters = safeValue.filter(f => f.columnName !== columnName);
      onChange(otherFilters);
      onToggle();
      return;
    }

    // Calculate first and last day of the selected month
    const year = localMonthYear.getFullYear();
    const month = localMonthYear.getMonth();
    
    // Always use YYYY-MM-DD format (without time) for month filters
    const monthStr = String(month + 1).padStart(2, '0');
    const firstDay = `${year}-${monthStr}-01`;
    
    // Last day of month: get the last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const lastDay = `${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`;
    
    const newFilters: ActiveFilter[] = [
      {
        columnName,
        operator: 'GTE',
        value: firstDay,
      },
      {
        columnName,
        operator: 'LTE',
        value: lastDay,
      },
    ];
    
    updateFilters(newFilters);
    onToggle();
  };

  const handleBooleanChange = (val: 'all' | 'true' | 'false') => {
    if (val === 'all') {
      // Remove filter
      const otherFilters = safeValue.filter(f => f.columnName !== columnName);
      onChange(otherFilters);
    } else {
      updateFilters([{
        columnName,
        operator: 'EQ',
        value: val,
      }]);
    }
    // Auto-apply boolean filters (no need to keep popover open)
    onToggle();
  };

  const handleClear = () => {
    // Remove all filters for this column
    const otherFilters = safeValue.filter(f => f.columnName !== columnName);
    onChange(otherFilters);
    onToggle();
  };

  const toggleDropdownValue = (val: string) => {
    if (localSelectedValues.includes(val)) {
      setLocalSelectedValues(localSelectedValues.filter((v) => v !== val));
    } else {
      setLocalSelectedValues([...localSelectedValues, val]);
    }
  };

  // Props for controlled vs uncontrolled popover
  const rootProps =
    typeof isOpen === 'boolean' && onToggle
      ? { open: isOpen, onOpenChange: onToggle }
      : {};

  return (
    <PopoverPrimitive.Root {...rootProps}>
      <PopoverPrimitive.Trigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggle) {
              onToggle();
            }
          }}
          className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors relative ${
            hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'
          }`}
          title="Filter"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {hasValue && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-[10px] rounded-full flex items-center justify-center">
              {(type === 'dropdown' || type === 'factory' || type === 'category' || type === 'company' || type === 'companyType')
                ? localSelectedValues.length
                : '•'}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-[100] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
          style={{
            width:
              type === 'date' || type === 'month'
                ? '300px'
                : type === 'company' || type === 'companyType'
                  ? '280px'
                  : 'var(--radix-popover-trigger-width)',
            minWidth:
              type === 'date'
                ? '300px'
                : type === 'company' || type === 'companyType'
                  ? '220px'
                  : '200px',
            maxWidth:
              type === 'month'
                ? '300px'
                : type === 'date'
                  ? '300px'
                  : type === 'company' || type === 'companyType'
                    ? '320px'
                    : '320px',
          }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {type === 'text' && (
            <TextFilter
              option={{
                ...filterOption,
                label: placeholder ? placeholder.replace('Filter ', '').replace('...', '') : filterOption.label,
              }}
              filterValue={localTextValue}
              textOperator={localTextOperator}
              onFilterValueChange={setLocalTextValue}
              onOperatorChange={setLocalTextOperator}
              onApply={handleTextApply}
              onClear={handleClear}
              hasActiveFilter={getTextValue().trim() !== ''}
            />
          )}

          {type === 'dropdown' && (
            <DropdownFilter
              option={filterOption}
              filterValue=""
              selectedValues={localSelectedValues}
              onFilterValueChange={() => {}}
              onToggleValue={toggleDropdownValue}
              onApply={handleDropdownApply}
              onClear={handleClear}
              hasActiveFilter={getSelectedValues().length > 0}
            />
          )}

          {type === 'number' && (
            <NumberFilter
              option={filterOption}
              filterValue={localTextValue}
              numberOperator={localNumberOperator}
              onFilterValueChange={setLocalTextValue}
              onOperatorChange={setLocalNumberOperator}
              onApply={handleNumberApply}
              onClear={handleClear}
              hasActiveFilter={getTextValue().trim() !== ''}
            />
          )}

          {type === 'date' && (
            <DateRangeFilter
              option={filterOption}
              dateRangeStart={localDateStart}
              dateRangeEnd={localDateEnd}
              onDateRangeChange={(start, end) => {
                setLocalDateStart(start);
                setLocalDateEnd(end);
              }}
              onApply={handleDateApply}
            />
          )}

          {type === 'boolean' && (
            <BooleanFilter
              option={filterOption}
              selectedValue={localBooleanValue}
              onValueChange={handleBooleanChange}
              onClear={handleClear}
              hasActiveFilter={getTextValue() === 'true' || getTextValue() === 'false'}
            />
          )}

          {type === 'month' && (
            <MonthYearFilter
              option={filterOption}
              selectedMonthYear={localMonthYear}
              onMonthYearChange={setLocalMonthYear}
              onApply={handleMonthYearApply}
            />
          )}

          {type === 'factory' && (
            <FactoryFilter
              option={filterOption}
              selectedValues={localSelectedValues}
              onToggleValue={toggleDropdownValue}
              onApply={handleDropdownApply}
              onClear={handleClear}
              hasActiveFilter={getSelectedValues().length > 0}
            />
          )}

          {type === 'category' && (
            <CategoryFilter
              option={filterOption}
              selectedValues={localSelectedValues}
              onToggleValue={toggleDropdownValue}
              onApply={handleDropdownApply}
              onClear={handleClear}
              hasActiveFilter={getSelectedValues().length > 0}
              factoryId={factoryId}
            />
          )}

          {type === 'company' && (
            <CompanyFilter
              option={filterOption}
              selectedValues={localSelectedValues}
              onToggleValue={toggleDropdownValue}
              onApply={handleDropdownApply}
              onClear={handleClear}
              hasActiveFilter={getSelectedValues().length > 0}
            />
          )}
          
          {type === 'companyType' && (
            <CompanyTypeFilter
              option={filterOption}
              selectedValues={localSelectedValues}
              onToggleValue={toggleDropdownValue}
              onApply={handleDropdownApply}
              onClear={handleClear}
              hasActiveFilter={getSelectedValues().length > 0}
            />
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

