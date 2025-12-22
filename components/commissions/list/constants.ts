/**
 * Commissions List - Constants
 * Re-export status labels and colors from lib/types/rms
 */

// Re-export from lib/types/rms
export {
  checkStatusLabels,
  checkStatusColors,
} from '@/lib/types/rms';

export type {
  CheckStatus,
} from '@/lib/types/rms';

// Quick date filter options
export const QUICK_DATE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
] as const;

// Quick date field options (for commissions: entryDate and commissionMonth)
export const QUICK_DATE_FIELD_OPTIONS = [
  { value: 'entryDate', label: 'Entry Date' },
  { value: 'commissionMonth', label: 'Commission Month' },
] as const;

