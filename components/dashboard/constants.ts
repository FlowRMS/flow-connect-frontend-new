/**
 * Dashboard Constants and Configurations
 */

import type { ActivityType } from './types';

// Avatar color palette
export const AVATAR_COLORS = [
  'bg-orange-500',
  'bg-teal-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-blue-500',
  'bg-pink-500'
] as const;

// Activity type labels
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  job: 'Jobs',
  company: 'Companies',
  contact: 'Contacts',
  'pre-opportunity': 'Pre-Opportunities',
  note: 'Notes',
  task: 'Tasks',
} as const;

// All activity types
export const ALL_ACTIVITY_TYPES: ActivityType[] = [
  'job',
  'company',
  'contact',
  'pre-opportunity',
  'note',
  'task',
] as const;

// Activity type icons (for UI)
export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  job: '💼',
  company: '🏢',
  contact: '👤',
  'pre-opportunity': '💰',
  note: '📝',
  task: '✓',
} as const;

// Status color mapping
export const STATUS_COLORS: Record<string, string> = {
  // Pre-opportunity statuses
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CONVERTED: 'bg-blue-100 text-blue-700',
  // Task statuses
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  // Default
  default: 'bg-gray-100 text-gray-700',
} as const;

// Priority colors for tasks
export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  NORMAL: 'bg-blue-100 text-blue-600',
  URGENT: 'bg-orange-100 text-orange-600',
  CRITICAL: 'bg-red-100 text-red-600',
} as const;
