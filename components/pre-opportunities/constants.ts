/**
 * Pre-Opportunity Constants and Configurations
 */

import type { PreOppStage } from './types';
import type { PreOpportunityStatus } from './types';

// Status display configuration
export const STATUS_CONFIG: Record<PreOpportunityStatus, { label: string; color: string }> = {
  QUALIFIED: { label: 'Qualified', color: 'bg-blue-500 text-white' },
  NEGOTIATION: { label: 'Negotiation', color: 'bg-purple-500 text-white' },
  FOLLOW_UP: { label: 'Follow Up', color: 'bg-yellow-500 text-white' },
  WAITING_ON_FACTORY: { label: 'Waiting on Factory', color: 'bg-orange-500 text-white' },
  LOST: { label: 'Lost', color: 'bg-red-500 text-white' },
  WON: { label: 'Won', color: 'bg-green-500 text-white' },
} as const;

// Default pre-opp stages for Kanban
export const DEFAULT_STAGES: PreOppStage[] = [
  { name: 'QUALIFIED', displayName: 'Qualified', color: 'bg-blue-500' },
  { name: 'NEGOTIATION', displayName: 'Negotiation', color: 'bg-purple-500' },
  { name: 'FOLLOW_UP', displayName: 'Follow Up', color: 'bg-yellow-500' },
  { name: 'WAITING_ON_FACTORY', displayName: 'Waiting on Factory', color: 'bg-orange-500' },
  { name: 'LOST', displayName: 'Lost', color: 'bg-red-500' },
  { name: 'WON', displayName: 'Won', color: 'bg-green-500' },
] as const;

// Stage color mapping
export const STAGE_COLORS: Record<PreOpportunityStatus, string> = {
  QUALIFIED: 'bg-blue-500 text-white',
  NEGOTIATION: 'bg-purple-500 text-white',
  FOLLOW_UP: 'bg-yellow-500 text-white',
  WAITING_ON_FACTORY: 'bg-orange-500 text-white',
  LOST: 'bg-red-500 text-white',
  WON: 'bg-green-500 text-white',
} as const;

// Filter options column mapping (API column names)
export const FILTER_COLUMN_MAP: Record<string, string> = {
  'entity-number': 'entityNumber',
  'status': 'status',
  'customer': 'soldToCustomerId',
  'job': 'jobId',
  'created-by': 'createdBy',
} as const;

