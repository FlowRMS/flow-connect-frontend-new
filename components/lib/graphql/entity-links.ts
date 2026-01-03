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
  NoteLink,
  RelatedEntities,
  RelatedEntitiesSourceType,
} from './types';

// Re-export types
export type {
  CRMEntityType,
  EntityLink,
  CreateLinkInput,
  DeleteLinkByEntitiesInput,
  NoteLink,
  RelatedEntities,
  RelatedEntitiesSourceType,
} from './types';

// Re-export related entity types for consumers
export type {
  RelatedEntityCheck,
  RelatedEntityCompany,
  RelatedEntityContact,
  RelatedEntityCustomer,
  RelatedEntityFactory,
  RelatedEntityInvoice,
  RelatedEntityJob,
  RelatedEntityNote,
  RelatedEntityOrder,
  RelatedEntityPreOpportunity,
  RelatedEntityProduct,
  RelatedEntityQuote,
  RelatedEntityTask,
} from './types';

// Re-export extended job related entity types
export type {
  JobRelatedQuote,
  JobRelatedOrder,
  JobRelatedInvoice,
  JobRelatedCheck,
  JobRelatedCustomer,
  JobRelatedFactory,
  JobRelatedProduct,
  BalanceLite,
  CustomerLite,
  FactoryLite,
  UserLite,
  OrderQuoteDetail,
  CheckDetail,
} from './types';

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
// Generic Related Entities Query (Centralized for all entity types)
// ============================================================================

const GET_RELATED_ENTITIES = `
  query GetRelatedEntities($entityId: UUID!, $sourceType: LandingSourceType!) {
    relatedEntities(entityId: $entityId, sourceType: $sourceType) {
      sourceType
      sourceEntityId
      checks {
        checkNumber
        commissionMonth
        createdById
        createdAt
        creationType
        enteredCommissionAmount
        factoryId
        entityDate
        id
        postDate
        status
        url
      }
      companies {
        companySourceType
        createdAt
        id
        name
        parentCompanyId
        phone
        tags
        website
      }
      contacts {
        createdAt
        email
        firstName
        id
        lastName
        notes
        phone
        role
        tags
        territory
      }
      customers {
        companyName
        id
        isParent
        parentId
        published
      }
      factories {
        accountNumber
        additionalInformation
        baseCommissionRate
        commissionDiscountRate
        email
        externalPaymentTerms
        freightDiscountType
        freightTerms
        id
        leadTime
        logoId
        overallDiscountRate
        paymentTerms
        phone
        published
        title
      }
      invoices {
        balanceId
        createdAt
        createdById
        creationType
        dueDate
        entityDate
        invoiceNumber
        id
        locked
        orderId
        published
        status
        url
      }
      jobs {
        additionalInformation
        createdAt
        endDate
        description
        id
        jobName
        jobType
        requesterId
        startDate
        structuralDetails
        tags
        structuralInformation
      }
      notes {
        content
        createdAt
        createdBy {
          authProviderId
          email
          enabled
          firstName
          fullName
          id
          inside
          lastName
          outside
          role
          username
        }
        id
        mentions
        tags
        title
      }
      orders {
        balanceId
        billToCustomerId
        createdAt
        createdById
        creationType
        dueDate
        endUserPerLineItem
        factSoNumber
        entityDate
        url
        status
        soldToCustomerId
        shippingTerms
        quoteId
        shipDate
        published
        projectedShipDate
        outsidePerLineItem
        orderType
        orderNumber
        markNumber
        insidePerLineItem
        id
        headerStatus
        freightTerms
        factoryId
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
        tags
        status
      }
      products {
        approvalComments
        approvalDate
        approvalNeeded
        commissionDiscountRate
        defaultCommissionRate
        defaultDivisor
        description
        factoryPartNumber
        id
        leadTime
        minOrderQty
        published
        tags
        unitPrice
        unitPriceDiscountRate
        upc
      }
      quotes {
        acceptDate
        balanceId
        billToCustomerId
        blanket
        createdAt
        createdById
        creationType
        customerRef
        duplicatedFrom
        endUserPerLineItem
        entityDate
        expDate
        freightTerms
        id
        insidePerLineItem
        outsidePerLineItem
        paymentTerms
        pipelineStage
        published
        quoteNumber
        reviseDate
        soldToCustomerId
        status
        url
        versionOf
      }
      tasks {
        assignedToId
        createdAt
        createdBy {
          authProviderId
          email
          enabled
          firstName
          fullName
          inside
          id
          lastName
          outside
          role
          username
        }
        description
        dueDate
        id
        priority
        reminderDate
        status
        tags
        title
      }
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

// ============================================================================
// Centralized Related Entities API
// This is the main function for fetching related entities from any entity type.
// Use this instead of entity-specific functions like fetchJobRelatedEntities.
// ============================================================================

/**
 * Fetches all related entities for a given entity.
 * This is a centralized endpoint that works with any entity type.
 *
 * @param entityId - The UUID of the source entity
 * @param sourceType - The type of the source entity (e.g., 'JOBS', 'CONTACTS', etc.)
 * @returns RelatedEntities containing all related data
 */
export async function fetchRelatedEntities(
  entityId: string,
  sourceType: RelatedEntitiesSourceType
): Promise<RelatedEntities> {
  const response = await crmGraphQLRequest<{ relatedEntities: RelatedEntities }>({
    query: GET_RELATED_ENTITIES,
    variables: { entityId, sourceType },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch related entities');
  }

  const data = response.data?.relatedEntities;

  // Return with defaults for all arrays
  return {
    sourceType: data?.sourceType || sourceType,
    sourceEntityId: data?.sourceEntityId || entityId,
    checks: data?.checks || [],
    companies: data?.companies || [],
    contacts: data?.contacts || [],
    customers: data?.customers || [],
    factories: data?.factories || [],
    invoices: data?.invoices || [],
    jobs: data?.jobs || [],
    notes: mapFormattedCreatedBy(data?.notes) || [],
    orders: data?.orders || [],
    preOpportunities: data?.preOpportunities || [],
    products: data?.products || [],
    quotes: data?.quotes || [],
    tasks: mapFormattedCreatedBy(data?.tasks) || [],
  };
}
