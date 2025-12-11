/**
 * Campaign and Rule Constants and Configurations
 */

import type { FieldConfig, OperatorConfig } from './types';

// Status color mapping
export const STATUS_COLORS: Record<string, string> = {
  'Draft': 'bg-gray-100 text-gray-700',
  'Scheduled': 'bg-blue-100 text-blue-700',
  'Sending': 'bg-yellow-100 text-yellow-700',
  'Completed': 'bg-green-100 text-green-700',
  'Active': 'bg-green-100 text-green-700',
  'Paused': 'bg-yellow-100 text-yellow-700',
} as const;

// Field configurations for each entity type
export const ENTITY_FIELD_MAP: Record<string, FieldConfig[]> = {
  'Contact': [
    { value: 'name', label: 'Name', type: 'text' },
    { value: 'email', label: 'Email', type: 'text' },
    { value: 'company', label: 'Company', type: 'text' },
    { value: 'role', label: 'Role', type: 'text' },
    { value: 'type', label: 'Contact Type', type: 'text' },
    { value: 'tags', label: 'Tags', type: 'text' },
    { value: 'territory', label: 'Territory', type: 'text' },
    { value: 'last_activity', label: 'Last Activity Date', type: 'date' },
    { value: 'created_date', label: 'Created Date', type: 'date' },
  ],
  'Job': [
    { value: 'name', label: 'Job Name', type: 'text' },
    { value: 'status', label: 'Status', type: 'text' },
    { value: 'type', label: 'Job Type', type: 'text' },
    { value: 'value', label: 'Value', type: 'number' },
    { value: 'start_date', label: 'Start Date', type: 'date' },
    { value: 'gc', label: 'General Contractor', type: 'text' },
    { value: 'ec', label: 'Electrical Contractor', type: 'text' },
    { value: 'owner', label: 'Owner', type: 'text' },
    { value: 'tags', label: 'Tags', type: 'text' },
  ],
  'Company': [
    { value: 'name', label: 'Company Name', type: 'text' },
    { value: 'type', label: 'Company Type', type: 'text' },
    { value: 'territory', label: 'Territory', type: 'text' },
    { value: 'tags', label: 'Tags', type: 'text' },
    { value: 'contact_count', label: 'Contact Count', type: 'number' },
    { value: 'job_count', label: 'Job Count', type: 'number' },
    { value: 'last_activity', label: 'Last Activity Date', type: 'date' },
  ],
  'Pre-Opportunity': [
    { value: 'name', label: 'Name', type: 'text' },
    { value: 'stage', label: 'Stage', type: 'text' },
    { value: 'owner', label: 'Owner', type: 'text' },
    { value: 'tags', label: 'Tags', type: 'text' },
    { value: 'created_date', label: 'Created Date', type: 'date' },
    { value: 'due_date', label: 'Due Date', type: 'date' },
  ],
  'Quote': [
    { value: 'name', label: 'Quote Name', type: 'text' },
    { value: 'status', label: 'Status', type: 'text' },
    { value: 'amount', label: 'Amount', type: 'number' },
    { value: 'valid_until', label: 'Valid Until Date', type: 'date' },
    { value: 'created_date', label: 'Created Date', type: 'date' },
    { value: 'owner', label: 'Owner', type: 'text' },
    { value: 'customer', label: 'Customer', type: 'text' },
    { value: 'tags', label: 'Tags', type: 'text' },
  ],
} as const;

// Operator configurations for each field type
export const OPERATOR_MAP: Record<string, OperatorConfig[]> = {
  'text': [
    { value: 'equals', label: 'equals' },
    { value: 'contains', label: 'contains' },
  ],
  'number': [
    { value: 'equals', label: 'equals' },
    { value: 'greater_than', label: 'greater than' },
    { value: 'less_than', label: 'less than' },
  ],
  'date': [
    { value: 'equals', label: 'equals' },
    { value: 'days_until', label: 'days until' },
    { value: 'days_after', label: 'days after' },
  ],
} as const;

// Send pace configurations
export const SEND_PACE_OPTIONS = [
  { value: 'fast', label: 'Fast (500/hour)' },
  { value: 'medium', label: 'Medium (200/hour)' },
  { value: 'slow', label: 'Slow (100/hour)' },
  { value: 'very-slow', label: 'Very Slow (50/hour)' },
  { value: 'randomized', label: 'Randomized (Human-like)' },
] as const;

// Default values
export const DEFAULT_MAX_PER_DAY = 50;
export const DEFAULT_SEND_PACE = 'medium';
