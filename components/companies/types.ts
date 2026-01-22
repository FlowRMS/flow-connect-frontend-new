/**
 * Company Types and Interfaces
 */

import type { CompanyLandingPage, Company as APICompany } from '../lib/crm-graphql';

// Address type for company addresses
export type AddressType = 'shipping' | 'billing' | 'mailing';

// Sales Rep assignment with commission split
export interface SalesRepAssignment {
  id: string;
  repId: string;
  repName: string;
  repType: 'inside' | 'outside';
  commissionSplit: number; // Percentage as decimal (0.5 = 50%)
}

// Company Address interface
export interface CompanyAddress {
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

// Company hierarchy role - designates the company's role in the parent/child hierarchy
export type CompanyHierarchyRole = 'none' | 'parent' | 'grandparent';

// Child company reference (for displaying relationships)
export interface ChildCompanyRef {
  id: string;
  name: string;
  companyTypeId?: string;
  companyTypeName?: string;
}

// Manufacturer-specific fields
export interface ManufacturerInfo {
  factoryAccountNumber?: string;
  factoryEmail?: string;
  logoUrl?: string;
  freightDiscountType?: 'ADD' | 'SUBTRACT' | 'NONE';
  leadTime?: string;
  paymentTerms?: string;
  baseCommissionRate?: number;      // Base commission rate (e.g., 0.06 for 6%)
  commissionDiscountRate?: number;  // Commission discount rate
  overallDiscountRate?: number;     // Overall discount rate
  externalTerms?: string;
  additionalInformation?: string;
  freightTerms?: string;
  externalPaymentTerms?: string;
}

// UI Company type (display format)
export interface Company {
  id: string;
  name: string;
  type: string[];
  website: string;
  phone: string;
  email?: string;
  address: string;
  tags: string[];
  lists: string[];
  territory: string;
  contactCount: number;
  jobCount: number;
  lastActivity: string;
  followers: string[];
  companyTypeId?: string;             // UUID reference to CompanyType
  companyTypeName?: string;           // Display name of the company type
  companySourceType?: string;         // Raw companySourceType from API (for filtering)
  standardCommissionRate?: number;    // Standard/direct commission rate (e.g., 0.10 for 10%)
  warehouseCommissionRate?: number;   // Warehouse commission rate (e.g., 0.05 for 5%)
  insideRep?: string;
  createdBy: string;
  // Extended fields
  addresses?: CompanyAddress[];
  manufacturerInfo?: ManufacturerInfo;
  // Sales rep assignments
  salesReps?: SalesRepAssignment[];
  // Document-specific flag - excludes from searches when creating quotes, orders, invoices
  isDocumentSpecific?: boolean;
  // Warehouse manufacturer flag - indicates this manufacturer has warehouse operations
  isWarehouseManufacturer?: boolean;
  // Company hierarchy fields
  hierarchyRole?: CompanyHierarchyRole;          // Role: none, parent, or grandparent
  parentCompanyId?: string;                       // ID of parent company (if this is a child)
  parentCompanyName?: string;                     // Name of parent company
  grandparentCompanyId?: string;                  // ID of grandparent company (if parent is a child)
  grandparentCompanyName?: string;                // Name of grandparent company
  childCompanies?: ChildCompanyRef[];             // Child companies (if this is a parent)
  childParentCompanies?: ChildCompanyRef[];       // Child parent companies (if this is a grandparent)
}

// View mode type
export type ViewMode = 'grid' | 'list';

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
  // Use companyType.name if available, otherwise fall back to companySourceType
  const typeName = landingPage.companyType?.name
    || landingPage.companySourceType
    || 'Unknown Type';
  const type = [typeName];

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
    companyTypeId: landingPage.companyTypeId,
    companyTypeName: landingPage.companyType?.name || landingPage.companySourceType,
    companySourceType: landingPage.companySourceType, // Keep original for filtering
    standardCommissionRate: landingPage.standardCommissionRate,
    warehouseCommissionRate: landingPage.warehouseCommissionRate,
    createdBy: landingPage.createdBy || '',
  };
}

/**
 * Mapper function to convert full API Company to UI format
 */
export function mapAPICompanyToUICompany(apiCompany: APICompany): Company {
  // Use companyType.name if available
  const typeName = apiCompany.companyType?.name || 'Unknown Type';
  const type = [typeName];
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
    companyTypeId: apiCompany.companyTypeId ?? undefined,
    companyTypeName: apiCompany.companyType?.name,
    standardCommissionRate: apiCompany.standardCommissionRate ?? undefined,
    warehouseCommissionRate: apiCompany.warehouseCommissionRate ?? undefined,
    createdBy: apiCompany.createdBy || '',
    parentCompanyId: apiCompany.parentCompanyId ?? undefined,
    // parentCompanyName is fetched separately using parentCompanyId
  };
}
