/**
 * Shared Date Utilities
 * Centralized date range calculations for quick filters across all modules
 */

/**
 * Quick date filter preset type
 * Supports both snake_case (orders, invoices, quotes, commissions) and camelCase (statements)
 */
export type QuickDatePreset =
  // Common
  | 'all'
  | 'today'
  | 'yesterday'
  // snake_case variants
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  // camelCase variants (aliases)
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear';

/**
 * Date range result type
 */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

/**
 * Get date range for quick date filter presets
 * Supports both snake_case and camelCase preset names
 *
 * @param preset - The quick date preset to calculate range for
 * @returns Object with start and end Date objects (or null for 'all')
 *
 * @example
 * // Get today's date range
 * const { start, end } = getQuickDateRange('today');
 *
 * @example
 * // Works with both conventions
 * getQuickDateRange('this_week'); // snake_case
 * getQuickDateRange('thisWeek');  // camelCase - same result
 */
export function getQuickDateRange(preset: QuickDatePreset | string): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Normalize preset to handle both conventions
  const normalizedPreset = preset.toLowerCase().replace(/_/g, '');

  switch (normalizedPreset) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 86400000 - 1), // 24h - 1ms
      };

    case 'yesterday': {
      const yesterday = new Date(today.getTime() - 86400000);
      return {
        start: yesterday,
        end: new Date(yesterday.getTime() + 86400000 - 1),
      };
    }

    case 'thisweek': {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { start: startOfWeek, end: endOfWeek };
    }

    case 'lastweek': {
      const dayOfWeek = today.getDay();
      const startOfThisWeek = new Date(today);
      startOfThisWeek.setDate(today.getDate() - dayOfWeek);
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      endOfLastWeek.setHours(23, 59, 59, 999);
      return { start: startOfLastWeek, end: endOfLastWeek };
    }

    case 'thismonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: startOfMonth, end: endOfMonth };
    }

    case 'lastmonth': {
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      return { start: startOfLastMonth, end: endOfLastMonth };
    }

    case 'thisquarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      const endOfQuarter = new Date(today.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
      return { start: startOfQuarter, end: endOfQuarter };
    }

    case 'lastquarter': {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const lastQuarter = currentQuarter - 1;
      const year = lastQuarter < 0 ? today.getFullYear() - 1 : today.getFullYear();
      const adjQuarter = lastQuarter < 0 ? 3 : lastQuarter;
      const startOfQuarter = new Date(year, adjQuarter * 3, 1);
      const endOfQuarter = new Date(year, adjQuarter * 3 + 3, 0, 23, 59, 59, 999);
      return { start: startOfQuarter, end: endOfQuarter };
    }

    case 'thisyear': {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start: startOfYear, end: endOfYear };
    }

    case 'lastyear': {
      const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { start: startOfLastYear, end: endOfLastYear };
    }

    case 'all':
    default:
      return { start: null, end: null };
  }
}

/**
 * Format a Date to ISO date string (YYYY-MM-DD)
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format a Date to backend datetime format (YYYY-MM-DD HH:MM:SS)
 */
export function formatDateToBackend(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
