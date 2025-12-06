/**
 * Basic Information Section for Create Pre-Opportunity Modal
 * Enhanced with Jobs-style date pickers and improved styling
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { PreOpportunityStatus } from '../../types';
import { formatLocalDate } from '../../../lib/date-utils';

interface BasicInfoSectionProps {
  entityNumber: string;
  setEntityNumber: (value: string) => void;
  entityDate: string;
  setEntityDate: (value: string) => void;
  status: PreOpportunityStatus;
  setStatus: (value: PreOpportunityStatus) => void;
  expDate: string;
  setExpDate: (value: string) => void;
  reviseDate: string;
  setReviseDate: (value: string) => void;
  acceptDate: string;
  setAcceptDate: (value: string) => void;
}

// Status color mapping
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'QUALIFIED': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'NEGOTIATION': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'FOLLOW_UP': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'WAITING_ON_FACTORY': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'LOST': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'WON': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
};

// Custom styled status dropdown
function StatusSelect({ 
  value, 
  onChange 
}: { 
  value: PreOpportunityStatus; 
  onChange: (value: PreOpportunityStatus) => void 
}) {
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

  const options: { value: PreOpportunityStatus; label: string }[] = [
    { value: 'QUALIFIED', label: 'Qualified' },
    { value: 'NEGOTIATION', label: 'Negotiation' },
    { value: 'FOLLOW_UP', label: 'Follow Up' },
    { value: 'WAITING_ON_FACTORY', label: 'Waiting on Factory' },
    { value: 'LOST', label: 'Lost' },
    { value: 'WON', label: 'Won' },
  ];

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-left
          flex items-center justify-between gap-2 transition-all
          hover:border-blue-300 hover:shadow-sm cursor-pointer
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption ? (
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[value].dot}`} />
              <span className="text-gray-900">{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-gray-400">Select status...</span>
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="py-1">
            {options.map((option) => (
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
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 cursor-pointer"
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

export function BasicInfoSection({
  entityNumber,
  setEntityNumber,
  entityDate,
  setEntityDate,
  status,
  setStatus,
  expDate,
  setExpDate,
  reviseDate,
  setReviseDate,
  acceptDate,
  setAcceptDate,
}: BasicInfoSectionProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Basic Information
      </h3>

      <div className="space-y-5">
        {/* Row 1: Entity Number and Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Entity Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={entityNumber}
              onChange={(e) => setEntityNumber(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 transition-all"
              placeholder="PO-001"
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status <span className="text-red-500">*</span>
            </label>
            <StatusSelect value={status} onChange={setStatus} />
          </div>
        </div>

        {/* Row 2: Entity Date and Expiration Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Entity Date <span className="text-red-500">*</span>
            </label>
            <StyledDatePicker
              selected={entityDate ? new Date(entityDate + 'T00:00:00') : null}
              onChange={(date) => setEntityDate(formatLocalDate(date))}
              placeholder="Select entity date..."
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Expiration Date
            </label>
            <StyledDatePicker
              selected={expDate ? new Date(expDate + 'T00:00:00') : null}
              onChange={(date) => setExpDate(formatLocalDate(date))}
              placeholder="Select expiration date..."
            />
          </div>
        </div>

        {/* Row 3: Accept Date and Revise Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Accept Date
            </label>
            <StyledDatePicker
              selected={acceptDate ? new Date(acceptDate + 'T00:00:00') : null}
              onChange={(date) => setAcceptDate(formatLocalDate(date))}
              placeholder="Select accept date..."
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Revise Date
            </label>
            <StyledDatePicker
              selected={reviseDate ? new Date(reviseDate + 'T00:00:00') : null}
              onChange={(date) => setReviseDate(formatLocalDate(date))}
              placeholder="Select revise date..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
