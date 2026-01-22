/**
 * List View for Jobs
 * Enhanced with better styling, hover states, and visual feedback
 */

import React from 'react';
import { getStatusColor, getOwnerInitials, getOwnerColor } from '../utils';
import type { Job } from '../types';

interface ListViewProps {
  jobs: Job[];
  onJobClick: (job: Job) => void;
  onJobCheckboxChange?: (jobId: string, checked: boolean) => void;
}

export function ListView({ jobs, onJobClick, onJobCheckboxChange }: ListViewProps) {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCheckboxChange = (jobId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onJobCheckboxChange?.(jobId, e.target.checked);
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm">
      {/* Table Container - horizontal scroll only for responsive */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] bg-gray-50/80">
            <div className="col-span-1 flex items-center">
              <span className="text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Done
              </span>
            </div>
            <div className="col-span-3 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Job Name
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Status
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Type
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Owner
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Dates
            </div>
            <div className="col-span-3 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Tags
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {jobs.map((job) => {
              // Check if status indicates completion (case-insensitive)
              const statusLower = job.status?.toLowerCase() || '';
              const isCompleted = ['won', 'complete', 'completed', 'done', 'closed'].some(s => statusLower === s);
              const ownerInitials = getOwnerInitials(job.owner);
              const ownerColor = getOwnerColor(job.id);

              return (
                <div
                  key={job.id}
                  onClick={() => onJobClick(job)}
                  className={`
                    grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4
                    hover:bg-blue-50/50 transition-colors cursor-pointer
                    group
                    ${isCompleted ? 'bg-gray-50/50' : ''}
                  `}
                >
                  {/* Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={handleCheckboxChange(job.id)}
                      onClick={handleCheckboxClick}
                      className="w-4 h-4 rounded border-gray-300 text-green-600
                               focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                    />
                  </div>

                  {/* Job Name */}
                  <div className={`col-span-3 min-w-0 ${isCompleted ? 'opacity-60' : ''}`}>
                    <h3 className={`font-semibold text-sm md:text-base text-[var(--foreground)] group-hover:text-blue-600 transition-colors truncate
                      ${isCompleted ? 'line-through text-gray-500' : ''}
                    `}>
                      {job.name}
                    </h3>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 flex items-center">
                    {(() => {
                      const statusColor = getStatusColor(job.status);
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap ${statusColor.bg} ${statusColor.text}`}>
                          <span className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${statusColor.dot} flex-shrink-0`}></span>
                          {job.status}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Type */}
                  <div className={`col-span-1 flex items-center min-w-0 ${isCompleted ? 'opacity-60' : ''}`}>
                    <span className={`text-xs md:text-sm text-[var(--foreground)] truncate
                      ${isCompleted ? 'line-through' : ''}
                    `}>
                      {job.type}
                    </span>
                  </div>

                  {/* Owner */}
                  <div className="col-span-1 flex items-center">
                    <div
                      className={`w-6 h-6 md:w-7 md:h-7 rounded-full ${ownerColor} flex items-center justify-center
                                 text-white text-[10px] md:text-xs font-semibold shadow-sm flex-shrink-0`}
                      title={job.owner}
                    >
                      {ownerInitials}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className={`col-span-2 flex flex-col justify-center text-xs md:text-sm ${isCompleted ? 'opacity-60' : ''}`}>
                    {job.startDate !== '-' && (
                      <div className={`flex items-center gap-1 text-[var(--muted-foreground)]
                        ${isCompleted ? 'line-through' : ''}
                      `}>
                        <span className="text-[10px] md:text-xs text-gray-400">Start:</span>
                        <span className="text-[10px] md:text-xs">{job.startDate}</span>
                      </div>
                    )}
                    {job.endDate !== '-' && (
                      <div className={`flex items-center gap-1 text-[var(--muted-foreground)]
                        ${isCompleted ? 'line-through' : ''}
                      `}>
                        <span className="text-[10px] md:text-xs text-gray-400">End:</span>
                        <span className="text-[10px] md:text-xs">{job.endDate}</span>
                      </div>
                    )}
                    {job.startDate === '-' && job.endDate === '-' && (
                      <span className="text-[10px] md:text-xs text-gray-400">No dates set</span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className={`col-span-3 flex items-center gap-1 md:gap-1.5 flex-wrap ${isCompleted ? 'opacity-60' : ''}`}>
                    {job.tags.length > 0 ? (
                      job.tags.slice(0, 2).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-md text-[10px] md:text-xs truncate max-w-[80px] md:max-w-[100px]"
                        >
                          <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                          <span className="truncate">{tag}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] md:text-xs text-gray-400">No tags</span>
                    )}
                    {job.tags.length > 2 && (
                      <span className="text-[10px] md:text-xs text-gray-400">+{job.tags.length - 2}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm">No jobs found</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
