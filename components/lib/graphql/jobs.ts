/**
 * Jobs GraphQL Module
 * GraphQL queries and API functions for Jobs
 */

import { crmGraphQLRequest, formatCreatedBy } from './client';
import type {
  Job,
  JobInput,
  UpdateJobInput,
  JobStatus,
  JobLandingPage,
  LandingPageFilter,
  LandingPageOrderBy,
  PaginationParams,
  PaginatedResult,
} from './types';

// Re-export types
export type { Job, JobInput, UpdateJobInput, JobStatus, JobLandingPage };

// ============================================================================
// Local Storage for Job IDs
// ============================================================================

const STORED_JOB_IDS_KEY = 'flowcrm_created_job_ids';

export function getStoredJobIds(): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORED_JOB_IDS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addStoredJobId(id: string): void {
  if (typeof window === 'undefined') return;
  const ids = getStoredJobIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(STORED_JOB_IDS_KEY, JSON.stringify(ids));
  }
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_JOB_STATUSES = `
  query GetJobStatuses {
    jobStatuses {
      id
      name
    }
  }
`;

const GET_JOB = `
  query GetJob($id: UUID!) {
    job(id: $id) {
      additionalInformation
      createdAt
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      description
      endDate
      id
      jobName
      jobType
      requesterId
      startDate
      status {
        id
        name
      }
      structuralDetails
      structuralInformation
      tags
    }
  }
`;

const CREATE_JOB = `
  mutation CreateJob($input: JobInput!) {
    createJob(input: $input) {
      structuralInformation
      structuralDetails
      status {
        name
        id
      }
      startDate
      requesterId
      jobType
      jobName
      id
      endDate
      description
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
      additionalInformation
      tags
    }
  }
`;

const UPDATE_JOB = `
  mutation UpdateJob($id: UUID!, $input: JobInput!) {
    updateJob(id: $id, input: $input) {
      id
      jobName
      jobType
      description
      additionalInformation
      structuralInformation
      structuralDetails
      startDate
      endDate
      requesterId
      tags
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
      status {
        id
        name
      }
    }
  }
`;

const DELETE_JOB = `
  mutation DeleteJob($id: UUID!) {
    deleteJob(id: $id)
  }
`;

const FIND_JOB_LANDING_PAGES = `
  query FindJobLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
    $limit: Int
    $offset: Int
  ) {
    findLandingPages(
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
          tags
        }
      }
      total
    }
  }
`;

const SEARCH_JOBS = `
  query SearchJobs($searchTerm: String!) {
    jobSearch(searchTerm: $searchTerm) {
      id
      jobName
      jobType
      description
      additionalInformation
      structuralInformation
      structuralDetails
      startDate
      endDate
      requesterId
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
      status {
        id
        name
      }
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

export async function fetchJobStatuses(): Promise<JobStatus[]> {
  const response = await crmGraphQLRequest<{ jobStatuses: JobStatus[] }>({
    query: GET_JOB_STATUSES,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch job statuses');
  }

  return response.data?.jobStatuses || [];
}

export async function fetchJob(id: string): Promise<Job | null> {
  const response = await crmGraphQLRequest<{ job: Job }>({
    query: GET_JOB,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch job');
  }

  const job = response.data?.job;

  return job ? { ...job, createdBy: formatCreatedBy(job.createdBy) } : null;
}

export async function createJob(input: JobInput): Promise<Job> {
  const response = await crmGraphQLRequest<{ createJob: Job }>({
    query: CREATE_JOB,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create job');
  }

  if (!response.data?.createJob) {
    throw new Error('No job returned from create mutation');
  }

  // Store the job ID for later retrieval
  addStoredJobId(response.data.createJob.id);

  const createdJob = response.data.createJob;
  return { ...createdJob, createdBy: formatCreatedBy(createdJob.createdBy) };
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  const response = await crmGraphQLRequest<{ updateJob: Job }>({
    query: UPDATE_JOB,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update job');
  }

  if (!response.data?.updateJob) {
    throw new Error('No job returned from update mutation');
  }

  const updatedJob = response.data.updateJob;
  return { ...updatedJob, createdBy: formatCreatedBy(updatedJob.createdBy) };
}

export async function deleteJob(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteJob: boolean }>({
    query: DELETE_JOB,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete job');
  }

  return response.data?.deleteJob || false;
}

export async function fetchJobsByIds(ids: string[]): Promise<Job[]> {
  const jobs: Job[] = [];

  for (const id of ids) {
    try {
      const job = await fetchJob(id);
      if (job) {
        jobs.push(job);
      }
    } catch {
      // Skip failed fetches
      console.warn(`Failed to fetch job ${id}`);
    }
  }

  return jobs;
}

export async function fetchJobLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[],
  pagination?: PaginationParams
): Promise<PaginatedResult<JobLandingPage>> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: JobLandingPage[]; total: number }
  }>({
    query: FIND_JOB_LANDING_PAGES,
    variables: { filters, orderBy, limit: pagination?.limit, offset: pagination?.offset },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch job landing pages');
  }

  return {
    records: response.data?.findLandingPages?.records || [],
    total: response.data?.findLandingPages?.total || 0,
  };
}
