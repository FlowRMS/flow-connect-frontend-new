/**
 * Take-Off List View Component
 * Clean table layout matching FlowCRM design
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Takeoff } from '../types';

interface TakeoffListViewProps {
  takeoffs: Takeoff[];
  totalCount?: number;
  onTakeoffClick?: (takeoff: Takeoff) => void;
  onDeleteTakeoff?: (takeoffId: string) => void;
  onViewQuote?: (quoteId: string) => void;
}

// Sortable fields type
type SortField = 'title' | 'source' | 'createdBy' | 'createdDate' | 'status';

// Get status badge styling
function getStatusBadge(status: string) {
  switch (status) {
    case 'Complete':
      return 'bg-green-500 text-white';
    case 'Parsing':
      return 'bg-blue-500 text-white';
    case 'Classification':
      return 'bg-purple-500 text-white';
    case 'Abridgment':
      return 'bg-amber-500 text-white';
    case 'Review':
      return 'bg-teal-500 text-white';
    case 'Product Cross':
      return 'bg-orange-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

// Get takeoff number from backend or fallback to generated ID
function getTakeoffNumber(takeoff: Takeoff, index: number): string {
  // Use takeoffNumber from backend if available
  if (takeoff.takeoffNumber) {
    return takeoff.takeoffNumber;
  }
  // Fallback: generate from index (for backwards compatibility)
  return `TO-${String(index + 1).padStart(3, '0')}`;
}

export function TakeoffListView({
  takeoffs,
  totalCount,
  onTakeoffClick,
}: TakeoffListViewProps) {
  const router = useRouter();

  // Sort state
  const [sortField, setSortField] = useState<SortField>('createdDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Handle header sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'createdDate' ? 'desc' : 'asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 ml-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {sortDirection === 'asc' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        )}
      </svg>
    );
  };

  // Sorted takeoffs
  const sortedTakeoffs = useMemo(() => {
    return [...takeoffs].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
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
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue);
      const bStr = String(bValue);
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [takeoffs, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedTakeoffs.length / pageSize);
  const paginatedTakeoffs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTakeoffs.slice(start, start + pageSize);
  }, [sortedTakeoffs, currentPage, pageSize]);

  // Reset to page 1 when sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortField, sortDirection]);

  const handleViewClick = (takeoff: Takeoff) => {
    router.push(`/take-offs/${takeoff.id}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table */}
      <table className="w-full">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th
              onClick={() => handleSort('title')}
              className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
            >
              <div className="flex items-center">
                Takeoff Title
                <SortIndicator field="title" />
              </div>
            </th>
            <th
              onClick={() => handleSort('source')}
              className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
            >
              <div className="flex items-center">
                Source
                <SortIndicator field="source" />
              </div>
            </th>
            <th
              onClick={() => handleSort('createdBy')}
              className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
            >
              <div className="flex items-center">
                Created By
                <SortIndicator field="createdBy" />
              </div>
            </th>
            <th
              onClick={() => handleSort('createdDate')}
              className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
            >
              <div className="flex items-center">
                Created Date
                <SortIndicator field="createdDate" />
              </div>
            </th>
            <th
              onClick={() => handleSort('status')}
              className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group"
            >
              <div className="flex items-center">
                Status
                <SortIndicator field="status" />
              </div>
            </th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-gray-200">
          {paginatedTakeoffs.map((takeoff, index) => (
            <tr
              key={takeoff.id}
              className="hover:bg-gray-50 transition-colors"
            >
              {/* Takeoff Title */}
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {takeoff.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {getTakeoffNumber(takeoff, (currentPage - 1) * pageSize + index)}
                  </p>
                </div>
              </td>

              {/* Source */}
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600">
                  {takeoff.source || 'Manual Upload'}
                </span>
              </td>

              {/* Created By */}
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600">
                  {takeoff.createdBy || '-'}
                </span>
              </td>

              {/* Created Date */}
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600">
                  {formatDate(takeoff.createdDate)}
                </span>
              </td>

              {/* Status */}
              <td className="px-6 py-4">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(takeoff.status)}`}>
                  {takeoff.status}
                </span>
              </td>

              {/* Actions */}
              <td className="px-6 py-4">
                <button
                  onClick={() => handleViewClick(takeoff)}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {sortedTakeoffs.length > pageSize && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedTakeoffs.length)} of {totalCount || sortedTakeoffs.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {takeoffs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm">No takeoffs found</span>
          <p className="text-xs text-gray-400 mt-1">Create a new take-off to get started</p>
        </div>
      )}
    </div>
  );
}
