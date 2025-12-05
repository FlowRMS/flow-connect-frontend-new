/**
 * Filter and Sort Configuration for Notes
 * Note: columnName should match the ParsedNote type field names
 */

import type { FilterOption, SortOption } from '../../lib/filter-utils';

export function getNoteFilterOptions(
  uniqueTitles: string[] = [],
  uniqueTags: string[] = [],
  uniqueCreators: string[] = []
): FilterOption[] {
  return [
    {
      id: 'title',
      label: 'Title',
      type: 'dropdown',
      columnName: 'title',
      available: true,
      options: uniqueTitles
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
      id: 'created-by',
      label: 'Created By',
      type: 'dropdown',
      columnName: 'createdBy',
      available: true,
      options: uniqueCreators
    },
    {
      id: 'content',
      label: 'Content',
      type: 'text',
      columnName: 'content',
      available: false
    },
    {
      id: 'created-date',
      label: 'Created Date',
      type: 'date',
      columnName: 'createdAt',
      available: false
    },
    {
      id: 'mentions',
      label: 'Mentions',
      type: 'dropdown',
      columnName: 'mentions',
      available: false
    },
  ];
}

export function getNoteSortOptions(): SortOption[] {
  return [
    { columnName: 'title', label: 'Title' },
    { columnName: 'createdAt', label: 'Created Date' },
    { columnName: 'createdBy', label: 'Created By' },
  ];
}
