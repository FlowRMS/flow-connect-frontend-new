/**
 * Picklist Values - Constants
 * Default values and label mappings for each picklist type
 */

import type { PicklistConfigs, PicklistKey } from './types';

// All picklists are stored under a single PICKLIST_SETTINGS key
// No mapping needed - all use the same key

// Default order types (cannot be deleted by admins)
export const DEFAULT_ORDER_TYPES = ['NORMAL', 'BLANKET', 'RELEASE', 'TAG', 'HOLD_FOR_RELEASE'] as const;

// Mapping for order type display labels
export const ORDER_TYPE_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  BLANKET: 'Blanket',
  RELEASE: 'Release',
  TAG: 'Tag',
  HOLD_FOR_RELEASE: 'Hold for Release',
};

// Configuration for all picklists
// Add new picklists here as needed
export const PICKLIST_CONFIGS: PicklistConfigs = {
  orderTypes: {
    defaultValues: DEFAULT_ORDER_TYPES,
    labelMap: ORDER_TYPE_LABELS,
  },
  // Future picklists can be added here:
  // lostReasons: {
  //   defaultValues: [],
  //   labelMap: {},
  // },
  // expenseCategories: {
  //   defaultValues: [],
  //   labelMap: {},
  // },
  // creditReasons: {
  //   defaultValues: [],
  //   labelMap: {},
  // },
};

// Helper to get default values for a specific picklist
export function getDefaultValues(picklistKey: PicklistKey): readonly string[] {
  return PICKLIST_CONFIGS[picklistKey]?.defaultValues || [];
}

// Helper to get label map for a specific picklist
export function getLabelMap(picklistKey: PicklistKey): Record<string, string> {
  return PICKLIST_CONFIGS[picklistKey]?.labelMap || {};
}
