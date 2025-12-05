'use client';

import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  useCRMJobStatuses, 
  useCreateCRMJob,
} from './hooks/useCRMApi';
import { hasCRMTokens } from './lib/crm-auth';
import type { JobInput } from './lib/crm-graphql';
import { jobToasts } from './lib/toast';
import { formatLocalDate } from './lib/date-utils';

// Custom styled dropdown component
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; color?: string }[];
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

function CustomSelect({ value, onChange, options, placeholder, disabled, icon }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  // Status color mapping
  const getStatusColor = (label: string) => {
    const colors: Record<string, { bg: string; text: string; dot: string }> = {
      'Backlog': { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
      'Bidding': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      'Active': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
      'On Hold': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
      'Won': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    };
    return colors[label] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm bg-white text-left
          flex items-center justify-between gap-2 transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300 hover:shadow-sm cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.color && (
                <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(selectedOption.label).dot}`} />
              )}
              <span className="text-[var(--foreground)] truncate">{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-gray-400">{placeholder || 'Select...'}</span>
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

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => {
              const colors = getStatusColor(option.label);
              return (
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
                  {option.color && (
                    <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} flex-shrink-0`} />
                  )}
                  <span className={`${value === option.value ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
                    {option.label}
                  </span>
                  {value === option.value && (
                    <svg className="w-4 h-4 text-blue-600 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Styled wrapper for react-datepicker
interface StyledDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

function StyledDatePicker({ selected, onChange, placeholder }: StyledDatePickerProps) {
  return (
    <div className="styled-datepicker-wrapper">
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholder || 'Select date...'}
        dateFormat="MMM d, yyyy"
        className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 cursor-pointer"
        calendarClassName="styled-calendar"
        showPopperArrow={false}
        popperClassName="react-datepicker-popper-styled"
        popperPlacement="bottom-start"
        wrapperClassName="w-full"
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

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (jobId?: string) => void;
  defaultStatusName?: string;
}

export default function CreateJobModal({ isOpen, onClose, onSuccess, defaultStatusName }: CreateJobModalProps) {
  const [formData, setFormData] = useState({
    jobName: '',
    statusId: '',
    jobType: '',
    description: '',
    startDate: '',
    endDate: '',
    requesterId: '',
    jobOwnerId: '',
    structuralInformation: '',
    structuralDetails: '',
    additionalInformation: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'basic' | 'details' | 'additional' | 'connect'>('basic');

  const isConnected = hasCRMTokens();
  const { data: statuses, isLoading: statusesLoading, error: statusesError } = useCRMJobStatuses();
  const createJobMutation = useCreateCRMJob();

  // Set default status when statuses load or defaultStatusName changes
  useEffect(() => {
    if (statuses && statuses.length > 0) {
      // If a default status name is provided, find and select it
      if (defaultStatusName) {
        const matchingStatus = statuses.find(s => s.name.toLowerCase() === defaultStatusName.toLowerCase());
        if (matchingStatus) {
          setFormData(prev => ({ ...prev, statusId: matchingStatus.id }));
          return;
        }
      }
      // Otherwise use the first status as default
      if (!formData.statusId) {
        setFormData(prev => ({ ...prev, statusId: statuses[0].id }));
      }
    }
  }, [statuses, defaultStatusName, formData.statusId]);

  const buildJobInput = (): JobInput => {
    const optionalFields: (keyof typeof formData)[] = [
      'jobType', 'description', 'startDate', 'endDate', 
      'requesterId', 'jobOwnerId', 'structuralInformation', 
      'structuralDetails', 'additionalInformation'
    ];
    
    const optional = Object.fromEntries(
      optionalFields
        .filter(field => formData[field])
        .map(field => [field, formData[field]])
    );
    
    return {
      jobName: formData.jobName,
      statusId: formData.statusId,
      ...optional,
    };
  };

  const resetForm = () => {
    setFormData({
      jobName: '',
      statusId: statuses?.[0]?.id || '',
      jobType: '',
      description: '',
      startDate: '',
      endDate: '',
      requesterId: '',
      jobOwnerId: '',
      structuralInformation: '',
      structuralDetails: '',
      additionalInformation: '',
    });
    setActiveSection('basic');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.jobName.trim()) {
      setError('Job name is required');
      return;
    }

    if (!formData.statusId) {
      setError('Status is required');
      return;
    }

    try {
      await createJobMutation.mutateAsync(buildJobInput());
      jobToasts.createSuccess(formData.jobName);
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      jobToasts.createError(err instanceof Error ? err.message : undefined);
      setError(err instanceof Error ? err.message : 'Failed to create job');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // Section navigation
  const sections = [
    { id: 'basic', label: 'Basic Info', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'details', label: 'Details', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    { id: 'additional', label: 'Additional', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    )},
    { id: 'connect', label: 'Connect', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )},
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gray-50 px-6 py-5 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Create New Job</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Fill in the details to add a new job</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Section Tabs */}
          {isConnected && (
            <div className="flex gap-1 mt-4">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
                    ${activeSection === section.id 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {section.icon}
                  {section.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {!isConnected ? (
          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">CRM Not Connected</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please configure your CRM API tokens in the Auth page to create jobs.
                  </p>
                  <a
                    href="/crm-auth"
                    className="inline-block mt-2 text-sm font-medium text-yellow-800 hover:underline"
                  >
                    Go to Auth Settings →
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {statusesError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-700">Failed to load statuses: {statusesError.message}</span>
                </div>
              )}

              {/* Basic Info Section */}
              {activeSection === 'basic' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Job Name */}
                    <div className="col-span-2">
                      <label className="flex items-center gap-1 text-sm font-medium text-[var(--foreground)] mb-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Job Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="jobName"
                        value={formData.jobName}
                        onChange={handleChange}
                        placeholder="Enter a descriptive job name"
                        className="w-full px-4 py-3 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                        required
                        autoFocus
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-[var(--foreground)] mb-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Status <span className="text-red-500">*</span>
                      </label>
                      <CustomSelect
                        value={formData.statusId}
                        onChange={(value) => setFormData(prev => ({ ...prev, statusId: value }))}
                        options={statusesLoading 
                          ? [{ value: '', label: 'Loading statuses...' }]
                          : (statuses || []).map(status => ({ 
                              value: status.id, 
                              label: status.name,
                              color: 'status'
                            }))
                        }
                        placeholder="Select status..."
                        disabled={statusesLoading}
                      />
                    </div>

                    {/* Job Type */}
                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-[var(--foreground)] mb-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Job Type
                      </label>
                      <CustomSelect
                        value={formData.jobType}
                        onChange={(value) => setFormData(prev => ({ ...prev, jobType: value }))}
                        options={[
                          { value: '', label: 'Select type...' },
                          { value: 'Commercial', label: 'Commercial' },
                          { value: 'Residential', label: 'Residential' },
                          { value: 'Industrial', label: 'Industrial' },
                          { value: 'Government', label: 'Government' },
                          { value: 'Healthcare', label: 'Healthcare' },
                          { value: 'Education', label: 'Education' },
                        ]}
                        placeholder="Select type..."
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-[var(--foreground)] mb-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Provide a brief description of the job..."
                      rows={3}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder:text-gray-400"
                    />
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-[var(--foreground)] mb-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Start Date
                      </label>
                      <StyledDatePicker
                        selected={formData.startDate ? new Date(formData.startDate + 'T00:00:00') : null}
                        onChange={(date) => setFormData(prev => ({ 
                          ...prev, 
                          startDate: formatLocalDate(date) 
                        }))}
                        placeholder="Select start date..."
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-[var(--foreground)] mb-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        End Date
                      </label>
                      <StyledDatePicker
                        selected={formData.endDate ? new Date(formData.endDate + 'T00:00:00') : null}
                        onChange={(date) => setFormData(prev => ({ 
                          ...prev, 
                          endDate: formatLocalDate(date) 
                        }))}
                        placeholder="Select end date..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Details Section */}
              {activeSection === 'details' && (
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-[var(--foreground)] mb-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Structural Information
                    </label>
                    <textarea
                      name="structuralInformation"
                      value={formData.structuralInformation}
                      onChange={handleChange}
                      placeholder="Enter structural information about the project..."
                      rows={3}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-[var(--foreground)] mb-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Structural Details
                    </label>
                    <textarea
                      name="structuralDetails"
                      value={formData.structuralDetails}
                      onChange={handleChange}
                      placeholder="Enter specific structural details..."
                      rows={3}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>
              )}

              {/* Additional Section */}
              {activeSection === 'additional' && (
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-[var(--foreground)] mb-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Additional Information
                    </label>
                    <textarea
                      name="additionalInformation"
                      value={formData.additionalInformation}
                      onChange={handleChange}
                      placeholder="Enter any additional information or notes..."
                      rows={5}
                      className="w-full px-4 py-3 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">Tip</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          You can always add more details to the job after creation from the job detail view.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Connect Entities Section */}
              {activeSection === 'connect' && (
                <div className="space-y-5">
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Connect Entities</h3>
                    <p className="text-sm text-[var(--muted-foreground)] max-w-md mx-auto mb-6">
                      After creating the job, you&apos;ll be able to link it to other entities like companies, contacts, tasks, notes, quotes, orders, invoices, and checks.
                    </p>
                    
                    {/* Entity Types Grid Preview */}
                    <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                      {[
                        { name: 'Companies', icon: '🏢', color: 'bg-blue-100 text-blue-600' },
                        { name: 'Contacts', icon: '👤', color: 'bg-green-100 text-green-600' },
                        { name: 'Tasks', icon: '✓', color: 'bg-orange-100 text-orange-600' },
                        { name: 'Notes', icon: '📝', color: 'bg-yellow-100 text-yellow-600' },
                        { name: 'Pre-Opps', icon: '💡', color: 'bg-purple-100 text-purple-600' },
                        { name: 'Quotes', icon: '📄', color: 'bg-indigo-100 text-indigo-600' },
                        { name: 'Orders', icon: '🛒', color: 'bg-cyan-100 text-cyan-600' },
                        { name: 'Invoices', icon: '💳', color: 'bg-emerald-100 text-emerald-600' },
                        { name: 'Checks', icon: '✉️', color: 'bg-rose-100 text-rose-600' },
                      ].map((entity) => (
                        <div
                          key={entity.name}
                          className={`${entity.color} rounded-lg p-3 text-center`}
                        >
                          <span className="text-xl mb-1 block">{entity.icon}</span>
                          <span className="text-xs font-medium">{entity.name}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-left max-w-lg mx-auto">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-amber-800">How to Connect Entities</h4>
                          <p className="text-sm text-amber-700 mt-1">
                            1. Create the job by clicking &quot;Create Job&quot;<br />
                            2. Open the job details page<br />
                            3. Use the &quot;Add Link&quot; button to connect entities
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJobMutation.isPending || statusesLoading}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createJobMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Job
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
