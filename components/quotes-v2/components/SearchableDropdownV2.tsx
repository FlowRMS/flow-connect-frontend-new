'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Option {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableDropdownV2Props {
  value: string;
  displayValue?: string;
  onChange: (id: string, label: string) => void;
  options: Option[];
  placeholder?: string;
  isLoading?: boolean;
  onSearch?: (query: string) => void;
  disabled?: boolean;
  className?: string;
  tabIndex?: number;
}

export function SearchableDropdownV2({
  value,
  displayValue,
  onChange,
  options,
  placeholder = 'Select...',
  isLoading = false,
  onSearch,
  disabled = false,
  className = '',
  tabIndex = 0,
}: SearchableDropdownV2Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const dropdown = document.querySelector('.searchable-dropdown-portal');
        if (dropdown && !dropdown.contains(e.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalculate position when dropdown content changes or window scrolls/resizes
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 250; // Approximate max height (search input + options list)
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const width = Math.max(rect.width, 200);

      // Position above if not enough space below
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        // Position above
        const availableHeight = Math.min(spaceAbove - 8, dropdownHeight);
        setDropdownPosition({
          top: rect.top - availableHeight - 4,
          left: rect.left,
          width,
          maxHeight: availableHeight,
        });
      } else {
        // Position below
        const availableHeight = Math.min(spaceBelow - 8, dropdownHeight);
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width,
          maxHeight: availableHeight,
        });
      }
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    if (disabled || isOpen) return;

    setIsOpen(true);
    setSearchQuery('');
    setHighlightedIndex(-1);
    if (onSearch) {
      onSearch('');
    }
    // Use requestAnimationFrame for more reliable focus timing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    });
  }, [disabled, onSearch, isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  }, []);

  // Helper to find and focus next form element
  const focusNextElement = useCallback(() => {
    const focusableSelector = 'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex="0"]:not([disabled])';
    const focusableElements = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector));
    const currentIndex = focusableElements.findIndex(el => el === buttonRef.current);
    if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1]?.focus();
    }
  }, []);

  // Handle blur on search input - close dropdown if focus leaves the component
  const handleInputBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Check if focus is moving to an element within the dropdown
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const isWithinDropdown = relatedTarget && (
      containerRef.current?.contains(relatedTarget) ||
      dropdownRef.current?.contains(relatedTarget)
    );

    if (!isWithinDropdown) {
      // Small delay to allow click events on options to fire first
      setTimeout(() => {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }, 100);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setHighlightedIndex(-1);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleSelect = useCallback((option: Option) => {
    onChange(option.id, option.label);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    // Move focus to next focusable element after selection
    setTimeout(() => {
      const focusableElements = document.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      );
      const currentIndex = Array.from(focusableElements).findIndex(el => el === buttonRef.current);
      if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
        focusableElements[currentIndex + 1]?.focus();
      }
    }, 0);
  }, [onChange]);

  // Handle keyboard navigation on the trigger button
  const handleButtonKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleOpen();
    }
  }, [disabled, handleOpen]);

  // Auto-open dropdown when button receives focus (e.g., via Tab)
  const handleButtonFocus = useCallback(() => {
    if (disabled) return;
    handleOpen();
  }, [disabled, handleOpen]);

  // Handle keyboard navigation in the search input
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentOptions = onSearch
      ? options
      : options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opt.sublabel?.toLowerCase().includes(searchQuery.toLowerCase())
        );

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < currentOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < currentOptions.length) {
          handleSelect(currentOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'Tab':
        // Close dropdown and explicitly move to next form field
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        // Move focus to next focusable element immediately
        focusNextElement();
        break;
    }
  }, [onSearch, options, searchQuery, highlightedIndex, handleSelect, handleClose, focusNextElement]);

  const filteredOptions = onSearch
    ? options
    : options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.sublabel?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const display = displayValue || (value ? options.find((o) => o.id === value)?.label : null) || placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        onKeyDown={handleButtonKeyDown}
        onFocus={handleButtonFocus}
        disabled={disabled}
        tabIndex={disabled ? -1 : tabIndex}
        className={`w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md text-sm flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
          disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span className={`truncate ${!value && !displayValue ? 'text-gray-400' : 'text-gray-900'}`}>
          {display}
        </span>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400 flex-shrink-0">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen &&
        dropdownPosition &&
        createPortal(
          <div
            ref={dropdownRef}
            className="searchable-dropdown-portal fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] flex flex-col"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: dropdownPosition.maxHeight,
            }}
          >
            <div className="p-2 border-b border-gray-100 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                placeholder="Search..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoading && (
                <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
              )}
              {!isLoading && filteredOptions.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
              )}
              {!isLoading &&
                filteredOptions.map((option, index) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    tabIndex={-1}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      value === option.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-900'
                    } ${highlightedIndex === index ? 'bg-gray-100' : ''}`}
                  >
                    <div className="font-medium">{option.label}</div>
                    {option.sublabel && (
                      <div className="text-xs text-gray-500 truncate">{option.sublabel}</div>
                    )}
                  </button>
                ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default SearchableDropdownV2;
