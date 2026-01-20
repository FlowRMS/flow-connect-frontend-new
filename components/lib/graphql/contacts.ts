/**
 * Contacts GraphQL Module
 * GraphQL queries and API functions for Contacts
 */

import { crmGraphQLRequest, mapFormattedCreatedBy } from './client';
import type {
  Contact,
  ContactInput,
  UpdateContactInput,
  ContactLandingPage,
  Job,
  LandingPageFilter,
  LandingPageOrderBy,
  PaginationParams,
  PaginatedResult,
} from './types';

// Re-export types
export type { Contact, ContactInput, UpdateContactInput, ContactLandingPage };

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_CONTACTS = `
  query GetContacts {
    contacts {
      id
      firstName
      lastName
      email
      phone
      role
      companyId
      notes
      tags
      territory
      createdAt
    }
  }
`;

const GET_CONTACT = `
  query GetContact($id: UUID!) {
    contact(id: $id) {
      id
      firstName
      lastName
      email
      phone
      role
      notes
      tags
      territory
      createdAt
    }
  }
`;

const GET_CONTACTS_BY_COMPANY = `
  query GetContactsByCompany($companyId: UUID!) {
    contactsByCompany(companyId: $companyId) {
      id
      firstName
      lastName
      email
      phone
      role
      notes
      tags
      territory
      createdAt
    }
  }
`;

const GET_CONTACTS_BY_QUOTE = `
  query GetContactsByQuote($quoteId: UUID!) {
    contactsByQuote(quoteId: $quoteId) {
      id
      firstName
      lastName
      email
      phone
      role
      notes
      tags
      territory
      createdAt
    }
  }
`;

const GET_JOBS_BY_COMPANY = `
  query GetJobsByCompany($companyId: UUID!) {
    jobsByCompany(companyId: $companyId) {
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

const GET_JOBS_BY_CONTACT = `
  query GetJobsByContact($contactId: UUID!) {
    jobsByContact(contactId: $contactId) {
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

const CREATE_CONTACT = `
  mutation CreateContact($input: ContactInput!) {
    createContact(input: $input) {
      id
      firstName
      lastName
      email
      phone
      role
      notes
      tags
      territory
      createdAt
    }
  }
`;

const UPDATE_CONTACT = `
  mutation UpdateContact($id: UUID!, $input: ContactInput!) {
    updateContact(id: $id, input: $input) {
      id
      firstName
      lastName
      email
      phone
      role
      notes
      tags
      territory
      createdAt
    }
  }
`;

const DELETE_CONTACT = `
  mutation DeleteContact($id: UUID!) {
    deleteContact(id: $id)
  }
`;

const FIND_CONTACT_LANDING_PAGES = `
  query FindContactLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
    $limit: Int
    $offset: Int
  ) {
    findLandingPages(
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
          tags
        }
      }
      total
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

export async function fetchContacts(): Promise<Contact[]> {
  const response = await crmGraphQLRequest<{ contacts: Contact[] }>({
    query: GET_CONTACTS,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch contacts');
  }

  return response.data?.contacts || [];
}

export async function fetchContact(id: string): Promise<Contact | null> {
  const response = await crmGraphQLRequest<{ contact: Contact }>({
    query: GET_CONTACT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch contact');
  }

  return response.data?.contact || null;
}

export async function fetchContactsByCompanyId(companyId: string): Promise<Contact[]> {
  const response = await crmGraphQLRequest<{ contactsByCompany: Contact[] }>({
    query: GET_CONTACTS_BY_COMPANY,
    variables: { companyId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch contacts by company');
  }

  return response.data?.contactsByCompany || [];
}

export async function fetchContactsByQuoteId(quoteId: string): Promise<Contact[]> {
  const response = await crmGraphQLRequest<{ contactsByQuote: Contact[] }>({
    query: GET_CONTACTS_BY_QUOTE,
    variables: { quoteId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch contacts by quote');
  }

  return response.data?.contactsByQuote || [];
}

export async function fetchJobsByCompanyId(companyId: string): Promise<Job[]> {
  const response = await crmGraphQLRequest<{ jobsByCompany: Job[] }>({
    query: GET_JOBS_BY_COMPANY,
    variables: { companyId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch jobs by company');
  }

  return mapFormattedCreatedBy(response.data?.jobsByCompany);
}

export async function fetchJobsByContactId(contactId: string): Promise<Job[]> {
  const response = await crmGraphQLRequest<{ jobsByContact: Job[] }>({
    query: GET_JOBS_BY_CONTACT,
    variables: { contactId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch jobs by contact');
  }

  return mapFormattedCreatedBy(response.data?.jobsByContact);
}

export async function createContact(input: ContactInput): Promise<Contact> {
  // Filter out empty string values that would cause UUID validation errors
  const cleanInput = { ...input };
  if (cleanInput.companyId === '') {
    delete cleanInput.companyId;
  }
  if (cleanInput.role === '') {
    delete cleanInput.role;
  }

  const response = await crmGraphQLRequest<{ createContact: Contact }>({
    query: CREATE_CONTACT,
    variables: { input: cleanInput },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create contact');
  }

  if (!response.data?.createContact) {
    throw new Error('No contact returned from create mutation');
  }

  return response.data.createContact;
}

export async function updateContact(id: string, input: UpdateContactInput): Promise<Contact> {
  const response = await crmGraphQLRequest<{ updateContact: Contact }>({
    query: UPDATE_CONTACT,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update contact');
  }

  if (!response.data?.updateContact) {
    throw new Error('No contact returned from update mutation');
  }

  return response.data.updateContact;
}

export async function deleteContact(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteContact: boolean }>({
    query: DELETE_CONTACT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete contact');
  }

  return response.data?.deleteContact || false;
}

export async function fetchContactLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[],
  pagination?: PaginationParams
): Promise<PaginatedResult<ContactLandingPage>> {
  const response = await crmGraphQLRequest<{
    findLandingPages: { records: ContactLandingPage[]; total: number }
  }>({
    query: FIND_CONTACT_LANDING_PAGES,
    variables: { filters, orderBy, limit: pagination?.limit, offset: pagination?.offset },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch contact landing pages');
  }

  return {
    records: response.data?.findLandingPages?.records || [],
    total: response.data?.findLandingPages?.total || 0,
  };
}
