/**
 * Quote Filter and Sort Configuration
 * Note: columnName should match the API QuoteLandingPage field names
 */

import type { QuoteV2Status, QuotePipelineStage } from '../types';

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
      type: 'text' as const, 
      columnName: 'quoteNumber', 
      available: true 
    },
    { 
      id: 'status', 
      label: 'Status', 
      type: 'dropdown' as const, 
      columnName: 'status', 
      available: true, 
      options: QUOTE_STATUSES 
    },
    { 
      id: 'pipeline-stage', 
      label: 'Pipeline Stage', 
      type: 'dropdown' as const, 
      columnName: 'pipelineStage', 
      available: true, 
      options: QUOTE_PIPELINE_STAGES 
    },
    { 
      id: 'total-amount', 
      label: 'Total Amount', 
      type: 'number' as const, 
      columnName: 'total', 
      available: true,
      numberFormat: 'currency' as const
    },
    { 
      id: 'commission', 
      label: 'Commission', 
      type: 'number' as const, 
      columnName: 'commission', 
      available: true,
      numberFormat: 'currency' as const
    },
    { 
      id: 'created-date', 
      label: 'Created Date', 
      type: 'date' as const, 
      columnName: 'createdAt', 
      available: true 
    },
    { 
      id: 'published', 
      label: 'Published', 
      type: 'boolean' as const, 
      columnName: 'published', 
      available: true
    },
    { 
      id: 'quote-date', 
      label: 'Quote Date', 
      type: 'date' as const, 
      columnName: 'entityDate', 
      available: true
    },
    // Soon filters
    { 
      id: 'expiration-date', 
      label: 'Expiration Date', 
      type: 'date' as const, 
      columnName: 'expDate', 
      available: false 
    },
    { 
      id: 'created-by', 
      label: 'Created By', 
      type: 'dropdown' as const, 
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

