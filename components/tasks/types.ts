/**
 * Task Types and Interfaces
 * These types match the GraphQL API schema and provide UI display mappings
 */

// Import API types from the new tasks API module
import type {
  Task as APITask,
  TaskLandingPage,
  TaskConversation,
  TaskPriority as TaskPriorityAPI,
  TaskStatus as TaskStatusAPI,
  CreateTaskInput,
  UpdateTaskInput,
  CRMEntityType,
  CompanySearchResult,
  ContactSearchResult,
  JobSearchResult,
  NoteSearchResult,
  RelatedEntities,
  TaskAssignee,
} from './api';

// Re-export API types for backward compatibility
export type {
  APITask,
  TaskLandingPage,
  TaskConversation,
  TaskPriorityAPI,
  TaskStatusAPI,
  CreateTaskInput,
  UpdateTaskInput,
  CRMEntityType,
  CompanySearchResult,
  ContactSearchResult,
  JobSearchResult,
  NoteSearchResult,
  RelatedEntities,
  TaskAssignee,
};

// Legacy type alias for backward compatibility
/** @deprecated Use RelatedEntities instead */
export type TaskRelatedEntities = RelatedEntities;

// Task status types for UI display
export type TaskStatus = 'Today' | 'Overdue' | 'Upcoming' | 'Waiting' | 'Completed';

// Task priority types for UI display
export type TaskPriority = 'Low priority' | 'Urgent' | 'Normal' | 'Critical';

// View mode types
export type TaskViewMode = 'grid' | 'list' | 'kanban' | 'spreadsheet' | 'calendar';

// API Status to UI Status mapping
export const API_STATUS_TO_UI: Record<TaskStatusAPI, TaskStatus> = {
  'TODO': 'Today',
  'IN_PROGRESS': 'Upcoming',
  'COMPLETED': 'Completed',
  'CANCELLED': 'Waiting',
};

// UI Status to API Status mapping
export const UI_STATUS_TO_API: Record<TaskStatus, TaskStatusAPI> = {
  'Today': 'TODO',
  'Overdue': 'TODO', // We'll compute overdue based on date
  'Upcoming': 'IN_PROGRESS',
  'Completed': 'COMPLETED',
  'Waiting': 'CANCELLED',
};

// API Priority to UI Priority mapping
export const API_PRIORITY_TO_UI: Record<TaskPriorityAPI, TaskPriority> = {
  'LOW': 'Low priority',
  'NORMAL': 'Normal',
  'URGENT': 'Urgent',
  'CRITICAL': 'Critical',
};

// UI Priority to API Priority mapping
export const UI_PRIORITY_TO_API: Record<TaskPriority, TaskPriorityAPI> = {
  'Low priority': 'LOW',
  'Normal': 'NORMAL',
  'Urgent': 'URGENT',
  'Critical': 'CRITICAL',
};

// Linked title item parsed from linkedTitles string
export interface LinkedTitle {
  type: string;
  name: string;
}

// UI Task type (display format)
export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  reminderDate?: string;
  assignedTo: string;
  assigneeNames?: string[]; // Array of assignee names for display (from landing pages)
  assignees?: TaskAssignee[]; // Array of user objects (from single task query)
  taskType: string;
  status: TaskStatus;
  apiStatus: TaskStatusAPI;
  tags: string[];
  linkedTitles: LinkedTitle[];
  entities?: TaskEntities;
  priority: TaskPriority;
  apiPriority: TaskPriorityAPI;
  completed?: boolean;
  comments?: number;
  createdBy?: string;
  createdAt?: string;
  categoryId?: string; // Category ID for editing
  category?: string; // Category name for display (from landing page)
}

// Connected entities for tasks
export interface TaskEntities {
  jobs?: Array<{ id: string; name: string }>;
  contacts?: Array<{ id: string; name: string }>;
  companies?: Array<{ id: string; name: string }>;
  notes?: Array<{ id: string; name: string }>;
}

// Comment type for task conversations
export interface TaskComment {
  id: string;
  author: string;
  authorInside?: boolean;
  authorOutside?: boolean;
  content: string;
  timestamp: string;
}

// Dropdown state types
export interface TaskDropdownState {
  assignee: string | null;
  tags: string | null;
  entity: string | null;
  taskType: string | null;
  priority: string | null;
  dueDate: string | null;
  reminderDate: string | null;
}

// Editing state types
export interface TaskEditState {
  taskId: string | null;
  field: 'title' | 'description' | null;
  value: string;
}

// Expanded text state type
export interface ExpandedTextState {
  taskId: string;
  field: 'title' | 'description';
}

// Filter state type
export interface TaskFilterState {
  assignees: string[];
  tags: string[];
  taskTypes: string[];
  priorities: TaskPriority[];
  statuses: TaskStatus[];
}

// Calendar day type
export interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  date: Date;
}

// Task stage for Kanban view - using API status
export interface TaskStage {
  name: TaskStatusAPI;
  label: string;
  uiStatus: TaskStatus;
}

// Selected relation for modal
export interface SelectedRelation {
  id: string;
  name: string;
  type: 'job' | 'contact' | 'company' | 'note';
}

// Parsed task for easier UI handling
export interface ParsedTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  reminderDate: string;
  assignedTo: string;
  assignees?: TaskAssignee[]; // Array of user objects
  status: TaskStatus;
  apiStatus: TaskStatusAPI;
  priority: TaskPriority;
  apiPriority: TaskPriorityAPI;
  tags: string[];
  completed: boolean;
  createdBy: string;
  createdAt: string;
}
