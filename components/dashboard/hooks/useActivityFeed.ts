/**
 * Activity Feed Hook
 * Fetches and combines data from all entity landing pages for the activity feed
 */

import { useQuery } from '@tanstack/react-query';
import { hasCRMTokens } from '../../lib/crm-auth';
import {
  fetchJobLandingPages,
  fetchCompanyLandingPages,
  fetchContactLandingPages,
  fetchPreOpportunityLandingPages,
  fetchNoteLandingPages,
  fetchTaskLandingPages,
  type JobLandingPage,
  type CompanyLandingPage,
  type ContactLandingPage,
  type PreOpportunityLandingPage,
  type NoteLandingPage,
  type TaskLandingPage,
} from '../../lib/crm-graphql';

export interface ActivityFeedData {
  jobs: JobLandingPage[];
  companies: CompanyLandingPage[];
  contacts: ContactLandingPage[];
  preOpportunities: PreOpportunityLandingPage[];
  notes: NoteLandingPage[];
  tasks: TaskLandingPage[];
}

export const activityFeedQueryKeys = {
  all: ['activityFeed'] as const,
  combined: () => [...activityFeedQueryKeys.all, 'combined'] as const,
};

/**
 * Fetch all entity data for the activity feed
 */
async function fetchAllActivityData(): Promise<ActivityFeedData> {
  const [jobs, companies, contacts, preOpportunities, notes, tasks] = await Promise.all([
    fetchJobLandingPages().catch(() => []),
    fetchCompanyLandingPages().catch(() => []),
    fetchContactLandingPages().catch(() => []),
    fetchPreOpportunityLandingPages().catch(() => []),
    fetchNoteLandingPages().catch(() => []),
    fetchTaskLandingPages().catch(() => []),
  ]);

  return {
    jobs,
    companies,
    contacts,
    preOpportunities,
    notes,
    tasks,
  };
}

/**
 * Hook to fetch all activity feed data
 */
export function useActivityFeed() {
  return useQuery<ActivityFeedData, Error>({
    queryKey: activityFeedQueryKeys.combined(),
    queryFn: fetchAllActivityData,
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
