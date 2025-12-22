/**
 * Orders List - Constants
 * Re-export status labels and colors from lib/types/rms
 */

// Re-export from lib/types/rms
export {
  orderStatusLabels,
  orderStatusColors,
  fulfillmentStatusLabels,
  fulfillmentStatusColors,
  billingStatusLabels,
  billingStatusColors,
  commissionStatusLabels,
  commissionStatusColors,
} from '@/lib/types/rms';

export type {
  OrderStatus,
  FulfillmentStatus,
  BillingStatus,
  CommissionStatus,
} from '@/lib/types/rms';

// Quick date filter options
export const QUICK_DATE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
] as const;

// Quick date field options
export const QUICK_DATE_FIELD_OPTIONS = [
  { value: 'createdAt', label: 'Create Date' },
  { value: 'orderDate', label: 'Order Date' },
] as const;

// Credit reason options
export const CREDIT_REASON_OPTIONS = [
  { value: '', label: 'Choose' },
  { value: 'price_adjustment', label: 'Price Adjustment' },
  { value: 'return', label: 'Return' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'other', label: 'Other' },
] as const;
