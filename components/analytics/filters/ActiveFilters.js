"use client";

import React from "react";
import { X, Filter, Calendar, Database } from "lucide-react";
import { formatDateForDisplay } from "@/lib/analytics/utils/relativeDateUtils";

/**
 * ActiveFilters Component - Shows applied filters with ability to remove them
 * 
 * Displays filter badges above tables to show what filters are currently active
 * Users can click X on any badge to remove that specific filter
 */
export const ActiveFilters = (props) => {
  const {
    filters = {},
    onRemoveFilter,
    onClearAll,
    dateRange = null,
    onClearDateRange,
    filterByDate = null,
    className = "",
  } = props;
  
  // Calculate total active filters
  const columnFilters = Object.keys(filters).filter(
    (key) => key !== "_year" && filters[key] && filters[key].length > 0
  );
  
  const hasYearFilter = filters._year && filters._year !== "all";
  const hasDateRange = dateRange?.startDate || dateRange?.endDate;
  
  const totalFilters =
    columnFilters.length +
    (hasYearFilter ? 1 : 0) +
    (hasDateRange ? 1 : 0);

  if (totalFilters === 0) {
    return null;
  }

  const getYearLabel = (yearValue) => {
    const yearOptions = {
      current: "Current Year",
      last: "Last Year",
      last2: "Last 2 Years",
      last3: "Last 3 Years",
    };
    return yearOptions[yearValue] || yearValue;
  };

  const getDateRangeLabel = () => {
    if (!dateRange) return "";
    const { startDate, endDate } = dateRange;
    
    let label = "";
    if (startDate && endDate) {
      label = `${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)}`;
    } else if (startDate) {
      label = `From ${formatDateForDisplay(startDate)}`;
    } else if (endDate) {
      label = `Until ${formatDateForDisplay(endDate)}`;
    }
    
    // Add filter by date type if provided
    if (label && filterByDate) {
      const filterTypeLabel = filterByDate === "ENTITY_DATE" ? "Entity Date" : "Entry Date";
      label = `${label} (${filterTypeLabel})`;
    }
    
    return label;
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex items-start gap-4">
        {/* Icon and Title */}
        <div className="flex items-center gap-2 pt-1">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Filter className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Active Filters
            </h4>
            <p className="text-xs text-gray-600">
              {totalFilters} filter{totalFilters !== 1 ? "s" : ""} applied
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex-1 flex flex-wrap gap-2">
          {/* Date Range Filter */}
          {hasDateRange && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 rounded-lg shadow-sm hover:shadow-md transition-shadow group">
              <Calendar className="h-4 w-4 text-blue-600" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500">Date Range</span>
                <span className="text-sm font-semibold text-gray-900">
                  {getDateRangeLabel()}
                </span>
              </div>
              <button
                onClick={onClearDateRange}
                className="p-1 rounded-full hover:bg-red-100 transition-colors"
                title="Remove date range filter"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
            </div>
          )}

          {/* Year Filter */}
          {hasYearFilter && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 rounded-lg shadow-sm hover:shadow-md transition-shadow group">
              <Calendar className="h-4 w-4 text-purple-600" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500">Year</span>
                <span className="text-sm font-semibold text-gray-900">
                  {getYearLabel(filters._year)}
                </span>
              </div>
              <button
                onClick={() => onRemoveFilter("_year")}
                className="p-1 rounded-full hover:bg-red-100 transition-colors"
                title="Remove year filter"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
            </div>
          )}

          {/* Column Filters */}
          {columnFilters.map((columnKey) => {
            const filterValues = filters[columnKey];
            const displayValue =
              filterValues.length === 1
                ? filterValues[0]
                : `${filterValues.length} selected`;

            return (
              <div
                key={columnKey}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 rounded-lg shadow-sm hover:shadow-md transition-shadow group"
              >
                <Database className="h-4 w-4 text-green-600" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-500">
                    {columnKey}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 max-w-[200px] truncate">
                    {displayValue}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveFilter(columnKey)}
                  className="p-1 rounded-full hover:bg-red-100 transition-colors"
                  title={`Remove ${columnKey} filter`}
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Clear All Button */}
        <button
          onClick={onClearAll}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear All
        </button>
      </div>
    </div>
  );
};

