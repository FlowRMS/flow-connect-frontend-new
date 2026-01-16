/**
 * Shared Styled MonthPicker Component
 * Uses react-datepicker with custom styling for month/year selection only
 * This component should be used across the entire application for consistency
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface StyledMonthPickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  tabIndex?: number;
}

/**
 * Format month consistently to avoid hydration mismatches
 */
function formatMonthSafe(date: Date): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
}

export const StyledMonthPicker: React.FC<StyledMonthPickerProps> = ({
  selected,
  onChange,
  placeholderText,
  placeholder,
  disabled,
  className,
  tabIndex = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const displayPlaceholder = placeholderText || placeholder || 'Select month...';

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
      const calendarHeight = 280;

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
      const isInsidePortal = (target as HTMLElement).closest?.('.shared-monthpicker-portal');

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
      className="shared-monthpicker-portal fixed z-[9999]"
      style={{ top: position.top, left: position.left }}
    >
      <style>{`
        .shared-monthpicker-portal .react-datepicker {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .shared-monthpicker-portal .react-datepicker__header {
          background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
          border-bottom: 1px solid #e5e7eb;
          padding: 12px;
          border-radius: 0;
        }
        .shared-monthpicker-portal .react-datepicker__current-month {
          font-weight: 600;
          font-size: 0.95rem;
          color: #111827;
        }
        .shared-monthpicker-portal .react-datepicker__month-wrapper {
          display: flex;
          flex-wrap: wrap;
        }
        .shared-monthpicker-portal .react-datepicker__month .react-datepicker__month-text {
          width: 4rem;
          height: 2.5rem;
          line-height: 2.5rem;
          margin: 0.25rem;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #374151;
          transition: all 0.15s ease;
        }
        .shared-monthpicker-portal .react-datepicker__month .react-datepicker__month-text:hover {
          background-color: #eff6ff;
          color: #2563eb;
        }
        .shared-monthpicker-portal .react-datepicker__month--selected,
        .shared-monthpicker-portal .react-datepicker__month-text--keyboard-selected {
          background-color: #2563eb !important;
          color: white !important;
          font-weight: 600;
        }
        .shared-monthpicker-portal .react-datepicker__month--selected:hover {
          background-color: #1d4ed8 !important;
        }
        .shared-monthpicker-portal .react-datepicker__navigation {
          top: 12px;
        }
        .shared-monthpicker-portal .react-datepicker__navigation-icon::before {
          border-color: #6b7280;
          border-width: 2px 2px 0 0;
        }
        .shared-monthpicker-portal .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: #2563eb;
        }
        .shared-monthpicker-portal .react-datepicker__triangle {
          display: none;
        }
      `}</style>
      <DatePicker
        selected={selected}
        onChange={(date) => {
          onChange(date);
          setIsOpen(false);
          // Move focus to next focusable element after selection
          setTimeout(() => {
            const focusableElements = document.querySelectorAll<HTMLElement>(
              'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
            );
            const currentIndex = Array.from(focusableElements).findIndex(el => el === triggerRef.current);
            if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
              focusableElements[currentIndex + 1]?.focus();
            }
          }, 0);
        }}
        inline
        showMonthYearPicker
        calendarClassName="shadow-xl"
      />
    </div>,
    portalTarget
  );

  // Handle keyboard events on the trigger button
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        // Close if open and let natural tab behavior continue
        if (isOpen) {
          setIsOpen(false);
        }
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        tabIndex={disabled ? -1 : tabIndex}
        className={`
          w-full px-4 py-3 border rounded-xl text-sm flex items-center justify-between
          transition-all duration-200 text-left
          ${disabled
            ? 'border-gray-200 bg-gray-50 cursor-default text-gray-500'
            : 'border-gray-300 bg-white cursor-pointer hover:border-blue-300 hover:shadow-sm'
          }
          ${isOpen && !disabled ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''}
          ${className || ''}
        `}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {isMounted && selected ? formatMonthSafe(selected) : displayPlaceholder}
        </span>
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      {datePickerContent}
    </div>
  );
};

/**
 * Helper function to parse YYYY-MM string to Date object
 */
export function parseMonthString(monthStr: string | undefined | null): Date | null {
  if (!monthStr) return null;
  // Handle YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(monthStr)) {
    const date = new Date(monthStr + '-01T00:00:00');
    return isNaN(date.getTime()) ? null : date;
  }
  // Handle YYYY-MM-DD format (API response)
  if (/^\d{4}-\d{2}-\d{2}$/.test(monthStr)) {
    const date = new Date(monthStr + 'T00:00:00');
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(monthStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Helper function to format Date to YYYY-MM string
 */
export function formatMonthToString(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default StyledMonthPicker;
