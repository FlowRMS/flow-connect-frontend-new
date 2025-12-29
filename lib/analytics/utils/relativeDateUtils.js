import { 
  startOfDay, 
  endOfDay, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  startOfQuarter, 
  endOfQuarter, 
  subQuarters, 
  startOfYear, 
  endOfYear, 
  subYears, 
  format 
} from "date-fns";

/**
 * Relative date period options for the dropdown
 */
export const RELATIVE_DATE_OPTIONS = [
  { value: "custom", label: "Custom Range" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "last30days", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisQuarter", label: "This Quarter" },
  { value: "lastQuarter", label: "Last Quarter" },
  { value: "thisYear", label: "This Year" },
  { value: "lastYear", label: "Last Year" }
];

/**
 * Date field mapping for each page
 */
export const DATE_FIELD_MAPPING = {
  "orders-detail": "Due Date",
  "check-detail": "Check Date",
  "quote-detail": "Quote Date", 
  "invoice-detail": "Entry Date",
  "order-split-rate": "Entity Date",
  "quote-pivot": "Quote Date",
  "check-pivot": "Check Date",
  "order-pivot": "Order Date", 
  "invoice-pivot": "Invoice Date",
  "commission-pivot": "Commission Date"
};

/**
 * Get the current timezone offset or fall back to browser timezone
 */
function getCurrentTimezone() {
  // Try to get app timezone from environment or config
  // For now, fall back to browser timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Calculate date range for a relative period
 * @param {string} period - The relative period (e.g., "today", "lastMonth")
 * @param {Date} referenceDate - Optional reference date (defaults to now)
 * @returns {Object} Object with startDate, endDate, and label
 */
export function calculateRelativeDateRange(period, referenceDate = new Date()) {
  const now = referenceDate;
  let startDate, endDate, label;

  switch (period) {
    case "today":
      startDate = startOfDay(now);
      endDate = now; // Current time, not end of day
      label = "Today";
      break;

    case "yesterday":
      const yesterday = addDays(now, -1);
      startDate = startOfDay(yesterday);
      endDate = endOfDay(yesterday);
      label = "Yesterday";
      break;

    case "last7days":
      startDate = startOfDay(addDays(now, -6)); // today-6 for inclusive 7 days
      endDate = now;
      label = "Last 7 Days";
      break;

    case "last30days":
      startDate = startOfDay(addDays(now, -29)); // today-29 for inclusive 30 days
      endDate = now;
      label = "Last 30 Days";
      break;

    case "thisMonth":
      startDate = startOfMonth(now);
      endDate = now;
      label = "This Month";
      break;

    case "lastMonth":
      const lastMonth = subMonths(now, 1);
      startDate = startOfMonth(lastMonth);
      endDate = endOfMonth(lastMonth);
      label = "Last Month";
      break;

    case "thisQuarter":
      startDate = startOfQuarter(now);
      endDate = now;
      label = "This Quarter";
      break;

    case "lastQuarter":
      const lastQuarter = subQuarters(now, 1);
      startDate = startOfQuarter(lastQuarter);
      endDate = endOfQuarter(lastQuarter);
      label = "Last Quarter";
      break;

    case "thisYear":
      startDate = startOfYear(now);
      endDate = now;
      label = "This Year";
      break;

    case "lastYear":
      const lastYear = subYears(now, 1);
      startDate = startOfYear(lastYear);
      endDate = endOfYear(lastYear);
      label = "Last Year";
      break;

    default:
      return null;
  }

  return {
    startDate,
    endDate,
    label
  };
}

/**
 * Format date range for display
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {string} Formatted date range string
 */
export function formatDateRangeDisplay(startDate, endDate) {
  if (!startDate || !endDate) return "";
  
  const startFormatted = format(startDate, "MMM d, yyyy");
  const endFormatted = format(endDate, "MMM d, yyyy");
  
  return `${startFormatted} – ${endFormatted}`;
}

/**
 * Convert Date object to yyyy-MM-dd format for form inputs
 * @param {Date} date 
 * @returns {string} Date in yyyy-MM-dd format
 */
export function formatDateForInput(date) {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

/**
 * Convert date string from yyyy-MM-dd to MM-DD-YYYY format for display
 * @param {string} dateStr - Date string in yyyy-MM-dd format
 * @returns {string} Date in MM-DD-YYYY format
 */
export function formatDateForDisplay(dateStr) {
  if (!dateStr) return "";
  
  // Parse yyyy-MM-dd format
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  
  const [year, month, day] = parts;
  return `${month}-${day}-${year}`;
}

/**
 * Detect if two date strings represent a known relative period
 * @param {string} startDateStr - Start date in yyyy-MM-dd format
 * @param {string} endDateStr - End date in yyyy-MM-dd format
 * @returns {string|null} The relative period value or null if not a match
 */
export function detectRelativePeriod(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return null;

  const startDate = new Date(startDateStr + "T00:00:00");
  const endDate = new Date(endDateStr + "T23:59:59");
  const now = new Date();

  // Check each relative period to see if the dates match
  for (const option of RELATIVE_DATE_OPTIONS) {
    if (option.value === "custom") continue;

    const calculated = calculateRelativeDateRange(option.value, now);
    if (!calculated) continue;

    const calcStart = startOfDay(calculated.startDate);
    const calcEnd = startOfDay(calculated.endDate);
    const inputStart = startOfDay(startDate);
    const inputEnd = startOfDay(endDate);

    // For periods that end "now", we need special handling
    if (["today", "last7days", "last30days", "thisMonth", "thisQuarter", "thisYear"].includes(option.value)) {
      // Check if start matches and end is within the same day as now
      if (calcStart.getTime() === inputStart.getTime() && 
          Math.abs(calcEnd.getTime() - inputEnd.getTime()) < 24 * 60 * 60 * 1000) {
        return option.value;
      }
    } else {
      // For complete periods, check exact matches
      if (calcStart.getTime() === inputStart.getTime() && 
          calcEnd.getTime() === inputEnd.getTime()) {
        return option.value;
      }
    }
  }

  return null;
}