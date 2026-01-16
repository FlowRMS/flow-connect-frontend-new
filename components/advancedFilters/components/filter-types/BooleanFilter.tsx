import React from 'react';
import type { FilterOption } from '../../types';

type BooleanFilterProps = {
  option: FilterOption;
  selectedValue: 'all' | 'true' | 'false' | null;
  onValueChange: (value: 'all' | 'true' | 'false') => void;
  onClear?: () => void;
  hasActiveFilter?: boolean;
};

export function BooleanFilter({ 
  option, 
  selectedValue, 
  onValueChange,
  onClear,
  hasActiveFilter
}: BooleanFilterProps) {
  const handleValueChange = (value: 'all' | 'true' | 'false') => {
    onValueChange(value);
    // Auto-apply when selecting Yes or No (not All)
    if (value !== 'all') {
      // The parent will handle the apply
    }
  };

  return (
    <div className="flex flex-col">
      <div className="p-3">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {option.label}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleValueChange('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedValue === 'all' || selectedValue === null
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleValueChange('true')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedValue === 'true'
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => handleValueChange('false')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedValue === 'false'
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            No
          </button>
        </div>
      </div>
      {hasActiveFilter && onClear && selectedValue !== 'all' && selectedValue !== null && (
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

