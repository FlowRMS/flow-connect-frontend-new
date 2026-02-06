/**
 * Organization Aliases GraphQL SDK
 * 
 * Handles CRUD operations for organization aliases.
 * Aliases are used to map different names/variations to the same organization.
 */

import { requestGraphQL } from '../graphqlClient';
import type {
  OrganizationAliasGroupResponse,
  OrganizationAliasResponse,
  CreateOrganizationAliasInput,
  BulkCreateOrganizationAliasesResponse,
  OrganizationAliasesResult,
  CreateOrganizationAliasResult,
  DeleteOrganizationAliasResult,
  BulkSpreadsheetCreateOrganizationAliasesResult,
} from './types';

// ============================================
// QUERIES
// ============================================

const OrganizationAliasesQuery = `
  query OrganizationAliases {
    organizationAliases {
      connectedOrgId
      connectedOrgName
      aliases {
        id
        connectedOrgId
        connectedOrgName
        alias
        createdAt
      }
    }
  }
`;

// ============================================
// MUTATIONS
// ============================================

const CreateOrganizationAliasMutation = `
  mutation CreateOrganizationAlias($input: CreateOrganizationAliasInput!) {
    createOrganizationAlias(input: $input) {
      id
      connectedOrgId
      connectedOrgName
      alias
      createdAt
    }
  }
`;

const DeleteOrganizationAliasMutation = `
  mutation DeleteOrganizationAlias($id: ID!) {
    deleteOrganizationAlias(id: $id)
  }
`;

const BulkSpreadsheetCreateOrganizationAliasesMutation = `
  mutation BulkSpreadsheetCreateOrganizationAliases($file: Upload!) {
    bulkSpreadsheetCreateOrganizationAliases(file: $file) {
      insertedCount
      failures {
        rowNumber
        organizationName
        alias
        reason
      }
    }
  }
`;

// ============================================
// SDK FUNCTIONS
// ============================================

/**
 * Fetch all organization aliases grouped by organization.
 * Returns aliases organized by the connected organization.
 */
export async function getOrganizationAliases(
  token?: string
): Promise<OrganizationAliasGroupResponse[]> {
  try {
    const result = await requestGraphQL<OrganizationAliasesResult>(
      OrganizationAliasesQuery,
      {},
      token
    );
    return result.organizationAliases;
  } catch (error) {
    console.error('getOrganizationAliases failed:', error);
    throw error;
  }
}

/**
 * Create a new alias for an organization.
 * The alias is a string that maps to the specified organization.
 */
export async function createOrganizationAlias(
  input: CreateOrganizationAliasInput,
  token?: string
): Promise<OrganizationAliasResponse> {
  try {
    const result = await requestGraphQL<CreateOrganizationAliasResult>(
      CreateOrganizationAliasMutation,
      { input },
      token
    );
    return result.createOrganizationAlias;
  } catch (error) {
    console.error('createOrganizationAlias failed:', error);
    throw error;
  }
}

/**
 * Delete an organization alias by ID.
 * Returns true if deletion was successful.
 */
export async function deleteOrganizationAlias(
  id: string,
  token?: string
): Promise<boolean> {
  try {
    const result = await requestGraphQL<DeleteOrganizationAliasResult>(
      DeleteOrganizationAliasMutation,
      { id },
      token
    );
    return result.deleteOrganizationAlias;
  } catch (error) {
    console.error('deleteOrganizationAlias failed:', error);
    throw error;
  }
}

/**
 * Bulk create organization aliases from a spreadsheet file.
 * Supports CSV or Excel formats. Returns count of successful inserts and any failures.
 * 
 * Note: This uses GraphQL multipart upload. The graphql-request library
 * handles file uploads automatically when a File object is passed.
 */
export async function bulkCreateOrganizationAliases(
  file: File,
  token?: string
): Promise<BulkCreateOrganizationAliasesResponse> {
  try {
    const result = await requestGraphQL<BulkSpreadsheetCreateOrganizationAliasesResult>(
      BulkSpreadsheetCreateOrganizationAliasesMutation,
      { file },
      token
    );
    return result.bulkSpreadsheetCreateOrganizationAliases;
  } catch (error) {
    console.error('bulkCreateOrganizationAliases failed:', error);
    throw error;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Flatten grouped aliases into a single array.
 * Useful for searching across all aliases.
 */
export function flattenAliases(
  groups: OrganizationAliasGroupResponse[]
): OrganizationAliasResponse[] {
  return groups.flatMap(group => group.aliases);
}

/**
 * Find all aliases for a specific organization.
 */
export function findAliasesForOrganization(
  groups: OrganizationAliasGroupResponse[],
  connectedOrgId: string
): OrganizationAliasResponse[] {
  const group = groups.find(g => g.connectedOrgId === connectedOrgId);
  return group?.aliases ?? [];
}

/**
 * Check if an alias already exists (case-insensitive).
 */
export function aliasExists(
  groups: OrganizationAliasGroupResponse[],
  alias: string
): boolean {
  const normalizedAlias = alias.toLowerCase().trim();
  return groups.some(group =>
    group.aliases.some(a => a.alias.toLowerCase().trim() === normalizedAlias)
  );
}
