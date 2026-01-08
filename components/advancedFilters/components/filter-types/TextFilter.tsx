import React from 'react';
import type { FilterOption, FilterOperator } from '../../types';

type TextFilterProps = {
  option: FilterOption;
  filterValue: string;
  onFilterValueChange: (value: string) => void;
  onApply: (option: FilterOption, value: string, operator?: FilterOperator) => void;
};

export function TextFilter({ option, filterValue, onFilterValueChange, onApply }: TextFilterProps) {
  return (
    <div className="flex flex-col">
      <div className="p-3 border-b border-gray-100">
        <input
          type="text"
          value={filterValue}
          onChange={(e) => onFilterValueChange(e.target.value)}
          placeholder={`Search ${option.label.toLowerCase()}...`}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </div>
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end">
        <button
          onClick={() => onApply(option, filterValue, 'ILIKE')}
          disabled={!filterValue.trim()}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

