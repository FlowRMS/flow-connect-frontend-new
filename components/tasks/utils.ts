/**
 * Task Utility Functions
 */

import { ASSIGNEE_COLORS, PRIORITY_COLORS } from './constants';
import type { Task, TaskPriority } from './types';
import type { ActiveFilter } from '../AdvancedFilters';

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('');
}

/**
 * Get color for assignee badge based on name
 */
export function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % ASSIGNEE_COLORS.length;
  return ASSIGNEE_COLORS[index];
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: TaskPriority): string {
  return PRIORITY_COLORS[priority];
}

/**
 * Get priority icon type
 */
export function getPriorityIconType(priority: TaskPriority): 'urgent' | 'none' {
  return priority === 'Urgent' ? 'urgent' : 'none';
}

/**
 * Format task date for display
 */
export function formatTaskDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days`;
  return date.toLocaleDateString();
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
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
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

/**
 * Get border color for priority in calendar
 */
export function getPriorityBorderColor(priority: TaskPriority): string {
  switch (priority) {
    case 'Urgent':
      return 'border-l-red-500';
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
 */
export function getTasksForDate(tasks: Task[], date: Date): Task[] {
  const dateStr = date.toISOString().split('T')[0];
  return tasks.filter(task => task.dueDate === dateStr);
}

/**
 * Apply filter to a task
 */
export function applyTaskFilter(task: Task, filter: ActiveFilter): boolean {
  const field = filter.columnName;
  const value = String((task as any)[field] || '').toLowerCase();
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
