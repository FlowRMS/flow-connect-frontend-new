/**
 * Task Categories GraphQL Module
 * GraphQL queries and API functions for managing Task Categories
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export interface TaskCategory {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateTaskCategoryInput {
  name: string;
  displayOrder?: number;
}

export interface UpdateTaskCategoryInput {
  name?: string;
  displayOrder?: number;
  isActive?: boolean;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_TASK_CATEGORIES = `
  query GetTaskCategories($includeInactive: Boolean! = false) {
    taskCategories(includeInactive: $includeInactive) {
      id
      name
      displayOrder
      isActive
    }
  }
`;

const GET_TASK_CATEGORY = `
  query GetTaskCategory($id: UUID!) {
    taskCategory(id: $id) {
      id
      name
      displayOrder
      isActive
    }
  }
`;

const CREATE_TASK_CATEGORY = `
  mutation CreateTaskCategory($input: TaskCategoryInput!) {
    createTaskCategory(input: $input) {
      id
      name
      displayOrder
      isActive
    }
  }
`;

const UPDATE_TASK_CATEGORY = `
  mutation UpdateTaskCategory($id: UUID!, $input: TaskCategoryInput!) {
    updateTaskCategory(id: $id, input: $input) {
      id
      name
      displayOrder
      isActive
    }
  }
`;

const DELETE_TASK_CATEGORY = `
  mutation DeleteTaskCategory($id: UUID!) {
    deleteTaskCategory(id: $id)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all task categories
 */
export async function fetchTaskCategories(includeInactive: boolean = false): Promise<TaskCategory[]> {
  const response = await crmGraphQLRequest<{ taskCategories: TaskCategory[] }>({
    query: GET_TASK_CATEGORIES,
    variables: { includeInactive },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch task categories');
  }

  return response.data?.taskCategories || [];
}

/**
 * Fetch a single task category by ID
 */
export async function fetchTaskCategory(id: string): Promise<TaskCategory | null> {
  const response = await crmGraphQLRequest<{ taskCategory: TaskCategory }>({
    query: GET_TASK_CATEGORY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch task category');
  }

  return response.data?.taskCategory || null;
}

/**
 * Create a new task category
 */
export async function createTaskCategory(input: CreateTaskCategoryInput): Promise<TaskCategory> {
  const response = await crmGraphQLRequest<{ createTaskCategory: TaskCategory }>({
    query: CREATE_TASK_CATEGORY,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create task category');
  }

  if (!response.data?.createTaskCategory) {
    throw new Error('No task category returned from create mutation');
  }

  return response.data.createTaskCategory;
}

/**
 * Update an existing task category
 */
export async function updateTaskCategory(id: string, input: UpdateTaskCategoryInput): Promise<TaskCategory> {
  const response = await crmGraphQLRequest<{ updateTaskCategory: TaskCategory }>({
    query: UPDATE_TASK_CATEGORY,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update task category');
  }

  if (!response.data?.updateTaskCategory) {
    throw new Error('No task category returned from update mutation');
  }

  return response.data.updateTaskCategory;
}

/**
 * Delete a task category (soft delete)
 */
export async function deleteTaskCategory(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteTaskCategory: boolean }>({
    query: DELETE_TASK_CATEGORY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete task category');
  }

  return true;
}
