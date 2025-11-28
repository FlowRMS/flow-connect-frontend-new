/**
 * Job Details Form Component
 */

import React from 'react';
import type { Job } from '../types';

interface JobDetailsFormProps {
  job: Job;
  isEditing: boolean;
  editFormData: Partial<Job>;
  onChange: (field: keyof Job, value: string) => void;
}

export function JobDetailsForm({ job, isEditing, editFormData, onChange }: JobDetailsFormProps) {
  const handleChange = (field: keyof Job) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(field, e.target.value);
  };

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-6">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Job Details</h2>
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-2">
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Job Name</label>
          <input
            type="text"
            value={isEditing ? editFormData.name || '' : job.name}
            onChange={handleChange('name')}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base font-semibold text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Job Type</label>
          <input
            type="text"
            value={isEditing ? editFormData.type || '' : job.type}
            onChange={handleChange('type')}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Value</label>
          <input
            type="text"
            value={isEditing ? editFormData.value || '' : job.value}
            onChange={handleChange('value')}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base font-semibold text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Start Date</label>
          <input
            type={isEditing ? "date" : "text"}
            value={isEditing ? (editFormData.startDate !== '-' ? editFormData.startDate : '') : job.startDate}
            onChange={handleChange('startDate')}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">End Date</label>
          <input
            type={isEditing ? "date" : "text"}
            value={isEditing ? (editFormData.endDate !== '-' ? editFormData.endDate : '') : job.endDate}
            onChange={handleChange('endDate')}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">General Contractor</label>
          <input
            type="text"
            value={isEditing ? editFormData.gc || '' : job.gc}
            onChange={handleChange('gc')}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Electrical Contractor</label>
          <input
            type="text"
            value={isEditing ? editFormData.ec || '' : job.ec}
            onChange={handleChange('ec')}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div className="col-span-4">
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Description</label>
          <textarea
            value={isEditing ? editFormData.description || '' : job.description}
            onChange={handleChange('description')}
            rows={3}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-base text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
            readOnly={!isEditing}
            placeholder={isEditing ? "Enter job description..." : "No description"}
          />
        </div>
        <div className="col-span-4">
          <label className="text-sm text-[var(--muted-foreground)] mb-2 block">Tags</label>
          <div className="flex gap-2 flex-wrap items-center">
            {job.tags.map((tag: string, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-full text-sm flex items-center gap-2">
                {tag}
                {isEditing && (
                  <button className="hover:text-red-500 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </span>
            ))}
            {isEditing && (
              <button className="px-3 py-1 border border-dashed border-[var(--border)] text-[var(--muted-foreground)] rounded-full text-sm hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                + Add Tag
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
