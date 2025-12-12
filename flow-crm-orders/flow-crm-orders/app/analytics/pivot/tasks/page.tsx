'use client';

import PivotTable from '@/components/analytics/PivotTable';

const availableFields = [
  { key: 'count', label: 'Count', type: 'measure' as const },
  { key: 'taskType', label: 'Task Type', type: 'dimension' as const },
  { key: 'assignedTo', label: 'Assigned To', type: 'dimension' as const },
  { key: 'status', label: 'Status', type: 'dimension' as const },
  { key: 'priority', label: 'Priority', type: 'dimension' as const },
  { key: 'entityType', label: 'Entity Type', type: 'dimension' as const },
  { key: 'dueDate', label: 'Due Date', type: 'dimension' as const },
  { key: 'createdDate', label: 'Created Date', type: 'dimension' as const },
  { key: 'completedDate', label: 'Completed Date', type: 'dimension' as const },
  { key: 'manufacturer', label: 'Manufacturer', type: 'dimension' as const },
  { key: 'customer', label: 'Customer', type: 'dimension' as const },
];

// Sample pivot data for tasks
const pivotData = [
  { taskType: 'Call', assignedTo: 'Sarah Johnson', status: 'Completed', count: 87 },
  { taskType: 'Call', assignedTo: 'Mike Thompson', status: 'Completed', count: 93 },
  { taskType: 'Call', assignedTo: 'Lisa Kim', status: 'Completed', count: 76 },
  { taskType: 'Call', assignedTo: 'John Davis', status: 'Completed', count: 82 },
  { taskType: 'Call', assignedTo: 'Emma Roberts', status: 'Completed', count: 100 },
  { taskType: 'Meeting', assignedTo: 'Sarah Johnson', status: 'Completed', count: 42 },
  { taskType: 'Meeting', assignedTo: 'Mike Thompson', status: 'Completed', count: 38 },
  { taskType: 'Meeting', assignedTo: 'Lisa Kim', status: 'Completed', count: 51 },
  { taskType: 'Meeting', assignedTo: 'John Davis', status: 'Completed', count: 45 },
  { taskType: 'Meeting', assignedTo: 'Emma Roberts', status: 'Completed', count: 71 },
  { taskType: 'Email', assignedTo: 'Sarah Johnson', status: 'Completed', count: 124 },
  { taskType: 'Email', assignedTo: 'Mike Thompson', status: 'Completed', count: 98 },
  { taskType: 'Email', assignedTo: 'Lisa Kim', status: 'Completed', count: 115 },
  { taskType: 'Email', assignedTo: 'John Davis', status: 'Completed', count: 107 },
  { taskType: 'Email', assignedTo: 'Emma Roberts', status: 'Completed', count: 118 },
  { taskType: 'Site Visit', assignedTo: 'Sarah Johnson', status: 'Completed', count: 28 },
  { taskType: 'Site Visit', assignedTo: 'Mike Thompson', status: 'Completed', count: 32 },
  { taskType: 'Site Visit', assignedTo: 'Lisa Kim', status: 'Completed', count: 25 },
  { taskType: 'Site Visit', assignedTo: 'John Davis', status: 'Completed', count: 35 },
  { taskType: 'Site Visit', assignedTo: 'Emma Roberts', status: 'Completed', count: 42 },
  { taskType: 'Webinar', assignedTo: 'Sarah Johnson', status: 'Completed', count: 12 },
  { taskType: 'Webinar', assignedTo: 'Mike Thompson', status: 'Completed', count: 8 },
  { taskType: 'Webinar', assignedTo: 'Lisa Kim', status: 'Completed', count: 15 },
  { taskType: 'Webinar', assignedTo: 'John Davis', status: 'Completed', count: 10 },
  { taskType: 'Webinar', assignedTo: 'Emma Roberts', status: 'Completed', count: 18 },
  { taskType: 'Trade Show', assignedTo: 'Sarah Johnson', status: 'Completed', count: 4 },
  { taskType: 'Trade Show', assignedTo: 'Mike Thompson', status: 'Completed', count: 3 },
  { taskType: 'Trade Show', assignedTo: 'Lisa Kim', status: 'Completed', count: 5 },
  { taskType: 'Trade Show', assignedTo: 'John Davis', status: 'Completed', count: 2 },
  { taskType: 'Trade Show', assignedTo: 'Emma Roberts', status: 'Completed', count: 6 },
];

export default function TasksPivotPage() {
  return (
    <PivotTable
      title="Tasks Pivoting"
      description="Detailed task data with pivot table capabilities - Calls, Meetings, Emails, Site Visits, Webinars, Trade Shows"
      availableFields={availableFields}
      data={pivotData}
      defaultRows={['taskType']}
      defaultColumns={['assignedTo']}
      defaultValues={['count']}
    />
  );
}
