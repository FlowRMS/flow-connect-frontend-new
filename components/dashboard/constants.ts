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
  call: 'Calls',
  email: 'Emails',
  note: 'Notes',
  meeting: 'Meetings',
  task: 'Tasks',
  job: 'Jobs',
  'pre-opportunity': 'Pre-Opportunities',
  contact: 'Contacts',
} as const;

// All activity types
export const ALL_ACTIVITY_TYPES: ActivityType[] = [
  'call',
  'email',
  'note',
  'meeting',
  'task',
  'job',
  'pre-opportunity',
  'contact',
] as const;
