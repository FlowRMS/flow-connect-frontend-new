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

// Re-export file functions from files module
export {
  searchFiles,
  fetchFilesByLinkedEntity,
  linkFileToEntity,
  formatFileSize,
  getFileIcon,
  type FileResponse,
  type FileEntityType,
} from '../../lib/graphql/files';

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
  mentions: string | string[]; // API returns array of UUIDs, but also accepts string
  tags: string;
  createdBy: string;
  createdAt: string;
}

export interface ConversationCreatedBy {
  id: string;
  authProviderId?: string;
  email?: string;
  enabled?: boolean;
  firstName?: string;
  fullName?: string;
  inside?: boolean;
  lastName?: string;
  outside?: boolean;
  role?: string;
  username?: string;
}

export interface NoteConversation {
  id: string;
  noteId: string;
  content: string;
  createdAt: string;
  createdBy?: ConversationCreatedBy;
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

// NoteRelatedEntities type removed - use RelatedEntities from ../../lib/graphql/types instead

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

const CONVERSATION_CREATED_BY_FIELDS = `
  createdBy {
    authProviderId
    email
    enabled
    firstName
    fullName
    id
    inside
    lastName
    outside
    role
    username
  }
`;

const ADD_NOTE_CONVERSATION = `
  mutation AddNoteConversation($input: NoteConversationInput!) {
    addNoteConversation(input: $input) {
      content
      createdAt
      ${CONVERSATION_CREATED_BY_FIELDS}
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
      ${CONVERSATION_CREATED_BY_FIELDS}
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
      ${CONVERSATION_CREATED_BY_FIELDS}
      id
      noteId
    }
  }
`;

// GET_NOTE_RELATED_ENTITIES query removed - use fetchRelatedEntities(noteId, 'NOTES') from entity-links.ts instead

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
  // Build input object, converting mentions from comma-separated string to array of UUIDs
  const apiInput: { title: string; content: string; tags?: string; mentions?: string[] } = {
    title: input.title,
    content: input.content,
    tags: input.tags,
  };
  if (input.mentions && input.mentions.trim()) {
    // Convert comma-separated string to array of UUIDs
    apiInput.mentions = input.mentions.split(',').map(id => id.trim()).filter(id => id);
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
  // Build input object, converting mentions from comma-separated string to array of UUIDs
  const apiInput: { title: string; content: string; tags?: string; mentions?: string[] } = {
    title: input.title,
    content: input.content,
    tags: input.tags,
  };
  if (input.mentions && input.mentions.trim()) {
    // Convert comma-separated string to array of UUIDs
    apiInput.mentions = input.mentions.split(',').map(id => id.trim()).filter(id => id);
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

// fetchNoteRelatedEntities removed - use fetchRelatedEntities(noteId, 'NOTES') from ../../lib/graphql/entity-links instead

// Search functions are now imported and re-exported from central search API (components/lib/api/search.ts)
// Link functions are re-exported from entity-links.ts
export { createLink, deleteLink, deleteLinkByEntities } from '../../lib/graphql/entity-links';
