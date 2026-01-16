/**
 * Activity Feed Hook
 * Fetches and combines data from all entity landing pages for the activity feed
 * Supports infinite scroll pagination and server-side filtering
 *
 * Optimized to use a single GraphQL query with aliases instead of 6 separate requests
 */

import { useInfiniteQuery } from '@tanstack/react-query';

import {
  fetchAllLandingPages,
  type JobLandingPage,
  type CompanyLandingPage,
  type ContactLandingPage,
  type PreOpportunityLandingPage,
  type NoteLandingPage,
  type TaskLandingPage,
  type CustomerLandingPage,
  type FactoryLandingPage,
  type LandingPageFilter,
  type LandingPageOrderBy,
} from '../../lib/crm-graphql';

export interface ActivityFeedData {
  jobs: JobLandingPage[];
  companies: CompanyLandingPage[];
  contacts: ContactLandingPage[];
  preOpportunities: PreOpportunityLandingPage[];
  notes: NoteLandingPage[];
  tasks: TaskLandingPage[];
  customers: CustomerLandingPage[];
  factories: FactoryLandingPage[];
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
    customers: number;
    factories: number;
  };
  pageIndex: number;
}

const PAGE_SIZE = 10;

export const activityFeedQueryKeys = {
  all: ['activityFeed'] as const,
  combined: () => [...activityFeedQueryKeys.all, 'combined'] as const,
  infinite: (filters?: LandingPageFilter[], orderBy?: LandingPageOrderBy[]) => 
    [...activityFeedQueryKeys.all, 'infinite', { filters, orderBy }] as const,
};

/**
 * Fetch paginated entity data for the activity feed with optional filters
 * Uses a single GraphQL query with aliases to fetch all entity types at once
 */
async function fetchActivityPage(
  pageIndex: number,
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[]
): Promise<ActivityFeedPage> {
  const offset = pageIndex * PAGE_SIZE;
  const pagination = { limit: PAGE_SIZE, offset };

  // Single query fetches all 8 entity types at once using GraphQL aliases
  const result = await fetchAllLandingPages(filters, orderBy, pagination).catch(() => ({
    jobs: { records: [], total: 0 },
    companies: { records: [], total: 0 },
    contacts: { records: [], total: 0 },
    preOpportunities: { records: [], total: 0 },
    notes: { records: [], total: 0 },
    tasks: { records: [], total: 0 },
    customers: { records: [], total: 0 },
    factories: { records: [], total: 0 },
  }));

  return {
    data: {
      jobs: result.jobs.records,
      companies: result.companies.records,
      contacts: result.contacts.records,
      preOpportunities: result.preOpportunities.records,
      notes: result.notes.records,
      tasks: result.tasks.records,
      customers: result.customers.records,
      factories: result.factories.records,
    },
    totals: {
      jobs: result.jobs.total,
      companies: result.companies.total,
      contacts: result.contacts.total,
      preOpportunities: result.preOpportunities.total,
      notes: result.notes.total,
      tasks: result.tasks.total,
      customers: result.customers.total,
      factories: result.factories.total,
    },
    pageIndex,
  };
}

/**
 * Hook to fetch activity feed data with infinite scroll pagination and server-side filtering
 */
export function useActivityFeed(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[]
) {
  const query = useInfiniteQuery<ActivityFeedPage, Error>({
    queryKey: activityFeedQueryKeys.infinite(filters, orderBy),
    queryFn: async ({ pageParam = 0 }) => {
      return fetchActivityPage(pageParam as number, filters, orderBy);
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
      const hasMoreCustomers = currentOffset < lastPage.totals.customers;
      const hasMoreFactories = currentOffset < lastPage.totals.factories;

      if (hasMoreJobs || hasMoreCompanies || hasMoreContacts || hasMorePreOpportunities || hasMoreNotes || hasMoreTasks || hasMoreCustomers || hasMoreFactories) {
        return lastPage.pageIndex + 1;
      }
      return undefined;
    },
    enabled: true,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Combine all pages into a single ActivityFeedData object with deduplication
  const combinedData: ActivityFeedData | undefined = query.data ? {
    jobs: deduplicateById(query.data.pages.flatMap(page => page.data.jobs)),
    companies: deduplicateById(query.data.pages.flatMap(page => page.data.companies)),
    contacts: deduplicateById(query.data.pages.flatMap(page => page.data.contacts)),
    preOpportunities: deduplicateById(query.data.pages.flatMap(page => page.data.preOpportunities)),
    notes: deduplicateById(query.data.pages.flatMap(page => page.data.notes)),
    tasks: deduplicateById(query.data.pages.flatMap(page => page.data.tasks)),
    customers: deduplicateById(query.data.pages.flatMap(page => page.data.customers)),
    factories: deduplicateById(query.data.pages.flatMap(page => page.data.factories)),
  } : undefined;

  // Get totals from the first page (totals don't change between pages)
  const totals = query.data?.pages[0]?.totals || {
    jobs: 0,
    companies: 0,
    contacts: 0,
    preOpportunities: 0,
    notes: 0,
    tasks: 0,
    customers: 0,
    factories: 0,
  };

  return {
    data: combinedData,
    totals,
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
