/**
 * Utility Functions for Campaigns and Rules
 * Note: getFieldsForEntity, getOperatorsForFieldType, and getStatusColor are now in types.ts
 * to align with the API-based field configurations
 */

import type { Contact, RuleCondition } from './types';

/**
 * Format date string to readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

/**
 * Filter contacts based on search query
 */
export function filterContactsBySearch(contacts: Contact[], searchQuery: string): Contact[] {
  if (!searchQuery) return contacts;

  const query = searchQuery.toLowerCase();
  return contacts.filter(contact =>
    contact.name.toLowerCase().includes(query) ||
    contact.email.toLowerCase().includes(query) ||
    (contact.company?.toLowerCase().includes(query) ?? false)
  );
}

/**
 * Filter contacts by company
 */
export function filterContactsByCompany(contacts: Contact[], companies: string[]): Contact[] {
  if (companies.length === 0) return contacts;
  return contacts.filter(contact => contact.company && companies.includes(contact.company));
}

/**
 * Filter contacts by type
 */
export function filterContactsByType(contacts: Contact[], types: string[]): Contact[] {
  if (types.length === 0) return contacts;
  return contacts.filter(contact => contact.type && types.includes(contact.type));
}

/**
 * Apply all filters to contacts
 */
export function applyContactFilters(
  contacts: Contact[],
  searchQuery: string,
  selectedCompanies: string[],
  selectedTypes: string[]
): Contact[] {
  let filtered = contacts;
  
  filtered = filterContactsBySearch(filtered, searchQuery);
  filtered = filterContactsByCompany(filtered, selectedCompanies);
  filtered = filterContactsByType(filtered, selectedTypes);
  
  return filtered;
}

/**
 * Get unique values from contacts for a specific field
 */
export function getUniqueContactValues(contacts: Contact[], field: keyof Contact): string[] {
  return Array.from(new Set(contacts.map(contact => contact[field] as string)));
}

/**
 * Generate a new condition ID
 */
export function generateConditionId(groupId: string, conditionCount: number): string {
  return `${groupId}-${conditionCount + 1}`;
}

/**
 * Generate a new group ID
 */
export function generateGroupId(groupCount: number): string {
  return String(groupCount + 1);
}

/**
 * Validate rule condition
 */
export function isConditionValid(condition: RuleCondition): boolean {
  return !!(
    condition.entity &&
    condition.field &&
    condition.operator &&
    condition.value
  );
}

/**
 * Check if all conditions in a group are valid
 */
export function areAllConditionsValid(conditions: RuleCondition[]): boolean {
  return conditions.every(isConditionValid);
}
