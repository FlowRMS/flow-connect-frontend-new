'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Loader2, Check, X } from 'lucide-react';
import { Input } from '@/components/flow-ai/ui/input';
import { cn } from '@/lib/flow-ai/cn';

export interface EntitySearchResult {
  entityId: string;
  name: string;
  similarityScore?: number | string;
  metadata?: string | null;
}

interface EntitySearchDropdownProps {
  /** Label for the dropdown */
  label?: string;
  /** Currently selected entity ID */
  selectedId: string | null;
  /** Currently selected entity name for display */
  selectedName: string | null;
  /** Placeholder text when nothing is selected */
  placeholder?: string;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Whether field is required */
  required?: boolean;
  /** Callback when an entity is selected */
  onSelect: (entityId: string | null, result: EntitySearchResult | null) => void;
  /** Callback to search for entities - receives search query, returns results */
  onSearch: (query: string, limit?: number) => Promise<EntitySearchResult[]>;
  /** Show clear button */
  clearable?: boolean;
  /** Error message to display */
  error?: string;
  /** Additional class name for the trigger */
  className?: string;
}

export function EntitySearchDropdown({
  label,
  selectedId,
  selectedName,
  placeholder = 'Search or select...',
  disabled = false,
  required = false,
  onSelect,
  onSearch,
  clearable = true,
  error,
  className,
}: EntitySearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EntitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHasSearched(false);
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
      const results = await onSearch(query, 15);
      setSearchResults(results);
      setHasSearched(true);
    } catch (err) {
      console.error('Search failed:', err);
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

    // Trigger search on every keystroke (empty string returns default results)
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
      setHasSearched(false);
    } else {
      setIsOpen(true);
      // Trigger initial search with empty string
      performSearch('');
    }
  };

  // Handle selection
  const handleSelect = (result: EntitySearchResult) => {
    onSelect(result.entityId, result);
    setIsOpen(false);
    setSearchQuery('');
    setHasSearched(false);
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null, null);
  };

  // Display text for trigger
  const displayText = selectedName || placeholder;
  const hasValue = Boolean(selectedId && selectedName);
  const showError = Boolean(error) || (required && !hasValue);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            showError ? 'border-destructive' : 'border-input',
            hasValue ? 'text-foreground' : 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate text-left flex-1">{displayText}</span>
          <div className="flex items-center gap-1 ml-2">
            {clearable && hasValue && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClear(e as unknown as React.MouseEvent); }}
                className="p-0.5 hover:bg-muted rounded cursor-pointer"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </span>
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
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Type to search..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
                {isSearching && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-56 overflow-auto p-1">
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => {
                  const isSelected = result.entityId === selectedId;

                  return (
                    <button
                      key={`${result.entityId}-${index}`}
                      type="button"
                      onClick={() => handleSelect(result)}
                      className={cn(
                        'relative flex w-full items-center justify-between rounded-sm px-2 py-2 text-sm outline-none',
                        'hover:bg-accent hover:text-accent-foreground',
                        'focus:bg-accent focus:text-accent-foreground',
                        isSelected && 'bg-accent/50'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isSelected && <Check className="h-4 w-4 flex-shrink-0 text-primary" />}
                        <span className={cn('truncate', isSelected && 'font-medium')}>{result.name}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {isSearching ? 'Searching...' : hasSearched ? 'No results found' : 'Start typing to search...'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}









