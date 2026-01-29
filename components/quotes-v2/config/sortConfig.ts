/**
 * Quote Sort Configuration
 * Defines all available sort options for quotes
 */

import type { SortConfig, ActiveSort } from '@/components/shared/sorting/types';

export const QUOTE_SORT_CONFIGS: SortConfig[] = [
  {
    id: 'quoteNumber',
    label: 'Quote Number',
    backendColumn: 'quoteNumber',
    availableInMenu: true,
    availableInColumns: true,
    defaultDirection: 'DESC',
  },
  {
    id: 'quoteAmount',
    label: 'Amount',
    backendColumn: 'total',
    availableInMenu: true,
    availableInColumns: true,
    defaultDirection: 'DESC',
  },
  {
    id: 'entryDate',
    label: 'Created Date',
    backendColumn: 'createdAt',
    availableInMenu: true,
    availableInColumns: true,
    defaultDirection: 'DESC',
  },
  {
    id: 'quoteDate',
    label: 'Quote Date',
    backendColumn: 'entityDate',
    availableInMenu: true,
    availableInColumns: true,
    defaultDirection: 'DESC',
  },
  {
    id: 'status',
    label: 'Status',
    backendColumn: 'status',
    availableInMenu: false,
    availableInColumns: true,
    defaultDirection: 'ASC',
  },
  {
    id: 'pipelineStage',
    label: 'Pipeline Stage',
    backendColumn: 'pipelineStage',
    availableInMenu: false,
    availableInColumns: true,
    defaultDirection: 'ASC',
  },
  {
    id: 'commission',
    label: 'Commission',
    backendColumn: 'commission',
    availableInMenu: false,
    availableInColumns: true,
    defaultDirection: 'DESC',
  },
  {
    id: 'expirationDate',
    label: 'Expiration Date',
    backendColumn: 'expDate',
    availableInMenu: false,
    availableInColumns: true,
    defaultDirection: 'ASC',
  },
  {
    id: 'published',
    label: 'Published',
    backendColumn: 'published',
    availableInMenu: false,
    availableInColumns: true,
    defaultDirection: 'DESC',
  },
  {
    id: 'soldToCustomerName',
    label: 'Customer',
    backendColumn: 'soldToCustomerName',
    availableInMenu: false,
    availableInColumns: true,
    defaultDirection: 'ASC',
  },
  {
    id: 'factories',
    label: 'Factories',
    backendColumn: 'factories',
    availableInMenu: true,
    availableInColumns: true,
    defaultDirection: 'ASC',
  },
  {
    id: 'endUsers',
    label: 'End Users',
    backendColumn: 'endUsers',
    availableInMenu: true,
    availableInColumns: true,
    defaultDirection: 'ASC',
  },
];

export const DEFAULT_QUOTE_SORT: ActiveSort = {
  columnId: 'entryDate',
  direction: 'DESC',
};

