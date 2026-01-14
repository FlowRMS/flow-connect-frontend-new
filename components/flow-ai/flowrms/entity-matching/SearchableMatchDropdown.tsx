'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/flow-ai/ui/input';
import { cn } from '@/lib/flow-ai/cn';

export interface SearchResult {
  entityId: string;
  name: string;
  similarityScore: number | string;
  metadata?: string | null;
}

interface SearchableMatchDropdownProps {
  /** Currently selected match ID */
  selectedMatchId: string | null;
  /** Currently selected match name for display */
  selectedMatchName: string | null;
  /** Confidence percentage to display */
  confidence: number;
  /** Initial candidates from match suggestions */
  initialCandidates: SearchResult[];
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Whether the entity is locked (confirmed/rejected) */
  isLocked?: boolean;
  /** Status class name for styling */
  statusClassName?: string;
  /** Callback when a match is selected */
  onSelect: (entityId: string, result: SearchResult) => void;
  /** Callback to search for entities - receives search query, returns results */
  onSearch: (query: string, limit?: number) => Promise<SearchResult[]>;
}

export function SearchableMatchDropdown({
  selectedMatchId,
  selectedMatchName,
  confidence,
  initialCandidates,
  disabled = false,
  isLocked = false,
  statusClassName = '',
  onSelect,
  onSearch,
}: SearchableMatchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setShowSearchResults(false);
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
      const results = await onSearch(query, 10);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
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

    // Trigger search on every keystroke (even empty string returns records)
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 150); // Small debounce to avoid too many requests
  };

  // Toggle dropdown open/close
  const handleToggle = () => {
    if (disabled || isLocked) return;

    if (isOpen) {
      // Close the dropdown
      setIsOpen(false);
      setSearchQuery('');
      setShowSearchResults(false);
    } else {
      // Open the dropdown and trigger initial search with empty string
      setIsOpen(true);
      performSearch('');
    }
  };

  // Handle selection
  const handleSelect = (result: SearchResult) => {
    onSelect(result.entityId, result);
    setIsOpen(false);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Display search results when we have them, otherwise fall back to initial candidates
  // When search returns results (even from empty query), use those
  // Only fall back to initialCandidates if we haven't searched yet
  const displayResults = showSearchResults ? searchResults : initialCandidates;

  // Get display text for trigger
  const displayText = selectedMatchName
    ? `${selectedMatchName} (${confidence}%)`
    : 'Search or select match...';

  return (
    <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || isLocked}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isLocked && 'bg-slate-100 cursor-not-allowed',
          statusClassName
        )}
      >
        <span className="truncate text-left">{displayText}</span>
        <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')} />
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
            {displayResults.length > 0 ? (
              displayResults.map((result, index) => {
                const isSelected = result.entityId === selectedMatchId;
                const score = Math.round(Number(result.similarityScore) * 100);

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
                    <span className="ml-2 flex-shrink-0 text-xs text-muted-foreground">
                      {score}%
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {isSearching ? 'Searching...' : 'No results found'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}









