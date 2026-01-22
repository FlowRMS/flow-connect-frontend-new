'use client';

import React, { useState, useMemo } from 'react';
import type { FilterOption } from '../../types';
import { useDebounce } from '@/components/pre-opportunities/hooks/useDebounce';
import { useCompanyTypes, type CompanyType } from '@/components/hooks/useCRMApi';

type CompanyTypeFilterProps = {
  option: FilterOption;
  selectedValues: string[]; // Array of company type names
  onToggleValue: (value: string) => void;
  onApply: (option: FilterOption) => void;
  onClear?: () => void;
  hasActiveFilter?: boolean;
};

export function CompanyTypeFilter({
  option,
  selectedValues,
  onToggleValue,
  onApply,
  onClear,
  hasActiveFilter,
}: CompanyTypeFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 200);

  const { data: companyTypesData = [], isLoading, isError } = useCompanyTypes();
  const companyTypes = companyTypesData as CompanyType[];

  const filteredTypes = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const base = companyTypes.filter((t) => t.isActive);
    if (!term) return base;
    return base.filter((t) => t.name.toLowerCase().includes(term));
  }, [companyTypes, debouncedSearch]);

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
        {isLoading && companyTypes.length === 0 ? (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 animate-spin text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Loading company types...</span>
            </div>
          </div>
        ) : isError ? (
          <div className="px-2 py-2 text-sm text-gray-500 text-center">
            Error loading company types. Please try again.
          </div>
        ) : filteredTypes.length > 0 ? (
          filteredTypes.map((companyType) => (
            <label
              key={companyType.id}
              className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(companyType.name)}
                onChange={() => onToggleValue(companyType.name)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="w-6 h-6 flex items-center justify-center text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <span className="text-sm text-gray-700 font-normal">{companyType.name}</span>
            </label>
          ))
        ) : (
          <div className="px-2 py-2 text-sm text-gray-500 text-center">
            {searchTerm ? `No company types found for "${searchTerm}"` : 'No company types available'}
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

