/**
 * FlowCRM React Query Hooks
 * Custom hooks for interacting with the CRM GraphQL API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasCRMTokens } from '../lib/crm-auth';
import {
  // Types
  type Job,
  type JobStatus,
  type JobInput,
  type UpdateJobInput,
  type JobLandingPage,
  type Company,
  type CompanyInput,
  type UpdateCompanyInput,
  type CompanyLandingPage,
  type Contact,
  type ContactInput,
  type UpdateContactInput,
  type ContactLandingPage,
  type PreOpportunity,
  type PreOpportunityLandingPage,
  type CreatePreOpportunityInput,
  type UpdatePreOpportunityInput,
  type ProductSearchResult,
  type FactorySearchResult,
  type CustomerSearchResult,
  type JobSearchResult,
  type LandingPageFilter,
  type LandingPageOrderBy,
  type EntityLink,
  type CreateLinkInput,
  type DeleteLinkByEntitiesInput,
  type JobRelatedEntities,
  type Note,
  type NoteConversation,
  type NoteLandingPage,
  type CreateNoteInput,
  type UpdateNoteInput,
  type AddNoteConversationInput,
  type UpdateNoteConversationInput,
  // Task types
  type CRMTask,
  type TaskLandingPage,
  type TaskConversation,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskRelation,
  type AddTaskRelationInput,
  type AddTaskConversationInput,
  type TaskByEntity,
  type TaskEntityType,
  // Job functions
  fetchJobStatuses,
  fetchJob,
  createJob,
  updateJob,
  deleteJob,
  fetchJobsByIds,
  getStoredJobIds,
  fetchJobLandingPages,
  fetchJobsByCompanyId,
  fetchJobsByContactId,
  // Company functions
  fetchCompanies,
  fetchCompany,
  fetchCompaniesByJobId,
  createCompany,
  updateCompany,
  deleteCompany,
  fetchCompanyLandingPages,
  // Contact functions
  fetchContacts,
  fetchContact,
  fetchContactsByCompanyId,
  createContact,
  updateContact,
  deleteContact,
  fetchContactLandingPages,
  // PreOpportunity functions
  fetchPreOpportunityLandingPages,
  fetchPreOpportunity,
  fetchPreOpportunitiesByJob,
  fetchPreOpportunitiesByCustomer,
  searchProducts,
  searchFactories,
  searchCustomers,
  searchJobs,
  createPreOpportunity,
  updatePreOpportunity,
  deletePreOpportunity,
  // Entity Link functions
  createLink,
  deleteLink,
  deleteLinkByEntities,
  fetchJobRelatedEntities,
  fetchLinksBySource,
  fetchNotesByEntity,
  type NoteLink,
  type CRMEntityType,
  // Note functions
  fetchNotes,
  fetchNoteLandingPages,
  fetchNote,
  fetchNoteConversations,
  createNote,
  updateNote,
  deleteNote,
  addNoteConversation,
  updateNoteConversation,
  deleteNoteConversations,
  // Task functions
  fetchTaskLandingPages,
  fetchTask,
  fetchTaskConversations,
  createTask,
  updateTask as updateTaskApi,
  deleteTask,
  addTaskConversation,
  updateTaskConversation,
  addTaskRelation,
  fetchTaskRelations,
  deleteTaskRelation,
  fetchTasksByEntity,
  // Search functions for linking
  searchTasks,
  searchNotes,
  searchQuotes,
  searchOrders,
  searchInvoices,
  searchChecks,
  // Search result types
  type TaskSearchResult,
  type NoteSearchResult,
  type QuoteSearchResult,
  type OrderSearchResult,
  type InvoiceSearchResult,
  type CheckSearchResult,
} from '../lib/crm-graphql';

// ============================================================================
// Query Keys
// ============================================================================

export const crmQueryKeys = {
  all: ['crm'] as const,
  
  // Jobs
  jobStatuses: () => [...crmQueryKeys.all, 'jobStatuses'] as const,
  jobs: () => [...crmQueryKeys.all, 'jobs'] as const,
  job: (id: string) => [...crmQueryKeys.jobs(), id] as const,
  jobLandingPages: (filters?: LandingPageFilter[], orderBy?: LandingPageOrderBy[]) => 
    [...crmQueryKeys.all, 'jobLandingPages', { filters, orderBy }] as const,
  jobsByCompany: (companyId: string) => [...crmQueryKeys.jobs(), 'byCompany', companyId] as const,
  jobsByContact: (contactId: string) => [...crmQueryKeys.jobs(), 'byContact', contactId] as const,
  
  // Companies
  companies: () => [...crmQueryKeys.all, 'companies'] as const,
  company: (id: string) => [...crmQueryKeys.companies(), id] as const,
  companiesByJob: (jobId: string) => [...crmQueryKeys.companies(), 'byJob', jobId] as const,
  companyLandingPages: (filters?: LandingPageFilter[], orderBy?: LandingPageOrderBy[]) => 
    [...crmQueryKeys.all, 'companyLandingPages', { filters, orderBy }] as const,
  
  // Contacts
  contacts: () => [...crmQueryKeys.all, 'contacts'] as const,
  contact: (id: string) => [...crmQueryKeys.contacts(), id] as const,
  contactsByCompany: (companyId: string) => [...crmQueryKeys.contacts(), 'byCompany', companyId] as const,
  contactLandingPages: (filters?: LandingPageFilter[], orderBy?: LandingPageOrderBy[]) => 
    [...crmQueryKeys.all, 'contactLandingPages', { filters, orderBy }] as const,
  
  // PreOpportunities
  preOpportunities: () => [...crmQueryKeys.all, 'preOpportunities'] as const,
  preOpportunity: (id: string) => [...crmQueryKeys.preOpportunities(), id] as const,
  preOpportunitiesByJob: (jobId: string) => [...crmQueryKeys.preOpportunities(), 'byJob', jobId] as const,
  preOpportunitiesByCustomer: (customerId: string) => [...crmQueryKeys.preOpportunities(), 'byCustomer', customerId] as const,
  preOpportunityLandingPages: (filters?: LandingPageFilter[], orderBy?: LandingPageOrderBy[]) => 
    [...crmQueryKeys.all, 'preOpportunityLandingPages', { filters, orderBy }] as const,
  
  // Search
  productSearch: (searchTerm: string, factoryId?: string) => 
    [...crmQueryKeys.all, 'productSearch', { searchTerm, factoryId }] as const,
  factorySearch: (searchTerm: string, published?: boolean) => 
    [...crmQueryKeys.all, 'factorySearch', { searchTerm, published }] as const,
  customerSearch: (searchTerm: string, published?: boolean) => 
    [...crmQueryKeys.all, 'customerSearch', { searchTerm, published }] as const,
  jobSearch: (searchTerm: string) => 
    [...crmQueryKeys.all, 'jobSearch', { searchTerm }] as const,
  taskSearch: (searchTerm: string) => 
    [...crmQueryKeys.all, 'taskSearch', { searchTerm }] as const,
  noteSearch: (searchTerm: string) => 
    [...crmQueryKeys.all, 'noteSearch', { searchTerm }] as const,
  quoteSearch: (searchTerm: string) => 
    [...crmQueryKeys.all, 'quoteSearch', { searchTerm }] as const,
  orderSearch: (searchTerm: string) => 
    [...crmQueryKeys.all, 'orderSearch', { searchTerm }] as const,
  invoiceSearch: (searchTerm: string) => 
    [...crmQueryKeys.all, 'invoiceSearch', { searchTerm }] as const,
  checkSearch: (searchTerm: string) => 
    [...crmQueryKeys.all, 'checkSearch', { searchTerm }] as const,
  
  // Entity Links
  jobRelatedEntities: (jobId: string) => 
    [...crmQueryKeys.all, 'jobRelatedEntities', jobId] as const,
  
  // Notes
  notes: () => [...crmQueryKeys.all, 'notes'] as const,
  noteLandingPages: (filters?: LandingPageFilter[], orderBy?: LandingPageOrderBy[]) => 
    [...crmQueryKeys.all, 'noteLandingPages', { filters, orderBy }] as const,
  note: (id: string) => [...crmQueryKeys.notes(), id] as const,
  noteConversations: (noteId: string) => [...crmQueryKeys.notes(), 'conversations', noteId] as const,
  noteLinks: (noteId: string) => [...crmQueryKeys.notes(), 'links', noteId] as const,
  notesByEntity: (entityId: string, entityType: string) => 
    [...crmQueryKeys.notes(), 'byEntity', entityId, entityType] as const,
  
  // Tasks
  tasks: () => [...crmQueryKeys.all, 'tasks'] as const,
  taskLandingPages: () => [...crmQueryKeys.all, 'taskLandingPages'] as const,
  task: (id: string) => [...crmQueryKeys.tasks(), id] as const,
  taskConversations: (taskId: string) => [...crmQueryKeys.tasks(), 'conversations', taskId] as const,
  taskRelations: (taskId: string) => [...crmQueryKeys.tasks(), 'relations', taskId] as const,
  tasksByEntity: (entityId: string, entityType: string) => 
    [...crmQueryKeys.tasks(), 'byEntity', entityId, entityType] as const,
};

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Check if CRM is connected (has tokens configured)
 */
export function useCRMConnectionStatus() {
  return {
    isConnected: hasCRMTokens(),
  };
}

// ============================================================================
// Job Hooks
// ============================================================================

/**
 * Fetch job statuses for dropdowns
 */
export function useCRMJobStatuses() {
  return useQuery<JobStatus[], Error>({
    queryKey: crmQueryKeys.jobStatuses(),
    queryFn: fetchJobStatuses,
    enabled: hasCRMTokens(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch jobs that we've created (tracked locally)
 */
export function useCRMJobs() {
  return useQuery<Job[], Error>({
    queryKey: crmQueryKeys.jobs(),
    queryFn: () => {
      const ids = getStoredJobIds();
      return fetchJobsByIds(ids);
    },
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch single job by ID
 */
export function useCRMJob(id: string) {
  return useQuery<Job | null, Error>({
    queryKey: crmQueryKeys.job(id),
    queryFn: () => fetchJob(id),
    enabled: hasCRMTokens() && !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Create new job mutation
 */
export function useCreateCRMJob() {
  const queryClient = useQueryClient();

  return useMutation<Job, Error, JobInput>({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.jobs() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.jobLandingPages() });
    },
  });
}

/**
 * Update existing job mutation with optimistic updates support
 */
export function useUpdateCRMJob() {
  const queryClient = useQueryClient();

  return useMutation<
    Job,
    Error,
    { id: string; input: UpdateJobInput; optimisticStatusName?: string },
    { previousJobs: JobLandingPage[] | undefined }
  >({
    mutationFn: ({ id, input }) => updateJob(id, input),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: crmQueryKeys.jobLandingPages() });

      // Snapshot the previous value
      const previousJobs = queryClient.getQueryData<JobLandingPage[]>(crmQueryKeys.jobLandingPages());

      // Optimistically update the cache
      if (previousJobs && variables.optimisticStatusName) {
        queryClient.setQueryData<JobLandingPage[]>(
          crmQueryKeys.jobLandingPages(),
          previousJobs.map(job =>
            job.id === variables.id
              ? { ...job, statusName: variables.optimisticStatusName }
              : job
          )
        );
      }

      // Return context object with the snapshotted value
      return { previousJobs };
    },
    onError: (_err, _variables, context) => {
      // Roll back to the previous value on error
      if (context?.previousJobs) {
        queryClient.setQueryData(crmQueryKeys.jobLandingPages(), context.previousJobs);
      }
    },
    onSettled: (data) => {
      // Invalidate to refetch with actual server data
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.jobs() });
      if (data) {
        queryClient.invalidateQueries({ queryKey: crmQueryKeys.job(data.id) });
      }
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.jobLandingPages() });
    },
  });
}

/**
 * Delete job mutation
 */
export function useDeleteCRMJob() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.jobs() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.jobLandingPages() });
    },
  });
}

/**
 * Fetch job landing pages with filtering/sorting
 */
export function useCRMJobLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[]
) {
  return useQuery<JobLandingPage[], Error>({
    queryKey: crmQueryKeys.jobLandingPages(filters, orderBy),
    queryFn: () => fetchJobLandingPages(filters, orderBy),
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Company Hooks
// ============================================================================

/**
 * Fetch all companies
 */
export function useCRMCompanies() {
  return useQuery<Company[], Error>({
    queryKey: crmQueryKeys.companies(),
    queryFn: fetchCompanies,
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch single company
 */
export function useCRMCompany(id: string) {
  return useQuery<Company | null, Error>({
    queryKey: crmQueryKeys.company(id),
    queryFn: () => fetchCompany(id),
    enabled: hasCRMTokens() && !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch companies by job
 */
export function useCRMCompaniesByJob(jobId: string) {
  return useQuery<Company[], Error>({
    queryKey: crmQueryKeys.companiesByJob(jobId),
    queryFn: () => fetchCompaniesByJobId(jobId),
    enabled: hasCRMTokens() && !!jobId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch jobs by company
 */
export function useCRMJobsByCompany(companyId: string) {
  return useQuery<Job[], Error>({
    queryKey: crmQueryKeys.jobsByCompany(companyId),
    queryFn: () => fetchJobsByCompanyId(companyId),
    enabled: hasCRMTokens() && !!companyId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch jobs by contact
 */
export function useCRMJobsByContact(contactId: string) {
  return useQuery<Job[], Error>({
    queryKey: crmQueryKeys.jobsByContact(contactId),
    queryFn: () => fetchJobsByContactId(contactId),
    enabled: hasCRMTokens() && !!contactId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create company mutation
 */
export function useCreateCRMCompany() {
  const queryClient = useQueryClient();

  return useMutation<Company, Error, CompanyInput>({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.companies() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.companyLandingPages() });
    },
  });
}

/**
 * Update company mutation
 */
export function useUpdateCRMCompany() {
  const queryClient = useQueryClient();

  return useMutation<Company, Error, { id: string; input: UpdateCompanyInput }>({
    mutationFn: ({ id, input }) => updateCompany(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.companies() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.company(data.id) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.companyLandingPages() });
    },
  });
}

/**
 * Delete company mutation
 */
export function useDeleteCRMCompany() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.companies() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.companyLandingPages() });
    },
  });
}

/**
 * Fetch company landing pages
 */
export function useCRMCompanyLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[]
) {
  return useQuery<CompanyLandingPage[], Error>({
    queryKey: crmQueryKeys.companyLandingPages(filters, orderBy),
    queryFn: () => fetchCompanyLandingPages(filters, orderBy),
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Contact Hooks
// ============================================================================

/**
 * Fetch all contacts
 */
export function useCRMContacts() {
  return useQuery<Contact[], Error>({
    queryKey: crmQueryKeys.contacts(),
    queryFn: fetchContacts,
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch single contact
 */
export function useCRMContact(id: string) {
  return useQuery<Contact | null, Error>({
    queryKey: crmQueryKeys.contact(id),
    queryFn: () => fetchContact(id),
    enabled: hasCRMTokens() && !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch contacts by company
 */
export function useCRMContactsByCompany(companyId: string) {
  return useQuery<Contact[], Error>({
    queryKey: crmQueryKeys.contactsByCompany(companyId),
    queryFn: () => fetchContactsByCompanyId(companyId),
    enabled: hasCRMTokens() && !!companyId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create contact mutation
 */
export function useCreateCRMContact() {
  const queryClient = useQueryClient();

  return useMutation<Contact, Error, ContactInput>({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contactLandingPages() });
    },
  });
}

/**
 * Update contact mutation
 */
export function useUpdateCRMContact() {
  const queryClient = useQueryClient();

  return useMutation<Contact, Error, { id: string; input: UpdateContactInput }>({
    mutationFn: ({ id, input }) => updateContact(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contact(data.id) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contactLandingPages() });
    },
  });
}

/**
 * Delete contact mutation
 */
export function useDeleteCRMContact() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contacts() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contactLandingPages() });
    },
  });
}

/**
 * Fetch contact landing pages
 */
export function useCRMContactLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[]
) {
  return useQuery<ContactLandingPage[], Error>({
    queryKey: crmQueryKeys.contactLandingPages(filters, orderBy),
    queryFn: () => fetchContactLandingPages(filters, orderBy),
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// PreOpportunity Hooks
// ============================================================================

/**
 * Fetch pre-opportunity landing pages with filtering/sorting
 */
export function useCRMPreOpportunityLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[]
) {
  return useQuery<PreOpportunityLandingPage[], Error>({
    queryKey: crmQueryKeys.preOpportunityLandingPages(filters, orderBy),
    queryFn: () => fetchPreOpportunityLandingPages(filters, orderBy),
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch single pre-opportunity
 */
export function useCRMPreOpportunity(id: string) {
  return useQuery<PreOpportunity | null, Error>({
    queryKey: crmQueryKeys.preOpportunity(id),
    queryFn: () => fetchPreOpportunity(id),
    enabled: hasCRMTokens() && !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch pre-opportunities by job
 */
export function useCRMPreOpportunitiesByJob(jobId: string) {
  return useQuery<PreOpportunity[], Error>({
    queryKey: crmQueryKeys.preOpportunitiesByJob(jobId),
    queryFn: () => fetchPreOpportunitiesByJob(jobId),
    enabled: hasCRMTokens() && !!jobId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch pre-opportunities by customer
 */
export function useCRMPreOpportunitiesByCustomer(customerId: string) {
  return useQuery<PreOpportunity[], Error>({
    queryKey: crmQueryKeys.preOpportunitiesByCustomer(customerId),
    queryFn: () => fetchPreOpportunitiesByCustomer(customerId),
    enabled: hasCRMTokens() && !!customerId,
    staleTime: 30 * 1000,
  });
}

/**
 * Search for products
 * When allowEmpty is true, empty string search will fetch all products
 */
export function useCRMProductSearch(searchTerm: string, factoryId?: string, allowEmpty = false) {
  return useQuery<ProductSearchResult[], Error>({
    queryKey: crmQueryKeys.productSearch(searchTerm, factoryId),
    queryFn: () => searchProducts(searchTerm, factoryId),
    enabled: hasCRMTokens() && (allowEmpty || searchTerm.length > 0),
    staleTime: 60 * 1000,
  });
}

/**
 * Search for factories
 * When allowEmpty is true, empty string search will fetch all factories
 */
export function useCRMFactorySearch(searchTerm: string, published?: boolean, allowEmpty = false) {
  return useQuery<FactorySearchResult[], Error>({
    queryKey: crmQueryKeys.factorySearch(searchTerm, published),
    queryFn: () => searchFactories(searchTerm, published),
    enabled: hasCRMTokens() && (allowEmpty || searchTerm.length > 0),
    staleTime: 60 * 1000,
  });
}

/**
 * Search for customers
 * When allowEmpty is true, empty string search will fetch all customers
 */
export function useCRMCustomerSearch(searchTerm: string, published?: boolean, allowEmpty = false) {
  return useQuery<CustomerSearchResult[], Error>({
    queryKey: crmQueryKeys.customerSearch(searchTerm, published),
    queryFn: () => searchCustomers(searchTerm, published),
    enabled: hasCRMTokens() && (allowEmpty || searchTerm.length > 0),
    staleTime: 60 * 1000,
  });
}

/**
 * Search for jobs
 * When allowEmpty is true, empty string search will fetch all jobs
 */
export function useCRMJobSearch(searchTerm: string, allowEmpty = false) {
  return useQuery<JobSearchResult[], Error>({
    queryKey: crmQueryKeys.jobSearch(searchTerm),
    queryFn: () => searchJobs(searchTerm),
    enabled: hasCRMTokens() && (allowEmpty || searchTerm.length > 0),
    staleTime: 60 * 1000,
  });
}

/**
 * Create pre-opportunity mutation
 */
export function useCreateCRMPreOpportunity() {
  const queryClient = useQueryClient();

  return useMutation<PreOpportunity, Error, CreatePreOpportunityInput>({
    mutationFn: createPreOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.preOpportunities() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.preOpportunityLandingPages() });
    },
  });
}

/**
 * Update pre-opportunity mutation with optimistic updates support
 */
export function useUpdateCRMPreOpportunity() {
  const queryClient = useQueryClient();

  return useMutation<
    PreOpportunity,
    Error,
    UpdatePreOpportunityInput & { optimisticStatus?: string },
    { previousPreOpps: PreOpportunityLandingPage[] | undefined }
  >({
    mutationFn: (input) => {
      // Remove optimisticStatus from the API call since it's only for optimistic updates
      const { optimisticStatus: _, ...apiInput } = input;
      return updatePreOpportunity(apiInput);
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: crmQueryKeys.preOpportunityLandingPages() });

      // Snapshot the previous value
      const previousPreOpps = queryClient.getQueryData<PreOpportunityLandingPage[]>(
        crmQueryKeys.preOpportunityLandingPages()
      );

      // Optimistically update the cache
      if (previousPreOpps && variables.optimisticStatus) {
        queryClient.setQueryData<PreOpportunityLandingPage[]>(
          crmQueryKeys.preOpportunityLandingPages(),
          previousPreOpps.map(preOpp =>
            preOpp.id === variables.id
              ? { ...preOpp, status: variables.optimisticStatus as PreOpportunityLandingPage['status'] }
              : preOpp
          )
        );
      }

      // Return context object with the snapshotted value
      return { previousPreOpps };
    },
    onError: (_err, _variables, context) => {
      // Roll back to the previous value on error
      if (context?.previousPreOpps) {
        queryClient.setQueryData(crmQueryKeys.preOpportunityLandingPages(), context.previousPreOpps);
      }
    },
    onSettled: (data) => {
      // Invalidate to refetch with actual server data
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.preOpportunities() });
      if (data) {
        queryClient.invalidateQueries({ queryKey: crmQueryKeys.preOpportunity(data.id) });
      }
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.preOpportunityLandingPages() });
    },
  });
}

/**
 * Delete pre-opportunity mutation
 */
export function useDeleteCRMPreOpportunity() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deletePreOpportunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.preOpportunities() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.preOpportunityLandingPages() });
    },
  });
}

// ============================================================================
// Entity Link Hooks
// ============================================================================

/**
 * Fetch job related entities (companies, contacts, pre-opportunities)
 */
export function useCRMJobRelatedEntities(jobId: string) {
  return useQuery<JobRelatedEntities, Error>({
    queryKey: crmQueryKeys.jobRelatedEntities(jobId),
    queryFn: () => fetchJobRelatedEntities(jobId),
    enabled: hasCRMTokens() && !!jobId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create entity link mutation
 */
export function useCreateCRMLink() {
  const queryClient = useQueryClient();

  return useMutation<EntityLink, Error, CreateLinkInput>({
    mutationFn: createLink,
    onSuccess: (_, variables) => {
      // Invalidate related entities queries based on entity types
      if (variables.sourceEntityType === 'JOB') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobRelatedEntities(variables.sourceEntityId) 
        });
      }
      if (variables.targetEntityType === 'JOB') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobRelatedEntities(variables.targetEntityId) 
        });
      }
      // Invalidate company-related queries
      if (variables.sourceEntityType === 'COMPANY') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.contactsByCompany(variables.sourceEntityId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobsByCompany(variables.sourceEntityId) 
        });
      }
      if (variables.targetEntityType === 'COMPANY') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.contactsByCompany(variables.targetEntityId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobsByCompany(variables.targetEntityId) 
        });
      }
      // Invalidate contact-related queries
      if (variables.sourceEntityType === 'CONTACT') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobsByContact(variables.sourceEntityId) 
        });
      }
      if (variables.targetEntityType === 'CONTACT') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobsByContact(variables.targetEntityId) 
        });
      }
    },
  });
}

/**
 * Delete entity link mutation by ID
 */
export function useDeleteCRMLink() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: string; jobId?: string }>({
    mutationFn: ({ id }) => deleteLink(id),
    onSuccess: (_, variables) => {
      // Invalidate job related entities if jobId provided
      if (variables.jobId) {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobRelatedEntities(variables.jobId) 
        });
      }
    },
  });
}

/**
 * Delete entity link mutation by entities
 */
export function useDeleteCRMLinkByEntities() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, DeleteLinkByEntitiesInput>({
    mutationFn: deleteLinkByEntities,
    onSuccess: (_, variables) => {
      // Invalidate related entities queries based on entity types
      if (variables.sourceEntityType === 'JOB') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobRelatedEntities(variables.sourceEntityId) 
        });
      }
      if (variables.targetEntityType === 'JOB') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobRelatedEntities(variables.targetEntityId) 
        });
      }
      // Invalidate company-related queries
      if (variables.sourceEntityType === 'COMPANY') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.contactsByCompany(variables.sourceEntityId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobsByCompany(variables.sourceEntityId) 
        });
      }
      if (variables.targetEntityType === 'COMPANY') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.contactsByCompany(variables.targetEntityId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobsByCompany(variables.targetEntityId) 
        });
      }
      // Invalidate contact-related queries
      if (variables.sourceEntityType === 'CONTACT') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobsByContact(variables.sourceEntityId) 
        });
      }
      if (variables.targetEntityType === 'CONTACT') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.jobsByContact(variables.targetEntityId) 
        });
      }
    },
  });
}

// ============================================================================
// Note Hooks
// ============================================================================

/**
 * Fetch all notes
 */
export function useCRMNotes() {
  return useQuery<Note[], Error>({
    queryKey: crmQueryKeys.notes(),
    queryFn: fetchNotes,
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch note landing pages with filtering/sorting
 */
export function useCRMNoteLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[]
) {
  return useQuery<NoteLandingPage[], Error>({
    queryKey: crmQueryKeys.noteLandingPages(filters, orderBy),
    queryFn: () => fetchNoteLandingPages(filters, orderBy),
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch single note by ID
 */
export function useCRMNote(id: string) {
  return useQuery<Note | null, Error>({
    queryKey: crmQueryKeys.note(id),
    queryFn: () => fetchNote(id),
    enabled: hasCRMTokens() && !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch conversations for a note
 */
export function useCRMNoteConversations(noteId: string) {
  return useQuery<NoteConversation[], Error>({
    queryKey: crmQueryKeys.noteConversations(noteId),
    queryFn: () => fetchNoteConversations(noteId),
    enabled: hasCRMTokens() && !!noteId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create new note mutation
 */
export function useCreateCRMNote() {
  const queryClient = useQueryClient();

  return useMutation<Note, Error, CreateNoteInput>({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.notes() });
    },
  });
}

/**
 * Update existing note mutation
 */
export function useUpdateCRMNote() {
  const queryClient = useQueryClient();

  return useMutation<Note, Error, { id: string; input: UpdateNoteInput }>({
    mutationFn: ({ id, input }) => updateNote(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.notes() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.note(data.id) });
    },
  });
}

/**
 * Delete note mutation
 */
export function useDeleteCRMNote() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.notes() });
    },
  });
}

/**
 * Add conversation to a note
 */
export function useAddCRMNoteConversation() {
  const queryClient = useQueryClient();

  return useMutation<NoteConversation, Error, AddNoteConversationInput>({
    mutationFn: addNoteConversation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.notes() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.note(variables.noteId) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.noteConversations(variables.noteId) });
    },
  });
}

/**
 * Update conversation in a note
 */
export function useUpdateCRMNoteConversation() {
  const queryClient = useQueryClient();

  return useMutation<NoteConversation, Error, UpdateNoteConversationInput>({
    mutationFn: updateNoteConversation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.notes() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.note(variables.noteId) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.noteConversations(variables.noteId) });
    },
  });
}

/**
 * Delete all conversations from a note
 */
export function useDeleteCRMNoteConversations() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteNoteConversations,
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.notes() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.note(noteId) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.noteConversations(noteId) });
    },
  });
}

/**
 * Fetch links for a note
 */
export function useCRMNoteLinks(noteId: string) {
  return useQuery<NoteLink[], Error>({
    queryKey: crmQueryKeys.noteLinks(noteId),
    queryFn: () => fetchLinksBySource('NOTE', noteId),
    enabled: hasCRMTokens() && !!noteId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch notes linked to an entity
 */
export function useCRMNotesByEntity(entityId: string, entityType: CRMEntityType) {
  return useQuery<Note[], Error>({
    queryKey: crmQueryKeys.notesByEntity(entityId, entityType),
    queryFn: () => fetchNotesByEntity(entityId, entityType),
    enabled: hasCRMTokens() && !!entityId && !!entityType,
    staleTime: 30 * 1000,
  });
}

/**
 * Create note link mutation
 */
export function useCreateCRMNoteLink() {
  const queryClient = useQueryClient();

  return useMutation<EntityLink, Error, CreateLinkInput>({
    mutationFn: createLink,
    onSuccess: (_, variables) => {
      // Invalidate note links when a new link is created
      if (variables.sourceEntityType === 'NOTE') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.noteLinks(variables.sourceEntityId) 
        });
      }
      // Also invalidate notes by entity if needed
      if (variables.targetEntityType !== 'NOTE') {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.notesByEntity(variables.targetEntityId, variables.targetEntityType as CRMEntityType) 
        });
      }
    },
  });
}

// ============================================================================
// Task Hooks
// ============================================================================

/**
 * Fetch all tasks using landing pages endpoint
 */
export function useCRMTasks() {
  return useQuery<TaskLandingPage[], Error>({
    queryKey: crmQueryKeys.taskLandingPages(),
    queryFn: fetchTaskLandingPages,
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch single task by ID
 */
export function useCRMTask(id: string) {
  return useQuery<CRMTask | null, Error>({
    queryKey: crmQueryKeys.task(id),
    queryFn: () => fetchTask(id),
    enabled: hasCRMTokens() && !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch task conversations
 */
export function useCRMTaskConversations(taskId: string) {
  return useQuery<TaskConversation[], Error>({
    queryKey: crmQueryKeys.taskConversations(taskId),
    queryFn: () => fetchTaskConversations(taskId),
    enabled: hasCRMTokens() && !!taskId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch task relations
 */
export function useCRMTaskRelations(taskId: string) {
  return useQuery<TaskRelation[], Error>({
    queryKey: crmQueryKeys.taskRelations(taskId),
    queryFn: () => fetchTaskRelations(taskId),
    enabled: hasCRMTokens() && !!taskId,
    staleTime: 30 * 1000,
  });
}

/**
 * Create new task mutation
 */
export function useCreateCRMTask() {
  const queryClient = useQueryClient();

  return useMutation<CRMTask, Error, CreateTaskInput>({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.taskLandingPages() });
    },
  });
}

/**
 * Update existing task mutation
 */
export function useUpdateCRMTask() {
  const queryClient = useQueryClient();

  return useMutation<CRMTask, Error, { id: string; input: UpdateTaskInput }>({
    mutationFn: ({ id, input }) => updateTaskApi(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.taskLandingPages() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.task(data.id) });
    },
  });
}

/**
 * Delete task mutation
 */
export function useDeleteCRMTask() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.taskLandingPages() });
    },
  });
}

/**
 * Add task conversation mutation
 */
export function useAddCRMTaskConversation() {
  const queryClient = useQueryClient();

  return useMutation<TaskConversation, Error, AddTaskConversationInput>({
    mutationFn: addTaskConversation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.taskConversations(variables.taskId) });
    },
  });
}

/**
 * Update task conversation mutation
 */
export function useUpdateCRMTaskConversation() {
  const queryClient = useQueryClient();

  return useMutation<TaskConversation, Error, { id: string; input: AddTaskConversationInput }>({
    mutationFn: ({ id, input }) => updateTaskConversation(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.taskConversations(variables.input.taskId) });
    },
  });
}

/**
 * Add task relation mutation
 */
export function useAddCRMTaskRelation() {
  const queryClient = useQueryClient();

  return useMutation<TaskRelation, Error, AddTaskRelationInput>({
    mutationFn: addTaskRelation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.taskLandingPages() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.task(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.taskRelations(variables.taskId) });
    },
  });
}

/**
 * Delete task relation mutation
 */
export function useDeleteCRMTaskRelation() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, { id: string; taskId: string }>({
    mutationFn: ({ id }) => deleteTaskRelation(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.taskLandingPages() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.task(variables.taskId) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.taskRelations(variables.taskId) });
    },
  });
}

/**
 * Fetch tasks linked to an entity (job, contact, company, pre-opportunity, etc.)
 */
export function useCRMTasksByEntity(entityId: string, entityType: TaskEntityType) {
  return useQuery<TaskByEntity[], Error>({
    queryKey: crmQueryKeys.tasksByEntity(entityId, entityType),
    queryFn: () => fetchTasksByEntity(entityId, entityType),
    enabled: hasCRMTokens() && !!entityId && !!entityType,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Entity Search Hooks for Linking
// ============================================================================

/**
 * Search tasks for linking
 */
export function useCRMTaskSearch(searchTerm: string) {
  return useQuery<TaskSearchResult[], Error>({
    queryKey: crmQueryKeys.taskSearch(searchTerm),
    queryFn: () => searchTasks(searchTerm),
    enabled: hasCRMTokens() && searchTerm.length >= 0,
    staleTime: 30 * 1000,
  });
}

/**
 * Search notes for linking
 */
export function useCRMNoteSearch(searchTerm: string) {
  return useQuery<NoteSearchResult[], Error>({
    queryKey: crmQueryKeys.noteSearch(searchTerm),
    queryFn: () => searchNotes(searchTerm),
    enabled: hasCRMTokens() && searchTerm.length >= 0,
    staleTime: 30 * 1000,
  });
}

/**
 * Search quotes for linking
 */
export function useCRMQuoteSearch(searchTerm: string) {
  return useQuery<QuoteSearchResult[], Error>({
    queryKey: crmQueryKeys.quoteSearch(searchTerm),
    queryFn: () => searchQuotes(searchTerm),
    enabled: hasCRMTokens() && searchTerm.length >= 0,
    staleTime: 30 * 1000,
  });
}

/**
 * Search orders for linking
 */
export function useCRMOrderSearch(searchTerm: string) {
  return useQuery<OrderSearchResult[], Error>({
    queryKey: crmQueryKeys.orderSearch(searchTerm),
    queryFn: () => searchOrders(searchTerm),
    enabled: hasCRMTokens() && searchTerm.length >= 0,
    staleTime: 30 * 1000,
  });
}

/**
 * Search invoices for linking
 */
export function useCRMInvoiceSearch(searchTerm: string) {
  return useQuery<InvoiceSearchResult[], Error>({
    queryKey: crmQueryKeys.invoiceSearch(searchTerm),
    queryFn: () => searchInvoices(searchTerm),
    enabled: hasCRMTokens() && searchTerm.length >= 0,
    staleTime: 30 * 1000,
  });
}

/**
 * Search checks for linking
 */
export function useCRMCheckSearch(searchTerm: string) {
  return useQuery<CheckSearchResult[], Error>({
    queryKey: crmQueryKeys.checkSearch(searchTerm),
    queryFn: () => searchChecks(searchTerm),
    enabled: hasCRMTokens() && searchTerm.length >= 0,
    staleTime: 30 * 1000,
  });
}