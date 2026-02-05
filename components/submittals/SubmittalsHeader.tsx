'use client';

import React from 'react';
import Link from 'next/link';
import type { SubmittalStatus } from '../../lib/types/submittals';
import type { SubmittalsStats } from './hooks/useSubmittalsState';

interface SubmittalsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: SubmittalStatus | 'all';
  onStatusFilterChange: (status: SubmittalStatus | 'all') => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  stats: SubmittalsStats;
  onCreateNew: () => void;
}

export function SubmittalsHeader({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  stats,
  onCreateNew,
}: SubmittalsHeaderProps) {
  return (
    <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--background)]">
      {/* Title and Actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Submittals</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Manage submittal packages for your projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/spec-sheets"
            className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Spec Sheet Library
          </Link>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            New Submittal
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-6 mb-4">
        <button
          onClick={() => onStatusFilterChange('all')}
          className={`text-sm ${statusFilter === 'all' ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => onStatusFilterChange('draft')}
          className={`text-sm ${statusFilter === 'draft' ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}
        >
          Drafts ({stats.draft})
        </button>
        <button
          onClick={() => onStatusFilterChange('for_approval')}
          className={`text-sm ${statusFilter === 'for_approval' ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}
        >
          Pending Approval ({stats.forApproval})
        </button>
        <button
          onClick={() => onStatusFilterChange('approved')}
          className={`text-sm ${statusFilter === 'approved' ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}
        >
          Approved ({stats.approved})
        </button>
      </div>

      {/* Search & View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            <circle cx="9" cy="9" r="7"/>
            <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search submittals..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
          />
        </div>
        <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-[var(--muted)]' : ''} transition-colors`}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 10h16M4 14h16M4 18h16" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-[var(--muted)]' : ''} transition-colors`}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="6" height="6" rx="1"/>
              <rect x="11" y="3" width="6" height="6" rx="1"/>
              <rect x="3" y="11" width="6" height="6" rx="1"/>
              <rect x="11" y="11" width="6" height="6" rx="1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
