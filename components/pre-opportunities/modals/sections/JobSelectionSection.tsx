/**
 * Job Selection Section for Create Pre-Opportunity Modal
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { JobSearchResult } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';

interface JobSelectionSectionProps {
  jobId: string;
  jobName: string;
  onJobSelect: (job: JobSearchResult) => void;
  onJobClear: () => void;
  jobs: JobSearchResult[];
  isLoadingJobs: boolean;
  onJobSearch: (term: string, allowEmpty: boolean) => void;
}

export function JobSelectionSection({
  jobId,
  jobName,
  onJobSelect,
  onJobClear,
  jobs,
  isLoadingJobs,
  onJobSearch,
}: JobSelectionSectionProps) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearch = useDebounce(search, 300);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (showDropdown && !jobId) {
      onJobSearch(debouncedSearch, true);
    }
  }, [debouncedSearch, showDropdown, jobId, onJobSearch]);

  const handleFocus = () => {
    onJobSearch('', true);
    setShowDropdown(true);
  };

  const handleSelect = (job: JobSearchResult) => {
    onJobSelect(job);
    setSearch(job.jobName);
    setShowDropdown(false);
  };

  const handleClear = () => {
    onJobClear();
    setSearch('');
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Job Information
      </h3>
      
      <div ref={containerRef} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Associated Job (Optional)
          {jobId && (
            <span className="ml-2 text-green-600 font-normal">✓ {jobName}</span>
          )}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={jobId ? jobName : search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={handleFocus}
            placeholder="Click to see all jobs or type to search..."
            readOnly={!!jobId}
            className={`flex-1 px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 ${
              jobId ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'
            }`}
          />
          {isLoadingJobs && !jobId && (
            <div className="flex items-center px-3">
              <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          )}
          {jobId && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
        
        {showDropdown && !jobId && (
          <>
            {jobs.length > 0 ? (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => handleSelect(job)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{job.jobName}</div>
                    <div className="text-xs text-gray-500">
                      {job.jobType && <span className="mr-2">Type: {job.jobType}</span>}
                      {job.status?.name && <span>Status: {job.status.name}</span>}
                    </div>
                  </button>
                ))}
              </div>
            ) : !isLoadingJobs ? (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                {search ? `No jobs found for "${search}"` : 'No jobs available'}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
