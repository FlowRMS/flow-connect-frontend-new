/**
 * Job Company Links GraphQL Module
 * GraphQL queries and mutations for managing company specifiers and awardees on jobs
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export type JobCompanyRole = 'SPECIFIER' | 'AWARDEE';

export interface JobCompanyLinkCompany {
  id: string;
  name: string;
  companySourceType?: string;
  phone?: string;
  website?: string;
  tags?: string;
  parentCompanyId?: string;
  createdAt?: string;
}

export interface JobCompanyLink {
  id: string;
  jobId: string;
  companyId: string;
  role: JobCompanyRole;
  createdAt: string;
  company: JobCompanyLinkCompany;
}

export interface AddCompanyToJobInput {
  jobId: string;
  companyId: string;
  role: JobCompanyRole;
}

export interface RemoveCompanyFromJobInput {
  jobId: string;
  companyId: string;
  role: JobCompanyRole;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_JOB_COMPANY_LINKS = `
  query GetJobCompanyLinks($jobId: UUID!) {
    jobCompanyLinks(jobId: $jobId) {
      id
      jobId
      companyId
      role
      createdAt
      company {
        id
        name
        companySourceType
        phone
        website
        tags
        parentCompanyId
        createdAt
      }
    }
  }
`;

const GET_JOB_SPECIFIERS = `
  query GetJobSpecifiers($jobId: UUID!) {
    jobSpecifiers(jobId: $jobId) {
      id
      jobId
      companyId
      role
      createdAt
      company {
        id
        name
        companySourceType
        phone
        website
        tags
        parentCompanyId
        createdAt
      }
    }
  }
`;

const GET_JOB_AWARDEES = `
  query GetJobAwardees($jobId: UUID!) {
    jobAwardees(jobId: $jobId) {
      id
      jobId
      companyId
      role
      createdAt
      company {
        id
        name
        companySourceType
        phone
        website
        tags
        parentCompanyId
        createdAt
      }
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const ADD_COMPANY_TO_JOB = `
  mutation AddCompanyToJob($input: AddCompanyToJobInput!) {
    addCompanyToJob(input: $input) {
      id
      jobId
      companyId
      role
      createdAt
      company {
        id
        name
        companySourceType
        phone
        website
        tags
        parentCompanyId
        createdAt
      }
    }
  }
`;

const REMOVE_COMPANY_FROM_JOB = `
  mutation RemoveCompanyFromJob($input: RemoveCompanyFromJobInput!) {
    removeCompanyFromJob(input: $input)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all company links for a job (both specifiers and awardees)
 */
export async function fetchJobCompanyLinks(jobId: string): Promise<JobCompanyLink[]> {
  const response = await crmGraphQLRequest<{ jobCompanyLinks: JobCompanyLink[] }>({
    query: GET_JOB_COMPANY_LINKS,
    variables: { jobId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch job company links');
  }

  return response.data?.jobCompanyLinks || [];
}

/**
 * Fetch only specifier companies for a job
 */
export async function fetchJobSpecifiers(jobId: string): Promise<JobCompanyLink[]> {
  const response = await crmGraphQLRequest<{ jobSpecifiers: JobCompanyLink[] }>({
    query: GET_JOB_SPECIFIERS,
    variables: { jobId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch job specifiers');
  }

  return response.data?.jobSpecifiers || [];
}

/**
 * Fetch only awardee companies for a job
 */
export async function fetchJobAwardees(jobId: string): Promise<JobCompanyLink[]> {
  const response = await crmGraphQLRequest<{ jobAwardees: JobCompanyLink[] }>({
    query: GET_JOB_AWARDEES,
    variables: { jobId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch job awardees');
  }

  return response.data?.jobAwardees || [];
}

/**
 * Add a company to a job as either a specifier or awardee
 */
export async function addCompanyToJob(input: AddCompanyToJobInput): Promise<JobCompanyLink> {
  const response = await crmGraphQLRequest<{ addCompanyToJob: JobCompanyLink }>({
    query: ADD_COMPANY_TO_JOB,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to add company to job');
  }

  if (!response.data?.addCompanyToJob) {
    throw new Error('No link returned from add company mutation');
  }

  return response.data.addCompanyToJob;
}

/**
 * Remove a company from a job
 */
export async function removeCompanyFromJob(input: RemoveCompanyFromJobInput): Promise<boolean> {
  const response = await crmGraphQLRequest<{ removeCompanyFromJob: boolean }>({
    query: REMOVE_COMPANY_FROM_JOB,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to remove company from job');
  }

  return response.data?.removeCompanyFromJob ?? false;
}
