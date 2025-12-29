"use client";

import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { cn } from "@/lib/analytics/lib/cn";

const DataGridSkeleton = ({
  rows = 8,
  columns = 5,
  height = 500,
  title = null,
  searchable = true,
  className,
  showStats = false,
  columnWidths = [],
}) => {
  const containerStyle =
    typeof height === "number" ? { height: `${height}px` } : { height };

  const defaultColumnWidths = Array.from({ length: columns }, (_, index) => {
    const widths = [120, 150, 100, 180, 140, 160, 130, 170];
    return widths[index % widths.length];
  });

  const finalColumnWidths =
    columnWidths.length > 0 ? columnWidths : defaultColumnWidths;

  return (
    <SkeletonTheme baseColor="#f1f5f9" highlightColor="#f8fafc" duration={1.5}>
      <div
        className={cn(
          "revogrid-wrapper bg-white py-2 rounded-xl shadow border",
          className
        )}
      >
        <div className="grid-header-bar border-b flex items-center justify-between px-4 py-4">
          <div className="flex-1">
            {title && (
              <div className="mb-0">
                <Skeleton height={28} width={200} />
              </div>
            )}
          </div>
          {searchable && (
            <div>
              <Skeleton height={36} width={240} borderRadius={8} />
            </div>
          )}
        </div>

        {/* Stats Bar Skeleton (if enabled) */}
        {showStats && (
          <div className="px-4 py-2 border-b bg-gray-50">
            <div className="flex gap-4 items-center">
              <Skeleton height={20} width={120} />
              <div className="text-sm text-gray-500">•</div>
              <Skeleton height={20} width={80} />
            </div>
          </div>
        )}

        {/* Grid Container */}
        <div className="revogrid-container" style={containerStyle}>
          <div className="w-full">
            {/* Header Row Skeleton */}
            <div className="flex bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="px-4 py-3 border-r border-gray-200 last:border-r-0"
                  style={{
                    minWidth: `${finalColumnWidths[colIndex]}px`,
                    width: `${finalColumnWidths[colIndex]}px`,
                  }}
                >
                  <Skeleton height={16} width="85%" />
                </div>
              ))}
            </div>

            {/* Data Rows Skeleton */}
            <div className="divide-y divide-gray-100">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className={cn(
                    "flex transition-colors duration-150",
                    rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  )}
                >
                  {Array.from({ length: columns }).map((_, colIndex) => {
                    const seed = (rowIndex + 1) * 53 + (colIndex + 1) * 97;
                    const normalizedWidth = 60 + (seed % 41); // 60% - 100%
                    return (
                    <div
                      key={colIndex}
                      className="px-4 py-3 border-r border-gray-100 last:border-r-0"
                      style={{
                        minWidth: `${finalColumnWidths[colIndex]}px`,
                        width: `${finalColumnWidths[colIndex]}px`,
                      }}
                    >
                      <div className="flex items-center">
                        {/* Deterministic skeleton widths for hydration consistency */}
                        <Skeleton
                          height={14}
                          width={`${normalizedWidth}%`}
                          borderRadius={4}
                        />
                      </div>
                    </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Overlay with pulse effect */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[0.5px] pointer-events-none rounded-xl" />
      </div>
    </SkeletonTheme>
  );
};

// Predefined skeleton configurations for common use cases
export const DataGridSkeletonPresets = {
  // For order dashboards
  orderDashboard: {
    rows: 6,
    columns: 5,
    columnWidths: [150, 120, 180, 100, 140],
    showStats: true,
  },

  // For report grids
  reportGrid: {
    rows: 10,
    columns: 7,
    columnWidths: [120, 150, 100, 130, 110, 160, 120],
    showStats: true,
  },

  // For performance tables
  performanceTable: {
    rows: 8,
    columns: 6,
    columnWidths: [180, 120, 100, 140, 130, 150],
    showStats: false,
  },

  // For simple tables
  simple: {
    rows: 5,
    columns: 4,
    columnWidths: [150, 120, 100, 130],
    showStats: false,
  },
};

// Higher-order component for easy skeleton integration
export const withDataGridSkeleton = (Component, skeletonProps = {}) => {
  const WrappedComponent = React.forwardRef((props, ref) => {
    const { loading, ...restProps } = props;

    if (loading) {
      return (
        <DataGridSkeleton
          {...skeletonProps}
          title={restProps.title}
          searchable={restProps.searchable}
          height={restProps.height}
        />
      );
    }

    return <Component ref={ref} {...restProps} />;
  });

  WrappedComponent.displayName = `withDataGridSkeleton(${
    Component.displayName || Component.name || "Component"
  })`;
  return WrappedComponent;
};

// Add display name to the component
DataGridSkeleton.displayName = "DataGridSkeleton";
export default DataGridSkeleton;

