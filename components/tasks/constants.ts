/**
 * Task Constants and Configurations
 */

import type { TaskStatus, TaskPriority, TaskStage, TaskStatusAPI, TaskPriorityAPI } from './types';

// Assignee color palette
export const ASSIGNEE_COLORS = [
  'bg-orange-500',
  'bg-teal-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-blue-500',
  'bg-pink-500'
] as const;

// Task status categories for UI filtering
export const TASK_CATEGORIES = [
  'All',
  'Today',
  'Overdue',
  'Upcoming',
  'Waiting',
  'Completed'
] as const;

// API Status options
export const API_STATUS_OPTIONS: TaskStatusAPI[] = [
  'TODO',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
];

// API Priority options
export const API_PRIORITY_OPTIONS: TaskPriorityAPI[] = [
  'LOW',
  'NORMAL',
  'URGENT',
  'CRITICAL'
];

// Task stages for Kanban view - using API statuses
export const TASK_STAGES: TaskStage[] = [
  { name: 'TODO', label: 'To Do', uiStatus: 'Today' },
  { name: 'IN_PROGRESS', label: 'In Progress', uiStatus: 'Upcoming' },
  { name: 'COMPLETED', label: 'Completed', uiStatus: 'Completed' },
  { name: 'CANCELLED', label: 'Cancelled', uiStatus: 'Waiting' }
] as const;

// Available assignees (these would ideally come from API)
export const AVAILABLE_ASSIGNEES = [
  'Sarah Johnson',
  'Marcus Chen',
  'David Torres',
  'Emily Roberts'
] as const;

// Available tags
export const AVAILABLE_TAGS = [
  'Commercial',
  'Healthcare',
  'HVAC',
  'Lighting',
  'Controls',
  'EC',
  'GC',
  'Pricing',
  'Education',
  'Specialty',
  'Quote',
  'Bidding',
  'Residential',
  'Follow-up',
  'Events',
  'Networking',
  'Critical'
] as const;

// Available task types
export const AVAILABLE_TASK_TYPES = [
  'Call',
  'Meeting',
  'Follow-up',
  'Site Visit',
  'Lunch-and-Learn',
  'Trade Show',
  'General',
  'Note/Action',
  'Waiting'
] as const;

// Available priorities - updated for new API
export const AVAILABLE_PRIORITIES: TaskPriority[] = [
  'No priority',
  'Normal',
  'Urgent',
  'Critical'
] as const;

// Available entity types for linking
export const AVAILABLE_ENTITY_TYPES = [
  'Job',
  'Contact',
  'Company'
] as const;

// Status color mapping for UI display
export const STATUS_COLORS: Record<TaskStatus, string> = {
  'Today': 'bg-blue-100 border-blue-300',
  'Overdue': 'bg-red-100 border-red-300',
  'Upcoming': 'bg-green-100 border-green-300',
  'Waiting': 'bg-yellow-100 border-yellow-300',
  'Completed': 'bg-gray-100 border-gray-300'
} as const;

// API Status color mapping for Kanban
export const API_STATUS_COLORS: Record<TaskStatusAPI, string> = {
  'TODO': 'bg-blue-100 border-blue-300',
  'IN_PROGRESS': 'bg-green-100 border-green-300',
  'COMPLETED': 'bg-gray-100 border-gray-300',
  'CANCELLED': 'bg-yellow-100 border-yellow-300'
} as const;

// Priority color mapping
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  'Urgent': 'bg-red-100 text-red-700 border-red-200',
  'Critical': 'bg-purple-100 text-purple-700 border-purple-200',
  'Normal': 'bg-blue-100 text-blue-700 border-blue-200',
  'No priority': 'bg-gray-100 text-gray-700 border-gray-200'
} as const;

// API Priority color mapping
export const API_PRIORITY_COLORS: Record<TaskPriorityAPI, string> = {
  'CRITICAL': 'bg-purple-100 text-purple-700 border-purple-200',
  'URGENT': 'bg-red-100 text-red-700 border-red-200',
  'NORMAL': 'bg-blue-100 text-blue-700 border-blue-200',
  'LOW': 'bg-gray-100 text-gray-700 border-gray-200'
} as const;

// Days of the week for calendar
export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// Month names for calendar
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
] as const;
