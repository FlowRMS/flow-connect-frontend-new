/**
 * Tasks API Module
 * Clean implementation of Tasks GraphQL API endpoints
 * Following the same pattern as Notes API
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';

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
export type EntityType = 'TASK' | 'JOB' | 'COMPANY' | 'CONTACT' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'FACTORY' | 'CUSTOMER' | 'PRODUCT';

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
  reminderDate: string;
  tags: string;
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
    createdBy: string;
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
  preOpportunities: Array<{
    id: string;
    entityNumber: string;
    entityDate: string;
    status: string;
    soldToCustomerId: string;
    expDate: string;
    createdAt: string;
    createdById: string;
  }>;
}

// Search result types
export interface CompanySearchResult {
  id: string;
  name: string;
  companySourceType: string;
  createdAt: string;
  createdBy: string;
  parentCompanyId: string;
  phone: string;
  tags: string;
  website: string;
}

export interface UserSearchResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface ContactSearchResult {
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
  createdBy: string;
}

export interface JobSearchResult {
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
}

export interface NoteSearchResult {
  id: string;
  title: string;
  content: string;
  mentions: string;
  tags: string;
  createdAt: string;
  createdBy: string;
}

export interface PreOpportunitySearchResult {
  id: string;
  entityNumber: string;
  entityDate: string;
  status: string;
  soldToCustomerId: string;
  expDate: string;
  createdAt: string;
  createdById: string;
}

export interface QuoteSearchResult {
  id: string;
  quoteNumber: string;
  jobName: string;
  entityDate: string;
  entryDate: string;
  expDate: string;
  billToCustomerId: string;
  soldToCustomerId: string;
  blanket: boolean;
  createdBy: string;
  userOwnerIds: string[];
}

export interface OrderSearchResult {
  id: string;
  orderNumber: string;
  jobName: string;
  entityDate: string;
  entryDate: string;
  dueDate: string;
  shipDate: string;
  status: string;
  billToCustomerId: string;
  soldToCustomerId: string;
  factoryId: string;
  quoteId: string;
  balanceId: string;
  factSoNumber: string;
  userOwnerIds: string[];
}

export interface InvoiceSearchResult {
  id: string;
  invoiceNumber: string;
  entityDate: string;
  entryDate: string;
  dueDate: string;
  status: string;
  factoryId: string;
  orderId: string;
  balanceId: string;
  locked: boolean;
  published: boolean;
  creationType: string;
  createdBy: string;
  userOwnerIds: string[];
}

export interface CheckSearchResult {
  id: string;
  checkNumber: string;
  entityDate: string;
  entryDate: string;
  postDate: string;
  status: string;
  factoryId: string;
  commission: number;
  commissionMonth: string;
  creationType: string;
  createdBy: string;
  userOwnerIds: string[];
}

export interface FactorySearchResult {
  id: string;
  title: string;
}

export interface CustomerSearchResult {
  id: string;
  companyName: string;
}

export interface ProductSearchResult {
  id: string;
  factoryPartNumber: string;
}

export interface EntityLink {
  id: string;
  sourceEntityType: string;
  sourceEntityId: string;
  targetEntityType: string;
  targetEntityId: string;
  createdAt: string;
  createdBy: string;
}

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

// ============================================================================
// GraphQL Queries
// ============================================================================

const FIND_TASKS_LANDING_PAGES = `
  query FindTasksLandingPages {
    findLandingPages(sourceType: TASKS) {
      records {
        ... on TaskLandingPage {
          id
          assignedTo
          createdAt
          createdBy
          description
          dueDate
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
        territory
        tags
        role
        phone
        notes
        lastName
        id
        firstName
        email
        createdAt
        companyId
      }
      jobs {
        structuralInformation
        tags
        structuralDetails
        status {
          name
          id
        }
        startDate
        requesterId
        jobType
        jobName
        id
        endDate
        description
        createdBy {
          email
          firstName
          fullName
          id
          lastName
        }
        createdAt
        additionalInformation
      }
      notes {
        content
        createdAt
        createdBy {
          email
          firstName
          fullName
          id
          lastName
        }
        id
        mentions
        tags
        title
      }
      preOpportunities {
        id
        entityNumber
        entityDate
        status
        soldToCustomerId
        expDate
        createdAt
        createdById
      }
    }
  }
`;

// Search queries
const COMPANY_SEARCH = `
  query CompanySearch($searchTerm: String!) {
    companySearch(searchTerm: $searchTerm) {
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
  }
`;

const CONTACT_SEARCH = `
  query ContactSearch($searchTerm: String!) {
    contactSearch(searchTerm: $searchTerm) {
      companyId
      createdAt
      email
      id
      firstName
      lastName
      notes
      phone
      role
      territory
      tags
    }
  }
`;

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
      companyId
      createdAt
    }
  }
`;

const JOB_SEARCH = `
  query JobSearch($searchTerm: String!) {
    jobSearch(searchTerm: $searchTerm) {
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
      jobName
      jobType
      id
      startDate
      requesterId
      status {
        id
        name
      }
      structuralDetails
      structuralInformation
      tags
    }
  }
`;

const NOTE_SEARCH = `
  query NoteSearch($searchTerm: String!) {
    noteSearch(searchTerm: $searchTerm) {
      content
      createdAt
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      id
      mentions
      tags
      title
    }
  }
`;

const PRE_OPPORTUNITY_SEARCH = `
  query PreOpportunitySearch($searchTerm: String!) {
    preOpportunitySearch(searchTerm: $searchTerm) {
      id
      entityNumber
      entityDate
      status
      soldToCustomerId
      expDate
      createdAt
      createdById
    }
  }
`;

const USER_SEARCH = `
  query UserSearch($searchTerm: String!) {
    userSearch(searchTerm: $searchTerm) {
      email
      firstName
      fullName
      id
      lastName
    }
  }
`;

const QUOTE_SEARCH = `
  query QuoteSearch($searchTerm: String!) {
    quoteSearch(searchTerm: $searchTerm) {
      id
      quoteNumber
      jobName
      entityDate
      entryDate
      expDate
      billToCustomerId
      soldToCustomerId
      blanket
      createdBy
      userOwnerIds
    }
  }
`;

const ORDER_SEARCH = `
  query OrderSearch($searchTerm: String!) {
    orderSearch(searchTerm: $searchTerm) {
      id
      orderNumber
      jobName
      entityDate
      entryDate
      dueDate
      shipDate
      status
      billToCustomerId
      soldToCustomerId
      factoryId
      quoteId
      balanceId
      factSoNumber
      userOwnerIds
    }
  }
`;

const INVOICE_SEARCH = `
  query InvoiceSearch($searchTerm: String!) {
    invoiceSearch(searchTerm: $searchTerm) {
      id
      invoiceNumber
      entityDate
      entryDate
      dueDate
      status
      factoryId
      orderId
      balanceId
      locked
      published
      creationType
      createdBy
      userOwnerIds
    }
  }
`;

const CHECK_SEARCH = `
  query CheckSearch($searchTerm: String!) {
    checkSearch(searchTerm: $searchTerm) {
      id
      checkNumber
      entityDate
      entryDate
      postDate
      status
      factoryId
      commission
      commissionMonth
      creationType
      createdBy
      userOwnerIds
    }
  }
`;

const FACTORY_SEARCH = `
  query FactorySearch($searchTerm: String!, $published: Boolean) {
    factorySearch(searchTerm: $searchTerm, published: $published) {
      id
      title
    }
  }
`;

const CUSTOMER_SEARCH = `
  query CustomerSearch($searchTerm: String!, $published: Boolean) {
    customerSearch(searchTerm: $searchTerm, published: $published) {
      id
      companyName
    }
  }
`;

const PRODUCT_SEARCH = `
  query ProductSearch($searchTerm: String!) {
    productSearch(searchTerm: $searchTerm) {
      id
      factoryPartNumber
    }
  }
`;

// Link mutations
const CREATE_LINK = `
  mutation CreateLink(
    $sourceEntityType: EntityType!
    $sourceEntityId: UUID!
    $targetEntityType: EntityType!
    $targetEntityId: UUID!
  ) {
    createLink(input: {
      sourceEntityType: $sourceEntityType
      sourceEntityId: $sourceEntityId
      targetEntityType: $targetEntityType
      targetEntityId: $targetEntityId
    }) {
      id
      sourceEntityType
      sourceEntityId
      targetEntityType
      targetEntityId
      createdAt
    }
  }
`;

const DELETE_LINK_BY_ENTITIES = `
  mutation DeleteLinkByEntities(
    $sourceEntityType: EntityType!
    $sourceEntityId: UUID!
    $targetEntityType: EntityType!
    $targetEntityId: UUID!
  ) {
    deleteLinkByEntities(input: {
      sourceEntityType: $sourceEntityType
      sourceEntityId: $sourceEntityId
      targetEntityType: $targetEntityType
      targetEntityId: $targetEntityId
    })
  }
`;

// ============================================================================
// API Functions - Tasks
// ============================================================================

/**
 * Fetch all tasks using findLandingPages endpoint
 */
export async function fetchTasks(): Promise<TaskLandingPage[]> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: TaskLandingPage[]; total: number };
  }>({
    query: FIND_TASKS_LANDING_PAGES,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch tasks');
  }

  return mapFormattedCreatedBy(response.data?.findLandingPages?.records);
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
 * Fetch related entities (companies, contacts, jobs, notes) for a task
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
      companies: mapFormattedCreatedBy(response.data.taskRelatedEntities.companies),
      contacts: mapFormattedCreatedBy(response.data.taskRelatedEntities.contacts),
      jobs: mapFormattedCreatedBy(response.data.taskRelatedEntities.jobs),
      notes: mapFormattedCreatedBy(response.data.taskRelatedEntities.notes),
      preOpportunities: response.data.taskRelatedEntities.preOpportunities || [],
    }) || {
      companies: [],
      contacts: [],
      jobs: [],
      notes: [],
      preOpportunities: [],
    }
  );
}

// ============================================================================
// API Functions - Search
// ============================================================================

/**
 * Search for companies
 * Returns all companies when empty string is passed
 */
export async function searchCompanies(searchTerm: string): Promise<CompanySearchResult[]> {
  const response = await crmGraphQLRequest<{ companySearch: CompanySearchResult[] }>({
    query: COMPANY_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search companies');
  }

  return mapFormattedCreatedBy(response.data?.companySearch);
}

/**
 * Search for contacts
 * Returns all contacts when empty string is passed
 */
export async function searchContacts(searchTerm: string): Promise<ContactSearchResult[]> {
  const response = await crmGraphQLRequest<{ contactSearch: ContactSearchResult[] }>({
    query: CONTACT_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search contacts');
  }

  return mapFormattedCreatedBy(response.data?.contactSearch);
}

/**
 * Fetch a single contact by ID
 */
export async function fetchContactById(id: string): Promise<ContactSearchResult | null> {
  const response = await crmGraphQLRequest<{ contact: ContactSearchResult }>({
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

/**
 * Search for jobs
 * Returns all jobs when empty string is passed
 */
export async function searchJobs(searchTerm: string): Promise<JobSearchResult[]> {
  const response = await crmGraphQLRequest<{ jobSearch: JobSearchResult[] }>({
    query: JOB_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search jobs');
  }

  return mapFormattedCreatedBy(response.data?.jobSearch);
}

/**
 * Search for notes
 * Returns all notes when empty string is passed
 */
export async function searchNotes(searchTerm: string): Promise<NoteSearchResult[]> {
  const response = await crmGraphQLRequest<{ noteSearch: NoteSearchResult[] }>({
    query: NOTE_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search notes');
  }

  return mapFormattedCreatedBy(response.data?.noteSearch);
}

/**
 * Search for pre-opportunities
 * Returns all pre-opportunities when empty string is passed
 */
export async function searchPreOpportunities(searchTerm: string): Promise<PreOpportunitySearchResult[]> {
  const response = await crmGraphQLRequest<{ preOpportunitySearch: PreOpportunitySearchResult[] }>({
    query: PRE_OPPORTUNITY_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search pre-opportunities');
  }

  return response.data?.preOpportunitySearch || [];
}

/**
 * Search for users (for assignee selection)
 * Returns users matching the search term
 */
export async function searchUsers(searchTerm: string): Promise<UserSearchResult[]> {
  const response = await crmGraphQLRequest<{ userSearch: UserSearchResult[] }>({
    query: USER_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search users');
  }

  return response.data?.userSearch || [];
}

/**
 * Search for quotes
 * Returns all quotes when empty string is passed
 */
export async function searchQuotes(searchTerm: string): Promise<QuoteSearchResult[]> {
  const response = await crmGraphQLRequest<{ quoteSearch: QuoteSearchResult[] }>({
    query: QUOTE_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search quotes');
  }

  return response.data?.quoteSearch || [];
}

/**
 * Search for orders
 * Returns all orders when empty string is passed
 */
export async function searchOrders(searchTerm: string): Promise<OrderSearchResult[]> {
  const response = await crmGraphQLRequest<{ orderSearch: OrderSearchResult[] }>({
    query: ORDER_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search orders');
  }

  return response.data?.orderSearch || [];
}

/**
 * Search for invoices
 * Returns all invoices when empty string is passed
 */
export async function searchInvoices(searchTerm: string): Promise<InvoiceSearchResult[]> {
  const response = await crmGraphQLRequest<{ invoiceSearch: InvoiceSearchResult[] }>({
    query: INVOICE_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search invoices');
  }

  return response.data?.invoiceSearch || [];
}

/**
 * Search for checks
 * Returns all checks when empty string is passed
 */
export async function searchChecks(searchTerm: string): Promise<CheckSearchResult[]> {
  const response = await crmGraphQLRequest<{ checkSearch: CheckSearchResult[] }>({
    query: CHECK_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search checks');
  }

  return response.data?.checkSearch || [];
}

/**
 * Search for factories
 * Returns all factories when empty string is passed
 */
export async function searchFactories(searchTerm: string): Promise<FactorySearchResult[]> {
  const response = await crmGraphQLRequest<{ factorySearch: FactorySearchResult[] }>({
    query: FACTORY_SEARCH,
    variables: { searchTerm, published: true },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search factories');
  }

  return response.data?.factorySearch || [];
}

/**
 * Search for customers
 * Returns all customers when empty string is passed
 */
export async function searchCustomers(searchTerm: string): Promise<CustomerSearchResult[]> {
  const response = await crmGraphQLRequest<{ customerSearch: CustomerSearchResult[] }>({
    query: CUSTOMER_SEARCH,
    variables: { searchTerm, published: true },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search customers');
  }

  return response.data?.customerSearch || [];
}

/**
 * Search for products
 * Returns all products when empty string is passed
 */
export async function searchProducts(searchTerm: string): Promise<ProductSearchResult[]> {
  const response = await crmGraphQLRequest<{ productSearch: ProductSearchResult[] }>({
    query: PRODUCT_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search products');
  }

  return response.data?.productSearch || [];
}

// ============================================================================
// API Functions - Entity Links
// ============================================================================

/**
 * Create a link between task and another entity
 */
export async function createTaskLink(input: {
  sourceEntityType: EntityType;
  sourceEntityId: string;
  targetEntityType: EntityType;
  targetEntityId: string;
}): Promise<EntityLink> {
  const response = await crmGraphQLRequest<{ createLink: EntityLink }>({
    query: CREATE_LINK,
    variables: {
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create link');
  }

  if (!response.data?.createLink) {
    throw new Error('No link returned from create mutation');
  }

  return response.data.createLink;
}

/**
 * Delete a link between task and another entity by entities
 */
export async function deleteTaskLinkByEntities(input: {
  sourceEntityType: EntityType;
  sourceEntityId: string;
  targetEntityType: EntityType;
  targetEntityId: string;
}): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteLinkByEntities: boolean }>({
    query: DELETE_LINK_BY_ENTITIES,
    variables: {
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete link');
  }

  return true;
}
