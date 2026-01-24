'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TerritoryUSMap } from '../components/maps/TerritoryUSMap';
import { TerritoryCountyMap } from '../components/maps/TerritoryCountyMap';
import { getStateName, getStateFromFips } from '../components/maps/mapConstants';

interface TerritoryMapSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selection: { stateCodes: string[]; countyCodes: string[] }) => void;
  initialStateCodes?: string[];
  initialCountyCodes?: string[];
}

type ViewMode = 'us' | 'county';

export function TerritoryMapSelectorModal({
  isOpen,
  onClose,
  onApply,
  initialStateCodes = [],
  initialCountyCodes = [],
}: TerritoryMapSelectorModalProps) {
  const [view, setView] = useState<ViewMode>('us');
  const [drillDownState, setDrillDownState] = useState<string | null>(null);
  const [selectedStateCodes, setSelectedStateCodes] = useState<string[]>([]);
  const [selectedCountyCodes, setSelectedCountyCodes] = useState<string[]>([]);

  // Track if we've initialized for this open
  const hasInitializedRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && !hasInitializedRef.current) {
      setSelectedStateCodes(initialStateCodes);
      setSelectedCountyCodes(initialCountyCodes);
      setView('us');
      setDrillDownState(null);
      hasInitializedRef.current = true;
    } else if (!isOpen) {
      hasInitializedRef.current = false;
    }
  }, [isOpen, initialStateCodes, initialCountyCodes]);

  // Handle state toggle (single click)
  const handleStateToggle = useCallback((stateCode: string) => {
    setSelectedStateCodes((prev) =>
      prev.includes(stateCode) ? prev.filter((s) => s !== stateCode) : [...prev, stateCode]
    );
  }, []);

  // Handle state multi-select (lasso)
  const handleStateMultiSelect = useCallback((stateCodes: string[]) => {
    setSelectedStateCodes((prev) => {
      const newSet = new Set(prev);
      stateCodes.forEach((code) => newSet.add(code));
      return Array.from(newSet);
    });
  }, []);

  // Handle drill-down into county view
  const handleDrillDown = useCallback((stateCode: string) => {
    setDrillDownState(stateCode);
    setView('county');
  }, []);

  // Handle back to US map
  const handleBackToUS = useCallback(() => {
    setView('us');
    setDrillDownState(null);
  }, []);

  // Handle county toggle
  const handleCountyToggle = useCallback((countyFips: string) => {
    setSelectedCountyCodes((prev) =>
      prev.includes(countyFips) ? prev.filter((c) => c !== countyFips) : [...prev, countyFips]
    );
  }, []);

  // Handle county multi-select (lasso)
  const handleCountyMultiSelect = useCallback((countyFipsCodes: string[]) => {
    setSelectedCountyCodes((prev) => {
      const newSet = new Set(prev);
      countyFipsCodes.forEach((fips) => newSet.add(fips));
      return Array.from(newSet);
    });
  }, []);

  // Remove a state from selection
  const handleRemoveState = useCallback((stateCode: string) => {
    setSelectedStateCodes((prev) => prev.filter((s) => s !== stateCode));
  }, []);

  // Remove a county from selection
  const handleRemoveCounty = useCallback((countyFips: string) => {
    setSelectedCountyCodes((prev) => prev.filter((c) => c !== countyFips));
  }, []);

  // Clear all selections
  const handleClearAll = useCallback(() => {
    setSelectedStateCodes([]);
    setSelectedCountyCodes([]);
  }, []);

  // Apply selection and close
  const handleApply = useCallback(() => {
    onApply({ stateCodes: selectedStateCodes, countyCodes: selectedCountyCodes });
    onClose();
  }, [onApply, onClose, selectedStateCodes, selectedCountyCodes]);

  // Group counties by state for display
  const countiesByState = selectedCountyCodes.reduce<Record<string, string[]>>((acc, fips) => {
    const stateCode = getStateFromFips(fips);
    if (stateCode) {
      if (!acc[stateCode]) acc[stateCode] = [];
      acc[stateCode].push(fips);
    }
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-[90vw] max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Select Territory Boundaries
            </h2>
            {/* View tabs */}
            <div className="flex bg-[var(--muted)] rounded-lg p-0.5">
              <button
                onClick={handleBackToUS}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  view === 'us'
                    ? 'bg-white text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                US Map
              </button>
              {drillDownState && (
                <button
                  onClick={() => setView('county')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    view === 'county'
                      ? 'bg-white text-[var(--foreground)] shadow-sm'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {getStateName(drillDownState)} Counties
                </button>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Map area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {view === 'us' && (
              <TerritoryUSMap
                selectedStateCodes={selectedStateCodes}
                onStateToggle={handleStateToggle}
                onMultiSelect={handleStateMultiSelect}
                onDrillDown={handleDrillDown}
              />
            )}
            {view === 'county' && drillDownState && (
              <TerritoryCountyMap
                stateCode={drillDownState}
                selectedCountyCodes={selectedCountyCodes}
                onCountyToggle={handleCountyToggle}
                onMultiSelect={handleCountyMultiSelect}
                onBack={handleBackToUS}
              />
            )}
          </div>

          {/* Selection sidebar */}
          <div className="w-64 border-l border-[var(--border)] bg-[var(--muted)]/30 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Selection</h3>
              {(selectedStateCodes.length > 0 || selectedCountyCodes.length > 0) && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-[var(--muted-foreground)] hover:text-red-500"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Selected states */}
            {selectedStateCodes.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                  States ({selectedStateCodes.length})
                </div>
                <div className="space-y-1">
                  {selectedStateCodes.map((code) => (
                    <div
                      key={code}
                      className="flex items-center justify-between px-2 py-1.5 bg-white rounded border border-[var(--border)]"
                    >
                      <span className="text-sm text-[var(--foreground)]">
                        {getStateName(code)}
                      </span>
                      <button
                        onClick={() => handleRemoveState(code)}
                        className="p-0.5 hover:bg-red-50 rounded text-[var(--muted-foreground)] hover:text-red-500"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected counties (grouped by state) */}
            {Object.keys(countiesByState).length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                  Counties ({selectedCountyCodes.length})
                </div>
                <div className="space-y-2">
                  {Object.entries(countiesByState).map(([stateCode, counties]) => (
                    <div key={stateCode} className="bg-white rounded border border-[var(--border)] p-2">
                      <div className="text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        {getStateName(stateCode)} ({counties.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {counties.slice(0, 5).map((fips) => (
                          <span
                            key={fips}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[var(--muted)] rounded text-xs"
                          >
                            {fips}
                            <button
                              onClick={() => handleRemoveCounty(fips)}
                              className="hover:text-red-500"
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  d="M18 6L6 18M6 6l12 12"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </span>
                        ))}
                        {counties.length > 5 && (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            +{counties.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {selectedStateCodes.length === 0 && selectedCountyCodes.length === 0 && (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                <svg
                  className="w-12 h-12 mx-auto mb-2 opacity-50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M8 2v16M16 6v16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm">No areas selected</p>
                <p className="text-xs mt-1">Click or drag on the map to select states</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Apply Selection
            {(selectedStateCodes.length > 0 || selectedCountyCodes.length > 0) && (
              <span className="ml-1.5 opacity-80">
                ({selectedStateCodes.length} states
                {selectedCountyCodes.length > 0 && `, ${selectedCountyCodes.length} counties`})
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
