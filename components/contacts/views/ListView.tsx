/**
 * List View Component for Contacts
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { getInitials, getAvatarColor, formatDate } from '../utils';
import type { Contact } from '../types';

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
  colSpan: number;
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
  colSpan,
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
    <div className={`col-span-${colSpan} relative`} ref={filterRef}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onSort(columnKey)}
          className="flex items-center gap-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
        >
          {label}
          <span className="flex flex-col">
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              className={`${sortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/40'}`}
            >
              <path d="M4 0L8 4H0L4 0Z" fill="currentColor" />
            </svg>
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              className={`-mt-0.5 ${sortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/40'}`}
            >
              <path d="M4 8L0 4H8L4 8Z" fill="currentColor" />
            </svg>
          </span>
        </button>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`p-0.5 rounded hover:bg-[var(--muted)] transition-colors ${filterValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/60'}`}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
      </div>

      {showFilter && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg min-w-[180px]">
          {filterType === 'text' ? (
            <div className="p-2">
              <input
                type="text"
                placeholder={`Filter ${label.toLowerCase()}...`}
                value={filterValue}
                onChange={(e) => onFilterChange(columnKey, e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                autoFocus
              />
              {filterValue && (
                <button
                  onClick={() => onFilterChange(columnKey, '')}
                  className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
              {filterValue && (
                <button
                  onClick={() => onFilterChange(columnKey, '')}
                  className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] mb-2"
                autoFocus
              />
              <div className="max-h-[200px] overflow-y-auto">
                <button
                  onClick={() => {
                    onFilterChange(columnKey, '');
                    setShowFilter(false);
                    setDropdownSearch('');
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] ${!filterValue ? 'bg-[var(--muted)] font-medium' : ''}`}
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
                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] ${filterValue === option ? 'bg-[var(--muted)] font-medium' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ListViewProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
}

export default function ListView({ contacts, onContactClick }: ListViewProps) {
  // Column sorting state
  const [sortState, setSortState] = useState<SortState | null>(null);

  // Column filter state
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    name: '',
    company: '',
    role: '',
    contactType: '',
    tags: '',
    lists: '',
    lastActivity: '',
  });

  // Get unique values for dropdown filters
  const filterOptions = useMemo(() => {
    return {
      company: [...new Set(contacts.map(c => c.company).filter(Boolean))].sort(),
      role: [...new Set(contacts.map(c => c.role).filter(Boolean))].sort(),
      contactType: [...new Set(contacts.flatMap(c => c.contactType))].sort(),
      tags: [...new Set(contacts.flatMap(c => c.tags))].sort(),
      lists: [...new Set(contacts.flatMap(c => c.lists))].sort(),
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

  // Apply filters and sorting
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
    if (columnFilters.contactType) {
      result = result.filter(c => c.contactType.includes(columnFilters.contactType));
    }
    if (columnFilters.tags) {
      result = result.filter(c => c.tags.includes(columnFilters.tags));
    }
    if (columnFilters.lists) {
      result = result.filter(c => c.lists.includes(columnFilters.lists));
    }
    if (columnFilters.lastActivity) {
      const filterDate = new Date(columnFilters.lastActivity).toDateString();
      result = result.filter(c => new Date(c.lastActivity).toDateString() === filterDate);
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
          case 'contactType':
            aVal = a.contactType.join(', ');
            bVal = b.contactType.join(', ');
            break;
          case 'tags':
            aVal = a.tags.join(', ');
            bVal = b.tags.join(', ');
            break;
          case 'lists':
            aVal = a.lists.join(', ');
            bVal = b.lists.join(', ');
            break;
          case 'lastActivity':
            aVal = a.lastActivity;
            bVal = b.lastActivity;
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

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Scrollable Table Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-2.5 md:py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <ColumnHeader
              label="Name"
              columnKey="name"
              sortState={sortState}
              onSort={handleSort}
              filterType="text"
              filterValue={columnFilters.name}
              onFilterChange={handleFilterChange}
              colSpan={3}
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
              colSpan={2}
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
              colSpan={2}
            />
            <ColumnHeader
              label="Type"
              columnKey="contactType"
              sortState={sortState}
              onSort={handleSort}
              filterType="dropdown"
              filterValue={columnFilters.contactType}
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions.contactType}
              colSpan={1}
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
              colSpan={1}
            />
            <ColumnHeader
              label="Lists"
              columnKey="lists"
              sortState={sortState}
              onSort={handleSort}
              filterType="dropdown"
              filterValue={columnFilters.lists}
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions.lists}
              colSpan={2}
            />
            <ColumnHeader
              label="Last Activity"
              columnKey="lastActivity"
              sortState={sortState}
              onSort={handleSort}
              filterType="date"
              filterValue={columnFilters.lastActivity}
              onFilterChange={handleFilterChange}
              colSpan={1}
            />
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {filteredAndSortedContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => onContactClick(contact)}
                className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
              >
                <div className="col-span-3 flex items-center gap-2 md:gap-3 min-w-0">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${getAvatarColor(contact.id)} flex items-center justify-center text-white text-xs md:text-sm font-semibold flex-shrink-0`}>
                    {getInitials(contact.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm md:text-base text-[var(--foreground)] truncate">{contact.name}</h3>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <a href={`mailto:${contact.email}`} className="text-[10px] md:text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] truncate" onClick={(e) => e.stopPropagation()}>
                        {contact.email}
                      </a>
                      <a href={`tel:${contact.phone}`} className="text-[10px] md:text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]" onClick={(e) => e.stopPropagation()}>
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center min-w-0">
                  <span className="text-xs md:text-sm text-[var(--foreground)] truncate">{contact.company}</span>
                </div>
                <div className="col-span-2 flex items-center min-w-0">
                  <span className="text-xs md:text-sm text-[var(--foreground)] truncate">{contact.role}</span>
                </div>
                <div className="col-span-1 flex items-center gap-1 flex-wrap">
                  {contact.contactType.slice(0, 1).map((type, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 md:px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] md:text-xs font-medium truncate max-w-full"
                    >
                      {type}
                    </span>
                  ))}
                  {contact.contactType.length > 1 && (
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">+{contact.contactType.length - 1}</span>
                  )}
                </div>
                <div className="col-span-1 flex items-center gap-1 flex-wrap">
                  {contact.tags.slice(0, 1).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 md:px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-[10px] md:text-xs truncate max-w-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {contact.tags.length > 1 && (
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">+{contact.tags.length - 1}</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center gap-1 flex-wrap">
                  {contact.lists.slice(0, 1).map((list, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 md:px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] md:text-xs font-medium truncate max-w-full"
                    >
                      {list}
                    </span>
                  ))}
                  {contact.lists.length > 1 && (
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">+{contact.lists.length - 1}</span>
                  )}
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">{formatDate(contact.lastActivity)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
