/**
 * Quote Filter and Sort Configuration
 * Note: columnName should match the API QuoteLandingPage field names
 */

import type { QuoteV2Status, QuotePipelineStage } from '../types';
import { ColumnFilterTypeEnum } from '@/components/advancedFilters/types';

export const QUOTE_STATUSES: QuoteV2Status[] = ['OPEN', 'ORDERED', 'EXPIRED', 'LOST'];

export const QUOTE_PIPELINE_STAGES: string[] = [
  'DISCOVERY',
  'PROSPECT',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
] as QuotePipelineStage[];

export function getQuoteFilterOptions(
  uniqueQuoteNumbers: string[],
  uniqueCreators: string[]
) {
  return [
    // Available filters
    { 
      id: 'quote-number', 
      label: 'Quote Number', 
      type: ColumnFilterTypeEnum.text, 
      columnName: 'quoteNumber', 
      available: true 
    },
    { 
      id: 'status', 
      label: 'Status', 
      type: ColumnFilterTypeEnum.dropdown, 
      columnName: 'status', 
      available: true, 
      options: QUOTE_STATUSES 
    },
    { 
      id: 'pipeline-stage', 
      label: 'Pipeline Stage', 
      type: ColumnFilterTypeEnum.dropdown, 
      columnName: 'pipelineStage', 
      available: true, 
      options: QUOTE_PIPELINE_STAGES 
    },
    { 
      id: 'total-amount', 
      label: 'Total Amount', 
      type: ColumnFilterTypeEnum.number, 
      columnName: 'total', 
      available: true,
      numberFormat: 'currency' as const
    },
    { 
      id: 'commission', 
      label: 'Commission', 
      type: ColumnFilterTypeEnum.number, 
      columnName: 'commission', 
      available: true,
      numberFormat: 'currency' as const
    },
    { 
      id: 'created-date', 
      label: 'Created Date', 
      type: ColumnFilterTypeEnum.date, 
      columnName: 'createdAt', 
      available: true 
    },
    { 
      id: 'published', 
      label: 'Published', 
      type: ColumnFilterTypeEnum.boolean, 
      columnName: 'published', 
      available: true
    },
    { 
      id: 'quote-date', 
      label: 'Quote Date', 
      type: ColumnFilterTypeEnum.date, 
      columnName: 'entityDate', 
      available: true
    },
    // TODO: Backend does not yet support filtering by end users on QuoteLandingPages.
    // When API supports an 'endUsers' filter, re-enable this filter option.
    // {
    //   id: 'end-users',
    //   label: 'End Users',
    //   type: ColumnFilterTypeEnum.customer,
    //   columnName: 'endUsers',
    //   available: true,
    // },
    // Soon filters
    { 
      id: 'expiration-date', 
      label: 'Expiration Date', 
      type: ColumnFilterTypeEnum.date, 
      columnName: 'expDate', 
      available: false 
    },
    { 
      id: 'created-by', 
      label: 'Created By', 
      type: ColumnFilterTypeEnum.dropdown, 
      columnName: 'createdBy', 
      available: false,
      options: uniqueCreators 
    },
  ];
}

export function getQuoteSortOptions() {
  return [
    { columnName: 'quoteNumber', label: 'Quote Number' },
    { columnName: 'status', label: 'Status' },
    { columnName: 'pipelineStage', label: 'Pipeline Stage' },
    { columnName: 'total', label: 'Total Amount' },
    { columnName: 'entityDate', label: 'Quote Date' },
    { columnName: 'createdAt', label: 'Created Date' },
    { columnName: 'expDate', label: 'Expiration Date' },
  ];
}

