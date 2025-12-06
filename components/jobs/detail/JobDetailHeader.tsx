/**
 * Job Detail Header Component
 * Enhanced with better visual hierarchy and styling
 */

import React from 'react';
import { getStatusColor, getOwnerInitials, getOwnerColor } from '../utils';
import type { Job, RepType } from '../types';
import { REP_TYPE_CONFIG } from '../constants';

interface JobDetailHeaderProps {
  job: Job;
  repType: RepType;
  isEditing: boolean;
  isSaving: boolean;
  onBack: () => void;
  onRepTypeClick: () => void;
  onEditClick: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function JobDetailHeader({
  job,
  repType,
  isEditing,
  isSaving,
  onBack,
  onRepTypeClick,
  onEditClick,
  onSave,
  onCancel,
  onDelete,
}: JobDetailHeaderProps) {
  const ownerInitials = getOwnerInitials(job.owner);
  const ownerColor = getOwnerColor(job.id);

  return (
    <div className="mb-4 md:mb-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 md:gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 md:mb-6 transition-colors group"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="group-hover:-translate-x-1 transition-transform md:w-[18px] md:h-[18px]"
        >
          <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xs md:text-sm font-medium">Back to Jobs</span>
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Left Side - Job Info */}
          <div className="flex items-start gap-3 md:gap-4">
            {/* Job Icon */}
            <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 md:w-7 md:h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            {/* Job Details */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                <h1 className="text-lg md:text-2xl font-bold text-[var(--foreground)] truncate">{job.name}</h1>
                <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-medium ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="truncate">{job.type}</span>
                </span>
                {job.owner && (
                  <span className="flex items-center gap-1.5 md:gap-2">
                    <div
                      className={`w-5 h-5 md:w-6 md:h-6 rounded-full ${ownerColor} flex items-center justify-center text-white text-[10px] md:text-xs font-semibold flex-shrink-0`}
                    >
                      {ownerInitials}
                    </div>
                    <span className="truncate">{job.owner}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <button
              onClick={onRepTypeClick}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs md:text-sm font-medium text-gray-700"
              title="Rep Type Settings"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-4 md:h-4">
                <circle cx="10" cy="10" r="3"/>
                <path d="M10 1v2m0 14v2M3.93 3.93l1.41 1.41m9.9 9.9l1.41 1.41M1 10h2m14 0h2M4.34 15.66l1.41-1.41m9.9-9.9l1.41-1.41" strokeLinecap="round"/>
              </svg>
              <span className="hidden sm:inline">{REP_TYPE_CONFIG[repType].label}</span>
            </button>

            {isEditing ? (
              <>
                <button
                  onClick={onCancel}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs md:text-sm font-medium text-gray-700"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-4 md:h-4">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                  </svg>
                  <span className="hidden sm:inline">Cancel</span>
                </button>
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm font-medium disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className="hidden sm:inline">Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-4 md:h-4">
                        <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="hidden sm:inline">Save</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-xs md:text-sm font-medium"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-4 md:h-4">
                    <path d="M3 6h14M8 6V4a2 2 0 012-2h0a2 2 0 012 2v2m3 0v10a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 11v5M14 11v5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="hidden sm:inline">Delete</span>
                </button>
                <button
                  onClick={onEditClick}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs md:text-sm font-medium"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-4 md:h-4">
                    <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 010 3l-9 9L6 15l.5-3.5 9-9a2.121 2.121 0 013 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
