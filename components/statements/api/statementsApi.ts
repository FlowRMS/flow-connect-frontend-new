/**
 * Statements API Module
 * GraphQL queries and mutations for statements management
 */

import { crmGraphQLRequest, formatCreatedBy, type CreatedByResponse } from '@/components/lib/graphql/client';
import type { FilterOperator } from '@/components/advancedFilters/types';

// ============================================================================
// Types
// ============================================================================

export type StatementCreationType = 'MANUAL' | 'IMPORT' | 'API' | 'DUPLICATION';

export interface StatementOutsideSplitRate {
  id?: string;
  userId: string;
  splitRate: string;
  position: number;
  statementDetailId?: string;
  user?: {
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    inside?: boolean;
    outside?: boolean;
  };
}

export interface StatementBalance {
  id: string;
  commission?: number;
  commissionDiscount?: number;
  commissionDiscountRate?: number;
  commissionRate?: number;
  discount?: number;
  discountRate?: number;
  quantity?: number;
  subtotal?: number;
  total?: number;
}

export interface StatementDetail {
  id: string;
  itemNumber?: number;
  quantity?: string;
  unitPrice?: string;
  uomId?: string;
  uom?: {
    id: string;
    title?: string;
    description?: string;
    divisionFactor?: number;
  };
  soldToCustomerId?: string;
  soldToCustomer?: {
    id: string;
    companyName?: string;
    isParent?: boolean;
    parentId?: string;
    buyingGroupId?: string;
    published?: boolean;
    territoryId?: string;
  };
  endUserId?: string;
  endUser?: {
    id: string;
    companyName?: string;
    isParent?: boolean;
    parentId?: string;
    buyingGroupId?: string;
    published?: boolean;
    territoryId?: string;
  };
  productId?: string;
  product?: {
    id: string;
    factoryPartNumber?: string;
    description?: string;
    unitPrice?: number;
    defaultCommissionRate?: number;
    defaultDivisor?: number;
    approvalNeeded?: boolean;
    approvalComments?: string;
    approvalDate?: string;
    commissionDiscountRate?: number;
    unitPriceDiscountRate?: number;
    leadTime?: string;
    minOrderQty?: number;
    tags?: string;
    upc?: string;
    published?: boolean;
  };
  productNameAdhoc?: string;
  productDescriptionAdhoc?: string;
  orderId?: string;
  order?: {
    id: string;
    orderNumber?: string;
  };
  invoiceId?: string;
  invoice?: {
    id: string;
    invoiceNumber?: string;
  };
  note?: string;
  leadTime?: string;
  divisionFactor?: string;
  commissionRate?: string;
  commissionDiscountRate?: string;
  discountRate?: string;
  outsideSplitRates?: StatementOutsideSplitRate[];
  // Calculated fields
  commission?: number;
  commissionDiscount?: number;
  discount?: number;
  subtotal?: number;
  total?: number;
  totalLineCommission?: number;
  statementId?: string;
}

export interface StatementFactory {
  id: string;
  title?: string;
  published?: boolean;
  phone?: string;
  paymentTerms?: string;
  overallDiscountRate?: number;
  logoId?: string;
  leadTime?: string;
  freightTerms?: string;
  freightDiscountType?: string;
  externalPaymentTerms?: string;
  email?: string;
  baseCommissionRate?: number;
  commissionDiscountRate?: number;
  additionalInformation?: string;
  accountNumber?: string;
}

export interface Statement {
  id: string;
  statementNumber: string;
  entityDate: string;
  factoryId: string;
  factory?: StatementFactory;
  creationType: StatementCreationType;
  createdAt?: string;
  createdById?: string;
  createdBy?: string | CreatedByResponse;
  balanceId?: string;
  balance?: StatementBalance;
  details?: StatementDetail[];
  url?: string;
}

export interface StatementLandingPage {
  id: string;
  statementNumber?: string;
  entityDate?: string;
  factoryName?: string;
  commission?: number;
  total?: number;
  createdAt?: string;
  createdBy?: string;
  userIds?: string[];
}

export interface StatementLandingPageFilter {
  columnName: string;
  operator: FilterOperator;
  value?: string;
  values?: string[];
}

export interface StatementLandingPageOrderBy {
  columnName: string;
  direction: 'ASC' | 'DESC';
}

export interface PaginatedStatementsResult {
  records: StatementLandingPage[];
  total: number;
}

// Input types for mutations
export interface StatementOutsideSplitRateInput {
  id?: string;
  userId: string;
  splitRate: string;
  position: number;
}

export interface StatementDetailInput {
  id?: string;
  itemNumber?: number;
  quantity?: string;
  unitPrice?: string;
  uomId?: string;
  soldToCustomerId?: string;
  endUserId?: string;
  productId?: string;
  productNameAdhoc?: string;
  productDescriptionAdhoc?: string;
  orderId?: string;
  invoiceId?: string;
  note?: string;
  leadTime?: string;
  divisionFactor?: string;
  commissionRate?: string;
  commissionDiscountRate?: string;
  discountRate?: string;
  outsideSplitRates?: StatementOutsideSplitRateInput[];
}

export interface StatementInput {
  id?: string;
  statementNumber: string;
  entityDate: string;
  factoryId: string;
  creationType: StatementCreationType;
  details?: StatementDetailInput[];
}

// Alias for backward compatibility
export type CreateStatementInput = StatementInput;
export type UpdateStatementInput = StatementInput;

// ============================================================================
// GraphQL Queries
// ============================================================================

const FIND_LANDING_PAGES_STATEMENTS = `
  query FindStatementsLandingPages($filters: [Filter!], $limit: Int, $orderBy: [OrderBy!], $offset: Int) {
    findLandingPages(
      sourceType: STATEMENTS
      filters: $filters
      limit: $limit
      offset: $offset
      orderBy: $orderBy
    ) {
      records {
        ... on StatementLandingPage {
          id
          commission
          createdAt
          createdBy
          entityDate
          factoryName
          statementNumber
          total
          userIds
        }
      }
      total
    }
  }
`;

const GET_STATEMENT = `
  query GetStatement($id: UUID!) {
    statement(id: $id) {
      id
      statementNumber
      entityDate
      factoryId
      factory {
        id
        title
        published
        phone
        paymentTerms
        overallDiscountRate
        logoId
        leadTime
        freightTerms
        freightDiscountType
        externalPaymentTerms
        email
        baseCommissionRate
        commissionDiscountRate
        additionalInformation
        accountNumber
      }
      creationType
      createdAt
      createdById
      createdBy {
        id
        email
        firstName
        lastName
        fullName
      }
      balanceId
      balance {
        id
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        quantity
        subtotal
        total
      }
      url
      details {
        id
        itemNumber
        quantity
        unitPrice
        uomId
        uom {
          id
          title
          description
          divisionFactor
        }
        soldToCustomerId
        soldToCustomer {
          id
          companyName
          isParent
          parentId
          buyingGroupId
          published
          territoryId
        }
        endUserId
        endUser {
          id
          companyName
          isParent
          parentId
          buyingGroupId
          published
          territoryId
        }
        productId
        product {
          id
          factoryPartNumber
          description
          unitPrice
          defaultCommissionRate
          defaultDivisor
          approvalNeeded
          approvalComments
          approvalDate
          commissionDiscountRate
          unitPriceDiscountRate
          leadTime
          minOrderQty
          tags
          upc
          published
        }
        productNameAdhoc
        productDescriptionAdhoc
        orderId
        order {
          id
          orderNumber
        }
        invoiceId
        invoice {
          id
          invoiceNumber
        }
        note
        leadTime
        divisionFactor
        commissionRate
        commissionDiscountRate
        discountRate
        commission
        commissionDiscount
        discount
        subtotal
        total
        totalLineCommission
        statementId
        outsideSplitRates {
          id
          userId
          splitRate
          position
          statementDetailId
          user {
            id
            fullName
            firstName
            lastName
            email
            inside
            outside
          }
        }
      }
    }
  }
`;

const STATEMENT_SEARCH = `
  query StatementSearch($searchTerm: String!, $limit: Int) {
    statementSearch(searchTerm: $searchTerm, limit: $limit) {
      id
      statementNumber
      entityDate
      factoryId
      creationType
      createdAt
      createdById
      balanceId
      url
    }
  }
`;

const CREATE_STATEMENT = `
  mutation CreateStatement($input: StatementInput!) {
    createStatement(input: $input) {
      id
      statementNumber
      entityDate
      factoryId
      factory {
        id
        title
        published
        phone
        paymentTerms
        overallDiscountRate
        logoId
        leadTime
        freightTerms
        freightDiscountType
        externalPaymentTerms
        email
        baseCommissionRate
        commissionDiscountRate
        additionalInformation
        accountNumber
      }
      creationType
      createdAt
      createdById
      createdBy {
        id
        email
        firstName
        lastName
        fullName
      }
      balanceId
      balance {
        id
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        quantity
        subtotal
        total
      }
      url
      details {
        id
        itemNumber
        quantity
        unitPrice
        uomId
        uom {
          id
          title
          description
          divisionFactor
        }
        soldToCustomerId
        soldToCustomer {
          id
          companyName
          isParent
          parentId
          buyingGroupId
          published
          territoryId
        }
        endUserId
        endUser {
          id
          companyName
          isParent
          parentId
          buyingGroupId
          published
          territoryId
        }
        productId
        product {
          id
          factoryPartNumber
          description
          unitPrice
          defaultCommissionRate
          defaultDivisor
          approvalNeeded
          approvalComments
          approvalDate
          commissionDiscountRate
          unitPriceDiscountRate
          leadTime
          minOrderQty
          tags
          upc
          published
        }
        productNameAdhoc
        productDescriptionAdhoc
        orderId
        order {
          id
          orderNumber
        }
        invoiceId
        invoice {
          id
          invoiceNumber
        }
        note
        leadTime
        divisionFactor
        commissionRate
        commissionDiscountRate
        discountRate
        commission
        commissionDiscount
        discount
        subtotal
        total
        totalLineCommission
        statementId
        outsideSplitRates {
          id
          userId
          splitRate
          position
          statementDetailId
          user {
            id
            fullName
            firstName
            lastName
            email
            inside
            outside
          }
        }
      }
    }
  }
`;

const UPDATE_STATEMENT = `
  mutation UpdateStatement($input: StatementInput!) {
    updateStatement(input: $input) {
      id
      statementNumber
      entityDate
      factoryId
      factory {
        id
        title
        published
        phone
        paymentTerms
        overallDiscountRate
        logoId
        leadTime
        freightTerms
        freightDiscountType
        externalPaymentTerms
        email
        baseCommissionRate
        commissionDiscountRate
        additionalInformation
        accountNumber
      }
      creationType
      createdAt
      createdById
      createdBy {
        id
        email
        firstName
        lastName
        fullName
      }
      balanceId
      balance {
        id
        commission
        commissionDiscount
        commissionDiscountRate
        commissionRate
        discount
        discountRate
        quantity
        subtotal
        total
      }
      url
      details {
        id
        itemNumber
        quantity
        unitPrice
        uomId
        uom {
          id
          title
          description
          divisionFactor
        }
        soldToCustomerId
        soldToCustomer {
          id
          companyName
          isParent
          parentId
          buyingGroupId
          published
          territoryId
        }
        endUserId
        endUser {
          id
          companyName
          isParent
          parentId
          buyingGroupId
          published
          territoryId
        }
        productId
        product {
          id
          factoryPartNumber
          description
          unitPrice
          defaultCommissionRate
          defaultDivisor
          approvalNeeded
          approvalComments
          approvalDate
          commissionDiscountRate
          unitPriceDiscountRate
          leadTime
          minOrderQty
          tags
          upc
          published
        }
        productNameAdhoc
        productDescriptionAdhoc
        orderId
        order {
          id
          orderNumber
        }
        invoiceId
        invoice {
          id
          invoiceNumber
        }
        note
        leadTime
        divisionFactor
        commissionRate
        commissionDiscountRate
        discountRate
        commission
        commissionDiscount
        discount
        subtotal
        total
        totalLineCommission
        statementId
        outsideSplitRates {
          id
          userId
          splitRate
          position
          statementDetailId
          user {
            id
            fullName
            firstName
            lastName
            email
            inside
            outside
          }
        }
      }
    }
  }
`;

const DELETE_STATEMENT = `
  mutation DeleteStatement($id: UUID!) {
    deleteStatement(id: $id)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch statements with pagination using findLandingPages
 */
export async function fetchStatementsWithPagination(
  filters?: StatementLandingPageFilter[],
  orderBy?: StatementLandingPageOrderBy[],
  pagination?: { limit?: number; offset?: number }
): Promise<PaginatedStatementsResult> {
  const response = await crmGraphQLRequest<{
    findLandingPages: {
      records: StatementLandingPage[];
      total: number;
    };
  }>({
    query: FIND_LANDING_PAGES_STATEMENTS,
    variables: {
      filters: filters || [],
      orderBy: orderBy?.[0] || { columnName: 'entityDate', direction: 'DESC' },
      limit: pagination?.limit ?? 50,
      offset: pagination?.offset ?? 0,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch statements');
  }

  return {
    records: response.data?.findLandingPages?.records || [],
    total: response.data?.findLandingPages?.total || 0,
  };
}

/**
 * Fetch a single statement by ID
 */
export async function fetchStatementById(id: string): Promise<Statement | null> {
  const response = await crmGraphQLRequest<{ statement: Statement }>({
    query: GET_STATEMENT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch statement');
  }

  const statement = response.data?.statement;
  if (statement && statement.createdBy) {
    return {
      ...statement,
      createdBy: formatCreatedBy(statement.createdBy as CreatedByResponse),
    };
  }

  return statement || null;
}

/**
 * Search statements
 */
export async function searchStatements(
  searchTerm: string,
  limit: number = 20
): Promise<Statement[]> {
  const response = await crmGraphQLRequest<{ statementSearch: Statement[] }>({
    query: STATEMENT_SEARCH,
    variables: { searchTerm, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search statements');
  }

  return response.data?.statementSearch || [];
}

/**
 * Create a new statement
 */
export async function createStatement(input: StatementInput): Promise<Statement> {
  const response = await crmGraphQLRequest<{ createStatement: Statement }>({
    query: CREATE_STATEMENT,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create statement');
  }

  if (!response.data?.createStatement) {
    throw new Error('Failed to create statement');
  }

  return response.data.createStatement;
}

/**
 * Update an existing statement
 */
export async function updateStatement(input: StatementInput): Promise<Statement> {
  const response = await crmGraphQLRequest<{ updateStatement: Statement }>({
    query: UPDATE_STATEMENT,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update statement');
  }

  if (!response.data?.updateStatement) {
    throw new Error('Failed to update statement');
  }

  return response.data.updateStatement;
}

/**
 * Delete a statement
 */
export async function deleteStatement(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteStatement: boolean }>({
    query: DELETE_STATEMENT,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete statement');
  }

  return response.data?.deleteStatement ?? false;
}

/**
 * Fetch all statement IDs for bulk operations
 */
export async function fetchAllStatementIds(
  filters?: StatementLandingPageFilter[]
): Promise<string[]> {
  // Fetch a large batch to get all IDs
  const result = await fetchStatementsWithPagination(filters, undefined, {
    limit: 10000,
    offset: 0,
  });

  return result.records.map((r) => r.id);
}
