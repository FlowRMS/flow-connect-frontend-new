/**
 * Task Filter and Sort Configuration
 */

export function getTaskFilterOptions() {
  return [
    { id: 'task-id', label: 'Task ID', type: 'text' as const },
    { id: 'title', label: 'Task Title', type: 'text' as const },
    { id: 'status', label: 'Status', type: 'dropdown' as const },
    { id: 'task-type', label: 'Task Type', type: 'dropdown' as const },
    { id: 'priority', label: 'Priority', type: 'dropdown' as const },
    { id: 'assigned-to', label: 'Assigned To', type: 'dropdown' as const },
    { id: 'due-date', label: 'Due Date', type: 'date' as const },
    { id: 'reminder-date', label: 'Reminder Date', type: 'date' as const },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const },
    { id: 'related-job', label: 'Related Job', type: 'dropdown' as const },
    { id: 'related-contact', label: 'Related Contact', type: 'dropdown' as const },
    { id: 'related-company', label: 'Related Company', type: 'dropdown' as const },
  ];
}

export function getTaskSortOptions() {
  return [
    { columnName: 'title', label: 'Task Title' },
    { columnName: 'dueDate', label: 'Due Date' },
    { columnName: 'status', label: 'Status' },
    { columnName: 'priority', label: 'Priority' },
    { columnName: 'assignedTo', label: 'Assigned To' },
    { columnName: 'taskType', label: 'Task Type' },
  ];
}
