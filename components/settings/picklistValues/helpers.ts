/**
 * Picklist Values - Helpers
 * Generic helper functions for working with picklist values
 */

import type { PicklistOption, PicklistKey } from './types';
import { getDefaultValues, getLabelMap } from './constants';

/**
 * Get all picklist options (default + custom) for a specific picklist
 * @param picklistKey - The key identifying the picklist type
 * @param customValues - Array of custom values added by admins
 * @returns Array of options with value, label, and isDefault flag
 */
export function getAllPicklistOptions(
  picklistKey: PicklistKey,
  customValues: string[] = []
): PicklistOption[] {
  const defaultValues = getDefaultValues(picklistKey);
  const labelMap = getLabelMap(picklistKey);

  // Map default values to options
  const defaultOptions: PicklistOption[] = defaultValues.map(value => ({
    value,
    label: labelMap[value] || value,
    isDefault: true,
  }));

  // Map custom values to options
  const customOptions: PicklistOption[] = customValues.map(value => ({
    value: value.toUpperCase(), // Normalize to uppercase
    label: value, // Use the value as label for custom entries
    isDefault: false,
  }));

  return [...defaultOptions, ...customOptions];
}

/**
 * Get display label for a picklist value
 * @param picklistKey - The key identifying the picklist type
 * @param value - The value to get label for
 * @returns The display label or the value itself if no mapping exists
 */
export function getPicklistLabel(picklistKey: PicklistKey, value: string): string {
  const labelMap = getLabelMap(picklistKey);
  return labelMap[value] || value;
}

/**
 * Validate if a value can be added to a picklist
 * @param picklistKey - The key identifying the picklist type
 * @param value - The value to validate
 * @param existingCustomValues - Array of existing custom values
 * @returns Object with isValid flag and optional error message
 */
export function validatePicklistValue(
  picklistKey: PicklistKey,
  value: string,
  existingCustomValues: string[] = []
): { isValid: boolean; error?: string } {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { isValid: false, error: 'Value cannot be empty' };
  }

  // Check if value already exists in defaults
  const defaultValues = getDefaultValues(picklistKey);
  if (defaultValues.includes(trimmedValue.toUpperCase() as any)) {
    return { isValid: false, error: 'This value already exists as a default value' };
  }

  // Check if value already exists in custom values
  if (existingCustomValues.some(v => v.toUpperCase() === trimmedValue.toUpperCase())) {
    return { isValid: false, error: 'This value already exists' };
  }

  return { isValid: true };
}

/**
 * Normalize a picklist value (uppercase, trimmed)
 * @param value - The value to normalize
 * @returns Normalized value
 */
export function normalizePicklistValue(value: string): string {
  return value.trim().toUpperCase();
}
