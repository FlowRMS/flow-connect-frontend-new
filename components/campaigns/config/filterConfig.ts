/**
 * Filter and Sort Configuration for Campaigns
 * Note: columnName should match the CampaignLandingPage type field names
 */

import type { FilterOption, SortOption } from '../../lib/filter-utils';

export function getCampaignFilterOptions(
  uniqueStatuses: string[] = [],
  uniqueNames: string[] = []
): FilterOption[] {
  return [
    {
      id: 'name',
      label: 'Name',
      type: 'dropdown',
      columnName: 'name',
      available: true,
      options: uniqueNames
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
      id: 'recipient-list-type',
      label: 'Recipient List Type',
      type: 'dropdown',
      columnName: 'recipientListType',
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
      id: 'recipients',
      label: 'Recipients',
      type: 'number',
      columnName: 'recipientsCount',
      available: false
    },
    {
      id: 'progress',
      label: 'Progress',
      type: 'number',
      columnName: 'progress',
      available: false
    },
  ];
}

export function getCampaignSortOptions(): SortOption[] {
  return [
    { columnName: 'name', label: 'Name' },
    { columnName: 'status', label: 'Status' },
    { columnName: 'createdAt', label: 'Created Date' },
    { columnName: 'recipientsCount', label: 'Recipients' },
  ];
}

