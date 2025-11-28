/**
 * Static List Builder Component
 * Handles manual contact selection with filters
 */

import React from 'react';
import type { Contact } from '../types';
import { applyContactFilters, getUniqueContactValues } from '../utils';
import { AVAILABLE_TAGS } from '../constants';

interface StaticListBuilderProps {
  availableContacts: Contact[];
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
  clearRecipientList: () => void;
  clearAllFilters: () => void;
}

export default function StaticListBuilder({
  availableContacts,
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
  clearRecipientList,
  clearAllFilters,
}: StaticListBuilderProps) {
  const filteredContacts = applyContactFilters(
    availableContacts,
    searchQuery,
    selectedCompanies,
    selectedTypes
  );

  const allFilteredSelected = filteredContacts.length > 0 &&
    filteredContacts.every(c => selectedContactIds.includes(c.id));

  const uniqueCompanies = getUniqueContactValues(availableContacts, 'company');
  const uniqueTypes = getUniqueContactValues(availableContacts, 'type');

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
            placeholder="Search contacts by name, email, or company..."
            className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {/* Company Filter */}
          <FilterDropdown
            label="Company"
            count={selectedCompanies.length}
            isOpen={openDropdown === 'company'}
            onToggle={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
            icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
          >
            {uniqueCompanies.map(company => (
              <FilterCheckbox
                key={company}
                label={company}
                checked={selectedCompanies.includes(company)}
                onChange={(checked) => {
                  if (checked) {
                    setSelectedCompanies([...selectedCompanies, company]);
                  } else {
                    setSelectedCompanies(selectedCompanies.filter(c => c !== company));
                  }
                }}
              />
            ))}
          </FilterDropdown>

          {/* Type Filter */}
          <FilterDropdown
            label="Type"
            count={selectedTypes.length}
            isOpen={openDropdown === 'type'}
            onToggle={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
            icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
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

          {/* Tags Filter */}
          <FilterDropdown
            label="Tags"
            count={selectedTags.length}
            isOpen={openDropdown === 'tags'}
            onToggle={() => setOpenDropdown(openDropdown === 'tags' ? null : 'tags')}
            icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
          >
            {AVAILABLE_TAGS.map(tag => (
              <FilterCheckbox
                key={tag}
                label={tag}
                checked={selectedTags.includes(tag)}
                onChange={(checked) => {
                  if (checked) {
                    setSelectedTags([...selectedTags, tag]);
                  } else {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  }
                }}
              />
            ))}
          </FilterDropdown>

          {/* Clear Filters */}
          {(searchQuery || selectedCompanies.length > 0 || selectedTypes.length > 0 || selectedTags.length > 0) && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Active Filter Tags */}
        {(selectedCompanies.length > 0 || selectedTypes.length > 0 || selectedTags.length > 0) && (
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
            {selectedTags.map(tag => (
              <FilterTag
                key={tag}
                label={tag}
                color="purple"
                onRemove={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
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
              onClick={() => {
                const contactsToAdd = availableContacts.filter(c => selectedContactIds.includes(c.id));
                contactsToAdd.forEach(contact => addToRecipientList(contact));
                setSelectedContactIds([]);
              }}
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
        {filteredContacts.map((contact) => (
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
                <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{contact.type}</span>
              </div>
              <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.company}</div>
              <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.email}</div>
            </div>
            <button
              onClick={() => addToRecipientList(contact)}
              className="ml-3 px-3 py-1.5 text-xs text-[var(--primary)] border border-[var(--primary)] rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors flex-shrink-0"
            >
              Add
            </button>
          </div>
        ))}
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
interface FilterDropdownProps {
  label: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
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
        <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-md shadow-lg z-10 min-w-[200px] max-h-[200px] overflow-y-auto">
          {children}
        </div>
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
