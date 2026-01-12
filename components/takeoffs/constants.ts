/**
 * Take-Off Constants and Configurations
 */

import type { TakeoffFilterOption, TakeoffStatus } from './types';

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

// Filter options for take-offs list
// Note: "Created By" filter removed - backend now uses created_by_id (UUID) from auth
export const TAKEOFF_FILTER_OPTIONS: TakeoffFilterOption[] = [
  { id: 'takeoffId', label: 'Takeoff ID', type: 'text', columnName: 'id' },
  { id: 'title', label: 'Title', type: 'text', columnName: 'title' },
  {
    id: 'status',
    label: 'Status',
    type: 'dropdown',
    columnName: 'status',
    options: [...TAKEOFF_STATUS_OPTIONS],
  },
  { id: 'date', label: 'Date', type: 'date', columnName: 'createdDate' },
];

// Document classification options
export const CLASSIFICATION_OPTIONS = [
  { value: 'Fixture Schedules', label: 'Fixture Schedules' },
  { value: 'Specifications', label: 'Specifications' },
  { value: 'Blueprints', label: 'Blueprints' },
  { value: 'Other Docs', label: 'Other Useful Docs' },
  { value: 'Irrelevant', label: 'Irrelevant' },
] as const;

// Abridgment threshold (pages above this can be abridged)
export const ABRIDGMENT_PAGE_THRESHOLD = 20;

// Abridgment reduction factor (what percentage of pages remain)
export const ABRIDGMENT_REDUCTION_FACTOR = 0.2;

// Maximum files for upload
export const MAX_UPLOAD_FILES = 20;

// Accepted file types
export const ACCEPTED_FILE_TYPES = '.pdf';
