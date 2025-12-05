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
        group bg-white border rounded-lg p-4 mb-3 
        transition-all duration-200 cursor-pointer
        ${isDragging 
          ? 'opacity-60 shadow-lg scale-[1.02] rotate-1 border-blue-300' 
          : 'hover:shadow-md hover:border-gray-300 border-gray-200'
        }
        ${completed ? 'bg-gray-50 opacity-75' : ''}
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
            className="w-4 h-4 rounded border-gray-300 text-green-600 
                     focus:ring-green-500 focus:ring-offset-0 cursor-pointer
                     transition-colors"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold text-gray-900 leading-tight truncate
            ${completed ? 'line-through text-gray-500' : ''}
          `}>
            {job.name}
          </h4>
        </div>
        <div 
          className={`w-7 h-7 rounded-full ${ownerColor} flex items-center justify-center 
                     text-white text-xs font-semibold flex-shrink-0 shadow-sm`}
          title={job.owner}
        >
          {ownerInitials}
        </div>
      </div>

      {/* Meta Information */}
      <div className={`flex items-center gap-2 mb-3 ${completed ? 'opacity-60' : ''}`}>
        {(() => {
          // Use tag colors for status (BID, BUY, COMPLETE)
          const statusTagColor = getTagColor(job.status);
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${statusTagColor.bg} ${statusTagColor.text} rounded-full text-xs font-semibold`}>
              <span className={`w-2 h-2 rounded-full ${statusTagColor.dot}`}></span>
              {job.status}
            </span>
          );
        })()}
        {job.type && job.type !== 'General' && job.type !== job.status && (() => {
          const typeColor = getTagColor(job.type);
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${typeColor.bg} ${typeColor.text} rounded-full text-xs font-medium`}>
              <span className={`w-1.5 h-1.5 rounded-full ${typeColor.dot}`}></span>
              {job.type}
            </span>
          );
        })()}
      </div>

      {/* Tags */}
      {/* {job.tags.length > 0 && (
        <div className={`flex gap-1.5 flex-wrap ${completed ? 'opacity-60' : ''}`}>
          {job.tags.map((tag: string, idx: number) => {
            const tagColor = getTagColor(tag);
            return (
              <span
                key={idx}
                className={`inline-flex items-center gap-1.5 px-2 py-1 ${tagColor.bg} ${tagColor.text} rounded-md text-xs font-medium`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${tagColor.dot}`}></span>
                {tag}
              </span>
            );
          })}
        </div>
      )} */}

      {/* Dates */}
      {(job.startDate !== '-' || job.endDate !== '-') && (
        <div className={`flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500
          ${completed ? 'opacity-60 line-through' : ''}
        `}>
          {job.startDate !== '-' && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{job.startDate}</span>
            </div>
          )}
          {job.endDate !== '-' && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>{job.endDate}</span>
            </div>
          )}
        </div>
      )}

      {/* Drag Handle Indicator - visible on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity">
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
        </svg>
      </div>
    </div>
  );
}
