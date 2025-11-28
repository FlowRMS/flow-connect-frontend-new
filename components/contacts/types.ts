/**
 * Contact Types and Interfaces
 */

import type { ContactLandingPage } from '../lib/crm-graphql';

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
export function mapLandingPageToUIContact(landingPage: ContactLandingPage): Contact {
  // Predefined roles for matching
  const CONTACT_ROLES = ['GC', 'EC', 'ARCHITECT', 'ENGINEER', 'DISTRIBUTOR', 'OWNER'] as const;
  
  // Extract role to determine contactType
  const role = landingPage.role || '';
  const contactType: string[] = [];
  
  // Match role to predefined types
  for (const roleType of CONTACT_ROLES) {
    if (role.toUpperCase().includes(roleType)) {
      contactType.push(roleType);
    }
  }

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
    contactType,
    tags: [],
    lists: [],
    territory: '',
    lastActivity: landingPage.createdAt || new Date().toISOString(),
    createdBy: landingPage.createdBy || '',
  };
}
