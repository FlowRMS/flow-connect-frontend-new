/**
 * Job Card Component
 * Enhanced with completion checkbox, better styling, and visual feedback
 */

import React from 'react';
import { getOwnerInitials, getOwnerColor } from './utils';
import type { Job } from './types';

// Tag color mapping for different job types - using strong, visible colors
const TAG_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'BID': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  'BUY': { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  'COMPLETE': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  // 'COMMERCIAL': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  // 'RESIDENTIAL': { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  // 'INDUSTRIAL': { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
};

function getTagColor(tag: string): { bg: string; text: string; dot: string } {
  // Check for exact match first (case-insensitive)
  const upperTag = tag.toUpperCase().trim();
  if (TAG_COLORS[upperTag]) {
    return TAG_COLORS[upperTag];
  }
  // Check if tag contains these keywords
  if (upperTag.includes('BID') || upperTag === 'BIDDING') {
    return TAG_COLORS['BID'];
  }
  if (upperTag.includes('BUY') || upperTag === 'BUYING') {
    return TAG_COLORS['BUY'];
  }
  if (upperTag.includes('COMPLETE') || upperTag.includes('WON') || upperTag.includes('DONE')) {
    return TAG_COLORS['COMPLETE'];
  }
  // if (upperTag.includes('COMMERCIAL')) {
  //   return TAG_COLORS['COMMERCIAL'];
  // }
  // if (upperTag.includes('RESIDENTIAL')) {
  //   return TAG_COLORS['RESIDENTIAL'];
  // }
  // if (upperTag.includes('INDUSTRIAL')) {
  //   return TAG_COLORS['INDUSTRIAL'];
  // }
  // Default color - use indigo for unmatched tags
  return { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' };
}

interface JobCardProps {
  job: Job;
  isDragging?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  onCheckboxChange?: (checked: boolean) => void;
}

export function JobCard({ job, isDragging, isCompleted = false, onClick, onCheckboxChange }: JobCardProps) {
  const ownerInitials = getOwnerInitials(job.owner);
  const ownerColor = getOwnerColor(job.id);
  
  // Check if status indicates completion (case-insensitive)
  const statusLower = job.status?.toLowerCase() || '';
  const isStatusComplete = ['won', 'complete', 'completed', 'done', 'closed'].some(s => statusLower === s);
  const completed = isCompleted || isStatusComplete;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onCheckboxChange?.(e.target.checked);
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 mb-3 
        transition-all duration-150 cursor-pointer
        ${isDragging 
          ? 'shadow-xl scale-[1.02] border-[var(--primary)]/50 bg-[var(--card)]' 
          : 'hover:shadow-sm hover:border-[var(--border-hover,#d1d5db)]'
        }
        ${completed ? 'bg-[var(--muted)]/50 opacity-70' : ''}
      `}
    >
      {/* Header Row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="pt-0.5">
          <input 
            type="checkbox" 
            checked={completed}
            onChange={handleCheckboxChange}
            onClick={handleCheckboxClick}
            className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] 
                     focus:ring-[var(--primary)] focus:ring-offset-0 cursor-pointer"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium text-[var(--foreground)] leading-tight truncate
            ${completed ? 'line-through text-[var(--muted-foreground)]' : ''}
          `}>
            {job.name}
          </h4>
        </div>
        <div 
          className={`w-7 h-7 rounded-full ${ownerColor} flex items-center justify-center 
                     text-white text-xs font-medium flex-shrink-0`}
          title={job.owner}
        >
          {ownerInitials}
        </div>
      </div>

      {/* Meta Information */}
      <div className={`flex items-center gap-2 flex-wrap ${completed ? 'opacity-60' : ''}`}>
        {(() => {
          const statusTagColor = getTagColor(job.status);
          return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 ${statusTagColor.bg} ${statusTagColor.text} rounded text-xs font-medium`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusTagColor.dot}`}></span>
              {job.status}
            </span>
          );
        })()}
        {job.type && job.type !== 'General' && job.type !== job.status && (() => {
          const typeColor = getTagColor(job.type);
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${typeColor.bg} ${typeColor.text} rounded text-xs font-medium`}>
              {job.type}
            </span>
          );
        })()}
      </div>

      {/* Tags */}
      {job.tags && job.tags.length > 0 && (
        <div className={`flex gap-1.5 flex-wrap mt-2 ${completed ? 'opacity-60' : ''}`}>
          {job.tags.map((tag: string, idx: number) => {
            const tagColor = getTagColor(tag);
            return (
              <span
                key={idx}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 ${tagColor.bg} ${tagColor.text} rounded text-xs font-medium`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${tagColor.dot}`}></span>
                {tag}
              </span>
            );
          })}
        </div>
      )}

      {/* Dates */}
      {(job.startDate !== '-' || job.endDate !== '-') && (
        <div className={`flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]
          ${completed ? 'opacity-60' : ''}
        `}>
          {job.startDate !== '-' && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{job.startDate}</span>
            </div>
          )}
          {job.endDate !== '-' && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span>{job.endDate}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
