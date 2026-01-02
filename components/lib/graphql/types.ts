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
  commissionDiscountRate?: number;
  defaultDivisor?: number;
  approvalNeeded?: boolean;
  approvalComments?: string;
  approvalDate?: string;
  leadTime?: string;
  minOrderQty?: number;
  published?: boolean;
  tags?: string;
  unitPriceDiscountRate?: number;
  upc?: string;
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

export interface PreOpportunityDetailQuote {
  id: string;
  quoteNumber: string;
  status?: string;
  pipelineStage?: string;
  entityDate?: string;
  expDate?: string;
  createdAt?: string;
  published?: boolean;
  versionOf?: string;
  url?: string;
  reviseDate?: string;
  soldToCustomerId?: string;
  blanket?: boolean;
  billToCustomerId?: string;
  acceptDate?: string;
  balanceId?: string;
  customerRef?: string;
  creationType?: string;
  createdById?: string;
  duplicatedFrom?: string;
  freightTerms?: string;
  paymentTerms?: string;
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
  quote?: PreOpportunityDetailQuote;
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

export type CRMEntityType = 'JOB' | 'COMPANY' | 'CONTACT' | 'TASK' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'FACTORY' | 'CUSTOMER' | 'PRODUCT' | 'FILE';

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
  TaskSearchResult,
  NoteSearchResult,
} from '../api/search';

// Re-export for consumers
export type {
  TaskSearchResult,
  NoteSearchResult,
};

// ============================================================================
// Extended Types for Job Related Entities
// ============================================================================

export interface UserLite {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  authProviderId?: string;
  enabled?: boolean;
  inside?: boolean;
  outside?: boolean;
  role?: string;
  username?: string;
}

export interface CustomerLite {
  id: string;
  companyName: string;
  isParent?: boolean;
  parentId?: string;
  published?: boolean;
}

export interface FactoryLite {
  id: string;
  title: string;
  accountNumber?: string;
}

export interface BalanceLite {
  id: string;
  quantity?: number;
  subtotal?: number;
  discount?: number;
  discountRate?: number;
  total?: number;
  commission?: number;
  commissionRate?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: number;
  cancelledBalance?: number;
  freightChargeBalance?: number;
  shippingBalance?: number;
}

export interface ProductLite {
  id: string;
  factoryPartNumber: string;
  description?: string;
  unitPrice?: number;
}

export interface UomLite {
  id: string;
  title: string;
  description?: string;
  divisionFactor?: number;
}

export interface SplitRateLite {
  id: string;
  userId: string;
  splitRate: number;
  position?: number;
}

export interface CustomerRep {
  id: string;
  customerId: string;
  repType: string;
  position?: number;
  splitRate?: number;
  user?: UserLite;
}

export interface FactorySplitRate {
  id: string;
  factoryId: string;
  position?: number;
  splitRate?: number;
  user?: UserLite;
}

export interface JobLite {
  id: string;
  jobName: string;
  jobType?: string;
}

export interface ProductCategory {
  id: string;
  title: string;
  factoryId?: string;
  commissionRate?: number;
}

// Check Detail types
export interface CheckDetailAdjustment {
  id: string;
  adjustmentNumber: string;
  amount?: number;
  entityDate?: string;
  status?: string;
  reason?: string;
  locked?: boolean;
  createdAt?: string;
  createdById?: string;
  creationType?: string;
  factoryId?: string;
  customer?: CustomerLite;
  factory?: FactoryLite;
}

export interface CheckDetailCredit {
  id: string;
  creditNumber: string;
  creditType?: string;
  balanceId?: string;
  entityDate?: string;
  status?: string;
  reason?: string;
  locked?: boolean;
  orderId?: string;
  url?: string;
  createdAt?: string;
  createdById?: string;
  creationType?: string;
}

export interface CheckDetailInvoice {
  id: string;
  invoiceNumber: string;
  balanceId?: string;
  entityDate?: string;
  dueDate?: string;
  status?: string;
  locked?: boolean;
  published?: boolean;
  orderId?: string;
  url?: string;
  createdAt?: string;
  createdById?: string;
  creationType?: string;
}

export interface CheckDetail {
  id: string;
  checkId: string;
  appliedAmount?: number;
  adjustmentId?: string;
  adjustment?: CheckDetailAdjustment;
  creditId?: string;
  credit?: CheckDetailCredit;
  invoiceId?: string;
  invoice?: CheckDetailInvoice;
}

// Order/Quote detail types
export interface OrderQuoteDetail {
  id: string;
  itemNumber: number;
  productId?: string;
  product?: ProductLite;
  productNameAdhoc?: string;
  productDescriptionAdhoc?: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
  discount?: number;
  discountRate?: number;
  total?: number;
  commission?: number;
  commissionRate?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: number;
  totalLineCommission?: number;
  leadTime?: string;
  note?: string;
  status?: string;
  endUserId?: string;
  factoryId?: string;
  orderId?: string;
  quoteId?: string;
  cancelledBalance?: number;
  freightCharge?: number;
  shippingBalance?: number;
  insideSplitRates?: SplitRateLite[];
  outsideSplitRates?: SplitRateLite[];
  uom?: UomLite;
}

// Extended entity types for job related entities
export interface JobRelatedCheck {
  id: string;
  checkNumber: string;
  commissionMonth?: string;
  entityDate?: string;
  postDate?: string;
  status?: string;
  url?: string;
  enteredCommissionAmount?: number;
  factoryId?: string;
  factory?: FactoryLite;
  createdAt?: string;
  createdById?: string;
  creationType?: string;
  details?: CheckDetail[];
}

export interface JobRelatedInvoice {
  id: string;
  invoiceNumber: string;
  balanceId?: string;
  entityDate?: string;
  dueDate?: string;
  status?: string;
  locked?: boolean;
  published?: boolean;
  orderId?: string;
  url?: string;
  createdAt?: string;
  createdById?: string;
  creationType?: string;
}

export interface JobRelatedOrder {
  id: string;
  orderNumber: string;
  orderType?: string;
  entityDate?: string;
  dueDate?: string;
  shipDate?: string;
  projectedShipDate?: string;
  status?: string;
  headerStatus?: string;
  url?: string;
  published?: boolean;
  balanceId?: string;
  balance?: BalanceLite;
  factoryId?: string;
  quoteId?: string;
  factSoNumber?: string;
  markNumber?: string;
  freightTerms?: string;
  shippingTerms?: string;
  endUserPerLineItem?: boolean;
  insidePerLineItem?: boolean;
  outsidePerLineItem?: boolean;
  soldToCustomerId?: string;
  soldToCustomer?: CustomerLite;
  billToCustomerId?: string;
  billToCustomer?: CustomerLite;
  job?: JobLite;
  createdAt?: string;
  createdById?: string;
  createdBy?: UserLite | string;
  creationType?: string;
  details?: OrderQuoteDetail[];
}

export interface JobRelatedQuote {
  id: string;
  quoteNumber: string;
  entityDate?: string;
  expDate?: string;
  acceptDate?: string;
  reviseDate?: string;
  status?: string;
  pipelineStage?: string;
  url?: string;
  published?: boolean;
  blanket?: boolean;
  balanceId?: string;
  balance?: BalanceLite;
  customerRef?: string;
  freightTerms?: string;
  paymentTerms?: string;
  endUserPerLineItem?: boolean;
  insidePerLineItem?: boolean;
  outsidePerLineItem?: boolean;
  versionOf?: string;
  duplicatedFrom?: string;
  soldToCustomerId?: string;
  soldToCustomer?: CustomerLite;
  billToCustomerId?: string;
  billToCustomer?: CustomerLite;
  job?: JobLite;
  createdAt?: string;
  createdById?: string;
  createdBy?: UserLite | string;
  creationType?: string;
  details?: OrderQuoteDetail[];
}

export interface JobRelatedCustomer {
  id: string;
  companyName: string;
  isParent?: boolean;
  parentId?: string;
  published?: boolean;
  createdBy?: UserLite | string;
  insideReps?: CustomerRep[];
  outsideReps?: CustomerRep[];
}

export interface JobRelatedFactory {
  id: string;
  title: string;
  accountNumber?: string;
  email?: string;
  phone?: string;
  published?: boolean;
  baseCommissionRate?: number;
  commissionDiscountRate?: number;
  overallDiscountRate?: number;
  paymentTerms?: number;
  externalPaymentTerms?: number;
  leadTime?: number;
  logoId?: string;
  freightDiscountType?: string;
  freightTerms?: string;
  additionalInformation?: string;
  createdBy?: UserLite | string;
  splitRates?: FactorySplitRate[];
}

export interface JobRelatedProduct {
  id: string;
  factoryPartNumber: string;
  description?: string;
  unitPrice?: number;
  defaultCommissionRate?: number;
  commissionDiscountRate?: number;
  defaultDivisor?: number;
  unitPriceDiscountRate?: number;
  leadTime?: string;
  minOrderQty?: number;
  published?: boolean;
  approvalNeeded?: boolean;
  approvalComments?: string;
  approvalDate?: string;
  tags?: string;
  upc?: string;
  factory?: FactoryLite;
  category?: ProductCategory;
  uom?: UomLite;
}

export interface JobRelatedEntities {
  companies: Company[];
  contacts: Contact[];
  customers: JobRelatedCustomer[];
  factories: JobRelatedFactory[];
  products: JobRelatedProduct[];
  preOpportunities: PreOpportunity[];
  quotes: JobRelatedQuote[];
  orders: JobRelatedOrder[];
  invoices: JobRelatedInvoice[];
  checks: JobRelatedCheck[];
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
