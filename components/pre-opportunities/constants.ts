/**
 * Pre-Opportunity Constants and Configurations
 */

import type { PreOppStage } from './types';
import type { PreOpportunityStatus } from './types';

// Status display configuration
export const STATUS_CONFIG: Record<PreOpportunityStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-500 text-white' },
  PENDING: { label: 'Pending', color: 'bg-blue-500 text-white' },
  APPROVED: { label: 'Approved', color: 'bg-green-500 text-white' },
  REJECTED: { label: 'Rejected', color: 'bg-red-500 text-white' },
  CONVERTED: { label: 'Converted', color: 'bg-purple-500 text-white' },
} as const;

// Default pre-opp stages for Kanban
export const DEFAULT_STAGES: PreOppStage[] = [
  { name: 'DRAFT', displayName: 'Draft', color: 'bg-gray-500' },
  { name: 'PENDING', displayName: 'Pending', color: 'bg-blue-500' },
  { name: 'APPROVED', displayName: 'Approved', color: 'bg-green-500' },
  { name: 'REJECTED', displayName: 'Rejected', color: 'bg-red-500' },
  { name: 'CONVERTED', displayName: 'Converted', color: 'bg-purple-500' },
] as const;

// Stage color mapping
export const STAGE_COLORS: Record<PreOpportunityStatus, string> = {
  DRAFT: 'bg-gray-500 text-white',
  PENDING: 'bg-blue-500 text-white',
  APPROVED: 'bg-green-500 text-white',
  REJECTED: 'bg-red-500 text-white',
  CONVERTED: 'bg-purple-500 text-white',
} as const;

// Filter options column mapping (API column names)
export const FILTER_COLUMN_MAP: Record<string, string> = {
  'entity-number': 'entityNumber',
  'status': 'status',
  'customer': 'soldToCustomerId',
  'job': 'jobId',
  'created-by': 'createdBy',
} as const;

