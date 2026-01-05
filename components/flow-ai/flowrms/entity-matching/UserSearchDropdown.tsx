'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Loader2, Check, X } from 'lucide-react';
import { Input } from '@/components/flow-ai/ui/input';
import { cn } from '@/lib/flow-ai/cn';

export interface UserResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

interface UserSearchDropdownProps {
  /** Label for the dropdown */
  label?: string;
  /** Currently selected user ID */
  selectedUserId: string | null;
  /** Currently selected user name for display */
  selectedUserName: string | null;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Callback when a user is selected */
  onSelect: (userId: string | null, user: UserResult | null) => void;
  /** Callback to search for users - receives search query, returns results */
  onSearch: (query: string) => Promise<UserResult[]>;
  /** Compact mode - hides label and uses smaller styling */
  compact?: boolean;
}

export function UserSearchDropdown({
  label,
  selectedUserId,
  selectedUserName,
  required = false,
  disabled = false,
  placeholder = 'Search users...',
  onSelect,
  onSearch,
  compact = false,
}: UserSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const results = await onSearch(query);
      setSearchResults(results);
    } catch (error) {
      console.error('User search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [onSearch]);

  // Handle search input change with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Trigger search on every keystroke (empty string returns some records)
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 150);
  };

  // Toggle dropdown open/close
  const handleToggle = () => {
    if (disabled) return;

    if (isOpen) {
      setIsOpen(false);
      setSearchQuery('');
    } else {
      setIsOpen(true);
      // Trigger initial search with empty string to get default results
      performSearch('');
    }
  };

  // Handle selection
  const handleSelect = (user: UserResult) => {
    onSelect(user.id, user);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null, null);
  };

  // Get display text for trigger
  const displayText = selectedUserName || placeholder;

  return (
    <div className={compact ? '' : 'space-y-1.5'}>
      {!compact && label && (
        <label className="text-xs font-medium">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            'flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !selectedUserId && 'text-muted-foreground'
          )}
        >
          <span className="truncate text-left">{displayText}</span>
          <div className="flex items-center gap-1">
            {selectedUserId && !disabled && (
              <X
                className="h-3 w-3 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={handleClear}
              />
            )}
            <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')} />
          </div>
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
            {/* Search Input */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Type to search..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-7 h-7 text-xs"
                  onClick={(e) => e.stopPropagation()}
                />
                {isSearching && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-48 overflow-auto p-1">
              {searchResults.length > 0 ? (
                searchResults.map((user) => {
                  const isSelected = user.id === selectedUserId;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelect(user)}
                      className={cn(
                        'relative flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs outline-none',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus:bg-accent focus:text-accent-foreground',
                        isSelected && 'bg-accent/50'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isSelected && <Check className="h-3 w-3 flex-shrink-0 text-primary" />}
                        <div className="flex flex-col items-start min-w-0">
                          <span className={cn('truncate', isSelected && 'font-medium')}>
                            {user.fullName}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  {isSearching ? 'Searching...' : 'No users found'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}









