/**
 * Pre-Opportunity Filter and Sort Configuration
 */

export function getPreOppFilterOptions(
  uniquePreOppNames: string[],
  uniqueStages: string[],
  uniqueJobs: string[],
  uniqueSoldTo: string[],
  uniqueManufacturers: string[],
  uniqueOwners: string[],
  uniqueTags: string[]
) {
  return [
    { id: 'preopp-id', label: 'Pre-Opp ID', type: 'text' as const, columnName: 'preopp-id', available: true },
    { id: 'preopp-name', label: 'Pre-Opp Name', type: 'text' as const, columnName: 'preopp-name', available: true, options: uniquePreOppNames },
    { id: 'stage', label: 'Stage', type: 'dropdown' as const, columnName: 'stage', available: true, options: uniqueStages },
    { id: 'job', label: 'Job', type: 'text' as const, columnName: 'job', available: true, options: uniqueJobs },
    { id: 'value-min', label: 'Min Value', type: 'number' as const, available: false },
    { id: 'value-max', label: 'Max Value', type: 'number' as const, available: false },
    { id: 'sold-to', label: 'Sold To', type: 'dropdown' as const, columnName: 'sold-to', available: true, options: uniqueSoldTo },
    { id: 'manufacturer', label: 'Manufacturer', type: 'dropdown' as const, columnName: 'manufacturer', available: true, options: uniqueManufacturers },
    { id: 'owner', label: 'Owner', type: 'dropdown' as const, columnName: 'owner', available: true, options: uniqueOwners },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const, columnName: 'tags', available: false, options: uniqueTags },
  ];
}

export function getPreOppSortOptions() {
  return [
    { columnName: 'name', label: 'Pre-Opp Name' },
    { columnName: 'stage', label: 'Stage' },
    { columnName: 'value', label: 'Value' },
    { columnName: 'dateCreated', label: 'Created Date' },
    { columnName: 'expirationDate', label: 'Expiration Date' },
  ];
}
