/**
 * Shared GraphQL Types
 * Common types used across multiple GraphQL modules
 */

// ============================================================================
// Common Types
// ============================================================================

export type FilterOperator =
  | 'EQ'
  | 'NE'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'LIKE'
  | 'ILIKE'
  | 'BEGINS_WITH'
  | 'ENDS_WITH'
  | 'IN'
  | 'NOT_IN'
  | 'IS_NULL'
  | 'IS_NOT_NULL';

export type SortDirection = 'ASC' | 'DESC';

export type SourceType = 'JOBS' | 'COMPANIES' | 'CONTACTS';

export interface LandingPageFilter {
  operator: FilterOperator;
  columnName: string;
  value?: string;
  values?: string[];
}

export interface LandingPageOrderBy {
  columnName: string;
  direction: SortDirection;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  records: T[];
  total: number;
}

// ============================================================================
// Job Types
// ============================================================================

export interface JobStatus {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  jobName: string;
  jobType: string;
  description: string;
  additionalInformation: string;
  structuralInformation: string;
  structuralDetails: string;
  startDate: string;
  endDate: string;
  requesterId: string;
  createdBy: string;
  createdAt: string;
  status: JobStatus;
  tags?: string | string[];
}

export interface JobInput {
  jobName: string;
  statusId: string;
  structuralInformation?: string;
  structuralDetails?: string;
  startDate?: string;
  requesterId?: string;
  jobType?: string;
  jobOwnerId?: string;
  endDate?: string;
  description?: string;
  additionalInformation?: string;
  tags?: string;
}

export interface UpdateJobInput {
  jobName?: string;
  statusId?: string;
  structuralInformation?: string;
  structuralDetails?: string;
  startDate?: string;
  requesterId?: string;
  jobType?: string;
  jobOwnerId?: string;
  endDate?: string;
  description?: string;
  additionalInformation?: string;
  tags?: string;
}

export interface JobLandingPage {
  id: string;
  jobName: string;
  jobType?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  statusName?: string;
  jobOwner?: string;
  requester?: string;
  createdBy?: string;
  createdAt?: string;
  tags?: string | string[];
}

export interface JobSearchResult {
  id: string;
  jobName: string;
  jobType: string;
  description: string;
  additionalInformation: string;
  structuralInformation: string;
  structuralDetails: string;
  startDate: string;
  endDate: string;
  requesterId: string;
  createdBy: string;
  createdAt: string;
  status: {
    id: string;
    name: string;
  };
}

// ============================================================================
// Company Types
// ============================================================================

export type CompanySourceType = 'CUSTOMER' | 'MANUFACTURER';

export interface Company {
  id: string;
  name: string;
  companySourceType: CompanySourceType;
  parentCompanyId?: string | null;
  phone?: string | null;
  website?: string | null;
  tags?: string | string[] | null;
  standardCommissionRate?: number | null;
  warehouseCommissionRate?: number | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

export interface CompanyInput {
  name: string;
  companySourceType: CompanySourceType;
  parentCompanyId?: string;
  phone?: string;
  website?: string;
  tags?: string;
  standardCommissionRate?: number;
  warehouseCommissionRate?: number;
}

export interface UpdateCompanyInput {
  name?: string;
  companySourceType?: CompanySourceType;
  parentCompanyId?: string;
  phone?: string;
  website?: string;
  tags?: string;
  standardCommissionRate?: number;
  warehouseCommissionRate?: number;
}

export interface CompanyLandingPage {
  id: string;
  name: string;
  companySourceType: CompanySourceType;
  phone?: string;
  website?: string;
  standardCommissionRate?: number;
  warehouseCommissionRate?: number;
  createdBy?: string;
  createdAt?: string;
  tags?: string[];
}

// ============================================================================
// Contact Types
// ============================================================================

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  notes?: string | null;
  tags?: string | string[] | null;
  territory?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

export interface ContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  notes?: string;
  tags?: string;
  territory?: string;
}

export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  notes?: string;
  tags?: string;
  territory?: string;
}

export interface ContactLandingPage {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  companyName?: string;
  createdBy?: string;
  createdAt?: string;
  tags?: string[];
}

// ============================================================================
// PreOpportunity Types
// ============================================================================

export type PreOpportunityStatus = 'QUALIFIED' | 'NEGOTIATION' | 'FOLLOW_UP' | 'WAITING_ON_FACTORY' | 'LOST' | 'WON';

export interface PreOpportunityBalance {
  id: string;
  quantity: number;
  subtotal: number;
  discount: number;
  discountRate: number;
  total: number;
}

export interface PreOpportunityProduct {
  id: string;
  factoryPartNumber: string;
  description?: string;
  unitPrice?: number;
  defaultCommissionRate?: number;
  approvalNeeded?: boolean;
  published?: boolean;
}

export interface PreOpportunityJob {
  id: string;
  jobName: string;
  jobType: string;
  description: string;
  additionalInformation: string;
  structuralInformation: string;
  structuralDetails: string;
  startDate: string;
  endDate: string;
  requesterId: string;
  createdBy: string;
  createdAt: string;
  status: {
    id: string;
    name: string;
  };
}

export interface PreOpportunityDetail {
  id: string;
  preOpportunityId: string;
  itemNumber: number;
  productId: string;
  productCpnId?: string;
  product: PreOpportunityProduct;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  discountRate: number;
  total: number;
  leadTime?: string;
  endUserId?: string;
}

export interface PreOpportunity {
  id: string;
  entityNumber: string;
  entityDate: string;
  status: PreOpportunityStatus;
  soldToCustomerId: string;
  billToCustomerId?: string;
  soldToCustomerAddressId?: string;
  billToCustomerAddressId?: string;
  jobId?: string;
  job?: PreOpportunityJob;
  expDate?: string;
  acceptDate?: string;
  reviseDate?: string;
  customerRef?: string;
  paymentTerms?: string;
  freightTerms?: string;
  balance?: PreOpportunityBalance;
  details: PreOpportunityDetail[];
  createdBy: string;
  createdById?: string;
  createdAt: string;
  tags?: string;
}

export interface PreOpportunityLandingPage {
  id: string;
  entityNumber: string;
  entityDate: string;
  status: PreOpportunityStatus;
  total: number;
  expDate?: string;
  createdBy: string;
  createdAt: string;
}

export interface PreOpportunityDetailInput {
  id?: string;
  itemNumber: number;
  productId: string;
  productCpnId?: string;
  quantity: number;
  unitPrice: number;
  discountRate?: number;
  leadTime?: string;
  endUserId?: string;
}

export interface CreatePreOpportunityInput {
  entityNumber: string;
  entityDate: string;
  status: PreOpportunityStatus;
  soldToCustomerId: string;
  billToCustomerId?: string;
  soldToCustomerAddressId?: string;
  billToCustomerAddressId?: string;
  jobId?: string;
  expDate?: string;
  acceptDate?: string;
  reviseDate?: string;
  customerRef?: string;
  paymentTerms?: string;
  freightTerms?: string;
  details: PreOpportunityDetailInput[];
  userOwnerIds?: string;
}

export interface UpdatePreOpportunityInput {
  id: string;
  entityNumber?: string;
  entityDate?: string;
  status?: PreOpportunityStatus;
  soldToCustomerId?: string;
  billToCustomerId?: string;
  soldToCustomerAddressId?: string;
  billToCustomerAddressId?: string;
  jobId?: string;
  expDate?: string;
  acceptDate?: string;
  reviseDate?: string;
  customerRef?: string;
  paymentTerms?: string;
  freightTerms?: string;
  details?: PreOpportunityDetailInput[];
  userOwnerIds?: string;
}

// ============================================================================
// Search Result Types
// ============================================================================

export interface ProductSearchResult {
  id: string;
  factoryPartNumber: string;
  factory: {
    id: string;
    title: string;
  };
}

export interface FactorySearchResult {
  id: string;
  title: string;
}

export interface CustomerSearchResult {
  id: string;
  companyName: string;
  parentId?: string;
  insideRepId?: string;
}

export interface CustomerLandingPage {
  id: string;
  companyName: string;
  createdAt?: string;
  createdBy?: string;
  insideReps?: string;
  outsideReps?: string;
  isParent: boolean;
  published: boolean;
}

export interface FactoryLandingPage {
  id: string;
  title: string;
  email?: string;
  phone?: string;
  published: boolean;
  accountNumber?: string;
  baseCommissionRate?: string;
  commissionDiscountRate?: string;
  overallDiscountRate?: string;
  paymentTerms?: number;
  leadTime?: number;
  freightDiscountType?: string;
  createdAt?: string;
}

// ============================================================================
// Entity Link Types
// ============================================================================

export type CRMEntityType = 'JOB' | 'COMPANY' | 'CONTACT' | 'TASK' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'FACTORY' | 'CUSTOMER' | 'PRODUCT';

export interface EntityLink {
  id: string;
  sourceEntityType: CRMEntityType;
  sourceEntityId: string;
  targetEntityType: CRMEntityType;
  targetEntityId: string;
  createdAt: string;
}

export interface CreateLinkInput {
  sourceEntityType: CRMEntityType;
  sourceEntityId: string;
  targetEntityType: CRMEntityType;
  targetEntityId: string;
}

export interface DeleteLinkByEntitiesInput {
  sourceEntityType: CRMEntityType;
  sourceEntityId: string;
  targetEntityType: CRMEntityType;
  targetEntityId: string;
}

// ============================================================================
// Search Result Types for Entity Links
// Re-exported from central search API for consistency
// ============================================================================

import type {
  QuoteSearchResult,
  OrderSearchResult,
  InvoiceSearchResult,
  CheckSearchResult,
  TaskSearchResult,
  NoteSearchResult,
} from '../api/search';

// Re-export for consumers
export type {
  QuoteSearchResult,
  OrderSearchResult,
  InvoiceSearchResult,
  CheckSearchResult,
  TaskSearchResult,
  NoteSearchResult,
};

export interface JobRelatedEntities {
  companies: Company[];
  contacts: Contact[];
  preOpportunities: PreOpportunity[];
  quotes: QuoteSearchResult[];
  orders: OrderSearchResult[];
  invoices: InvoiceSearchResult[];
  checks: CheckSearchResult[];
}

export interface ContactRelatedEntities {
  companies: Company[];
}

export interface NoteLink {
  id: string;
  sourceEntityType: CRMEntityType;
  sourceEntityId: string;
  targetEntityType: CRMEntityType;
  targetEntityId: string;
  createdAt: string;
  createdBy: string;
}
