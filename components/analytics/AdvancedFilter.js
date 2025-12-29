"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Filter, X, ChevronDown, Search, Loader2 } from "lucide-react";
import {
  computeAdvancedFilterOptions,
  DEFAULT_EXCLUDED_COLUMNS,
  readAdvancedFilterCache,
  writeAdvancedFilterCache,
} from "@/lib/analytics/utils/advancedFilterCache";

// Columns to exclude from filtering (numeric, IDs, emails, etc.)
const EXCLUDED_COLUMNS = DEFAULT_EXCLUDED_COLUMNS;

// Year filter options
const YEAR_OPTIONS = [
  { value: "current", label: "Current Year" },
  { value: "last", label: "Last Year" },
  { value: "last2", label: "Last 2 Years" },
  { value: "last3", label: "Last 3 Years" },
  { value: "all", label: "All Years" },
];

export function AdvancedFilter({
  columns = [],
  visibleColumns = [],
  data = [],
  filters = {},
  onFiltersChange,
  onClear,
  cacheKey,
  dataVersion,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerms, setSearchTerms] = useState({});
  const containerRef = useRef(null);
  const [popupStyle, setPopupStyle] = useState({});
  const [precomputedValues, setPrecomputedValues] = useState(() => {
    if (!cacheKey) {
      return null;
    }
    const cached = readAdvancedFilterCache(cacheKey);
    if (!cached) {
      return null;
    }
    if (
      cached.values &&
      (dataVersion == null || cached.version === dataVersion)
    ) {
      return cached.values;
    }
    return cached.values ?? null;
  });
  const [isComputing, setIsComputing] = useState(false);

  const filterableColumns = useMemo(
    () =>
      columns.filter(
        (col) => col && col.prop && !EXCLUDED_COLUMNS.includes(col.prop)
      ),
    [columns]
  );

  const fallbackColumnValues = useMemo(() => {
    if (cacheKey) {
      return {};
    }
    if (!Array.isArray(data) || data.length === 0) {
      return {};
    }
    return computeAdvancedFilterOptions(data, columns, EXCLUDED_COLUMNS);
  }, [cacheKey, data, columns]);

  const columnValues = precomputedValues ?? fallbackColumnValues;

  useEffect(() => {
    if (!cacheKey) {
      return;
    }

    const cached = readAdvancedFilterCache(cacheKey);
    if (
      cached &&
      cached.values &&
      (dataVersion == null || cached.version === dataVersion)
    ) {
      setPrecomputedValues(cached.values);
      setIsComputing(false);
      return;
    }

    if (!Array.isArray(filterableColumns) || filterableColumns.length === 0) {
      setPrecomputedValues({});
      setIsComputing(false);
      if (cacheKey) {
        writeAdvancedFilterCache(cacheKey, dataVersion ?? null, {});
      }
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      setPrecomputedValues({});
      setIsComputing(false);
      if (cacheKey) {
        writeAdvancedFilterCache(cacheKey, dataVersion ?? null, {});
      }
      return;
    }

    setIsComputing(true);
    let cancelled = false;

    const computeValues = () => {
      const computed = computeAdvancedFilterOptions(
        data,
        columns,
        EXCLUDED_COLUMNS
      );

      if (cancelled) {
        return;
      }

      setPrecomputedValues(computed);
      setIsComputing(false);
      writeAdvancedFilterCache(cacheKey, dataVersion ?? Date.now(), computed);
    };

    if (typeof window !== "undefined") {
      const schedule =
        window.requestIdleCallback ?? ((fn) => window.setTimeout(fn, 16));
      const cancel =
        window.cancelIdleCallback ?? ((id) => window.clearTimeout(id));

      const handle = schedule(computeValues);
      return () => {
        cancelled = true;
        cancel(handle);
      };
    }

    computeValues();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, dataVersion, data, columns, filterableColumns]);

  useEffect(() => {
    if (cacheKey) {
      return;
    }
    setPrecomputedValues(null);
    setIsComputing(false);
  }, [cacheKey]);

  useEffect(() => {
    if (!cacheKey && dataVersion == null) {
      return;
    }
    setSearchTerms({});
  }, [cacheKey, dataVersion]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Compute placement and popup width to avoid viewport overflow
  useEffect(() => {
    if (!isOpen) return;

    const compute = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      const margin = 16; // safety margin from edges
      const desiredWidth = 800;
      const maxWidth = Math.max(300, vw - margin * 2); // don't let it be too small
      const width = Math.min(desiredWidth, maxWidth);

      // Default to left aligned below button
      let left = rect.left;
      let top = rect.bottom + 8;

      // If overflows right, align right edge with button right edge or viewport right
      if (left + width > vw - margin) {
        // Try aligning right edge with button right edge
        const rightAlignedLeft = rect.right - width;
        // If that also overflows left (too narrow), just pin to right margin
        left = Math.max(margin, Math.min(rightAlignedLeft, vw - width - margin));
      }
      
      // Ensure it doesn't go off-screen left
      left = Math.max(margin, left);

      setPopupStyle({
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        zIndex: 9999,
        maxHeight: "600px",
      });
    };

    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [isOpen]);

  // Get current year for year filtering
  const currentYear = new Date().getFullYear();

  const handleYearChange = (yearOption) => {
    const newFilters = { ...filters };
    if (yearOption === "all") {
      delete newFilters._year;
    } else {
      newFilters._year = yearOption;
    }
    onFiltersChange(newFilters);
  };

  const handleColumnFilterChange = (columnProp, value, checked) => {
    const newFilters = { ...filters };
    
    if (!newFilters[columnProp]) {
      newFilters[columnProp] = [];
    }

    if (checked) {
      if (!newFilters[columnProp].includes(value)) {
        newFilters[columnProp] = [...newFilters[columnProp], value];
      }
    } else {
      newFilters[columnProp] = newFilters[columnProp].filter((v) => v !== value);
      if (newFilters[columnProp].length === 0) {
        delete newFilters[columnProp];
      }
    }

    onFiltersChange(newFilters);
  };

  const handleSelectAll = (columnProp, values) => {
    const newFilters = { ...filters };
    const currentSelected = newFilters[columnProp] || [];
    
    if (currentSelected.length === values.length) {
      // Deselect all
      delete newFilters[columnProp];
    } else {
      // Select all
      newFilters[columnProp] = [...values];
    }
    
    onFiltersChange(newFilters);
  };

  const getFilteredValues = (columnProp, values) => {
    const searchTerm = searchTerms[columnProp] || "";
    if (!searchTerm) return values;
    return values.filter((value) =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => key !== "_year" && filters[key].length > 0
  ).length + (filters._year && filters._year !== "all" ? 1 : 0);

  const isColumnVisible = (columnProp) => {
    return visibleColumns.some((col) => col.prop === columnProp);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 transition-all"
      >
        <Filter size={18} />
        <span>Advanced Filters</span>
        {activeFilterCount > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs font-bold">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 flex flex-col"
          style={{
            ...popupStyle,
            zIndex: 99999, // Ensure it's above everything
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Advanced Filters
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Filter data by multiple columns and criteria
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  onClear();
                  setSearchTerms({});
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <X size={14} />
                Clear All
              </button>
            )}
          </div>

          {/* Year Filter */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700 bg-blue-50 dark:bg-zinc-800/50">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block">
              Year Range
            </label>
            <div className="flex gap-2 flex-wrap">
              {YEAR_OPTIONS.map((option) => {
                const isActive = filters._year === option.value || (!filters._year && option.value === "all");
                return (
                  <button
                    key={option.value}
                    onClick={() => handleYearChange(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-600"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column Filters */}
          <div className="overflow-y-auto flex-1">
            <div className="p-4 space-y-4">
              {cacheKey && isComputing && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-zinc-800/60 text-sm text-blue-700 dark:text-blue-300 rounded-lg">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Preparing filter options...</span>
                </div>
              )}

              {filterableColumns.length === 0 && !isComputing && (
                <div className="px-3 py-6 text-sm text-gray-500 dark:text-gray-400 text-center border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg">
                  No filterable columns available.
                </div>
              )}

              {filterableColumns.map((col) => {
                const values = columnValues[col.prop] || [];
                let currentValues = values;
                let isDisabled = !isColumnVisible(col.prop);
                let disabledMessage = "";

                // Special handling for Factory Part Number
                // Check all possible factory column names as different reports use different names
                if (col.prop === "factoryPartNumber") {
                   // Find factory filter by looking for any factory-related key in filters
                   // Different reports use different column props: "factory", "factoryTitle"
                   let factoryFilter = null;
                   let factoryDataField = null;

                   // Check for factory filter under different possible keys
                   if (filters.factory && Array.isArray(filters.factory) && filters.factory.length > 0) {
                     factoryFilter = filters.factory;
                     factoryDataField = "factory";
                   } else if (filters.factoryTitle && Array.isArray(filters.factoryTitle) && filters.factoryTitle.length > 0) {
                     factoryFilter = filters.factoryTitle;
                     factoryDataField = "factoryTitle";
                   }

                   if (!factoryFilter) {
                     // No factory selected - disable this filter
                     isDisabled = true;
                     disabledMessage = "Select a Factory first";
                     currentValues = [];
                   } else {
                     // Factory IS selected - enable this filter and show relevant part numbers
                     isDisabled = false;
                     disabledMessage = "";
                     // Filter part numbers based on selected factories
                     const relevantRows = data.filter(row => {
                       const rowFactory = row[factoryDataField];
                       return rowFactory && factoryFilter.includes(rowFactory);
                     });
                     const relevantPartNumbers = new Set(relevantRows.map(r => r.factoryPartNumber));
                     currentValues = values.filter(v => relevantPartNumbers.has(v));
                   }
                }

                const filteredValues = getFilteredValues(col.prop, currentValues);
                const selectedValues = filters[col.prop] || [];
                const isVisible = isColumnVisible(col.prop);
                const allSelected = currentValues.length > 0 && selectedValues.length === currentValues.length;

                if (values.length === 0 && !isComputing) return null;
                if (values.length === 0 && isComputing) {
                  return (
                    <div
                      key={col.prop}
                      className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
                    >
                      Preparing options for {col.name}...
                    </div>
                  );
                }

                return (
                  <div
                    key={col.prop}
                    className={`border rounded-lg overflow-hidden ${
                      !isDisabled
                        ? "border-gray-200 dark:border-zinc-700"
                        : "border-gray-300 dark:border-zinc-600 opacity-50"
                    }`}
                  >
                    <div className="bg-gray-50 dark:bg-zinc-800 px-3 py-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            !isDisabled
                              ? "text-gray-800 dark:text-gray-100"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {col.name}
                        </span>
                        {!isVisible && !isDisabled && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                            (hidden)
                          </span>
                        )}
                        {isDisabled && disabledMessage && (
                           <span className="text-xs text-red-500 font-medium">
                            ({disabledMessage})
                           </span>
                        )}
                        {selectedValues.length > 0 && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs font-bold">
                            {selectedValues.length}
                          </span>
                        )}
                      </div>
                      {!isDisabled && (
                        <button
                          onClick={() => handleSelectAll(col.prop, currentValues)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          {allSelected ? "Deselect All" : "Select All"}
                        </button>
                      )}
                    </div>

                    {!isDisabled && currentValues.length > 5 && (
                      <div className="px-3 py-2 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            placeholder="Search values..."
                            value={searchTerms[col.prop] || ""}
                            onChange={(e) =>
                              setSearchTerms({
                                ...searchTerms,
                                [col.prop]: e.target.value,
                              })
                            }
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {!isDisabled && (
                    <div className="max-h-40 overflow-y-auto bg-white dark:bg-zinc-900">
                      {filteredValues.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                          No values found
                        </div>
                      ) : (
                        filteredValues.map((value) => (
                          <label
                            key={value}
                            className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors ${
                              !isVisible ? "cursor-not-allowed" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedValues.includes(value)}
                              onChange={(e) =>
                                handleColumnFilterChange(
                                  col.prop,
                                  value,
                                  e.target.checked
                                )
                              }
                              disabled={!isVisible}
                              className="h-4 w-4 text-blue-600 border-gray-300 dark:border-zinc-600 rounded focus:ring-blue-500"
                            />
                            <span
                              className={`text-sm ${
                                isVisible
                                  ? "text-gray-700 dark:text-gray-200"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {value}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

