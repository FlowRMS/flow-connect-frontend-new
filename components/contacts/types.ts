/**
 * Contact Types and Interfaces
 */

import type { ContactLandingPage, Contact as APIContact } from '../lib/crm-graphql';

// Address type for contact addresses
export type AddressType = 'shipping' | 'billing' | 'mailing';

// Contact Address interface
export interface ContactAddress {
  id: string;
  types: AddressType[];  // Can be multiple: shipping, billing, mailing
  country: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary?: boolean;
}

// Custom field types
export type CustomFieldType = 'text' | 'single-select' | 'multi-select';

// Custom field definition
export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  options?: string[];  // For single-select and multi-select
}

// Custom field value
export interface CustomFieldValue {
  fieldId: string;
  value: string | string[];  // string for text/single-select, string[] for multi-select
}

// UI Contact type (display format)
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedIn?: string;
  company: string;
  companyId?: string;
  role: string;
  contactType: string[]; // Deprecated: kept for UI compatibility, always empty
  tags: string[];
  lists: string[]; // Deprecated: kept for UI compatibility, always empty
  territory: string;
  lastActivity: string;
  firstName: string;
  lastName: string;
  createdBy: string;
  notes?: string;
  // Extended fields
  addresses?: ContactAddress[];
  customFields?: CustomFieldValue[];
  // Warehouse contact fields
  isWarehouseContact?: boolean;
  warehouseRole?: string;
}

// Duplicate group type
export interface DuplicateGroup {
  id: string;
  contacts: Contact[];
  matchType: 'exact' | 'similar';
  matchFields: string[];
}

// View mode type
export type ViewMode = 'list' | 'grid';

// Merge strategy type
export type MergeStrategy = 'keep' | 'combine';

/**
 * Mapper function to convert API data to UI format
 */
// Predefined roles for matching
const CONTACT_ROLES = ['GC', 'EC', 'ARCHITECT', 'ENGINEER', 'DISTRIBUTOR', 'OWNER'] as const;

/**
 * Parse tags from API format to string array
 * API may return: string "tag1, tag2" | string[] ["tag1, tag2"] | string[] ["tag1", "tag2"]
 */
function parseTags(apiTags: string | string[] | null | undefined): string[] {
  if (!apiTags) return [];

  if (typeof apiTags === 'string') {
    return apiTags.split(',').map(t => t.trim()).filter(Boolean);
  }

  if (Array.isArray(apiTags)) {
    return apiTags.flatMap(tag => {
      if (typeof tag === 'string') {
        return tag.split(',').map(t => t.trim()).filter(Boolean);
      }
      return [];
    });
  }

  return [];
}

/**
 * Mapper function to convert Landing Page data to UI format
 */
export function mapLandingPageToUIContact(landingPage: ContactLandingPage): Contact {
  return {
    id: landingPage.id,
    name: `${landingPage.firstName} ${landingPage.lastName}`,
    firstName: landingPage.firstName,
    lastName: landingPage.lastName,
    email: landingPage.email || '',
    phone: landingPage.phone || '',
    company: landingPage.companyName || '',
    role: landingPage.role || '',
    contactType: [], // Deprecated: no longer exists in backend, kept for UI compatibility
    tags: parseTags(landingPage.tags), // Parse tags from landing page
    lists: [], // Deprecated: no longer exists in backend, kept for UI compatibility
    territory: '',
    lastActivity: landingPage.createdAt || new Date().toISOString(),
    createdBy: landingPage.createdBy || '',
  };
}

/**
 * Mapper function to convert full API Contact to UI format
 */
export function mapAPIContactToUIContact(apiContact: APIContact): Contact {
  const role = apiContact.role || '';
  const tags = parseTags(apiContact.tags);

  return {
    id: apiContact.id,
    name: `${apiContact.firstName || ''} ${apiContact.lastName || ''}`.trim(),
    firstName: apiContact.firstName || '',
    lastName: apiContact.lastName || '',
    email: apiContact.email || '',
    phone: apiContact.phone || '',
    linkedIn: undefined,
    company: '', // Will be fetched separately if needed
    companyId: undefined,
    role: role,
    contactType: [], // Deprecated: no longer exists in backend, kept for UI compatibility
    tags,
    lists: [], // Deprecated: no longer exists in backend, kept for UI compatibility
    territory: apiContact.territory || '',
    lastActivity: apiContact.createdAt || new Date().toISOString(),
    createdBy: apiContact.createdBy || '',
    notes: apiContact.notes || '',
    addresses: [],
    customFields: [],
    isWarehouseContact: false,
    warehouseRole: '',
  };
}
