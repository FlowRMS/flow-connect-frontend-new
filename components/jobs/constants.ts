/**
 * Job Constants and Configurations
 */

import type { RepTypeConfig, CompanyTypeConfig } from './types';

// Owner color palette
export const OWNER_COLORS = [
  'bg-orange-500',
  'bg-teal-500',
  'bg-green-500',
  'bg-purple-500'
] as const;

// Default visible categories for connected entities
export const DEFAULT_VISIBLE_CATEGORIES = [
  'contacts',
  'companies',
  'pre-opportunities',
  'quotes',
  'orders',
  'invoices',
  'checks',
  'documents'
] as const;

// Status color mapping
export const STATUS_COLORS: Record<string, string> = {
  'Backlog': 'bg-gray-500 text-white',
  'Bidding': 'bg-blue-500 text-white',
  'Active': 'bg-yellow-500 text-white',
  'On Hold': 'bg-purple-500 text-white',
  'Won': 'bg-green-500 text-white',
} as const;

// Default job stages (fallback when API doesn't provide)
export const DEFAULT_STAGES = [
  { name: 'Backlog' },
  { name: 'Bidding' },
  { name: 'Active' },
  { name: 'On Hold' },
  { name: 'Won' },
] as const;

// Rep type configurations
export const REP_TYPE_CONFIG: Record<string, RepTypeConfig> = {
  electrical: {
    label: 'Electrical Rep',
    contactTypes: ['EC', 'GC', 'EE', 'Owner', 'Architect', 'Distributor'],
  },
  plumbing: {
    label: 'Plumbing Rep',
    contactTypes: ['Mechanical Contractor', 'Plumber', 'Engineer', 'GC'],
  },
  hvac: {
    label: 'HVAC Rep',
    contactTypes: ['Mechanical Contractor', 'Design Engineer', 'Commissioning Agent'],
  },
  'building-materials': {
    label: 'Building Materials Rep',
    contactTypes: ['Architect', 'GC', 'Installer', 'Distributor'],
  },
} as const;

// Company type configurations for each rep type
export const COMPANY_TYPE_CONFIG: Record<string, CompanyTypeConfig> = {
  electrical: {
    companyTypes: ['EC', 'GC', 'EE', 'Owner', 'Architect', 'Distributor'],
  },
  plumbing: {
    companyTypes: ['Mechanical Contractor', 'Plumber', 'Engineer', 'GC'],
  },
  hvac: {
    companyTypes: ['Mechanical Contractor', 'Design Engineer', 'Commissioning Agent'],
  },
  'building-materials': {
    companyTypes: ['Architect', 'GC', 'Installer', 'Distributor'],
  },
} as const;

// Filter options column mapping (API column names to UI fields)
export const FILTER_COLUMN_MAP: Record<string, string> = {
  'jobName': 'name',
  'statusName': 'status',
  'jobType': 'type',
  'createdBy': 'createdBy',
} as const;

// Sort options for jobs
export const JOB_SORT_OPTIONS = [
  { columnName: 'jobName', label: 'Job Name' },
  { columnName: 'statusName', label: 'Status' },
  { columnName: 'jobType', label: 'Job Type' },
  { columnName: 'createdAt', label: 'Created Date' },
  { columnName: 'startDate', label: 'Start Date' },
] as const;
