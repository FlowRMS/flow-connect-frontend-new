/**
 * Notes API Module
 * Clean implementation of Notes GraphQL API endpoints
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';

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
  createdBy: string;
  createdAt: string;
}

export interface NoteRelatedEntities {
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

export interface TaskSearchResult {
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
}

export interface JobSearchResult {
  id: string;
  jobName: string;
  jobType: string;
  description: string;
  startDate: string;
  endDate: string;
  status: { id: string };
  requesterId: string;
  additionalInformation: string;
  structuralDetails: string;
  structuralInformation: string;
  tags: string;
  createdAt: string;
  createdBy: string;
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

export type EntityType = 'NOTE' | 'JOB' | 'COMPANY' | 'CONTACT' | 'TASK';

// ============================================================================
// GraphQL Queries
// ============================================================================

const FIND_NOTES_LANDING_PAGES = `
  query FindNotesLandingPages {
    findLandingPages(sourceType: NOTES) {
      records {
        ... on NoteLandingPage {
          id
          content
          createdAt
          createdBy
          mentions
          tags
          title
        }
      }
      total
    }
  }
`;

const CREATE_NOTE = `
  mutation CreateNote($input: NoteInput!) {
    createNote(input: $input) {
      content
      createdAt
      createdBy
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
      createdBy
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
      createdBy
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
      createdBy
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
      createdBy
      id
      noteId
    }
  }
`;

const GET_NOTE_RELATED_ENTITIES = `
  query GetNoteRelatedEntities($noteId: UUID!) {
    noteRelatedEntities(noteId: $noteId) {
      companies {
        companySourceType
        createdAt
        createdBy
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
        createdBy
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
        createdBy
        createdAt
        additionalInformation
      }
      tasks {
        title
        tags
        status
        reminderDate
        priority
        id
        dueDate
        description
        createdBy
        createdAt
        assignedToId
      }
    }
  }
`;

const COMPANY_SEARCH = `
  query CompanySearch($searchTerm: String!) {
    companySearch(searchTerm: $searchTerm) {
      companySourceType
      createdAt
      createdBy
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
      createdBy
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

const TASK_SEARCH = `
  query TaskSearch($searchTerm: String!) {
    taskSearch(searchTerm: $searchTerm) {
      assignedToId
      createdAt
      createdBy
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

const JOB_SEARCH = `
  query JobSearch($searchTerm: String!) {
    jobSearch(searchTerm: $searchTerm) {
      additionalInformation
      createdAt
      createdBy
      description
      endDate
      jobName
      jobType
      id
      startDate
      requesterId
      status {
        id
      }
      structuralDetails
      structuralInformation
      tags
    }
  }
`;

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
      createdBy
    }
  }
`;

const DELETE_LINK = `
  mutation DeleteLink($id: UUID!) {
    deleteLink(id: $id)
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
// API Functions
// ============================================================================

/**
 * Fetch all notes using findLandingPages endpoint
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

  return response.data?.findLandingPages?.records || [];
}

/**
 * Create a new note
 */
export async function createNote(input: {
  title: string;
  content: string;
  mentions: string;
  tags: string;
}): Promise<Note> {
  const response = await crmGraphQLRequest<{ createNote: Note }>({
    query: CREATE_NOTE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create note');
  }

  if (!response.data?.createNote) {
    throw new Error('No note returned from create mutation');
  }

  return response.data.createNote;
}

/**
 * Update an existing note
 */
export async function updateNote(
  id: string,
  input: {
    title: string;
    content: string;
    mentions: string;
    tags: string;
  }
): Promise<Note> {
  const response = await crmGraphQLRequest<{ updateNote: Note }>({
    query: UPDATE_NOTE,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update note');
  }

  if (!response.data?.updateNote) {
    throw new Error('No note returned from update mutation');
  }

  return response.data.updateNote;
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
  noteConversationId: string,
  input: {
    noteId: string;
    content: string;
  }
): Promise<NoteConversation> {
  const response = await crmGraphQLRequest<{ updateNoteConversation: NoteConversation }>({
    query: UPDATE_NOTE_CONVERSATION,
    variables: { noteConversationId, input },
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
 * Fetch related entities (companies, contacts, jobs, tasks) for a note
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
    response.data?.noteRelatedEntities || {
      companies: [],
      contacts: [],
      jobs: [],
      tasks: [],
    }
  );
}

/**
 * Search for companies
 */
export async function searchCompanies(searchTerm: string): Promise<CompanySearchResult[]> {
  const response = await crmGraphQLRequest<{ companySearch: CompanySearchResult[] }>({
    query: COMPANY_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search companies');
  }

  return response.data?.companySearch || [];
}

/**
 * Search for contacts
 */
export async function searchContacts(searchTerm: string): Promise<ContactSearchResult[]> {
  const response = await crmGraphQLRequest<{ contactSearch: ContactSearchResult[] }>({
    query: CONTACT_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search contacts');
  }

  return response.data?.contactSearch || [];
}

/**
 * Search for tasks
 */
export async function searchTasks(searchTerm: string): Promise<TaskSearchResult[]> {
  const response = await crmGraphQLRequest<{ taskSearch: TaskSearchResult[] }>({
    query: TASK_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search tasks');
  }

  return response.data?.taskSearch || [];
}

/**
 * Search for jobs
 */
export async function searchJobs(searchTerm: string): Promise<JobSearchResult[]> {
  const response = await crmGraphQLRequest<{ jobSearch: JobSearchResult[] }>({
    query: JOB_SEARCH,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search jobs');
  }

  return response.data?.jobSearch || [];
}

/**
 * Create a link between entities
 */
export async function createLink(input: {
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
 * Delete a link between entities
 */
export async function deleteLink(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteLink: boolean }>({
    query: DELETE_LINK,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete link');
  }

  return true;
}

/**
 * Delete a link by source and target entities
 */
export async function deleteLinkByEntities(input: {
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
