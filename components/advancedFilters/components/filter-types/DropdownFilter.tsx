import React from 'react';
import type { FilterOption } from '../../types';

type DropdownFilterProps = {
  option: FilterOption;
  filterValue: string;
  selectedValues: string[];
  onFilterValueChange: (value: string) => void;
  onToggleValue: (value: string) => void;
  onApply: (option: FilterOption) => void;
};

export function DropdownFilter({ 
  option, 
  filterValue, 
  selectedValues, 
  onFilterValueChange, 
  onToggleValue,
  onApply 
}: DropdownFilterProps) {
  const filteredOptions = (option.options || []).filter(opt => 
    opt.toLowerCase().includes(filterValue.toLowerCase())
  );

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
      <div className="p-2 max-h-80 overflow-y-auto">
        {filteredOptions.map((opt) => (
          <label key={opt} className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(opt)}
              onChange={() => onToggleValue(opt)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{opt}</span>
          </label>
        ))}
        {(!option.options || option.options.length === 0) && (
          <div className="px-2 py-2 text-sm text-gray-500 text-center">No options available</div>
        )}
        {option.options && filteredOptions.length === 0 && option.options.length > 0 && (
          <div className="px-2 py-2 text-sm text-gray-500 text-center">No options found</div>
        )}
      </div>
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
        <span className="text-xs text-gray-500">{selectedValues.length} selected</span>
        <button
          onClick={() => onApply(option)}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

