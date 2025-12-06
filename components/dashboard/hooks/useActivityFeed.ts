/**
 * Activity Feed Hook
 * Fetches and combines data from all entity landing pages for the activity feed
 * Supports infinite scroll pagination
 */

import { useInfiniteQuery } from '@tanstack/react-query';
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

interface ActivityFeedPage {
  data: ActivityFeedData;
  totals: {
    jobs: number;
    companies: number;
    contacts: number;
    preOpportunities: number;
    notes: number;
    tasks: number;
  };
  pageIndex: number;
}

const PAGE_SIZE = 10;

export const activityFeedQueryKeys = {
  all: ['activityFeed'] as const,
  combined: () => [...activityFeedQueryKeys.all, 'combined'] as const,
  infinite: () => [...activityFeedQueryKeys.all, 'infinite'] as const,
};

/**
 * Fetch paginated entity data for the activity feed
 */
async function fetchActivityPage(pageIndex: number): Promise<ActivityFeedPage> {
  const offset = pageIndex * PAGE_SIZE;
  const pagination = { limit: PAGE_SIZE, offset };

  const [jobsResult, companiesResult, contactsResult, preOpportunitiesResult, notesResult, tasksResult] = await Promise.all([
    fetchJobLandingPages(undefined, undefined, pagination).catch(() => ({ records: [], total: 0 })),
    fetchCompanyLandingPages(undefined, undefined, pagination).catch(() => ({ records: [], total: 0 })),
    fetchContactLandingPages(undefined, undefined, pagination).catch(() => ({ records: [], total: 0 })),
    fetchPreOpportunityLandingPages(undefined, undefined, pagination).catch(() => ({ records: [], total: 0 })),
    fetchNoteLandingPages(undefined, undefined, pagination).catch(() => ({ records: [], total: 0 })),
    fetchTaskLandingPages(undefined, undefined, pagination).catch(() => ({ records: [], total: 0 })),
  ]);

  return {
    data: {
      jobs: jobsResult.records,
      companies: companiesResult.records,
      contacts: contactsResult.records,
      preOpportunities: preOpportunitiesResult.records,
      notes: notesResult.records,
      tasks: tasksResult.records,
    },
    totals: {
      jobs: jobsResult.total,
      companies: companiesResult.total,
      contacts: contactsResult.total,
      preOpportunities: preOpportunitiesResult.total,
      notes: notesResult.total,
      tasks: tasksResult.total,
    },
    pageIndex,
  };
}

/**
 * Hook to fetch activity feed data with infinite scroll pagination
 */
export function useActivityFeed() {
  const query = useInfiniteQuery<ActivityFeedPage, Error>({
    queryKey: activityFeedQueryKeys.infinite(),
    queryFn: async ({ pageParam = 0 }) => {
      return fetchActivityPage(pageParam as number);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      // Check if any entity type has more data to load
      const currentOffset = (lastPage.pageIndex + 1) * PAGE_SIZE;
      const hasMoreJobs = currentOffset < lastPage.totals.jobs;
      const hasMoreCompanies = currentOffset < lastPage.totals.companies;
      const hasMoreContacts = currentOffset < lastPage.totals.contacts;
      const hasMorePreOpportunities = currentOffset < lastPage.totals.preOpportunities;
      const hasMoreNotes = currentOffset < lastPage.totals.notes;
      const hasMoreTasks = currentOffset < lastPage.totals.tasks;

      if (hasMoreJobs || hasMoreCompanies || hasMoreContacts || hasMorePreOpportunities || hasMoreNotes || hasMoreTasks) {
        return lastPage.pageIndex + 1;
      }
      return undefined;
    },
    enabled: hasCRMTokens(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  // Combine all pages into a single ActivityFeedData object with deduplication
  const combinedData: ActivityFeedData | undefined = query.data ? {
    jobs: deduplicateById(query.data.pages.flatMap(page => page.data.jobs)),
    companies: deduplicateById(query.data.pages.flatMap(page => page.data.companies)),
    contacts: deduplicateById(query.data.pages.flatMap(page => page.data.contacts)),
    preOpportunities: deduplicateById(query.data.pages.flatMap(page => page.data.preOpportunities)),
    notes: deduplicateById(query.data.pages.flatMap(page => page.data.notes)),
    tasks: deduplicateById(query.data.pages.flatMap(page => page.data.tasks)),
  } : undefined;

  return {
    data: combinedData,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

/**
 * Helper to deduplicate records by ID
 */
function deduplicateById<T extends { id: string }>(records: T[]): T[] {
  const seen = new Set<string>();
  return records.filter(record => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}
