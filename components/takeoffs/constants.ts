/**
 * Take-Off Constants and Configurations
 */

import type { TakeoffFilterOption, StepConfig, DocumentCategory, TakeoffStatus } from './types';

// Status color mapping
export const STATUS_COLORS: Record<TakeoffStatus, string> = {
  'Complete': 'bg-green-500 text-white',
  'Parsing': 'bg-blue-500 text-white',
  'Abridgment': 'bg-yellow-500 text-white',
  'Classification': 'bg-purple-500 text-white',
} as const;

// Default status color
export const DEFAULT_STATUS_COLOR = 'bg-gray-500 text-white';

// Status options for filtering
export const TAKEOFF_STATUS_OPTIONS = [
  'Classification',
  'Abridgment',
  'Parsing',
  'Complete',
] as const;

// Priority options for filtering
export const TAKEOFF_PRIORITY_OPTIONS = [
  'Low',
  'Medium',
  'High',
] as const;

// Source options for filtering
export const TAKEOFF_SOURCE_OPTIONS = [
  'Upload',
  'Email',
  'API',
] as const;

// Discipline options for document filtering
export const DOCUMENT_DISCIPLINE_OPTIONS = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Fire Protection',
  'Lighting',
  'General',
] as const;

// Filter options for take-offs list
export const TAKEOFF_FILTER_OPTIONS: TakeoffFilterOption[] = [
  { id: 'title', label: 'Title', type: 'text', columnName: 'title' },
  {
    id: 'status',
    label: 'Status',
    type: 'dropdown',
    columnName: 'status',
    options: [...TAKEOFF_STATUS_OPTIONS],
  },
  {
    id: 'priority',
    label: 'Priority',
    type: 'dropdown',
    columnName: 'priority',
    options: [...TAKEOFF_PRIORITY_OPTIONS],
  },
  {
    id: 'source',
    label: 'Source',
    type: 'dropdown',
    columnName: 'source',
    options: [...TAKEOFF_SOURCE_OPTIONS],
  },
  { id: 'createdBy', label: 'Created By', type: 'text', columnName: 'createdBy' },
  { id: 'createdDate', label: 'Created Date', type: 'date', columnName: 'createdDate' },
];

// Step configuration for detail view
export const TAKEOFF_STEPS: StepConfig[] = [
  { id: 'classification', label: 'Classification', icon: '📑' },
  { id: 'parsing', label: 'Schedule Parsing', icon: '🔍' },
] as const;

// Document classification options
export const CLASSIFICATION_OPTIONS = [
  { value: 'Fixture Schedules', label: 'Fixture Schedules' },
  { value: 'Specifications', label: 'Specifications' },
  { value: 'Blueprints', label: 'Blueprints' },
  { value: 'Other Docs', label: 'Other Useful Docs' },
  { value: 'Irrelevant', label: 'Irrelevant' },
] as const;

// Default document categories for tabs
export const DEFAULT_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'Fixture Schedules', label: 'Fixture Schedules', count: 0 },
  { id: 'Specifications', label: 'Specifications', count: 0 },
  { id: 'Blueprints', label: 'Blueprints', count: 0 },
  { id: 'Other Docs', label: 'Other Docs', count: 0 },
  { id: 'Irrelevant', label: 'Irrelevant', count: 0 },
] as const;

// Abridgment threshold (pages above this can be abridged)
export const ABRIDGMENT_PAGE_THRESHOLD = 20;

// Abridgment reduction factor (what percentage of pages remain)
export const ABRIDGMENT_REDUCTION_FACTOR = 0.2;

// Maximum files for upload
export const MAX_UPLOAD_FILES = 20;

// Accepted file types
export const ACCEPTED_FILE_TYPES = '.pdf';

// Sort options for take-offs
export const TAKEOFF_SORT_OPTIONS = [
  { columnName: 'title', label: 'Title' },
  { columnName: 'createdDate', label: 'Created Date' },
  { columnName: 'status', label: 'Status' },
  { columnName: 'createdBy', label: 'Created By' },
] as const;
