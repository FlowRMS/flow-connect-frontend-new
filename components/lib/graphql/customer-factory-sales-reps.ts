/**
 * Customer Factory Sales Rep GraphQL Module
 * Manages sales rep assignments for customer-factory pairs
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export interface CustomerFactorySalesRepCustomer {
  id: string;
  companyName: string;
  isParent?: boolean;
  parentId?: string;
  published?: boolean;
}

export interface CustomerFactorySalesRepFactory {
  id: string;
  title: string;
  accountNumber?: string;
  additionalInformation?: string;
  baseCommissionRate?: string;
  commissionDiscountRate?: string;
  email?: string;
  externalPaymentTerms?: string;
  freightDiscountType?: string;
  freightTerms?: string;
  leadTime?: number;
  logoId?: string;
  overallDiscountRate?: string;
  paymentTerms?: number;
  phone?: string;
  published?: boolean;
}

export interface CustomerFactorySalesRepUser {
  id: string;
  authProviderId?: string;
  email?: string;
  enabled?: boolean;
  firstName?: string;
  fullName?: string;
  inside?: boolean;
  lastName?: string;
  outside?: boolean;
  role?: string;
  username?: string;
}

export interface CustomerFactorySalesRep {
  id: string;
  customerId: string;
  factoryId: string;
  userId: string;
  rate: string;
  position: number;
  customer?: CustomerFactorySalesRepCustomer;
  factory?: CustomerFactorySalesRepFactory;
  user?: CustomerFactorySalesRepUser;
}

export interface CustomerFactorySalesRepInput {
  customerId: string;
  factoryId: string;
  userId: string;
  rate: string;
  position: number;
}

export interface UpdateCustomerFactorySalesRepInput extends CustomerFactorySalesRepInput {
  id: string;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const LIST_CUSTOMER_FACTORY_SALES_REPS = `
  query ListCustomerFactorySalesReps($customerId: UUID, $factoryId: UUID) {
    listCustomerFactorySalesReps(customerId: $customerId, factoryId: $factoryId) {
      id
      customerId
      factoryId
      userId
      rate
      position
      customer {
        id
        companyName
        isParent
        parentId
        published
      }
      factory {
        id
        title
        accountNumber
        additionalInformation
        baseCommissionRate
        commissionDiscountRate
        email
        externalPaymentTerms
        freightDiscountType
        freightTerms
        leadTime
        logoId
        overallDiscountRate
        paymentTerms
        phone
        published
      }
      user {
        id
        authProviderId
        email
        enabled
        firstName
        fullName
        inside
        lastName
        outside
        role
        username
      }
    }
  }
`;

const GET_CUSTOMER_FACTORY_SALES_REP = `
  query GetCustomerFactorySalesRep($id: UUID!) {
    customerFactorySalesRep(id: $id) {
      id
      customerId
      factoryId
      userId
      rate
      position
      customer {
        id
        companyName
        isParent
        parentId
        published
      }
      factory {
        id
        title
        accountNumber
        additionalInformation
        baseCommissionRate
        commissionDiscountRate
        email
        externalPaymentTerms
        freightDiscountType
        freightTerms
        leadTime
        logoId
        overallDiscountRate
        paymentTerms
        phone
        published
      }
      user {
        id
        authProviderId
        email
        enabled
        firstName
        fullName
        inside
        lastName
        outside
        role
        username
      }
    }
  }
`;

const CREATE_CUSTOMER_FACTORY_SALES_REP = `
  mutation CreateCustomerFactorySalesRep($input: CustomerFactorySalesRepInput!) {
    createCustomerFactorySalesRep(input: $input) {
      id
      customerId
      factoryId
      userId
      rate
      position
      customer {
        id
        companyName
        isParent
        parentId
        published
      }
      factory {
        id
        title
        accountNumber
        published
      }
      user {
        id
        email
        firstName
        fullName
        lastName
        inside
        outside
        role
      }
    }
  }
`;

const UPDATE_CUSTOMER_FACTORY_SALES_REP = `
  mutation UpdateCustomerFactorySalesRep($id: UUID!, $input: CustomerFactorySalesRepInput!) {
    updateCustomerFactorySalesRep(id: $id, input: $input) {
      id
      customerId
      factoryId
      userId
      rate
      position
      customer {
        id
        companyName
        isParent
        parentId
        published
      }
      factory {
        id
        title
        accountNumber
        published
      }
      user {
        id
        email
        firstName
        fullName
        lastName
        inside
        outside
        role
      }
    }
  }
`;

const DELETE_CUSTOMER_FACTORY_SALES_REP = `
  mutation DeleteCustomerFactorySalesRep($id: UUID!) {
    deleteCustomerFactorySalesRep(id: $id)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * List customer factory sales reps with optional filters
 */
export async function listCustomerFactorySalesReps(
  customerId?: string,
  factoryId?: string
): Promise<CustomerFactorySalesRep[]> {
  const response = await crmGraphQLRequest<{
    listCustomerFactorySalesReps: CustomerFactorySalesRep[];
  }>({
    query: LIST_CUSTOMER_FACTORY_SALES_REPS,
    variables: {
      customerId: customerId || undefined,
      factoryId: factoryId || undefined
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to list customer factory sales reps');
  }

  return response.data?.listCustomerFactorySalesReps || [];
}

/**
 * Get a single customer factory sales rep by ID
 */
export async function getCustomerFactorySalesRep(id: string): Promise<CustomerFactorySalesRep | null> {
  const response = await crmGraphQLRequest<{
    customerFactorySalesRep: CustomerFactorySalesRep;
  }>({
    query: GET_CUSTOMER_FACTORY_SALES_REP,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to get customer factory sales rep');
  }

  return response.data?.customerFactorySalesRep || null;
}

/**
 * Create a new customer factory sales rep
 */
export async function createCustomerFactorySalesRep(
  input: CustomerFactorySalesRepInput
): Promise<CustomerFactorySalesRep> {
  const response = await crmGraphQLRequest<{
    createCustomerFactorySalesRep: CustomerFactorySalesRep;
  }>({
    query: CREATE_CUSTOMER_FACTORY_SALES_REP,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create customer factory sales rep');
  }

  if (!response.data?.createCustomerFactorySalesRep) {
    throw new Error('No data returned from create operation');
  }

  return response.data.createCustomerFactorySalesRep;
}

/**
 * Update an existing customer factory sales rep
 */
export async function updateCustomerFactorySalesRep(
  input: UpdateCustomerFactorySalesRepInput
): Promise<CustomerFactorySalesRep> {
  const { id, ...inputWithoutId } = input;
  const response = await crmGraphQLRequest<{
    updateCustomerFactorySalesRep: CustomerFactorySalesRep;
  }>({
    query: UPDATE_CUSTOMER_FACTORY_SALES_REP,
    variables: { id, input: inputWithoutId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update customer factory sales rep');
  }

  if (!response.data?.updateCustomerFactorySalesRep) {
    throw new Error('No data returned from update operation');
  }

  return response.data.updateCustomerFactorySalesRep;
}

/**
 * Delete a customer factory sales rep
 */
export async function deleteCustomerFactorySalesRep(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{
    deleteCustomerFactorySalesRep: boolean;
  }>({
    query: DELETE_CUSTOMER_FACTORY_SALES_REP,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete customer factory sales rep');
  }

  return response.data?.deleteCustomerFactorySalesRep || false;
}
