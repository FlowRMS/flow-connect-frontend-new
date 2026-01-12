'use client';

import React, { useState, useEffect } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { FilterOperator, FilterOption } from '../types';
import { TextFilter } from './filter-types/TextFilter';
import { DropdownFilter } from './filter-types/DropdownFilter';
import { NumberFilter } from './filter-types/NumberFilter';
import { DateRangeFilter } from './filter-types/DateRangeFilter';
import { BooleanFilter } from './filter-types/BooleanFilter';
import { parseDateString, formatDateToISO } from '../utils';

export type ColumnFilterType = 'text' | 'dropdown' | 'number' | 'date' | 'boolean';

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
  value: ColumnFilterValue;
  onChange: (value: ColumnFilterValue) => void;
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
  const [localTextValue, setLocalTextValue] = useState(value.text || '');
  const [localSelectedValues, setLocalSelectedValues] = useState<string[]>(value.selected || []);
  const [localDateStart, setLocalDateStart] = useState<Date | null>(
    value.dateStart ? parseDateString(value.dateStart) : null
  );
  const [localDateEnd, setLocalDateEnd] = useState<Date | null>(
    value.dateEnd ? parseDateString(value.dateEnd) : null
  );
  const [localNumberOperator, setLocalNumberOperator] = useState<FilterOperator>(
    value.operator || 'EQ'
  );
  const [localBooleanValue, setLocalBooleanValue] = useState<'all' | 'true' | 'false' | null>(() => {
    // Determine initial boolean value from prop
    if (value.text === 'true') return 'true';
    if (value.text === 'false') return 'false';
    return 'all';
  });

  // Sync local state with prop value when popover opens or value changes
  useEffect(() => {
    setLocalTextValue(value.text || '');
    setLocalSelectedValues(value.selected || []);
    setLocalDateStart(value.dateStart ? parseDateString(value.dateStart) : null);
    setLocalDateEnd(value.dateEnd ? parseDateString(value.dateEnd) : null);
    if (value.operator) {
      setLocalNumberOperator(value.operator);
    }
    // Sync boolean value
    if (type === 'boolean') {
      if (value.text === 'true') {
        setLocalBooleanValue('true');
      } else if (value.text === 'false') {
        setLocalBooleanValue('false');
      } else {
        setLocalBooleanValue('all');
      }
    }
  }, [value, type]);

  // Determine if filter has an active value - check both prop value and local state
  const hasValue =
    type === 'text'
      ? (value.text !== undefined && value.text.trim() !== '') || localTextValue.trim() !== ''
      : type === 'dropdown'
      ? (value.selected !== undefined && value.selected.length > 0) || localSelectedValues.length > 0
      : type === 'number'
      ? (value.text !== undefined && value.text.trim() !== '') || localTextValue.trim() !== ''
      : type === 'boolean'
      ? (value.text === 'true' || value.text === 'false') || (localBooleanValue !== 'all' && localBooleanValue !== null)
      : (value.dateStart !== undefined && value.dateStart !== '') || (value.dateEnd !== undefined && value.dateEnd !== '') || localDateStart !== null || localDateEnd !== null;

  // Create filter option for internal components
  // Preserve the type explicitly to prevent it from changing
  const filterOption = {
    id: columnName,
    label: columnName,
    type: type as 'text' | 'dropdown' | 'number' | 'date' | 'boolean',
    columnName,
    options: type === 'dropdown' ? options : undefined,
  };

  const handleTextApply = (option: FilterOption, value: string) => {
    onChange({
      text: value.trim(),
    });
    onToggle();
  };

  const handleDropdownApply = () => {
    onChange({
      selected: localSelectedValues,
    });
    onToggle();
  };

  const handleNumberApply = () => {
    onChange({
      text: localTextValue.trim(),
      operator: localNumberOperator,
    });
    onToggle();
  };

  const handleDateApply = () => {
    onChange({
      dateStart: localDateStart ? formatDateToISO(localDateStart) : undefined,
      dateEnd: localDateEnd ? formatDateToISO(localDateEnd) : undefined,
    });
    onToggle();
  };

  const handleBooleanChange = (val: 'all' | 'true' | 'false') => {
    if (val === 'all') {
      onChange({ text: '' });
    } else {
      onChange({ text: val });
    }
    // Auto-apply boolean filters (no need to keep popover open)
    onToggle();
  };

  const handleClear = () => {
    if (type === 'text' || type === 'number') {
      onChange({ text: '' });
    } else if (type === 'dropdown') {
      onChange({ selected: [] });
    } else if (type === 'boolean') {
      onChange({ text: '' });
    } else {
      onChange({ dateStart: undefined, dateEnd: undefined });
    }
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
              onFilterValueChange={setLocalTextValue}
              onApply={handleTextApply}
              onClear={handleClear}
              hasActiveFilter={!!value.text && value.text.trim() !== ''}
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
              hasActiveFilter={!!value.selected && value.selected.length > 0}
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
              hasActiveFilter={!!value.text && value.text.trim() !== ''}
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
              hasActiveFilter={!!value.text && (value.text === 'true' || value.text === 'false')}
            />
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

