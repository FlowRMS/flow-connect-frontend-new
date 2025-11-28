/**
 * Report Scheduler Constants and Configurations
 */

import type { ReportType, DateFilter, AssignedTo, ReportFrequency } from './types';

// Available report types
export const REPORT_TYPES: ReportType[] = [
  'Notes',
  'Jobs',
  'Pre-Opportunities',
  'Quotes',
  'Tasks',
] as const;

// Date filter options
export const DATE_FILTERS: DateFilter[] = [
  'Created Yesterday',
  'Created Last Week',
  'Due Today',
  'Due This Week',
] as const;

// Assigned to options
export const ASSIGNED_TO_OPTIONS: Array<{
  value: AssignedTo;
  description: string;
}> = [
  { value: 'Me', description: 'Only items assigned to you' },
  { value: 'My Team', description: 'Items assigned to your team members' },
  { value: 'All Reps', description: 'All items across the organization' },
] as const;

// Frequency options
export const FREQUENCY_OPTIONS: ReportFrequency[] = [
  'Daily',
  'Weekly',
  'Monthly',
] as const;

// Table column configuration
export const TABLE_COLUMNS = [
  { key: 'name', label: 'Report Name', span: 3 },
  { key: 'typeFilter', label: 'Type & Filter', span: 2 },
  { key: 'scopeFilters', label: 'Scope & Filters', span: 2 },
  { key: 'frequency', label: 'Frequency', span: 2 },
  { key: 'nextRun', label: 'Next Run', span: 2 },
  { key: 'status', label: 'Status', span: 1 },
] as const;
