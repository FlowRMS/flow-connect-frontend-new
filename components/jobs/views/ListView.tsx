/**
 * List View for Jobs
 */

import React from 'react';
import { getStatusColor } from '../utils';
import type { Job } from '../types';

interface ListViewProps {
  jobs: Job[];
  onJobClick: (job: Job) => void;
}

export function ListView({ jobs, onJobClick }: ListViewProps) {
  return (
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
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => onJobClick(job)}
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
              {job.tags.map((tag: string, idx: number) => (
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
  );
}
