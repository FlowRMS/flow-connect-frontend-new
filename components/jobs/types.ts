/**
 * Job Types and Interfaces
 */

import type { Job as APIJob, JobLandingPage, JobStatus } from '../lib/crm-graphql';

// UI Job type (display format)
export interface Job {
  id: string;
  name: string;
  status: string;
  type: string;
  value: string;
  startDate: string;
  endDate: string;
  gc: string;
  ec: string;
  owner: string;
  description: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  // Additional fields from GetJob endpoint
  additionalInformation: string;
  structuralInformation: string;
  structuralDetails: string;
  requesterId: string;
}

// Job Stage for Kanban
export interface JobStage {
  name: string;
}

// Duplicate group type
export interface DuplicateGroup {
  id: string;
  jobs: Job[];
  reason: string;
}

// Rep type configuration
export type RepType = 'electrical' | 'plumbing' | 'hvac' | 'building-materials';

export interface RepTypeConfig {
  label: string;
  contactTypes: string[];
}

export interface CompanyTypeConfig {
  companyTypes: string[];
}

// Connected entities types
export interface CompanyEntity {
  id: string;
  name: string;
  companyType: string;
  contacts: number;
}

export interface ContactEntity {
  id: string;
  name: string;
  role: string;
  company: string;
  phone: string;
  contactType: string;
}

export interface GenericEntity {
  id: string;
  name: string;
  value: string;
  date: string;
  status: string;
}

export interface DocumentEntity {
  id: string;
  name: string;
  size: string;
  date: string;
  type: string;
}

export interface ConnectedEntities {
  companies: CompanyEntity[];
  contacts: ContactEntity[];
  'pre-opportunities': GenericEntity[];
  quotes: GenericEntity[];
  orders: GenericEntity[];
  invoices: GenericEntity[];
  checks: GenericEntity[];
  documents: DocumentEntity[];
}

// Company details type
export interface CompanyContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  department: string;
}

export interface CompanyJob {
  id: string;
  name: string;
  value: string;
  status: string;
  role: string;
}

export interface CompanyDetails {
  id: string;
  name: string;
  companyType: string;
  address: string;
  phone: string;
  website: string;
  linkedin?: string;
  contacts: CompanyContact[];
  activeJobs: CompanyJob[];
  notes?: string;
}

// View mode type
export type ViewMode = 'kanban' | 'list';

// Merge strategy type
export type MergeStrategy = 'keep' | 'combine';

/**
 * Mapper function to convert API data to UI format
 */
export function mapLandingPageToUIJob(landingPage: JobLandingPage): Job {
  const jobType = landingPage.jobType || 'General';
  
  // Parse tags from API - same logic as mapAPIJobToUIJob
  let parsedTags: string[] = [];
  if (landingPage.tags) {
    if (typeof landingPage.tags === 'string') {
      parsedTags = landingPage.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else if (Array.isArray(landingPage.tags)) {
      parsedTags = landingPage.tags.flatMap(tag => 
        tag.split(',').map(t => t.trim())
      ).filter(tag => tag.length > 0);
    }
  }
  
  return {
    id: landingPage.id,
    name: landingPage.jobName,
    status: landingPage.statusName || 'Backlog',
    type: jobType,
    value: '-',
    startDate: landingPage.startDate || '-',
    endDate: landingPage.endDate || '-',
    gc: '-',
    ec: '-',
    owner: landingPage.jobOwner || landingPage.createdBy || 'Unknown',
    description: landingPage.description || '',
    tags: parsedTags,
    createdBy: landingPage.createdBy || '',
    createdAt: landingPage.createdAt || '',
    // Landing page doesn't have these fields, so use defaults
    additionalInformation: '',
    structuralInformation: '',
    structuralDetails: '',
    requesterId: '',
  };
}

/**
 * Mapper function to convert full API Job to UI format
 */
export function mapAPIJobToUIJob(apiJob: APIJob): Job {
  const jobType = apiJob.jobType || 'General';
  
  // Parse tags from API - can be string, array, or undefined
  let parsedTags: string[] = [];
  if (apiJob.tags) {
    if (typeof apiJob.tags === 'string') {
      // If it's a string, split by comma
      parsedTags = apiJob.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else if (Array.isArray(apiJob.tags)) {
      // If it's already an array, flatten any comma-separated values
      parsedTags = apiJob.tags.flatMap(tag => 
        tag.split(',').map(t => t.trim())
      ).filter(tag => tag.length > 0);
    }
  }
  
  return {
    id: apiJob.id,
    name: apiJob.jobName,
    status: apiJob.status?.name || 'Backlog',
    type: jobType,
    value: '-',
    startDate: apiJob.startDate || '-',
    endDate: apiJob.endDate || '-',
    gc: '-',
    ec: '-',
    owner: apiJob.createdBy || 'Unknown',
    description: apiJob.description || '',
    tags: parsedTags,
    createdBy: apiJob.createdBy || '',
    createdAt: apiJob.createdAt || '',
    // Additional fields from GetJob endpoint
    additionalInformation: apiJob.additionalInformation || '',
    structuralInformation: apiJob.structuralInformation || '',
    structuralDetails: apiJob.structuralDetails || '',
    requesterId: apiJob.requesterId || '',
  };
}
