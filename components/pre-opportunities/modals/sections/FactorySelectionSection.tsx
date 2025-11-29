/**
 * Factory Selection Section for Create Pre-Opportunity Modal
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { FactorySearchResult } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';

interface FactorySelectionSectionProps {
  factoryId: string;
  factoryName: string;
  onFactorySelect: (factory: FactorySearchResult) => void;
  onFactoryClear: () => void;
  factories: FactorySearchResult[];
  isLoadingFactories: boolean;
  onFactorySearch: (term: string, allowEmpty: boolean) => void;
}

export function FactorySelectionSection({
  factoryId,
  factoryName,
  onFactorySelect,
  onFactoryClear,
  factories,
  isLoadingFactories,
  onFactorySearch,
}: FactorySelectionSectionProps) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearch = useDebounce(search, 300);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (showDropdown && !factoryId) {
      onFactorySearch(debouncedSearch, true);
    }
  }, [debouncedSearch, showDropdown, factoryId, onFactorySearch]);

  const handleFocus = () => {
    onFactorySearch('', true);
    setShowDropdown(true);
  };

  const handleSelect = (factory: FactorySearchResult) => {
    onFactorySelect(factory);
    setSearch(factory.title);
    setShowDropdown(false);
  };

  const handleClear = () => {
    onFactoryClear();
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Filter by Factory (Optional)
        {factoryId && (
          <span className="ml-2 text-green-600 font-normal">✓ {factoryName}</span>
        )}
      </label>
      <p className="text-xs text-gray-500 mb-2">Selecting a factory will filter the product list</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={factoryId ? factoryName : search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={handleFocus}
          placeholder="Click to see all factories or type to search..."
          readOnly={!!factoryId}
          className={`flex-1 px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 ${
            factoryId ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'
          }`}
        />
        {isLoadingFactories && !factoryId && (
          <div className="flex items-center px-3">
            <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        )}
        {factoryId && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>
      
      {showDropdown && !factoryId && (
        <>
          {factories.length > 0 ? (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {factories.map((factory) => (
                <button
                  key={factory.id}
                  type="button"
                  onClick={() => handleSelect(factory)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{factory.title}</div>
                  <div className="text-xs text-gray-500">ID: {factory.id.slice(0, 8)}...</div>
                </button>
              ))}
            </div>
          ) : !isLoadingFactories ? (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
              {search ? `No factories found for "${search}"` : 'No factories available'}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
