/**
 * Tasks React Query Hooks
 * Custom hooks for interacting with the Tasks GraphQL API
 * Following the same pattern as Notes API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasCRMTokens } from '../../lib/crm-auth';
import {
  fetchTasks,
  fetchTask,
  createTask,
  updateTask,
  deleteTask,
  addTaskConversation,
  deleteTaskConversation,
  fetchTaskConversations,
  fetchTaskRelatedEntities,
  searchCompanies,
  searchContacts,
  searchJobs,
  searchNotes,
  searchPreOpportunities,
  searchUsers,
  createTaskLink,
  deleteTaskLinkByEntities,
  fetchContactById,
  type Task,
  type TaskLandingPage,
  type TaskConversation,
  type TaskRelatedEntities,
  type CompanySearchResult,
  type ContactSearchResult,
  type JobSearchResult,
  type NoteSearchResult,
  type PreOpportunitySearchResult,
  type UserSearchResult,
  type EntityLink,
  type EntityType,
  type CreateTaskInput,
  type UpdateTaskInput,
} from './tasksApi';

// ============================================================================
// Query Keys
// ============================================================================

export const tasksQueryKeys = {
  all: ['tasks'] as const,
  list: () => [...tasksQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...tasksQueryKeys.all, 'detail', id] as const,
  conversations: (taskId: string) => [...tasksQueryKeys.all, 'conversations', taskId] as const,
  relatedEntities: (taskId: string) => [...tasksQueryKeys.all, 'relatedEntities', taskId] as const,
  contact: (id: string) => ['contact', id] as const,
  contactsMap: (ids: string[]) => ['contacts', 'map', ids.sort().join(',')] as const,
  search: {
    companies: (term: string) => ['search', 'companies', term] as const,
    contacts: (term: string) => ['search', 'contacts', term] as const,
    jobs: (term: string) => ['search', 'jobs', term] as const,
    notes: (term: string) => ['search', 'notes', term] as const,
    preOpportunities: (term: string) => ['search', 'preOpportunities', term] as const,
    users: (term: string) => ['search', 'users', term] as const,
  },
};

// ============================================================================
// Task Hooks
// ============================================================================

/**
 * Fetch all tasks using landing pages endpoint
 */
export function useTasks() {
  return useQuery<TaskLandingPage[], Error>({
    queryKey: tasksQueryKeys.list(),
    queryFn: fetchTasks,
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single task by ID
 */
export function useTask(taskId: string) {
  return useQuery<Task | null, Error>({
    queryKey: tasksQueryKeys.detail(taskId),
    queryFn: () => fetchTask(taskId),
    enabled: hasCRMTokens() && !!taskId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch conversations for a task
 */
export function useTaskConversations(taskId: string) {
  return useQuery<TaskConversation[], Error>({
    queryKey: tasksQueryKeys.conversations(taskId),
    queryFn: () => fetchTaskConversations(taskId),
    enabled: hasCRMTokens() && !!taskId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch related entities for a task
 */
export function useTaskRelatedEntities(taskId: string) {
  return useQuery<TaskRelatedEntities, Error>({
    queryKey: tasksQueryKeys.relatedEntities(taskId),
    queryFn: () => fetchTaskRelatedEntities(taskId),
    enabled: hasCRMTokens() && !!taskId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch contacts by IDs and return a map of ID -> Contact name
 * Used to resolve assignedTo IDs to display names
 */
export function useContactsMap(contactIds: string[]) {
  return useQuery<Map<string, string>, Error>({
    queryKey: tasksQueryKeys.contactsMap(contactIds),
    queryFn: async () => {
      const contactMap = new Map<string, string>();
      
      // Fetch contacts in parallel
      const results = await Promise.allSettled(
        contactIds.map(id => fetchContactById(id))
      );
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const contact = result.value;
          const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
          contactMap.set(contactIds[index], name || 'Unknown');
        }
      });
      
      return contactMap;
    },
    enabled: hasCRMTokens() && contactIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - contact names don't change often
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, CreateTaskInput>({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.list() });
    },
  });
}

/**
 * Update an existing task with optimistic updates for instant UI feedback
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, { id: string; input: UpdateTaskInput }, { previousTasks: TaskLandingPage[] | undefined }>({
    mutationFn: ({ id, input }) => updateTask(id, input),
    // Optimistic update - immediately update UI before API responds
    onMutate: async ({ id, input }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: tasksQueryKeys.list() });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<TaskLandingPage[]>(tasksQueryKeys.list());
      
      // Optimistically update the cache
      if (previousTasks) {
        queryClient.setQueryData<TaskLandingPage[]>(tasksQueryKeys.list(), (old) => {
          if (!old) return old;
          return old.map(task => {
            if (task.id === id) {
              return {
                ...task,
                title: input.title,
                status: input.status,
                priority: input.priority,
                description: input.description ?? task.description,
                dueDate: input.dueDate ?? task.dueDate,
                reminderDate: input.reminderDate ?? task.reminderDate,
                tags: input.tags ?? task.tags,
                // assignedTo might be an ID, so keep it as-is for now
                assignedTo: input.assignedToId ?? task.assignedTo,
              };
            }
            return task;
          });
        });
      }
      
      // Return context with the snapshotted value
      return { previousTasks };
    },
    // If mutation fails, roll back to the previous value
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksQueryKeys.list(), context.previousTasks);
      }
    },
    // Always refetch after error or success to ensure we have the latest data
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKeys.list() });
    },
  });
}

/**
 * Add a conversation/comment to a task
 */
export function useAddTaskConversation() {
  const queryClient = useQueryClient();

  return useMutation<TaskConversation, Error, { taskId: string; content: string }>({
    mutationFn: addTaskConversation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: tasksQueryKeys.conversations(variables.taskId),
      });
    },
  });
}

/**
 * Delete a task conversation/comment
 */
export function useDeleteTaskConversation() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { conversationId: string; taskId: string }>({
    mutationFn: ({ conversationId }) => deleteTaskConversation(conversationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: tasksQueryKeys.conversations(variables.taskId),
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
    queryKey: tasksQueryKeys.search.companies(searchTerm),
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
    queryKey: tasksQueryKeys.search.contacts(searchTerm),
    queryFn: () => searchContacts(searchTerm),
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
    queryKey: tasksQueryKeys.search.jobs(searchTerm),
    queryFn: () => searchJobs(searchTerm),
    enabled: hasCRMTokens() && enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search for notes
 * Returns all notes when empty string is passed
 */
export function useNoteSearch(searchTerm: string, enabled = true) {
  return useQuery<NoteSearchResult[], Error>({
    queryKey: tasksQueryKeys.search.notes(searchTerm),
    queryFn: () => searchNotes(searchTerm),
    enabled: hasCRMTokens() && enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search for pre-opportunities
 * Returns all pre-opportunities when empty string is passed
 */
export function usePreOpportunitySearch(searchTerm: string, enabled = true) {
  return useQuery<PreOpportunitySearchResult[], Error>({
    queryKey: tasksQueryKeys.search.preOpportunities(searchTerm),
    queryFn: () => searchPreOpportunities(searchTerm),
    enabled: hasCRMTokens() && enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search for users (for assignee selection)
 * Returns users matching the search term
 */
export function useUserSearch(searchTerm: string, enabled = true) {
  return useQuery<UserSearchResult[], Error>({
    queryKey: tasksQueryKeys.search.users(searchTerm),
    queryFn: () => searchUsers(searchTerm),
    enabled: hasCRMTokens() && enabled,
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// Link Hooks
// ============================================================================

/**
 * Create a link between task and another entity
 */
export function useCreateTaskLink() {
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
    mutationFn: createTaskLink,
    onSuccess: (_, variables) => {
      // Invalidate related entities for the task
      if (variables.sourceEntityType === 'TASK') {
        queryClient.invalidateQueries({
          queryKey: tasksQueryKeys.relatedEntities(variables.sourceEntityId),
        });
      }
    },
  });
}

/**
 * Delete a link between task and another entity by entities
 */
export function useDeleteTaskLinkByEntities() {
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
    mutationFn: deleteTaskLinkByEntities,
    onSuccess: (_, variables) => {
      // Invalidate related entities for the task
      if (variables.sourceEntityType === 'TASK') {
        queryClient.invalidateQueries({
          queryKey: tasksQueryKeys.relatedEntities(variables.sourceEntityId),
        });
      }
    },
  });
}

// Re-export types
export type {
  Task,
  TaskLandingPage,
  TaskConversation,
  TaskRelatedEntities,
  CompanySearchResult,
  ContactSearchResult,
  JobSearchResult,
  NoteSearchResult,
  PreOpportunitySearchResult,
  UserSearchResult,
  EntityLink,
  EntityType,
  CreateTaskInput,
  UpdateTaskInput,
};
