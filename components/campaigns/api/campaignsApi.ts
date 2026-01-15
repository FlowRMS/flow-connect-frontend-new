/**
 * Campaigns API Module
 * GraphQL API endpoints for Campaigns functionality
 * Following the pattern established by Tasks and Notes API modules
 */

import { crmGraphQLRequest } from '../../lib/crm-graphql';
import type { LandingPageFilter, LandingPageOrderBy } from '../../lib/graphql/types';

// ============================================================================
// Types
// ============================================================================

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'PAUSED';
export type RecipientListType = 'STATIC' | 'CRITERIA_BASED' | 'DYNAMIC';
export type SendPace = 'SLOW' | 'MEDIUM' | 'FAST';
export type EmailStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'BOUNCED' | 'OPENED' | 'CLICKED';
export type CriteriaEntityType = 'CONTACT' | 'JOB' | 'COMPANY' | 'TASK';
export type CriteriaOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'IS_NULL'
  | 'IS_NOT_NULL'
  | 'IN'
  | 'NOT_IN';

export interface CampaignLandingPage {
  id: string;
  createdAt: string;
  createdBy: string;
  name: string;
  status: CampaignStatus;
  recipientListType: RecipientListType;
  recipientsCount: number;
  sentCount: number;
  progress: string;
}

export interface Campaign {
  id: string;
  createdAt: string;
  name: string;
  status: CampaignStatus;
  recipientListType: RecipientListType;
  description?: string;
  emailSubject: string;
  emailBody: string;
  aiPersonalizationEnabled: boolean;
  sendPace: SendPace;
  maxEmailsPerDay: number;
  scheduledAt?: string;
  sendImmediately: boolean;
  recipientsCount: number;
  sentCount: number;
  criteriaJson?: string;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  contactId: string;
  emailStatus: EmailStatus;
  sentAt?: string;
  personalizedContent?: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role?: string;
  };
}

export interface CriteriaCondition {
  entityType: CriteriaEntityType;
  field: string;
  operator: CriteriaOperator;
  value: string;
}

export interface CriteriaGroup {
  logicalOperator: 'AND' | 'OR';
  conditions: CriteriaCondition[];
}

export interface CampaignCriteria {
  groups: CriteriaGroup[];
  groupOperator: 'AND' | 'OR';
}

// Contact response from estimateRecipients (matches ContactResponse in backend)
export interface EstimateSampleContact {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  territory?: string;
  tags?: string[];
  notes?: string;
}

export interface EstimateRecipientsResult {
  count: number;
  sampleContacts: EstimateSampleContact[];
}

export interface CampaignInput {
  name: string;
  recipientListType: RecipientListType;
  description?: string;
  emailSubject: string;
  emailBody: string;
  aiPersonalizationEnabled?: boolean;
  sendPace?: SendPace;
  maxEmailsPerDay?: number;
  scheduledAt?: string;
  sendImmediately?: boolean;
  staticContactIds?: string[];
  criteria?: CampaignCriteria;
}

export interface ContactSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  notes?: string;
  territory?: string;
  tags?: string;
  createdAt: string;
}

export interface CompanySearchResult {
  id: string;
  name: string;
  companySourceType: string;
  phone?: string;
  website?: string;
  tags?: string;
}

export interface JobSearchResult {
  id: string;
  jobName: string;
  jobType?: string;
  status?: {
    id: string;
    name: string;
  };
  tags?: string;
}

export interface TaskSearchResult {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  tags?: string;
}

// Pagination types
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  records: T[];
  total: number;
}

// Campaign Sending Status Response
export interface CampaignSendingStatusResponse {
  campaignId: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  pendingCount: number;
  failedCount: number;
  bouncedCount: number;
  todaySentCount: number;
  maxEmailsPerDay: number;
  remainingToday: number;
  sendPace: SendPace | null;
  emailsPerHour: number;
  progressPercentage: number;
  progressDisplay: string;
  isCompleted: boolean;
  canSendMoreToday: boolean;
}

// Email Provider Connection Status
export interface EmailProviderStatus {
  o365ConnectionStatus: {
    isConnected: boolean;
    microsoftEmail: string | null;
    expiresAt: string | null;
    lastUsedAt: string | null;
  };
  gmailConnectionStatus: {
    isConnected: boolean;
    googleEmail: string | null;
    expiresAt: string | null;
    lastUsedAt: string | null;
  };
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const FIND_CAMPAIGNS_LANDING_PAGES = `
  query FindCampaignsLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
    $limit: Int
    $offset: Int
  ) {
    findLandingPages(
      sourceType: CAMPAIGNS
      filters: $filters
      orderBy: $orderBy
      limit: $limit
      offset: $offset
    ) {
      records {
        ... on CampaignLandingPage {
          id
          createdAt
          createdBy
          name
          status
          recipientListType
          recipientsCount
          sentCount
          progress
        }
      }
      total
    }
  }
`;

const GET_CAMPAIGN = `
  query GetCampaign($id: UUID!) {
    campaign(id: $id) {
      id
      createdAt
      name
      status
      recipientListType
      description
      emailSubject
      emailBody
      aiPersonalizationEnabled
      sendPace
      maxEmailsPerDay
      scheduledAt
      sendImmediately
      recipientsCount
      sentCount
      criteriaJson
    }
  }
`;

const GET_CAMPAIGN_RECIPIENTS = `
  query GetCampaignRecipients($campaignId: UUID!, $limit: Int, $offset: Int) {
    campaignRecipients(campaignId: $campaignId, limit: $limit, offset: $offset) {
      id
      campaignId
      contactId
      emailStatus
      sentAt
      personalizedContent
      contact {
        id
        firstName
        lastName
        email
        phone
        role
      }
    }
  }
`;

const ESTIMATE_RECIPIENTS = `
  query EstimateRecipients($criteria: CampaignCriteriaInput!) {
    estimateRecipients(criteria: $criteria) {
      count
      sampleContacts {
        id
        createdAt
        firstName
        lastName
        email
        phone
        role
        territory
        tags
        notes
      }
    }
  }
`;

const CONTACT_SEARCH = `
  query ContactSearch($searchTerm: String!, $limit: Int) {
    contactSearch(searchTerm: $searchTerm, limit: $limit) {
      id
      firstName
      lastName
      email
      phone
      role
      notes
      territory
      tags
      createdAt
    }
  }
`;

const COMPANY_SEARCH = `
  query CompanySearch($searchTerm: String!, $limit: Int) {
    companySearch(searchTerm: $searchTerm, limit: $limit) {
      id
      name
      companySourceType
      phone
      website
      tags
    }
  }
`;

const JOB_SEARCH = `
  query JobSearch($searchTerm: String!, $limit: Int) {
    jobSearch(searchTerm: $searchTerm, limit: $limit) {
      id
      jobName
      jobType
      status {
        id
        name
      }
      tags
    }
  }
`;

const TASK_SEARCH = `
  query TaskSearch($searchTerm: String!, $limit: Int) {
    taskSearch(searchTerm: $searchTerm, limit: $limit) {
      id
      title
      status
      priority
      dueDate
      tags
    }
  }
`;

const CREATE_CAMPAIGN = `
  mutation CreateCampaign($input: CampaignInput!) {
    createCampaign(input: $input) {
      id
      name
      status
      recipientsCount
    }
  }
`;

const UPDATE_CAMPAIGN = `
  mutation UpdateCampaign($id: UUID!, $input: CampaignInput!) {
    updateCampaign(id: $id, input: $input) {
      id
      name
      status
    }
  }
`;

const DELETE_CAMPAIGN = `
  mutation DeleteCampaign($id: UUID!) {
    deleteCampaign(id: $id)
  }
`;

const PAUSE_CAMPAIGN = `
  mutation PauseCampaign($id: UUID!) {
    pauseCampaign(id: $id) {
      id
      status
    }
  }
`;

const RESUME_CAMPAIGN = `
  mutation ResumeCampaign($id: UUID!) {
    resumeCampaign(id: $id) {
      id
      status
    }
  }
`;

const REFRESH_DYNAMIC_RECIPIENTS = `
  mutation RefreshDynamicRecipients($campaignId: UUID!) {
    refreshDynamicRecipients(campaignId: $campaignId) {
      id
      recipientsCount
    }
  }
`;

const SEND_TEST_EMAIL = `
  mutation SendTestEmail($campaignId: UUID!, $testEmail: String!) {
    sendTestEmail(campaignId: $campaignId, testEmail: $testEmail) {
      success
      error
    }
  }
`;

const START_CAMPAIGN_SENDING = `
  mutation StartCampaignSending($campaignId: UUID!) {
    startCampaignSending(campaignId: $campaignId) {
      id
      status
      recipientsCount
      sentCount
    }
  }
`;

const GET_CAMPAIGN_SENDING_STATUS = `
  query CampaignSendingStatus($campaignId: UUID!) {
    campaignSendingStatus(campaignId: $campaignId) {
      campaignId
      status
      totalRecipients
      sentCount
      pendingCount
      failedCount
      bouncedCount
      todaySentCount
      maxEmailsPerDay
      remainingToday
      sendPace
      emailsPerHour
      progressPercentage
      progressDisplay
      isCompleted
      canSendMoreToday
    }
  }
`;

const CHECK_EMAIL_PROVIDERS = `
  query CheckEmailProviders {
    o365ConnectionStatus {
      isConnected
      microsoftEmail
      expiresAt
      lastUsedAt
    }
    gmailConnectionStatus {
      isConnected
      googleEmail
      expiresAt
      lastUsedAt
    }
  }
`;

// ============================================================================
// API Functions - Campaigns
// ============================================================================

/**
 * Fetch campaigns list using findLandingPages endpoint
 */
export async function fetchCampaigns(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[],
  pagination?: PaginationParams
): Promise<PaginatedResult<CampaignLandingPage>> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: CampaignLandingPage[]; total: number };
  }>({
    query: FIND_CAMPAIGNS_LANDING_PAGES,
    variables: {
      filters: filters && filters.length > 0 ? filters : undefined,
      orderBy: orderBy && orderBy.length > 0 ? orderBy : undefined,
      limit: pagination?.limit,
      offset: pagination?.offset,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch campaigns');
  }

  return {
    records: response.data?.findLandingPages?.records || [],
    total: response.data?.findLandingPages?.total || 0,
  };
}

/**
 * Fetch a single campaign by ID
 */
export async function fetchCampaign(id: string): Promise<Campaign | null> {
  const response = await crmGraphQLRequest<{ campaign: Campaign }>({
    query: GET_CAMPAIGN,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch campaign');
  }

  return response.data?.campaign || null;
}

/**
 * Fetch recipients for a campaign
 */
export async function fetchCampaignRecipients(
  campaignId: string,
  pagination?: PaginationParams
): Promise<CampaignRecipient[]> {
  const response = await crmGraphQLRequest<{ campaignRecipients: CampaignRecipient[] }>({
    query: GET_CAMPAIGN_RECIPIENTS,
    variables: {
      campaignId,
      limit: pagination?.limit,
      offset: pagination?.offset,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch campaign recipients');
  }

  return response.data?.campaignRecipients || [];
}

/**
 * Estimate recipients count for given criteria
 */
export async function estimateRecipients(
  criteria: CampaignCriteria
): Promise<EstimateRecipientsResult> {
  const response = await crmGraphQLRequest<{ estimateRecipients: EstimateRecipientsResult }>({
    query: ESTIMATE_RECIPIENTS,
    variables: { criteria },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to estimate recipients');
  }

  return response.data?.estimateRecipients || { count: 0, sampleContacts: [] };
}

/**
 * Create a new campaign
 */
export async function createCampaign(input: CampaignInput): Promise<Campaign> {
  const response = await crmGraphQLRequest<{ createCampaign: Campaign }>({
    query: CREATE_CAMPAIGN,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create campaign');
  }

  if (!response.data?.createCampaign) {
    throw new Error('No campaign returned from create mutation');
  }

  return response.data.createCampaign;
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(id: string, input: CampaignInput): Promise<Campaign> {
  const response = await crmGraphQLRequest<{ updateCampaign: Campaign }>({
    query: UPDATE_CAMPAIGN,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update campaign');
  }

  if (!response.data?.updateCampaign) {
    throw new Error('No campaign returned from update mutation');
  }

  return response.data.updateCampaign;
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteCampaign: boolean }>({
    query: DELETE_CAMPAIGN,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete campaign');
  }

  return true;
}

/**
 * Pause a campaign
 */
export async function pauseCampaign(id: string): Promise<Campaign> {
  const response = await crmGraphQLRequest<{ pauseCampaign: Campaign }>({
    query: PAUSE_CAMPAIGN,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to pause campaign');
  }

  if (!response.data?.pauseCampaign) {
    throw new Error('No campaign returned from pause mutation');
  }

  return response.data.pauseCampaign;
}

/**
 * Resume a campaign
 */
export async function resumeCampaign(id: string): Promise<Campaign> {
  const response = await crmGraphQLRequest<{ resumeCampaign: Campaign }>({
    query: RESUME_CAMPAIGN,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to resume campaign');
  }

  if (!response.data?.resumeCampaign) {
    throw new Error('No campaign returned from resume mutation');
  }

  return response.data.resumeCampaign;
}

/**
 * Refresh dynamic recipients for a campaign
 */
export async function refreshDynamicRecipients(campaignId: string): Promise<Campaign> {
  const response = await crmGraphQLRequest<{ refreshDynamicRecipients: Campaign }>({
    query: REFRESH_DYNAMIC_RECIPIENTS,
    variables: { campaignId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to refresh dynamic recipients');
  }

  if (!response.data?.refreshDynamicRecipients) {
    throw new Error('No campaign returned from refresh mutation');
  }

  return response.data.refreshDynamicRecipients;
}

/**
 * Send a test email for a campaign
 */
export async function sendTestEmail(campaignId: string, testEmail: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ sendTestEmail: { success: boolean; error: string | null } }>({
    query: SEND_TEST_EMAIL,
    variables: { campaignId, testEmail },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to send test email');
  }

  const result = response.data?.sendTestEmail;
  if (!result?.success) {
    throw new Error(result?.error || 'Failed to send test email');
  }

  return true;
}

/**
 * Start sending a campaign
 * Transitions campaign from DRAFT to SENDING status
 */
export async function startCampaignSending(campaignId: string): Promise<Campaign> {
  const response = await crmGraphQLRequest<{ startCampaignSending: Campaign }>({
    query: START_CAMPAIGN_SENDING,
    variables: { campaignId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to start campaign sending');
  }

  if (!response.data?.startCampaignSending) {
    throw new Error('No campaign returned from start sending mutation');
  }

  return response.data.startCampaignSending;
}

/**
 * Get campaign sending status for progress monitoring
 */
export async function fetchCampaignSendingStatus(campaignId: string): Promise<CampaignSendingStatusResponse> {
  const response = await crmGraphQLRequest<{ campaignSendingStatus: CampaignSendingStatusResponse }>({
    query: GET_CAMPAIGN_SENDING_STATUS,
    variables: { campaignId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch campaign sending status');
  }

  if (!response.data?.campaignSendingStatus) {
    throw new Error('No status returned from campaign sending status query');
  }

  return response.data.campaignSendingStatus;
}

/**
 * Check email provider connection status
 * Returns O365 and Gmail connection status
 */
export async function checkEmailProviders(): Promise<EmailProviderStatus> {
  const response = await crmGraphQLRequest<EmailProviderStatus>({
    query: CHECK_EMAIL_PROVIDERS,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to check email providers');
  }

  if (!response.data) {
    throw new Error('No data returned from email provider check');
  }

  return response.data;
}

// ============================================================================
// API Functions - Search (for criteria builder and static list)
// ============================================================================

/**
 * Search contacts
 * Returns all contacts when empty string is passed
 * @param searchTerm - Search term to filter contacts
 * @param limit - Maximum number of results (default 10000)
 */
export async function searchContacts(searchTerm: string, limit: number = 10000): Promise<ContactSearchResult[]> {
  const response = await crmGraphQLRequest<{ contactSearch: ContactSearchResult[] }>({
    query: CONTACT_SEARCH,
    variables: { searchTerm, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search contacts');
  }

  return response.data?.contactSearch || [];
}

/**
 * Search companies
 * Returns all companies when empty string is passed
 * @param searchTerm - Search term to filter companies
 * @param limit - Maximum number of results (default 10000)
 */
export async function searchCompanies(searchTerm: string, limit: number = 10000): Promise<CompanySearchResult[]> {
  const response = await crmGraphQLRequest<{ companySearch: CompanySearchResult[] }>({
    query: COMPANY_SEARCH,
    variables: { searchTerm, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search companies');
  }

  return response.data?.companySearch || [];
}

/**
 * Search jobs
 * Returns all jobs when empty string is passed
 * @param searchTerm - Search term to filter jobs
 * @param limit - Maximum number of results (default 10000)
 */
export async function searchJobs(searchTerm: string, limit: number = 10000): Promise<JobSearchResult[]> {
  const response = await crmGraphQLRequest<{ jobSearch: JobSearchResult[] }>({
    query: JOB_SEARCH,
    variables: { searchTerm, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search jobs');
  }

  return response.data?.jobSearch || [];
}

/**
 * Search tasks
 * Returns all tasks when empty string is passed
 * @param searchTerm - Search term to filter tasks
 * @param limit - Maximum number of results (default 10000)
 */
export async function searchTasks(searchTerm: string, limit: number = 10000): Promise<TaskSearchResult[]> {
  const response = await crmGraphQLRequest<{ taskSearch: TaskSearchResult[] }>({
    query: TASK_SEARCH,
    variables: { searchTerm, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search tasks');
  }

  return response.data?.taskSearch || [];
}

// ============================================================================
// Helper Functions - Entity Field Values
// ============================================================================

/**
 * Get unique field values from search results for criteria builder dropdowns
 */
export function extractUniqueValues<T, K extends keyof T>(
  items: T[],
  field: K
): string[] {
  const values = items
    .map(item => item[field])
    .filter((value): value is NonNullable<T[K]> => value != null && value !== '')
    .map(value => String(value));

  return [...new Set(values)].sort();
}

/**
 * Get contact roles from contacts
 */
export function getContactRoles(contacts: ContactSearchResult[]): string[] {
  return extractUniqueValues(contacts, 'role');
}

/**
 * Get contact territories from contacts
 */
export function getContactTerritories(contacts: ContactSearchResult[]): string[] {
  return extractUniqueValues(contacts, 'territory');
}

/**
 * Get company types from companies
 */
export function getCompanyTypes(companies: CompanySearchResult[]): string[] {
  return extractUniqueValues(companies, 'companySourceType');
}

/**
 * Get job types from jobs
 */
export function getJobTypes(jobs: JobSearchResult[]): string[] {
  return extractUniqueValues(jobs, 'jobType');
}

/**
 * Get job status names from jobs
 */
export function getJobStatuses(jobs: JobSearchResult[]): string[] {
  return [...new Set(
    jobs
      .map(job => job.status?.name)
      .filter((name): name is string => name != null && name !== '')
  )].sort();
}

/**
 * Get task statuses from tasks
 */
export function getTaskStatuses(tasks: TaskSearchResult[]): string[] {
  return extractUniqueValues(tasks, 'status');
}

/**
 * Get task priorities from tasks
 */
export function getTaskPriorities(tasks: TaskSearchResult[]): string[] {
  return extractUniqueValues(tasks, 'priority');
}

/**
 * Extract all tags from any entity list
 */
export function extractAllTags<T extends { tags?: string | string[] | null }>(
  items: T[]
): string[] {
  const allTags: string[] = [];

  items.forEach(item => {
    if (item.tags) {
      if (typeof item.tags === 'string') {
        // Tags might be comma-separated or JSON array
        try {
          const parsed = JSON.parse(item.tags);
          if (Array.isArray(parsed)) {
            allTags.push(...parsed);
          }
        } catch {
          // If not JSON, try splitting by comma
          allTags.push(...item.tags.split(',').map(t => t.trim()).filter(Boolean));
        }
      } else if (Array.isArray(item.tags)) {
        allTags.push(...item.tags);
      }
    }
  });

  return [...new Set(allTags)].sort();
}
