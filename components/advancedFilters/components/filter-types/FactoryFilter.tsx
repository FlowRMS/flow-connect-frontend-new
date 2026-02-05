'use client';

import React, { useState, useEffect } from 'react';
import type { FilterOption } from '../../types';
import { useFactorySearch } from '@/components/products/api';
import { useDebounce } from '@/components/pre-opportunities/hooks/useDebounce';

type FactoryFilterProps = {
  option: FilterOption;
  selectedValues: string[]; // Array of factory titles
  onToggleValue: (value: string) => void;
  onApply: (option: FilterOption) => void;
  onClear?: () => void;
  hasActiveFilter?: boolean;
};

export function FactoryFilter({ 
  option, 
  selectedValues, 
  onToggleValue,
  onApply,
  onClear,
  hasActiveFilter
}: FactoryFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Enable search when component mounts or when search term changes
  const { data: factories = [], isLoading } = useFactorySearch(
    debouncedSearch,
    true // Always enabled
  );

  // Load initial factories when component mounts
  useEffect(() => {
    // Trigger initial load with empty search to get all factories
    if (debouncedSearch === '' && factories.length === 0 && !isLoading) {
      // The hook will automatically fetch with empty string
    }
  }, []);

  const filteredFactories = factories.filter(factory =>
    factory.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      <div className="p-3 border-b border-gray-100">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search ${option.label.toLowerCase()}...`}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-normal"
          autoFocus
        />
      </div>
      <div className="p-2 max-h-48 overflow-y-auto">
        {isLoading && factories.length === 0 ? (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Loading factories...</span>
            </div>
          </div>
        ) : filteredFactories.length > 0 ? (
          filteredFactories.map((factory) => (
            <label 
              key={factory.id} 
              className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(factory.title)}
                onChange={() => onToggleValue(factory.title)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 font-normal">{factory.title}</span>
            </label>
          ))
        ) : (
          <div className="px-2 py-2 text-sm text-gray-500 text-center">
            {searchTerm ? `No factories found for "${searchTerm}"` : 'No factories available'}
          </div>
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
          onClick={() => onApply(option)}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors ml-auto"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
