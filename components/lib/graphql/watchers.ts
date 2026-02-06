/**
 * GraphQL Watchers Module
 * CRUD operations for entity watchers
 * Watchers are users who track and receive updates on entity changes
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export type WatchableEntityType = 'JOB' | 'ORDER' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'TASK';

export interface Watcher {
  id: string;
  fullName: string;
  email: string;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_WATCHERS_BY_ENTITY = `
  query GetWatchersByEntity($entityType: EntityType!, $entityId: UUID!) {
    getWatchersByEntity(entityType: $entityType, entityId: $entityId) {
      id
      fullName
      email
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const ADD_JOB_WATCHER = `
  mutation AddJobWatcher($jobId: UUID!, $userId: UUID!) {
    addJobWatcher(jobId: $jobId, userId: $userId) {
      id
      fullName
      email
    }
  }
`;

const REMOVE_JOB_WATCHER = `
  mutation RemoveJobWatcher($jobId: UUID!, $userId: UUID!) {
    removeJobWatcher(jobId: $jobId, userId: $userId) {
      id
      fullName
      email
    }
  }
`;

const ADD_ORDER_WATCHER = `
  mutation AddOrderWatcher($orderId: UUID!, $userId: UUID!) {
    addOrderWatcher(orderId: $orderId, userId: $userId) {
      id
      fullName
      email
    }
  }
`;

const REMOVE_ORDER_WATCHER = `
  mutation RemoveOrderWatcher($orderId: UUID!, $userId: UUID!) {
    removeOrderWatcher(orderId: $orderId, userId: $userId) {
      id
      fullName
      email
    }
  }
`;

const ADD_PRE_OPPORTUNITY_WATCHER = `
  mutation AddPreOpportunityWatcher($preOpportunityId: UUID!, $userId: UUID!) {
    addPreOpportunityWatcher(preOpportunityId: $preOpportunityId, userId: $userId) {
      id
      fullName
      email
    }
  }
`;

const REMOVE_PRE_OPPORTUNITY_WATCHER = `
  mutation RemovePreOpportunityWatcher($preOpportunityId: UUID!, $userId: UUID!) {
    removePreOpportunityWatcher(preOpportunityId: $preOpportunityId, userId: $userId) {
      id
      fullName
      email
    }
  }
`;

const ADD_QUOTE_WATCHER = `
  mutation AddQuoteWatcher($quoteId: UUID!, $userId: UUID!) {
    addQuoteWatcher(quoteId: $quoteId, userId: $userId) {
      id
      fullName
      email
    }
  }
`;

const REMOVE_QUOTE_WATCHER = `
  mutation RemoveQuoteWatcher($quoteId: UUID!, $userId: UUID!) {
    removeQuoteWatcher(quoteId: $quoteId, userId: $userId) {
      id
      fullName
      email
    }
  }
`;

const ADD_TASK_WATCHER = `
  mutation AddTaskWatcher($taskId: UUID!, $userId: UUID!) {
    addTaskWatcher(taskId: $taskId, userId: $userId) {
      id
      fullName
      email
    }
  }
`;

const REMOVE_TASK_WATCHER = `
  mutation RemoveTaskWatcher($taskId: UUID!, $userId: UUID!) {
    removeTaskWatcher(taskId: $taskId, userId: $userId) {
      id
      fullName
      email
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch watchers for an entity
 */
export async function fetchWatchersByEntity(
  entityType: WatchableEntityType,
  entityId: string
): Promise<Watcher[]> {
  const response = await crmGraphQLRequest<{ getWatchersByEntity: Watcher[] }>({
    query: GET_WATCHERS_BY_ENTITY,
    variables: { entityType, entityId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch watchers');
  }

  return response.data?.getWatchersByEntity || [];
}

/**
 * Add a watcher to an entity
 * Returns the updated list of watchers
 */
export async function addWatcher(
  entityType: WatchableEntityType,
  entityId: string,
  userId: string
): Promise<Watcher[]> {
  let query: string;
  let variableName: string;
  let responseName: string;

  switch (entityType) {
    case 'JOB':
      query = ADD_JOB_WATCHER;
      variableName = 'jobId';
      responseName = 'addJobWatcher';
      break;
    case 'ORDER':
      query = ADD_ORDER_WATCHER;
      variableName = 'orderId';
      responseName = 'addOrderWatcher';
      break;
    case 'PRE_OPPORTUNITY':
      query = ADD_PRE_OPPORTUNITY_WATCHER;
      variableName = 'preOpportunityId';
      responseName = 'addPreOpportunityWatcher';
      break;
    case 'QUOTE':
      query = ADD_QUOTE_WATCHER;
      variableName = 'quoteId';
      responseName = 'addQuoteWatcher';
      break;
    case 'TASK':
      query = ADD_TASK_WATCHER;
      variableName = 'taskId';
      responseName = 'addTaskWatcher';
      break;
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }

  const response = await crmGraphQLRequest<Record<string, Watcher[]>>({
    query,
    variables: { [variableName]: entityId, userId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add watcher');
  }

  return response.data?.[responseName] || [];
}

/**
 * Remove a watcher from an entity
 * Returns the updated list of watchers
 */
export async function removeWatcher(
  entityType: WatchableEntityType,
  entityId: string,
  userId: string
): Promise<Watcher[]> {
  let query: string;
  let variableName: string;
  let responseName: string;

  switch (entityType) {
    case 'JOB':
      query = REMOVE_JOB_WATCHER;
      variableName = 'jobId';
      responseName = 'removeJobWatcher';
      break;
    case 'ORDER':
      query = REMOVE_ORDER_WATCHER;
      variableName = 'orderId';
      responseName = 'removeOrderWatcher';
      break;
    case 'PRE_OPPORTUNITY':
      query = REMOVE_PRE_OPPORTUNITY_WATCHER;
      variableName = 'preOpportunityId';
      responseName = 'removePreOpportunityWatcher';
      break;
    case 'QUOTE':
      query = REMOVE_QUOTE_WATCHER;
      variableName = 'quoteId';
      responseName = 'removeQuoteWatcher';
      break;
    case 'TASK':
      query = REMOVE_TASK_WATCHER;
      variableName = 'taskId';
      responseName = 'removeTaskWatcher';
      break;
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }

  const response = await crmGraphQLRequest<Record<string, Watcher[]>>({
    query,
    variables: { [variableName]: entityId, userId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to remove watcher');
  }

  return response.data?.[responseName] || [];
}
