/**
 * Task Utility Functions
 */

import { ASSIGNEE_COLORS, PRIORITY_COLORS, API_PRIORITY_COLORS } from './constants';
import type {
  Task,
  TaskPriority,
  TaskStatus,
  TaskStatusAPI,
  TaskPriorityAPI,
  TaskLandingPage,
  ParsedTask,
  TaskRelatedEntities,
  LinkedTitle,
} from './types';
import type { CRMTask } from '../lib/crm-graphql';
import type { ActiveFilter } from '../AdvancedFilters';
import { formatLocalDate } from '../lib/date-utils';

// Status mappings
const apiStatusToUI: Record<TaskStatusAPI, TaskStatus> = {
  'TODO': 'Today',
  'IN_PROGRESS': 'Upcoming',
  'COMPLETED': 'Completed',
  'CANCELLED': 'Waiting',
};

const uiStatusToAPI: Record<TaskStatus, TaskStatusAPI> = {
  'Today': 'TODO',
  'Overdue': 'TODO',
  'Upcoming': 'IN_PROGRESS',
  'Completed': 'COMPLETED',
  'Waiting': 'CANCELLED',
};

// Priority mappings
const apiPriorityToUI: Record<TaskPriorityAPI, TaskPriority> = {
  'LOW': 'Low priority',
  'NORMAL': 'Normal',
  'URGENT': 'Urgent',
  'CRITICAL': 'Critical',
};

const uiPriorityToAPI: Record<TaskPriority, TaskPriorityAPI> = {
  'Low priority': 'LOW',
  'Normal': 'NORMAL',
  'Urgent': 'URGENT',
  'Critical': 'CRITICAL',
};

/**
 * Convert API status to UI status
 */
export function convertAPIStatusToUI(apiStatus: TaskStatusAPI, dueDate?: string): TaskStatus {
  // Check if overdue
  if (apiStatus === 'TODO' && dueDate) {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    if (due < today) {
      return 'Overdue';
    }
    // Check if today
    if (due.getTime() === today.getTime()) {
      return 'Today';
    }
  }
  return apiStatusToUI[apiStatus] || 'Today';
}

/**
 * Convert UI status to API status
 */
export function convertUIStatusToAPI(uiStatus: TaskStatus): TaskStatusAPI {
  return uiStatusToAPI[uiStatus] || 'TODO';
}

/**
 * Convert API priority to UI priority
 */
export function convertAPIPriorityToUI(apiPriority: TaskPriorityAPI): TaskPriority {
  return apiPriorityToUI[apiPriority] || 'Low priority';
}

/**
 * Convert UI priority to API priority
 */
export function convertUIPriorityToAPI(uiPriority: TaskPriority): TaskPriorityAPI {
  return uiPriorityToAPI[uiPriority] || 'LOW';
}

/**
 * Parse linkedTitles array into array of LinkedTitle objects
 * Format from API: ["TYPE:Name", "TYPE:Name"] e.g. ["JOB:Job Name", "COMPANY:Company Name"]
 * Or just names without type prefix: ["BERKELEY"]
 */
export function parseLinkedTitles(value: string[] | null | undefined): LinkedTitle[] {
  if (!value || !Array.isArray(value) || value.length === 0) return [];

  return value.map(item => {
    if (!item || typeof item !== 'string') return { type: 'UNKNOWN', name: '' };
    const trimmed = item.trim();
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      // No colon found, treat entire string as name with unknown type
      return { type: 'UNKNOWN', name: trimmed };
    }
    return {
      type: trimmed.substring(0, colonIndex).trim().toUpperCase(),
      name: trimmed.substring(colonIndex + 1).trim()
    };
  }).filter(item => item.name.length > 0);
}

/**
 * Parse linkedEntities array from API to LinkedTitle objects
 * Format from API: [{ entityType: "JOB", id: "123", title: "Job Name" }]
 */
export function parseLinkedEntities(entities: Array<{ entityType: string; id: string; title: string }> | null | undefined): LinkedTitle[] {
  if (!entities || !Array.isArray(entities) || entities.length === 0) return [];

  return entities.map(entity => ({
    type: entity.entityType?.toUpperCase() || 'UNKNOWN',
    name: entity.title || ''
  })).filter(item => item.name.length > 0);
}

/**
 * Parse tags string to array
 * Handles various formats:
 * - String: "tag1,tag2,tag3" -> ["tag1", "tag2", "tag3"]
 * - Array of strings: ["tag1", "tag2"] -> ["tag1", "tag2"]
 * - Array with comma-separated string: ["tag1,tag2"] -> ["tag1", "tag2"]
 * - null/undefined -> []
 */
export function parseTagsString(tags: string | string[] | null | undefined): string[] {
  if (!tags) return [];
  
  // If it's an array
  if (Array.isArray(tags)) {
    // First, flatten any comma-separated strings within the array
    // This handles cases like ["Healthcare,Monitor"] -> ["Healthcare", "Monitor"]
    const flattened = tags.flatMap(tag => {
      if (typeof tag === 'string' && tag.includes(',')) {
        return tag.split(',').map(t => t.trim());
      }
      return String(tag).trim();
    });
    return flattened.filter(Boolean);
  }
  
  // If not a string, return empty
  if (typeof tags !== 'string') return [];
  
  // Split by comma and trim each tag
  return tags.split(',').map(t => t.trim()).filter(Boolean);
}

/**
 * Convert tags array to string
 */
export function tagsToString(tags: string[]): string {
  return tags.join(',');
}

/**
 * Convert TaskLandingPage to UI Task
 * Used for list views where we get data from findLandingPages query
 */
export function convertTaskLandingPageToUI(taskLanding: TaskLandingPage): Task {
  const uiStatus = convertAPIStatusToUI(taskLanding.status, taskLanding.dueDate);
  const uiPriority = convertAPIPriorityToUI(taskLanding.priority);
  const tags = parseTagsString(taskLanding.tags);
  const linkedTitles = parseLinkedEntities(taskLanding.linkedEntities);

  // Check if assignedTo is a UUID - if so, it's the assignedToId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUUID = taskLanding.assignedTo && uuidRegex.test(taskLanding.assignedTo);

  return {
    id: taskLanding.id,
    title: taskLanding.title || '',
    description: taskLanding.description || '',
    dueDate: taskLanding.dueDate || '',
    reminderDate: taskLanding.reminderDate || '',
    // If assignedTo is a UUID, display as "Loading..." until name is resolved
    assignedTo: isUUID ? 'Loading...' : (taskLanding.assignedTo || 'Unassigned'),
    // Store the UUID in assignedToId for API calls
    assignedToId: isUUID ? taskLanding.assignedTo : undefined,
    taskType: 'General',
    status: uiStatus,
    apiStatus: taskLanding.status,
    tags,
    linkedTitles,
    entities: undefined,
    priority: uiPriority,
    apiPriority: taskLanding.priority,
    completed: taskLanding.status === 'COMPLETED',
    comments: 0,
    createdBy: taskLanding.createdBy,
    createdAt: taskLanding.createdAt,
  };
}

/**
 * Convert CRMTask (from GetTask API) to UI Task
 * Used when fetching a single task by ID for navigation
 */
export function convertCRMTaskToUI(task: CRMTask): Task {
  const uiStatus = convertAPIStatusToUI(task.status, task.dueDate);
  const uiPriority = convertAPIPriorityToUI(task.priority);
  const tags = parseTagsString(task.tags);

  return {
    id: task.id,
    title: task.title || '',
    description: task.description || '',
    dueDate: task.dueDate || '',
    reminderDate: undefined,
    // CRMTask has assignedToId, not assignedTo name - show as Loading until resolved
    assignedTo: 'Loading...',
    assignedToId: task.assignedToId || undefined,
    taskType: 'General',
    status: uiStatus,
    apiStatus: task.status,
    tags,
    linkedTitles: [], // Detail view uses relatedEntities, not linkedTitles
    entities: undefined,
    priority: uiPriority,
    apiPriority: task.priority,
    completed: task.status === 'COMPLETED',
    comments: 0,
    createdBy: task.createdBy,
    createdAt: task.createdAt,
  };
}

/**
 * Convert TaskRelatedEntities to TaskEntities UI format
 */
export function convertRelatedEntitiesToUI(relatedEntities: TaskRelatedEntities) {
  return {
    checks: relatedEntities.checks?.map(check => ({
      id: check.id,
      name: check.checkNumber || 'Unknown Check',
    })) || [],
    companies: relatedEntities.companies?.map(company => ({
      id: company.id,
      name: company.name || 'Unknown Company',
    })) || [],
    contacts: relatedEntities.contacts?.map(contact => ({
      id: contact.id,
      name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown Contact',
    })) || [],
    customers: relatedEntities.customers?.map(customer => ({
      id: customer.id,
      name: customer.companyName || 'Unknown Customer',
    })) || [],
    factories: relatedEntities.factories?.map(factory => ({
      id: factory.id,
      name: factory.title || 'Unknown Factory',
    })) || [],
    invoices: relatedEntities.invoices?.map(invoice => ({
      id: invoice.id,
      name: invoice.invoiceNumber || 'Unknown Invoice',
    })) || [],
    jobs: relatedEntities.jobs?.map(job => ({
      id: job.id,
      name: job.jobName || 'Unknown Job',
    })) || [],
    notes: relatedEntities.notes?.map(note => ({
      id: note.id,
      name: note.title || 'Untitled Note',
    })) || [],
    orders: relatedEntities.orders?.map(order => ({
      id: order.id,
      name: order.orderNumber || order.jobName || 'Unknown Order',
    })) || [],
    preOpportunities: relatedEntities.preOpportunities?.map(preOpp => ({
      id: preOpp.id,
      name: preOpp.entityNumber || 'Unknown Pre-Opp',
    })) || [],
    products: relatedEntities.products?.map(product => ({
      id: product.id,
      name: product.factoryPartNumber || 'Unknown Product',
    })) || [],
    quotes: relatedEntities.quotes?.map(quote => ({
      id: quote.id,
      name: quote.quoteNumber || quote.jobName || 'Unknown Quote',
    })) || [],
  };
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  if (!name || name === 'Unassigned') return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

/**
 * Get color for assignee badge based on name
 */
export function getAvatarColor(name: string): string {
  if (!name || name === 'Unassigned') return 'bg-gray-400';
  const index = name.charCodeAt(0) % ASSIGNEE_COLORS.length;
  return ASSIGNEE_COLORS[index];
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: TaskPriority): string {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS['Low priority'];
}

/**
 * Get API priority badge color
 */
export function getAPIPriorityColor(priority: TaskPriorityAPI): string {
  return API_PRIORITY_COLORS[priority] || API_PRIORITY_COLORS['LOW'];
}

/**
 * Get priority icon type
 */
export function getPriorityIconType(priority: TaskPriority): 'urgent' | 'critical' | 'normal' | 'none' {
  switch (priority) {
    case 'Critical': return 'critical';
    case 'Urgent': return 'urgent';
    case 'Normal': return 'normal';
    default: return 'none';
  }
}

/**
 * Format task date for display
 */
export function formatTaskDate(dateString: string): string {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);
  
  const diffTime = taskDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays < 7) return `${diffDays} days`;
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return date.toLocaleDateString();
}

/**
 * Get reminder date status: 'Waiting' (future), 'Tomorrow', 'Today', 'Passed' (past)
 */
export type ReminderStatus = 'Waiting' | 'Tomorrow' | 'Today' | 'Passed';

export function getReminderStatus(dateString: string | null | undefined): ReminderStatus | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const reminderDate = new Date(date);
  reminderDate.setHours(0, 0, 0, 0);
  
  const diffTime = reminderDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Passed';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return 'Waiting';
}

/**
 * Get reminder status color class
 */
export function getReminderStatusColor(status: ReminderStatus): string {
  switch (status) {
    case 'Passed': return 'text-red-600 bg-red-50';
    case 'Today': return 'text-green-600 bg-green-50';
    case 'Tomorrow': return 'text-orange-600 bg-orange-50';
    case 'Waiting': return 'text-blue-600 bg-blue-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Format reminder date for display with formatted date
 */
export function formatReminderDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Get days until due date
 */
export function getDaysUntilDue(dateString: string): string {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);

  const diffTime = taskDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return '1 day overdue';
  if (diffDays === 1) return '1 day';
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  return `${diffDays} days`;
}

/**
 * Format timestamp for comments
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'Overdue':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'Today':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Upcoming':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'Waiting':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Completed':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    // API statuses
    case 'TODO':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'IN_PROGRESS':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'COMPLETED':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'CANCELLED':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

/**
 * Get border color for priority in calendar
 */
export function getPriorityBorderColor(priority: TaskPriority): string {
  switch (priority) {
    case 'Critical':
      return 'border-l-purple-500';
    case 'Urgent':
      return 'border-l-red-500';
    case 'Normal':
      return 'border-l-blue-500';
    case 'Low priority':
      return 'border-l-gray-300';
    default:
      return 'border-l-gray-400';
  }
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Generate calendar days for a given month
 */
export function generateCalendarDays(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const calendarDays = [];

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, daysInPrevMonth - i),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      date: new Date(year, month, day),
    });
  }

  // Next month days to fill grid
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      date: new Date(year, month + 1, day),
    });
  }

  return calendarDays;
}

/**
 * Get tasks for a specific date
 * Uses reminderDate when available, otherwise falls back to dueDate
 */
export function getTasksForDate(tasks: Task[], date: Date): Task[] {
  const dateStr = formatLocalDate(date);
  return tasks.filter(task => {
    // If task has a reminderDate, use that for calendar positioning
    if (task.reminderDate) {
      return task.reminderDate === dateStr;
    }
    // Otherwise, use dueDate
    return task.dueDate === dateStr;
  });
}

/**
 * Apply filter to a task
 */
export function applyTaskFilter(task: Task, filter: ActiveFilter): boolean {
  const field = filter.columnName;
  const taskAny = task as unknown as Record<string, unknown>;
  const value = String(taskAny[field] || '').toLowerCase();
  const filterValue = String(filter.value || '').toLowerCase();

  if (filter.operator === 'IN' && filter.values) {
    return filter.values.some(v => String(v).toLowerCase() === value);
  }

  switch (filter.operator) {
    case 'EQ':
      return value === filterValue;
    case 'NE':
      return value !== filterValue;
    case 'ILIKE':
    case 'LIKE':
      return value.includes(filterValue);
    case 'BEGINS_WITH':
      return value.startsWith(filterValue);
    case 'ENDS_WITH':
      return value.endsWith(filterValue);
    case 'IS_NULL':
      return !value || value === '';
    case 'IS_NOT_NULL':
      return !!(value && value !== '');
    default:
      return true;
  }
}

/**
 * Get unique values from tasks for a specific field
 */
export function getUniqueValues(tasks: Task[], field: keyof Task): string[] {
  return Array.from(new Set(tasks.map(t => String(t[field] || ''))))
    .filter(Boolean)
    .sort();
}

/**
 * Format date for API (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(dueDate: string): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due < today;
}

/**
 * Check if a task is due today
 */
export function isTaskDueToday(dueDate: string): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const today = new Date();
  return due.toDateString() === today.toDateString();
}
