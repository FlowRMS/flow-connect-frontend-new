/**
 * Picklist Values - Types
 * Generic types for managing picklist values (order types, lost reasons, etc.)
 */

// Key identifier for different picklist types
export type PicklistKey = 'orderTypes' | 'lostReasons' | 'expenseCategories' | 'creditReasons' | string;

// Configuration for a picklist (default values and optional label mapping)
export interface PicklistConfig {
  defaultValues: readonly string[];
  labelMap?: Record<string, string>; // Maps values to display labels
}

// Structure for storing picklist values (defaults + custom)
export interface PicklistValues {
  [key: PicklistKey]: {
    defaultValues: readonly string[];
    customValues: string[];
    labelMap?: Record<string, string>;
  };
}

// Result type for getting all values (default + custom)
export interface PicklistOption {
  value: string;
  label: string;
  isDefault: boolean;
}

// Type for picklist-specific configurations
export interface PicklistConfigs {
  [key: PicklistKey]: PicklistConfig;
}
