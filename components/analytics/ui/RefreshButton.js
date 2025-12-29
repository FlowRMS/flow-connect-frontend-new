"use client";

import React from "react";
import { RefreshCw } from "lucide-react";

/**
 * RefreshButton - A reusable button for refreshing cached data
 * 
 * @param {Object} props
 * @param {boolean} props.hasCachedData - Whether data is currently cached
 * @param {Function} props.onRefresh - Callback to refresh the data
 * @param {boolean} props.isRefreshing - Whether a refresh is in progress
 * @param {boolean} props.disabled - Whether the button should be disabled
 * @param {boolean} props.showStaticMessage - Whether to show "Data is static for 1 hour" message (default: false)
 * @param {string} props.staticMessageDuration - Custom duration text (default: "1 hour")
 */
export function RefreshButton({
  hasCachedData = false,
  onRefresh,
  isRefreshing = false,
  disabled = false,
  showStaticMessage = false,
  staticMessageDuration = "1 hour",
}) {
  const isDisabled = disabled || isRefreshing;

  return (
    <div className="flex items-center gap-3">
      {showStaticMessage && hasCachedData && (
        <span className="text-xs text-gray-500 dark:text-gray-400 italic hidden sm:inline">
          Data is static for {staticMessageDuration} until refreshed
        </span>
      )}
      <button
        onClick={onRefresh}
        disabled={isDisabled}
        className="px-3 sm:px-4 py-2 flex gap-1 sm:gap-2 items-center bg-white border border-gray-300 text-gray-700 rounded-lg font-medium shadow-sm hover:bg-gray-50 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title={hasCachedData ? "Data is static for 1 hour until refresh is clicked" : "Fetch data"}
      >
        <RefreshCw
          size={16}
          className={isRefreshing ? "animate-spin" : ""}
        />
        <span className="hidden sm:inline">
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </span>
      </button>
    </div>
  );
}
