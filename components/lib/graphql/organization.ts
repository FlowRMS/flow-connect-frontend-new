/**
 * Organization GraphQL Module
 * GraphQL queries and mutations for organization settings
 */

import { crmGraphQLRequest } from './client';

// ============================================================================
// Types
// ============================================================================

export interface Organization {
  id: string;
  companyName: string;
  streetAddress: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  emailAddress: string;
  phoneNumber: string;
  logoFileId: string | null;
  logoHeight: number | null;
  logoWidth: number | null;
}

export interface OrganizationInput {
  companyName: string;
  streetAddress: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  emailAddress: string;
  phoneNumber: string;
  logoFileId?: string;
  logoHeight?: number;
  logoWidth?: number;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_ORGANIZATION = `
  query GetOrganization {
    organization {
      id
      companyName
      streetAddress
      addressLine2
      city
      state
      zipCode
      emailAddress
      phoneNumber
      logoFileId
      logoHeight
      logoWidth
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_ORGANIZATION = `
  mutation CreateOrganization($input: OrganizationInput!) {
    createOrganization(input: $input) {
      id
      companyName
      streetAddress
      addressLine2
      city
      state
      zipCode
      emailAddress
      phoneNumber
      logoFileId
      logoHeight
      logoWidth
    }
  }
`;

const UPDATE_ORGANIZATION = `
  mutation UpdateOrganization($input: OrganizationInput!) {
    updateOrganization(input: $input) {
      id
      companyName
      streetAddress
      addressLine2
      city
      state
      zipCode
      emailAddress
      phoneNumber
      logoFileId
      logoHeight
      logoWidth
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch the organization settings
 */
export async function fetchOrganization(): Promise<Organization | null> {
  const response = await crmGraphQLRequest<{ organization: Organization | null }>({
    query: GET_ORGANIZATION,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch organization');
  }

  return response.data?.organization || null;
}

/**
 * Create organization settings
 */
export async function createOrganization(input: OrganizationInput): Promise<Organization> {
  const response = await crmGraphQLRequest<{ createOrganization: Organization }>({
    query: CREATE_ORGANIZATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create organization');
  }

  if (!response.data?.createOrganization) {
    throw new Error('No organization returned from create mutation');
  }

  return response.data.createOrganization;
}

/**
 * Update organization settings
 */
export async function updateOrganization(input: OrganizationInput): Promise<Organization> {
  const response = await crmGraphQLRequest<{ updateOrganization: Organization }>({
    query: UPDATE_ORGANIZATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update organization');
  }

  if (!response.data?.updateOrganization) {
    throw new Error('No organization returned from update mutation');
  }

  return response.data.updateOrganization;
}
