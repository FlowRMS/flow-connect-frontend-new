/**
 * StatementDetailsFields Component
 * Collapsible header fields for statement metadata
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { searchFactories } from '@/components/lib/api/search';

interface StatementDetailsFieldsProps {
  showHeaderFields: boolean;
  toggleHeaderFields: () => void;
  statementNumber: string;
  entityDate: string;
  factoryId: string;
  factoryName: string;
  isCreateMode: boolean;
  onUpdate: (updates: {
    statementNumber?: string;
    entityDate?: string;
    factoryId?: string;
    factoryName?: string;
  }) => void;
}

interface Factory {
  id: string;
  title: string;
}

export function StatementDetailsFields({
  showHeaderFields,
  toggleHeaderFields,
  statementNumber,
  entityDate,
  factoryId,
  factoryName,
  isCreateMode,
  onUpdate,
}: StatementDetailsFieldsProps) {
  // Factory search state
  const [factorySearch, setFactorySearch] = useState('');
  const [factoryResults, setFactoryResults] = useState<Factory[]>([]);
  const [showFactoryDropdown, setShowFactoryDropdown] = useState(false);
  const [isSearchingFactories, setIsSearchingFactories] = useState(false);
  const factoryInputRef = useRef<HTMLInputElement>(null);
  const factoryContainerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Search factories - load initial list on focus, then filter as user types
  useEffect(() => {
    const search = async () => {
      if (!showFactoryDropdown) return;

      setIsSearchingFactories(true);
      try {
        const results = await searchFactories(factorySearch || '', true, 50);
        setFactoryResults(results.map((f: any) => ({ id: f.id, title: f.title || f.name })));
      } catch (error) {
        console.error('Error searching factories:', error);
        setFactoryResults([]);
      } finally {
        setIsSearchingFactories(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [factorySearch, showFactoryDropdown]);

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (factoryContainerRef.current) {
      const rect = factoryContainerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (showFactoryDropdown) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [showFactoryDropdown, updateDropdownPosition]);

  // Handle factory selection
  const handleFactorySelect = (factory: Factory) => {
    onUpdate({ factoryId: factory.id, factoryName: factory.title });
    setFactorySearch('');
    setShowFactoryDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (
        factoryContainerRef.current &&
        !factoryContainerRef.current.contains(target) &&
        !target.closest('[data-factory-dropdown]')
      ) {
        setShowFactoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white border-b border-[var(--border)]">
      {/* Toggle button */}
      <button
        onClick={toggleHeaderFields}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-[var(--muted-foreground)]">
          Statement Details
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-[var(--muted-foreground)] transition-transform ${
            showHeaderFields ? 'rotate-180' : ''
          }`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Fields content */}
      {showHeaderFields && (
        <div className="px-6 pb-4 grid grid-cols-3 gap-4">
          {/* Statement Number */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
              Statement Number
            </label>
            <input
              type="text"
              value={statementNumber}
              onChange={(e) => onUpdate({ statementNumber: e.target.value })}
              placeholder="Enter statement number"
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>

          {/* Statement Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
              Statement Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={entityDate}
              onChange={(e) => onUpdate({ entityDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>

          {/* Factory */}
          <div ref={factoryContainerRef}>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
              Factory <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {factoryId ? (
                <div className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-gray-50">
                  <span className="flex-1 truncate">{factoryName}</span>
                  <button
                    onClick={() => {
                      onUpdate({ factoryId: '', factoryName: '' });
                      setFactorySearch('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <input
                  ref={factoryInputRef}
                  type="text"
                  value={factorySearch}
                  onChange={(e) => {
                    setFactorySearch(e.target.value);
                    setShowFactoryDropdown(true);
                  }}
                  onFocus={() => setShowFactoryDropdown(true)}
                  placeholder="Search factories..."
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              )}

              {/* Factory dropdown */}
              {showFactoryDropdown && !factoryId && typeof document !== 'undefined' &&
                createPortal(
                  <div
                    data-factory-dropdown="true"
                    style={{
                      position: 'fixed',
                      top: dropdownPosition.top,
                      left: dropdownPosition.left,
                      width: dropdownPosition.width,
                      zIndex: 9999,
                    }}
                    className="bg-white rounded-lg shadow-lg border border-[var(--border)] max-h-60 overflow-auto"
                  >
                    {isSearchingFactories ? (
                      <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                        Searching...
                      </div>
                    ) : factoryResults.length > 0 ? (
                      factoryResults.map((factory) => (
                        <button
                          key={factory.id}
                          onClick={() => handleFactorySelect(factory)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)] last:border-b-0"
                        >
                          {factory.title}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                        No factories found
                      </div>
                    )}
                  </div>,
                  document.body
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
