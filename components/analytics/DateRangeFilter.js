"use client";

import React, { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import { Calendar, X, ArrowRight, ChevronDown, Check } from "lucide-react";
import "react-day-picker/style.css";
import "@/app/analytics-styles/date-picker.css";
import {
  RELATIVE_DATE_OPTIONS,
  DATE_FIELD_MAPPING,
  calculateRelativeDateRange,
  formatDateRangeDisplay,
  formatDateForInput,
  detectRelativePeriod,
  getDefault2YearRange
} from "@/lib/analytics/utils/relativeDateUtils";

// Custom dropdown component for DayPicker that matches our design system
function CustomDropdown({ options, value, onChange, "aria-label": ariaLabel }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Find the selected option's label
  const selectedOption = options?.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption?.label || value;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    // Don't allow selection of disabled options
    if (option.disabled) return;

    if (onChange) {
      const syntheticEvent = {
        target: { value: String(option.value) }
      };
      onChange(syntheticEvent);
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        className="flex items-center justify-between gap-1 px-2 py-1 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-sm min-w-[80px]"
      >
        <span className="text-gray-700 dark:text-gray-200">{displayLabel}</span>
        <ChevronDown size={14} className={`text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-[100] bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 py-1 min-w-[100px] max-h-[200px] overflow-y-auto">
          {options?.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={option.disabled}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                option.disabled
                  ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                  : String(option.value) === String(value)
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DateRangeFilter({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  onClear, 
  disabled = false,
  pageKey = null,
  filterByDate = "ENTITY_DATE",
  onFilterByDateChange,
  onApply, // New prop for apply callback
  appliedStartDate, // Applied values for comparison
  appliedEndDate,
  appliedFilterByDate,
}) {
  const [pendingStartDate, setPendingStartDate] = useState(startDate);
  const [pendingEndDate, setPendingEndDate] = useState(endDate);
  const [pendingFilterByDate, setPendingFilterByDate] = useState(filterByDate);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showRelativeDropdown, setShowRelativeDropdown] = useState(false);
  const [showFilterByDateDropdown, setShowFilterByDateDropdown] = useState(false);
  const [selectedRelativePeriod, setSelectedRelativePeriod] = useState("custom");

  const startPickerRef = useRef(null);
  const endPickerRef = useRef(null);
  const relativeDropdownRef = useRef(null);
  const filterByDateDropdownRef = useRef(null);

  // Get the date field label for this page
  const dateFieldLabel = pageKey ? DATE_FIELD_MAPPING[pageKey] || "Date" : "Date";

  // Sync pending states with props
  useEffect(() => {
    setPendingStartDate(startDate);
    setPendingEndDate(endDate);
    setPendingFilterByDate(filterByDate);
  }, [startDate, endDate, filterByDate]);

  const toLocalDate = (value) => {
    if (!value) return undefined;
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  };

  const startDateObj = toLocalDate(pendingStartDate);
  const endDateObj = toLocalDate(pendingEndDate);

  // Check if there are pending changes
  const hasPendingChanges = 
    pendingStartDate !== appliedStartDate ||
    pendingEndDate !== appliedEndDate ||
    pendingFilterByDate !== appliedFilterByDate;

  // Detect if current dates match a relative period
  useEffect(() => {
    const detectedPeriod = detectRelativePeriod(pendingStartDate, pendingEndDate);
    if (detectedPeriod && detectedPeriod !== selectedRelativePeriod) {
      setSelectedRelativePeriod(detectedPeriod);
    } else if (!detectedPeriod && selectedRelativePeriod !== "custom") {
      setSelectedRelativePeriod("custom");
    }
  }, [pendingStartDate, pendingEndDate, selectedRelativePeriod]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (startPickerRef.current && !startPickerRef.current.contains(event.target)) {
        setShowStartPicker(false);
      }
      if (endPickerRef.current && !endPickerRef.current.contains(event.target)) {
        setShowEndPicker(false);
      }
      if (relativeDropdownRef.current && !relativeDropdownRef.current.contains(event.target)) {
        setShowRelativeDropdown(false);
      }
      if (filterByDateDropdownRef.current && !filterByDateDropdownRef.current.contains(event.target)) {
        setShowFilterByDateDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStartDateSelect = (date) => {
    if (date) {
      setPendingStartDate(format(date, "yyyy-MM-dd"));
      // When manually changing dates, reset to custom
      if (selectedRelativePeriod !== "custom") {
        setSelectedRelativePeriod("custom");
      }
    }
    setShowStartPicker(false);
  };

  const handleEndDateSelect = (date) => {
    if (date) {
      setPendingEndDate(format(date, "yyyy-MM-dd"));
      // When manually changing dates, reset to custom
      if (selectedRelativePeriod !== "custom") {
        setSelectedRelativePeriod("custom");
      }
    }
    setShowEndPicker(false);
  };

  const handleRelativePeriodChange = (periodValue) => {
    setSelectedRelativePeriod(periodValue);
    setShowRelativeDropdown(false);

    if (periodValue === "custom") {
      // Don't change the dates, just switch to custom mode
      return;
    }

    // Calculate the new date range
    const dateRange = calculateRelativeDateRange(periodValue);
    if (dateRange) {
      setPendingStartDate(formatDateForInput(dateRange.startDate));
      setPendingEndDate(formatDateForInput(dateRange.endDate));
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        startDate: pendingStartDate,
        endDate: pendingEndDate,
        filterByDate: pendingFilterByDate,
      });
    }
  };

  const handleClear = () => {
    const defaults = getDefault2YearRange();
    setPendingStartDate(defaults.startDate);
    setPendingEndDate(defaults.endDate);
    setPendingFilterByDate("ENTITY_DATE");
    if (onClear) {
      onClear();
    }
  };

  // Get the display text for the date range
  const getDateRangeDisplay = () => {
    if (!startDateObj || !endDateObj) return "";
    
    const selectedOption = RELATIVE_DATE_OPTIONS.find(opt => opt.value === selectedRelativePeriod);
    const dateRangeText = formatDateRangeDisplay(startDateObj, endDateObj);
    
    if (selectedRelativePeriod === "custom") {
      return `Custom (${dateRangeText})`;
    } else {
      return `${selectedOption?.label || ""} (${dateRangeText})`;
    }
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-900 dark:to-zinc-800 rounded-xl border border-blue-100 dark:border-zinc-700 p-4 shadow-md ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 rounded-lg p-2.5 shadow-sm">
            <Calendar size={20} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Filter by Date Range 
          </span>
        </div>

        <div className="flex items-center gap-3 flex-1">
          {/* Filter By Date Type Dropdown - Only show if onFilterByDateChange is provided */}
          {onFilterByDateChange && (
            <div ref={filterByDateDropdownRef} className="flex flex-col gap-1.5 min-w-[140px] max-w-[180px] relative">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                Filter By
              </label>
              <button
                onClick={() => setShowFilterByDateDropdown(!showFilterByDateDropdown)}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-sm text-left"
              >
                <span className="text-gray-700 dark:text-gray-200 truncate">
                  {pendingFilterByDate === "ENTITY_DATE" ? "Entity Date" : "Entry Date"}
                </span>
                <ChevronDown size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
              </button>
              {showFilterByDateDropdown && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 py-2 min-w-[160px]">
                  <button
                    onClick={() => {
                      setPendingFilterByDate("ENTITY_DATE");
                      setShowFilterByDateDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      pendingFilterByDate === "ENTITY_DATE"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700"
                    }`}
                  >
                    Entity Date
                  </button>
                  <button
                    onClick={() => {
                      setPendingFilterByDate("ENTRY_DATE");
                      setShowFilterByDateDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      pendingFilterByDate === "ENTRY_DATE"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700"
                    }`}
                  >
                    Entry Date
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Relative Date Dropdown */}
          <div ref={relativeDropdownRef} className="flex flex-col gap-1.5 min-w-[140px] max-w-[180px] relative">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Period
            </label>
            <button
              onClick={() => setShowRelativeDropdown(!showRelativeDropdown)}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-sm text-left"
            >
              <span className="text-gray-700 dark:text-gray-200 truncate">
                {RELATIVE_DATE_OPTIONS.find(opt => opt.value === selectedRelativePeriod)?.label || "Custom Range"}
              </span>
              <ChevronDown size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
            </button>
            {showRelativeDropdown && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 py-2 min-w-[160px]">
                {RELATIVE_DATE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleRelativePeriodChange(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      selectedRelativePeriod === option.value
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={startPickerRef} className="flex flex-col gap-1.5 flex-1 min-w-[160px] max-w-[220px] relative">
            <label htmlFor="start-date" className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Start Date
            </label>
            <button
              onClick={() => setShowStartPicker(!showStartPicker)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-sm text-left"
            >
              <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-200">
                {startDateObj ? format(startDateObj, "MMM dd, yyyy") : "Select date"}
              </span>
            </button>
            {showStartPicker && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-3">
                <DayPicker
                  mode="single"
                  selected={startDateObj}
                  defaultMonth={startDateObj || new Date()}
                  onSelect={handleStartDateSelect}
                  disabled={{ after: endDateObj }}
                  className="rdp-custom"
                  captionLayout="dropdown"
                  startMonth={new Date(2015, 0)}
                  endMonth={new Date()}
                  components={{ Dropdown: CustomDropdown }}
                  modifiersClassNames={{
                    selected: "bg-blue-500 text-white hover:bg-blue-600",
                    today: "font-bold text-blue-600 dark:text-blue-400"
                  }}
                />
              </div>
            )}
          </div>

          <ArrowRight size={20} className="text-gray-400 dark:text-gray-500 mt-5 flex-shrink-0" />

          <div ref={endPickerRef} className="flex flex-col gap-1.5 flex-1 min-w-[160px] max-w-[220px] relative">
            <label htmlFor="end-date" className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              End Date
            </label>
            <button
              onClick={() => setShowEndPicker(!showEndPicker)}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-md shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-sm text-left"
            >
              <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-200">
                {endDateObj ? format(endDateObj, "MMM dd, yyyy") : "Select date"}
              </span>
            </button>
            {showEndPicker && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-3">
                <DayPicker
                  mode="single"
                  selected={endDateObj}
                  defaultMonth={endDateObj || new Date()}
                  onSelect={handleEndDateSelect}
                  disabled={{ before: startDateObj }}
                  className="rdp-custom"
                  captionLayout="dropdown"
                  startMonth={new Date(2015, 0)}
                  endMonth={new Date()}
                  components={{ Dropdown: CustomDropdown }}
                  modifiersClassNames={{
                    selected: "bg-blue-500 text-white hover:bg-blue-600",
                    today: "font-bold text-blue-600 dark:text-blue-400"
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Apply and Clear buttons */}
        <div className="ml-auto flex items-center gap-2">
          {hasPendingChanges && (
            <button
              onClick={handleApply}
              disabled={!pendingStartDate && !pendingEndDate}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-sm font-medium text-sm"
              title="Apply date filter"
            >
              <Check size={16} />
              <span>Apply Filters</span>
            </button>
          )}
          {(appliedStartDate || appliedEndDate) && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm font-medium text-sm"
              title="Clear date filter"
            >
              <X size={16} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Range Display */}
      {(startDateObj && endDateObj) && (
        <div className="mt-3 px-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800/50 rounded-md px-3 py-2 border border-gray-200 dark:border-zinc-700">
            <span className="font-medium">Selected Range: </span>
            {getDateRangeDisplay()}
            {hasPendingChanges && (
              <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">(Not Applied)</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

