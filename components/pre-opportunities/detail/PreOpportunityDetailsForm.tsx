/**
 * Pre-Opportunity Details Form Component
 * Enhanced with Jobs-style styling and date pickers in edit mode
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { PreOpportunity, PreOpportunityStatus, JobSearchResult } from '../types';
import { formatDate } from '../utils';
import { formatLocalDate } from '../../lib/date-utils';
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

// Status options and colors
const STATUS_OPTIONS: { value: PreOpportunityStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CONVERTED', label: 'Converted' },
];

const STATUS_COLORS: Record<PreOpportunityStatus, { bg: string; text: string; dot: string }> = {
  'DRAFT': { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  'PENDING': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'APPROVED': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'REJECTED': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'CONVERTED': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

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

  const selectedOption = STATUS_OPTIONS.find(opt => opt.value === value);

  if (disabled) {
    return (
      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[value].dot}`} />
        <span className="text-gray-900">{selectedOption?.label}</span>
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
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
            className={`
              w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5
              transition-colors hover:bg-gray-50
              ${value === option.value ? 'bg-blue-50' : ''}
            `}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[option.value].dot} flex-shrink-0`} />
            <span className={`${value === option.value ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
              {option.label}
            </span>
            {value === option.value && (
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
          {selectedOption && (
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[value].dot}`} />
              <span className="text-gray-900">{selectedOption.label}</span>
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

// Styled wrapper for react-datepicker
function StyledDatePicker({ 
  selected, 
  onChange, 
  placeholder,
  disabled 
}: { 
  selected: Date | null; 
  onChange: (date: Date | null) => void; 
  placeholder?: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-900">
        {selected ? selected.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
      </div>
    );
  }

  return (
    <div className="styled-datepicker-wrapper">
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholder || 'Select date...'}
        dateFormat="MMM d, yyyy"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 cursor-pointer"
        calendarClassName="styled-calendar"
        showPopperArrow={false}
        popperClassName="react-datepicker-popper-styled"
        popperPlacement="bottom-start"
        wrapperClassName="w-full"
        portalId="datepicker-portal"
      />
      <style jsx global>{`
        .styled-datepicker-wrapper {
          position: relative;
          width: 100%;
        }
        .styled-datepicker-wrapper .react-datepicker-wrapper {
          width: 100%;
        }
        .styled-datepicker-wrapper .react-datepicker__input-container {
          width: 100%;
        }
        .react-datepicker-popper-styled {
          z-index: 100 !important;
        }
        .react-datepicker {
          font-family: inherit !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          overflow: hidden;
        }
        .react-datepicker__header {
          background: linear-gradient(to bottom, #f9fafb, #f3f4f6) !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 12px !important;
          border-radius: 0 !important;
        }
        .react-datepicker__current-month {
          font-weight: 600 !important;
          font-size: 0.95rem !important;
          color: #111827 !important;
          margin-bottom: 8px !important;
        }
        .react-datepicker__day-names {
          margin-top: 4px !important;
        }
        .react-datepicker__day-name {
          color: #6b7280 !important;
          font-weight: 500 !important;
          font-size: 0.75rem !important;
          width: 2.2rem !important;
          margin: 0.15rem !important;
        }
        .react-datepicker__month {
          margin: 0.5rem !important;
        }
        .react-datepicker__day {
          width: 2.2rem !important;
          height: 2.2rem !important;
          line-height: 2.2rem !important;
          margin: 0.15rem !important;
          border-radius: 8px !important;
          font-size: 0.875rem !important;
          color: #374151 !important;
          transition: all 0.15s ease !important;
        }
        .react-datepicker__day:hover {
          background-color: #eff6ff !important;
          color: #2563eb !important;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #2563eb !important;
          color: white !important;
          font-weight: 600 !important;
        }
        .react-datepicker__day--selected:hover {
          background-color: #1d4ed8 !important;
        }
        .react-datepicker__day--today {
          font-weight: 600 !important;
          color: #2563eb !important;
        }
        .react-datepicker__day--today.react-datepicker__day--selected {
          color: white !important;
        }
        .react-datepicker__day--outside-month {
          color: #d1d5db !important;
        }
        .react-datepicker__navigation {
          top: 12px !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #6b7280 !important;
          border-width: 2px 2px 0 0 !important;
        }
        .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: #2563eb !important;
        }
        .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>
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
  const [isAdditionalDetailsOpen, setIsAdditionalDetailsOpen] = useState(false);
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
          <div className="grid grid-cols-4 gap-5">
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

            {/* Accept Date */}
            <div>
              <label className={labelClass}>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Accept Date
              </label>
              <StyledDatePicker
                selected={editFormData.acceptDate ? new Date(editFormData.acceptDate + 'T00:00:00') : null}
                onChange={(date) => onChange('acceptDate', formatLocalDate(date))}
                placeholder="Select accept date..."
                disabled={!isEditing}
              />
            </div>

            {/* Revise Date */}
            <div>
              <label className={labelClass}>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Revise Date
              </label>
              <StyledDatePicker
                selected={editFormData.reviseDate ? new Date(editFormData.reviseDate + 'T00:00:00') : null}
                onChange={(date) => onChange('reviseDate', formatLocalDate(date))}
                placeholder="Select revise date..."
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details Card - Collapsible */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <button
          type="button"
          onClick={() => setIsAdditionalDetailsOpen(!isAdditionalDetailsOpen)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Additional Details</h2>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isAdditionalDetailsOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isAdditionalDetailsOpen && (
          <div className="p-6">
            <div className="grid grid-cols-3 gap-5">
              {/* Customer Reference */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Customer Reference
                </label>
                <input
                  type="text"
                  value={editFormData.customerRef}
                  onChange={(e) => onChange('customerRef', e.target.value)}
                  className={inputBaseClass}
                  readOnly={!isEditing}
                  placeholder={isEditing ? "Enter customer reference" : "-"}
                />
              </div>
              
              {/* Payment Terms */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={editFormData.paymentTerms}
                  onChange={(e) => onChange('paymentTerms', e.target.value)}
                  className={inputBaseClass}
                  readOnly={!isEditing}
                  placeholder={isEditing ? "e.g., Net 30" : "-"}
                />
              </div>
              
              {/* Freight Terms */}
              <div>
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Freight Terms
                </label>
                <input
                  type="text"
                  value={editFormData.freightTerms}
                  onChange={(e) => onChange('freightTerms', e.target.value)}
                  className={inputBaseClass}
                  readOnly={!isEditing}
                  placeholder={isEditing ? "e.g., FOB" : "-"}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
