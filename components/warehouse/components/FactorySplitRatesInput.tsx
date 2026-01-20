/**
 * Factory Inside Reps Input Component
 * Component for selecting inside reps for factories/manufacturers
 * Percentages are auto-calculated but hidden from user
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { searchUsers, type UserSearchResult } from '../../customers/api/customersApi';

export interface FactorySplitRateEntry {
  tempId: string;
  id?: string; // Only present when editing existing split rate
  userId: string;
  user?: UserSearchResult;
  splitRate: string;
  position: number;
}

interface FactorySplitRatesInputProps {
  entries: FactorySplitRateEntry[];
  onChange: (entries: FactorySplitRateEntry[]) => void;
  disabled?: boolean;
}

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

export function FactorySplitRatesInput({
  entries,
  onChange,
  disabled = false,
}: FactorySplitRatesInputProps) {
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // User search query - search only inside reps for manufacturer split rates
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['factoryUserSearch', searchTerm],
    queryFn: () => searchUsers({
      searchTerm,
      enabled: true,
      isOutside: false,
      isInside: true,
      limit: 10,
    }),
    enabled: activeSearchIndex !== null,
    staleTime: 30 * 1000,
  });

  // Filter out already selected users
  const filteredResults = searchResults.filter(
    (user) => !entries.some((entry) => entry.userId === user.id)
  );

  // Update dropdown position
  const updatePosition = useCallback(() => {
    if (activeSearchIndex !== null && containerRefs.current[activeSearchIndex]) {
      const rect = containerRefs.current[activeSearchIndex]!.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [activeSearchIndex]);

  useEffect(() => {
    if (activeSearchIndex !== null) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [activeSearchIndex, updatePosition]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeSearchIndex !== null) {
        const container = containerRefs.current[activeSearchIndex];
        const target = e.target as HTMLElement;

        if (container && container.contains(target)) return;
        if (target.closest('[data-factory-split-dropdown="true"]')) return;

        setActiveSearchIndex(null);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSearchIndex]);

  // Calculate equal split rate for all entries
  const calculateEqualSplitRate = (count: number): string => {
    if (count === 0) return '';
    const rate = 100 / count;
    return rate.toFixed(1);
  };

  // Auto-redistribute split rates equally among all entries
  const redistributeSplitRates = (newEntries: FactorySplitRateEntry[]): FactorySplitRateEntry[] => {
    if (newEntries.length === 0) return newEntries;
    const newRate = calculateEqualSplitRate(newEntries.length);
    return newEntries.map(entry => ({
      ...entry,
      splitRate: newRate,
    }));
  };

  const handleAddEntry = () => {
    const newEntry: FactorySplitRateEntry = {
      tempId: generateTempId(),
      userId: '',
      splitRate: '',
      position: entries.length + 1,
    };
    const newEntries = [...entries, newEntry];
    // Auto-redistribute split rates equally
    const redistributedEntries = redistributeSplitRates(newEntries);
    onChange(redistributedEntries);
    setTimeout(() => {
      const newIndex = entries.length;
      inputRefs.current[newIndex]?.focus();
    }, 0);
  };

  const handleRemoveEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    const reorderedEntries = newEntries.map((entry, i) => ({
      ...entry,
      position: i + 1,
    }));
    // Auto-redistribute split rates equally among remaining entries
    const redistributedEntries = redistributeSplitRates(reorderedEntries);
    onChange(redistributedEntries);
  };

  const handleSelectUser = (index: number, user: UserSearchResult) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      userId: user.id,
      user,
    };
    // Redistribute after selecting a user
    const redistributedEntries = redistributeSplitRates(newEntries);
    onChange(redistributedEntries);
    setActiveSearchIndex(null);
    setSearchTerm('');
  };

  const handleSearchFocus = (index: number) => {
    setActiveSearchIndex(index);
    setSearchTerm('');
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-blue-700">Inside Reps</h4>
        </div>

        <button
          type="button"
          onClick={handleAddEntry}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Rep
        </button>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="py-6 text-center">
          <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">No inside reps added yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Rep" to add a representative</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={entry.tempId}
              ref={(el) => { containerRefs.current[index] = el; }}
              className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              {/* Position Badge */}
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-blue-700">{index + 1}</span>
              </div>

              {/* User Search/Display */}
              <div className="flex-1 min-w-0">
                {entry.user ? (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-gray-600">
                        {(entry.user.firstName?.[0] || '') + (entry.user.lastName?.[0] || '')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {entry.user.fullName || `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{entry.user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newEntries = [...entries];
                        newEntries[index] = { ...newEntries[index], userId: '', user: undefined };
                        onChange(newEntries);
                      }}
                      disabled={disabled}
                      className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <input
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    value={activeSearchIndex === index ? searchTerm : ''}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => handleSearchFocus(index)}
                    placeholder="Search for a rep..."
                    disabled={disabled}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white transition-all placeholder:text-gray-400 disabled:opacity-50"
                  />
                )}
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveEntry(index)}
                disabled={disabled}
                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Dropdown Portal */}
      {activeSearchIndex !== null && typeof document !== 'undefined' && createPortal(
        <div
          data-factory-split-dropdown="true"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 9999,
          }}
          className="bg-white rounded-lg shadow-xl border border-gray-200 max-h-64 overflow-auto"
        >
          {isSearching ? (
            <div className="p-4 text-center">
              <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-4 text-center">
              <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-gray-500">No users found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="py-1">
              {filteredResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(activeSearchIndex, user)}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600">
                      {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 truncate">{user.email}</span>
                      {user.inside && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded">Inside</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// Helper function to convert entries to API input format (for create - no id)
export function entriesToFactorySplitRateInputs(entries: FactorySplitRateEntry[]): Array<{
  userId: string;
  splitRate: string;
  position: number;
}> {
  return entries
    .filter((entry) => entry.userId && entry.splitRate)
    .map((entry) => ({
      userId: entry.userId,
      splitRate: entry.splitRate,
      position: entry.position,
    }));
}

// Helper function to convert entries to API input format (for update - includes id if present)
export function entriesToFactorySplitRateInputsWithId(entries: FactorySplitRateEntry[]): Array<{
  id?: string;
  userId: string;
  splitRate: string;
  position: number;
}> {
  return entries
    .filter((entry) => entry.userId && entry.splitRate)
    .map((entry) => ({
      ...(entry.id ? { id: entry.id } : {}),
      userId: entry.userId,
      splitRate: entry.splitRate,
      position: entry.position,
    }));
}

// Helper to create empty entry
export function createEmptyFactorySplitRateEntry(): FactorySplitRateEntry {
  return {
    tempId: generateTempId(),
    userId: '',
    splitRate: '',
    position: 1,
  };
}
