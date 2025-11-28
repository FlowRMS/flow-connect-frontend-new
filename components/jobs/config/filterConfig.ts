/**
 * Job Filter and Sort Configuration
 */

export function getJobFilterOptions(
  uniqueJobNames: string[],
  uniqueStatuses: string[],
  uniqueTypes: string[],
  uniqueCreators: string[]
) {
  return [
    { id: 'job-name', label: 'Job Name', type: 'text' as const, columnName: 'jobName', available: true, options: uniqueJobNames },
    { id: 'status', label: 'Status', type: 'dropdown' as const, columnName: 'statusName', available: true, options: uniqueStatuses },
    { id: 'job-type', label: 'Job Type', type: 'dropdown' as const, columnName: 'jobType', available: true, options: uniqueTypes },
    { id: 'created-by', label: 'Created By', type: 'text' as const, columnName: 'createdBy', available: true, options: uniqueCreators },
    { id: 'job-id', label: 'Job ID', type: 'text' as const, available: false },
    { id: 'value-min', label: 'Min Value', type: 'number' as const, available: false },
    { id: 'value-max', label: 'Max Value', type: 'number' as const, available: false },
    { id: 'start-date', label: 'Start Date', type: 'date' as const, available: false },
    { id: 'gc', label: 'General Contractor', type: 'dropdown' as const, available: false },
    { id: 'ec', label: 'Electrical Contractor', type: 'dropdown' as const, available: false },
    { id: 'owner', label: 'Owner', type: 'dropdown' as const, available: false },
    { id: 'territory', label: 'Territory', type: 'dropdown' as const, available: false },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const, available: false },
  ];
}

export function getJobSortOptions() {
  return [
    { columnName: 'jobName', label: 'Job Name' },
    { columnName: 'statusName', label: 'Status' },
    { columnName: 'jobType', label: 'Job Type' },
    { columnName: 'createdAt', label: 'Created Date' },
    { columnName: 'startDate', label: 'Start Date' },
  ];
}
