/**
 * Notes API Module
 * Clean implementation of Notes GraphQL API endpoints
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';

// Re-export all search functions from central search API
export {
  searchCompanies,
  searchContacts,
  searchTasks,
  searchJobs,
  searchPreOpportunities,
  searchQuotes,
  searchOrders,
  searchInvoices,
  searchChecks,
  searchFactories,
  searchCustomers,
  searchProducts,
  type CompanySearchResult,
  type ContactSearchResult,
  type TaskSearchResult,
  type JobSearchResult,
  type PreOpportunitySearchResult,
  type QuoteSearchResult,
  type OrderSearchResult,
  type InvoiceSearchResult,
  type CheckSearchResult,
  type FactorySearchResult,
  type CustomerSearchResult,
  type ProductSearchResult,
} from '../../lib/api/search';

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

export interface Note {
  id: string;
  title: string;
  content: string;
  mentions: string;
  tags: string;
  createdBy: string;
  createdAt: string;
}

export interface NoteConversation {
  id: string;
  noteId: string;
  content: string;
  createdAt: string;
}

export interface NoteLandingPage {
  id: string;
  title: string;
  content: string;
  linkedEntities: Array<{
    entityType: string;
    id: string;
    title: string;
  }>;
  mentions: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
}

// Input types for API operations
export interface CreateNoteInput {
  title: string;
  content: string;
  mentions?: string;
  tags?: string;
}

export interface UpdateNoteInput {
  title: string;
  content: string;
  mentions?: string;
  tags?: string;
}

export interface AddNoteConversationInput {
  noteId: string;
  content: string;
}

export interface UpdateNoteConversationInput {
  noteConversationId: string;
  noteId: string;
  content: string;
}

export interface NoteRelatedEntities {
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
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    reminderDate: string;
    assignedToId: string;
    tags: string;
    createdAt: string;
    createdBy: string;
  }>;
}

// Search result types are imported and re-exported from central search API above
// Entity types are re-exported from entity-links.ts
export type { EntityLink, CRMEntityType as EntityType } from '../../lib/graphql/entity-links';

// ============================================================================
// GraphQL Queries
// ============================================================================

const FIND_NOTES_LANDING_PAGES = `
  query FindNotesLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
    $limit: Int
    $offset: Int
  ) {
    findLandingPages(
      sourceType: NOTES
      filters: $filters
      orderBy: $orderBy
      limit: $limit
      offset: $offset
    ) {
      records {
        ... on NoteLandingPage {
          id
          content
          createdAt
          createdBy
          linkedEntities {
            entityType
            id
            title
          }
          mentions
          tags
          title
        }
      }
      total
    }
  }
`;

const GET_NOTE = `
  query GetNote($id: UUID!) {
    note(id: $id) {
      id
      title
      content
      mentions
      tags
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

const CREATE_NOTE = `
  mutation CreateNote($input: NoteInput!) {
    createNote(input: $input) {
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

const UPDATE_NOTE = `
  mutation UpdateNote($id: UUID!, $input: NoteInput!) {
    updateNote(id: $id, input: $input) {
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

const DELETE_NOTE = `
  mutation DeleteNote($id: UUID!) {
    deleteNote(id: $id)
  }
`;

const ADD_NOTE_CONVERSATION = `
  mutation AddNoteConversation($input: NoteConversationInput!) {
    addNoteConversation(input: $input) {
      content
      createdAt
      id
      noteId
    }
  }
`;

const UPDATE_NOTE_CONVERSATION = `
  mutation UpdateNoteConversation($noteConversationId: UUID!, $input: NoteConversationInput!) {
    updateNoteConversation(noteConversationId: $noteConversationId, input: $input) {
      content
      createdAt
      id
      noteId
    }
  }
`;

const DELETE_NOTE_CONVERSATION = `
  mutation DeleteNoteConversation($conversationId: UUID!) {
    deleteNoteConversation(conversationId: $conversationId)
  }
`;

const GET_NOTE_CONVERSATIONS = `
  query GetNoteConversations($noteId: UUID!) {
    noteConversations(noteId: $noteId) {
      content
      createdAt
      id
      noteId
    }
  }
`;

const GET_NOTE_RELATED_ENTITIES = `
  query GetNoteRelatedEntities($noteId: UUID!) {
    noteRelatedEntities(noteId: $noteId) {
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
      tasks {
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
        status
        reminderDate
        tags
        title
      }
    }
  }
`;

// Search queries are now in the central search API (components/lib/api/search.ts)
// Link functions are imported from entity-links.ts

// ============================================================================
// API Functions
// ============================================================================

// Filter and sort types
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

export interface NoteLandingPageFilter {
  operator: FilterOperator;
  columnName: string;
  value?: string;
  values?: string[];
}

export interface NoteLandingPageOrderBy {
  columnName: string;
  direction: SortDirection;
}

export interface PaginatedNotesResult {
  records: NoteLandingPage[];
  total: number;
}

/**
 * Fetch all notes using findLandingPages endpoint (backward compatible)
 */
export async function fetchNotes(): Promise<Note[]> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: Note[]; total: number };
  }>({
    query: FIND_NOTES_LANDING_PAGES,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch notes');
  }

  return mapFormattedCreatedBy(response.data?.findLandingPages?.records);
}

/**
 * Fetch notes landing pages with pagination support
 */
export async function fetchNoteLandingPages(
  filters?: NoteLandingPageFilter[],
  orderBy?: NoteLandingPageOrderBy[],
  pagination?: { limit?: number; offset?: number }
): Promise<PaginatedNotesResult> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: NoteLandingPage[]; total: number };
  }>({
    query: FIND_NOTES_LANDING_PAGES,
    variables: {
      filters: filters && filters.length > 0 ? filters : undefined,
      orderBy: orderBy && orderBy.length > 0 ? orderBy : undefined,
      limit: pagination?.limit,
      offset: pagination?.offset
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch notes');
  }

  return {
    records: mapFormattedCreatedBy(response.data?.findLandingPages?.records) as NoteLandingPage[],
    total: response.data?.findLandingPages?.total || 0,
  };
}

/**
 * Fetch a single note by ID
 */
export async function fetchNote(id: string): Promise<Note | null> {
  const response = await crmGraphQLRequest<{ note: Note }>({
    query: GET_NOTE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch note');
  }

  const note = response.data?.note;
  return note ? withFormattedCreatedBy(note) : null;
}

/**
 * Create a new note
 */
export async function createNote(input: CreateNoteInput): Promise<Note> {
  // Build input object, excluding mentions if empty (API expects UUID or undefined)
  const apiInput: { title: string; content: string; tags?: string; mentions?: string } = {
    title: input.title,
    content: input.content,
    tags: input.tags,
  };
  if (input.mentions && input.mentions.trim()) {
    apiInput.mentions = input.mentions;
  }

  const response = await crmGraphQLRequest<{ createNote: Note }>({
    query: CREATE_NOTE,
    variables: { input: apiInput },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create note');
  }

  if (!response.data?.createNote) {
    throw new Error('No note returned from create mutation');
  }

  return withFormattedCreatedBy(response.data.createNote);
}

/**
 * Update an existing note
 */
export async function updateNote(
  id: string,
  input: UpdateNoteInput
): Promise<Note> {
  // Build input object, excluding mentions if empty (API expects UUID or undefined)
  const apiInput: { title: string; content: string; tags?: string; mentions?: string } = {
    title: input.title,
    content: input.content,
    tags: input.tags,
  };
  if (input.mentions && input.mentions.trim()) {
    apiInput.mentions = input.mentions;
  }

  const response = await crmGraphQLRequest<{ updateNote: Note }>({
    query: UPDATE_NOTE,
    variables: { id, input: apiInput },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update note');
  }

  if (!response.data?.updateNote) {
    throw new Error('No note returned from update mutation');
  }

  return withFormattedCreatedBy(response.data.updateNote);
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteNote: string }>({
    query: DELETE_NOTE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete note');
  }

  return true;
}

/**
 * Add a conversation/comment to a note
 */
export async function addNoteConversation(input: {
  noteId: string;
  content: string;
}): Promise<NoteConversation> {
  const response = await crmGraphQLRequest<{ addNoteConversation: NoteConversation }>({
    query: ADD_NOTE_CONVERSATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add conversation');
  }

  if (!response.data?.addNoteConversation) {
    throw new Error('No conversation returned from add mutation');
  }

  return response.data.addNoteConversation;
}

/**
 * Update a note conversation/comment
 */
export async function updateNoteConversation(
  input: UpdateNoteConversationInput
): Promise<NoteConversation> {
  const response = await crmGraphQLRequest<{ updateNoteConversation: NoteConversation }>({
    query: UPDATE_NOTE_CONVERSATION,
    variables: {
      noteConversationId: input.noteConversationId,
      input: { noteId: input.noteId, content: input.content }
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update conversation');
  }

  if (!response.data?.updateNoteConversation) {
    throw new Error('No conversation returned from update mutation');
  }

  return response.data.updateNoteConversation;
}

/**
 * Delete a note conversation/comment
 */
export async function deleteNoteConversation(conversationId: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteNoteConversation: string }>({
    query: DELETE_NOTE_CONVERSATION,
    variables: { conversationId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete conversation');
  }

  return true;
}

/**
 * Fetch conversations/comments for a note
 */
export async function fetchNoteConversations(noteId: string): Promise<NoteConversation[]> {
  const response = await crmGraphQLRequest<{ noteConversations: NoteConversation[] }>({
    query: GET_NOTE_CONVERSATIONS,
    variables: { noteId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch conversations');
  }

  return response.data?.noteConversations || [];
}

/**
 * Fetch related entities (companies, contacts, jobs, tasks, preOpportunities, checks, invoices, orders, quotes, etc.) for a note
 */
export async function fetchNoteRelatedEntities(noteId: string): Promise<NoteRelatedEntities> {
  const response = await crmGraphQLRequest<{ noteRelatedEntities: NoteRelatedEntities }>({
    query: GET_NOTE_RELATED_ENTITIES,
    variables: { noteId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch related entities');
  }

  return (
    (response.data?.noteRelatedEntities && {
      checks: response.data.noteRelatedEntities.checks || [],
      companies: mapFormattedCreatedBy(response.data.noteRelatedEntities.companies),
      contacts: response.data.noteRelatedEntities.contacts || [],
      customers: response.data.noteRelatedEntities.customers || [],
      factories: response.data.noteRelatedEntities.factories || [],
      invoices: response.data.noteRelatedEntities.invoices || [],
      jobs: mapFormattedCreatedBy(response.data.noteRelatedEntities.jobs),
      orders: response.data.noteRelatedEntities.orders || [],
      preOpportunities: response.data.noteRelatedEntities.preOpportunities || [],
      products: response.data.noteRelatedEntities.products || [],
      quotes: response.data.noteRelatedEntities.quotes || [],
      tasks: mapFormattedCreatedBy(response.data.noteRelatedEntities.tasks),
    }) || {
      checks: [],
      companies: [],
      contacts: [],
      customers: [],
      factories: [],
      invoices: [],
      jobs: [],
      orders: [],
      preOpportunities: [],
      products: [],
      quotes: [],
      tasks: [],
    }
  );
}

// Search functions are now imported and re-exported from central search API (components/lib/api/search.ts)
// Link functions are re-exported from entity-links.ts
export { createLink, deleteLink, deleteLinkByEntities } from '../../lib/graphql/entity-links';
