/**
 * Contact Types and Interfaces
 */

import type { ContactLandingPage, Contact as APIContact } from '../lib/crm-graphql';

// UI Contact type (display format)
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  companyId: string;
  role: string;
  contactType: string[];
  tags: string[];
  lists: string[];
  territory: string;
  lastActivity: string;
  firstName: string;
  lastName: string;
  createdBy: string;
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
 * Helper to extract contact types from role
 */
function extractContactTypes(role: string): string[] {
  const contactType: string[] = [];
  for (const roleType of CONTACT_ROLES) {
    if (role.toUpperCase().includes(roleType)) {
      contactType.push(roleType);
    }
  }
  return contactType;
}

/**
 * Mapper function to convert Landing Page data to UI format
 */
export function mapLandingPageToUIContact(landingPage: ContactLandingPage): Contact {
  const role = landingPage.role || '';

  return {
    id: landingPage.id,
    name: `${landingPage.firstName} ${landingPage.lastName}`,
    firstName: landingPage.firstName,
    lastName: landingPage.lastName,
    email: landingPage.email || '',
    phone: landingPage.phone || '',
    company: landingPage.companyName || '',
    companyId: '', // Not available in landing page
    role: landingPage.role || '',
    contactType: extractContactTypes(role),
    tags: [],
    lists: [],
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
  const tags = Array.isArray(apiContact.tags)
    ? apiContact.tags
    : (typeof apiContact.tags === 'string' ? [apiContact.tags] : []);

  return {
    id: apiContact.id,
    name: `${apiContact.firstName} ${apiContact.lastName}`,
    firstName: apiContact.firstName,
    lastName: apiContact.lastName,
    email: apiContact.email || '',
    phone: apiContact.phone || '',
    company: '', // Will be fetched separately if needed
    companyId: apiContact.companyId || '',
    role: apiContact.role || '',
    contactType: extractContactTypes(role),
    tags: tags.filter(Boolean) as string[],
    lists: [],
    territory: apiContact.territory || '',
    lastActivity: apiContact.createdAt || new Date().toISOString(),
    createdBy: apiContact.createdBy || '',
  };
}
