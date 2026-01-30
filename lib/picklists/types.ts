/**
 * Picklist Types
 * Core interfaces and types for the picklist system
 */

import { PicklistKey, PicklistColor } from './enums';

// ============================================================================
// Item Types
// ============================================================================

/** Represents a single value within a picklist */
export interface PicklistItem {
  /** Immutable identifier - used in entities and filters (never changes) */
  key: string;
  /** Editable display text shown in UI */
  label: string;
  /** Optional color from the predefined palette */
  color?: PicklistColor;
  /** Display order (lower numbers appear first) */
  sortOrder: number;
  /** Whether this item is available for new selections */
  enabled: boolean;
  /** Whether this is a system default (cannot be deleted) */
  isDefault: boolean;
}

/** Complete picklist data structure (stored in TenantSettings) */
export interface PicklistData {
  /** Array of picklist items */
  items: PicklistItem[];
  /** ISO timestamp of last modification */
  lastModified?: string;
  /** User ID who last modified */
  modifiedBy?: string;
}

// ============================================================================
// Definition Types (static configuration in code)
// ============================================================================

/** Static configuration for a picklist (defined in code, not editable by admin) */
export interface PicklistDefinition {
  /** Unique identifier (enum value) */
  key: PicklistKey;
  /** Title displayed in admin UI */
  title: string;
  /** Short description for admin UI */
  description: string;
  /** Additional help text (optional) */
  helpText?: string;
  /** Whether admin can add custom values */
  allowCustomValues: boolean;
  /** Whether admin can disable values */
  allowDisable: boolean;
  /** Whether color selection is available */
  allowColors: boolean;
  /** Whether drag & drop reordering is allowed */
  allowReorder: boolean;
  /** System default items (used when no config exists) */
  defaultItems: PicklistItem[];
}

// ============================================================================
// Settings Value (for TenantSettings storage)
// ============================================================================

/** All picklists stored under PICKLIST_SETTINGS key in TenantSettings */
export type PicklistSettingsValue = {
  [K in PicklistKey]?: PicklistData;
};

// ============================================================================
// Component Props Types
// ============================================================================

/** Display variant for PicklistValue component */
export type PicklistValueVariant = 'text' | 'badge';

/** Props for PicklistValue display component */
export interface PicklistValueProps {
  /** Which picklist to use */
  picklistKey: PicklistKey;
  /** The key value stored in the entity */
  value: string;
  /** Display style: 'text' (default) or 'badge' */
  variant?: PicklistValueVariant;
  /** Whether to show the color indicator */
  showColor?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Props for PicklistEditor admin component */
export interface PicklistEditorProps {
  /** Which picklist to edit */
  picklistKey: PicklistKey;
}

/** Props for PicklistFilter component */
export interface PicklistFilterProps {
  /** Which picklist to show options from */
  picklistKey: PicklistKey;
  /** Currently selected values (keys) */
  selectedValues: string[];
  /** Callback when a value is toggled */
  onToggleValue: (value: string) => void;
  /** Callback when filter is applied */
  onApply: () => void;
  /** Callback when filter is cleared */
  onClear?: () => void;
  /** Whether there's an active filter for this field */
  hasActiveFilter?: boolean;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/** Return type for usePicklist hook */
export interface UsePicklistReturn {
  /** All items (from saved config or defaults) */
  items: PicklistItem[];
  /** Only enabled items (for dropdowns/selectors) */
  enabledItems: PicklistItem[];
  /** Static definition for this picklist */
  definition: PicklistDefinition;
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Whether initial load is complete */
  isInitialized: boolean;
  /** Save updated items to TenantSettings */
  saveItems: (items: PicklistItem[]) => Promise<boolean>;
  /** Get item by key */
  getItemByKey: (key: string) => PicklistItem | undefined;
  /** Get label for a key (returns key if not found) */
  getLabelByKey: (key: string) => string;
  /** Get color for a key (returns undefined if not found) */
  getColorByKey: (key: string) => PicklistColor | undefined;
}
