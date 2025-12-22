/**
 * Views Configuration
 * Predefined views for the check line items table
 */

import type { SavedView, ColumnKey } from '../types';
import { DEFAULT_VISIBLE_COLUMNS, COLUMN_LABELS } from '../constants';

/**
 * Saved views for check line items table
 */
export const SAVED_VIEWS: SavedView[] = [
  {
    id: 'default',
    name: 'Default',
    columns: DEFAULT_VISIBLE_COLUMNS,
  },
  {
    id: 'compact',
    name: 'Compact',
    columns: [
      'number',
      'orderNumber',
      'expectedCommission',
      'paidCommission',
      'balance',
    ],
  },
  {
    id: 'full',
    name: 'Full Details',
    columns: Object.keys(COLUMN_LABELS) as ColumnKey[],
  },
];

/**
 * Get view by id
 */
export const getViewById = (id: string): SavedView | undefined => {
  return SAVED_VIEWS.find((view) => view.id === id);
};

/**
 * Get default view
 */
export const getDefaultView = (): SavedView => {
  return SAVED_VIEWS[0];
};

