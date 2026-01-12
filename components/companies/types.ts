/**
 * Company Types and Interfaces
 */

import type { CompanyLandingPage, CompanySourceType, Company as APICompany } from '../lib/crm-graphql';
import { COMPANY_SOURCE_TYPE_LABELS } from '../lib/crm-graphql';

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
  companySourceType: CompanySourceType;
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
  companySourceType: CompanySourceType;
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

// All valid company source types
const VALID_COMPANY_SOURCE_TYPES: CompanySourceType[] = [
  'CUSTOMER',
  'MANUFACTURER',
  'ENGINEERING_FIRM',
  'CONSULTING_ENGINEER',
  'ELECTRICAL_ENGINEER',
  'MEP_ENGINEER',
  'ARCHITECT',
  'LIGHTING_DESIGNER',
  'SPECIFIER',
  'ELECTRICAL_CONTRACTOR',
  'GENERAL_CONTRACTOR',
  'DESIGN_BUILD_FIRM',
  'EPC',
  'SYSTEMS_INTEGRATOR',
  'CONTROLS_CONTRACTOR',
  'LOW_VOLTAGE_CONTRACTOR',
  'BUILDING_OWNER',
  'DEVELOPER',
  'PROPERTY_MANAGEMENT_COMPANY',
  'FACILITY_MANAGEMENT_COMPANY',
  'UTILITY_COMPANY',
  'MUNICIPALITY_PUBLIC_AUTHORITY',
  'AHJ',
  'COMMISSIONING_AGENT',
  'TESTING_INSPECTION_AGENCY',
  'ENERGY_PROGRAM_ADMINISTRATOR',
  'TRADE_ASSOCIATION',
];

/**
 * Normalize company source type to ensure it's a valid enum value
 */
function normalizeCompanySourceType(value: string | CompanySourceType | undefined): CompanySourceType {
  // Handle numeric values that might come from legacy API
  if (value === '2' || value === 2 as unknown as string) {
    return 'MANUFACTURER';
  }
  if (value === '1' || value === 1 as unknown as string) {
    return 'CUSTOMER';
  }
  // Handle valid string enum values
  if (value && VALID_COMPANY_SOURCE_TYPES.includes(value as CompanySourceType)) {
    return value as CompanySourceType;
  }
  // Default to CUSTOMER for unknown types
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
 * Get the human-readable label for a company source type
 */
function getCompanyTypeLabel(sourceType: CompanySourceType): string {
  return COMPANY_SOURCE_TYPE_LABELS[sourceType] || 'Customer';
}

/**
 * Mapper function to convert API data to UI format
 */
export function mapLandingPageToUICompany(landingPage: CompanyLandingPage): Company {
  // Normalize and map companySourceType
  const normalizedSourceType = normalizeCompanySourceType(landingPage.companySourceType);
  // Use the proper label from COMPANY_SOURCE_TYPE_LABELS
  const type = [getCompanyTypeLabel(normalizedSourceType)];

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
  // Use the proper label from COMPANY_SOURCE_TYPE_LABELS
  const type = [getCompanyTypeLabel(normalizedSourceType)];
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
