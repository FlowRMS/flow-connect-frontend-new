/**
 * Pre-Opportunity Types and Interfaces
 * Complete type definitions for PreOpportunity domain from GraphQL API
 */

// ============================================================================
// GraphQL API Types
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
  createdAt: string;
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

// ============================================================================
// Input Types
// ============================================================================

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
// Search Types
// ============================================================================

export interface ProductSearchResult {
  id: string;
  factoryPartNumber: string;
  description?: string;
  unitPrice?: number;
  defaultCommissionRate?: number;
  approvalNeeded?: boolean;
  published?: boolean;
  approvalComments?: string;
  approvalDate?: string;
  commissionDiscountRate?: number;
  defaultDivisor?: number;
  leadTime?: string;
  minOrderQty?: number;
  tags?: string[];
  unitPriceDiscountRate?: number;
  upc?: string;
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

// Job Search Result for Pre-Opportunity
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

// Job data embedded in PreOpportunity
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

// ============================================================================
// UI Types
// ============================================================================

// View mode type
export type ViewMode = 'kanban' | 'list';

// Pre-Opp Stage for Kanban (maps to status)
export interface PreOppStage {
  name: PreOpportunityStatus;
  displayName: string;
  color: string;
}
