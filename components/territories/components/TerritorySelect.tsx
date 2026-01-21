'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TerritoryBadge } from './TerritoryBadge';
import { useAllTerritories, useTerritoryHierarchy } from '../api/useTerritories';
import { type TerritoryLite, type TerritoryType } from '../../lib/graphql/territories';

interface TerritorySelectProps {
  value: string | null | undefined;
  onChange: (territoryId: string | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function TerritorySelect({
  value,
  onChange,
  label,
  placeholder = 'Select territory...',
  disabled = false,
  error,
  className,
}: TerritorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: territories, isLoading } = useAllTerritories();
  const { data: hierarchy } = useTerritoryHierarchy(value || undefined);

  // Get selected territory
  const selectedTerritory = value && territories
    ? territories.find((t) => t.id === value)
    : null;

  // Build display value with breadcrumb
  const getDisplayValue = useCallback((): string => {
    if (!selectedTerritory) return '';
    if (!hierarchy || hierarchy.length === 0) return selectedTerritory.name;

    // hierarchy is [territory, subregion, region] (most specific first)
    return [...hierarchy].reverse().map((t) => t.name).join(' > ');
  }, [selectedTerritory, hierarchy]);

  // Filter territories by search term
  const filteredTerritories = territories?.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Group by type for display
  const groupedTerritories = filteredTerritories.reduce(
    (acc, t) => {
      if (!acc[t.territoryType]) {
        acc[t.territoryType] = [];
      }
      acc[t.territoryType].push(t);
      return acc;
    },
    {} as Record<TerritoryType, TerritoryLite[]>
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (territory: TerritoryLite) => {
    onChange(territory.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className || ''}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <div
        className={`relative flex items-center border rounded-lg transition-all cursor-pointer ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : error
            ? 'border-red-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200'
            : isOpen
            ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {selectedTerritory ? (
          <div className="flex-1 flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <TerritoryBadge type={selectedTerritory.territoryType} />
              <span className="text-sm font-medium text-gray-900 truncate">
                {getDisplayValue()}
              </span>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 px-3 py-2.5 text-sm text-gray-500">{placeholder}</div>
        )}
        <div className="pr-3">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search territories..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-[var(--primary)] rounded-full animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Loading...</p>
              </div>
            ) : filteredTerritories.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No territories found
              </div>
            ) : (
              <>
                {/* Show by type */}
                {(['REGION', 'SUBREGION', 'TERRITORY'] as TerritoryType[]).map((type) => {
                  const items = groupedTerritories[type];
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={type}>
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">
                        {type === 'REGION' ? 'Regions' : type === 'SUBREGION' ? 'Subregions' : 'Territories'}
                      </div>
                      {items.map((territory) => (
                        <div
                          key={territory.id}
                          onClick={() => handleSelect(territory)}
                          className={`px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                            territory.id === value ? 'bg-[var(--primary)]/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <TerritoryBadge type={territory.territoryType} />
                            <span className="text-sm font-medium text-gray-900">{territory.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 ml-[52px] mt-0.5 font-mono">
                            {territory.code}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
