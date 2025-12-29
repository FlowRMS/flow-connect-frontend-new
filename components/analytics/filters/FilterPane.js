"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Filter,
  X,
  Search,
  ChevronDown,
  Calendar,
  Loader2,
  Check,
  ChevronUp
} from "lucide-react";
import {
  computeAdvancedFilterOptions,
  DEFAULT_EXCLUDED_COLUMNS,
  readAdvancedFilterCache,
  writeAdvancedFilterCache,
} from "@/lib/analytics/utils/advancedFilterCache";
import { useSidebarState } from "../layout/layout";

// Year filter options
const YEAR_OPTIONS = [
  { value: "all", label: "All Years" },
  { value: "current", label: "Current Year" },
  { value: "last", label: "Last Year" },
  { value: "last2", label: "Last 2 Years" },
  { value: "last3", label: "Last 3 Years" },
];

/**
 * Enhanced Filter Pane Component
 * 
 * Wide, professional filter panel with multiple filters per row
 * Collapsible - hidden by default, opens when button clicked
 */
export const FilterPane = ({
  columns = [],
  visibleColumns = [],
  data = [],
  filters = {},
  onFiltersChange,
  onClear,
  cacheKey,
  dataVersion,
  className = "",
  showYearFilter = true,
  maxFiltersPerRow = 3,
  maxWidth = 1100,
  screenMargin,
  filterMessages = {}, // Object mapping column prop to message { prop: "message text" }
}) => {
  const { isDesktopCollapsed } = useSidebarState();
  const effectiveScreenMargin = screenMargin ?? (isDesktopCollapsed ? 70 : 280);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerms, setSearchTerms] = useState({});
  const [expandedFilters, setExpandedFilters] = useState({});
  const [popupWidth, setPopupWidth] = useState(800);
  const [popupOffset, setPopupOffset] = useState(0);
  const containerRef = useRef(null);
  const [precomputedValues, setPrecomputedValues] = useState(() => {
    if (!cacheKey) return null;
    const cached = readAdvancedFilterCache(cacheKey);
    if (!cached) return null;
    if (cached.values && (dataVersion == null || cached.version === dataVersion)) {
      return cached.values;
    }
    return cached.values ?? null;
  });
  const [isComputing, setIsComputing] = useState(false);

  const filterableColumns = useMemo(
    () =>
      columns.filter(
        (col) => col && col.prop && !DEFAULT_EXCLUDED_COLUMNS.includes(col.prop)
      ),
    [columns]
  );

  const fallbackColumnValues = useMemo(() => {
    if (cacheKey) return {};
    if (!Array.isArray(data) || data.length === 0) return {};
    return computeAdvancedFilterOptions(data, columns, DEFAULT_EXCLUDED_COLUMNS);
  }, [cacheKey, data, columns]);

  const columnValues = precomputedValues ?? fallbackColumnValues;

  // Compute filter options
  useEffect(() => {
    if (!cacheKey) return;

    const cached = readAdvancedFilterCache(cacheKey);
    if (cached?.values && (dataVersion == null || cached.version === dataVersion)) {
      setPrecomputedValues(cached.values);
      setIsComputing(false);
      return;
    }

    if (!Array.isArray(filterableColumns) || filterableColumns.length === 0) {
      setPrecomputedValues({});
      setIsComputing(false);
      if (cacheKey) writeAdvancedFilterCache(cacheKey, dataVersion ?? null, {});
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      setPrecomputedValues({});
      setIsComputing(false);
      if (cacheKey) writeAdvancedFilterCache(cacheKey, dataVersion ?? null, {});
      return;
    }

    setIsComputing(true);
    let cancelled = false;

    const computeValues = () => {
      const computed = computeAdvancedFilterOptions(data, columns, DEFAULT_EXCLUDED_COLUMNS);
      if (cancelled) return;
      setPrecomputedValues(computed);
      setIsComputing(false);
      writeAdvancedFilterCache(cacheKey, dataVersion ?? Date.now(), computed);
    };

    if (typeof window !== "undefined") {
      const schedule = window.requestIdleCallback ?? ((fn) => window.setTimeout(fn, 16));
      const cancel = window.cancelIdleCallback ?? ((id) => window.clearTimeout(id));
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
      delete newFilters[columnProp];
    } else {
      newFilters[columnProp] = [...values];
    }

    onFiltersChange(newFilters);
  };

  const toggleFilterExpanded = (columnProp) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [columnProp]: !prev[columnProp],
    }));
  };

  const getFilteredValues = (columnProp, values) => {
    const searchTerm = searchTerms[columnProp] || "";
    if (!searchTerm) return values;
    return values.filter((value) =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const isColumnVisible = (columnProp) => {
    return visibleColumns.some((col) => col.prop === columnProp);
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => key !== "_year" && filters[key]?.length > 0
  ).length + (filters._year && filters._year !== "all" ? 1 : 0);

  // Filter out columns with no values to prevent grid gaps
  const columnsWithValues = filterableColumns.filter(col => {
    const values = columnValues[col.prop] || [];
    return values.length > 0;
  });

  // Group filters into rows - only include columns that have values
  const filterRows = [];
  for (let i = 0; i < columnsWithValues.length; i += maxFiltersPerRow) {
    filterRows.push(columnsWithValues.slice(i, i + maxFiltersPerRow));
  }

  // Close on outside click
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
      
      // Use effectiveScreenMargin for left side, and a standard small margin for right side
      const leftMargin = effectiveScreenMargin;
      const rightMargin = 16; 
      
      const desiredWidth = maxWidth;
      const availableWidth = Math.max(vw - leftMargin - rightMargin, 280);
      const width = Math.min(desiredWidth, availableWidth);
      setPopupWidth(width);

      const containerCenter = rect.left + rect.width / 2;
      const idealLeft = containerCenter - width / 2;
      
      const maxLeft = vw - rightMargin - width;
      const clampedLeft = Math.max(leftMargin, Math.min(maxLeft, idealLeft));
      setPopupOffset(clampedLeft - rect.left);
    };

    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [isOpen, effectiveScreenMargin, maxWidth]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-all"
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

      {/* Collapsible Filter Pane */}
      {isOpen && (
        <div
          className="absolute top-full mt-2 z-50 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            width: popupWidth,
            maxWidth: "calc(100vw - 2rem)",
            left: popupOffset,
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Advanced Filters</h3>
                <p className="text-xs text-blue-100">
                  {isComputing ? "Loading filter options..." : `${filterableColumns.length} available filters`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                  <span className="text-sm font-semibold text-white">
                    {activeFilterCount} active
                  </span>
                </div>
              )}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    onClear();
                    setSearchTerms({});
                  }}
                  className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Close filters"
              >
                <ChevronUp className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Filter Content */}
          <div className="p-6 space-y-6">
            {/* Year Filter */}
            {showYearFilter && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <label className="text-sm font-bold text-gray-900">Year Range</label>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {YEAR_OPTIONS.map((option) => {
                    const isActive =
                      filters._year === option.value || (!filters._year && option.value === "all");
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleYearChange(option.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md ${isActive
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                            : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300"
                          }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isComputing && (
              <div className="flex items-center justify-center gap-3 px-6 py-12 bg-white rounded-xl border-2 border-dashed border-blue-200">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-gray-600">
                  Preparing filter options...
                </span>
              </div>
            )}

            {/* Column Filters - Multiple per row */}
            {!isComputing && filterRows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(row.length, maxFiltersPerRow)}, 1fr)`,
                }}
              >
                {row.map((col) => {
                  const values = columnValues[col.prop] || [];
                  let currentValues = values;
                  let isDependencyDisabled = false;
                  let disabledMessage = "";

                  // Special handling for Factory Part Number
                  // Check both "factory" and "factoryTitle" as different reports use different column names
                  if (col.prop === "factoryPartNumber") {
                     // Find factory filter - check both possible keys
                     let factoryFilter = null;
                     let factoryDataField = null;

                     if (filters.factory && Array.isArray(filters.factory) && filters.factory.length > 0) {
                       factoryFilter = filters.factory;
                       factoryDataField = "factory";
                     } else if (filters.factoryTitle && Array.isArray(filters.factoryTitle) && filters.factoryTitle.length > 0) {
                       factoryFilter = filters.factoryTitle;
                       factoryDataField = "factoryTitle";
                     }

                     if (!factoryFilter) {
                       isDependencyDisabled = true;
                       disabledMessage = "Select a Factory first";
                       currentValues = [];
                     } else {
                       // Filter values based on selected factories
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
                  const isExpanded = expandedFilters[col.prop];
                  const allSelected = currentValues.length > 0 && selectedValues.length === currentValues.length;
                  
                  const isDisabled = !isVisible || isDependencyDisabled;

                  return (
                    <div
                      key={col.prop}
                      className={`bg-white rounded-xl border-2 shadow-sm overflow-hidden transition-all ${!isDisabled
                          ? selectedValues.length > 0
                            ? "border-blue-400 shadow-md"
                            : "border-gray-200 hover:border-blue-300"
                          : "border-gray-300 opacity-60"
                        }`}
                    >
                      {/* Filter Message - if provided or dependency disabled */}
                      {(filterMessages[col.prop] || disabledMessage) && (
                        <div className={`px-3 py-2 border-b ${disabledMessage ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                          <p className={`text-xs font-medium flex items-center gap-1 ${disabledMessage ? "text-red-800" : "text-amber-800"}`}>
                            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{disabledMessage || filterMessages[col.prop]}</span>
                          </p>
                        </div>
                      )}
                      {/* Filter Header */}
                      <div
                        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${selectedValues.length > 0
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50"
                            : "bg-gray-50 hover:bg-blue-50"
                          } ${isDisabled ? "cursor-not-allowed" : ""}`}
                        onClick={() => !isDisabled && toggleFilterExpanded(col.prop)}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={`text-sm font-bold truncate ${!isDisabled ? "text-gray-900" : "text-gray-500"
                              }`}
                          >
                            {col.name}
                          </span>
                          {!isVisible && !isDependencyDisabled && (
                            <span className="text-xs text-gray-400 italic">(hidden)</span>
                          )}
                          {selectedValues.length > 0 && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                              {selectedValues.length}
                            </span>
                          )}
                        </div>
                        {!isDisabled && (
                        <ChevronDown
                          className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ml-2 ${isExpanded ? "rotate-180" : ""
                            }`}
                        />
                        )}
                      </div>

                      {/* Filter Body - Collapsible */}
                      {isExpanded && !isDisabled && (
                        <div className="border-t border-gray-200">
                          {/* Select All / Search */}
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAll(col.prop, currentValues);
                              }}
                              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                            >
                              {allSelected ? (
                                <>
                                  <X className="h-3 w-3" />
                                  Deselect All
                                </>
                              ) : (
                                <>
                                  <Check className="h-3 w-3" />
                                  Select All
                                </>
                              )}
                            </button>
                            {currentValues.length > 5 && (
                              <div className="relative flex-1 max-w-[200px]">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search..."
                                  value={searchTerms[col.prop] || ""}
                                  onChange={(e) =>
                                    setSearchTerms({
                                      ...searchTerms,
                                      [col.prop]: e.target.value,
                                    })
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            )}
                          </div>

                          {/* Values List */}
                          <div className="max-h-48 overflow-y-auto">
                            {filteredValues.length === 0 ? (
                              <div className="px-4 py-3 text-xs text-gray-500 text-center">
                                No values found
                              </div>
                            ) : (
                              filteredValues.map((value) => (
                                <label
                                  key={value}
                                  className={`flex items-center gap-2 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${!isVisible ? "cursor-not-allowed opacity-50" : ""
                                    }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedValues.includes(value)}
                                    onChange={(e) =>
                                      handleColumnFilterChange(col.prop, value, e.target.checked)
                                    }
                                    disabled={!isVisible}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                  />
                                  <span className="text-sm text-gray-700 truncate flex-1">
                                    {value}
                                  </span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Empty State */}
            {!isComputing && columnsWithValues.length === 0 && (
              <div className="text-center py-12 px-6 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <Filter className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No filterable columns available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

