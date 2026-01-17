import type { RecurrencePattern } from '@/lib/types/warehouse';

/**
 * Calculate next occurrence date based on recurrence pattern
 * Fixed version with proper logic for all frequency types
 */
export function calculateNextDate(pattern: RecurrencePattern, fromDate: Date = new Date()): Date {
  let result = new Date(fromDate);
  // Reset time to midnight for date-only operations
  result.setHours(0, 0, 0, 0);

  switch (pattern.frequency) {
    case 'DAILY':
      result.setDate(result.getDate() + pattern.interval);
      break;

    case 'WEEKLY':
    case 'BIWEEKLY': {
      const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const targetDay = pattern.dayOfWeek ? daysOfWeek.indexOf(pattern.dayOfWeek) : 1;
      const currentDay = result.getDay();

      // Calculate days until target day of week
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) {
        daysToAdd += 7; // Next occurrence is next week
      }

      // For "every N weeks", we want the next target day, not N weeks from now
      result.setDate(result.getDate() + daysToAdd);
      break;
    }

    case 'MONTHLY': {
      // Use dayOfMonth if specified, otherwise use the day from the original date
      const targetDay = pattern.dayOfMonth ?? result.getDate();

      // Move to next month(s)
      result.setMonth(result.getMonth() + pattern.interval);

      // Handle month-end edge cases (e.g., Jan 31 → Feb 28)
      const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
      result.setDate(Math.min(targetDay, lastDayOfMonth));
      break;
    }

    case 'MONTHLY_WEEK': {
      // Move to target month first, then find the day
      result.setMonth(result.getMonth() + pattern.interval);
      const targetMonth = result.getMonth(); // Store to ensure we stay in this month
      result.setDate(1);

      const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const targetDay = pattern.dayOfWeek ? daysOfWeek.indexOf(pattern.dayOfWeek) : 1;

      // Find first occurrence of target day in this month
      while (result.getDay() !== targetDay && result.getMonth() === targetMonth) {
        result.setDate(result.getDate() + 1);
      }

      if (pattern.weekOfMonth === 'LAST') {
        // Find last occurrence of target day in month
        let lastOccurrence = new Date(result);
        while (result.getMonth() === targetMonth) {
          lastOccurrence = new Date(result);
          result.setDate(result.getDate() + 7);
        }
        result = lastOccurrence;
      } else {
        // Calculate week offset
        const weekNumber = pattern.weekOfMonth === 'FIRST' ? 1
          : pattern.weekOfMonth === 'SECOND' ? 2
          : pattern.weekOfMonth === 'THIRD' ? 3
          : pattern.weekOfMonth === 'FOURTH' ? 4
          : 1;

        result.setDate(result.getDate() + (weekNumber - 1) * 7);

        // Verify we're still in the target month
        if (result.getMonth() !== targetMonth) {
          // This can happen if asking for "4th Friday" in a month with only 4 Fridays
          // Fall back to last occurrence
          result.setDate(result.getDate() - 7);
        }
      }
      break;
    }
  }

  return result;
}

/**
 * Parse date input, stripping time component
 * Ensures consistent date-only handling
 */
export function parseDateInput(value: string | Date): Date {
  if (value instanceof Date) {
    const result = new Date(value);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  // Handle ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
  const [datePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid date format: ${value}. Expected YYYY-MM-DD or ISO string.`);
  }

  return new Date(year, month - 1, day);
}

/**
 * Format date as YYYY-MM-DD (ISO date string)
 */
export function formatDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate human-readable description of recurrence pattern
 */
export function getRecurrenceDescription(pattern: RecurrencePattern): string {
  const dayLabels: Record<string, string> = {
    SUNDAY: 'Sunday',
    MONDAY: 'Monday',
    TUESDAY: 'Tuesday',
    WEDNESDAY: 'Wednesday',
    THURSDAY: 'Thursday',
    FRIDAY: 'Friday',
    SATURDAY: 'Saturday',
  };

  const weekLabels: Record<string, string> = {
    FIRST: 'first',
    SECOND: 'second',
    THIRD: 'third',
    FOURTH: 'fourth',
    LAST: 'last',
  };

  switch (pattern.frequency) {
    case 'DAILY':
      return pattern.interval === 1 ? 'Every day' : `Every ${pattern.interval} days`;

    case 'WEEKLY':
      return pattern.interval === 1
        ? `Every ${dayLabels[pattern.dayOfWeek || 'MONDAY']}`
        : `Every ${pattern.interval} weeks on ${dayLabels[pattern.dayOfWeek || 'MONDAY']}`;

    case 'BIWEEKLY':
      return `Every 2 weeks on ${dayLabels[pattern.dayOfWeek || 'MONDAY']}`;

    case 'MONTHLY':
      if (!pattern.dayOfMonth) {
        return pattern.interval === 1 ? 'Monthly' : `Every ${pattern.interval} months`;
      }
      return pattern.interval === 1
        ? `Monthly on the ${pattern.dayOfMonth}${getOrdinalSuffix(pattern.dayOfMonth)}`
        : `Every ${pattern.interval} months on the ${pattern.dayOfMonth}${getOrdinalSuffix(pattern.dayOfMonth)}`;

    case 'MONTHLY_WEEK':
      const week = weekLabels[pattern.weekOfMonth || 'FIRST'];
      const day = dayLabels[pattern.dayOfWeek || 'MONDAY'];
      return pattern.interval === 1
        ? `Monthly on the ${week} ${day}`
        : `Every ${pattern.interval} months on the ${week} ${day}`;

    default:
      return 'Custom schedule';
  }
}

/**
 * Get ordinal suffix for day number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Calculate multiple future occurrences
 * Useful for calendar preview
 */
export function calculateNextOccurrences(
  pattern: RecurrencePattern,
  startDate: Date,
  count: number
): Date[] {
  const occurrences: Date[] = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    currentDate = calculateNextDate(pattern, currentDate);
    occurrences.push(new Date(currentDate));
  }

  return occurrences;
}

/**
 * Validate recurrence pattern
 * Returns error message if invalid, null if valid
 */
export function validateRecurrencePattern(pattern: RecurrencePattern): string | null {
  if (pattern.interval < 1) {
    return 'Interval must be at least 1';
  }

  if (pattern.frequency === 'MONTHLY' && pattern.dayOfMonth) {
    if (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31) {
      return 'Day of month must be between 1 and 31';
    }
  }

  if ((pattern.frequency === 'WEEKLY' || pattern.frequency === 'BIWEEKLY' || pattern.frequency === 'MONTHLY_WEEK') && !pattern.dayOfWeek) {
    return 'Day of week is required for this frequency';
  }

  if (pattern.frequency === 'MONTHLY_WEEK' && !pattern.weekOfMonth) {
    return 'Week of month is required for this frequency';
  }

  return null;
}
