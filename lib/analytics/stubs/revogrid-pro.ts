/**
 * Stub for @revolist/revogrid-pro
 * 
 * This module provides stubs for the revogrid-pro package which requires
 * a commercial license. The analytics module will work with basic functionality.
 */

// Plugin stubs - these return empty plugin objects
export const AdvanceFilterPlugin = {};
export const PivotPlugin = {};
export const RowOddPlugin = {};
export const RowSelectPlugin = {};
export const SameValueMergePlugin = {};
export const ExportExcelPlugin = {};

// Common aggregators for pivot tables
export const commonAggregators = {
  sum: (values: number[]) => values.reduce((a, b) => a + b, 0),
  count: (values: unknown[]) => values.length,
  avg: (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
  min: (values: number[]) => Math.min(...values),
  max: (values: number[]) => Math.max(...values),
  first: (values: unknown[]) => values[0],
  last: (values: unknown[]) => values[values.length - 1],
};

// Stub for other potential exports
export const RevoGridPro = {};

export default RevoGridPro;
