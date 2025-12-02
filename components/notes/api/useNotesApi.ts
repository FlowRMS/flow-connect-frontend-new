/**
 * Notes React Query Hooks
 * Custom hooks for interacting with the Notes GraphQL API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasCRMTokens } from '../../lib/crm-auth';
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  addNoteConversation,
  updateNoteConversation,
  deleteNoteConversation,
  fetchNoteConversations,
  fetchNoteRelatedEntities,
  searchCompanies,
  searchContacts,
  searchTasks,
  searchJobs,
  createLink,
  deleteLink,
  deleteLinkByEntities,
  type Note,
  type NoteConversation,
  type NoteRelatedEntities,
  type CompanySearchResult,
  type ContactSearchResult,
  type TaskSearchResult,
  type JobSearchResult,
  type EntityLink,
  type EntityType,
} from './notesApi';

// ============================================================================
// Query Keys
// ============================================================================

export const notesQueryKeys = {
  all: ['notes'] as const,
  list: () => [...notesQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...notesQueryKeys.all, 'detail', id] as const,
  conversations: (noteId: string) => [...notesQueryKeys.all, 'conversations', noteId] as const,
  relatedEntities: (noteId: string) => [...notesQueryKeys.all, 'relatedEntities', noteId] as const,
  search: {
    companies: (term: string) => ['search', 'companies', term] as const,
    contacts: (term: string) => ['search', 'contacts', term] as const,
    tasks: (term: string) => ['search', 'tasks', term] as const,
    jobs: (term: string) => ['search', 'jobs', term] as const,
  },
};

// ============================================================================
// Note Hooks
// ============================================================================

/**
 * Fetch all notes
 */
export function useNotes() {
  return useQuery<Note[], Error>({
    queryKey: notesQueryKeys.list(),
    queryFn: fetchNotes,
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch conversations for a note
 */
export function useNoteConversations(noteId: string) {
  return useQuery<NoteConversation[], Error>({
    queryKey: notesQueryKeys.conversations(noteId),
    queryFn: () => fetchNoteConversations(noteId),
    enabled: hasCRMTokens() && !!noteId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch related entities for a note
 */
export function useNoteRelatedEntities(noteId: string) {
  return useQuery<NoteRelatedEntities, Error>({
    queryKey: notesQueryKeys.relatedEntities(noteId),
    queryFn: () => fetchNoteRelatedEntities(noteId),
    enabled: hasCRMTokens() && !!noteId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new note
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation<
    Note,
    Error,
    { title: string; content: string; mentions: string; tags: string }
  >({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.list() });
    },
  });
}

/**
 * Update an existing note
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation<
    Note,
    Error,
    { id: string; input: { title: string; content: string; mentions: string; tags: string } }
  >({
    mutationFn: ({ id, input }) => updateNote(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete a note
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.list() });
    },
  });
}

/**
 * Add a conversation/comment to a note
 */
export function useAddNoteConversation() {
  const queryClient = useQueryClient();

  return useMutation<NoteConversation, Error, { noteId: string; content: string }>({
    mutationFn: addNoteConversation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: notesQueryKeys.conversations(variables.noteId),
      });
    },
  });
}

/**
 * Update a note conversation/comment
 */
export function useUpdateNoteConversation() {
  const queryClient = useQueryClient();

  return useMutation<
    NoteConversation,
    Error,
    { id: string; noteId: string; content: string }
  >({
    mutationFn: ({ id, noteId, content }) =>
      updateNoteConversation(id, { noteId, content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: notesQueryKeys.conversations(variables.noteId),
      });
    },
  });
}

/**
 * Delete a note conversation/comment
 */
export function useDeleteNoteConversation() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { conversationId: string; noteId: string }>({
    mutationFn: ({ conversationId }) => deleteNoteConversation(conversationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: notesQueryKeys.conversations(variables.noteId),
      });
    },
  });
}

// ============================================================================
// Search Hooks
// ============================================================================

/**
 * Search for companies
 * Returns all companies when empty string is passed
 */
export function useCompanySearch(searchTerm: string, enabled = true) {
  return useQuery<CompanySearchResult[], Error>({
    queryKey: notesQueryKeys.search.companies(searchTerm),
    queryFn: () => searchCompanies(searchTerm),
    enabled: hasCRMTokens() && enabled,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Search for contacts
 * Returns all contacts when empty string is passed
 */
export function useContactSearch(searchTerm: string, enabled = true) {
  return useQuery<ContactSearchResult[], Error>({
    queryKey: notesQueryKeys.search.contacts(searchTerm),
    queryFn: () => searchContacts(searchTerm),
    enabled: hasCRMTokens() && enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search for tasks
 * Returns all tasks when empty string is passed
 */
export function useTaskSearch(searchTerm: string, enabled = true) {
  return useQuery<TaskSearchResult[], Error>({
    queryKey: notesQueryKeys.search.tasks(searchTerm),
    queryFn: () => searchTasks(searchTerm),
    enabled: hasCRMTokens() && enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search for jobs
 * Returns all jobs when empty string is passed
 */
export function useJobSearch(searchTerm: string, enabled = true) {
  return useQuery<JobSearchResult[], Error>({
    queryKey: notesQueryKeys.search.jobs(searchTerm),
    queryFn: () => searchJobs(searchTerm),
    enabled: hasCRMTokens() && enabled,
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// Link Hooks
// ============================================================================

/**
 * Create a link between entities
 */
export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation<
    EntityLink,
    Error,
    {
      sourceEntityType: EntityType;
      sourceEntityId: string;
      targetEntityType: EntityType;
      targetEntityId: string;
    }
  >({
    mutationFn: createLink,
    onSuccess: (_, variables) => {
      // Invalidate related entities for the note
      if (variables.sourceEntityType === 'NOTE') {
        queryClient.invalidateQueries({
          queryKey: notesQueryKeys.relatedEntities(variables.sourceEntityId),
        });
      }
    },
  });
}

/**
 * Delete a link between entities
 */
export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { linkId: string; noteId: string }>({
    mutationFn: ({ linkId }) => deleteLink(linkId),
    onSuccess: (_, variables) => {
      // Invalidate related entities for the note
      queryClient.invalidateQueries({
        queryKey: notesQueryKeys.relatedEntities(variables.noteId),
      });
    },
  });
}

/**
 * Delete a link between entities by source and target
 */
export function useDeleteLinkByEntities() {
  const queryClient = useQueryClient();

  return useMutation<
    boolean,
    Error,
    {
      sourceEntityType: EntityType;
      sourceEntityId: string;
      targetEntityType: EntityType;
      targetEntityId: string;
    }
  >({
    mutationFn: deleteLinkByEntities,
    onSuccess: (_, variables) => {
      // Invalidate related entities for the note
      if (variables.sourceEntityType === 'NOTE') {
        queryClient.invalidateQueries({
          queryKey: notesQueryKeys.relatedEntities(variables.sourceEntityId),
        });
      }
    },
  });
}

// Re-export types
export type {
  Note,
  NoteConversation,
  NoteRelatedEntities,
  CompanySearchResult,
  ContactSearchResult,
  TaskSearchResult,
  JobSearchResult,
  EntityLink,
  EntityType,
};
