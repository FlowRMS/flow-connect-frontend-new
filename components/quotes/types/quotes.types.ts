// ============================================
// QUOTES TYPES - Extracted from QuotesContent.tsx
// ============================================

export type Factory = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type Rep = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type EndUser = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type Quote = {
  id: string; // Quote number for display
  uuid: string; // API UUID for navigation/API calls
  name: string;
  billToCustomer: string;
  soldToCustomer: string;
  jobId: string;
  jobName: string;
  stage: 'Draft' | 'Review' | 'Sent' | 'Negotiating' | 'Won' | 'Lost' | 'Dormant';
  status: 'Open' | 'Closed' | 'Expired' | 'Pending';
  quoteType: 'NORMAL' | 'TAG' | 'BLANKET' | 'STORM';
  value: string;
  valueNumber: number;
  winProbability: number;
  entryDate: string;
  quoteDate: string;
  expirationDate: string;
  revisedDate: string;
  acceptDate: string;
  paymentTerms: string;
  freightTerms: string;
  owner: string;
  version: number;
  lastUpdated: string;
  tags: string[];
  approvalStatus: 'clear' | 'pending' | 'blocked';
  pendingApprovals: number;
  factories: Factory[];
  endUsers: EndUser[];
  insideReps: Rep[];
  outsideReps: Rep[];
  published: boolean;
  lostReason?: string;
};

export type OutsideRepSplit = {
  repId: string;
  repName: string;
  percentage: number; // 0-100
};

export type InsideRepSplit = {
  repId: string;
  repName: string;
  percentage: number; // 0-100
};

// Generic rep split type (alias for commission split data)
export type RepSplit = {
  repId: string;
  repName: string;
  percentage: number; // 0-100
};

// Available rep for selection dropdowns
export type AvailableRep = {
  id: string;
  name: string;
};

export type LineItem = {
  id: string;
  quoteId: string;
  sectionId: string;
  sectionName: string;
  productNumber: string;
  description: string;
  endUser: string;
  quantity: number;
  uom?: string; // Unit of measure (EA, FT, LF, etc.) - defaults to 'EA' if not specified
  manufacturers: {
    name: string;
    basePrice: number;
    commissionRate: number;
    overageShare: number;
    approvalStatus: 'approved' | 'conditional' | 'not_approved' | 'unknown';
    approvalDate: string | null;
    approvalNotes: string | null;
  }[];
  basePrice: number;
  sellPrice: number;
  level1Price: number;
  level2Price: number;
  level3Price: number;
  overagePercent: number;
  commissionable: boolean;
  locked: boolean;
  priceHistory: number[]; // Manufacturer price history
  quotedPriceHistory: number[]; // Quoted/sell price history
  hasSpecSheet: boolean;
  specSheetUrl?: string;
  // Outside rep splits for commission
  outsideRepSplits: OutsideRepSplit[];
  // Inside rep splits for commission
  insideRepSplits: InsideRepSplit[];
  // Divisor for unit of measure (e.g., per 100, per 1000)
  useDivisor: boolean;
  divisor: number; // Default 1, can be 100, 1000, etc.
  // Additional line item details
  commissionDiscountPercent?: number;
  commissionDiscountAmount?: number;
  lineDiscountPercent?: number;
  lineDiscountAmount?: number;
  leadTime?: string;
};

export type QuoteFile = {
  id: string;
  quoteId: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  includeInEmail: boolean;
};

export type Section = {
  id: string;
  name: string;
  order: number;
};

export type BuilderApproval = {
  id: string;
  builderId: string;
  builderName: string;
  manufacturerId: string;
  manufacturerName: string;
  status: 'approved' | 'conditional' | 'not_approved';
  category: string;
  conditions: string | null;
  approvedSkus: string[] | null;
  approvedDate: string;
  expirationDate: string | null;
  approvedBy: string;
  documentUrl: string;
  notes: string;
};

export type ApprovalRequest = {
  id: string;
  quoteId: string;
  builderId: string;
  builderName: string;
  manufacturerId: string;
  manufacturerName: string;
  status: 'pending' | 'approved' | 'conditional' | 'rejected';
  requestedDate: string;
  requestedBy: string;
  skus: string[];
  justification: string;
  attachments: string[];
  respondedDate: string | null;
  respondedBy: string | null;
  responseNotes: string | null;
  conditions: string | null;
};

export type Manufacturer = {
  manufacturer_name: string;
  domain: string;
  active: boolean;
};

export type PriceCategory = {
  price_category_name: string;
  description: string;
  default_discount_percent: number;
};

export type DistributorMatrixEntry = {
  distributor_domain: string;
  manufacturer_domain: string;
  price_category: string;
};

export type DistributorQuote = {
  id: string;
  baseQuoteId: string;
  distributorDomain: string;
  distributorName: string;
  status: 'draft' | 'requires_cross' | 'ready_to_send' | 'sent';
  createdAt: string;
  originalTotal: number;
  discountedTotal: number;
  totalDiscount: number;
  discountPercent: number;
  totalLines: number;
  linesRequiringCross: number;
  linesCrossed: number;
  linesApproved: number;
};

export type Recipient = {
  id: string;
  company: string;
  contact: string;
  email: string;
  level: 'Sell' | 'L1' | 'L2' | 'L3';
  price: number;
  sent: string | null;
  opened: boolean;
  distributorQuote: DistributorQuote | null;
  version: number;
};

export type DistributorQuoteLine = {
  id: string;
  distributorQuoteId: string;
  originalSku: string;
  originalManufacturer: string;
  finalSku: string | null;
  finalManufacturer: string | null;
  priceCategory: string | null;
  originalPrice: number;
  finalPrice: number | null;
  quantity: number;
  status: 'approved' | 'requires_cross' | 'crossed' | 'pending';
  description: string;
};

export type CrossAuditLog = {
  id: string;
  distributorDomain: string;
  timestamp: string;
  skuBefore: string;
  skuAfter: string;
  manufacturerBefore: string;
  manufacturerAfter: string;
  priceCategoryApplied: string;
  discountPercent: number;
  crossSource: string | null;
  aiConfidence: number | null;
};

// ============================================
// UI STATE TYPES
// ============================================

export type ColumnKey =
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
  | 'linkedOrder'
  | 'overage'
  | 'overageAmt'
  | 'commRate'
  | 'baseComm'
  | 'overageShare'
  | 'overageComm'
  | 'totalEarn'
  | 'effRate'
  | 'l1'
  | 'l2'
  | 'l3'
  | 'trend'
  | 'specSheet'
  | 'outsideReps'
  | 'commissionDiscountPercent'
  | 'commissionDiscountAmount'
  | 'lineDiscountPercent'
  | 'lineDiscountAmount'
  | 'leadTime';

export type QuickDatePreset = 'all' | 'today' | 'this_week' | 'last_week';

export type QuickDateField = 'entryDate' | 'quoteDate';

export type SavedView = {
  id: string;
  name: string;
  columns: ColumnKey[];
};

export type DetailTabType =
  | 'lines'
  | 'approvals'
  | 'recipients'
  | 'distributors'
  | 'linkedObjects'
  | 'versions'
  | 'notes'
  | 'tasks'
  | 'activity'
  | 'settings'
  | 'submittals';

export type QuoteSortKey =
  | 'id'
  | 'status'
  | 'stage'
  | 'valueNumber'
  | 'billToCustomer'
  | 'soldToCustomer'
  | 'entryDate'
  | 'quoteDate'
  | 'expirationDate'
  | 'factories'
  | 'jobName'
  | 'winProbability'
  | 'approvalStatus'
  | 'endUsers'
  | 'insideReps'
  | 'outsideReps'
  | 'published'
  | 'tags';

export type QuoteColumnFilter = {
  type: 'text' | 'select' | 'multiselect' | 'daterange';
  value: string;
  values?: string[];
  dateFrom?: string;
  dateTo?: string;
};

// Alias for backward compatibility
export type QuoteFilterValue = QuoteColumnFilter;

export type PriceLevel = {
  id: number;
  percent: number;
  description: string;
};

export interface ColumnDefinition {
  key: ColumnKey;
  label: string;
  group: string;
  sortable?: boolean;
  filterable?: boolean;
}

// Linked object types
export type LinkedPreOpp = {
  id: string;
  name: string;
  status: string;
  value: number;
  date: string;
};

export type LinkedOrder = {
  id: string;
  name: string;
  status: string;
  value: number;
  date: string;
};

export type LinkedInvoice = {
  id: string;
  name: string;
  status: string;
  value: number;
  date: string;
};

export type LinkedCommissionStatement = {
  id: string;
  name: string;
  status: string;
  value: number;
  date: string;
};

export type LinkedContact = {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
};

export type LinkedCompany = {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
};

export type LinkedTag = {
  id: string;
  name: string;
  color: string;
};
