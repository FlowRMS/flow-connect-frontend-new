/**
 * Take-Off List View Component
 * FlowCRM style with grid-based layout
 */

import React from 'react';
import type { Takeoff } from '../types';
import { getStatusColor, getDocumentCountsByCategory } from '../utils';

interface TakeoffListViewProps {
  takeoffs: Takeoff[];
  onTakeoffClick: (takeoff: Takeoff) => void;
  onDeleteTakeoff?: (takeoffId: string) => void;
  onViewQuote?: (quoteId: string) => void;
}

export function TakeoffListView({
  takeoffs,
  onTakeoffClick,
  onDeleteTakeoff,
  onViewQuote
}: TakeoffListViewProps) {
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

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      {/* Scrollable Table Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Table Header */}
          <div className="grid grid-cols-16 gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] bg-gray-50/80">
            <div className="col-span-3 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Project Details
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Source
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Created By
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Created
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Bid Date
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Location
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Status
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Priority
            </div>
            <div className="col-span-4 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
              Actions
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {takeoffs.map((takeoff) => {
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
                  className="grid grid-cols-16 gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                >
                  {/* Project Details */}
                  <div className="col-span-3 min-w-0">
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
                  <div className="col-span-1 flex items-center">
                    <span className="text-[10px] md:text-xs text-[var(--foreground)] truncate">
                      {takeoff.source || 'Upload'}
                    </span>
                  </div>

                  {/* Created By */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-[10px] md:text-xs text-[var(--foreground)] truncate">
                      {takeoff.createdBy || '-'}
                    </span>
                  </div>

                  {/* Created Date */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">
                      {formatDate(takeoff.createdDate)}
                    </span>
                  </div>

                  {/* Bid Date */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-[10px] md:text-xs text-[var(--muted-foreground)]">
                      {bidDate ? formatDate(bidDate) : '-'}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-[10px] md:text-xs text-[var(--foreground)] truncate" title={location}>
                      {location}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 flex items-center">
                    <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium whitespace-nowrap ${getStatusColor(takeoff.status)}`}>
                      {takeoff.status}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="col-span-1 flex items-center">
                    <span className={`px-1.5 md:px-2 py-0.5 rounded text-[9px] md:text-[10px] font-medium ${
                      takeoff.priority === 'High' ? 'bg-red-100 text-red-700' :
                      takeoff.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {takeoff.priority || 'Medium'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-4 flex items-center justify-end gap-1">
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
