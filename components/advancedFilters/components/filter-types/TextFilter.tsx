import React, { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { FilterOption, FilterOperator } from '../../types';

type TextFilterProps = {
  option: FilterOption;
  filterValue: string;
  textOperator?: FilterOperator;
  onFilterValueChange: (value: string) => void;
  onOperatorChange?: (operator: FilterOperator) => void;
  onApply: (option: FilterOption, value: string, operator?: FilterOperator) => void;
  onClear?: () => void;
  hasActiveFilter?: boolean;
};

export function TextFilter({ 
  option, 
  filterValue, 
  textOperator = 'ILIKE',
  onFilterValueChange,
  onOperatorChange,
  onApply, 
  onClear, 
  hasActiveFilter 
}: TextFilterProps) {
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false);
  const [localOperator, setLocalOperator] = useState<FilterOperator>(textOperator);

  const getOperatorLabel = (op: FilterOperator): string => {
    const labels: Record<'EQ' | 'ILIKE', string> = {
      EQ: 'Equal',
      ILIKE: 'Contains',
    };
    return labels[op as keyof typeof labels] || op;
  };

  const handleOperatorChange = (op: FilterOperator) => {
    setLocalOperator(op);
    if (onOperatorChange) {
      onOperatorChange(op);
    }
    setIsOperatorDropdownOpen(false);
  };

  return (
    <div className="flex flex-col">
      <div className="p-3 space-y-2 border-b border-gray-100">
        {/* Operator Dropdown */}
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
              <span>{getOperatorLabel(localOperator)}</span>
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
              className="z-[10001] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
              style={{ width: 'var(--radix-popover-trigger-width)' }}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {(['EQ', 'ILIKE'] as FilterOperator[]).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => handleOperatorChange(op)}
                  className={`
                    w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between
                    ${localOperator === op ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}
                  `}
                >
                  <span>{getOperatorLabel(op)}</span>
                  {localOperator === op && (
                    <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>

        {/* Text Input */}
        <input
          type="text"
          value={filterValue}
          onChange={(e) => onFilterValueChange(e.target.value)}
          placeholder={`Search ${option.label.toLowerCase()}...`}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-normal"
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
          onClick={() => onApply(option, filterValue, localOperator)}
          disabled={!filterValue.trim()}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ml-auto"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

