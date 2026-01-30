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
  tabIndex?: number;
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

/**
 * Auto-format date input as user types: MM/DD/YYYY
 * Automatically inserts "/" separators
 */
function autoFormatDateInput(value: string, previousValue: string): string {
  // Strip non-numeric characters
  const digits = value.replace(/\D/g, '');

  // Limit to 8 digits (MMDDYYYY)
  const limited = digits.slice(0, 8);

  // Build formatted string with auto-inserted slashes
  let formatted = '';
  for (let i = 0; i < limited.length; i++) {
    if (i === 2 || i === 4) {
      formatted += '/';
    }
    formatted += limited[i];
  }

  return formatted;
}

/**
 * Parse a MM/DD/YYYY string into a Date, returning null if invalid
 */
function parseDateInput(value: string): Date | null {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
  const date = new Date(year, month - 1, day);
  // Verify the date is valid (e.g., not Feb 30)
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

/**
 * Format a Date to MM/DD/YYYY for display in the input
 */
function formatDateForInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

export const StyledDatePicker: React.FC<StyledDatePickerProps> = ({
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
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [inputValue, setInputValue] = useState(selected ? formatDateForInput(selected) : '');
  const [isTyping, setIsTyping] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayPlaceholder = placeholderText || placeholder || 'Select date...';

  // Sync input value when selected prop changes (and user is not actively typing)
  useEffect(() => {
    if (!isTyping) {
      setInputValue(selected ? formatDateForInput(selected) : '');
    }
  }, [selected, isTyping]);

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
      const calendarWidth = 320; // Actual calendar width is around 300px

      // Calculate vertical position - above if not enough space below
      let top: number;
      if (spaceBelow < calendarHeight && rect.top > calendarHeight) {
        top = rect.top - calendarHeight - 4;
      } else {
        top = rect.bottom + 4;
      }

      // Calculate horizontal position - adjust if would go off right edge
      let left = rect.left;
      const spaceRight = window.innerWidth - rect.left;
      if (spaceRight < calendarWidth) {
        // Position so calendar doesn't go off screen - align right edge to viewport with padding
        left = window.innerWidth - calendarWidth - 16;
      }
      // Ensure we don't go off left edge either
      left = Math.max(8, left);

      setPosition({ top, left });
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

  const datePickerContent = isOpen && !disabled && portalTarget && position && createPortal(
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = autoFormatDateInput(e.target.value, inputValue);
    setInputValue(newValue);
    setIsTyping(true);

    // If complete date, parse and apply
    const parsed = parseDateInput(newValue);
    if (parsed) {
      onChange(parsed);
    }
  };

  const handleInputBlur = () => {
    setIsTyping(false);
    // If incomplete input, revert to selected date
    const parsed = parseDateInput(inputValue);
    if (!parsed && selected) {
      setInputValue(formatDateForInput(selected));
    } else if (!parsed && !selected) {
      setInputValue('');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseDateInput(inputValue);
      if (parsed) {
        onChange(parsed);
        setIsTyping(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsTyping(false);
      if (selected) {
        setInputValue(formatDateForInput(selected));
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`
          w-full px-4 py-3 border rounded-xl text-sm flex items-center justify-between
          transition-all duration-200
          ${disabled
            ? 'border-gray-200 bg-gray-50 cursor-default text-gray-500'
            : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-sm'
          }
          ${isOpen && !disabled ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''}
          ${className || ''}
        `}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsTyping(true)}
          placeholder={displayPlaceholder}
          disabled={disabled}
          tabIndex={disabled ? -1 : tabIndex}
          className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400"
        />
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          tabIndex={-1}
          className="ml-2 flex-shrink-0"
        >
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
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
