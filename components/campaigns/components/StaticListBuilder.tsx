/**
 * Static List Builder Component
 * Handles manual contact selection with filters
 * Uses real-time API search for contacts
 */

'use client';

import { useState, useMemo, useEffect, useRef, type ReactNode } from 'react';
import type { Contact } from '../types';
import { mapContactSearchResultToContact } from '../types';
import { getUniqueContactValues } from '../utils';
import { useContactSearch, useCompanySearch, type CompanySearchResult } from '../api';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface StaticListBuilderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCompanies: string[];
  setSelectedCompanies: (companies: string[]) => void;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  selectedContactIds: string[];
  setSelectedContactIds: (ids: string[]) => void;
  openDropdown: string | null;
  setOpenDropdown: (dropdown: string | null) => void;
  recipientList: Contact[];
  addToRecipientList: (contact: Contact) => void;
  addMultipleToRecipientList?: (contacts: Contact[]) => void;
  clearRecipientList: () => void;
  clearAllFilters: () => void;
}

export default function StaticListBuilder({
  searchQuery,
  setSearchQuery,
  selectedCompanies,
  setSelectedCompanies,
  selectedTypes,
  setSelectedTypes,
  selectedTags,
  setSelectedTags,
  selectedContactIds,
  setSelectedContactIds,
  openDropdown,
  setOpenDropdown,
  recipientList,
  addToRecipientList,
  addMultipleToRecipientList,
  clearRecipientList,
  clearAllFilters,
}: StaticListBuilderProps) {
  // Debounce search query for API calls (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Company search state for searchable dropdown
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const debouncedCompanySearch = useDebounce(companySearchTerm, 300);

  // Use the contact search API - empty string returns all contacts
  const { data: contactsData, isLoading: isSearching } = useContactSearch(debouncedSearchQuery, true);

  // Use company search API with trigger-based search
  const { data: companiesData, isLoading: isLoadingCompanies } = useCompanySearch(
    debouncedCompanySearch,
    debouncedCompanySearch.length >= 1 || openDropdown === 'company'
  );

  // Transform API contacts to UI format
  const availableContacts: Contact[] = useMemo(() => {
    if (!contactsData) return [];
    return contactsData.map(mapContactSearchResultToContact);
  }, [contactsData]);

  // Get unique company names from company search results
  const searchedCompanies: string[] = useMemo(() => {
    if (!companiesData) return [];
    return companiesData.map((c: CompanySearchResult) => c.name).filter(Boolean);
  }, [companiesData]);

  // Apply local filters (company, type) on top of search results
  const filteredContacts = useMemo(() => {
    let result = availableContacts;

    // Filter by selected companies
    if (selectedCompanies.length > 0) {
      result = result.filter(contact =>
        contact.company && selectedCompanies.includes(contact.company)
      );
    }

    // Filter by selected types/roles
    if (selectedTypes.length > 0) {
      result = result.filter(contact =>
        contact.type && selectedTypes.includes(contact.type)
      );
    }

    return result;
  }, [availableContacts, selectedCompanies, selectedTypes]);

  const allFilteredSelected = filteredContacts.length > 0 &&
    filteredContacts.every(c => selectedContactIds.includes(c.id));

  // Get unique values from search results for filter dropdowns
  const uniqueCompanies = useMemo(() =>
    getUniqueContactValues(availableContacts, 'company'),
    [availableContacts]
  );

  const uniqueTypes = useMemo(() =>
    getUniqueContactValues(availableContacts, 'role'),
    [availableContacts]
  );

  // Handle adding multiple selected contacts at once (fixes the multi-selection bug)
  const handleAddSelected = () => {
    const contactsToAdd = filteredContacts.filter(c =>
      selectedContactIds.includes(c.id) && !recipientList.some(r => r.id === c.id)
    );

    if (addMultipleToRecipientList) {
      // Use the batch add function if available
      addMultipleToRecipientList(contactsToAdd);
    } else {
      // Fallback: add all at once by updating state in one batch
      contactsToAdd.forEach(contact => addToRecipientList(contact));
    }
    setSelectedContactIds([]);
  };

  return (
    <div className="border border-[var(--border)] rounded-lg p-4">
      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name, email, or role..."
            className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]"></div>
            </div>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {/* Company Filter - Searchable Dropdown */}
          <SearchableCompanyDropdown
            selectedCompanies={selectedCompanies}
            setSelectedCompanies={setSelectedCompanies}
            isOpen={openDropdown === 'company'}
            onToggle={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
            searchTerm={companySearchTerm}
            setSearchTerm={setCompanySearchTerm}
            searchedCompanies={searchedCompanies}
            localCompanies={uniqueCompanies}
            isLoading={isLoadingCompanies}
          />

          {/* Type/Role Filter */}
          {uniqueTypes.length > 0 && (
            <FilterDropdown
              label="Role"
              count={selectedTypes.length}
              isOpen={openDropdown === 'type'}
              onToggle={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
              icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            >
              {uniqueTypes.map(type => (
                <FilterCheckbox
                  key={type}
                  label={type}
                  checked={selectedTypes.includes(type)}
                  onChange={(checked) => {
                    if (checked) {
                      setSelectedTypes([...selectedTypes, type]);
                    } else {
                      setSelectedTypes(selectedTypes.filter(t => t !== type));
                    }
                  }}
                />
              ))}
            </FilterDropdown>
          )}

          {/* Clear Filters */}
          {(searchQuery || selectedCompanies.length > 0 || selectedTypes.length > 0) && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Active Filter Tags */}
        {(selectedCompanies.length > 0 || selectedTypes.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {selectedCompanies.map(company => (
              <FilterTag
                key={company}
                label={company}
                color="blue"
                onRemove={() => setSelectedCompanies(selectedCompanies.filter(c => c !== company))}
              />
            ))}
            {selectedTypes.map(type => (
              <FilterTag
                key={type}
                label={type}
                color="green"
                onRemove={() => setSelectedTypes(selectedTypes.filter(t => t !== type))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <div className="flex items-center justify-between py-2 px-3 bg-[var(--muted)]/30 rounded-md mb-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedContactIds([...new Set([...selectedContactIds, ...filteredContacts.map(c => c.id)])]);
              } else {
                setSelectedContactIds(selectedContactIds.filter(id => !filteredContacts.some(c => c.id === id)));
              }
            }}
            className="w-4 h-4 accent-[var(--primary)]"
          />
          <span className="text-[var(--foreground)]">Select all ({filteredContacts.length})</span>
        </label>
        {selectedContactIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">{selectedContactIds.length} selected</span>
            <button
              onClick={handleAddSelected}
              className="px-3 py-1 text-xs bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary)]/90 transition-colors"
            >
              Add Selected
            </button>
            <button
              onClick={() => setSelectedContactIds([])}
              className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="max-h-[350px] overflow-y-auto space-y-2 mb-3">
        {isSearching ? (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)] mx-auto mb-2"></div>
            <p>Searching contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            {availableContacts.length === 0 ? (
              <p>No contacts found. Try a different search term.</p>
            ) : (
              <p>No contacts match your filters</p>
            )}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center gap-3 p-3 border rounded-md transition-colors ${
                selectedContactIds.includes(contact.id)
                  ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                  : 'border-[var(--border)] hover:bg-[var(--muted)]/20'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedContactIds.includes(contact.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedContactIds([...selectedContactIds, contact.id]);
                  } else {
                    setSelectedContactIds(selectedContactIds.filter(id => id !== contact.id));
                  }
                }}
                className="w-4 h-4 accent-[var(--primary)] flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-[var(--foreground)] truncate">{contact.name}</div>
                  {contact.role && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                      {contact.role}
                    </span>
                  )}
                </div>
                {contact.company && (
                  <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.company}</div>
                )}
                <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.email}</div>
              </div>
              <button
                onClick={() => addToRecipientList(contact)}
                disabled={recipientList.some(r => r.id === contact.id)}
                className={`ml-3 px-3 py-1.5 text-xs rounded-md transition-colors flex-shrink-0 ${
                  recipientList.some(r => r.id === contact.id)
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white'
                }`}
              >
                {recipientList.some(r => r.id === contact.id) ? 'Added' : 'Add'}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
        <div className="text-sm text-[var(--muted-foreground)]">
          {recipientList.length} recipients added to campaign
        </div>
        {recipientList.length > 0 && (
          <button
            onClick={clearRecipientList}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Clear all recipients
          </button>
        )}
      </div>
    </div>
  );
}

// Helper Components

// Searchable Company Dropdown Component
interface SearchableCompanyDropdownProps {
  selectedCompanies: string[];
  setSelectedCompanies: (companies: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchedCompanies: string[];
  localCompanies: string[];
  isLoading: boolean;
}

function SearchableCompanyDropdown({
  selectedCompanies,
  setSelectedCompanies,
  isOpen,
  onToggle,
  searchTerm,
  setSearchTerm,
  searchedCompanies,
  localCompanies,
  isLoading,
}: SearchableCompanyDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine and dedupe companies from API search and local contacts
  const displayCompanies = useMemo(() => {
    // Filter out undefined/null values and dedupe
    const combined = [...new Set([...searchedCompanies, ...localCompanies].filter(Boolean))];
    if (!searchTerm) return combined.slice(0, 20); // Show first 20 when no search
    const searchLower = searchTerm.toLowerCase();
    return combined.filter(c => c && c.toLowerCase().includes(searchLower));
  }, [searchedCompanies, localCompanies, searchTerm]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={onToggle}
        className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] transition-colors flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Company {selectedCompanies.length > 0 && `(${selectedCompanies.length})`}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg z-20 min-w-[280px]">
            {/* Search Input */}
            <div className="p-2 border-b border-[var(--border)]">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search companies..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
                {isLoading && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[var(--primary)]"></div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Type to search all companies</p>
            </div>
            {/* Options */}
            <div className="max-h-[200px] overflow-y-auto">
              {displayCompanies.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
                  {isLoading ? 'Searching...' : 'No companies found'}
                </div>
              ) : (
                displayCompanies.map((company, index) => (
                  <label
                    key={`${company}-${index}`}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--muted)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCompanies.includes(company)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCompanies([...selectedCompanies, company]);
                        } else {
                          setSelectedCompanies(selectedCompanies.filter(c => c !== company));
                        }
                      }}
                      className="w-3.5 h-3.5 accent-[var(--primary)]"
                    />
                    <span className="text-xs truncate">{company}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
        </>
      )}
    </div>
  );
}

interface FilterDropdownProps {
  label: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  icon: ReactNode;
  children: ReactNode;
}

function FilterDropdown({ label, count, isOpen, onToggle, icon, children }: FilterDropdownProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] transition-colors flex items-center gap-1"
      >
        {icon}
        {label} {count > 0 && `(${count})`}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg z-20 min-w-[200px] max-h-[200px] overflow-y-auto">
            {children}
          </div>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
        </>
      )}
    </div>
  );
}

interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function FilterCheckbox({ label, checked, onChange }: FilterCheckboxProps) {
  return (
    <label className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--muted)] cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-[var(--primary)]"
      />
      <span className="text-xs">{label}</span>
    </label>
  );
}

interface FilterTagProps {
  label: string;
  color: 'blue' | 'green' | 'purple';
  onRemove: () => void;
}

function FilterTag({ label, color, onRemove }: FilterTagProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${colorClasses[color]}`}>
      {label}
      <button onClick={onRemove} className="hover:text-gray-900">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
