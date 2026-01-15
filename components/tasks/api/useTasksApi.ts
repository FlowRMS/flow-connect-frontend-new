/**
 * Tasks React Query Hooks
 * Custom hooks for interacting with the Tasks GraphQL API
 * Following the same pattern as Notes API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

import {
  fetchTasks,
  fetchTasksWithPagination,
  fetchTask,
  createTask,
  updateTask,
  deleteTask,
  addTaskConversation,
  deleteTaskConversation,
  fetchTaskConversations,
  searchCompanies,
  searchContacts,
  searchJobs,
  searchNotes,
  searchPreOpportunities,
  searchUsers,
  searchQuotes,
  searchOrders,
  searchInvoices,
  searchChecks,
  searchFactories,
  searchCustomers,
  searchProducts,
  createTaskLink,
  deleteTaskLinkByEntities,
  type Task,
  type TaskLandingPage,
  type TaskConversation,
  type CompanySearchResult,
  type ContactSearchResult,
  type JobSearchResult,
  type NoteSearchResult,
  type PreOpportunitySearchResult,
  type UserSearchResult,
  type QuoteSearchResult,
  type OrderSearchResult,
  type InvoiceSearchResult,
  type CheckSearchResult,
  type FactorySearchResult,
  type CustomerSearchResult,
  type ProductSearchResult,
  type EntityLink,
  type CRMEntityType,
  type CreateTaskInput,
  type UpdateTaskInput,
  type PaginatedTasksResult,
  type TaskLandingPageFilter,
  type TaskLandingPageOrderBy,
} from './tasksApi';

// Import centralized user fetch function
import { fetchUserById } from '../../lib/api/search';

// Import centralized related entities hook and types
import { useRelatedEntities, crmQueryKeys } from '../../hooks/useCRMApi';
import type { RelatedEntities } from '../../lib/crm-graphql';

// Re-export useRelatedEntities for task consumers
export { useRelatedEntities };
export type { RelatedEntities };

// ============================================================================
// Query Keys
// ============================================================================

export const tasksQueryKeys = {
  all: ['tasks'] as const,
  list: (filters?: TaskLandingPageFilter[], orderBy?: TaskLandingPageOrderBy[]) =>
    [...tasksQueryKeys.all, 'list', { filters, orderBy }] as const,
  detail: (id: string) => [...tasksQueryKeys.all, 'detail', id] as const,
  conversations: (taskId: string) => [...tasksQueryKeys.all, 'conversations', taskId] as const,
  // Note: relatedEntities now uses crmQueryKeys.relatedEntities(taskId, 'TASKS')
  contact: (id: string) => ['contact', id] as const,
  contactsMap: (ids: string[]) => ['contacts', 'map', ids.sort().join(',')] as const,
  search: {
    companies: (term: string) => ['search', 'companies', term] as const,
    contacts: (term: string) => ['search', 'contacts', term] as const,
    jobs: (term: string) => ['search', 'jobs', term] as const,
    notes: (term: string) => ['search', 'notes', term] as const,
    preOpportunities: (term: string) => ['search', 'preOpportunities', term] as const,
    users: (term: string) => ['search', 'users', term] as const,
    quotes: (term: string) => ['search', 'quotes', term] as const,
    orders: (term: string) => ['search', 'orders', term] as const,
    invoices: (term: string) => ['search', 'invoices', term] as const,
    checks: (term: string) => ['search', 'checks', term] as const,
    factories: (term: string) => ['search', 'factories', term] as const,
    customers: (term: string) => ['search', 'customers', term] as const,
    products: (term: string) => ['search', 'products', term] as const,
  },
};

// ============================================================================
// Task Hooks
// ============================================================================

const DEFAULT_PAGE_SIZE = 30;

/**
 * Fetch all tasks using landing pages endpoint
 */
export function useTasks() {
  return useQuery<TaskLandingPage[], Error>({
    queryKey: tasksQueryKeys.list(),
    queryFn: fetchTasks,
    enabled: true,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch tasks with infinite scroll pagination and optional server-side filters/sorting
 */
export function useTasksInfinite(
  filters?: TaskLandingPageFilter[],
  orderBy?: TaskLandingPageOrderBy[],
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  return useInfiniteQuery<PaginatedTasksResult, Error>({
    queryKey: [...tasksQueryKeys.list(filters, orderBy), 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchTasksWithPagination(filters, orderBy, { limit: pageSize, offset: pageParam as number });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.records.length, 0);
      if (totalFetched >= lastPage.total) return undefined;
      return totalFetched;
    },
    enabled: true,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single task by ID
 */
export function useTask(taskId: string) {
  return useQuery<Task | null, Error>({
    queryKey: tasksQueryKeys.detail(taskId),
    queryFn: () => fetchTask(taskId),
    enabled: !!taskId,
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
    enabled: !!taskId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch related entities for a task
 * @deprecated Use useRelatedEntities(taskId, 'TASKS') from this module instead
 */
export function useTaskRelatedEntities(taskId: string) {
  return useRelatedEntities(taskId, 'TASKS');
}

/**
 * Fetch users by IDs and return a map of ID -> User name
 * Used to resolve assignedTo IDs (user IDs) to display names
 */
export function useContactsMap(userIds: string[]) {
  return useQuery<Map<string, string>, Error>({
    queryKey: tasksQueryKeys.contactsMap(userIds),
    queryFn: async () => {
      const userMap = new Map<string, string>();
      
      // Fetch users in parallel
      const results = await Promise.allSettled(
        userIds.map(id => fetchUserById(id))
      );
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const user = result.value;
          const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
          userMap.set(userIds[index], name || 'Unknown');
        }
      });
      
      return userMap;
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - user names don't change often
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

  return useMutation<Task, Error, { id: string; input: UpdateTaskInput }, { previousData: unknown }>({
    mutationFn: ({ id, input }) => updateTask(id, input),
    // Optimistic update - immediately update UI before API responds
    onMutate: async ({ id, input }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: tasksQueryKeys.all });

      // Get all matching query caches (both regular and infinite)
      const queryCache = queryClient.getQueryCache();
      const matchingQueries = queryCache.findAll({
        queryKey: tasksQueryKeys.all,
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'tasks' && key.includes('list');
        },
      });

      // Snapshot all matching caches
      const previousData: Record<string, unknown> = {};
      matchingQueries.forEach((query) => {
        previousData[JSON.stringify(query.queryKey)] = query.state.data;
      });

      // Helper function to update a single task
      const updateTaskInList = (task: TaskLandingPage): TaskLandingPage => {
        if (task.id === id) {
          // Handle tags - could be string, array, or undefined
          let newTags = task.tags;
          if (input.tags !== undefined) {
            if (typeof input.tags === 'string') {
              newTags = input.tags.split(',').map(t => t.trim()).filter(Boolean);
            } else if (Array.isArray(input.tags)) {
              newTags = input.tags;
            }
          }
          return {
            ...task,
            title: input.title ?? task.title,
            status: input.status ?? task.status,
            priority: input.priority ?? task.priority,
            description: input.description ?? task.description,
            dueDate: input.dueDate ?? task.dueDate,
            reminderDate: input.reminderDate ?? task.reminderDate,
            tags: newTags,
            assignees: input.assigneeIds ?? task.assignees,
          };
        }
        return task;
      };

      // Optimistically update all matching caches
      matchingQueries.forEach((query) => {
        const data = query.state.data;

        // Handle infinite query structure (has pages array)
        if (data && typeof data === 'object' && 'pages' in data) {
          const infiniteData = data as { pages: Array<{ records: TaskLandingPage[]; total: number }>; pageParams: unknown[] };
          queryClient.setQueryData(query.queryKey, {
            ...infiniteData,
            pages: infiniteData.pages.map(page => ({
              ...page,
              records: page.records.map(updateTaskInList),
            })),
          });
        }
        // Handle regular array structure
        else if (Array.isArray(data)) {
          queryClient.setQueryData(
            query.queryKey,
            (data as TaskLandingPage[]).map(updateTaskInList)
          );
        }
      });

      // Return context with the snapshotted value
      return { previousData };
    },
    // If mutation fails, roll back to the previous value
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        const previousData = context.previousData as Record<string, unknown>;
        Object.entries(previousData).forEach(([keyStr, data]) => {
          const queryKey = JSON.parse(keyStr);
          queryClient.setQueryData(queryKey, data);
        });
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
    enabled: enabled,
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
    enabled: enabled,
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
    enabled: enabled,
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
    enabled: enabled,
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
    enabled: enabled,
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
    queryFn: () => searchUsers({ searchTerm }),
    enabled: enabled,
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData, // Keep previous data while loading new results
  });
}

/**
 * Search for quotes
 */
export function useQuoteSearch(searchTerm: string, enabled = true) {
  return useQuery<QuoteSearchResult[], Error>({
    queryKey: tasksQueryKeys.search.quotes(searchTerm),
    queryFn: () => searchQuotes(searchTerm),
    enabled: enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search for orders
 */
export function useOrderSearch(searchTerm: string, enabled = true) {
  return useQuery<OrderSearchResult[], Error>({
    queryKey: tasksQueryKeys.search.orders(searchTerm),
    queryFn: () => searchOrders(searchTerm),
    enabled: enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search for invoices
 */
export function useInvoiceSearch(searchTerm: string, enabled = true) {
  return useQuery<InvoiceSearchResult[], Error>({
    queryKey: tasksQueryKeys.search.invoices(searchTerm),
    queryFn: () => searchInvoices(searchTerm),
    enabled: enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search for checks
 */
export function useCheckSearch(searchTerm: string, enabled = true) {
  return useQuery<CheckSearchResult[], Error>({
    queryKey: tasksQueryKeys.search.checks(searchTerm),
    queryFn: () => searchChecks(searchTerm),
    enabled: enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search for factories
 */
export function useFactorySearch(searchTerm: string, enabled = true) {
  return useQuery<FactorySearchResult[], Error>({
    queryKey: tasksQueryKeys.search.factories(searchTerm),
    queryFn: () => searchFactories(searchTerm),
    enabled: enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search for customers
 */
export function useCustomerSearch(searchTerm: string, enabled = true) {
  return useQuery<CustomerSearchResult[], Error>({
    queryKey: tasksQueryKeys.search.customers(searchTerm),
    queryFn: () => searchCustomers(searchTerm),
    enabled: enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search for products
 */
export function useProductSearch(searchTerm: string, enabled = true) {
  return useQuery<ProductSearchResult[], Error>({
    queryKey: tasksQueryKeys.search.products(searchTerm),
    queryFn: () => searchProducts(searchTerm),
    enabled: enabled,
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
      sourceEntityType: CRMEntityType;
      sourceEntityId: string;
      targetEntityType: CRMEntityType;
      targetEntityId: string;
    }
  >({
    mutationFn: createTaskLink,
    onSuccess: (_, variables) => {
      // Invalidate related entities for the task using centralized query key
      if (variables.sourceEntityType === 'TASK') {
        queryClient.invalidateQueries({
          queryKey: crmQueryKeys.relatedEntities(variables.sourceEntityId, 'TASKS'),
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
      sourceEntityType: CRMEntityType;
      sourceEntityId: string;
      targetEntityType: CRMEntityType;
      targetEntityId: string;
    }
  >({
    mutationFn: deleteTaskLinkByEntities,
    onSuccess: (_, variables) => {
      // Invalidate related entities for the task using centralized query key
      if (variables.sourceEntityType === 'TASK') {
        queryClient.invalidateQueries({
          queryKey: crmQueryKeys.relatedEntities(variables.sourceEntityId, 'TASKS'),
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
  CompanySearchResult,
  ContactSearchResult,
  JobSearchResult,
  NoteSearchResult,
  PreOpportunitySearchResult,
  UserSearchResult,
  EntityLink,
  CRMEntityType,
  CreateTaskInput,
  UpdateTaskInput,
  TaskLandingPageFilter,
  TaskLandingPageOrderBy,
};

// Note: TaskRelatedEntities has been replaced with RelatedEntities from lib/crm-graphql
