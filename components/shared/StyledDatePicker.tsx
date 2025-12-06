/**
 * Shared Styled DatePicker Component
 * Uses react-datepicker with custom styling and portal rendering
 * This component should be used across the entire application for consistency
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface StyledDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  placeholder?: string; // alias for placeholderText
  disabled?: boolean;
  className?: string;
}

/**
 * Format date consistently to avoid hydration mismatches
 * Uses local date formatting to ensure server and client produce the same output
 */
function formatDateSafe(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export const StyledDatePicker: React.FC<StyledDatePickerProps> = ({
  selected,
  onChange,
  placeholderText,
  placeholder,
  disabled,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const displayPlaceholder = placeholderText || placeholder || 'Select date...';

  // Set portal target and mounted state on client
  useEffect(() => {
    setPortalTarget(document.body);
    setIsMounted(true);
  }, []);

  // Update position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const calendarHeight = 320;

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
      const isInsidePortal = (target as HTMLElement).closest?.('.shared-datepicker-portal');

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
      className="shared-datepicker-portal fixed z-[9999]"
      style={{ top: position.top, left: position.left }}
    >
      <style>{`
        .shared-datepicker-portal .react-datepicker {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .shared-datepicker-portal .react-datepicker__header {
          background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
          border-bottom: 1px solid #e5e7eb;
          padding: 12px;
          border-radius: 0;
        }
        .shared-datepicker-portal .react-datepicker__current-month {
          font-weight: 600;
          font-size: 0.95rem;
          color: #111827;
          margin-bottom: 8px;
        }
        .shared-datepicker-portal .react-datepicker__day-names {
          margin-top: 4px;
        }
        .shared-datepicker-portal .react-datepicker__day-name {
          color: #6b7280;
          font-weight: 500;
          font-size: 0.75rem;
          width: 2.2rem;
          line-height: 2.2rem;
          margin: 0.15rem;
        }
        .shared-datepicker-portal .react-datepicker__month {
          margin: 0.5rem;
          background: white;
        }
        .shared-datepicker-portal .react-datepicker__day {
          width: 2.2rem;
          height: 2.2rem;
          line-height: 2.2rem;
          margin: 0.15rem;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #374151;
          transition: all 0.15s ease;
        }
        .shared-datepicker-portal .react-datepicker__day:hover {
          background-color: #eff6ff;
          color: #2563eb;
        }
        .shared-datepicker-portal .react-datepicker__day--selected,
        .shared-datepicker-portal .react-datepicker__day--keyboard-selected {
          background-color: #2563eb !important;
          color: white !important;
          font-weight: 600;
        }
        .shared-datepicker-portal .react-datepicker__day--selected:hover {
          background-color: #1d4ed8 !important;
        }
        .shared-datepicker-portal .react-datepicker__day--today {
          font-weight: 600;
          color: #2563eb;
          background-color: #eff6ff;
        }
        .shared-datepicker-portal .react-datepicker__day--today.react-datepicker__day--selected {
          color: white;
        }
        .shared-datepicker-portal .react-datepicker__day--outside-month {
          color: #d1d5db;
        }
        .shared-datepicker-portal .react-datepicker__navigation {
          top: 12px;
        }
        .shared-datepicker-portal .react-datepicker__navigation-icon::before {
          border-color: #6b7280;
          border-width: 2px 2px 0 0;
        }
        .shared-datepicker-portal .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: #2563eb;
        }
        .shared-datepicker-portal .react-datepicker__triangle {
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
          w-full px-4 py-3 border rounded-xl text-sm flex items-center justify-between
          transition-all duration-200
          ${disabled
            ? 'border-gray-200 bg-gray-50 cursor-default text-gray-500'
            : 'border-gray-300 bg-white cursor-pointer hover:border-blue-300 hover:shadow-sm'
          }
          ${isOpen && !disabled ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''}
          ${className || ''}
        `}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {isMounted && selected ? formatDateSafe(selected) : displayPlaceholder}
        </span>
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      {datePickerContent}
    </div>
  );
};

/**
 * Helper function to parse date string to Date object
 */
export function parseDateString(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  // Handle YYYY-MM-DD format by creating date at midnight local time
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const date = new Date(dateStr + 'T00:00:00');
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Helper function to format Date to YYYY-MM-DD string
 */
export function formatDateToString(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default StyledDatePicker;
