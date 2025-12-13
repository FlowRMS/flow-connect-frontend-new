/**
 * Company Types and Interfaces
 */

import type { CompanyLandingPage, CompanySourceType, Company as APICompany } from '../lib/crm-graphql';

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
  standardCommissionRate?: number;    // Standard/direct commission rate (e.g., 0.10 for 10%)
  warehouseCommissionRate?: number;   // Warehouse commission rate (e.g., 0.05 for 5%)
  createdBy: string;
}

// View mode type
export type ViewMode = 'grid' | 'list';

/**
 * Normalize company source type to ensure it's a valid enum value
 */
function normalizeCompanySourceType(value: string | CompanySourceType | undefined): CompanySourceType {
  // Handle numeric values that might come from API
  if (value === '2' || value === 2 as unknown as string) {
    return 'MANUFACTURER';
  }
  if (value === '1' || value === 1 as unknown as string) {
    return 'CUSTOMER';
  }
  // Handle string enum values
  if (value === 'MANUFACTURER') {
    return 'MANUFACTURER';
  }
  // Default to CUSTOMER
  return 'CUSTOMER';
}

/**
 * Parse tags from API format to string array
 * API may return: string "tag1, tag2" | string[] ["tag1, tag2"] | string[] ["tag1", "tag2"]
 */
function parseTags(apiTags: string | string[] | null | undefined): string[] {
  if (!apiTags) return [];

  if (typeof apiTags === 'string') {
    // Handle comma-separated string
    return apiTags.split(',').map(t => t.trim()).filter(Boolean);
  }

  if (Array.isArray(apiTags)) {
    // Handle array - each element might also be comma-separated
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
 * Mapper function to convert API data to UI format
 */
export function mapLandingPageToUICompany(landingPage: CompanyLandingPage): Company {
  // Normalize and map companySourceType
  const normalizedSourceType = normalizeCompanySourceType(landingPage.companySourceType);
  const type = normalizedSourceType === 'MANUFACTURER'
    ? ['Manufacturer']
    : ['Customer'];

  return {
    id: landingPage.id,
    name: landingPage.name,
    type,
    website: landingPage.website || '',
    phone: landingPage.phone || '',
    address: '', // Address not in API yet
    tags: parseTags(landingPage.tags), // Parse tags from landing page
    lists: [], // Lists not in API yet
    territory: '', // Territory not in API yet
    contactCount: 0, // Contact count not in API yet
    jobCount: 0, // Job count not in API yet
    lastActivity: landingPage.createdAt || new Date().toISOString(),
    followers: [], // Followers not in API yet
    companySourceType: normalizedSourceType,
    standardCommissionRate: landingPage.standardCommissionRate,
    warehouseCommissionRate: landingPage.warehouseCommissionRate,
    createdBy: landingPage.createdBy || '',
  };
}

/**
 * Mapper function to convert full API Company to UI format
 */
export function mapAPICompanyToUICompany(apiCompany: APICompany): Company {
  const normalizedSourceType = normalizeCompanySourceType(apiCompany.companySourceType);
  const type = normalizedSourceType === 'MANUFACTURER'
    ? ['Manufacturer']
    : ['Customer'];
  const tags = parseTags(apiCompany.tags);

  return {
    id: apiCompany.id,
    name: apiCompany.name,
    type,
    website: apiCompany.website || '',
    phone: apiCompany.phone || '',
    address: '',
    tags,
    lists: [],
    territory: '',
    contactCount: 0,
    jobCount: 0,
    lastActivity: apiCompany.createdAt || new Date().toISOString(),
    followers: [],
    companySourceType: normalizedSourceType,
    standardCommissionRate: apiCompany.standardCommissionRate ?? undefined,
    warehouseCommissionRate: apiCompany.warehouseCommissionRate ?? undefined,
    createdBy: apiCompany.createdBy || '',
  };
}
