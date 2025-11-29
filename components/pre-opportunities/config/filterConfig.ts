/**
 * Pre-Opportunity Filter and Sort Configuration
 * Note: columnName should match the PreOpportunityLandingPage type field names
 */

export function getPreOppFilterOptions(
  uniqueEntityNumbers: string[],
  uniqueStatuses: string[],
  uniqueCreatedBy: string[]
) {
  return [
    { 
      id: 'entity-number', 
      label: 'Entity Number', 
      type: 'dropdown' as const, 
      columnName: 'entityNumber', 
      available: true, 
      options: uniqueEntityNumbers 
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
      id: 'created-by', 
      label: 'Created By', 
      type: 'dropdown' as const, 
      columnName: 'createdBy', 
      available: true, 
      options: uniqueCreatedBy 
    },
    { 
      id: 'total-min', 
      label: 'Min Total', 
      type: 'number' as const, 
      columnName: 'total',
      available: false 
    },
    { 
      id: 'total-max', 
      label: 'Max Total', 
      type: 'number' as const, 
      columnName: 'total',
      available: false 
    },
  ];
}

export function getPreOppSortOptions() {
  return [
    { columnName: 'entityNumber', label: 'Entity Number' },
    { columnName: 'status', label: 'Status' },
    { columnName: 'total', label: 'Total Value' },
    { columnName: 'entityDate', label: 'Entity Date' },
    { columnName: 'expDate', label: 'Expiration Date' },
    { columnName: 'createdAt', label: 'Created Date' },
  ];
}

