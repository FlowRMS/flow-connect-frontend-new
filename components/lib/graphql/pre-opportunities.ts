/**
 * Pre-Opportunities GraphQL Module
 * GraphQL queries and API functions for Pre-Opportunities
 */

import { crmGraphQLRequest, formatCreatedBy, mapFormattedCreatedBy } from './client';
import type {
  PreOpportunity,
  PreOpportunityLandingPage,
  CreatePreOpportunityInput,
  UpdatePreOpportunityInput,
  ProductSearchResult,
  FactorySearchResult,
  CustomerSearchResult,
  JobSearchResult,
  LandingPageFilter,
  LandingPageOrderBy,
  PaginationParams,
  PaginatedResult,
} from './types';

// Re-export types
export type {
  PreOpportunity,
  PreOpportunityLandingPage,
  PreOpportunityStatus,
  PreOpportunityBalance,
  PreOpportunityProduct,
  PreOpportunityJob,
  PreOpportunityDetail,
  PreOpportunityDetailQuote,
  PreOpportunityDetailInput,
  CreatePreOpportunityInput,
  UpdatePreOpportunityInput,
  ProductSearchResult,
  FactorySearchResult,
  CustomerSearchResult,
  JobSearchResult,
} from './types';

// ============================================================================
// GraphQL Queries
// ============================================================================

const FIND_PRE_OPPORTUNITY_LANDING_PAGES = `
  query FindPreOpportunityLandingPages(
    $filters: [Filter!]
    $orderBy: [OrderBy!]
    $limit: Int
    $offset: Int
  ) {
    findLandingPages(
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
  }
`;

const GET_PRE_OPPORTUNITY = `
  query GetPreOpportunity($id: UUID!) {
    preOpportunity(id: $id) {
      id
      entityNumber
      entityDate
      status
      soldToCustomerId
      billToCustomerId
      soldToCustomerAddressId
      billToCustomerAddressId
      jobId
      job {
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
        createdAt
        status {
          id
          name
        }
        tags
      }
      expDate
      acceptDate
      reviseDate
      customerRef
      paymentTerms
      freightTerms
      tags
      balance {
        id
        quantity
        subtotal
        discount
        discountRate
        total
      }
      details {
        id
        preOpportunityId
        itemNumber
        productId
        productCpnId
        product {
          id
          factoryPartNumber
          description
          unitPrice
          defaultCommissionRate
          commissionDiscountRate
          defaultDivisor
          approvalNeeded
          approvalComments
          approvalDate
          leadTime
          minOrderQty
          published
          tags
          unitPriceDiscountRate
          upc
        }
        quantity
        unitPrice
        subtotal
        discount
        discountRate
        total
        leadTime
        endUserId
        quote {
          id
          quoteNumber
          status
          pipelineStage
          entityDate
          expDate
          createdAt
          published
          versionOf
          url
          reviseDate
          soldToCustomerId
          blanket
          billToCustomerId
          acceptDate
          balanceId
          customerRef
          creationType
          createdById
          duplicatedFrom
          freightTerms
          paymentTerms
        }
      }
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
      createdById
      createdAt
    }
  }
`;

const GET_PRE_OPPORTUNITIES_BY_JOB = `
  query GetPreOpportunitiesByJob($jobId: UUID!) {
    preOpportunitiesByJob(jobId: $jobId) {
      id
      entityNumber
      entityDate
      status
      soldToCustomerId
      billToCustomerId
      soldToCustomerAddressId
      billToCustomerAddressId
      jobId
      expDate
      acceptDate
      reviseDate
      customerRef
      paymentTerms
      freightTerms
      tags
      balance {
        id
        quantity
        subtotal
        discount
        discountRate
        total
      }
      details {
        id
        preOpportunityId
        itemNumber
        productId
        productCpnId
        product {
          id
          factoryPartNumber
          description
          unitPrice
          defaultCommissionRate
          approvalNeeded
          published
        }
        quantity
        unitPrice
        subtotal
        discount
        discountRate
        total
        leadTime
        endUserId
      }
      createdAt
    }
  }
`;

const GET_PRE_OPPORTUNITIES_BY_CUSTOMER = `
  query GetPreOpportunitiesByCustomer($customerId: UUID!) {
    preOpportunitiesByCustomer(customerId: $customerId) {
      id
      entityNumber
      entityDate
      status
      soldToCustomerId
      billToCustomerId
      soldToCustomerAddressId
      billToCustomerAddressId
      jobId
      expDate
      acceptDate
      reviseDate
      customerRef
      paymentTerms
      freightTerms
      tags
      balance {
        id
        quantity
        subtotal
        discount
        discountRate
        total
      }
      details {
        id
        preOpportunityId
        itemNumber
        productId
        productCpnId
        product {
          id
          factoryPartNumber
          description
          unitPrice
          defaultCommissionRate
          approvalNeeded
          published
        }
        quantity
        unitPrice
        subtotal
        discount
        discountRate
        total
        leadTime
        endUserId
      }
      createdAt
    }
  }
`;

const SEARCH_PRODUCTS = `
  query SearchProducts($searchTerm: String!, $factoryId: UUID) {
    productSearch(searchTerm: $searchTerm, factoryId: $factoryId) {
      id
      factoryPartNumber
      description
    }
  }
`;

const SEARCH_FACTORIES = `
  query SearchFactories($searchTerm: String!, $published: Boolean) {
    factorySearch(searchTerm: $searchTerm, published: $published) {
      id
      title
    }
  }
`;

const SEARCH_CUSTOMERS = `
  query SearchCustomers($searchTerm: String!, $published: Boolean) {
    customerSearch(searchTerm: $searchTerm, published: $published) {
      id
      companyName
      parentId

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

const CREATE_PRE_OPPORTUNITY = `
  mutation CreatePreOpportunity($input: PreOpportunityInput!) {
    createPreOpportunity(input: $input) {
      id
      entityNumber
      entityDate
      status
      soldToCustomerId
      billToCustomerId
      soldToCustomerAddressId
      billToCustomerAddressId
      jobId
      job {
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
        createdAt
        status {
          id
          name
        }
        tags
      }
      expDate
      acceptDate
      reviseDate
      customerRef
      paymentTerms
      freightTerms
      tags
      balance {
        id
        quantity
        subtotal
        discount
        discountRate
        total
      }
      details {
        id
        preOpportunityId
        itemNumber
        productId
        productCpnId
        product {
          id
          factoryPartNumber
          description
          unitPrice
          defaultCommissionRate
          commissionDiscountRate
          defaultDivisor
          approvalNeeded
          approvalComments
          approvalDate
          leadTime
          minOrderQty
          published
          tags
          unitPriceDiscountRate
          upc
        }
        quantity
        unitPrice
        subtotal
        discount
        discountRate
        total
        leadTime
        endUserId
        quote {
          id
          quoteNumber
          status
          pipelineStage
          entityDate
          expDate
          createdAt
          published
          versionOf
          url
          reviseDate
          soldToCustomerId
          blanket
          billToCustomerId
          acceptDate
          balanceId
          customerRef
          creationType
          createdById
          duplicatedFrom
          freightTerms
          paymentTerms
        }
      }
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
      createdById
      createdAt
    }
  }
`;

const UPDATE_PRE_OPPORTUNITY = `
  mutation UpdatePreOpportunity($input: PreOpportunityInput!) {
    updatePreOpportunity(input: $input) {
      id
      entityNumber
      entityDate
      status
      soldToCustomerId
      billToCustomerId
      soldToCustomerAddressId
      billToCustomerAddressId
      jobId
      job {
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
        createdAt
        status {
          id
          name
        }
        tags
      }
      expDate
      acceptDate
      reviseDate
      customerRef
      paymentTerms
      freightTerms
      tags
      balance {
        id
        quantity
        subtotal
        discount
        discountRate
        total
      }
      details {
        id
        preOpportunityId
        itemNumber
        productId
        productCpnId
        product {
          id
          factoryPartNumber
          description
          unitPrice
          defaultCommissionRate
          commissionDiscountRate
          defaultDivisor
          approvalNeeded
          approvalComments
          approvalDate
          leadTime
          minOrderQty
          published
          tags
          unitPriceDiscountRate
          upc
        }
        quantity
        unitPrice
        subtotal
        discount
        discountRate
        total
        leadTime
        endUserId
        quote {
          id
          quoteNumber
          status
          pipelineStage
          entityDate
          expDate
          createdAt
          published
          versionOf
          url
          reviseDate
          soldToCustomerId
          blanket
          billToCustomerId
          acceptDate
          balanceId
          customerRef
          creationType
          createdById
          duplicatedFrom
          freightTerms
          paymentTerms
        }
      }
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
      createdById
      createdAt
    }
  }
`;

const DELETE_PRE_OPPORTUNITY = `
  mutation DeletePreOpportunity($id: UUID!) {
    deletePreOpportunity(id: $id)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

export async function fetchPreOpportunityLandingPages(
  filters?: LandingPageFilter[],
  orderBy?: LandingPageOrderBy[],
  pagination?: PaginationParams
): Promise<PaginatedResult<PreOpportunityLandingPage>> {
  // Import the normalization function
  const { normalizePreOpportunitiesStatus } = await import('../../pre-opportunities/utils');

  const response = await crmGraphQLRequest<{
    findLandingPages: { records: PreOpportunityLandingPage[]; total: number }
  }>({
    query: FIND_PRE_OPPORTUNITY_LANDING_PAGES,
    variables: { filters, orderBy, limit: pagination?.limit, offset: pagination?.offset },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch pre-opportunity landing pages');
  }

  const records = response.data?.findLandingPages?.records || [];
  // Normalize status values (convert numeric to string)
  return {
    records: normalizePreOpportunitiesStatus(records),
    total: response.data?.findLandingPages?.total || 0,
  };
}

export async function fetchPreOpportunity(id: string): Promise<PreOpportunity | null> {
  // Import the normalization function
  const { normalizePreOpportunityStatus } = await import('../../pre-opportunities/utils');

  const response = await crmGraphQLRequest<{ preOpportunity: PreOpportunity }>({
    query: GET_PRE_OPPORTUNITY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch pre-opportunity');
  }

  const preOpp = response.data?.preOpportunity;
  // Normalize status value (convert numeric to string)
  if (!preOpp) {
    return null;
  }

  const normalized = normalizePreOpportunityStatus(preOpp);
  return {
    ...normalized,
    createdBy: formatCreatedBy((normalized as any).createdBy),
    job: normalized.job
      ? { ...normalized.job, createdBy: formatCreatedBy((normalized.job as any).createdBy) }
      : normalized.job,
  };
}

export async function fetchPreOpportunitiesByJob(jobId: string): Promise<PreOpportunity[]> {
  // Import the normalization function
  const { normalizePreOpportunitiesStatus } = await import('../../pre-opportunities/utils');

  const response = await crmGraphQLRequest<{ preOpportunitiesByJob: PreOpportunity[] }>({
    query: GET_PRE_OPPORTUNITIES_BY_JOB,
    variables: { jobId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch pre-opportunities by job');
  }

  const records = response.data?.preOpportunitiesByJob || [];
  return normalizePreOpportunitiesStatus(records);
}

export async function fetchPreOpportunitiesByCustomer(customerId: string): Promise<PreOpportunity[]> {
  // Import the normalization function
  const { normalizePreOpportunitiesStatus } = await import('../../pre-opportunities/utils');

  const response = await crmGraphQLRequest<{ preOpportunitiesByCustomer: PreOpportunity[] }>({
    query: GET_PRE_OPPORTUNITIES_BY_CUSTOMER,
    variables: { customerId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch pre-opportunities by customer');
  }

  const records = response.data?.preOpportunitiesByCustomer || [];
  return normalizePreOpportunitiesStatus(records);
}

export async function searchProducts(searchTerm: string, factoryId?: string): Promise<ProductSearchResult[]> {
  const response = await crmGraphQLRequest<{ productSearch: ProductSearchResult[] }>({
    query: SEARCH_PRODUCTS,
    variables: { searchTerm, factoryId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search products');
  }

  return response.data?.productSearch || [];
}

export async function searchFactories(searchTerm: string, published?: boolean): Promise<FactorySearchResult[]> {
  const response = await crmGraphQLRequest<{ factorySearch: FactorySearchResult[] }>({
    query: SEARCH_FACTORIES,
    variables: { searchTerm, published },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search factories');
  }

  return response.data?.factorySearch || [];
}

export async function searchCustomers(searchTerm: string, published?: boolean): Promise<CustomerSearchResult[]> {
  const response = await crmGraphQLRequest<{ customerSearch: CustomerSearchResult[] }>({
    query: SEARCH_CUSTOMERS,
    variables: { searchTerm, published },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search customers');
  }

  return response.data?.customerSearch || [];
}

export async function searchJobs(searchTerm: string): Promise<JobSearchResult[]> {
  const response = await crmGraphQLRequest<{ jobSearch: JobSearchResult[] }>({
    query: SEARCH_JOBS,
    variables: { searchTerm },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search jobs');
  }

  return mapFormattedCreatedBy(response.data?.jobSearch);
}

export async function createPreOpportunity(input: CreatePreOpportunityInput): Promise<PreOpportunity> {
  const response = await crmGraphQLRequest<{ createPreOpportunity: PreOpportunity }>({
    query: CREATE_PRE_OPPORTUNITY,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create pre-opportunity');
  }

  if (!response.data?.createPreOpportunity) {
    throw new Error('No pre-opportunity returned from create mutation');
  }

  const preOpp = response.data.createPreOpportunity;
  return {
    ...preOpp,
    createdBy: formatCreatedBy((preOpp as any).createdBy),
    job: preOpp.job ? { ...preOpp.job, createdBy: formatCreatedBy((preOpp.job as any).createdBy) } : preOpp.job,
  };
}

export async function updatePreOpportunity(input: UpdatePreOpportunityInput): Promise<PreOpportunity> {
  const response = await crmGraphQLRequest<{ updatePreOpportunity: PreOpportunity }>({
    query: UPDATE_PRE_OPPORTUNITY,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update pre-opportunity');
  }

  if (!response.data?.updatePreOpportunity) {
    throw new Error('No pre-opportunity returned from update mutation');
  }

  const preOpp = response.data.updatePreOpportunity;
  return {
    ...preOpp,
    createdBy: formatCreatedBy((preOpp as any).createdBy),
    job: preOpp.job ? { ...preOpp.job, createdBy: formatCreatedBy((preOpp.job as any).createdBy) } : preOpp.job,
  };
}

export async function deletePreOpportunity(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deletePreOpportunity: boolean }>({
    query: DELETE_PRE_OPPORTUNITY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete pre-opportunity');
  }

  return response.data?.deletePreOpportunity || false;
}
