/**
 * Manufacturer GraphQL SDK
 * 
 * Handles manufacturer search and creation operations.
 * Uses the graphql-request client pattern established in the codebase.
 */

import { requestGraphQL } from '../graphqlClient';
import type {
  OrganizationLiteResponse,
  ManufacturerInput,
  ManufacturerSearchResult,
  CreateOrganizationResult,
  CreateConnectionResult,
  InviteConnectionResult,
} from './types';

// ============================================
// QUERIES
// ============================================

const ManufacturerSearchQuery = `
  query connectionSearch(
    $searchTerm: String!
    $active: Boolean
    $flowConnectMember: Boolean
    $connected: Boolean
    $limit: Int!
    $repFirms: Boolean
  ) {
    connectionSearch(
      searchTerm: $searchTerm
      active: $active
      flowConnectMember: $flowConnectMember
      connected: $connected
      limit: $limit
      repFirms: $repFirms
    ) {
      id
      name
      domain
      members
      posContactsCount
      posContacts {
        id
        name
        email
      }
      flowConnectMember
      connectionStatus
      agreement {
        id
        connectedOrgId
        fileName
        fileSize
        presignedUrl
        createdAt
      }
    }
  }
`;

// ============================================
// MUTATIONS
// ============================================

const CreateOrganizationMutation = `
  mutation CreateOrganization($input: ManufacturerInput!) {
    createOrganization(input: $input) {
      id
      name
      domain
      members
      posContactsCount
      posContacts {
        id
        name
        email
      }
      flowConnectMember
      connectionStatus
    }
  }
`;

const CreateConnectionMutation = `
  mutation CreateConnection($targetOrgId: ID!, $draft: Boolean!) {
    createConnection(targetOrgId: $targetOrgId, draft: $draft)
  }
`;

const InviteConnectionMutation = `
  mutation InviteConnection($targetOrgId: ID!) {
    inviteConnection(targetOrgId: $targetOrgId)
  }
`;

// ============================================
// SDK FUNCTIONS
// ============================================

export interface ManufacturerSearchOptions {
  searchTerm: string;
  active?: boolean;
  flowConnectMember?: boolean | null;
  connected?: boolean | null;
  limit?: number;
  repFirms?: boolean;
}

/**
 * Search for organizations (manufacturers/distributors or rep firms) by name/domain with optional filters.
 * Returns an array of matching organizations.
 * @param options.repFirms - Set to true to search rep firms, false (default) for manufacturers/distributors
 */
export async function searchOrganizations(
  options: ManufacturerSearchOptions,
  token?: string
): Promise<OrganizationLiteResponse[]> {
  const { searchTerm, active = true, flowConnectMember = null, connected = null, limit = 20, repFirms = false } = options;

  try {
    const result = await requestGraphQL<ManufacturerSearchResult>(
      ManufacturerSearchQuery,
      {
        searchTerm,
        active,
        flowConnectMember,
        connected,
        limit,
        repFirms,
      },
      token
    );
    return result.connectionSearch;
  } catch (error) {
    console.error('searchOrganizations failed:', error);
    throw error;
  }
}

/**
 * Create a new manufacturer organization.
 * Used when a manufacturer doesn't exist in the directory.
 */
export async function createOrganization(
  input: ManufacturerInput,
  token?: string
): Promise<OrganizationLiteResponse> {
  try {
    const result = await requestGraphQL<CreateOrganizationResult>(
      CreateOrganizationMutation,
      { input },
      token
    );
    return result.createOrganization;
  } catch (error) {
    console.error('createOrganization failed:', error);
    throw error;
  }
}

/**
 * Create a connection to another organization.
 * Set draft=true to create without sending an invitation.
 */
export async function createConnection(
  targetOrgId: string,
  draft: boolean = false,
  token?: string
): Promise<boolean> {
  try {
    const result = await requestGraphQL<CreateConnectionResult>(
      CreateConnectionMutation,
      { targetOrgId, draft },
      token
    );
    return result.createConnection;
  } catch (error) {
    console.error('createConnection failed:', error);
    throw error;
  }
}

/**
 * Send an invitation to an existing connection.
 * Use this after creating a draft connection.
 */
export async function inviteConnection(
  targetOrgId: string,
  token?: string
): Promise<boolean> {
  try {
    const result = await requestGraphQL<InviteConnectionResult>(
      InviteConnectionMutation,
      { targetOrgId },
      token
    );
    return result.inviteConnection;
  } catch (error) {
    console.error('inviteConnection failed:', error);
    throw error;
  }
}
