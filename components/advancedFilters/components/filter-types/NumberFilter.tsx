import React, { useState, useEffect, useRef } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { FilterOption, FilterOperator } from '../../types';
import { formatNumber, parseFormattedNumber, getNumberPlaceholder } from '../../utils/numberFormat';

type NumberFilterProps = {
  option: FilterOption;
  filterValue: string;
  numberOperator: FilterOperator;
  onFilterValueChange: (value: string) => void;
  onOperatorChange: (operator: FilterOperator) => void;
  onApply: (option: FilterOption, value: string) => void;
  onClear?: () => void;
  hasActiveFilter?: boolean;
};

export function NumberFilter({ 
  option, 
  filterValue, 
  numberOperator, 
  onFilterValueChange, 
  onOperatorChange,
  onApply,
  onClear,
  hasActiveFilter
}: NumberFilterProps) {
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false);
  const numberFormat = option.numberFormat || 'number';
  const isInternalChange = useRef(false);
  
  // Initialize displayValue with formatted value if it exists
  const getInitialDisplayValue = (value: string) => {
    if (!value) return '';
    // If value is a pure number, format it
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return formatNumber(num, numberFormat);
    }
    return value;
  };
  
  const [displayValue, setDisplayValue] = useState(() => getInitialDisplayValue(filterValue));

  // Synchronize displayValue with filterValue when it changes externally (e.g., clear)
  useEffect(() => {
    if (!isInternalChange.current) {
      const currentParsed = parseFormattedNumber(displayValue, numberFormat);
      const filterParsed = parseFormattedNumber(filterValue, numberFormat);
      
      // Only update if the parsed values are different (external change)
      // This prevents resetting the formatted display when user is typing
      if (currentParsed !== filterParsed && filterValue !== '') {
        const newDisplayValue = getInitialDisplayValue(filterValue);
        setDisplayValue(newDisplayValue);
      } else if (filterValue === '' && displayValue !== '') {
        // Clear display when filterValue is cleared externally
        setDisplayValue('');
      }
    }
    // Reset the flag after checking
    isInternalChange.current = false;
  }, [filterValue, numberFormat]);

  const getOperatorLabel = (op: FilterOperator): string => {
    const labels: Record<'EQ' | 'GT' | 'GTE' | 'LT' | 'LTE', string> = {
      EQ: 'Equal to',
      GT: 'Greater than',
      GTE: 'Greater than or equal to',
      LT: 'Less than',
      LTE: 'Less than or equal to',
    };
    return labels[op as keyof typeof labels] || op;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isInternalChange.current = true;
    const rawValue = e.target.value;
    
    // If the user clears everything, clear
    if (!rawValue.trim()) {
      setDisplayValue('');
      onFilterValueChange('');
      return;
    }
    
    // For currency, allow free typing but add $ prefix if missing
    // Don't format completely while typing to avoid cursor issues
    let displayValueToSet = rawValue;
    if (numberFormat === 'currency') {
      // Remove any existing $ and commas, then add $ prefix
      const cleaned = rawValue.replace(/[$,]/g, '');
      if (cleaned && !rawValue.startsWith('$')) {
        displayValueToSet = '$' + cleaned;
      } else if (rawValue.startsWith('$')) {
        displayValueToSet = '$' + rawValue.replace(/[$,]/g, '');
      }
    } else if (numberFormat === 'percentage') {
      // For percentage, allow free typing but add % suffix if missing
      const cleaned = rawValue.replace(/%/g, '');
      if (cleaned && !rawValue.endsWith('%')) {
        displayValueToSet = cleaned + '%';
      } else if (rawValue.endsWith('%')) {
        displayValueToSet = rawValue.replace(/%/g, '') + '%';
      }
    }
    
    setDisplayValue(displayValueToSet);
    
    // Parse and send the pure numeric value to parent
    const parsed = parseFormattedNumber(displayValueToSet, numberFormat);
    onFilterValueChange(parsed);
  };

  const handleInputBlur = () => {
    // Format properly when user finishes typing (on blur)
    if (!displayValue.trim()) return;
    
    const parsed = parseFormattedNumber(displayValue, numberFormat);
    if (parsed) {
      const num = parseFloat(parsed);
      if (!isNaN(num)) {
        const formatted = formatNumber(num, numberFormat);
        setDisplayValue(formatted);
      }
    }
  };

  const handleApply = () => {
    // Make sure we send the parsed value (pure number)
    const parsed = parseFormattedNumber(displayValue, numberFormat);
    onApply(option, parsed);
  };

  return (
    <div className="flex flex-col">
      <div className="p-3 space-y-2 border-b border-gray-100">
        {/* Operator Dropdown - Using Popover */}
        <PopoverPrimitive.Root
          open={isOperatorDropdownOpen}
          onOpenChange={setIsOperatorDropdownOpen}
        >
          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              className={`
                w-full px-3 py-2 text-sm border rounded-lg text-left flex items-center justify-between
                transition-all bg-white text-gray-900
                ${isOperatorDropdownOpen 
                  ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-20' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <span>{getOperatorLabel(numberOperator)}</span>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOperatorDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
              side="bottom"
              align="start"
              sideOffset={4}
              className="z-[101] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
              style={{ width: 'var(--radix-popover-trigger-width)' }}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {(['EQ', 'GT', 'GTE', 'LT', 'LTE'] as FilterOperator[]).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => {
                    onOperatorChange(op);
                    setIsOperatorDropdownOpen(false);
                  }}
                  className={`
                    w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between
                    ${numberOperator === op ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}
                  `}
                >
                  <span>{getOperatorLabel(op)}</span>
                  {numberOperator === op && (
                    <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={getNumberPlaceholder(numberFormat)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          autoFocus
        />
      </div>
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center gap-2">
        {hasActiveFilter && onClear && (
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Clear
          </button>
        )}
        <button
          onClick={handleApply}
          disabled={!displayValue.trim() || !parseFormattedNumber(displayValue, numberFormat)}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ml-auto"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

