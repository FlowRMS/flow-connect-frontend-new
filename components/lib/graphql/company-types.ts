/**
 * Company Types GraphQL Module
 * GraphQL queries and API functions for managing Company Types
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export interface CompanyType {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CreateCompanyTypeInput {
  name: string;
  displayOrder?: number;
}

export interface UpdateCompanyTypeInput {
  name?: string;
  displayOrder?: number;
  isActive?: boolean;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_COMPANY_TYPES = `
  query GetCompanyTypes($includeInactive: Boolean! = false) {
    companyTypes(includeInactive: $includeInactive) {
      id
      name
      displayOrder
      isActive
    }
  }
`;

const GET_COMPANY_TYPE = `
  query GetCompanyType($id: UUID!) {
    companyType(id: $id) {
      id
      name
      displayOrder
      isActive
    }
  }
`;

const CREATE_COMPANY_TYPE = `
  mutation CreateCompanyType($input: CompanyTypeInput!) {
    createCompanyType(input: $input) {
      id
      name
      displayOrder
      isActive
    }
  }
`;

const UPDATE_COMPANY_TYPE = `
  mutation UpdateCompanyType($id: UUID!, $input: CompanyTypeInput!) {
    updateCompanyType(id: $id, input: $input) {
      id
      name
      displayOrder
      isActive
    }
  }
`;

const DELETE_COMPANY_TYPE = `
  mutation DeleteCompanyType($id: UUID!) {
    deleteCompanyType(id: $id)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all company types
 */
export async function fetchCompanyTypes(includeInactive: boolean = false): Promise<CompanyType[]> {
  const response = await crmGraphQLRequest<{ companyTypes: CompanyType[] }>({
    query: GET_COMPANY_TYPES,
    variables: { includeInactive },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch company types');
  }

  return response.data?.companyTypes || [];
}

/**
 * Fetch a single company type by ID
 */
export async function fetchCompanyType(id: string): Promise<CompanyType | null> {
  const response = await crmGraphQLRequest<{ companyType: CompanyType }>({
    query: GET_COMPANY_TYPE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch company type');
  }

  return response.data?.companyType || null;
}

/**
 * Create a new company type
 */
export async function createCompanyType(input: CreateCompanyTypeInput): Promise<CompanyType> {
  const response = await crmGraphQLRequest<{ createCompanyType: CompanyType }>({
    query: CREATE_COMPANY_TYPE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create company type');
  }

  if (!response.data?.createCompanyType) {
    throw new Error('No company type returned from create mutation');
  }

  return response.data.createCompanyType;
}

/**
 * Update an existing company type
 */
export async function updateCompanyType(id: string, input: UpdateCompanyTypeInput): Promise<CompanyType> {
  const response = await crmGraphQLRequest<{ updateCompanyType: CompanyType }>({
    query: UPDATE_COMPANY_TYPE,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update company type');
  }

  if (!response.data?.updateCompanyType) {
    throw new Error('No company type returned from update mutation');
  }

  return response.data.updateCompanyType;
}

/**
 * Delete a company type (soft delete)
 */
export async function deleteCompanyType(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteCompanyType: boolean }>({
    query: DELETE_COMPANY_TYPE,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete company type');
  }

  return true;
}
