/**
 * Searchable Dropdown Component
 * Reusable search dropdown that loads all results on focus and filters as user types
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SearchableDropdownProps<T> {
  label: string;
  placeholder: string;
  required?: boolean;
  value: string;
  selectedItem: T | null;
  displayValue: (item: T) => string;
  subtitle?: (item: T) => string;
  items: T[];
  isLoading: boolean;
  onSelect: (item: T) => void;
  onClear: () => void;
  onSearch: (term: string) => void;
  onFocus?: () => void;
  getItemId: (item: T) => string;
  error?: string;
  validated?: boolean;
}

export function SearchableDropdown<T>({
  label,
  placeholder,
  required = false,
  value,
  selectedItem,
  displayValue,
  subtitle,
  items,
  isLoading,
  onSelect,
  onClear,
  onSearch,
  onFocus,
  getItemId,
  error,
  validated = false,
}: SearchableDropdownProps<T>) {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleFocus = () => {
    // Trigger search with empty string to load all items
    if (onFocus) {
      onFocus();
    }
    setShowDropdown(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    onSearch(term);
    setShowDropdown(true);
  };

  const handleSelect = (item: T) => {
    onSelect(item);
    setShowDropdown(false);
  };

  const handleClear = () => {
    onClear();
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {validated && selectedItem && (
          <span className="ml-2 text-green-600 font-normal">✓ {displayValue(selectedItem)}</span>
        )}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
        />
        {isLoading && !validated && (
          <div className="flex items-center px-3">
            <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        )}
        {validated && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      
      {showDropdown && !validated && (
        <>
          {items.length > 0 ? (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {items.map((item) => (
                <button
                  key={getItemId(item)}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{displayValue(item)}</div>
                  {subtitle && (
                    <div className="text-xs text-gray-500">{subtitle(item)}</div>
                  )}
                </button>
              ))}
            </div>
          ) : !isLoading && value.length >= 0 ? (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
              {value ? `No results found for "${value}"` : 'No items available'}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
