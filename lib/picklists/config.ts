/**
 * Picklist Definitions
 * Declarative configuration for each picklist in the system
 *
 * To add a new picklist:
 * 1. Add the key to PicklistKey enum in enums.ts
 * 2. Add the definition here with defaultItems
 * 3. That's it! The picklist is now available throughout the app
 */

import { PicklistKey, PicklistColor } from './enums';
import type { PicklistDefinition } from './types';

// ============================================================================
// Picklist Definitions
// ============================================================================

export const PICKLIST_DEFINITIONS: Record<PicklistKey, PicklistDefinition> = {
  [PicklistKey.ORDER_TYPES]: {
    key: PicklistKey.ORDER_TYPES,
    title: 'Order Types',
    description: 'Manage order type values used in orders.',
    helpText: 'Default values cannot be deleted but can be disabled, renamed, or reordered.',
    allowCustomValues: true,
    allowDisable: true,
    allowColors: true,
    allowReorder: true,
    defaultItems: [
      { key: 'NORMAL', label: 'Normal', sortOrder: 0, enabled: true, isDefault: true, color: PicklistColor.GRAY },
      { key: 'BLANKET', label: 'Blanket', sortOrder: 1, enabled: true, isDefault: true, color: PicklistColor.BLUE },
      { key: 'RELEASE', label: 'Release', sortOrder: 2, enabled: true, isDefault: true, color: PicklistColor.EMERALD },
      { key: 'TAG', label: 'Tag', sortOrder: 3, enabled: true, isDefault: true, color: PicklistColor.AMBER },
      { key: 'HOLD_FOR_RELEASE', label: 'Hold for Release', sortOrder: 4, enabled: true, isDefault: true, color: PicklistColor.RED },
      { key: 'STORM', label: 'Storm', sortOrder: 5, enabled: true, isDefault: true, color: PicklistColor.VIOLET },
    ],
  },

  [PicklistKey.PRE_OPPORTUNITY_STATUS]: {
    key: PicklistKey.PRE_OPPORTUNITY_STATUS,
    title: 'Pre Opportunity Status',
    description: 'Manage status values used in pre opportunities.',
    helpText: 'Default values cannot be deleted but can be disabled, renamed, or reordered.',
    allowCustomValues: true,
    allowDisable: true,
    allowColors: true,
    allowReorder: true,
    defaultItems: [
      { key: 'QUALIFIED', label: 'Qualified', sortOrder: 0, enabled: true, isDefault: true, color: PicklistColor.BLUE },
      { key: 'NEGOTIATION', label: 'Negotiation', sortOrder: 1, enabled: true, isDefault: true, color: PicklistColor.PURPLE },
      { key: 'FOLLOW_UP', label: 'Follow Up', sortOrder: 2, enabled: true, isDefault: true, color: PicklistColor.YELLOW },
      { key: 'WAITING_ON_FACTORY', label: 'Waiting on Factory', sortOrder: 3, enabled: true, isDefault: true, color: PicklistColor.ORANGE },
      { key: 'LOST', label: 'Lost', sortOrder: 4, enabled: true, isDefault: true, color: PicklistColor.RED },
      { key: 'WON', label: 'Won', sortOrder: 5, enabled: true, isDefault: true, color: PicklistColor.GREEN },
    ],
  },

  // Add more picklist definitions here as needed...
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get picklist definition with type-safety
 * @throws Error if picklist key is not found
 */
export function getPicklistDefinition(key: PicklistKey): PicklistDefinition {
  const definition = PICKLIST_DEFINITIONS[key];
  if (!definition) {
    throw new Error(`Unknown picklist key: ${key}`);
  }
  return definition;
}

/**
 * Get all available picklist keys
 */
export function getAllPicklistKeys(): PicklistKey[] {
  return Object.values(PicklistKey);
}

/**
 * Check if a string is a valid picklist key
 */
export function isValidPicklistKey(key: string): key is PicklistKey {
  return Object.values(PicklistKey).includes(key as PicklistKey);
}
