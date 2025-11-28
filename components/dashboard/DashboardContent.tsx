/**
 * Dashboard Content Component (Refactored)
 * Clean modular implementation of the activity feed dashboard
 */

'use client';

import React from 'react';
import AdvancedFilters from '../AdvancedFilters';
import { useDashboardFilters } from './hooks/useDashboardFilters';
import { filterActivities, sortActivitiesByDate } from './utils';
import { mockActivities } from './mockData';
import { activityFilterOptions } from './config/filterConfig';
import { ActivityCard } from './components/ActivityCard';
import { ActivityFilterButtons } from './components/ActivityFilterButtons';
import { StatusFilterButtons } from './components/StatusFilterButtons';
import { DashboardActionButtons } from './components/DashboardActionButtons';

export default function DashboardContent() {
  const {
    activeFilters,
    statusFilters,
    toggleFilter,
    toggleStatusFilter,
    selectAll,
  } = useDashboardFilters();

  // Filter and sort activities
  const filteredActivities = filterActivities(mockActivities, activeFilters, statusFilters);
  const sortedActivities = sortActivitiesByDate(filteredActivities);

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Activity Feed</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Your operational command center for manufacturing sales
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusFilterButtons
              statusFilters={statusFilters}
              onToggleStatusFilter={toggleStatusFilter}
            />
            <AdvancedFilters filterOptions={activityFilterOptions} />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <DashboardActionButtons />

      {/* Activity Feed */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 3v14M3 10h14" strokeLinecap="round"/>
            <circle cx="10" cy="10" r="7"/>
          </svg>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Activity</h2>
        </div>

        {/* Quick Filters */}
        <ActivityFilterButtons
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
          onSelectAll={selectAll}
        />

        {/* Activity List */}
        <div className="space-y-4">
          {sortedActivities.map((activity, index) => (
            <ActivityCard key={index} activity={activity} index={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
