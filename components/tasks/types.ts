/**
 * Task Types and Interfaces
 * These types match the GraphQL API schema and provide UI display mappings
 */

// Import API types from the new tasks API module
import type { 
  Task as APITask, 
  TaskLandingPage, 
  TaskConversation,
  TaskRelatedEntities,
  TaskPriority as TaskPriorityAPI, 
  TaskStatus as TaskStatusAPI,
  CreateTaskInput,
  UpdateTaskInput,
  EntityType,
  CompanySearchResult,
  ContactSearchResult,
  JobSearchResult,
  NoteSearchResult,
} from './api';

// Re-export API types for backward compatibility
export type { 
  APITask,
  TaskLandingPage, 
  TaskConversation,
  TaskRelatedEntities,
  TaskPriorityAPI, 
  TaskStatusAPI,
  CreateTaskInput,
  UpdateTaskInput,
  EntityType,
  CompanySearchResult,
  ContactSearchResult,
  JobSearchResult,
  NoteSearchResult,
};

// Task status types for UI display
export type TaskStatus = 'Today' | 'Overdue' | 'Upcoming' | 'Waiting' | 'Completed';

// Task priority types for UI display
export type TaskPriority = 'No priority' | 'Urgent' | 'Normal' | 'Critical';

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
  'LOW': 'No priority',
  'NORMAL': 'Normal',
  'URGENT': 'Urgent',
  'CRITICAL': 'Critical',
};

// UI Priority to API Priority mapping
export const UI_PRIORITY_TO_API: Record<TaskPriority, TaskPriorityAPI> = {
  'No priority': 'LOW',
  'Normal': 'NORMAL',
  'Urgent': 'URGENT',
  'Critical': 'CRITICAL',
};

// UI Task type (display format)
export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  reminderDate?: string;
  assignedTo: string;
  assignedToId?: string;
  taskType: string;
  status: TaskStatus;
  apiStatus: TaskStatusAPI;
  tags: string[];
  entities?: TaskEntities;
  priority: TaskPriority;
  apiPriority: TaskPriorityAPI;
  completed?: boolean;
  comments?: number;
  createdBy?: string;
  createdAt?: string;
}

// Connected entities for tasks
export interface TaskEntities {
  jobs?: Array<{ id: string; name: string }>;
  contacts?: Array<{ id: string; name: string }>;
  companies?: Array<{ id: string; name: string }>;
  notes?: Array<{ id: string; name: string }>;
}

// Comment type for task conversations (legacy format)
export interface TaskComment {
  id: string;
  author: string;
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
  assignedToId: string;
  status: TaskStatus;
  apiStatus: TaskStatusAPI;
  priority: TaskPriority;
  apiPriority: TaskPriorityAPI;
  tags: string[];
  completed: boolean;
  createdBy: string;
  createdAt: string;
}
