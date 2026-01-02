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

const GET_JOB_RELATED_ENTITIES = `
  query GetJobRelatedEntities($jobId: UUID!) {
    jobRelatedEntities(jobId: $jobId) {
      checks {
        checkNumber
        commissionMonth
        createdAt
        createdById
        creationType
        details {
          adjustment {
            amount
            adjustmentNumber
            createdAt
            createdById
            creationType
            customer {
              companyName
              id
              isParent
              parentId
              published
            }
            entityDate
            factory {
              accountNumber
              id
              title
            }
            factoryId
            id
            locked
            reason
            status
          }
          adjustmentId
          appliedAmount
          checkId
          credit {
            balanceId
            createdAt
            createdById
            creationType
            creditType
            creditNumber
            entityDate
            locked
            id
            orderId
            reason
            status
            url
          }
          creditId
          id
          invoice {
            balanceId
            createdAt
            createdById
            creationType
            dueDate
            entityDate
            id
            invoiceNumber
            locked
            orderId
            published
            status
            url
          }
          invoiceId
        }
        enteredCommissionAmount
        entityDate
        factory {
          accountNumber
          id
          title
        }
        factoryId
        id
        postDate
        status
        url
      }
      companies {
        companySourceType
        createdAt
        createdBy {
          email
          authProviderId
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
          username
          role
        }
        id
        insideReps {
          customerId
          id
          repType
          position
          splitRate
          user {
            email
            firstName
            fullName
            id
            lastName
          }
        }
        isParent
        outsideReps {
          customerId
          id
          position
          repType
          splitRate
          user {
            email
            firstName
            fullName
            id
            lastName
          }
        }
        parentId
        published
      }
      invoices {
        balanceId
        createdAt
        createdById
        creationType
        dueDate
        entityDate
        id
        invoiceNumber
        locked
        orderId
        published
        status
        url
      }
      factories {
        accountNumber
        additionalInformation
        baseCommissionRate
        commissionDiscountRate
        createdBy {
          email
          firstName
          fullName
          id
          lastName
        }
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
        splitRates {
          factoryId
          id
          position
          splitRate
          user {
            email
            firstName
            fullName
            id
            lastName
          }
        }
        title
      }
      orders {
        balanceId
        balance {
          cancelledBalance
          commission
          commissionDiscount
          commissionDiscountRate
          commissionRate
          discountRate
          discount
          freightChargeBalance
          id
          quantity
          shippingBalance
          subtotal
          total
        }
        billToCustomer {
          companyName
          id
          isParent
          parentId
          published
        }
        billToCustomerId
        createdAt
        createdBy {
          email
          firstName
          fullName
          id
          lastName
        }
        createdById
        creationType
        details {
          cancelledBalance
          commission
          commissionDiscountRate
          commissionDiscount
          commissionRate
          discount
          discountRate
          endUserId
          freightCharge
          id
          insideSplitRates {
            id
            position
            splitRate
            userId
          }
          itemNumber
          leadTime
          note
          orderId
          outsideSplitRates {
            id
            position
            userId
            splitRate
          }
          product {
            description
            factoryPartNumber
            id
            unitPrice
          }
          productDescriptionAdhoc
          productId
          productNameAdhoc
          quantity
          shippingBalance
          status
          subtotal
          total
          totalLineCommission
          unitPrice
          uom {
            description
            divisionFactor
            id
            title
          }
        }
        dueDate
        endUserPerLineItem
        entityDate
        factSoNumber
        factoryId
        freightTerms
        headerStatus
        id
        insidePerLineItem
        job {
          id
          jobName
          jobType
        }
        markNumber
        orderNumber
        orderType
        outsidePerLineItem
        published
        quoteId
        shipDate
        projectedShipDate
        shippingTerms
        soldToCustomer {
          companyName
          id
          isParent
          parentId
          published
        }
        soldToCustomerId
        status
        url
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
      products {
        approvalComments
        approvalDate
        approvalNeeded
        category {
          commissionRate
          factoryId
          id
          title
        }
        commissionDiscountRate
        defaultCommissionRate
        description
        defaultDivisor
        factory {
          accountNumber
          id
          title
        }
        factoryPartNumber
        id
        leadTime
        minOrderQty
        published
        tags
        unitPrice
        unitPriceDiscountRate
        uom {
          description
          divisionFactor
          id
          title
        }
        upc
      }
      quotes {
        acceptDate
        balance {
          commission
          commissionDiscount
          commissionDiscountRate
          commissionRate
          discount
          id
          discountRate
          quantity
          subtotal
          total
        }
        balanceId
        billToCustomer {
          companyName
          isParent
          id
          parentId
          published
        }
        billToCustomerId
        blanket
        createdAt
        createdBy {
          email
          firstName
          id
          fullName
          lastName
        }
        createdById
        creationType
        customerRef
        details {
          commission
          commissionDiscount
          commissionDiscountRate
          commissionRate
          discount
          discountRate
          endUserId
          factoryId
          id
          insideSplitRates {
            id
            position
            splitRate
            userId
          }
          itemNumber
          leadTime
          note
          outsideSplitRates {
            id
            position
            splitRate
            userId
          }
          product {
            description
            factoryPartNumber
            id
            unitPrice
          }
          uom {
            description
            divisionFactor
            id
            title
          }
          unitPrice
          totalLineCommission
          total
          subtotal
          status
          quoteId
          quantity
          productNameAdhoc
          productId
          productDescriptionAdhoc
        }
        versionOf
        url
        status
        soldToCustomerId
        soldToCustomer {
          published
          parentId
          isParent
          id
          companyName
        }
        reviseDate
        quoteNumber
        published
        pipelineStage
        paymentTerms
        outsidePerLineItem
        job {
          jobName
          jobType
          id
        }
        insidePerLineItem
        id
        freightTerms
        expDate
        entityDate
        endUserPerLineItem
        duplicatedFrom
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
    customers: [],
    factories: [],
    products: [],
    preOpportunities: [],
    quotes: [],
    orders: [],
    invoices: [],
    checks: [],
  };

  return {
    companies: mapFormattedCreatedBy(data.companies) as Company[],
    contacts: data.contacts || [],
    customers: data.customers || [],
    factories: data.factories || [],
    products: data.products || [],
    preOpportunities: data.preOpportunities || [],
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
