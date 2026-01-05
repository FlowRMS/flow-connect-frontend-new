/**
 * Check Detail - Type Definitions
 * Local types for the check detail component
 */

import type { CommissionCheck } from '@/lib/types/rms';

// Tab types
export type TabType =
  | 'line-items'
  | 'files'
  | 'deductions'
  | 'notes'
  | 'tasks'
  | 'activity'
  | 'linked-objects'
  | 'settings';

// Check status (different from CommissionCheck status, this is posted/unposted)
export type CheckStatus = 'posted' | 'unposted';

// Allocation method for adjustments
export type AllocationMethod = 'rep-split' | 'customer' | 'even-distribution';

// Column configuration for line items table
export type ColumnKey =
  | 'number'
  | 'orderNumber'
  | 'customer'
  | 'salesRep'
  | 'commissionRate'
  | 'expectedCommission'
  | 'paidCommission'
  | 'balance'
  | 'paid';

// Rep split configuration (for adjustments)
export interface RepSplit {
  repName: string;
  percentage: number;
}

// Adjustment/Deduction interface
export interface Adjustment {
  id: string;
  factory: string; // Read-only, from the check
  amount: number; // Always negative for deductions
  reason: string;
  source: 'manual' | 'upload';
  uploadId?: string; // If source is upload, link to the upload
  uploadName?: string; // Display name for the upload
  createdAt: Date; // Read-only creation date
  allocationMethod: AllocationMethod;
  allocationTarget: string; // Customer name for 'customer' method
  repSplits: RepSplit[]; // For 'rep-split' method
  // ID for API operations
  adjustmentId?: string;
}

// Line item interface - supports invoice, credit, and adjustment types
export interface LineItem {
  id: string;
  type: 'invoice' | 'credit' | 'adjustment';
  number: string; // Invoice number, credit number, or adjustment number
  orderId: string; // Order UUID from API (empty for adjustments)
  orderNumber?: string; // Human-readable order number from nested order object
  customer: string;
  salesRep: string;
  commissionRateExpected: number;
  commissionRateActual: number;
  expectedCommission: number;
  paidCommission: number;
  balance: number;
  paid: boolean;
  // IDs for API operations
  invoiceId?: string;
  creditId?: string;
  adjustmentId?: string;
  // Additional data from API
  entityDate?: string;
  dueDate?: string;
  status?: string;
  createdAt?: string;
  url?: string;
  // For credits
  creditType?: string;
  reason?: string;
  // For adjustments
  amount?: number;
  factoryId?: string;
  factoryName?: string; // From adjustment.factory.title
  customerName?: string; // From adjustment.customer.companyName
  locked?: boolean;
}

// Version info
export interface VersionInfo {
  version: number;
  date: string;
  isLatest: boolean;
}

// Tab configuration
export interface TabConfig {
  id: TabType;
  label: string;
  count?: number;
}

// Saved view configuration
export interface SavedView {
  id: string;
  name: string;
  columns: ColumnKey[];
}

// Check with unposted lines (for reconciliation)
export interface CheckWithUnpostedLines {
  id: string;
  checkNumber: string;
  hasUnpostedLines: boolean;
}

