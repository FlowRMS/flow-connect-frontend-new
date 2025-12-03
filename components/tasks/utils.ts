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
} from './types';
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
  'LOW': 'No priority',
  'NORMAL': 'Normal',
  'URGENT': 'Urgent',
  'CRITICAL': 'Critical',
};

const uiPriorityToAPI: Record<TaskPriority, TaskPriorityAPI> = {
  'No priority': 'LOW',
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
  return apiPriorityToUI[apiPriority] || 'No priority';
}

/**
 * Convert UI priority to API priority
 */
export function convertUIPriorityToAPI(uiPriority: TaskPriority): TaskPriorityAPI {
  return uiPriorityToAPI[uiPriority] || 'LOW';
}

/**
 * Parse tags string to array
 */
export function parseTagsString(tags: string | string[] | null | undefined): string[] {
  if (!tags) return [];
  // If already an array, return it filtered
  if (Array.isArray(tags)) {
    return tags.map(t => String(t).trim()).filter(Boolean);
  }
  // If not a string, return empty
  if (typeof tags !== 'string') return [];
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

  return {
    id: taskLanding.id,
    title: taskLanding.title || '',
    description: taskLanding.description || '',
    dueDate: taskLanding.dueDate || '',
    reminderDate: taskLanding.reminderDate || '',
    assignedTo: taskLanding.assignedTo || 'Unassigned',
    assignedToId: undefined,
    taskType: 'General',
    status: uiStatus,
    apiStatus: taskLanding.status,
    tags,
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
 * Convert TaskRelatedEntities to TaskEntities UI format
 */
export function convertRelatedEntitiesToUI(relatedEntities: TaskRelatedEntities) {
  return {
    jobs: relatedEntities.jobs?.map(job => ({
      id: job.id,
      name: job.jobName || 'Unknown Job',
    })) || [],
    contacts: relatedEntities.contacts?.map(contact => ({
      id: contact.id,
      name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown Contact',
    })) || [],
    companies: relatedEntities.companies?.map(company => ({
      id: company.id,
      name: company.name || 'Unknown Company',
    })) || [],
    notes: relatedEntities.notes?.map(note => ({
      id: note.id,
      name: note.title || 'Untitled Note',
    })) || [],
    preOpportunities: relatedEntities.preOpportunities?.map(preOpp => ({
      id: preOpp.id,
      name: preOpp.entityNumber || 'Unknown Pre-Opp',
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
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS['No priority'];
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
    case 'No priority':
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
