'use client';

import React, { useState } from 'react';
import { usePicklist } from '../usePicklist';
import { PicklistKey } from '../enums';

interface PicklistFilterProps {
  picklistKey: PicklistKey;
  selectedValues: string[];
  onToggleValue: (value: string) => void;
  onApply: () => void;
  onClear?: () => void;
  hasActiveFilter?: boolean;
}

export function PicklistFilter({
  picklistKey,
  selectedValues,
  onToggleValue,
  onApply,
  onClear,
  hasActiveFilter,
}: PicklistFilterProps) {
  const { enabledItems } = usePicklist(picklistKey);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = enabledItems.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      <div className="p-3 border-b border-gray-100">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-normal"
          autoFocus
        />
      </div>
      <div className="p-2 max-h-80 overflow-y-auto">
        {filteredItems.map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(item.key)}
              onChange={() => onToggleValue(item.key)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            {item.color && (
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span className="text-sm text-gray-700 font-normal">{item.label}</span>
          </label>
        ))}
        {enabledItems.length === 0 && (
          <div className="px-2 py-2 text-sm text-gray-500 text-center">No options available</div>
        )}
        {enabledItems.length > 0 && filteredItems.length === 0 && (
          <div className="px-2 py-2 text-sm text-gray-500 text-center">No options found</div>
        )}
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
          onClick={onApply}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors ml-auto"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
