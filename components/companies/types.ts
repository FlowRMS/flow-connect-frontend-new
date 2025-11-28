/**
 * Company Types and Interfaces
 */

import type { CompanyLandingPage, CompanySourceType } from '../lib/crm-graphql';

// UI Company type (display format)
export interface Company {
  id: string;
  name: string;
  type: string[];
  website: string;
  phone: string;
  address: string;
  tags: string[];
  lists: string[];
  territory: string;
  contactCount: number;
  jobCount: number;
  lastActivity: string;
  followers: string[];
  companySourceType: CompanySourceType;
  createdBy: string;
}

// View mode type
export type ViewMode = 'grid' | 'list';

/**
 * Mapper function to convert API data to UI format
 */
export function mapLandingPageToUICompany(landingPage: CompanyLandingPage): Company {
  // Map companySourceType to display type
  const type = landingPage.companySourceType === 'MANUFACTURER' 
    ? ['Manufacturer'] 
    : ['Customer'];

  return {
    id: landingPage.id,
    name: landingPage.name,
    type,
    website: landingPage.website || '',
    phone: landingPage.phone || '',
    address: '', // Address not in API yet
    tags: [], // Tags not in landing page response
    lists: [], // Lists not in API yet
    territory: '', // Territory not in API yet
    contactCount: 0, // Contact count not in API yet
    jobCount: 0, // Job count not in API yet
    lastActivity: landingPage.createdAt || new Date().toISOString(),
    followers: [], // Followers not in API yet
    companySourceType: landingPage.companySourceType,
    createdBy: landingPage.createdBy || '',
  };
}
