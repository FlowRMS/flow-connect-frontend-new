/**
 * Tasks API Module
 * Clean implementation of Tasks GraphQL API endpoints
 * Following the same pattern as Notes API
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';

// Re-export all search functions from central search API
export {
  searchCompanies,
  searchContacts,
  searchJobs,
  searchNotes,
  searchPreOpportunities,
  searchQuotes,
  searchOrders,
  searchInvoices,
  searchChecks,
  searchFactories,
  searchCustomers,
  searchProducts,
  searchUsers,
  type CompanySearchResult,
  type ContactSearchResult,
  type JobSearchResult,
  type NoteSearchResult,
  type PreOpportunitySearchResult,
  type QuoteSearchResult,
  type OrderSearchResult,
  type InvoiceSearchResult,
  type CheckSearchResult,
  type FactorySearchResult,
  type CustomerSearchResult,
  type ProductSearchResult,
  type UserSearchResult,
} from '../../lib/api/search';

// Entity link types and functions are re-exported from entity-links.ts
export type { EntityLink, CRMEntityType } from '../../lib/graphql/entity-links';

// Link functions - re-export from entity-links.ts with task-specific aliases
export {
  createLink as createTaskLink,
  deleteLinkByEntities as deleteTaskLinkByEntities,
} from '../../lib/graphql/entity-links';

type CreatedByResponse =
  | string
  | null
  | undefined
  | {
      email?: string | null;
      firstName?: string | null;
      fullName?: string | null;
      id?: string | null;
      lastName?: string | null;
    };

const formatCreatedBy = (value: CreatedByResponse): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const fullName = value.fullName || [value.firstName, value.lastName].filter(Boolean).join(' ').trim();
  return fullName || value.email || value.id || '';
};

const withFormattedCreatedBy = <T extends { createdBy?: CreatedByResponse }>(item: T): T => ({
  ...item,
  createdBy: formatCreatedBy(item.createdBy),
});

const mapFormattedCreatedBy = <T extends { createdBy?: CreatedByResponse }>(items?: T[]): T[] =>
  (items || []).map(withFormattedCreatedBy);

// ============================================================================
// Types
// ============================================================================

export type TaskPriority = 'LOW' | 'NORMAL' | 'URGENT' | 'CRITICAL';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
// CRMEntityType is re-exported from entity-links.ts above

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  reminderDate: string;
  tags: string;
  assignedToId: string;
  createdBy: string;
  createdAt: string;
}

export interface TaskLandingPage {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  linkedEntities: Array<{
    entityType: string;
    id: string;
    title: string;
  }>;
  reminderDate: string;
  tags: string[];
  assignedTo: string;
  createdBy: string;
  createdAt: string;
}

export interface TaskConversation {
  id: string;
  taskId: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface TaskRelatedEntities {
  checks: Array<{
    id: string;
    checkNumber: string;
    commission: number;
    commissionMonth: string;
    createdBy: string;
    creationType: string;
    entityDate: string;
    entryDate: string;
    factoryId: string;
    postDate: string;
    status: string;
    userOwnerIds: string[];
  }>;
  companies: Array<{
    id: string;
    name: string;
    companySourceType: string;
    createdAt: string;
    createdBy: string;
    parentCompanyId: string;
    phone: string;
    tags: string;
    website: string;
  }>;
  contacts: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    notes: string;
    territory: string;
    tags: string;
    companyId: string;
    createdAt: string;
  }>;
  customers: Array<{
    id: string;
    companyName: string;
    insideRepId: string;
    parentId: string;
  }>;
  factories: Array<{
    id: string;
    title: string;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    balanceId: string;
    createdBy: string;
    creationType: string;
    dueDate: string;
    entityDate: string;
    entryDate: string;
    factoryId: string;
    locked: boolean;
    orderId: string;
    published: boolean;
    status: string;
    userOwnerIds: string[];
  }>;
  jobs: Array<{
    id: string;
    jobName: string;
    jobType: string;
    description: string;
    startDate: string;
    endDate: string;
    status: { id: string; name: string };
    requesterId: string;
    additionalInformation: string;
    structuralDetails: string;
    structuralInformation: string;
    tags: string;
    createdAt: string;
    createdBy: string;
  }>;
  notes: Array<{
    id: string;
    title: string;
    content: string;
    mentions: string;
    tags: string;
    createdAt: string;
    createdBy: string;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    balanceId: string;
    billToCustomerId: string;
    dueDate: string;
    entityDate: string;
    entryDate: string;
    factoryId: string;
    factSoNumber: string;
    jobName: string;
    quoteId: string;
    shipDate: string;
    soldToCustomerId: string;
    status: string;
    userOwnerIds: string[];
  }>;
  preOpportunities: Array<{
    id: string;
    entityNumber: string;
    entityDate: string;
    status: string;
    acceptDate: string;
    billToCustomerAddressId: string;
    billToCustomerId: string;
    createdAt: string;
    createdById: string;
    customerRef: string;
    expDate: string;
    freightTerms: string;
    jobId: string;
    paymentTerms: string;
    reviseDate: string;
    soldToCustomerAddressId: string;
    soldToCustomerId: string;
    tags: string;
  }>;
  products: Array<{
    id: string;
    factoryId: string;
    factoryPartNumber: string;
  }>;
  quotes: Array<{
    id: string;
    quoteNumber: string;
    billToCustomerId: string;
    blanket: boolean;
    createdBy: string;
    entityDate: string;
    entryDate: string;
    expDate: string;
    jobName: string;
    soldToCustomerId: string;
    userOwnerIds: string[];
  }>;
}

// Search result types are imported and re-exported from central search API above
// EntityLink is re-exported from entity-links.ts above

// Input types
export interface CreateTaskInput {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  description?: string;
  dueDate?: string;
  reminderDate?: string;
  tags?: string;
  assignedToId?: string;
}

export interface UpdateTaskInput {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  description?: string;
  dueDate?: string;
  reminderDate?: string;
  tags?: string;
  assignedToId?: string;
}

// Task relation types
export type TaskRelatedType = 'JOB' | 'COMPANY' | 'CONTACT' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'FACTORY' | 'CUSTOMER' | 'PRODUCT';
export type TaskEntityType = TaskRelatedType;

export interface TaskRelation {
  id: string;
  taskId: string;
  relatedEntityType: TaskRelatedType;
  relatedEntityId: string;
  createdAt: string;
}

export interface AddTaskRelationInput {
  taskId: string;
  relatedEntityType: TaskRelatedType;
  relatedEntityId: string;
}

export interface TaskByEntity {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  reminderDate: string;
  tags: string;
  assignedToId: string;
  createdBy: string;
  createdAt: string;
}

export interface AddTaskConversationInput {
  taskId: string;
  content: string;
}

export interface UpdateTaskConversationInput {
  taskId: string;
  content: string;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const FIND_TASKS_LANDING_PAGES = `
  query FindTasksLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
    $limit: Int
    $offset: Int
  ) {
    findLandingPages(
      sourceType: TASKS
      filters: $filters
      orderBy: $orderBy
      limit: $limit
      offset: $offset
    ) {
      records {
        ... on TaskLandingPage {
          id
          assignedTo
          createdAt
          createdBy
          description
          dueDate
          linkedEntities {
            entityType
            id
            title
          }
          priority
          reminderDate
          status
          tags
          title
        }
      }
      total
    }
  }
`;

const GET_TASK = `
  query GetTask($id: UUID!) {
    task(id: $id) {
      assignedToId
      createdAt
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      description
      dueDate
      id
      priority
      reminderDate
      status
      tags
      title
    }
  }
`;

const CREATE_TASK = `
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) {
      assignedToId
      createdAt
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      description
      dueDate
      id
      priority
      reminderDate
      status
      tags
      title
    }
  }
`;

const UPDATE_TASK = `
  mutation UpdateTask($id: UUID!, $input: TaskInput!) {
    updateTask(id: $id, input: $input) {
      assignedToId
      createdAt
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      description
      dueDate
      id
      priority
      reminderDate
      status
      tags
      title
    }
  }
`;

const DELETE_TASK = `
  mutation DeleteTask($id: UUID!) {
    deleteTask(id: $id)
  }
`;

const ADD_TASK_CONVERSATION = `
  mutation AddTaskConversation($input: TaskConversationInput!) {
    addTaskConversation(input: $input) {
      content
      createdAt
      id
      taskId
    }
  }
`;

const DELETE_TASK_CONVERSATION = `
  mutation DeleteTaskConversation($id: UUID!) {
    deleteTaskConversation(id: $id)
  }
`;

const GET_TASK_CONVERSATIONS = `
  query GetTaskConversations($taskId: UUID!) {
    taskConversations(taskId: $taskId) {
      content
      createdAt
      id
      taskId
    }
  }
`;

const GET_TASK_RELATED_ENTITIES = `
  query GetTaskRelatedEntities($taskId: UUID!) {
    taskRelatedEntities(taskId: $taskId) {
      checks {
        checkNumber
        commission
        commissionMonth
        createdBy
        creationType
        entityDate
        entryDate
        factoryId
        id
        postDate
        status
        userOwnerIds
      }
      companies {
        companySourceType
        createdAt
        createdBy {
          email
          firstName
          fullName
          id
          lastName
        }
        id
        name
        parentCompanyId
        phone
        tags
        website
      }
      contacts {
        createdAt
        email
        firstName
        id
        lastName
        notes
        phone
        role
        tags
        territory
      }
      customers {
        companyName
        id
        insideRepId
        parentId
      }
      factories {
        id
        title
      }
      invoices {
        balanceId
        createdBy
        creationType
        dueDate
        entityDate
        entryDate
        factoryId
        id
        invoiceNumber
        locked
        orderId
        published
        status
        userOwnerIds
      }
      jobs {
        additionalInformation
        createdAt
        createdBy {
          email
          firstName
          fullName
          id
          lastName
        }
        description
        endDate
        id
        jobName
        jobType
        requesterId
        startDate
        status {
          id
          name
        }
        structuralDetails
        structuralInformation
        tags
      }
      notes {
        content
        createdAt
        createdBy {
          email
          firstName
          lastName
          id
          fullName
        }
        id
        mentions
        tags
        title
      }
      orders {
        balanceId
        billToCustomerId
        dueDate
        entityDate
        factSoNumber
        entryDate
        factoryId
        id
        jobName
        orderNumber
        quoteId
        shipDate
        soldToCustomerId
        status
        userOwnerIds
      }
      preOpportunities {
        acceptDate
        billToCustomerAddressId
        billToCustomerId
        createdAt
        createdById
        customerRef
        entityDate
        entityNumber
        expDate
        freightTerms
        id
        jobId
        paymentTerms
        reviseDate
        soldToCustomerAddressId
        soldToCustomerId
        status
        tags
      }
      products {
        factoryId
        factoryPartNumber
        id
      }
      quotes {
        billToCustomerId
        blanket
        createdBy
        entityDate
        entryDate
        expDate
        id
        jobName
        quoteNumber
        soldToCustomerId
        userOwnerIds
      }
    }
  }
`;

// Search queries are now in the central search API (components/lib/api/search.ts)
// Note: GET_CONTACT is kept locally as it's specific to tasks for fetching contact by ID

const GET_CONTACT = `
  query GetContact($id: UUID!) {
    contact(id: $id) {
      id
      firstName
      lastName
      email
      phone
      role
      notes
      territory
      tags
      createdAt
    }
  }
`;

// Link mutations are in entity-links.ts - functions re-exported above

// Task relation mutations
const ADD_TASK_RELATION = `
  mutation AddTaskRelation($input: TaskRelationInput!) {
    addTaskRelation(input: $input) {
      id
      taskId
      relatedEntityType
      relatedEntityId
      createdAt
    }
  }
`;

const GET_TASK_RELATIONS = `
  query GetTaskRelations($taskId: UUID!) {
    taskRelations(taskId: $taskId) {
      id
      taskId
      relatedEntityType
      relatedEntityId
      createdAt
    }
  }
`;

const DELETE_TASK_RELATION = `
  mutation DeleteTaskRelation($id: UUID!) {
    deleteTaskRelation(id: $id)
  }
`;

const UPDATE_TASK_CONVERSATION = `
  mutation UpdateTaskConversation($taskConversationId: UUID!, $input: TaskConversationInput!) {
    updateTaskConversation(taskConversationId: $taskConversationId, input: $input) {
      content
      createdAt
      id
      taskId
    }
  }
`;

const GET_TASKS_BY_ENTITY = `
  query GetTasksByEntity($entityId: UUID!, $entityType: EntityType!) {
    tasksByEntity(entityId: $entityId, entityType: $entityType) {
      id
      title
      description
      status
      priority
      dueDate
      reminderDate
      tags
      assignedToId
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

// ============================================================================
// API Functions - Tasks
// ============================================================================

export interface PaginatedTasksResult {
  records: TaskLandingPage[];
  total: number;
}

export interface TaskPaginationParams {
  limit?: number;
  offset?: number;
}

// Filter and sort types (matching crm-graphql.ts)
export type FilterOperator =
  | 'EQ'
  | 'NE'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'LIKE'
  | 'ILIKE'
  | 'BEGINS_WITH'
  | 'ENDS_WITH'
  | 'IN'
  | 'NOT_IN'
  | 'IS_NULL'
  | 'IS_NOT_NULL';

export type SortDirection = 'ASC' | 'DESC';

export interface TaskLandingPageFilter {
  operator: FilterOperator;
  columnName: string;
  value?: string;
  values?: string[];
}

export interface TaskLandingPageOrderBy {
  columnName: string;
  direction: SortDirection;
}

/**
 * Fetch all tasks using findLandingPages endpoint (backward compatible)
 */
export async function fetchTasks(): Promise<TaskLandingPage[]> {
  const result = await fetchTasksWithPagination();
  return result.records;
}

/**
 * Fetch tasks with pagination support and optional filters/sorting
 */
export async function fetchTasksWithPagination(
  filters?: TaskLandingPageFilter[],
  orderBy?: TaskLandingPageOrderBy[],
  pagination?: TaskPaginationParams
): Promise<PaginatedTasksResult> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: TaskLandingPage[]; total: number };
  }>({
    query: FIND_TASKS_LANDING_PAGES,
    variables: {
      filters: filters && filters.length > 0 ? filters : undefined,
      orderBy: orderBy && orderBy.length > 0 ? orderBy : undefined,
      limit: pagination?.limit,
      offset: pagination?.offset
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch tasks');
  }

  return {
    records: mapFormattedCreatedBy(response.data?.findLandingPages?.records),
    total: response.data?.findLandingPages?.total || 0,
  };
}

/**
 * Fetch a single task by ID
 */
export async function fetchTask(id: string): Promise<Task | null> {
  const response = await crmGraphQLRequest<{ task: Task }>({
    query: GET_TASK,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch task');
  }

  const task = response.data?.task;
  return task ? withFormattedCreatedBy(task) : null;
}

/**
 * Create a new task
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await crmGraphQLRequest<{ createTask: Task }>({
    query: CREATE_TASK,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create task');
  }

  if (!response.data?.createTask) {
    throw new Error('No task returned from create mutation');
  }

  return withFormattedCreatedBy(response.data.createTask);
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const response = await crmGraphQLRequest<{ updateTask: Task }>({
    query: UPDATE_TASK,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update task');
  }

  if (!response.data?.updateTask) {
    throw new Error('No task returned from update mutation');
  }

  return withFormattedCreatedBy(response.data.updateTask);
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteTask: string }>({
    query: DELETE_TASK,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete task');
  }

  return true;
}

// ============================================================================
// API Functions - Task Conversations
// ============================================================================

/**
 * Fetch conversations/comments for a task
 */
export async function fetchTaskConversations(taskId: string): Promise<TaskConversation[]> {
  const response = await crmGraphQLRequest<{ taskConversations: TaskConversation[] }>({
    query: GET_TASK_CONVERSATIONS,
    variables: { taskId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch task conversations');
  }

  return response.data?.taskConversations || [];
}

/**
 * Add a conversation/comment to a task
 */
export async function addTaskConversation(input: {
  taskId: string;
  content: string;
}): Promise<TaskConversation> {
  const response = await crmGraphQLRequest<{ addTaskConversation: TaskConversation }>({
    query: ADD_TASK_CONVERSATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add task conversation');
  }

  if (!response.data?.addTaskConversation) {
    throw new Error('No conversation returned from add mutation');
  }

  return response.data.addTaskConversation;
}

/**
 * Delete a task conversation/comment
 */
export async function deleteTaskConversation(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteTaskConversation: string }>({
    query: DELETE_TASK_CONVERSATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete task conversation');
  }

  return true;
}

// ============================================================================
// API Functions - Task Related Entities
// ============================================================================

/**
 * Fetch related entities (companies, contacts, jobs, notes, checks, invoices, orders, quotes, etc.) for a task
 */
export async function fetchTaskRelatedEntities(taskId: string): Promise<TaskRelatedEntities> {
  const response = await crmGraphQLRequest<{ taskRelatedEntities: TaskRelatedEntities }>({
    query: GET_TASK_RELATED_ENTITIES,
    variables: { taskId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch task related entities');
  }

  return (
    (response.data?.taskRelatedEntities && {
      checks: response.data.taskRelatedEntities.checks || [],
      companies: mapFormattedCreatedBy(response.data.taskRelatedEntities.companies),
      contacts: response.data.taskRelatedEntities.contacts || [],
      customers: response.data.taskRelatedEntities.customers || [],
      factories: response.data.taskRelatedEntities.factories || [],
      invoices: response.data.taskRelatedEntities.invoices || [],
      jobs: mapFormattedCreatedBy(response.data.taskRelatedEntities.jobs),
      notes: mapFormattedCreatedBy(response.data.taskRelatedEntities.notes),
      orders: response.data.taskRelatedEntities.orders || [],
      preOpportunities: response.data.taskRelatedEntities.preOpportunities || [],
      products: response.data.taskRelatedEntities.products || [],
      quotes: response.data.taskRelatedEntities.quotes || [],
    }) || {
      checks: [],
      companies: [],
      contacts: [],
      customers: [],
      factories: [],
      invoices: [],
      jobs: [],
      notes: [],
      orders: [],
      preOpportunities: [],
      products: [],
      quotes: [],
    }
  );
}

// Search functions are now imported and re-exported from central search API (components/lib/api/search.ts)

// Contact type for local fetchContactById function
interface ContactResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  notes: string;
  territory: string;
  tags: string;
  createdAt: string;
}

/**
 * Fetch a single contact by ID
 * This is kept locally as it's specific to tasks for fetching contact details
 */
export async function fetchContactById(id: string): Promise<ContactResult | null> {
  const response = await crmGraphQLRequest<{ contact: ContactResult }>({
    query: GET_CONTACT,
    variables: { id },
  });

  if (response.errors) {
    // Silently return null if contact not found, don't throw
    console.warn('Failed to fetch contact:', response.errors[0]?.message);
    return null;
  }

  return response.data?.contact || null;
}

// Entity Links API Functions are re-exported from entity-links.ts at top of file
// createTaskLink -> createLink
// deleteTaskLinkByEntities -> deleteLinkByEntities

// ============================================================================
// API Functions - Task Relations
// ============================================================================

/**
 * Add a relation between a task and another entity
 */
export async function addTaskRelation(input: AddTaskRelationInput): Promise<TaskRelation> {
  const response = await crmGraphQLRequest<{ addTaskRelation: TaskRelation }>({
    query: ADD_TASK_RELATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add task relation');
  }

  if (!response.data?.addTaskRelation) {
    throw new Error('No relation returned from add mutation');
  }

  return response.data.addTaskRelation;
}

/**
 * Fetch all relations for a task
 */
export async function fetchTaskRelations(taskId: string): Promise<TaskRelation[]> {
  const response = await crmGraphQLRequest<{ taskRelations: TaskRelation[] }>({
    query: GET_TASK_RELATIONS,
    variables: { taskId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch task relations');
  }

  return response.data?.taskRelations || [];
}

/**
 * Delete a task relation
 */
export async function deleteTaskRelation(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteTaskRelation: string }>({
    query: DELETE_TASK_RELATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete task relation');
  }

  return true;
}

/**
 * Update a task conversation
 */
export async function updateTaskConversation(
  taskConversationId: string,
  input: { taskId: string; content: string }
): Promise<TaskConversation> {
  const response = await crmGraphQLRequest<{ updateTaskConversation: TaskConversation }>({
    query: UPDATE_TASK_CONVERSATION,
    variables: { taskConversationId, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update task conversation');
  }

  if (!response.data?.updateTaskConversation) {
    throw new Error('No conversation returned from update mutation');
  }

  return response.data.updateTaskConversation;
}

/**
 * Fetch tasks linked to a specific entity
 */
export async function fetchTasksByEntity(entityId: string, entityType: TaskEntityType): Promise<TaskByEntity[]> {
  const response = await crmGraphQLRequest<{ tasksByEntity: TaskByEntity[] }>({
    query: GET_TASKS_BY_ENTITY,
    variables: { entityId, entityType },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch tasks by entity');
  }

  return mapFormattedCreatedBy(response.data?.tasksByEntity) as TaskByEntity[];
}
