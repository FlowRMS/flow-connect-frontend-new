import type { RecurrencePattern } from '@/lib/types/warehouse';

export function calculateNextDate(pattern: RecurrencePattern, fromDate: Date = new Date()): Date {
  const result = new Date(fromDate);

  switch (pattern.frequency) {
    case 'DAILY':
      result.setDate(result.getDate() + pattern.interval);
      break;

    case 'WEEKLY':
    case 'BIWEEKLY': {
      const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const targetDay = pattern.dayOfWeek ? daysOfWeek.indexOf(pattern.dayOfWeek) : 1;
      const currentDay = result.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      const weekInterval = pattern.frequency === 'BIWEEKLY' ? 2 : Math.max(pattern.interval, 1);
      daysToAdd += 7 * (weekInterval - 1);
      result.setDate(result.getDate() + daysToAdd);
      break;
    }

    case 'MONTHLY': {
      const targetDay = pattern.dayOfMonth || result.getDate();
      result.setDate(1);
      result.setMonth(result.getMonth() + pattern.interval);
      if (pattern.dayOfMonth) {
        const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
        result.setDate(Math.min(targetDay, lastDay));
      }
      break;
    }

    case 'MONTHLY_WEEK': {
      result.setMonth(result.getMonth() + pattern.interval);
      result.setDate(1);

      const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const targetDay = pattern.dayOfWeek ? daysOfWeek.indexOf(pattern.dayOfWeek) : 1;
      const weekNumber = pattern.weekOfMonth === 'FIRST' ? 1 : pattern.weekOfMonth === 'SECOND' ? 2 :
                        pattern.weekOfMonth === 'THIRD' ? 3 : pattern.weekOfMonth === 'FOURTH' ? 4 : 5;

      while (result.getDay() !== targetDay) {
        result.setDate(result.getDate() + 1);
      }

      if (pattern.weekOfMonth === 'LAST') {
        const month = result.getMonth();
        while (result.getMonth() === month) {
          result.setDate(result.getDate() + 7);
        }
        result.setDate(result.getDate() - 7);
      } else {
        result.setDate(result.getDate() + (weekNumber - 1) * 7);
      }
      break;
    }
  }

  return result;
}

export function parseDateInput(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [datePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRecurrenceDescription(pattern: RecurrencePattern): string {
  const dayLabels: Record<string, string> = {
    SUNDAY: 'Sunday', MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
    THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday'
  };
  const weekLabels: Record<string, string> = {
    FIRST: 'first', SECOND: 'second', THIRD: 'third', FOURTH: 'fourth', LAST: 'last'
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
      return pattern.interval === 1
        ? `Monthly on the ${pattern.dayOfMonth}${getOrdinalSuffix(pattern.dayOfMonth || 1)}`
        : `Every ${pattern.interval} months on the ${pattern.dayOfMonth}${getOrdinalSuffix(pattern.dayOfMonth || 1)}`;
    case 'MONTHLY_WEEK':
      return pattern.interval === 1
        ? `Monthly on the ${weekLabels[pattern.weekOfMonth || 'FIRST']} ${dayLabels[pattern.dayOfWeek || 'MONDAY']}`
        : `Every ${pattern.interval} months on the ${weekLabels[pattern.weekOfMonth || 'FIRST']} ${dayLabels[pattern.dayOfWeek || 'MONDAY']}`;
    default:
      return 'Custom schedule';
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
