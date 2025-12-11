/**
 * Campaigns API Module
 * Exports all campaigns API functions and hooks
 */

// API functions
export {
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
  searchContacts,
  searchCompanies,
  searchJobs,
  searchTasks,
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

// React Query hooks
export {
  campaignsQueryKeys,
  useCampaigns,
  useCampaignsInfinite,
  useCampaign,
  useCampaignRecipients,
  useEstimateRecipients,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useRefreshDynamicRecipients,
  useSendTestEmail,
  useContactSearch,
  useCompanySearch,
  useJobSearch,
  useTaskSearch,
} from './useCampaignsApi';

// Types
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
  EstimateSampleContact,
  ContactSearchResult,
  CompanySearchResult,
  JobSearchResult,
  TaskSearchResult,
  PaginationParams,
  PaginatedResult,
} from './campaignsApi';
