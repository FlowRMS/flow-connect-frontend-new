/**
 * Landing Pages GraphQL Module
 * Combined landing page queries for activity feeds and dashboards
 */

import { crmGraphQLRequest } from './client';
import type {
  LandingPageFilter,
  LandingPageOrderBy,
  PaginationParams,
  PaginatedResult,
  JobLandingPage,
  CompanyLandingPage,
  ContactLandingPage,
  PreOpportunityLandingPage,
  CustomerLandingPage,
  FactoryLandingPage,
} from './types';
import type { NoteLandingPage } from '../../notes/api/notesApi';
import type { TaskLandingPage } from '../../tasks/api/tasksApi';

// ============================================================================
// Types
// ============================================================================

export interface AllLandingPagesResponse {
  jobs: PaginatedResult<JobLandingPage>;
  companies: PaginatedResult<CompanyLandingPage>;
  contacts: PaginatedResult<ContactLandingPage>;
  preOpportunities: PaginatedResult<PreOpportunityLandingPage>;
  notes: PaginatedResult<NoteLandingPage>;
  tasks: PaginatedResult<TaskLandingPage>;
  customers: PaginatedResult<CustomerLandingPage>;
  factories: PaginatedResult<FactoryLandingPage>;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const FIND_ALL_LANDING_PAGES = `
  query FindAllLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
    $limit: Int
    $offset: Int
  ) {
    jobs: findLandingPages(
      sourceType: JOBS
      filters: $filters
      orderBy: $orderBy
      limit: $limit
      offset: $offset
    ) {
      records {
        ... on JobLandingPage {
          id
          createdAt
          description
          endDate
          jobName
          jobOwner
          jobType
          requester
          startDate
          statusName
          createdBy
        }
      }
      total
    }
    companies: findLandingPages(
      sourceType: COMPANIES
      filters: $filters
      orderBy: $orderBy
      limit: $limit
      offset: $offset
    ) {
      records {
        ... on CompanyLandingPage {
          id
          name
          companySourceType
          createdAt
          createdBy
          phone
          website
        }
      }
      total
    }
    contacts: findLandingPages(
      sourceType: CONTACTS
      filters: $filters
      orderBy: $orderBy
      limit: $limit
      offset: $offset
    ) {
      records {
        ... on ContactLandingPage {
          id
          firstName
          lastName
          email
          phone
          role
          companyName
          createdBy
          createdAt
        }
      }
      total
    }
    preOpportunities: findLandingPages(
      sourceType: PRE_OPPORTUNITIES
      filters: $filters
      orderBy: $orderBy
      limit: $limit
      offset: $offset
    ) {
      records {
        ... on PreOpportunityLandingPage {
          id
          total
          status
          expDate
          entityNumber
          entityDate
          createdBy
          createdAt
        }
      }
      total
    }
    notes: findLandingPages(
      sourceType: NOTES
      filters: $filters
      orderBy: $orderBy
      limit: $limit
      offset: $offset
    ) {
      records {
        ... on NoteLandingPage {
          id
          title
          content
          linkedEntities {
            entityType
            id
            title
          }
          tags
          createdBy
          createdAt
        }
      }
      total
    }
    tasks: findLandingPages(
      sourceType: TASKS
      filters: $filters
      orderBy: $orderBy
      limit: $limit
      offset: $offset
    ) {
      records {
        ... on TaskLandingPage {
          id
          assignedTo
          createdAt
          createdBy
          description
          dueDate
          linkedEntities {
            entityType
            id
            title
          }
          priority
          reminderDate
          status
          tags
          title
        }
      }
      total
    }
    customers: findLandingPages(
      sourceType: CUSTOMERS
      filters: $filters
      orderBy: $orderBy
      limit: $limit
      offset: $offset
    ) {
      records {
        ... on CustomerLandingPage {
          id
          companyName
          createdAt
          createdBy
          insideReps
          outsideReps
          isParent
          published
        }
      }
      total
    }
    factories: findLandingPages(
      sourceType: FACTORIES
      filters: $filters
      orderBy: $orderBy
      limit: $limit
      offset: $offset
    ) {
      records {
        ... on FactoryLandingPage {
          id
          title
          email
          phone
          published
          accountNumber
          baseCommissionRate
          commissionDiscountRate
          overallDiscountRate
          paymentTerms
          leadTime
          freightDiscountType
          createdAt
        }
      }
      total
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all landing pages in a single GraphQL query (optimized for activity feed)
 * Uses GraphQL aliases to fetch jobs, companies, contacts, pre-opportunities, notes, and tasks
 * in one network request instead of 6 separate requests.
 */
export async function fetchAllLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[],
  pagination?: PaginationParams
): Promise<AllLandingPagesResponse> {
  // Import the normalization function for pre-opportunities
  const { normalizePreOpportunitiesStatus } = await import('../../pre-opportunities/utils');

  const response = await crmGraphQLRequest<{
    jobs: { records: JobLandingPage[]; total: number };
    companies: { records: CompanyLandingPage[]; total: number };
    contacts: { records: ContactLandingPage[]; total: number };
    preOpportunities: { records: PreOpportunityLandingPage[]; total: number };
    notes: { records: NoteLandingPage[]; total: number };
    tasks: { records: TaskLandingPage[]; total: number };
    customers: { records: CustomerLandingPage[]; total: number };
    factories: { records: FactoryLandingPage[]; total: number };
  }>({
    query: FIND_ALL_LANDING_PAGES,
    variables: { filters, orderBy, limit: pagination?.limit, offset: pagination?.offset },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch landing pages');
  }

  const data = response.data;

  return {
    jobs: {
      records: data?.jobs?.records || [],
      total: data?.jobs?.total || 0,
    },
    companies: {
      records: data?.companies?.records || [],
      total: data?.companies?.total || 0,
    },
    contacts: {
      records: data?.contacts?.records || [],
      total: data?.contacts?.total || 0,
    },
    preOpportunities: {
      records: normalizePreOpportunitiesStatus(data?.preOpportunities?.records || []),
      total: data?.preOpportunities?.total || 0,
    },
    notes: {
      records: data?.notes?.records || [],
      total: data?.notes?.total || 0,
    },
    tasks: {
      records: data?.tasks?.records || [],
      total: data?.tasks?.total || 0,
    },
    customers: {
      records: data?.customers?.records || [],
      total: data?.customers?.total || 0,
    },
    factories: {
      records: data?.factories?.records || [],
      total: data?.factories?.total || 0,
    },
  };
}
