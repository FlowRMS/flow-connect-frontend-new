/**
 * Task Filter and Sort Configuration
 * Note: columnName should match the UI Task type field names
 */

import type { FilterOption, SortOption } from '../../lib/filter-utils';

export function getTaskFilterOptions(
  uniqueTitles: string[] = [],
  uniqueStatuses: string[] = [],
  uniqueTaskTypes: string[] = [],
  uniquePriorities: string[] = [],
  uniqueAssignees: string[] = [],
  uniqueTags: string[] = []
): FilterOption[] {
  return [
    {
      id: 'title',
      label: 'Task Title',
      type: 'dropdown',
      columnName: 'title',
      available: true,
      options: uniqueTitles
    },
    {
      id: 'status',
      label: 'Status',
      type: 'dropdown',
      columnName: 'status',
      available: true,
      options: uniqueStatuses
    },
    {
      id: 'task-type',
      label: 'Task Type',
      type: 'dropdown',
      columnName: 'taskType',
      available: true,
      options: uniqueTaskTypes
    },
    {
      id: 'priority',
      label: 'Priority',
      type: 'dropdown',
      columnName: 'priority',
      available: true,
      options: uniquePriorities
    },
    {
      id: 'assigned-to',
      label: 'Assigned To',
      type: 'dropdown',
      columnName: 'assignedTo',
      available: true,
      options: uniqueAssignees
    },
    {
      id: 'tags',
      label: 'Tags',
      type: 'dropdown',
      columnName: 'tags',
      available: true,
      options: uniqueTags
    },
    {
      id: 'task-id',
      label: 'Task ID',
      type: 'text',
      columnName: 'id',
      available: false
    },
    {
      id: 'due-date',
      label: 'Due Date',
      type: 'date',
      columnName: 'dueDate',
      available: false
    },
    {
      id: 'reminder-date',
      label: 'Reminder Date',
      type: 'date',
      columnName: 'reminderDate',
      available: false
    },
    {
      id: 'related-job',
      label: 'Related Job',
      type: 'dropdown',
      columnName: 'relatedJob',
      available: false
    },
    {
      id: 'related-contact',
      label: 'Related Contact',
      type: 'dropdown',
      columnName: 'relatedContact',
      available: false
    },
    {
      id: 'related-company',
      label: 'Related Company',
      type: 'dropdown',
      columnName: 'relatedCompany',
      available: false
    },
  ];
}

export function getTaskSortOptions(): SortOption[] {
  return [
    { columnName: 'title', label: 'Task Title' },
    { columnName: 'dueDate', label: 'Due Date' },
    { columnName: 'status', label: 'Status' },
    { columnName: 'priority', label: 'Priority' },
    { columnName: 'assignedTo', label: 'Assigned To' },
    { columnName: 'taskType', label: 'Task Type' },
    { columnName: 'createdAt', label: 'Created Date' },
  ];
}
