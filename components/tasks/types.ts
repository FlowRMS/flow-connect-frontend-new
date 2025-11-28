/**
 * Task Types and Interfaces
 */

// Task status types
export type TaskStatus = 'Today' | 'Overdue' | 'Upcoming' | 'Waiting' | 'Completed';

// Task priority types
export type TaskPriority = 'No priority' | 'Urgent';

// View mode types
export type TaskViewMode = 'grid' | 'list' | 'kanban' | 'spreadsheet' | 'calendar';

// UI Task type (display format)
export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  reminderDate?: string;
  assignedTo: string;
  taskType: string;
  status: TaskStatus;
  tags: string[];
  entities?: TaskEntities;
  priority: TaskPriority;
  completed?: boolean;
  comments?: number;
}

// Connected entities for tasks
export interface TaskEntities {
  jobs?: string[];
  contacts?: string[];
  companies?: string[];
}

// Comment type for task conversations
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
}

// Calendar day type
export interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  date: Date;
}

// Task stage for Kanban view
export interface TaskStage {
  name: TaskStatus;
  label: string;
}
