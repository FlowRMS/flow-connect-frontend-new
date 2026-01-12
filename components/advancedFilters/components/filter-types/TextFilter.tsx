import React from 'react';
import type { FilterOption, FilterOperator } from '../../types';

type TextFilterProps = {
  option: FilterOption;
  filterValue: string;
  onFilterValueChange: (value: string) => void;
  onApply: (option: FilterOption, value: string, operator?: FilterOperator) => void;
  onClear?: () => void;
  hasActiveFilter?: boolean;
};

export function TextFilter({ option, filterValue, onFilterValueChange, onApply, onClear, hasActiveFilter }: TextFilterProps) {
  return (
    <div className="flex flex-col">
      <div className="p-3 border-b border-gray-100">
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
          onClick={() => onApply(option, filterValue, 'ILIKE')}
          disabled={!filterValue.trim()}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ml-auto"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

