/**
 * Dashboard Content Component (Refactored)
 * Activity feed dashboard with real CRM data
 */

'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import AdvancedFilters, { type ActiveFilter, type ActiveSort } from '../AdvancedFilters';
import SortButton from '../SortButton';
import { useDashboardFilters } from './hooks/useDashboardFilters';
import { useActivityFeed } from './hooks/useActivityFeed';
import { filterActivities, sortActivitiesByDate, transformToActivities } from './utils';
import { getActivityFilterOptions, getActivitySortOptions } from './config/filterConfig';
import { ActivityCard } from './components/ActivityCard';
import { ActivityFilterButtons } from './components/ActivityFilterButtons';
import { StatusFilterButtons } from './components/StatusFilterButtons';
import { DashboardActionButtons } from './components/DashboardActionButtons';
import type { Activity } from './types';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

// Import Create Modals
import CreateJobModal from '../CreateJobModal';
import { CreateTaskModal } from '../tasks/modals';
import { CreateNoteModal } from '../notes/modals/CreateNoteModal';
import { CreatePreOpportunityModal } from '../pre-opportunities/modals/CreatePreOpportunityModal';

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 pb-4 border-b border-[var(--border)] animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">No activities found</h3>
      <p className="text-sm text-[var(--muted-foreground)]">
        Create jobs, contacts, or other items to see activity here.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <svg className="mx-auto w-16 h-16 text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 className="text-lg font-medium text-red-600 mb-1">Failed to load activities</h3>
      <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
    </div>
  );
}

export default function DashboardContent() {
  // Track mounted state to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useActivityFeed();

  // Infinite scroll
  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });
  
  // Modal states
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [showCreatePreOpportunityModal, setShowCreatePreOpportunityModal] = useState(false);
  
  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<ActiveFilter[]>([]);
  const [activeSorts, setActiveSorts] = useState<ActiveSort[]>([]);

  // Get filter and sort options
  const activityFilterOptions = useMemo(() => getActivityFilterOptions(), []);
  const activitySortOptions = useMemo(() => getActivitySortOptions(), []);

  const {
    activeFilters,
    statusFilters,
    toggleFilter,
    toggleStatusFilter,
    selectAll,
  } = useDashboardFilters();

  // Modal handlers
  const handleModalSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle advanced filter changes
  const handleAdvancedFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setAdvancedFilters(filters);
  }, []);

  // Handle multi-sort changes
  const handleMultiSortChange = useCallback((sorts: ActiveSort[]) => {
    setActiveSorts(sorts);
  }, []);

  // Apply advanced filters to activities
  const applyAdvancedFilters = useCallback((activities: Activity[]): Activity[] => {
    if (advancedFilters.length === 0) return activities;
    
    return activities.filter(activity => {
      return advancedFilters.every(filter => {
        const { columnName, operator, value, values } = filter;
        
        // Get the activity field value
        let fieldValue: string | string[] | undefined;
        switch (columnName) {
          case 'type':
            fieldValue = activity.type;
            break;
          case 'activityStatus':
            fieldValue = activity.activityStatus;
            break;
          case 'entityType':
            fieldValue = activity.entityType;
            break;
          case 'entity':
            fieldValue = activity.entity;
            break;
          case 'assignedTo':
            fieldValue = activity.assignedTo;
            break;
          case 'tags':
            fieldValue = activity.tags;
            break;
          default:
            return true;
        }
        
        if (fieldValue === undefined) return false;
        
        // Apply filter based on operator
        if (operator === 'IN' && values) {
          const normalizedValues = values.map(v => v.toLowerCase().replace(' ', '-'));
          const normalizedField = typeof fieldValue === 'string' 
            ? fieldValue.toLowerCase() 
            : fieldValue.map(v => v.toLowerCase());
          
          if (Array.isArray(normalizedField)) {
            return normalizedValues.some(v => normalizedField.includes(v));
          }
          return normalizedValues.includes(normalizedField);
        }
        
        if (operator === 'ILIKE' && value) {
          const searchValue = value.toLowerCase();
          const normalizedField = typeof fieldValue === 'string' 
            ? fieldValue.toLowerCase() 
            : fieldValue.join(' ').toLowerCase();
          return normalizedField.includes(searchValue);
        }
        
        if (operator === 'EQ' && value) {
          return typeof fieldValue === 'string' && fieldValue.toLowerCase() === value.toLowerCase();
        }
        
        return true;
      });
    });
  }, [advancedFilters]);

  // Transform and process activities
  const activities = useMemo(() => {
    if (!data) return [];
    return transformToActivities(data);
  }, [data]);

  // Filter and sort activities (including advanced filters)
  const filteredActivities = useMemo(() => {
    let filtered = filterActivities(activities, activeFilters, statusFilters);
    filtered = applyAdvancedFilters(filtered);

    // Apply multi-sort if specified
    if (activeSorts.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const sort of activeSorts) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const aVal = String((a as any)[sort.columnName] || '');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bVal = String((b as any)[sort.columnName] || '');
          const comparison = aVal.localeCompare(bVal);
          if (comparison !== 0) {
            return sort.direction === 'ASC' ? comparison : -comparison;
          }
        }
        return 0;
      });
    } else {
      // Default sort by date
      filtered = sortActivitiesByDate(filtered);
    }

    return filtered;
  }, [activities, activeFilters, statusFilters, applyAdvancedFilters, activeSorts]);

  // Calculate counts for display
  const activityCounts = useMemo(() => ({
    total: activities.length,
    filtered: filteredActivities.length,
    jobs: data?.jobs.length || 0,
    companies: data?.companies.length || 0,
    contacts: data?.contacts.length || 0,
    preOpportunities: data?.preOpportunities.length || 0,
    notes: data?.notes.length || 0,
    tasks: data?.tasks.length || 0,
  }), [activities, filteredActivities, data]);

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Activity Feed</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Your operational command center for manufacturing sales
              {activityCounts.total > 0 && (
                <span className="ml-2 text-[var(--primary)]">
                  ({activityCounts.filtered} of {activityCounts.total} activities)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusFilterButtons
              statusFilters={statusFilters}
              onToggleStatusFilter={toggleStatusFilter}
            />
            <AdvancedFilters 
              filterOptions={activityFilterOptions}
              activeFilters={advancedFilters}
              onFiltersChange={handleAdvancedFiltersChange}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <DashboardActionButtons
        onAddJob={() => setShowCreateJobModal(true)}
        onCreatePreOpportunity={() => setShowCreatePreOpportunityModal(true)}
        onAddTask={() => setShowCreateTaskModal(true)}
        onCreateNote={() => setShowCreateNoteModal(true)}
      />

      {/* Activity Feed */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 3v14M3 10h14" strokeLinecap="round"/>
            <circle cx="10" cy="10" r="7"/>
          </svg>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Activity</h2>
          {!isLoading && activityCounts.total > 0 && (
            <span className="text-xs text-[var(--muted-foreground)] ml-2">
              {activityCounts.jobs} Jobs • {activityCounts.companies} Companies • {activityCounts.contacts} Contacts • {activityCounts.preOpportunities} Pre-Opps • {activityCounts.notes} Notes • {activityCounts.tasks} Tasks
            </span>
          )}
        </div>

        {/* Quick Filters */}
        <ActivityFilterButtons
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
          onSelectAll={selectAll}
        />

        {/* Activity List */}
        <div className="space-y-4">
          {!isMounted || isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error.message} />
          ) : filteredActivities.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {filteredActivities.map((activity) => (
                <ActivityCard key={`${activity.type}-${activity.id}`} activity={activity} />
              ))}

              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} className="h-4" />

              {/* Loading more indicator */}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4">
                  <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm text-gray-500">Loading more activities...</span>
                </div>
              )}

              {/* End of list indicator */}
              {!hasNextPage && filteredActivities.length > 0 && (
                <div className="text-center py-4 text-sm text-gray-400">
                  All activities loaded
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Modals */}
      {showCreateJobModal && (
        <CreateJobModal
          isOpen={showCreateJobModal}
          onClose={() => setShowCreateJobModal(false)}
          onSuccess={() => {
            setShowCreateJobModal(false);
            handleModalSuccess();
          }}
        />
      )}

      {showCreateTaskModal && (
        <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onSuccess={() => {
            setShowCreateTaskModal(false);
            handleModalSuccess();
          }}
        />
      )}

      {showCreateNoteModal && (
        <CreateNoteModal
          isOpen={showCreateNoteModal}
          onClose={() => setShowCreateNoteModal(false)}
          onSuccess={() => {
            setShowCreateNoteModal(false);
            handleModalSuccess();
          }}
        />
      )}

      {showCreatePreOpportunityModal && (
        <CreatePreOpportunityModal
          isOpen={showCreatePreOpportunityModal}
          onClose={() => setShowCreatePreOpportunityModal(false)}
          onSuccess={() => {
            setShowCreatePreOpportunityModal(false);
            handleModalSuccess();
          }}
        />
      )}
    </main>
  );
}
