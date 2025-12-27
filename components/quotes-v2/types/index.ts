// Quotes V2 Types
// Designed for easy API integration later

export type QuoteV2Stage = 'Draft' | 'Review' | 'Sent' | 'Negotiating' | 'Won' | 'Lost' | 'Dormant';
export type QuoteV2Status = 'PENDING' | 'OPEN' | 'CLOSED';
export type ApprovalStatus = 'clear' | 'pending' | 'blocked' | 'approved';

export interface QuoteV2 {
  id: string;
  quoteNumber: string;
  stage: QuoteV2Stage;
  status: QuoteV2Status;
  quoteType: 'NORMAL' | 'SPECIAL' | 'BLANKET';

  // Customer info
  soldToCustomerId: string;
  soldToCustomerName: string;
  billToCustomerId: string;
  billToCustomerName: string;

  // Job info
  jobId: string;
  jobName: string;

  // Pricing
  quoteAmount: number;
  basePrice: number;
  sellPrice: number;
  commission: number;

  // Win tracking
  winProbability: number;
  approvalStatus: ApprovalStatus;
  pendingApprovals: number;
  blockedApprovals: number;

  // Dates
  quoteDate: string;
  expirationDate: string;
  entryDate: string;
  revisedDate?: string;
  acceptDate?: string;

  // Terms
  paymentTerms: string;
  freightTerms: string;

  // Reps
  outsideRepId?: string;
  outsideRepName?: string;
  insideRepId?: string;
  insideRepName?: string;

  // Version
  version: number;

  // Published
  published: boolean;

  // Tags
  tags: string[];

  // Factories count for display
  factoriesCount: number;

  // End users count for display
  endUsersCount: number;
}

export interface LineItemV2 {
  id: string;
  quoteId: string;

  // Product info
  partNumber: string;
  customerPartNumber?: string;
  description: string;
  manufacturerId?: string;
  manufacturerName: string;

  // Quantity
  quantity: number;
  uom: string;
  divisor: number;

  // Pricing
  unitPrice: number;
  sellTotal: number;

  // Commission
  commissionPercent: number;
  commission: number;
  commissionTotal: number;

  // Order link
  linkedOrderId?: string;
  linkedOrderNumber?: string;

  // End user
  endUserId?: string;
  endUserName?: string;

  // Additional details (shown in modal)
  commissionDiscountPercent: number;
  commissionDiscountAmount: number;
  lineDiscountPercent: number;
  lineDiscountAmount: number;
  leadTime?: string;
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
