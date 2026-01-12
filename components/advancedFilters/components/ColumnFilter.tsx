'use client';

import React, { useState, useEffect } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { FilterOperator, FilterOption, ActiveFilter } from '../types';
import { TextFilter } from './filter-types/TextFilter';
import { DropdownFilter } from './filter-types/DropdownFilter';
import { NumberFilter } from './filter-types/NumberFilter';
import { DateRangeFilter } from './filter-types/DateRangeFilter';
import { BooleanFilter } from './filter-types/BooleanFilter';
import { parseDateString, formatDateToBackend } from '../utils';

export type ColumnFilterType = 'text' | 'dropdown' | 'number' | 'date' | 'boolean';

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
  isOpen: boolean;
  onToggle: () => void;
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
}: ColumnFilterProps) {
  // Extract values from ActiveFilter[] based on type
  const getTextValue = () => {
    const filter = value.find(f => f.columnName === columnName && f.value);
    return filter?.value || '';
  };

  const getSelectedValues = () => {
    const filter = value.find(f => f.columnName === columnName && f.operator === 'IN' && f.values);
    return filter?.values || [];
  };

  const getDateStart = () => {
    const filter = value.find(f => f.columnName === columnName && f.operator === 'GTE' && f.value);
    return filter?.value ? parseDateString(filter.value) : null;
  };

  const getDateEnd = () => {
    const filter = value.find(f => f.columnName === columnName && f.operator === 'LTE' && f.value);
    return filter?.value ? parseDateString(filter.value) : null;
  };

  const getOperator = () => {
    const filter = value.find(f => f.columnName === columnName && f.value);
    return filter?.operator;
  };

  const [localTextValue, setLocalTextValue] = useState(getTextValue());
  const [localSelectedValues, setLocalSelectedValues] = useState<string[]>(getSelectedValues());
  const [localDateStart, setLocalDateStart] = useState<Date | null>(getDateStart());
  const [localDateEnd, setLocalDateEnd] = useState<Date | null>(getDateEnd());
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

  // Determine if filter has an active value - check both prop value and local state
  const hasValue =
    type === 'text'
      ? getTextValue().trim() !== '' || localTextValue.trim() !== ''
      : type === 'dropdown'
      ? getSelectedValues().length > 0 || localSelectedValues.length > 0
      : type === 'number'
      ? getTextValue().trim() !== '' || localTextValue.trim() !== ''
      : type === 'boolean'
      ? (getTextValue() === 'true' || getTextValue() === 'false') || (localBooleanValue !== 'all' && localBooleanValue !== null)
      : getDateStart() !== null || getDateEnd() !== null || localDateStart !== null || localDateEnd !== null;

  // Create filter option for internal components
  // Preserve the type explicitly to prevent it from changing
  const filterOption = {
    id: columnName,
    label: columnName,
    type: type as 'text' | 'dropdown' | 'number' | 'date' | 'boolean',
    columnName,
    options: type === 'dropdown' ? options : undefined,
  };

  // Helper to remove existing filters for this column and add new ones
  const updateFilters = (newFilters: ActiveFilter[]) => {
    const otherFilters = value.filter(f => f.columnName !== columnName);
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
      const otherFilters = value.filter(f => f.columnName !== columnName);
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
      const otherFilters = value.filter(f => f.columnName !== columnName);
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
      const otherFilters = value.filter(f => f.columnName !== columnName);
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
      const otherFilters = value.filter(f => f.columnName !== columnName);
      onChange(otherFilters);
    }
    onToggle();
  };

  const handleBooleanChange = (val: 'all' | 'true' | 'false') => {
    if (val === 'all') {
      // Remove filter
      const otherFilters = value.filter(f => f.columnName !== columnName);
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
    const otherFilters = value.filter(f => f.columnName !== columnName);
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

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={onToggle}>
      <PopoverPrimitive.Trigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
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
              {type === 'dropdown' ? localSelectedValues.length : '•'}
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
            width: type === 'date' ? '320px' : 'var(--radix-popover-trigger-width)',
            minWidth: '200px',
            maxWidth: '320px'
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
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

