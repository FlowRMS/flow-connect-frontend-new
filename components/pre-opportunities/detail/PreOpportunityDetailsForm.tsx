/**
 * Pre-Opportunity Details Form Component
 * Enhanced with Jobs-style styling and date pickers in edit mode
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { PreOpportunity, PreOpportunityStatus, JobSearchResult } from '../types';
import { formatDate } from '../utils';
import { formatLocalDate } from '../../lib/date-utils';
import { useCRMJobSearch } from '../../hooks/useCRMApi';
import { StyledDatePicker } from '../../shared/StyledDatePicker';
import { usePicklist } from '@/lib/picklists/usePicklist';
import { PicklistKey } from '@/lib/picklists/enums';

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
  customerRef: string;
  jobId: string;
  jobName: string;
}

// Styled Status Select with Portal
function StatusSelect({ 
  value, 
  onChange,
  disabled 
}: { 
  value: PreOpportunityStatus; 
  onChange: (value: PreOpportunityStatus) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { enabledItems, getItemByKey } = usePicklist(PicklistKey.PRE_OPPORTUNITY_STATUS);

  // Set portal target on mount
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Update position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 200; // approximate dropdown height
      
      // Position above if not enough space below
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setPosition({
          top: rect.top + window.scrollY - dropdownHeight - 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      } else {
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideTrigger = triggerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);
      
      if (!isInsideTrigger && !isInsideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = getItemByKey(value);

  if (disabled) {
    return (
      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 flex items-center gap-2">
        {selectedItem?.color && (
          <span 
            className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
            style={{ backgroundColor: selectedItem.color }}
          />
        )}
        <span className="text-gray-900">{selectedItem?.label || value}</span>
      </div>
    );
  }

  const dropdownContent = isOpen && portalTarget && createPortal(
    <div 
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      <div className="py-1">
        {enabledItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              onChange(item.key as PreOpportunityStatus);
              setIsOpen(false);
            }}
            className={`
              w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5
              transition-colors hover:bg-gray-50
              ${value === item.key ? 'bg-blue-50' : ''}
            `}
          >
            {item.color && (
              <span 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
            )}
            <span className={`${value === item.key ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
              {item.label}
            </span>
            {value === item.key && (
              <svg className="w-4 h-4 text-blue-600 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>,
    portalTarget
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-left
          flex items-center justify-between gap-2 transition-all
          hover:border-blue-300 hover:shadow-sm cursor-pointer
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedItem && (
            <div className="flex items-center gap-2">
              {selectedItem.color && (
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: selectedItem.color }}
                />
              )}
              <span className="text-gray-900">{selectedItem.label}</span>
            </div>
          )}
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdownContent}
    </div>
  );
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

  const inputBaseClass = `
    w-full px-4 py-3 border rounded-lg text-sm
    transition-all duration-200
    ${isEditing 
      ? 'border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400' 
      : 'border-gray-200 bg-gray-50 cursor-default'
    }
  `;

  const labelClass = "flex items-center gap-2 text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-5">
            {/* Entity Number - Read Only */}
            <div>
              <label className={labelClass}>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Entity Number
              </label>
              <div className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900 font-medium">
                {preOpp.entityNumber}
              </div>
            </div>

            {/* Entity Date - Read Only */}
            <div>
              <label className={labelClass}>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Entity Date
              </label>
              <div className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900">
                {formatDate(preOpp.entityDate)}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className={labelClass}>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Status
              </label>
              <StatusSelect 
                value={editFormData.status} 
                onChange={(value) => onChange('status', value)}
                disabled={!isEditing}
              />
            </div>

            {/* Expiration Date */}
            <div>
              <label className={labelClass}>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Expiration Date
              </label>
              <StyledDatePicker
                selected={editFormData.expDate ? new Date(editFormData.expDate + 'T00:00:00') : null}
                onChange={(date) => onChange('expDate', formatLocalDate(date))}
                placeholder="Select expiration date..."
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
