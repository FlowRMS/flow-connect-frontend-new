/**
 * Universal Search Component
 * A powerful global search that searches across all entity types
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { universalSearch, type UniversalSearchResult } from './lib/crm-graphql';

// Custom easing curves - iOS/macOS native feel (matching NavigationMorphContext)
const morphEase = [0.22, 1, 0.36, 1] as const;
const snappyEase = [0.34, 1.56, 0.64, 1] as const;

// Result type configuration with colors and icons
const RESULT_TYPE_CONFIG: Record<string, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  href: (id: string) => string;
}> = {
  JOB: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M8 4V2a2 2 0 012-2h4a2 2 0 012 2v2"/>
      </svg>
    ),
    href: (id) => `/jobs?id=${id}`,
  },
  COMPANY: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="2" width="18" height="20" rx="1"/>
        <path d="M9 6h2M9 10h2M9 14h2M13 6h2M13 10h2"/>
      </svg>
    ),
    href: (id) => `/companies?id=${id}`,
  },
  CONTACT: {
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
      </svg>
    ),
    href: (id) => `/contacts?id=${id}`,
  },
  CUSTOMER: {
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    href: (id) => `/customers/${id}/edit`,
  },
  PRE_OPPORTUNITY: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
    href: (id) => `/pre-opportunities/${id}`,
  },
  QUOTE: {
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
    ),
    href: (id) => `/quotes/${id}`,
  },
  ORDER: {
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
    href: (id) => `/orders/${id}`,
  },
  INVOICE: {
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6"/>
        <path d="M12 18v-6M9 15h6"/>
      </svg>
    ),
    href: (id) => `/invoices/${id}`,
  },
  TASK: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
    href: (id) => `/tasks?id=${id}`,
  },
  NOTE: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
    ),
    href: (id) => `/notes?id=${id}`,
  },
  PRODUCT: {
    color: 'text-lime-700',
    bgColor: 'bg-lime-50',
    borderColor: 'border-lime-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
      </svg>
    ),
    href: (id) => `/products/${id}/edit`,
  },
  CHECK: {
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    href: (id) => `/commissions/${id}`,
  },
};

// Default config for unknown types
const DEFAULT_CONFIG = {
  color: 'text-gray-700',
  bgColor: 'bg-gray-50',
  borderColor: 'border-gray-200',
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
  href: () => '#',
};

function getResultConfig(resultType: string) {
  return RESULT_TYPE_CONFIG[resultType] || DEFAULT_CONFIG;
}

function formatResultType(resultType: string): string {
  return resultType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Recent searches localStorage helpers
const RECENT_SEARCHES_KEY = 'universal-search-recent';
const MAX_RECENT_SEARCHES = 5;

interface RecentSearch {
  id: string;
  resultType: string;
  title: string;
  alias?: string;
  extraInfo?: string;
  timestamp: number;
}

function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    const searches = JSON.parse(stored) as RecentSearch[];
    // Sort by most recent first
    return searches.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

function addRecentSearch(result: UniversalSearchResult): void {
  if (typeof window === 'undefined') return;
  try {
    const searches = getRecentSearches();
    // Remove if already exists (to move it to top)
    const filtered = searches.filter(
      s => !(s.id === result.id && s.resultType === result.resultType)
    );
    // Add new search at the beginning
    const newSearch: RecentSearch = {
      id: result.id,
      resultType: result.resultType,
      title: result.title,
      alias: result.alias ?? undefined,
      extraInfo: result.extraInfo ?? undefined,
      timestamp: Date.now(),
    };
    const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

export default function UniversalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Fetch results - trigger on every keystroke, also fetch on empty string (initial load)
  const { data: results = [], isLoading, isFetching } = useQuery({
    queryKey: ['universalSearch', searchTerm],
    queryFn: () => universalSearch(searchTerm, 15),
    enabled: isOpen,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update dropdown position
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 500),
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const dropdown = document.getElementById('universal-search-dropdown');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFocus = () => {
    setIsOpen(true);
    updatePosition();
  };

  const handleResultClick = (result: UniversalSearchResult | RecentSearch) => {
    // Save to recent searches
    addRecentSearch(result as UniversalSearchResult);
    // Update local state immediately
    setRecentSearches(getRecentSearches());
    setIsOpen(false);
    setSearchTerm('');
  };

  const dropdownContent = (
    <motion.div
      id="universal-search-dropdown"
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[9999]"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        maxHeight: 'min(480px, calc(100vh - 200px))',
      }}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{
        duration: 0.2,
        ease: morphEase,
      }}
    >
      {/* Header */}
      <motion.div
        className="px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: 0.05, ease: morphEase }}
      >
        <div className="flex items-center gap-2 text-white">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.3, ease: snappyEase, delay: 0.1 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </motion.div>
          <span className="font-semibold text-sm">Universal Search</span>
          {(isLoading || isFetching) && (
            <svg className="animate-spin h-4 w-4 ml-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          )}
        </div>
        <p className="text-white/70 text-xs mt-1">Search across jobs, contacts, companies, and more</p>
      </motion.div>

      {/* Results */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(480px - 80px)' }}>
        {/* Recent searches section - show at top when no search term */}
        <AnimatePresence>
          {!searchTerm && recentSearches.length > 0 && (
            <motion.div
              key="recent-searches"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15, ease: morphEase }}
            >
              {/* Recent searches header */}
              <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent</span>
              </div>
              {recentSearches.map((recent, index) => {
                const config = getResultConfig(recent.resultType);
                return (
                  <motion.div
                    key={`recent-${recent.resultType}-${recent.id}-${index}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.25,
                      ease: morphEase,
                      delay: index * 0.03,
                    }}
                  >
                    <Link
                      href={config.href(recent.id)}
                      onClick={() => handleResultClick(recent)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      {/* Icon */}
                      <motion.div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.bgColor} ${config.color} flex items-center justify-center border ${config.borderColor}`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        {config.icon}
                      </motion.div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {recent.title}
                          </span>
                          {/* Recent badge */}
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                            Recent
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                            {formatResultType(recent.resultType)}
                          </span>
                          {recent.alias && (
                            <span className="text-xs text-gray-400 truncate">
                              {recent.alias}
                            </span>
                          )}
                          {recent.extraInfo && (
                            <span className="text-xs text-gray-500 truncate">
                              • {recent.extraInfo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <motion.svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="flex-shrink-0 text-gray-300 group-hover:text-blue-500"
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </motion.svg>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main results section */}
        <AnimatePresence mode="wait">
          {results.length === 0 && !isLoading && (
            <motion.div
              key="empty-state"
              className="px-4 py-8 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: morphEase }}
            >
              <motion.div
                className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, ease: snappyEase }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </motion.div>
              <p className="text-gray-500 text-sm font-medium">
                {searchTerm ? 'No results found' : 'Start typing to search'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {searchTerm ? 'Try a different search term' : 'Search across all your CRM data'}
              </p>
            </motion.div>
          )}

          {results.length > 0 && (
            <motion.div
              key="results"
              className="py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: morphEase }}
            >
              {results.map((result, index) => {
                const config = getResultConfig(result.resultType);
                return (
                  <motion.div
                    key={`${result.resultType}-${result.id}-${index}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.25,
                      ease: morphEase,
                      delay: index * 0.03,
                    }}
                  >
                    <Link
                      href={config.href(result.id)}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      {/* Icon */}
                      <motion.div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.bgColor} ${config.color} flex items-center justify-center border ${config.borderColor}`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        {config.icon}
                      </motion.div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {result.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                            {formatResultType(result.resultType)}
                          </span>
                          {result.alias && (
                            <span className="text-xs text-gray-400 truncate">
                              {result.alias}
                            </span>
                          )}
                          {result.extraInfo && (
                            <span className="text-xs text-gray-500 truncate">
                              • {result.extraInfo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <motion.svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="flex-shrink-0 text-gray-300 group-hover:text-blue-500"
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </motion.svg>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <motion.div
        className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1, ease: morphEase }}
      >
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono text-[10px]">ESC</kbd>
            <span>to close</span>
          </span>
        </div>
        <motion.span
          className="text-xs text-gray-400"
          key={`${results.length}-${recentSearches.length}-${searchTerm}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15, ease: morphEase }}
        >
          {results.length > 0
            ? `${results.length} result${results.length !== 1 ? 's' : ''}`
            : !searchTerm && recentSearches.length > 0
              ? `${recentSearches.length} recent`
              : '0 results'
          }
        </motion.span>
      </motion.div>
    </motion.div>
  );

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search jobs, contacts, companies, and more..."
          className="w-full pl-11 pr-20 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg
                     placeholder:text-gray-400 text-gray-900
                     focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:bg-white
                     hover:bg-gray-100 hover:border-gray-300
                     transition-all duration-200 shadow-sm"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono text-[10px] text-gray-400">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Dropdown Portal */}
      {isMounted && createPortal(
        <AnimatePresence>
          {isOpen && dropdownContent}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
