/**
 * Job Detail Header Component
 */

import React from 'react';
import { getStatusColor } from '../utils';
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
}: JobDetailHeaderProps) {
  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 10H5M10 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Jobs
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{job.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
              {job.status}
            </span>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">{job.id} • {job.type}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRepTypeClick}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            title="Rep Type Settings"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="3"/>
              <path d="M10 1v2m0 14v2M3.93 3.93l1.41 1.41m9.9 9.9l1.41 1.41M1 10h2m14 0h2M4.34 15.66l1.41-1.41m9.9-9.9l1.41-1.41" strokeLinecap="round"/>
            </svg>
            <span className="text-sm">{REP_TYPE_CONFIG[repType].label}</span>
          </button>
          {isEditing ? (
            <>
              <button 
                onClick={onCancel}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button 
              onClick={onEditClick}
              className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 010 3l-9 9L6 15l.5-3.5 9-9a2.121 2.121 0 013 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
