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
  type LandingPageFilter,
  type LandingPageOrderBy,
  // Job functions
  fetchJobStatuses,
  fetchJob,
  createJob,
  updateJob,
  fetchJobsByIds,
  getStoredJobIds,
  fetchJobLandingPages,
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
 * Update existing job mutation
 */
export function useUpdateCRMJob() {
  const queryClient = useQueryClient();

  return useMutation<Job, Error, { id: string; input: UpdateJobInput }>({
    mutationFn: ({ id, input }) => updateJob(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.jobs() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.job(data.id) });
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
