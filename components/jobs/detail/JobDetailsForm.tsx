/**
 * Job Details Form Component
 * Enhanced with styled date pickers, better layout, icons, and visual hierarchy
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { Job } from '../types';
import { formatLocalDate, parseLocalDate } from '../../lib/date-utils';
import { TagsEditor } from './TagsEditor';

// Styled DatePicker wrapper with custom styles using Portal
const StyledDatePicker: React.FC<{
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  disabled?: boolean;
}> = ({ selected, onChange, placeholderText, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Set portal target on mount
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Update position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const calendarHeight = 320; // approximate calendar height
      
      // Position above if not enough space below
      if (spaceBelow < calendarHeight && rect.top > calendarHeight) {
        setPosition({
          top: rect.top + window.scrollY - calendarHeight - 4,
          left: rect.left + window.scrollX,
        });
      } else {
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
      }
    }
  }, [isOpen]);

  // Close datepicker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideWrapper = wrapperRef.current?.contains(target);
      const isInsidePortal = (target as HTMLElement).closest?.('.job-detail-datepicker-portal');
      
      if (!isInsideWrapper && !isInsidePortal) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const datePickerContent = isOpen && !disabled && portalTarget && createPortal(
    <div 
      className="job-detail-datepicker-portal fixed z-[9999]"
      style={{ top: position.top, left: position.left }}
    >
      <style>{`
        .job-detail-datepicker-portal .react-datepicker {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .job-detail-datepicker-portal .react-datepicker__header {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-bottom: none;
          padding: 16px;
          border-radius: 0;
        }
        .job-detail-datepicker-portal .react-datepicker__current-month {
          color: white;
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 8px;
        }
        .job-detail-datepicker-portal .react-datepicker__day-names {
          margin-top: 8px;
        }
        .job-detail-datepicker-portal .react-datepicker__day-name {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          width: 36px;
          line-height: 36px;
          margin: 2px;
        }
        .job-detail-datepicker-portal .react-datepicker__month {
          margin: 12px;
          background: white;
        }
        .job-detail-datepicker-portal .react-datepicker__day {
          width: 36px;
          line-height: 36px;
          margin: 2px;
          border-radius: 8px;
          color: #374151;
          transition: all 0.15s ease;
        }
        .job-detail-datepicker-portal .react-datepicker__day:hover {
          background-color: #eff6ff;
          color: #2563eb;
        }
        .job-detail-datepicker-portal .react-datepicker__day--selected,
        .job-detail-datepicker-portal .react-datepicker__day--keyboard-selected {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          color: white !important;
          font-weight: 600;
        }
        .job-detail-datepicker-portal .react-datepicker__day--today {
          font-weight: 600;
          color: #2563eb;
          background-color: #eff6ff;
        }
        .job-detail-datepicker-portal .react-datepicker__day--outside-month {
          color: #d1d5db;
        }
        .job-detail-datepicker-portal .react-datepicker__navigation {
          top: 18px;
        }
        .job-detail-datepicker-portal .react-datepicker__navigation-icon::before {
          border-color: white;
        }
        .job-detail-datepicker-portal .react-datepicker__navigation:hover *::before {
          border-color: rgba(255, 255, 255, 0.7);
        }
        .job-detail-datepicker-portal .react-datepicker__triangle {
          display: none;
        }
      `}</style>
      <DatePicker
        selected={selected}
        onChange={(date) => {
          onChange(date);
          setIsOpen(false);
        }}
        inline
        calendarClassName="shadow-xl"
      />
    </div>,
    portalTarget
  );

  return (
    <div ref={wrapperRef} className="relative">
      <div
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 border rounded-lg text-sm flex items-center justify-between
          transition-all duration-200
          ${disabled
            ? 'border-gray-200 bg-gray-50 cursor-default text-gray-500'
            : 'border-gray-300 bg-white cursor-pointer hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          }
        `}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : placeholderText || 'Select date...'}
        </span>
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      {datePickerContent}
    </div>
  );
};

interface JobDetailsFormProps {
  job: Job;
  isEditing: boolean;
  editFormData: Partial<Job>;
  onChange: (field: keyof Job, value: string) => void;
}

// Field configuration for consistent styling
interface FieldConfig {
  field: keyof Job;
  label: string;
  icon: React.ReactNode;
  type?: 'text' | 'date' | 'textarea';
  colSpan?: number;
  placeholder?: string;
}

export function JobDetailsForm({ job, isEditing, editFormData, onChange }: JobDetailsFormProps) {
  const handleChange = (field: keyof Job) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(field, e.target.value);
  };

  const handleDateChange = (field: keyof Job) => (date: Date | null) => {
    onChange(field, formatLocalDate(date));
  };

  const handleTagsChange = (tags: string[]) => {
    onChange('tags', JSON.stringify(tags));
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

  // Field configurations (non-date fields)
  const textFields: FieldConfig[] = [
    { 
      field: 'name', 
      label: 'Job Name', 
      colSpan: 2,
      icon: <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
    },
    { 
      field: 'type', 
      label: 'Job Type',
      icon: <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    },
    { 
      field: 'value', 
      label: 'Value',
      icon: <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
  ];

  // Date field configurations
  const dateFields: FieldConfig[] = [
    { 
      field: 'startDate', 
      label: 'Start Date', 
      type: 'date',
      icon: <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
    { 
      field: 'endDate', 
      label: 'End Date', 
      type: 'date',
      icon: <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
  ];

  // Contractor fields
  const contractorFields: FieldConfig[] = [
    { 
      field: 'gc', 
      label: 'General Contractor',
      icon: <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    },
    { 
      field: 'ec', 
      label: 'Electrical Contractor',
      icon: <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      {/* Section Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Job Details</h2>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <div className="grid grid-cols-4 gap-5">
          {/* Text Fields */}
          {textFields.map((fieldConfig) => {
            const value = isEditing 
              ? editFormData[fieldConfig.field] || '' 
              : job[fieldConfig.field];

            return (
              <div key={fieldConfig.field} className={fieldConfig.colSpan === 2 ? 'col-span-2' : 'col-span-1'}>
                <label className={labelClass}>
                  {fieldConfig.icon}
                  {fieldConfig.label}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={handleChange(fieldConfig.field)}
                  className={inputBaseClass}
                  readOnly={!isEditing}
                  placeholder={fieldConfig.placeholder}
                />
              </div>
            );
          })}

          {/* Date Fields with Styled DatePicker */}
          {dateFields.map((fieldConfig) => {
            const rawValue = isEditing 
              ? editFormData[fieldConfig.field] || '' 
              : job[fieldConfig.field];
            const dateValue = parseLocalDate(rawValue as string);

            return (
              <div key={fieldConfig.field} className="col-span-1">
                <label className={labelClass}>
                  {fieldConfig.icon}
                  {fieldConfig.label}
                </label>
                {isEditing ? (
                  <StyledDatePicker
                    selected={dateValue}
                    onChange={handleDateChange(fieldConfig.field)}
                    placeholderText="Select date..."
                    disabled={false}
                  />
                ) : (
                  <input
                    type="text"
                    value={rawValue || '-'}
                    className={inputBaseClass}
                    readOnly
                  />
                )}
              </div>
            );
          })}

          {/* Contractor Fields */}
          {contractorFields.map((fieldConfig) => {
            const value = isEditing 
              ? editFormData[fieldConfig.field] || '' 
              : job[fieldConfig.field];

            return (
              <div key={fieldConfig.field} className="col-span-1">
                <label className={labelClass}>
                  {fieldConfig.icon}
                  {fieldConfig.label}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={handleChange(fieldConfig.field)}
                  className={inputBaseClass}
                  readOnly={!isEditing}
                  placeholder={fieldConfig.placeholder}
                />
              </div>
            );
          })}
        </div>

        {/* Description - Full Width */}
        <div className="mt-5">
          <label className={labelClass}>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Description
          </label>
          <textarea
            value={isEditing ? editFormData.description || '' : job.description}
            onChange={handleChange('description')}
            rows={4}
            className={`${inputBaseClass} resize-none`}
            readOnly={!isEditing}
            placeholder={isEditing ? "Enter job description..." : "No description"}
          />
        </div>

        {/* Tags Section */}
        <div className="mt-5">
          <label className={labelClass}>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tags
          </label>
          <TagsEditor
            tags={isEditing ? (editFormData.tags || []) : job.tags}
            isEditing={isEditing}
            onChange={handleTagsChange}
          />
        </div>
      </div>
    </div>
  );
}
