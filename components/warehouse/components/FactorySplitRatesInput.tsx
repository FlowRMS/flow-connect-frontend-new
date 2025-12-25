/**
 * Factory Split Rates Input Component
 * Component for selecting users with split rates for factories
 * Similar to customers SplitRatesInput but without repType distinction
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

  const total = entries.reduce((sum, entry) => sum + (parseFloat(entry.splitRate) || 0), 0);

  // User search query - search all users (no rep type filter)
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['factoryUserSearch', searchTerm],
    queryFn: () => searchUsers({
      searchTerm,
      enabled: true,
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

  const handleAddEntry = () => {
    const newEntry: FactorySplitRateEntry = {
      tempId: generateTempId(),
      userId: '',
      splitRate: '',
      position: entries.length + 1,
    };
    onChange([...entries, newEntry]);
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
    onChange(reorderedEntries);
  };

  const handleSelectUser = (index: number, user: UserSearchResult) => {
    const newEntries = [...entries];
    newEntries[index] = {
      ...newEntries[index],
      userId: user.id,
      user,
    };
    onChange(newEntries);
    setActiveSearchIndex(null);
    setSearchTerm('');
  };

  const handleSplitRateChange = (index: number, value: string) => {
    const numValue = parseFloat(value);
    if (value === '' || (numValue >= 0 && numValue <= 100)) {
      const newEntries = [...entries];
      newEntries[index] = { ...newEntries[index], splitRate: value };
      onChange(newEntries);
    }
  };

  const handleSearchFocus = (index: number) => {
    setActiveSearchIndex(index);
    setSearchTerm('');
  };

  return (
    <div className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Commission Split Rates</h4>
        </div>

        <div className="flex items-center gap-3">
          {/* Total Percentage Indicator - like customer modals */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            total === 0
              ? 'bg-gray-100 text-gray-600'
              : total === 100
                ? 'bg-green-100 text-green-700'
                : total > 100
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
          }`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Total: {total.toFixed(1)}%
          </div>

          <button
            type="button"
            onClick={handleAddEntry}
            disabled={disabled}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="py-6 text-center">
          <div className="w-12 h-12 mx-auto bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">No split rates configured</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Click "Add User" to add a commission split</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div
              key={entry.tempId}
              ref={(el) => { containerRefs.current[index] = el; }}
              className="flex items-center gap-2 p-2 bg-[var(--card)] rounded-lg border border-[var(--border)] shadow-sm"
            >
              {/* Position Badge */}
              <div className="w-6 h-6 bg-[var(--primary)]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-[var(--primary)]">{index + 1}</span>
              </div>

              {/* User Search/Display */}
              <div className="flex-1 min-w-0">
                {entry.user ? (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[var(--muted)] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">
                        {(entry.user.firstName?.[0] || '') + (entry.user.lastName?.[0] || '')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        {entry.user.fullName || `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim()}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{entry.user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newEntries = [...entries];
                        newEntries[index] = { ...newEntries[index], userId: '', user: undefined };
                        onChange(newEntries);
                      }}
                      className="p-1 hover:bg-[var(--muted)] rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
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
                    placeholder="Search for a user..."
                    className="w-full px-3 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all placeholder:text-[var(--muted-foreground)]"
                  />
                )}
              </div>

              {/* Split Rate Input */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={entry.splitRate}
                  onChange={(e) => handleSplitRateChange(index, e.target.value)}
                  placeholder="0"
                  disabled={disabled}
                  className="w-16 px-2 py-1.5 text-sm text-center bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-[var(--muted-foreground)]">%</span>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveEntry(index)}
                disabled={disabled}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-[var(--muted-foreground)] hover:text-red-500 transition-colors disabled:opacity-50"
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
          className="bg-[var(--card)] rounded-lg shadow-xl border border-[var(--border)] max-h-64 overflow-auto"
        >
          {isSearching ? (
            <div className="p-4 text-center">
              <div className="inline-block w-5 h-5 border-2 border-[var(--muted)] border-t-[var(--primary)] rounded-full animate-spin" />
              <p className="text-sm text-[var(--muted-foreground)] mt-2">Searching...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-4 text-center">
              <svg className="w-8 h-8 mx-auto text-[var(--muted-foreground)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-[var(--muted-foreground)]">No users found</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="py-1">
              {filteredResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(activeSearchIndex, user)}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-[var(--muted)]/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-[var(--muted)] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-[var(--muted-foreground)]">
                      {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] truncate">{user.email}</span>
                      {user.inside && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">Inside</span>
                      )}
                      {user.outside && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">Outside</span>
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

      {/* Validation Message */}
      {entries.length > 0 && total !== 100 && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          total > 100
            ? 'bg-red-100 border border-red-300'
            : 'bg-amber-100 border border-amber-300'
        }`}>
          <svg className={`w-4 h-4 flex-shrink-0 ${total > 100 ? 'text-red-600' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className={`text-sm font-medium ${total > 100 ? 'text-red-800' : 'text-amber-800'}`}>
            {total > 100
              ? `Total split rate (${total.toFixed(1)}%) exceeds 100%. Please reduce the percentages.`
              : `Total split rate (${total.toFixed(1)}%) must equal exactly 100%.`
            }
          </p>
        </div>
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
