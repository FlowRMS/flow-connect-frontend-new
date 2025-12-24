'use client';

import React from 'react';

type StatFilter = 'all' | 'pending' | 'in_progress' | 'completed';

interface FulfillmentStatsCardsProps {
  totalCount: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  activeStatFilter: StatFilter;
  onStatCardClick: (filter: StatFilter) => void;
}

export default function FulfillmentStatsCards({
  totalCount,
  pendingCount,
  inProgressCount,
  completedCount,
  activeStatFilter,
  onStatCardClick,
}: FulfillmentStatsCardsProps) {
  const getStatCardClass = (filter: StatFilter) => {
    const baseClass = "bg-[var(--card)] rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md";
    if (activeStatFilter === filter) {
      return `${baseClass} border-[var(--primary)] ring-2 ring-[var(--primary)]/20`;
    }
    return `${baseClass} border-[var(--border)] hover:border-[var(--primary)]/50`;
  };

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div
        className={getStatCardClass('all')}
        onClick={() => onStatCardClick('all')}
      >
        <div className="text-sm text-[var(--muted-foreground)]">Total Fulfillments</div>
        <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{totalCount}</div>
        {activeStatFilter === 'all' && (
          <div className="text-xs text-[var(--primary)] mt-1">Showing all</div>
        )}
      </div>
      <div
        className={getStatCardClass('pending')}
        onClick={() => onStatCardClick('pending')}
      >
        <div className="text-sm text-[var(--muted-foreground)]">Pending</div>
        <div className="text-2xl font-semibold text-yellow-600 mt-1">{pendingCount}</div>
        {activeStatFilter === 'pending' && (
          <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
        )}
      </div>
      <div
        className={getStatCardClass('in_progress')}
        onClick={() => onStatCardClick('in_progress')}
      >
        <div className="text-sm text-[var(--muted-foreground)]">In Progress</div>
        <div className="text-2xl font-semibold text-blue-600 mt-1">{inProgressCount}</div>
        {activeStatFilter === 'in_progress' && (
          <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
        )}
      </div>
      <div
        className={getStatCardClass('completed')}
        onClick={() => onStatCardClick('completed')}
      >
        <div className="text-sm text-[var(--muted-foreground)]">Completed</div>
        <div className="text-2xl font-semibold text-green-600 mt-1">{completedCount}</div>
        {activeStatFilter === 'completed' && (
          <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
        )}
      </div>
    </div>
  );
}

