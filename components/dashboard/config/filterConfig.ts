/**
 * Dashboard Filter Configuration
 */

import { ALL_ACTIVITY_TYPES } from '../constants';
import type { ActivityType } from '../types';

export const activityFilterOptions = [
  { 
    id: 'activity-type', 
    label: 'Activity Type', 
    type: 'dropdown' as const,
    columnName: 'type',
    available: true,
    options: ALL_ACTIVITY_TYPES.map((t: ActivityType) => t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')),
  },
  { 
    id: 'status', 
    label: 'Status', 
    type: 'dropdown' as const,
    columnName: 'activityStatus',
    available: true,
    options: ['Upcoming', 'Completed'],
  },
  { 
    id: 'entity-type', 
    label: 'Entity Type', 
    type: 'dropdown' as const,
    columnName: 'entityType',
    available: true,
    options: ['Job', 'Company', 'Contact', 'Pre-Opportunity', 'Note', 'Task'],
  },
  { 
    id: 'entity-name', 
    label: 'Entity Name', 
    type: 'text' as const,
    columnName: 'entity',
    available: true,
  },
  { 
    id: 'assigned-to', 
    label: 'Assigned To', 
    type: 'text' as const,
    columnName: 'assignedTo',
    available: true,
  },
  { 
    id: 'tags', 
    label: 'Tags', 
    type: 'text' as const,
    columnName: 'tags',
    available: false, // Complex to filter by tags
  },
  { 
    id: 'date-range', 
    label: 'Date Range', 
    type: 'date' as const,
    columnName: 'createdAt',
    available: false, // Date range filtering requires special handling
  },
];
