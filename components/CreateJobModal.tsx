'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  useCRMJobStatuses,
  useCreateCRMJob,
} from './hooks/useCRMApi';

import type { JobInput } from './lib/crm-graphql';
import { jobToasts } from './lib/toast';
import { formatLocalDate } from './lib/date-utils';
import { StyledDatePicker } from './shared/StyledDatePicker';

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
  });
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'basic' | 'connect'>('basic');

  const isConnected = true;
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
      'requesterId', 'jobOwnerId'
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

    // Validate end date is not before start date
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate < startDate) {
        setError('End date cannot be before start date');
        return;
      }
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
    { id: 'connect', label: 'Connect', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )},
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={handleClose}>
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden" onClick={(e) => { e.stopPropagation(); }}>
        {/* Header */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Create New Job</h2>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] hidden sm:block">Fill in the details to add a new job</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-5 sm:h-5">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Section Tabs */}
          {isConnected && (
            <div className="flex gap-1 mt-3 sm:mt-4 overflow-x-auto">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all whitespace-nowrap
                    ${activeSection === section.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {section.icon}
                  <span className="hidden sm:inline">{section.label}</span>
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
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-200px)]">
            <div className="p-4 sm:p-6">
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
                <div className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Job Name */}
                    <div className="col-span-1 sm:col-span-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
            <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border)] flex items-center justify-between">
              <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJobMutation.isPending || statusesLoading}
                  className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createJobMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className="hidden sm:inline">Creating...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">Create Job</span>
                      <span className="sm:hidden">Create</span>
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
