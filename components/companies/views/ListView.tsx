/**
 * List View Component for Companies
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Company, CompanyHierarchyRole } from '../types';
import { getCompanyInitials, getLogoColor, formatDate } from '../utils';
import { COMPANY_SOURCE_TYPE_LABELS, COMPANY_SOURCE_TYPE_OPTIONS } from '../../lib/crm-graphql';

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
  companies: Company[];
  onCompanyClick: (company: Company) => void;
}

export default function ListView({ companies, onCompanyClick }: ListViewProps) {
  // Column sorting state
  const [sortState, setSortState] = useState<SortState | null>(null);

  // Column filter state
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    name: '',
    companySourceType: '',
    hierarchyRole: '',
    parentCompanyName: '',
    phone: '',
    website: '',
    tags: '',
    isDocumentSpecific: '',
    lastActivity: '',
  });

  // Get unique values for dropdown filters
  const filterOptions = useMemo(() => {
    // Get all company type labels for the dropdown
    const companyTypeLabels = COMPANY_SOURCE_TYPE_OPTIONS.map(type => COMPANY_SOURCE_TYPE_LABELS[type]);
    return {
      companySourceType: companyTypeLabels,
      hierarchyRole: ['None', 'Parent', 'Grandparent'],
      tags: [...new Set(companies.flatMap(c => c.tags))].sort(),
      isDocumentSpecific: ['Yes', 'No'],
    };
  }, [companies]);

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
  const filteredAndSortedCompanies = useMemo(() => {
    let result = [...companies];

    // Apply column filters
    if (columnFilters.name) {
      const query = columnFilters.name.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(query));
    }
    if (columnFilters.companySourceType) {
      // Find the matching company source type key from the label
      const matchingType = COMPANY_SOURCE_TYPE_OPTIONS.find(
        type => COMPANY_SOURCE_TYPE_LABELS[type] === columnFilters.companySourceType
      );
      if (matchingType) {
        result = result.filter(c => c.companySourceType === matchingType);
      }
    }
    if (columnFilters.hierarchyRole) {
      const roleMap: Record<string, CompanyHierarchyRole> = { 'None': 'none', 'Parent': 'parent', 'Grandparent': 'grandparent' };
      const role = roleMap[columnFilters.hierarchyRole];
      result = result.filter(c => (c.hierarchyRole ?? 'none') === role);
    }
    if (columnFilters.parentCompanyName) {
      const query = columnFilters.parentCompanyName.toLowerCase();
      result = result.filter(c => (c.parentCompanyName || '').toLowerCase().includes(query));
    }
    if (columnFilters.phone) {
      const query = columnFilters.phone.toLowerCase();
      result = result.filter(c => (c.phone || '').toLowerCase().includes(query));
    }
    if (columnFilters.website) {
      const query = columnFilters.website.toLowerCase();
      result = result.filter(c => (c.website || '').toLowerCase().includes(query));
    }
    if (columnFilters.tags) {
      result = result.filter(c => c.tags.includes(columnFilters.tags));
    }
    if (columnFilters.isDocumentSpecific) {
      const isDocSpecific = columnFilters.isDocumentSpecific === 'Yes';
      result = result.filter(c => (c.isDocumentSpecific ?? false) === isDocSpecific);
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
          case 'companySourceType':
            aVal = a.companySourceType;
            bVal = b.companySourceType;
            break;
          case 'hierarchyRole':
            aVal = a.hierarchyRole ?? 'none';
            bVal = b.hierarchyRole ?? 'none';
            break;
          case 'parentCompanyName':
            aVal = a.parentCompanyName ?? '';
            bVal = b.parentCompanyName ?? '';
            break;
          case 'phone':
            aVal = a.phone || '';
            bVal = b.phone || '';
            break;
          case 'website':
            aVal = a.website || '';
            bVal = b.website || '';
            break;
          case 'tags':
            aVal = a.tags.join(', ');
            bVal = b.tags.join(', ');
            break;
          case 'isDocumentSpecific':
            aVal = a.isDocumentSpecific ? 'Yes' : 'No';
            bVal = b.isDocumentSpecific ? 'Yes' : 'No';
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
  }, [companies, columnFilters, sortState]);

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Scrollable Table Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Table Header */}
          <div className="grid gap-2 md:gap-4 px-4 md:px-6 py-2.5 md:py-3 border-b border-[var(--border)] bg-[var(--muted)]/30" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
            <ColumnHeader
              label="Company Name"
              columnKey="name"
              sortState={sortState}
              onSort={handleSort}
              filterType="text"
              filterValue={columnFilters.name}
              onFilterChange={handleFilterChange}
              colSpan={3}
            />
            <ColumnHeader
              label="Type"
              columnKey="companySourceType"
              sortState={sortState}
              onSort={handleSort}
              filterType="dropdown"
              filterValue={columnFilters.companySourceType}
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions.companySourceType}
              colSpan={2}
            />
            <ColumnHeader
              label="Role"
              columnKey="hierarchyRole"
              sortState={sortState}
              onSort={handleSort}
              filterType="dropdown"
              filterValue={columnFilters.hierarchyRole}
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions.hierarchyRole}
              colSpan={2}
            />
            <ColumnHeader
              label="Parent Company"
              columnKey="parentCompanyName"
              sortState={sortState}
              onSort={handleSort}
              filterType="text"
              filterValue={columnFilters.parentCompanyName}
              onFilterChange={handleFilterChange}
              colSpan={2}
            />
            <ColumnHeader
              label="Phone"
              columnKey="phone"
              sortState={sortState}
              onSort={handleSort}
              filterType="text"
              filterValue={columnFilters.phone}
              onFilterChange={handleFilterChange}
              colSpan={2}
            />
            <ColumnHeader
              label="Website"
              columnKey="website"
              sortState={sortState}
              onSort={handleSort}
              filterType="text"
              filterValue={columnFilters.website}
              onFilterChange={handleFilterChange}
              colSpan={2}
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
              label="Doc Specific"
              columnKey="isDocumentSpecific"
              sortState={sortState}
              onSort={handleSort}
              filterType="dropdown"
              filterValue={columnFilters.isDocumentSpecific}
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions.isDocumentSpecific}
              colSpan={1}
            />
            <ColumnHeader
              label="Created"
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
            {filteredAndSortedCompanies.map((company) => (
              <div
                key={company.id}
                onClick={() => onCompanyClick(company)}
                className="grid gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
              >
                <div className="col-span-3 flex items-center gap-2 md:gap-3 min-w-0">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${getLogoColor(company.id)} flex items-center justify-center text-white text-[10px] md:text-xs font-bold flex-shrink-0`}>
                    {getCompanyInitials(company.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm md:text-base text-[var(--foreground)] truncate">{company.name}</h3>
                    <p className="text-[10px] md:text-xs text-[var(--muted-foreground)] truncate">{company.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className={`px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs font-medium whitespace-nowrap ${
                    company.companySourceType === 'MANUFACTURER'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {COMPANY_SOURCE_TYPE_LABELS[company.companySourceType] || 'Customer'}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  {company.hierarchyRole && company.hierarchyRole !== 'none' ? (
                    <span className={`px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs font-medium whitespace-nowrap ${
                      company.hierarchyRole === 'grandparent'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {company.hierarchyRole === 'grandparent' ? 'Grandparent' : 'Parent'}
                    </span>
                  ) : (
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">—</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center min-w-0">
                  <span className="text-xs md:text-sm text-[var(--foreground)] truncate">{company.parentCompanyName || '—'}</span>
                </div>
                <div className="col-span-2 flex items-center min-w-0">
                  <span className="text-xs md:text-sm text-[var(--foreground)] truncate">{company.phone || '-'}</span>
                </div>
                <div className="col-span-2 flex items-center min-w-0">
                  {company.website ? (
                    <a
                      href={`https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs md:text-sm text-[var(--primary)] hover:underline truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {company.website}
                    </a>
                  ) : (
                    <span className="text-xs md:text-sm text-[var(--muted-foreground)]">-</span>
                  )}
                </div>
                <div className="col-span-1 flex items-center gap-1 flex-wrap">
                  {company.tags.slice(0, 1).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 md:px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-[10px] md:text-xs truncate max-w-[60px]"
                    >
                      {tag}
                    </span>
                  ))}
                  {company.tags.length > 1 && (
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">+{company.tags.length - 1}</span>
                  )}
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  {company.isDocumentSpecific ? (
                    <span className="px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs font-medium rounded bg-purple-100 text-purple-700">
                      Yes
                    </span>
                  ) : (
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">—</span>
                  )}
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">{formatDate(company.lastActivity)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
