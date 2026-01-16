/**
 * List View Component for Contacts
 * Table view with HTML table structure, sticky header, and infinite scroll
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { getInitials, getAvatarColor, formatDate } from '../utils';
import type { Contact } from '../types';
import { useScrollPagination } from '@/components/hooks/useInfiniteScroll';

// Sort direction type
type SortDirection = 'asc' | 'desc' | null;

// Column sort state
interface SortState {
  column: string;
  direction: SortDirection;
}

// Sortable/Filterable column header component
interface ColumnHeaderProps {
  label: string;
  columnKey: string;
  sortState: SortState | null;
  onSort: (column: string) => void;
  filterType: 'text' | 'dropdown' | 'date';
  filterValue: string;
  onFilterChange: (column: string, value: string) => void;
  filterOptions?: string[];
}

function ColumnHeader({
  label,
  columnKey,
  sortState,
  onSort,
  filterType,
  filterValue,
  onFilterChange,
  filterOptions = [],
}: ColumnHeaderProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
        setDropdownSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSorted = sortState?.column === columnKey;
  const sortDirection = isSorted ? sortState.direction : null;

  const filteredOptions = filterOptions.filter(opt =>
    opt.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  return (
    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider relative" ref={filterRef}>
      <div className="flex items-center gap-1.5">
        <span className="whitespace-nowrap">{label}</span>
        <button
          onClick={() => onSort(columnKey)}
          className="flex flex-col items-center transition-colors"
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            className={`${sortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-gray-400'}`}
          >
            <path d="M4 0L8 4H0L4 0Z" fill="currentColor" />
          </svg>
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            className={`-mt-0.5 ${sortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-gray-400'}`}
          >
            <path d="M4 8L0 4H8L4 8Z" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowFilter(!showFilter);
          }}
          className={`p-0.5 rounded hover:bg-gray-200 transition-colors ${filterValue ? 'text-[var(--primary)]' : 'text-gray-400'}`}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
      </div>

      {showFilter && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px]">
          {filterType === 'text' ? (
            <div className="p-2">
              <input
                type="text"
                placeholder={`Filter ${label.toLowerCase()}...`}
                value={filterValue}
                onChange={(e) => onFilterChange(columnKey, e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                autoFocus
              />
              {filterValue && (
                <button
                  onClick={() => onFilterChange(columnKey, '')}
                  className="mt-1 text-xs text-gray-600 hover:text-gray-900"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : filterType === 'date' ? (
            <div className="p-2">
              <input
                type="date"
                value={filterValue}
                onChange={(e) => onFilterChange(columnKey, e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
              {filterValue && (
                <button
                  onClick={() => onFilterChange(columnKey, '')}
                  className="mt-1 text-xs text-gray-600 hover:text-gray-900"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="p-2">
              <input
                type="text"
                placeholder="Search..."
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] mb-2"
                autoFocus
              />
              <div className="max-h-[200px] overflow-y-auto">
                <button
                  onClick={() => {
                    onFilterChange(columnKey, '');
                    setShowFilter(false);
                    setDropdownSearch('');
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${!filterValue ? 'bg-gray-100 font-medium' : ''}`}
                >
                  All
                </button>
                {filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onFilterChange(columnKey, option);
                      setShowFilter(false);
                      setDropdownSearch('');
                    }}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${filterValue === option ? 'bg-gray-100 font-medium' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </th>
  );
}

interface ListViewProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
  // Infinite scroll props
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  isLoading?: boolean;
}

export default function ListView({ 
  contacts, 
  onContactClick,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  isLoading = false,
}: ListViewProps) {
  // Ref for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Column sorting state
  const [sortState, setSortState] = useState<SortState | null>(null);

  // Column filter state
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    name: '',
    company: '',
    role: '',
    tags: '',
    createdAt: '',
    createdBy: '',
  });

  // Get unique values for dropdown filters
  const filterOptions = useMemo(() => {
    return {
      company: [...new Set(contacts.map(c => c.company).filter(Boolean))].sort(),
      role: [...new Set(contacts.map(c => c.role).filter(Boolean))].sort(),
      tags: [...new Set(contacts.flatMap(c => c.tags))].sort(),
      createdBy: [...new Set(contacts.map(c => c.createdBy).filter(Boolean))].sort(),
    };
  }, [contacts]);

  // Handle sort toggle
  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev?.column !== column) {
        return { column, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column, direction: 'desc' };
      }
      return null;
    });
  };

  // Handle filter change
  const handleFilterChange = (column: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }));
  };

  // Apply filters and sorting (client-side for now, will be replaced by server-side later)
  const filteredAndSortedContacts = useMemo(() => {
    let result = [...contacts];

    // Apply column filters
    if (columnFilters.name) {
      const query = columnFilters.name.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(query));
    }
    if (columnFilters.company) {
      result = result.filter(c => c.company === columnFilters.company);
    }
    if (columnFilters.role) {
      result = result.filter(c => c.role === columnFilters.role);
    }
    if (columnFilters.tags) {
      result = result.filter(c => c.tags.includes(columnFilters.tags));
    }
    if (columnFilters.createdAt) {
      const filterDate = new Date(columnFilters.createdAt).toDateString();
      result = result.filter(c => new Date(c.lastActivity).toDateString() === filterDate);
    }
    if (columnFilters.createdBy) {
      result = result.filter(c => c.createdBy === columnFilters.createdBy);
    }

    // Apply sorting
    if (sortState) {
      result.sort((a, b) => {
        let aVal: string;
        let bVal: string;

        switch (sortState.column) {
          case 'name':
            aVal = a.name;
            bVal = b.name;
            break;
          case 'company':
            aVal = a.company;
            bVal = b.company;
            break;
          case 'role':
            aVal = a.role;
            bVal = b.role;
            break;
          case 'tags':
            aVal = a.tags.join(', ');
            bVal = b.tags.join(', ');
            break;
          case 'createdAt':
          case 'lastActivity':
            aVal = a.lastActivity;
            bVal = b.lastActivity;
            break;
          case 'createdBy':
            aVal = a.createdBy;
            bVal = b.createdBy;
            break;
          default:
            return 0;
        }

        const cmp = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
        return sortState.direction === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [contacts, columnFilters, sortState]);

  // Use scroll pagination hook to detect when scrolling near bottom of table
  const shouldPaginate = (hasNextPage ?? false);
  useScrollPagination(scrollContainerRef, {
    hasNextPage: shouldPaginate,
    isFetchingNextPage: isFetchingNextPage ?? false,
    fetchNextPage: fetchNextPage ?? (() => {}),
    threshold: 200, // Trigger when within 200px of bottom
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
      {!isLoading && filteredAndSortedContacts.length === 0 ? (
        // Empty state - don't show table structure
        null
      ) : (
        <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <div 
            ref={scrollContainerRef}
            className="overflow-auto scrollbar-always-visible flex-1"
          >
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b-2 border-gray-300 sticky top-0 z-10 shadow-sm">
                <tr>
                  <ColumnHeader
                    label="Name"
                    columnKey="name"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="text"
                    filterValue={columnFilters.name}
                    onFilterChange={handleFilterChange}
                  />
                  <ColumnHeader
                    label="Company"
                    columnKey="company"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="dropdown"
                    filterValue={columnFilters.company}
                    onFilterChange={handleFilterChange}
                    filterOptions={filterOptions.company}
                  />
                  <ColumnHeader
                    label="Role"
                    columnKey="role"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="dropdown"
                    filterValue={columnFilters.role}
                    onFilterChange={handleFilterChange}
                    filterOptions={filterOptions.role}
                  />
                  <ColumnHeader
                    label="Tags"
                    columnKey="tags"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="dropdown"
                    filterValue={columnFilters.tags}
                    onFilterChange={handleFilterChange}
                    filterOptions={filterOptions.tags}
                  />
                  <ColumnHeader
                    label="Created At"
                    columnKey="createdAt"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="date"
                    filterValue={columnFilters.createdAt}
                    onFilterChange={handleFilterChange}
                  />
                  <ColumnHeader
                    label="Created By"
                    columnKey="createdBy"
                    sortState={sortState}
                    onSort={handleSort}
                    filterType="dropdown"
                    filterValue={columnFilters.createdBy}
                    onFilterChange={handleFilterChange}
                    filterOptions={filterOptions.createdBy}
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  // Skeleton will be added in next step
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                      Loading contacts...
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedContacts.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => onContactClick(contact)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full ${getAvatarColor(contact.id)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                            {getInitials(contact.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-sm text-gray-900 truncate">{contact.name}</h3>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <a 
                                href={`mailto:${contact.email}`} 
                                className="text-xs text-gray-500 hover:text-[var(--primary)] truncate" 
                                onClick={(e) => e.stopPropagation()}
                              >
                                {contact.email}
                              </a>
                              <a 
                                href={`tel:${contact.phone}`} 
                                className="text-xs text-gray-500 hover:text-[var(--primary)]" 
                                onClick={(e) => e.stopPropagation()}
                              >
                                {contact.phone}
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-gray-900 truncate block">{contact.company}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-gray-900 truncate block">{contact.role}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {contact.tags.slice(0, 1).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs truncate max-w-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 1 && (
                            <span className="text-xs text-gray-500">+{contact.tags.length - 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs text-gray-500">{formatDate(contact.lastActivity)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm text-gray-900 truncate block">{contact.createdBy}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="text-sm">Loading more contacts...</span>
          </div>
        </div>
      )}
    </div>
  );
}
