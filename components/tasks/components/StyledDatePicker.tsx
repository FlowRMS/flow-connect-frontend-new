/**
 * Styled DatePicker Component for Tasks
 * Uses react-datepicker with custom styling and portal rendering
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
  disabled?: boolean;
  className?: string;
}

/**
 * Format date consistently to avoid hydration mismatches
 * Uses UTC-based formatting to ensure server and client produce the same output
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
  disabled,
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Set portal target and mounted state on client
  useEffect(() => {
    setPortalTarget(document.body);
    setIsMounted(true);
  }, []);

  // Calculate position based on trigger element
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const calendarHeight = 320;

      // Position above if not enough space below
      if (spaceBelow < calendarHeight && rect.top > calendarHeight) {
        setPosition({
          top: rect.top - calendarHeight - 4,
          left: rect.left,
        });
      } else {
        setPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
    }
  };

  // Update position when opening
  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    // Listen to scroll on all scrollable ancestors
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // Close datepicker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideWrapper = wrapperRef.current?.contains(target);
      const isInsidePortal = (target as HTMLElement).closest?.('.task-datepicker-portal');
      
      if (!isInsideWrapper && !isInsidePortal) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const datePickerContent = isOpen && !disabled && portalTarget && position && createPortal(
    <div
      className="task-datepicker-portal fixed z-[9999]"
      style={{ top: position.top, left: position.left }}
    >
      <style>{`
        .task-datepicker-portal .react-datepicker {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .task-datepicker-portal .react-datepicker__header {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-bottom: none;
          padding: 16px;
          border-radius: 0;
        }
        .task-datepicker-portal .react-datepicker__current-month {
          color: white;
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 8px;
        }
        .task-datepicker-portal .react-datepicker__day-names {
          margin-top: 8px;
        }
        .task-datepicker-portal .react-datepicker__day-name {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          width: 36px;
          line-height: 36px;
          margin: 2px;
        }
        .task-datepicker-portal .react-datepicker__month {
          margin: 12px;
          background: white;
        }
        .task-datepicker-portal .react-datepicker__day {
          width: 36px;
          line-height: 36px;
          margin: 2px;
          border-radius: 8px;
          color: #374151;
          transition: all 0.15s ease;
        }
        .task-datepicker-portal .react-datepicker__day:hover {
          background-color: #eff6ff;
          color: #2563eb;
        }
        .task-datepicker-portal .react-datepicker__day--selected,
        .task-datepicker-portal .react-datepicker__day--keyboard-selected {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          color: white !important;
          font-weight: 600;
        }
        .task-datepicker-portal .react-datepicker__day--today {
          font-weight: 600;
          color: #2563eb;
          background-color: #eff6ff;
        }
        .task-datepicker-portal .react-datepicker__day--outside-month {
          color: #d1d5db;
        }
        .task-datepicker-portal .react-datepicker__navigation {
          top: 18px;
        }
        .task-datepicker-portal .react-datepicker__navigation-icon::before {
          border-color: white;
        }
        .task-datepicker-portal .react-datepicker__navigation:hover *::before {
          border-color: rgba(255, 255, 255, 0.7);
        }
        .task-datepicker-portal .react-datepicker__triangle {
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
          ${className || ''}
        `}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {isMounted && selected ? formatDateSafe(selected) : placeholderText || 'Select date...'}
        </span>
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Helper function to format Date to YYYY-MM-DD string
 * Uses local timezone to avoid date shifting issues
 */
export function formatDateToString(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default StyledDatePicker;
