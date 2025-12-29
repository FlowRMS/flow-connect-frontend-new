/**
 * YTD Mode utility functions
 * Provides date range calculations and helper text generation for YTD Mode
 */

export interface YTDRanges {
  current: {
    start: Date;
    end: Date;
  };
  previous: {
    start: Date;
    end: Date;
  };
}

/**
 * Calculate current and previous YTD ranges based on asOf date
 * Handles leap year edge cases (Feb 29 -> Feb 28 for non-leap years)
 */
export function getYTDRanges(asOf: Date = new Date()): YTDRanges {
  const asOfLocal = new Date(asOf.getTime());
  const currentYear = asOfLocal.getFullYear();
  const previousYear = currentYear - 1;

  // Current YTD: Jan 1 of current year to asOf (inclusive)
  const currStart = new Date(currentYear, 0, 1);
  const currEnd = new Date(
    asOfLocal.getFullYear(),
    asOfLocal.getMonth(),
    asOfLocal.getDate()
  );

  // Previous YTD: Jan 1 of previous year to same month/day in previous year
  const prevStart = new Date(previousYear, 0, 1);

  // Handle leap year: if asOf is Feb 29 and previous year is not a leap year, use Feb 28
  const prevMonth = asOfLocal.getMonth();
  let prevDay = asOfLocal.getDate();

  if (prevMonth === 1 && prevDay === 29) {
    // Check if previous year is leap year
    const isPrevYearLeap =
      (previousYear % 4 === 0 && previousYear % 100 !== 0) ||
      previousYear % 400 === 0;
    if (!isPrevYearLeap) {
      prevDay = 28;
    }
  }

  const prevEnd = new Date(previousYear, prevMonth, prevDay);

  return {
    current: {
      start: currStart,
      end: currEnd,
    },
    previous: {
      start: prevStart,
      end: prevEnd,
    },
  };
}

/**
 * Format date as "MMM DD, YYYY" (e.g., "Oct 24, 2025")
 */
export function formatYTDDate(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Generate helper text for YTD Mode
 * Example:
 *   Current YTD: Jan 1, 2025 → Oct 24, 2025
 *   Previous YTD: Jan 1, 2024 → Oct 24, 2024
 */
export function formatYTDHelperText(asOf: Date = new Date()): {
  current: string;
  previous: string;
} {
  const ranges = getYTDRanges(asOf);

  return {
    current: `Jan 1, ${ranges.current.start.getFullYear()} → ${formatYTDDate(ranges.current.end)}`,
    previous: `Jan 1, ${ranges.previous.start.getFullYear()} → ${formatYTDDate(ranges.previous.end)}`,
  };
}

/**
 * Check if a date falls within a specific YTD range
 * Used for filtering records in YTD mode
 */
export function isDateInRange(
  date: Date | string | number | null | undefined,
  rangeStart: Date,
  rangeEnd: Date
): boolean {
  if (date == null) return false;

  const normalized = date instanceof Date ? new Date(date.getTime()) : new Date(date);
  if (Number.isNaN(normalized.getTime())) return false;

  // Zero out time components for day-level comparison
  const normalizedDay = new Date(
    normalized.getFullYear(),
    normalized.getMonth(),
    normalized.getDate()
  ).getTime();

  const rangeStartDay = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate()
  ).getTime();

  const rangeEndDay = new Date(
    rangeEnd.getFullYear(),
    rangeEnd.getMonth(),
    rangeEnd.getDate()
  ).getTime();

  return normalizedDay >= rangeStartDay && normalizedDay <= rangeEndDay;
}

export default {
  getYTDRanges,
  formatYTDDate,
  formatYTDHelperText,
  isDateInRange,
};
