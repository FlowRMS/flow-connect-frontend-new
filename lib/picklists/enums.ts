/**
 * Picklist Enums
 * Centralized enums for type-safe picklist operations
 */

// ============================================================================
// Picklist Keys - Unique identifiers for each picklist
// ============================================================================

export enum PicklistKey {
  ORDER_TYPES = 'orderTypes',
  // Add more picklists here as needed...
}

// ============================================================================
// Picklist Colors - Predefined Tailwind color palette
// ============================================================================

export enum PicklistColor {
  GRAY = '#6B7280',      // gray-500
  RED = '#EF4444',       // red-500
  ORANGE = '#F97316',    // orange-500
  AMBER = '#F59E0B',     // amber-500
  YELLOW = '#EAB308',    // yellow-500
  LIME = '#84CC16',      // lime-500
  GREEN = '#22C55E',     // green-500
  EMERALD = '#10B981',   // emerald-500
  TEAL = '#14B8A6',      // teal-500
  CYAN = '#06B6D4',      // cyan-500
  SKY = '#0EA5E9',       // sky-500
  BLUE = '#3B82F6',      // blue-500
  INDIGO = '#6366F1',    // indigo-500
  VIOLET = '#8B5CF6',    // violet-500
  PURPLE = '#A855F7',    // purple-500
  FUCHSIA = '#D946EF',   // fuchsia-500
  PINK = '#EC4899',      // pink-500
  ROSE = '#F43F5E',      // rose-500
}

// Color options metadata for the color picker UI
export interface PicklistColorOption {
  key: PicklistColor;
  name: string;
  tailwind: string;
}

export const PICKLIST_COLOR_OPTIONS: PicklistColorOption[] = [
  { key: PicklistColor.GRAY, name: 'Gray', tailwind: 'gray-500' },
  { key: PicklistColor.RED, name: 'Red', tailwind: 'red-500' },
  { key: PicklistColor.ORANGE, name: 'Orange', tailwind: 'orange-500' },
  { key: PicklistColor.AMBER, name: 'Amber', tailwind: 'amber-500' },
  { key: PicklistColor.YELLOW, name: 'Yellow', tailwind: 'yellow-500' },
  { key: PicklistColor.LIME, name: 'Lime', tailwind: 'lime-500' },
  { key: PicklistColor.GREEN, name: 'Green', tailwind: 'green-500' },
  { key: PicklistColor.EMERALD, name: 'Emerald', tailwind: 'emerald-500' },
  { key: PicklistColor.TEAL, name: 'Teal', tailwind: 'teal-500' },
  { key: PicklistColor.CYAN, name: 'Cyan', tailwind: 'cyan-500' },
  { key: PicklistColor.SKY, name: 'Sky', tailwind: 'sky-500' },
  { key: PicklistColor.BLUE, name: 'Blue', tailwind: 'blue-500' },
  { key: PicklistColor.INDIGO, name: 'Indigo', tailwind: 'indigo-500' },
  { key: PicklistColor.VIOLET, name: 'Violet', tailwind: 'violet-500' },
  { key: PicklistColor.PURPLE, name: 'Purple', tailwind: 'purple-500' },
  { key: PicklistColor.FUCHSIA, name: 'Fuchsia', tailwind: 'fuchsia-500' },
  { key: PicklistColor.PINK, name: 'Pink', tailwind: 'pink-500' },
  { key: PicklistColor.ROSE, name: 'Rose', tailwind: 'rose-500' },
];

// Helper to validate if a string is a valid picklist color
export function isValidPicklistColor(color: string): color is PicklistColor {
  return Object.values(PicklistColor).includes(color as PicklistColor);
}
