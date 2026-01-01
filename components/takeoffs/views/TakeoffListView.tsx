/**
 * Take-Off List View Component
 * Clean table layout matching FlowCRM design
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Takeoff } from '../types';

interface TakeoffListViewProps {
  takeoffs: Takeoff[];
  onTakeoffClick?: (takeoff: Takeoff) => void;
  onDeleteTakeoff?: (takeoffId: string) => void;
  onViewQuote?: (quoteId: string) => void;
}

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

// Generate takeoff ID from index or actual ID
function generateTakeoffId(takeoff: Takeoff, index: number): string {
  // If the takeoff has a numeric-style ID, use it
  if (takeoff.id && /^\d+$/.test(takeoff.id)) {
    return `TO-${takeoff.id.padStart(3, '0')}`;
  }
  // Otherwise generate from index
  return `TO-${String(index + 1).padStart(3, '0')}`;
}

export function TakeoffListView({
  takeoffs,
  onTakeoffClick,
}: TakeoffListViewProps) {
  const router = useRouter();

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
          <tr className="border-b border-gray-200">
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Takeoff Title
            </th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Created By
            </th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Created Date
            </th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-gray-200">
          {takeoffs.map((takeoff, index) => (
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
                    {generateTakeoffId(takeoff, index)}
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
