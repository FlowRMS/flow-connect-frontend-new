"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Filter, X, ChevronDown, Search } from "lucide-react";

// Year filter options
const YEAR_OPTIONS = [
  { value: "current", label: "Current Year" },
  { value: "last", label: "Last Year" },
  { value: "last2", label: "Last 2 Years" },
  { value: "last3", label: "Last 3 Years" },
  { value: "all", label: "All Years" },
];

export function ComparisonTableFilter({
  data = [],
  entityColumnName = "customer", // 'customer', 'factory', or 'category'
  entityLabel = "Customer",
  filters = {},
  onFiltersChange,
  onClear,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const [placement, setPlacement] = useState("left");
  const [popupWidth, setPopupWidth] = useState(400);

  // Get unique entity values
  const entityValues = useMemo(() => {
    const uniqueValues = new Set();
    data.forEach((row) => {
      const value = row[entityColumnName];
      if (value !== null && value !== undefined && value !== "") {
        uniqueValues.add(String(value));
      }
    });
    return Array.from(uniqueValues).sort();
  }, [data, entityColumnName]);

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
      const margin = 16;
      const desiredWidth = 400;
      const maxWidth = Math.max(200, vw - margin * 2);
      const width = Math.min(desiredWidth, maxWidth);
      setPopupWidth(width);

      const spaceRight = vw - rect.right;
      const spaceLeft = rect.left;

      if (spaceRight < width + margin && spaceLeft >= width + margin) {
        setPlacement("right");
      } else {
        setPlacement("left");
      }
    };

    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [isOpen]);

  const handleYearChange = (yearOption) => {
    const newFilters = { ...filters };
    if (yearOption === "all") {
      delete newFilters._year;
    } else {
      newFilters._year = yearOption;
    }
    onFiltersChange(newFilters);
  };

  const handleEntityFilterChange = (value, checked) => {
    const newFilters = { ...filters };
    
    if (!newFilters[entityColumnName]) {
      newFilters[entityColumnName] = [];
    }

    if (checked) {
      if (!newFilters[entityColumnName].includes(value)) {
        newFilters[entityColumnName] = [...newFilters[entityColumnName], value];
      }
    } else {
      newFilters[entityColumnName] = newFilters[entityColumnName].filter((v) => v !== value);
      if (newFilters[entityColumnName].length === 0) {
        delete newFilters[entityColumnName];
      }
    }

    onFiltersChange(newFilters);
  };

  const handleSelectAll = () => {
    const newFilters = { ...filters };
    const currentSelected = newFilters[entityColumnName] || [];
    
    if (currentSelected.length === entityValues.length) {
      // Deselect all
      delete newFilters[entityColumnName];
    } else {
      // Select all
      newFilters[entityColumnName] = [...entityValues];
    }
    
    onFiltersChange(newFilters);
  };

  const getFilteredValues = () => {
    if (!searchTerm) return entityValues;
    return entityValues.filter((value) =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredValues = getFilteredValues();
  const selectedValues = filters[entityColumnName] || [];
  const allSelected = selectedValues.length === entityValues.length;

  const activeFilterCount = 
    (filters[entityColumnName]?.length > 0 ? 1 : 0) + 
    (filters._year && filters._year !== "all" ? 1 : 0);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all text-sm"
      >
        <Filter size={16} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-white text-purple-600 rounded-full text-xs font-bold">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 max-h-[500px] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 z-50 flex flex-col ${
            placement === "left" ? "left-0" : "right-0"
          }`}
          style={{ width: popupWidth }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-700 flex justify-between items-center">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                Filters
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Filter by {entityLabel.toLowerCase()} and year
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  onClear();
                  setSearchTerm("");
                }}
                className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>

          {/* Year Filter */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-700 bg-blue-50 dark:bg-zinc-800/50">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block">
              Year Range
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {YEAR_OPTIONS.map((option) => {
                const isActive = filters._year === option.value || (!filters._year && option.value === "all");
                return (
                  <button
                    key={option.value}
                    onClick={() => handleYearChange(option.value)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
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

          {/* Entity Filter */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-800 flex justify-between items-center border-b border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {entityLabel}
                </span>
                {selectedValues.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-xs font-bold">
                    {selectedValues.length}
                  </span>
                )}
              </div>
              <button
                onClick={handleSelectAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            </div>

            {entityValues.length > 5 && (
              <div className="px-3 py-2 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900">
              {filteredValues.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No values found
                </div>
              ) : (
                filteredValues.map((value) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(value)}
                      onChange={(e) =>
                        handleEntityFilterChange(value, e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 dark:border-zinc-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      {value}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
