/**
 * Take-Off List View Component
 * FlowCRM style with grid-based layout and sortable columns
 */

import React, { useState, useMemo } from 'react';
import type { Takeoff } from '../types';
import { getStatusColor, getDocumentCountsByCategory } from '../utils';

// Sortable column keys
type SortColumn = 'title' | 'source' | 'createdBy' | 'createdDate' | 'bidDate' | 'location' | 'status' | 'priority';
type SortDirection = 'asc' | 'desc';

interface TakeoffListViewProps {
  takeoffs: Takeoff[];
  onTakeoffClick: (takeoff: Takeoff) => void;
  onDeleteTakeoff?: (takeoffId: string) => void;
  onViewQuote?: (quoteId: string) => void;
}

// Sort icon component
function SortIcon({ direction, active }: { direction: SortDirection | null; active: boolean }) {
  return (
    <span className={`ml-1 inline-flex flex-col ${active ? 'text-blue-600' : 'text-gray-400'}`}>
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="currentColor"
        className={`${active && direction === 'asc' ? 'opacity-100' : 'opacity-30'}`}
      >
        <path d="M4 0L7 4H1L4 0Z" />
      </svg>
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="currentColor"
        className={`-mt-0.5 ${active && direction === 'desc' ? 'opacity-100' : 'opacity-30'}`}
      >
        <path d="M4 8L1 4H7L4 8Z" />
      </svg>
    </span>
  );
}

// Sortable header component
function SortableHeader({
  label,
  column,
  currentSort,
  currentDirection,
  onSort,
  className = '',
}: {
  label: string;
  column: SortColumn;
  currentSort: SortColumn | null;
  currentDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  className?: string;
}) {
  const isActive = currentSort === column;
  return (
    <button
      onClick={() => onSort(column)}
      className={`flex items-center text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors ${className}`}
    >
      {label}
      <SortIcon direction={isActive ? currentDirection : null} active={isActive} />
    </button>
  );
}

export function TakeoffListView({
  takeoffs,
  onTakeoffClick,
  onDeleteTakeoff,
  onViewQuote
}: TakeoffListViewProps) {
  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn | null>('createdDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Handle column sort click
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending for dates, ascending for text
      setSortColumn(column);
      setSortDirection(['createdDate', 'bidDate'].includes(column) ? 'desc' : 'asc');
    }
  };

  // Sort takeoffs
  const sortedTakeoffs = useMemo(() => {
    if (!sortColumn) return takeoffs;

    return [...takeoffs].sort((a, b) => {
      let aValue: string | number | null = null;
      let bValue: string | number | null = null;

      switch (sortColumn) {
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'source':
          aValue = a.source?.toLowerCase() || '';
          bValue = b.source?.toLowerCase() || '';
          break;
        case 'createdBy':
          aValue = a.createdBy?.toLowerCase() || '';
          bValue = b.createdBy?.toLowerCase() || '';
          break;
        case 'createdDate':
          aValue = a.createdDate ? new Date(a.createdDate).getTime() : 0;
          bValue = b.createdDate ? new Date(b.createdDate).getTime() : 0;
          break;
        case 'bidDate':
          aValue = a.metadata?.bidDate ? new Date(a.metadata.bidDate).getTime() : 0;
          bValue = b.metadata?.bidDate ? new Date(b.metadata.bidDate).getTime() : 0;
          break;
        case 'location':
          const aLoc = a.metadata?.city && a.metadata?.state
            ? `${a.metadata.city}, ${a.metadata.state}`
            : a.metadata?.city || a.metadata?.state || '';
          const bLoc = b.metadata?.city && b.metadata?.state
            ? `${b.metadata.city}, ${b.metadata.state}`
            : b.metadata?.city || b.metadata?.state || '';
          aValue = aLoc.toLowerCase();
          bValue = bLoc.toLowerCase();
          break;
        case 'status':
          // Custom sort order for status
          const statusOrder: Record<string, number> = {
            'Classification': 1,
            'Abridgment': 2,
            'Parsing': 3,
            'Complete': 4
          };
          aValue = statusOrder[a.status] || 0;
          bValue = statusOrder[b.status] || 0;
          break;
        case 'priority':
          // Custom sort order for priority
          const priorityOrder: Record<string, number> = {
            'High': 3,
            'Medium': 2,
            'Low': 1
          };
          aValue = priorityOrder[a.priority || 'Medium'] || 0;
          bValue = priorityOrder[b.priority || 'Medium'] || 0;
          break;
      }

      if (aValue === null || bValue === null) return 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [takeoffs, sortColumn, sortDirection]);

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      {/* Scrollable Table Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Table Header */}
          <div
            className="grid gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] bg-gray-50/80"
            style={{ gridTemplateColumns: '2fr 0.8fr 1.5fr 1fr 1fr 1.2fr 0.8fr 0.8fr 1fr' }}
          >
            <div>
              <SortableHeader
                label="Project Details"
                column="title"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div>
              <SortableHeader
                label="Source"
                column="source"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div>
              <SortableHeader
                label="Created By"
                column="createdBy"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div>
              <SortableHeader
                label="Created"
                column="createdDate"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div>
              <SortableHeader
                label="Bid Date"
                column="bidDate"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div>
              <SortableHeader
                label="Location"
                column="location"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div>
              <SortableHeader
                label="Status"
                column="status"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div>
              <SortableHeader
                label="Priority"
                column="priority"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            <div className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
              Actions
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {sortedTakeoffs.map((takeoff) => {
              const docCounts = getDocumentCountsByCategory(takeoff.documents || []);
              const totalDocs = takeoff.documents?.length || 0;

              // Get metadata for additional fields
              const bidDate = takeoff.metadata?.bidDate;
              const location = takeoff.metadata?.city && takeoff.metadata?.state
                ? `${takeoff.metadata.city}, ${takeoff.metadata.state}`
                : takeoff.metadata?.city || takeoff.metadata?.state || '-';
              const estimatedValue = takeoff.metadata?.estimatedValue;

              return (
                <div
                  key={takeoff.id}
                  onClick={() => onTakeoffClick(takeoff)}
                  className="grid gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  style={{ gridTemplateColumns: '2fr 0.8fr 1.5fr 1fr 1fr 1.2fr 0.8fr 0.8fr 1fr' }}
                >
                  {/* Project Details */}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm md:text-base text-[var(--foreground)] group-hover:text-blue-600 transition-colors truncate">
                      {takeoff.title}
                    </h3>
                    <p className="text-[10px] md:text-xs text-[var(--muted-foreground)] mt-0.5">
                      {takeoff.metadata?.clientName || 'New Client'}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      Est. Value: {estimatedValue ? `$${Number(estimatedValue).toLocaleString()}` : 'TBD'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {totalDocs > 0 ? `${totalDocs} docs` : '0 docs'}
                      </span>
                      {docCounts.fixtureSchedules > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-medium">
                          Fixture Schedules
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Source */}
                  <div className="flex items-center">
                    <span className="text-[10px] md:text-xs text-[var(--foreground)] truncate">
                      {takeoff.source || 'Upload'}
                    </span>
                  </div>

                  {/* Created By */}
                  <div className="flex items-center">
                    <span className="text-[10px] md:text-xs text-[var(--foreground)] truncate">
                      {takeoff.createdBy || '-'}
                    </span>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center">
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">
                      {formatDate(takeoff.createdDate)}
                    </span>
                  </div>

                  {/* Bid Date */}
                  <div className="flex items-center">
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">
                      {bidDate ? formatDate(bidDate) : '-'}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center">
                    <span className="text-[10px] md:text-xs text-[var(--foreground)] truncate" title={location}>
                      {location}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium whitespace-nowrap ${getStatusColor(takeoff.status)}`}>
                      {takeoff.status}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center">
                    <span className={`px-1.5 md:px-2 py-0.5 rounded text-[9px] md:text-[10px] font-medium ${
                      takeoff.priority === 'High' ? 'bg-red-100 text-red-700' :
                      takeoff.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {takeoff.priority || 'Medium'}
                    </span>
                  </div>

                  {/* Actions - Stacked vertically */}
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTakeoffClick(takeoff);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-md transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      Details
                    </button>
                    {onDeleteTakeoff && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this takeoff?')) {
                            onDeleteTakeoff(takeoff.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                        Delete
                      </button>
                    )}
                    {takeoff.quoteId && onViewQuote && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewQuote(takeoff.quoteId!);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        Quote
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {takeoffs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm">No takeoffs found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
