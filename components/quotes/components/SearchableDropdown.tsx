'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface DropdownOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableDropdownProps {
  value: string;
  onChange: (id: string, label: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  options: DropdownOption[];
  isLoading?: boolean;
  onSearch: (searchTerm: string) => void;
  className?: string;
}

export function SearchableDropdown({
  value,
  onChange,
  placeholder = 'Search...',
  label,
  required = false,
  disabled = false,
  options,
  isLoading = false,
  onSearch,
  className = '',
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the display value from options when value changes
  useEffect(() => {
    if (value) {
      const selectedOption = options.find(opt => opt.id === value);
      if (selectedOption) {
        setDisplayValue(selectedOption.label);
      }
    } else {
      setDisplayValue('');
    }
  }, [value, options]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle opening the dropdown - trigger search with empty string
  const handleOpen = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setSearchTerm('');
    onSearch(''); // Trigger search with empty string to get initial results
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled, onSearch]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    setSearchTerm(newTerm);
    onSearch(newTerm);
  }, [onSearch]);

  // Handle option selection
  const handleSelect = useCallback((option: DropdownOption) => {
    onChange(option.id, option.label);
    setDisplayValue(option.label);
    setIsOpen(false);
    setSearchTerm('');
  }, [onChange]);

  // Handle clear
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '');
    setDisplayValue('');
    setSearchTerm('');
  }, [onChange]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
          {label}{required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Display/Trigger */}
      <div
        onClick={handleOpen}
        className={`w-full px-3 py-2 bg-white border border-[var(--border)] rounded-md text-sm flex items-center justify-between cursor-pointer ${
          disabled ? 'bg-[var(--muted)]/30 text-[var(--muted-foreground)] cursor-not-allowed' : 'hover:border-[var(--primary)]'
        } ${isOpen ? 'ring-2 ring-[var(--primary)] border-transparent' : ''}`}
      >
        <span className={displayValue ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}>
          {displayValue || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {displayValue && !disabled && (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-[var(--muted)] rounded"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--border)] rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-[var(--border)]">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Type to search..."
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full mr-2" />
                Loading...
              </div>
            ) : options.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-[var(--muted-foreground)]">
                {searchTerm ? 'No results found' : 'Start typing to search'}
              </div>
            ) : (
              options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className={`px-3 py-2 cursor-pointer hover:bg-[var(--muted)] ${
                    option.id === value ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                  }`}
                >
                  <div className="text-sm font-medium">{option.label}</div>
                  {option.sublabel && (
                    <div className="text-xs text-[var(--muted-foreground)]">{option.sublabel}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
