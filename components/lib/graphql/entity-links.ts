/**
 * Entity Links GraphQL Module
 * GraphQL queries and API functions for Entity Links
 *
 * Search functions are imported from the central search API (lib/api/search.ts)
 */

import { crmGraphQLRequest, mapFormattedCreatedBy } from './client';
import type {
  CRMEntityType,
  EntityLink,
  CreateLinkInput,
  DeleteLinkByEntitiesInput,
  JobRelatedEntities,
  ContactRelatedEntities,
  NoteLink,
  Company,
  Contact,
  PreOpportunity,
} from './types';

// Re-export types
export type {
  CRMEntityType,
  EntityLink,
  CreateLinkInput,
  DeleteLinkByEntitiesInput,
  JobRelatedEntities,
  ContactRelatedEntities,
  NoteLink,
};

// Re-export search functions and types from central search API
export {
  searchTasks,
  searchNotes,
  searchQuotes,
  searchOrders,
  searchInvoices,
  searchChecks,
  type TaskSearchResult,
  type NoteSearchResult,
  type QuoteSearchResult,
  type OrderSearchResult,
  type InvoiceSearchResult,
  type CheckSearchResult,
} from '../api/search';

// ============================================================================
// GraphQL Queries and Mutations
// ============================================================================

const CREATE_LINK = `
  mutation CreateLink(
    $sourceEntityType: EntityType!
    $sourceEntityId: UUID!
    $targetEntityType: EntityType!
    $targetEntityId: UUID!
  ) {
    createLink(input: {
      sourceEntityType: $sourceEntityType
      sourceEntityId: $sourceEntityId
      targetEntityType: $targetEntityType
      targetEntityId: $targetEntityId
    }) {
      id
      sourceEntityType
      sourceEntityId
      targetEntityType
      targetEntityId
      createdAt
    }
  }
`;

const DELETE_LINK = `
  mutation DeleteLink($id: UUID!) {
    deleteLink(id: $id)
  }
`;

const DELETE_LINK_BY_ENTITIES = `
  mutation DeleteLinkByEntities(
    $sourceEntityType: EntityType!
    $sourceEntityId: UUID!
    $targetEntityType: EntityType!
    $targetEntityId: UUID!
  ) {
    deleteLinkByEntities(input: {
      sourceEntityType: $sourceEntityType
      sourceEntityId: $sourceEntityId
      targetEntityType: $targetEntityType
      targetEntityId: $targetEntityId
    })
  }
`;

const GET_JOB_RELATED_ENTITIES = `
  query GetJobRelatedEntities($jobId: UUID!) {
    jobRelatedEntities(jobId: $jobId) {
      checks {
        checkNumber
        commission
        commissionMonth
        createdBy
        creationType
        entityDate
        entryDate
        factoryId
        id
        postDate
        status
        userOwnerIds
      }
      companies {
        companySourceType
        createdAt
        createdBy {
          email
          firstName
          fullName
          id
          lastName
        }
        id
        name
        parentCompanyId
        phone
        tags
        website
      }
      contacts {
        territory
        tags
        role
        phone
        notes
        lastName
        id
        firstName
        email
        createdAt
      }
      invoices {
        balanceId
        createdBy
        creationType
        dueDate
        entityDate
        factoryId
        entryDate
        id
        invoiceNumber
        locked
        orderId
        published
        status
        userOwnerIds
      }
      orders {
        balanceId
        billToCustomerId
        dueDate
        entityDate
        entryDate
        factSoNumber
        factoryId
        id
        jobName
        orderNumber
        shipDate
        soldToCustomerId
        status
        userOwnerIds
      }
      preOpportunities {
        acceptDate
        billToCustomerAddressId
        billToCustomerId
        createdAt
        createdById
        customerRef
        entityDate
        entityNumber
        expDate
        freightTerms
        id
        jobId
        paymentTerms
        reviseDate
        soldToCustomerAddressId
        soldToCustomerId
        status
        tags
      }
      quotes {
        billToCustomerId
        createdBy
        blanket
        entityDate
        entryDate
        expDate
        id
        jobName
        quoteNumber
        soldToCustomerId
        userOwnerIds
      }
    }
  }
`;

const GET_CONTACT_RELATED_ENTITIES = `
  query GetContactRelatedEntities($contactId: UUID!) {
    contactRelatedEntities(contactId: $contactId) {
      companies {
        companySourceType
        createdAt
        createdBy {
          email
          firstName
          fullName
          id
          lastName
        }
        id
        name
        parentCompanyId
        phone
        tags
        website
      }
    }
  }
`;

const GET_LINKS_BY_SOURCE = `
  query GetLinksBySource($sourceEntityType: EntityType!, $sourceEntityId: UUID!) {
    linksBySource(sourceEntityType: $sourceEntityType, sourceEntityId: $sourceEntityId) {
      id
      sourceEntityType
      sourceEntityId
      targetEntityType
      targetEntityId
      createdAt
      createdBy
    }
  }
`;

const GET_NOTES_BY_ENTITY = `
  query GetNotesByEntity($entityId: UUID!, $entityType: EntityType!) {
    notesByEntity(entityId: $entityId, entityType: $entityType) {
      id
      title
      content
      mentions
      tags
      createdBy {
        email
        firstName
        fullName
        id
        lastName
      }
      createdAt
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

export async function createLink(input: CreateLinkInput): Promise<EntityLink> {
  const response = await crmGraphQLRequest<{ createLink: EntityLink }>({
    query: CREATE_LINK,
    variables: {
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create link');
  }

  if (!response.data?.createLink) {
    throw new Error('No link returned from create mutation');
  }

  return response.data.createLink;
}

export async function deleteLink(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteLink: boolean }>({
    query: DELETE_LINK,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete link');
  }

  return response.data?.deleteLink || false;
}

export async function deleteLinkByEntities(input: DeleteLinkByEntitiesInput): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteLinkByEntities: boolean }>({
    query: DELETE_LINK_BY_ENTITIES,
    variables: {
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete link by entities');
  }

  return response.data?.deleteLinkByEntities || false;
}

export async function fetchJobRelatedEntities(jobId: string): Promise<JobRelatedEntities> {
  const response = await crmGraphQLRequest<{ jobRelatedEntities: JobRelatedEntities }>({
    query: GET_JOB_RELATED_ENTITIES,
    variables: { jobId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch job related entities');
  }

  const data = response.data?.jobRelatedEntities || {
    companies: [],
    contacts: [],
    preOpportunities: [],
    quotes: [],
    orders: [],
    invoices: [],
    checks: [],
  };

  return {
    companies: mapFormattedCreatedBy(data.companies) as Company[],
    contacts: mapFormattedCreatedBy(data.contacts) as Contact[],
    preOpportunities: mapFormattedCreatedBy(data.preOpportunities) as PreOpportunity[],
    quotes: data.quotes || [],
    orders: data.orders || [],
    invoices: data.invoices || [],
    checks: data.checks || [],
  };
}

export async function fetchContactRelatedEntities(contactId: string): Promise<ContactRelatedEntities> {
  const response = await crmGraphQLRequest<{ contactRelatedEntities: ContactRelatedEntities }>({
    query: GET_CONTACT_RELATED_ENTITIES,
    variables: { contactId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch contact related entities');
  }

  const data = response.data?.contactRelatedEntities || {
    companies: [],
  };

  return {
    companies: mapFormattedCreatedBy(data.companies) as Company[],
  };
}

export async function fetchLinksBySource(sourceEntityType: CRMEntityType, sourceEntityId: string): Promise<NoteLink[]> {
  const response = await crmGraphQLRequest<{ linksBySource: NoteLink[] }>({
    query: GET_LINKS_BY_SOURCE,
    variables: { sourceEntityType, sourceEntityId },
  });

  if (response.errors) {
    // If the query doesn't exist, return empty array
    console.warn('Failed to fetch links by source:', response.errors[0]?.message);
    return [];
  }

  return response.data?.linksBySource || [];
}

// Note type for fetchNotesByEntity
interface Note {
  id: string;
  title: string;
  content: string;
  mentions: string;
  tags: string;
  createdBy: string;
  createdAt: string;
}

export async function fetchNotesByEntity(entityId: string, entityType: CRMEntityType): Promise<Note[]> {
  const response = await crmGraphQLRequest<{ notesByEntity: Note[] }>({
    query: GET_NOTES_BY_ENTITY,
    variables: { entityId, entityType },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch notes by entity');
  }

  return mapFormattedCreatedBy(response.data?.notesByEntity);
}
