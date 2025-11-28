/**
 * Dashboard Filter Configuration
 */

export const activityFilterOptions = [
  { id: 'activity-type', label: 'Activity Type', type: 'dropdown' as const },
  { id: 'assigned-to', label: 'Assigned To', type: 'dropdown' as const },
  { id: 'entity-type', label: 'Entity Type', type: 'dropdown' as const },
  { id: 'entity-name', label: 'Entity Name', type: 'text' as const },
  { id: 'tags', label: 'Tags', type: 'dropdown' as const },
  { id: 'date-range', label: 'Date Range', type: 'date' as const },
  { id: 'status', label: 'Status', type: 'dropdown' as const },
];
