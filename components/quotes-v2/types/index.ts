// Quotes V2 Types
// Designed for API integration with proper mapping between API and UI types

import type {
  Quote,
  QuoteLandingPage,
  QuoteDetail,
  QuoteStatus,
  QuotePipelineStage,
  QuoteCreationType,
  QuoteDetailStatus,
} from '../../quotes/api/quotesApi';

// ============================================================================
// Re-export API types for convenience
// ============================================================================
export type {
  Quote,
  QuoteLandingPage,
  QuoteDetail,
  QuoteBalance,
  QuoteCustomer,
  QuoteCreatedBy,
  QuoteSplitRate,
  QuoteInsideRep,
  QuoteProduct,
  QuoteUom,
  CreateQuoteInput,
  UpdateQuoteInput,
  QuoteDetailInput,
  QuoteSplitRateInput,
  QuoteLandingPageFilter,
  QuoteLandingPageOrderBy,
  PaginatedQuotesResult,
  CustomerSearchResult,
  ProductSearchResult,
  FactorySearchResult,
  UserSearchResult,
  ProductCpnResult,
  ProductUomResult,
} from '../../quotes/api/quotesApi';

export type { QuoteStatus, QuotePipelineStage, QuoteCreationType, QuoteDetailStatus };

// ============================================================================
// UI Stage Types (for Kanban display)
// ============================================================================
export type QuoteV2Stage = 'Draft' | 'Review' | 'Sent' | 'Negotiating' | 'Won' | 'Lost' | 'Dormant';
export type QuoteV2Status = 'OPEN' | 'ORDERED' | 'EXPIRED' | 'LOST';
export type ApprovalStatus = 'clear' | 'pending' | 'blocked' | 'approved';

// ============================================================================
// UI Display Types (extended from API types)
// ============================================================================

export interface QuoteV2 {
  id: string;
  quoteNumber: string;
  stage: QuoteV2Stage;
  status: QuoteV2Status;

  // API fields
  pipelineStage?: QuotePipelineStage;
  apiStatus?: QuoteStatus;
  creationType?: QuoteCreationType;
  blanket?: boolean;
  published?: boolean;

  // Customer info
  soldToCustomerId: string;
  soldToCustomerName: string;
  billToCustomerId: string;
  billToCustomerName: string;

  // Job info (Coming soon - not in API)
  jobId: string;
  jobName: string;

  // Pricing from balance
  quoteAmount: number;
  basePrice: number;
  sellPrice: number;
  commission: number;

  // Win tracking (Coming soon - not in API)
  winProbability: number;
  approvalStatus: ApprovalStatus;
  pendingApprovals: number;
  blockedApprovals: number;

  // Dates
  quoteDate: string; // entityDate in API
  expirationDate: string; // expDate in API
  entryDate: string; // createdAt in API
  revisedDate?: string; // reviseDate in API
  acceptDate?: string;

  // Terms
  paymentTerms: string;
  freightTerms: string;

  // Customer reference
  customerRef?: string;

  // End User (customer)
  endUserId?: string;
  endUserName?: string;

  // Reps (from insideReps/outsideReps arrays)
  outsideRepId?: string;
  outsideRepName?: string;
  outsideReps?: { id: string; userId?: string; splitRate?: string; position?: number }[];
  insideRepId?: string;
  insideRepName?: string;
  insideReps?: { id: string; userId?: string; splitRate?: string; position?: number }[];

  // Version (Coming soon - not in API for landing page)
  version: number;
  versionOf?: string;
  duplicatedFrom?: string;

  // Tags (Coming soon - not in API)
  tags: string[];

  // Factories count for display (Coming soon)
  factoriesCount: number;

  // End users count for display (Coming soon)
  endUsersCount: number;

  // URL
  url?: string;

  // Created by info
  createdById?: string;
  createdByName?: string;

  // Header-level manufacturer (used when factoryPerLineItem is false)
  factoryId?: string;
  factoryName?: string;
}

export interface LineItemV2 {
  id: string;
  quoteId: string;
  itemNumber?: number;

  // Product info
  productId?: string;
  partNumber: string; // productNameAdhoc or product.factoryPartNumber
  customerPartNumber?: string;
  description: string; // productDescriptionAdhoc or product.description
  manufacturerId?: string; // factoryId
  manufacturerName: string;

  // Quantity
  quantity: number;
  uom: string | null;
  uomId?: string | null;
  divisor: number; // divisionFactor from uom

  // Pricing
  unitPrice: number;
  sellTotal: number; // subtotal
  total: number;

  // Commission
  commissionPercent: number; // commissionRate
  commission: number;
  commissionTotal: number; // totalLineCommission

  // Discount
  discountRate?: string;
  discount?: number;

  // Order link (Coming soon)
  linkedOrderId?: string;
  linkedOrderNumber?: string;

  // End user
  endUserId?: string;
  endUserName?: string;

  // Additional details (shown in modal)
  commissionDiscountPercent: number; // commissionDiscountRate
  commissionDiscountAmount: number; // commissionDiscount
  lineDiscountPercent: number; // discountRate
  lineDiscountAmount: number; // discount
  leadTime?: string;

  // Notes
  note?: string;

  // Status
  status?: QuoteDetailStatus;

  // Split rates - inside and outside reps at line item level
  insideSplitRates?: { id: string; userId?: string; splitRate?: string; position?: number }[];
  outsideSplitRates?: { id: string; userId?: string; splitRate?: string; position?: number }[];
}

export interface NoteV2 {
  id: string;
  quoteId: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  content: string;
  createdAt: string;
}

export interface TaskV2 {
  id: string;
  quoteId: string;
  title: string;
  description: string;
  dueDate: string;
  assigneeId: string;
  assigneeName: string;
  status: 'pending' | 'due_soon' | 'overdue' | 'completed';
  completedAt?: string;
  completedById?: string;
  completedByName?: string;
}

export interface ActivityV2 {
  id: string;
  quoteId: string;
  type: 'price_update' | 'approval_update' | 'approval_sent' | 'quote_sent' | 'status_change' | 'version_created';
  title: string;
  description: string;
  performedById: string;
  performedByName: string;
  timestamp: string;
}

export interface LinkedObjectV2 {
  id: string;
  type: 'pre-opportunity' | 'order' | 'invoice';
  number: string;
  name: string;
  amount: number;
  status: string;
}

export interface VersionV2 {
  id: string;
  quoteId: string;
  versionNumber: number;
  createdAt: string;
  createdById: string;
  createdByName: string;
  description: string;
  totalAmount: number;
  approvalsStatus: string;
  approvalsCount: number;
  isCurrent: boolean;
}

export interface PriceLevelV2 {
  id: string;
  name: string;
  percent: number;
  description: string;
}

export interface QuoteSettingsV2 {
  specifyEndUserPerLine: boolean;
  outsideRepAtLineLevel: boolean;
  insideRepAtLineLevel: boolean;
  factoryPerLineItem: boolean;
  customerPartNumberSource: 'sold_to' | 'end_user';
  priceLevels: PriceLevelV2[];
}

// Column configuration
export type LineItemColumnKey =
  | 'partNumber'
  | 'customerPartNumber'
  | 'description'
  | 'manufacturer'
  | 'quantity'
  | 'uom'
  | 'divisor'
  | 'unitPrice'
  | 'endUser'
  | 'sellTotal'
  | 'commissionPercent'
  | 'commission'
  | 'commissionTotal'
  | 'linkedOrder';

export interface ColumnConfig {
  key: LineItemColumnKey;
  label: string;
  group: 'Basic' | 'Pricing' | 'Commission';
  visible: boolean;
}

// ============================================================================
// Transformation Utilities
// ============================================================================

/**
 * Map API pipeline stage to UI stage
 */
export function mapPipelineStageToUIStage(pipelineStage?: QuotePipelineStage, status?: QuoteStatus): QuoteV2Stage {
  if (status === 'LOST') return 'Lost';
  if (status === 'ORDERED') return 'Won';
  if (status === 'EXPIRED') return 'Dormant';

  switch (pipelineStage) {
    case 'DISCOVERY':
    case 'PROSPECT':
      return 'Draft';
    case 'QUALIFICATION':
      return 'Review';
    case 'PROPOSAL':
      return 'Sent';
    case 'NEGOTIATION':
      return 'Negotiating';
    case 'CLOSED_WON':
      return 'Won';
    case 'CLOSED_LOST':
      return 'Lost';
    default:
      return 'Draft';
  }
}

/**
 * Map UI stage back to API fields
 */
export function mapUIStageToAPIFields(uiStage: QuoteV2Stage): { pipelineStage: QuotePipelineStage; status?: QuoteStatus } {
  switch (uiStage) {
    case 'Draft':
      return { pipelineStage: 'DISCOVERY' };
    case 'Review':
      return { pipelineStage: 'QUALIFICATION' };
    case 'Sent':
      return { pipelineStage: 'PROPOSAL' };
    case 'Negotiating':
      return { pipelineStage: 'NEGOTIATION' };
    case 'Won':
      return { pipelineStage: 'CLOSED_WON', status: 'ORDERED' };
    case 'Lost':
      return { pipelineStage: 'CLOSED_LOST', status: 'LOST' };
    case 'Dormant':
      return { pipelineStage: 'DISCOVERY', status: 'EXPIRED' };
    default:
      return { pipelineStage: 'DISCOVERY' };
  }
}

/**
 * Map API status to UI status
 */
export function mapAPIStatusToUIStatus(status?: QuoteStatus): QuoteV2Status {
  switch (status) {
    case 'ORDERED':
      return 'ORDERED';
    case 'EXPIRED':
      return 'EXPIRED';
    case 'LOST':
      return 'LOST';
    default:
      return 'OPEN';
  }
}

/**
 * Transform QuoteLandingPage to QuoteV2 for display
 */
export function transformLandingPageToQuoteV2(quote: QuoteLandingPage): QuoteV2 {
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    stage: mapPipelineStageToUIStage(quote.pipelineStage, quote.status),
    status: mapAPIStatusToUIStatus(quote.status),
    pipelineStage: quote.pipelineStage,
    apiStatus: quote.status,
    published: quote.published,

    // Customer info - not available in landing page, will be empty
    soldToCustomerId: '',
    soldToCustomerName: '',
    billToCustomerId: '',
    billToCustomerName: '',

    // Job info - Coming soon
    jobId: '',
    jobName: '',

    // Pricing - ensure proper number conversion
    quoteAmount: Number(quote.total) || 0,
    basePrice: Number(quote.total) || 0,
    sellPrice: Number(quote.total) || 0,
    commission: Number(quote.commission) || 0,

    // Win tracking - Coming soon
    winProbability: 0,
    approvalStatus: 'clear',
    pendingApprovals: 0,
    blockedApprovals: 0,

    // Dates
    quoteDate: quote.entityDate || '',
    expirationDate: quote.expDate || '',
    entryDate: quote.createdAt || '',

    // Terms - not available in landing page
    paymentTerms: '',
    freightTerms: '',

    // Version - Coming soon
    version: 1,

    // Tags - Coming soon
    tags: [],

    // Counts - Coming soon
    factoriesCount: 0,
    endUsersCount: 0,

    // Created by
    createdById: quote.createdBy,
  };
}

/**
 * Transform full Quote to QuoteV2 for detail display
 */
export function transformQuoteToQuoteV2(quote: Quote): QuoteV2 {
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    stage: mapPipelineStageToUIStage(quote.pipelineStage, quote.status),
    status: mapAPIStatusToUIStatus(quote.status),
    pipelineStage: quote.pipelineStage,
    apiStatus: quote.status,
    creationType: quote.creationType,
    blanket: quote.blanket,
    published: quote.published,

    // Customer info
    soldToCustomerId: quote.soldToCustomerId || '',
    soldToCustomerName: quote.soldToCustomer?.companyName || '',
    billToCustomerId: quote.billToCustomerId || '',
    billToCustomerName: quote.billToCustomer?.companyName || '',

    // Job info
    jobId: quote.job?.id || '',
    jobName: quote.job?.jobName || '',

    // Pricing from balance
    quoteAmount: quote.balance?.total || 0,
    basePrice: quote.balance?.subtotal || 0,
    sellPrice: quote.balance?.total || 0,
    commission: quote.balance?.commission || 0,

    // Win tracking - Coming soon
    winProbability: 0,
    approvalStatus: 'clear',
    pendingApprovals: 0,
    blockedApprovals: 0,

    // Dates
    quoteDate: quote.entityDate || '',
    expirationDate: quote.expDate || '',
    entryDate: quote.createdAt || '',
    revisedDate: quote.reviseDate,
    acceptDate: quote.acceptDate,

    // Terms
    paymentTerms: quote.paymentTerms || '',
    freightTerms: quote.freightTerms || '',

    // Customer reference
    customerRef: quote.customerRef,

    // Inside and outside reps are now extracted from line item split rates
    // They will be populated by QuoteDetailV2Page from the details' insideSplitRates/outsideSplitRates

    // Version
    version: 1,
    versionOf: quote.versionOf,
    duplicatedFrom: quote.duplicatedFrom,

    // Tags - Coming soon
    tags: [],

    // Counts - Coming soon
    factoriesCount: 0,
    endUsersCount: 0,

    // URL
    url: quote.url,

    // Created by
    createdById: quote.createdById,
    createdByName: quote.createdBy?.fullName,
  };
}

/**
 * Transform QuoteDetail to LineItemV2
 */
export function transformQuoteDetailToLineItemV2(detail: QuoteDetail, quoteId: string): LineItemV2 {
  const quantity = detail.quantity || 0;
  const unitPrice = parseFloat(detail.unitPrice || '0');
  const divisor = detail.uom?.divisionFactor || 1;
  const commissionRate = parseFloat(detail.commissionRate || '0');
  const commissionDiscountRate = parseFloat(detail.commissionDiscountRate || '0');
  const discountRate = parseFloat(detail.discountRate || '0');

  return {
    id: detail.id,
    quoteId: quoteId,
    itemNumber: detail.itemNumber,

    // Product info - productNameAdhoc and productDescriptionAdhoc store the part # and description
    productId: detail.productId,
    partNumber: detail.productNameAdhoc || detail.product?.factoryPartNumber || '',
    customerPartNumber: '', // CPN is fetched separately via product CPNs API
    description: detail.productDescriptionAdhoc || detail.product?.description || '',
    manufacturerId: detail.factoryId,
    manufacturerName: '', // Factory name not available in response - selected via dropdown

    // Quantity
    quantity,
    uom: detail.uom?.title || '',
    uomId: detail.uom?.id || '',
    divisor,

    // Pricing
    unitPrice,
    sellTotal: detail.subtotal || 0,
    total: detail.total || 0,

    // Commission
    commissionPercent: commissionRate,
    commission: detail.commission || 0,
    commissionTotal: detail.totalLineCommission || 0,

    // Discount
    discountRate: detail.discountRate,
    discount: detail.discount,

    // End user
    endUserId: detail.endUserId,

    // Additional details
    commissionDiscountPercent: commissionDiscountRate,
    commissionDiscountAmount: detail.commissionDiscount || 0,
    lineDiscountPercent: discountRate,
    lineDiscountAmount: detail.discount || 0,
    leadTime: detail.leadTime,

    // Notes
    note: detail.note,

    // Status
    status: detail.status,

    // Split rates - inside and outside reps at line item level
    insideSplitRates: detail.insideSplitRates,
    outsideSplitRates: detail.outsideSplitRates,
  };
}

/**
 * Check if an ID is a valid UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Transform LineItemV2 back to QuoteDetailInput for API
 *
 * When per-line-item settings are enabled, each line item uses its own split rates/factory.
 * When disabled, all line items use the header-level split rates/factory.
 *
 * @param lineItem - The line item to transform
 * @param headerInsideReps - Header-level inside reps (only used when insideRepAtLineLevel is false)
 * @param headerOutsideReps - Header-level outside reps (only used when outsideRepAtLineLevel is false)
 * @param settings - Quote settings to determine whether to use header or line-item level reps/factory
 * @param headerFactoryId - Header-level factory ID (used when factoryPerLineItem is false)
 */
export function transformLineItemV2ToDetailInput(
  lineItem: LineItemV2,
  headerInsideReps?: { id: string; userId?: string; splitRate?: string; position?: number }[],
  headerOutsideReps?: { id: string; userId?: string; splitRate?: string; position?: number }[],
  settings?: { insideRepAtLineLevel?: boolean; outsideRepAtLineLevel?: boolean; factoryPerLineItem?: boolean },
  headerFactoryId?: string
): {
  id?: string;
  itemNumber?: number;
  quantity: number;
  unitPrice: string;
  commissionDiscountRate?: string;
  commissionRate?: string;
  discountRate?: string;
  endUserId?: string;
  factoryId?: string;
  leadTime?: string;
  note?: string;
  productDescriptionAdhoc?: string;
  productNameAdhoc?: string;
  productId?: string;
  status?: QuoteDetailStatus;
  uomId?: string;
  insideSplitRates?: { id?: string; userId: string; splitRate: number; position?: number }[];
  outsideSplitRates?: { id?: string; userId: string; splitRate: number; position?: number }[];
} {
  // Only include ID if it's a valid UUID (existing item from API)
  // New items with IDs like "li-123456" should not send ID
  const id = lineItem.id && isValidUUID(lineItem.id) ? lineItem.id : undefined;

  // Determine which split rates to use based on settings:
  // - If per-line-item is enabled (insideRepAtLineLevel/outsideRepAtLineLevel = true), use lineItem's split rates
  // - If per-line-item is disabled (false), use header-level reps for all line items
  // - Default: use line item's split rates (backwards compatible)
  const useLineItemInsideReps = settings?.insideRepAtLineLevel !== false;
  const useLineItemOutsideReps = settings?.outsideRepAtLineLevel !== false;

  // Build insideSplitRates - use line item's rates or header rates based on setting
  const insideRepsSource = useLineItemInsideReps ? lineItem.insideSplitRates : headerInsideReps;
  const insideSplitRates = insideRepsSource?.map((rep) => ({
    ...(rep.id && isValidUUID(rep.id) ? { id: rep.id } : {}),
    userId: rep.userId || '',
    splitRate: Number(rep.splitRate) || 100,
    position: rep.position,
  }));

  // Build outsideSplitRates - use line item's rates or header rates based on setting
  const outsideRepsSource = useLineItemOutsideReps ? lineItem.outsideSplitRates : headerOutsideReps;
  const outsideSplitRates = outsideRepsSource?.map((rep) => ({
    ...(rep.id && isValidUUID(rep.id) ? { id: rep.id } : {}),
    userId: rep.userId || '',
    splitRate: Number(rep.splitRate) || 100,
    position: rep.position,
  }));

  // Determine which factoryId to use:
  // - If factoryPerLineItem is true (or undefined for backwards compatibility), use line item's manufacturerId
  // - If factoryPerLineItem is false, use header-level factoryId for all line items
  const useLineItemFactory = settings?.factoryPerLineItem !== false;
  const factoryId = useLineItemFactory ? lineItem.manufacturerId : headerFactoryId;

  return {
    id,
    itemNumber: lineItem.itemNumber,
    quantity: lineItem.quantity,
    unitPrice: lineItem.unitPrice.toString(),
    commissionDiscountRate: lineItem.commissionDiscountPercent?.toString(),
    commissionRate: lineItem.commissionPercent?.toString(),
    discountRate: lineItem.lineDiscountPercent?.toString(),
    // Only include endUserId if it's a valid UUID (not empty string)
    endUserId: lineItem.endUserId && isValidUUID(lineItem.endUserId) ? lineItem.endUserId : undefined,
    factoryId,
    leadTime: lineItem.leadTime,
    note: lineItem.note,
    productDescriptionAdhoc: lineItem.description,
    productNameAdhoc: lineItem.partNumber,
    productId: lineItem.productId,
    status: lineItem.status,
    uomId: lineItem.uomId || undefined,
    insideSplitRates: insideSplitRates && insideSplitRates.length > 0 ? insideSplitRates : undefined,
    outsideSplitRates: outsideSplitRates && outsideSplitRates.length > 0 ? outsideSplitRates : undefined,
  };
}

/**
 * Create empty QuoteV2 for new quote creation
 */
export function createEmptyQuoteV2(): QuoteV2 {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    id: '',
    quoteNumber: '',
    stage: 'Draft',
    status: 'OPEN',
    pipelineStage: 'DISCOVERY',
    published: true, // Default to published

    soldToCustomerId: '',
    soldToCustomerName: '',
    billToCustomerId: '',
    billToCustomerName: '',

    jobId: '',
    jobName: '',

    quoteAmount: 0,
    basePrice: 0,
    sellPrice: 0,
    commission: 0,

    winProbability: 0,
    approvalStatus: 'clear',
    pendingApprovals: 0,
    blockedApprovals: 0,

    quoteDate: today,
    expirationDate: thirtyDaysLater,
    entryDate: today,

    paymentTerms: '',
    freightTerms: '',

    version: 1,
    tags: [],
    factoriesCount: 0,
    endUsersCount: 0,
  };
}
