/**
 * Campaigns React Query Hooks
 * Custom hooks for interacting with the Campaigns GraphQL API
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchCampaigns,
  fetchCampaign,
  fetchCampaignRecipients,
  estimateRecipients,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  pauseCampaign,
  resumeCampaign,
  refreshDynamicRecipients,
  sendTestEmail,
  startCampaignSending,
  fetchCampaignSendingStatus,
  checkEmailProviders,
  searchContacts,
  searchCompanies,
  searchJobs,
  searchTasks,
  type Campaign,
  type CampaignLandingPage,
  type CampaignRecipient,
  type CampaignInput,
  type CampaignCriteria,
  type EstimateRecipientsResult,
  type CampaignSendingStatusResponse,
  type EmailProviderStatus,
  type ContactSearchResult,
  type CompanySearchResult,
  type JobSearchResult,
  type TaskSearchResult,
  type PaginatedResult,
} from './campaignsApi';
import type { LandingPageFilter, LandingPageOrderBy } from '../../lib/graphql/types';

// ============================================================================
// Query Keys
// ============================================================================

export const campaignsQueryKeys = {
  all: ['campaigns'] as const,
  list: () => [...campaignsQueryKeys.all, 'list'] as const,
  listInfinite: () => [...campaignsQueryKeys.all, 'list', 'infinite'] as const,
  detail: (id: string) => [...campaignsQueryKeys.all, 'detail', id] as const,
  recipients: (campaignId: string) => [...campaignsQueryKeys.all, 'recipients', campaignId] as const,
  sendingStatus: (campaignId: string) => [...campaignsQueryKeys.all, 'sendingStatus', campaignId] as const,
  estimate: (criteria: CampaignCriteria) => [...campaignsQueryKeys.all, 'estimate', JSON.stringify(criteria)] as const,
  emailProviders: () => [...campaignsQueryKeys.all, 'emailProviders'] as const,
  search: {
    contacts: (term: string) => ['campaigns', 'search', 'contacts', term] as const,
    companies: (term: string) => ['campaigns', 'search', 'companies', term] as const,
    jobs: (term: string) => ['campaigns', 'search', 'jobs', term] as const,
    tasks: (term: string) => ['campaigns', 'search', 'tasks', term] as const,
  },
};

// ============================================================================
// Campaign Hooks
// ============================================================================

const DEFAULT_PAGE_SIZE = 50;

/**
 * Fetch all campaigns (simple list)
 * @param pollInterval - Optional interval in ms to refetch (for background updates)
 */
export function useCampaigns(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[],
  pollInterval?: number
) {
  return useQuery<PaginatedResult<CampaignLandingPage>, Error>({
    queryKey: [...campaignsQueryKeys.list(), filters, orderBy],
    queryFn: () => fetchCampaigns(filters, orderBy),
    enabled: true,
    staleTime: 10 * 1000, // Consider data stale after 10 seconds
    refetchInterval: pollInterval, // Background polling
    refetchIntervalInBackground: false, // Don't poll when tab is not focused
  });
}

/**
 * Fetch campaigns with infinite scroll pagination
 * @param pollInterval - Optional interval in ms to refetch (for background updates)
 */
export function useCampaignsInfinite(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[],
  pageSize: number = DEFAULT_PAGE_SIZE,
  pollInterval?: number
) {
  return useInfiniteQuery<PaginatedResult<CampaignLandingPage>, Error>({
    queryKey: [...campaignsQueryKeys.listInfinite(), filters, orderBy],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchCampaigns(filters, orderBy, { limit: pageSize, offset: pageParam as number });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.records.length, 0);
      if (totalFetched >= lastPage.total) return undefined;
      return totalFetched;
    },
    enabled: true,
    staleTime: 30 * 1000,
    refetchInterval: pollInterval, // Background polling
    refetchIntervalInBackground: false, // Don't poll when tab is not focused
  });
}

/**
 * Fetch a single campaign by ID
 */
export function useCampaign(id: string) {
  return useQuery<Campaign | null, Error>({
    queryKey: campaignsQueryKeys.detail(id),
    queryFn: () => fetchCampaign(id),
    enabled:!!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch recipients for a campaign
 */
export function useCampaignRecipients(campaignId: string) {
  return useQuery<CampaignRecipient[], Error>({
    queryKey: campaignsQueryKeys.recipients(campaignId),
    queryFn: () => fetchCampaignRecipients(campaignId),
    enabled:!!campaignId,
    staleTime: 30 * 1000,
  });
}

/**
 * Estimate recipients count for criteria
 */
export function useEstimateRecipients(criteria: CampaignCriteria | null) {
  return useQuery<EstimateRecipientsResult, Error>({
    queryKey: criteria ? campaignsQueryKeys.estimate(criteria) : ['noop'],
    queryFn: () => criteria ? estimateRecipients(criteria) : Promise.resolve({ count: 0, sampleContacts: [] }),
    enabled:criteria !== null && criteria.groups.length > 0,
    staleTime: 60 * 1000,
  });
}

/**
 * Create a new campaign
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, CampaignInput>({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.listInfinite() });
    },
  });
}

/**
 * Update an existing campaign
 */
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, { id: string; input: CampaignInput }>({
    mutationFn: ({ id, input }) => updateCampaign(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.listInfinite() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete a campaign
 */
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.listInfinite() });
    },
  });
}

/**
 * Pause a campaign
 */
export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, string>({
    mutationFn: pauseCampaign,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.listInfinite() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.detail(id) });
    },
  });
}

/**
 * Resume a campaign
 */
export function useResumeCampaign() {
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, string>({
    mutationFn: resumeCampaign,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.listInfinite() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.detail(id) });
    },
  });
}

/**
 * Refresh dynamic recipients for a campaign
 */
export function useRefreshDynamicRecipients() {
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, string>({
    mutationFn: refreshDynamicRecipients,
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.listInfinite() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.recipients(campaignId) });
    },
  });
}

/**
 * Send a test email
 */
export function useSendTestEmail() {
  return useMutation<boolean, Error, { campaignId: string; testEmail: string }>({
    mutationFn: ({ campaignId, testEmail }) => sendTestEmail(campaignId, testEmail),
  });
}

/**
 * Start campaign sending
 * Transitions campaign from DRAFT to SENDING
 */
export function useStartCampaignSending() {
  const queryClient = useQueryClient();

  return useMutation<Campaign, Error, string>({
    mutationFn: startCampaignSending,
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.listInfinite() });
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeys.detail(campaignId) });
    },
  });
}

/**
 * Get campaign sending status for progress monitoring
 * Use pollInterval to poll for updates while campaign is sending
 */
export function useCampaignSendingStatus(campaignId: string | null, pollInterval?: number) {
  return useQuery<CampaignSendingStatusResponse, Error>({
    queryKey: campaignId ? campaignsQueryKeys.sendingStatus(campaignId) : ['noop'],
    queryFn: () => campaignId ? fetchCampaignSendingStatus(campaignId) : Promise.reject('No campaign ID'),
    enabled:!!campaignId,
    refetchInterval: pollInterval,
    staleTime: 5 * 1000, // 5 seconds
  });
}

/**
 * Check email provider connection status
 */
export function useEmailProviders() {
  return useQuery<EmailProviderStatus, Error>({
    queryKey: campaignsQueryKeys.emailProviders(),
    queryFn: checkEmailProviders,
    enabled: true,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============================================================================
// Search Hooks for Criteria Builder and Static List
// ============================================================================

/**
 * Search contacts for static list selection
 * Pass empty string to get all contacts
 */
export function useContactSearch(searchTerm: string, enabled = true) {
  return useQuery<ContactSearchResult[], Error>({
    queryKey: campaignsQueryKeys.search.contacts(searchTerm),
    queryFn: () => searchContacts(searchTerm),
    enabled:enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search companies for criteria builder value dropdown
 * Pass empty string to get all companies
 */
export function useCompanySearch(searchTerm: string, enabled = true) {
  return useQuery<CompanySearchResult[], Error>({
    queryKey: campaignsQueryKeys.search.companies(searchTerm),
    queryFn: () => searchCompanies(searchTerm),
    enabled:enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search jobs for criteria builder value dropdown
 * Pass empty string to get all jobs
 */
export function useJobSearch(searchTerm: string, enabled = true) {
  return useQuery<JobSearchResult[], Error>({
    queryKey: campaignsQueryKeys.search.jobs(searchTerm),
    queryFn: () => searchJobs(searchTerm),
    enabled:enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Search tasks for criteria builder value dropdown
 * Pass empty string to get all tasks
 */
export function useTaskSearch(searchTerm: string, enabled = true) {
  return useQuery<TaskSearchResult[], Error>({
    queryKey: campaignsQueryKeys.search.tasks(searchTerm),
    queryFn: () => searchTasks(searchTerm),
    enabled:enabled,
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// Re-export types
// ============================================================================

export type {
  Campaign,
  CampaignLandingPage,
  CampaignRecipient,
  CampaignInput,
  CampaignCriteria,
  CampaignStatus,
  RecipientListType,
  SendPace,
  EmailStatus,
  CriteriaEntityType,
  CriteriaOperator,
  CriteriaCondition,
  CriteriaGroup,
  EstimateRecipientsResult,
  CampaignSendingStatusResponse,
  EmailProviderStatus,
  ContactSearchResult,
  CompanySearchResult,
  JobSearchResult,
  TaskSearchResult,
} from './campaignsApi';

// Re-export helper functions
export {
  extractUniqueValues,
  getContactRoles,
  getContactTerritories,
  getCompanyTypes,
  getJobTypes,
  getJobStatuses,
  getTaskStatuses,
  getTaskPriorities,
  extractAllTags,
} from './campaignsApi';
