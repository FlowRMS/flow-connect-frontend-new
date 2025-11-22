'use client';

import React, { useState } from 'react';

type Job = {
  id: string;
  name: string;
  status: 'Active' | 'Bidding' | 'Won' | 'Lost' | 'On Hold';
  type: string;
  value: string;
  startDate: string;
  gc: string;
  ec: string;
  owner: string;
  tags: string[];
};

export default function JobsContent() {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const jobs: Job[] = [
    {
      id: 'J-2024-001',
      name: 'Downtown Plaza Renovation',
      status: 'Active',
      type: 'Commercial',
      value: '$2.3M',
      startDate: '2024-03-15',
      gc: 'Turner Construction',
      ec: 'Miller Electric',
      owner: 'Sarah Johnson',
      tags: ['Lighting', 'Controls'],
    },
    {
      id: 'J-2024-002',
      name: 'TechCorp HQ Expansion',
      status: 'Bidding',
      type: 'Office',
      value: '$1.8M',
      startDate: '2024-04-01',
      gc: 'Hensel Phelps',
      ec: 'Summit Electric',
      owner: 'Marcus Chen',
      tags: ['HVAC', 'Data Center'],
    },
    {
      id: 'J-2024-003',
      name: 'Riverside Medical Center',
      status: 'Active',
      type: 'Healthcare',
      value: '$4.2M',
      startDate: '2024-02-20',
      gc: 'McCarthy Building',
      ec: 'Johnson Controls',
      owner: 'Sarah Johnson',
      tags: ['Critical Systems', 'Emergency Power'],
    },
    {
      id: 'J-2024-004',
      name: 'Harbor View Apartments',
      status: 'Won',
      type: 'Residential',
      value: '$890K',
      startDate: '2024-05-10',
      gc: 'Swinerton Builders',
      ec: 'Bay Area Electric',
      owner: 'Marcus Chen',
      tags: ['Multi-family', 'Energy Efficient'],
    },
    {
      id: 'J-2024-005',
      name: 'University Lab Building',
      status: 'Bidding',
      type: 'Education',
      value: '$3.1M',
      startDate: '2024-06-01',
      gc: 'Skanska USA',
      ec: 'Prime Electric',
      owner: 'David Torres',
      tags: ['Lab Systems', 'Specialty Lighting'],
    },
    {
      id: 'J-2024-006',
      name: 'Westside Mall Renovation',
      status: 'On Hold',
      type: 'Retail',
      value: '$1.2M',
      startDate: '2024-07-15',
      gc: 'Layton Construction',
      ec: 'Advanced Electric',
      owner: 'Sarah Johnson',
      tags: ['Retail', 'Renovation'],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-[var(--success)] text-white';
      case 'Bidding':
        return 'bg-[var(--info)] text-white';
      case 'Won':
        return 'bg-[var(--primary)] text-white';
      case 'Lost':
        return 'bg-[var(--error)] text-white';
      case 'On Hold':
        return 'bg-[var(--warning)] text-white';
      default:
        return 'bg-[var(--muted)] text-[var(--foreground)]';
    }
  };

  const filteredJobs = filterStatus === 'all'
    ? jobs
    : jobs.filter(job => job.status === filterStatus);

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Jobs</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Track and manage all construction projects
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
            </svg>
            Add Job
          </button>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] border border-[var(--border)]'
            }`}
          >
            All ({jobs.length})
          </button>
          <button
            onClick={() => setFilterStatus('Active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'Active'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] border border-[var(--border)]'
            }`}
          >
            Active ({jobs.filter(j => j.status === 'Active').length})
          </button>
          <button
            onClick={() => setFilterStatus('Bidding')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'Bidding'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] border border-[var(--border)]'
            }`}
          >
            Bidding ({jobs.filter(j => j.status === 'Bidding').length})
          </button>
          <button
            onClick={() => setFilterStatus('Won')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === 'Won'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] border border-[var(--border)]'
            }`}
          >
            Won ({jobs.filter(j => j.status === 'Won').length})
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] border border-[var(--border)]'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'kanban'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] border border-[var(--border)]'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="5" height="14" rx="1"/>
              <rect x="12" y="3" width="5" height="8" rx="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Jobs List */}
      {viewMode === 'list' ? (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Job Name
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Status
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Type
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Value
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              GC
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              EC
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Tags
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
              >
                <div className="col-span-3">
                  <h3 className="font-medium text-[var(--foreground)] mb-1">{job.name}</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">{job.id}</p>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{job.type}</span>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-sm font-medium text-[var(--foreground)]">{job.value}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{job.gc}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-[var(--foreground)]">{job.ec}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1 flex-wrap">
                  {job.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          Kanban view coming soon...
        </div>
      )}
    </main>
  );
}
