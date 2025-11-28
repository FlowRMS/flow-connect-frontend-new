/**
 * Task Constants and Configurations
 */

import type { TaskStatus, TaskPriority, TaskStage } from './types';

// Assignee color palette
export const ASSIGNEE_COLORS = [
  'bg-orange-500',
  'bg-teal-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-blue-500',
  'bg-pink-500'
] as const;

// Task status categories
export const TASK_CATEGORIES = [
  'All',
  'Today',
  'Overdue',
  'Upcoming',
  'Waiting',
  'Completed'
] as const;

// Task stages for Kanban view
export const TASK_STAGES: TaskStage[] = [
  { name: 'Today', label: 'Today' },
  { name: 'Overdue', label: 'Overdue' },
  { name: 'Upcoming', label: 'Upcoming' },
  { name: 'Waiting', label: 'Waiting' },
  { name: 'Completed', label: 'Completed' }
] as const;

// Available assignees
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

// Available priorities
export const AVAILABLE_PRIORITIES: TaskPriority[] = [
  'No priority',
  'Urgent'
] as const;

// Available entity types for linking
export const AVAILABLE_ENTITY_TYPES = [
  'Job',
  'Contact',
  'Company',
  'Pre-Opportunity'
] as const;

// Sample entities (would come from API in real app)
export const ALL_ENTITIES = {
  Job: [
    'Downtown Plaza Renovation',
    'Riverside Medical Center',
    'TechCorp HQ Expansion',
    'Harbor View Apartments',
    'University Lab Building'
  ],
  Contact: [
    'Jennifer Walsh',
    'Michael Rodriguez',
    'David Chen',
    'Rachel Kim'
  ],
  Company: [
    'Turner Construction',
    'Miller Electric',
    'McCarthy Building',
    'Skanska USA',
    'Prime Electric'
  ],
  'Pre-Opportunity': [
    'TechCorp HVAC Controls',
    'LED Retrofit - Hospital',
    'Controls Upgrade'
  ]
} as const;

// Status color mapping for Kanban view
export const STATUS_COLORS: Record<TaskStatus, string> = {
  'Today': 'bg-blue-100 border-blue-300',
  'Overdue': 'bg-red-100 border-red-300',
  'Upcoming': 'bg-green-100 border-green-300',
  'Waiting': 'bg-yellow-100 border-yellow-300',
  'Completed': 'bg-gray-100 border-gray-300'
} as const;

// Priority color mapping
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  'Urgent': 'bg-red-100 text-red-700 border-red-200',
  'No priority': 'bg-gray-100 text-gray-700 border-gray-200'
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
