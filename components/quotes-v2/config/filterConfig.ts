/**
 * Quote Filter and Sort Configuration
 * Note: columnName should match the API QuoteLandingPage field names
 */

export function getQuoteFilterOptions(
  uniqueStatuses: string[],
  uniquePipelineStages: string[],
  uniqueQuoteNumbers: string[],
  uniqueCreators: string[]
) {
  return [
    // Available filters
    { 
      id: 'quote-number', 
      label: 'Quote Number', 
      type: 'dropdown' as const, 
      columnName: 'quoteNumber', 
      available: true,
      options: uniqueQuoteNumbers 
    },
    { 
      id: 'status', 
      label: 'Status', 
      type: 'dropdown' as const, 
      columnName: 'status', 
      available: true, 
      options: uniqueStatuses 
    },
    { 
      id: 'pipeline-stage', 
      label: 'Pipeline Stage', 
      type: 'dropdown' as const, 
      columnName: 'pipelineStage', 
      available: true, 
      options: uniquePipelineStages 
    },
    { 
      id: 'total-amount', 
      label: 'Total Amount', 
      type: 'number' as const, 
      columnName: 'total', 
      available: true 
    },
    { 
      id: 'commission', 
      label: 'Commission', 
      type: 'number' as const, 
      columnName: 'commission', 
      available: true 
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
      type: 'dropdown' as const, 
      columnName: 'published', 
      available: true, 
      options: ['true', 'false'] 
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

