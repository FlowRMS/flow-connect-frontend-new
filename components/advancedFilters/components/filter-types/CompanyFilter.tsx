'use client';

import React, { useState } from 'react';
import type { FilterOption } from '../../types';
import { useDebounce } from '@/components/pre-opportunities/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { searchCompanies, type CompanySearchResult } from '@/components/lib/api/search';

type CompanyFilterProps = {
  option: FilterOption;
  selectedValues: string[]; // Array of company names
  onToggleValue: (value: string) => void;
  onApply: (option: FilterOption) => void;
  onClear?: () => void;
  hasActiveFilter?: boolean;
};

export function CompanyFilter({
  option,
  selectedValues,
  onToggleValue,
  onApply,
  onClear,
  hasActiveFilter,
}: CompanyFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const searchTermForQuery = debouncedSearch.trim();

  const { data: companies = [], isLoading, isError } = useQuery<CompanySearchResult[], Error>({
    queryKey: ['companySearch-filter', searchTermForQuery],
    queryFn: () =>
      searchCompanies(
        searchTermForQuery,
        searchTermForQuery ? 50 : 20
      ),
    // Always enabled so that we fetch an initial list with empty search term
    enabled: true,
    staleTime: 30 * 1000,
  });

  const filteredCompanies = companies;

  return (
    <div className="flex flex-col">
      <div className="p-3 border-b border-gray-100">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Select one or type to search..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-normal"
          autoFocus
        />
      </div>
      <div className="p-2 max-h-48 overflow-y-auto">
        {isLoading && filteredCompanies.length === 0 ? (
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
              <span>Loading companies...</span>
            </div>
          </div>
        ) : isError ? (
          <div className="px-2 py-2 text-sm text-gray-500 text-center">
            Error loading companies. Please try again.
          </div>
        ) : filteredCompanies.length > 0 ? (
          filteredCompanies.map((company) => (
            <label
              key={company.id}
              className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(company.name)}
                onChange={() => onToggleValue(company.name)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex flex-col">
                <span className="text-sm text-gray-700 font-normal">{company.name}</span>
                {company.companyType?.name && (
                  <span className="text-xs text-gray-500">
                    {company.companyType.name}
                  </span>
                )}
              </div>
            </label>
          ))
        ) : (
          <div className="px-2 py-2 text-sm text-gray-500 text-center">
            {searchTerm
              ? `No companies found for "${searchTerm}"`
              : 'No companies available'}
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

