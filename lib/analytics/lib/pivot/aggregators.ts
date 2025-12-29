export function sumSkipNulls(values: Array<number | null | undefined>): number {
  let total = 0;
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      total += value;
    }
  }
  return total;
}

/**
 * Interface for percentage difference contribution data.
 * Each row stores its contribution to the YTD and Previous YTD totals.
 * The aggregator sums these separately and calculates the percentage at the end.
 */
export interface PercentageDiffContribution {
  ytd: number;
  prevYtd: number;
}

/**
 * Custom aggregator for percentage difference that correctly calculates
 * the percentage from aggregated YTD and Previous YTD values.
 * 
 * Formula: ((Sum of YTD) - (Sum of Previous YTD)) / (Sum of Previous YTD) * 100
 * 
 * This ensures that when rows are aggregated in a pivot table, the percentage
 * is calculated from the totals, not summed from individual row percentages.
 * 
 * @param values - Array of PercentageDiffContribution objects or null/undefined
 * @returns The correctly calculated percentage difference as a decimal (e.g., 0.25 for 25%)
 */
export function percentageDiffAggregator(
  values: Array<PercentageDiffContribution | null | undefined>
): number | null {
  let totalYtd = 0;
  let totalPrevYtd = 0;
  let hasValidData = false;

  for (const value of values) {
    if (value && typeof value === "object") {
      if (typeof value.ytd === "number" && Number.isFinite(value.ytd)) {
        totalYtd += value.ytd;
        hasValidData = true;
      }
      if (typeof value.prevYtd === "number" && Number.isFinite(value.prevYtd)) {
        totalPrevYtd += value.prevYtd;
        hasValidData = true;
      }
    }
  }

  if (!hasValidData) {
    return null;
  }

  // Calculate percentage difference: (YTD - PrevYTD) / PrevYTD
  // Returns as decimal for percentage column type (0.25 = 25%)
  if (totalPrevYtd !== 0) {
    return (totalYtd - totalPrevYtd) / Math.abs(totalPrevYtd);
  } else if (totalYtd !== 0) {
    // New in current year (no previous year data)
    return 1; // 100% increase
  } else {
    // No data in either period
    return null;
  }
}

export default {
  sumSkipNulls,
  percentageDiffAggregator,
};
