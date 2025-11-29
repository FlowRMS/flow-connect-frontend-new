/**
 * Pre-Opportunity Details Form Component
 */

import React, { useState, useEffect } from 'react';
import type { PreOpportunity, PreOpportunityStatus, JobSearchResult } from '../types';
import { formatDate, formatCurrency } from '../utils';
import { useCRMJobSearch } from '../../hooks/useCRMApi';

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface PreOpportunityDetailsFormProps {
  preOpp: PreOpportunity;
  isEditing: boolean;
  editFormData: EditFormData;
  onChange: (field: keyof EditFormData, value: string) => void;
}

export interface EditFormData {
  status: PreOpportunityStatus;
  expDate: string;
  reviseDate: string;
  acceptDate: string;
  customerRef: string;
  paymentTerms: string;
  freightTerms: string;
  jobId: string;
  jobName: string;
}

export function PreOpportunityDetailsForm({
  preOpp,
  isEditing,
  editFormData,
  onChange,
}: PreOpportunityDetailsFormProps) {
  // Job search states
  const [jobSearch, setJobSearch] = useState(editFormData.jobName || '');
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [jobValidated, setJobValidated] = useState(!!editFormData.jobId);
  const debouncedJobSearch = useDebounce(jobSearch, 300);
  
  const { data: jobs = [], isLoading: isLoadingJobs } = useCRMJobSearch(
    jobValidated ? '' : debouncedJobSearch
  );

  // Sync job search with form data
  useEffect(() => {
    if (editFormData.jobName !== jobSearch) {
      setJobSearch(editFormData.jobName || '');
      setJobValidated(!!editFormData.jobId);
    }
  }, [editFormData.jobName, editFormData.jobId]);

  // Auto-show dropdown when debounced search has results
  useEffect(() => {
    if (debouncedJobSearch.length >= 2 && !jobValidated && isEditing) {
      setShowJobDropdown(true);
    }
  }, [debouncedJobSearch, jobValidated, isEditing]);

  const handleSelectJob = (job: JobSearchResult) => {
    onChange('jobId', job.id);
    onChange('jobName', job.jobName);
    setJobSearch(job.jobName);
    setJobValidated(true);
    setShowJobDropdown(false);
  };

  const clearJob = () => {
    onChange('jobId', '');
    onChange('jobName', '');
    setJobSearch('');
    setJobValidated(false);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Entity Number</label>
            <div className="text-sm text-gray-900 font-medium">{preOpp.entityNumber}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Entity Date</label>
            <div className="text-sm text-gray-900">{formatDate(preOpp.entityDate)}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            {isEditing ? (
              <select
                value={editFormData.status}
                onChange={(e) => onChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CONVERTED">Converted</option>
              </select>
            ) : (
              <div className="text-sm text-gray-900">{editFormData.status}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Expiration Date</label>
            {isEditing ? (
              <input
                type="date"
                value={editFormData.expDate}
                onChange={(e) => onChange('expDate', e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-sm text-gray-900">
                {preOpp.expDate ? formatDate(preOpp.expDate) : '-'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Accept Date</label>
            {isEditing ? (
              <input
                type="date"
                value={editFormData.acceptDate}
                onChange={(e) => onChange('acceptDate', e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-sm text-gray-900">
                {preOpp.acceptDate ? formatDate(preOpp.acceptDate) : '-'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Revise Date</label>
            {isEditing ? (
              <input
                type="date"
                value={editFormData.reviseDate}
                onChange={(e) => onChange('reviseDate', e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-sm text-gray-900">
                {preOpp.reviseDate ? formatDate(preOpp.reviseDate) : '-'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Information Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h2>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Associated Job
            {jobValidated && editFormData.jobName && (
              <span className="ml-2 text-green-600 font-normal">✓</span>
            )}
          </label>
          {isEditing ? (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={jobSearch}
                  onChange={(e) => {
                    setJobSearch(e.target.value);
                    setJobValidated(false);
                    if (e.target.value.length < 2) {
                      setShowJobDropdown(false);
                    }
                  }}
                  placeholder="Enter job name to search..."
                  className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
                {isLoadingJobs && jobSearch.length >= 2 && !jobValidated && (
                  <div className="flex items-center px-3">
                    <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                )}
                {jobValidated && (
                  <button
                    type="button"
                    onClick={clearJob}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
              {showJobDropdown && jobs.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {jobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => handleSelectJob(job)}
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
              )}
              {showJobDropdown && !isLoadingJobs && jobs.length === 0 && jobSearch.length >= 2 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                  No jobs found matching &quot;{jobSearch}&quot;
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-900">
              {preOpp.job ? (
                <div className="space-y-2">
                  <div className="font-medium">{preOpp.job.jobName}</div>
                  {preOpp.job.jobType && (
                    <div className="text-gray-500">Type: {preOpp.job.jobType}</div>
                  )}
                  {preOpp.job.status?.name && (
                    <div className="text-gray-500">Status: {preOpp.job.status.name}</div>
                  )}
                  {preOpp.job.description && (
                    <div className="text-gray-500 text-xs mt-1">{preOpp.job.description}</div>
                  )}
                </div>
              ) : preOpp.jobId ? (
                <span className="text-gray-500">Job ID: {preOpp.jobId}</span>
              ) : (
                <span className="text-gray-400">No job associated</span>
              )}
            </div>
          )}
        </div>
        
        {/* Show additional job details when viewing (not editing) and job exists */}
        {!isEditing && preOpp.job && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
            {preOpp.job.startDate && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
                <div className="text-sm text-gray-600">{formatDate(preOpp.job.startDate)}</div>
              </div>
            )}
            {preOpp.job.endDate && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">End Date</label>
                <div className="text-sm text-gray-600">{formatDate(preOpp.job.endDate)}</div>
              </div>
            )}
            {preOpp.job.structuralInformation && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Structural Information</label>
                <div className="text-sm text-gray-600">{preOpp.job.structuralInformation}</div>
              </div>
            )}
            {preOpp.job.structuralDetails && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Structural Details</label>
                <div className="text-sm text-gray-600">{preOpp.job.structuralDetails}</div>
              </div>
            )}
            {preOpp.job.additionalInformation && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1">Additional Information</label>
                <div className="text-sm text-gray-600">{preOpp.job.additionalInformation}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Customer Reference</label>
            {isEditing ? (
              <input
                type="text"
                value={editFormData.customerRef}
                onChange={(e) => onChange('customerRef', e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter customer reference"
              />
            ) : (
              <div className="text-sm text-gray-900">{preOpp.customerRef || '-'}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Payment Terms</label>
            {isEditing ? (
              <input
                type="text"
                value={editFormData.paymentTerms}
                onChange={(e) => onChange('paymentTerms', e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Net 30"
              />
            ) : (
              <div className="text-sm text-gray-900">{preOpp.paymentTerms || '-'}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Freight Terms</label>
            {isEditing ? (
              <input
                type="text"
                value={editFormData.freightTerms}
                onChange={(e) => onChange('freightTerms', e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., FOB"
              />
            ) : (
              <div className="text-sm text-gray-900">{preOpp.freightTerms || '-'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
