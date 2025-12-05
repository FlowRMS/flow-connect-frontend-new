/**
 * Dashboard Filter Configuration
 */

import { ALL_ACTIVITY_TYPES } from '../constants';
import type { ActivityType } from '../types';
import type { FilterOption, SortOption } from '../../lib/filter-utils';

export function getActivityFilterOptions(): FilterOption[] {
  return [
    {
      id: 'activity-type',
      label: 'Activity Type',
      type: 'dropdown',
      columnName: 'type',
      available: true,
      options: ALL_ACTIVITY_TYPES.map((t: ActivityType) => t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')),
    },
    {
      id: 'status',
      label: 'Status',
      type: 'dropdown',
      columnName: 'activityStatus',
      available: true,
      options: ['Upcoming', 'Completed'],
    },
    {
      id: 'entity-type',
      label: 'Entity Type',
      type: 'dropdown',
      columnName: 'entityType',
      available: true,
      options: ['Job', 'Company', 'Contact', 'Pre-Opportunity', 'Note', 'Task'],
    },
    {
      id: 'entity-name',
      label: 'Entity Name',
      type: 'text',
      columnName: 'entity',
      available: true,
    },
    {
      id: 'assigned-to',
      label: 'Assigned To',
      type: 'text',
      columnName: 'assignedTo',
      available: true,
    },
    {
      id: 'tags',
      label: 'Tags',
      type: 'text',
      columnName: 'tags',
      available: false,
    },
    {
      id: 'date-range',
      label: 'Date Range',
      type: 'date',
      columnName: 'createdAt',
      available: false,
    },
  ];
}

export function getActivitySortOptions(): SortOption[] {
  return [
    { columnName: 'createdAt', label: 'Created Date' },
    { columnName: 'type', label: 'Activity Type' },
    { columnName: 'entity', label: 'Entity Name' },
    { columnName: 'entityType', label: 'Entity Type' },
  ];
}
