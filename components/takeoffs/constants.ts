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

// Filter options for take-offs list
export const TAKEOFF_FILTER_OPTIONS: TakeoffFilterOption[] = [
  { id: 'takeoff-id', label: 'Takeoff ID', type: 'text' },
  { id: 'title', label: 'Title', type: 'text' },
  { id: 'status', label: 'Status', type: 'dropdown' },
  { id: 'created-by', label: 'Created By', type: 'dropdown' },
  { id: 'date', label: 'Date', type: 'date' },
] as const;

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
