/**
 * Pre-Opportunity Constants and Configurations
 */

import type { PreOppStage } from './types';

// Owner color palette
export const OWNER_COLORS = [
  'bg-orange-500',
  'bg-teal-500',
  'bg-green-500',
  'bg-purple-500'
] as const;

// Default pre-opp stages
export const DEFAULT_STAGES: PreOppStage[] = [
  { name: 'Qualified' },
  { name: 'Negotiation' },
  { name: 'Follow-up' },
  { name: 'Waiting on Factory' },
  { name: 'Lost' },
  { name: 'Converted' },
] as const;

// Stage color mapping
export const STAGE_COLORS: Record<string, string> = {
  'Qualified': 'bg-blue-500 text-white',
  'Negotiation': 'bg-yellow-500 text-white',
  'Follow-up': 'bg-purple-500 text-white',
  'Waiting on Factory': 'bg-orange-500 text-white',
  'Lost': 'bg-red-500 text-white',
  'Converted': 'bg-green-500 text-white',
} as const;

// Filter options column mapping (API column names to UI fields)
export const FILTER_COLUMN_MAP: Record<string, string> = {
  'preopp-id': 'id',
  'preopp-name': 'name',
  'stage': 'stage',
  'job': 'job',
  'sold-to': 'soldTo',
  'manufacturer': 'manufacturer',
  'owner': 'owner',
  'tags': 'tags',
} as const;
