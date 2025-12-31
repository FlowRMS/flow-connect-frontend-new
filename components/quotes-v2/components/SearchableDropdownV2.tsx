'use client';

import React, { useState, useRef, useEffect } from 'react';
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
}: SearchableDropdownV2Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const handleOpen = () => {
    if (disabled) return;

    setIsOpen(true);
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleSelect = (option: Option) => {
    onChange(option.id, option.label);
    setIsOpen(false);
    setSearchQuery('');
  };

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
        type="button"
        onClick={handleOpen}
        disabled={disabled}
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
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      value === option.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-900'
                    }`}
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
