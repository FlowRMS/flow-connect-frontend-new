/**
 * Utility Functions for Campaigns and Rules
 */

import type { Contact, FieldConfig, OperatorConfig, RuleCondition } from './types';
import { STATUS_COLORS, ENTITY_FIELD_MAP, OPERATOR_MAP } from './constants';

/**
 * Get status color class for campaigns and rules
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Format date string to readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

/**
 * Get fields for a given entity type
 */
export function getFieldsForEntity(entity: string): FieldConfig[] {
  return ENTITY_FIELD_MAP[entity] || [];
}

/**
 * Get operators for a given field type
 */
export function getOperatorsForFieldType(fieldType: string): OperatorConfig[] {
  return OPERATOR_MAP[fieldType] || OPERATOR_MAP['text'];
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
    contact.company.toLowerCase().includes(query)
  );
}

/**
 * Filter contacts by company
 */
export function filterContactsByCompany(contacts: Contact[], companies: string[]): Contact[] {
  if (companies.length === 0) return contacts;
  return contacts.filter(contact => companies.includes(contact.company));
}

/**
 * Filter contacts by type
 */
export function filterContactsByType(contacts: Contact[], types: string[]): Contact[] {
  if (types.length === 0) return contacts;
  return contacts.filter(contact => types.includes(contact.type));
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
