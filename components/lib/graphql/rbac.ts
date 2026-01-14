/**
 * RBAC GraphQL Module
 * Queries and mutations for Role-Based Access Control (RBAC) permissions
 */

import { crmGraphQLRequest, type GraphQLResponse } from './client';

// ============================================================================
// Types
// ============================================================================

export type RbacRoleEnum =
  | 'OWNER'
  | 'ADMINISTRATOR'
  | 'INSIDE_REP'
  | 'OUTSIDE_REP'
  | 'WAREHOUSE_MANAGER'
  | 'WAREHOUSE_EMPLOYEE'
  | 'DRIVER';

export type RbacPrivilegeTypeEnum = 'VIEW' | 'WRITE' | 'DELETE';

export type RbacPrivilegeOptionEnum = 'OWN' | 'ALL';

export interface RbacPrivilege {
  privilege: RbacPrivilegeTypeEnum;
  option: RbacPrivilegeOptionEnum;
}

export interface RbacRole {
  roleName: RbacRoleEnum;
  privileges: RbacPrivilege[];
}

export interface RbacGridResource {
  resource: string;
  roles: RbacRole[];
}

export interface RoleCommissionSetting {
  role: RbacRoleEnum;
  commission: boolean;
}

// Response types
export interface GetRbacGridResponse {
  getRbacGrid: RbacGridResource[];
}

export interface GetRoleSettingsResponse {
  getRoleSettings: RoleCommissionSetting[];
}

export interface UpdateRbacGridResponse {
  updateRbacGrid: RbacGridResource[];
}

export interface UpdateCommissionVisibilityResponse {
  updateCommissionVisibility: RoleCommissionSetting;
}

// ============================================================================
// Queries
// ============================================================================

const GET_RBAC_GRID_QUERY = `
  query GetRbacGrid {
    getRbacGrid {
      resource
      roles {
        privileges {
          option
          privilege
        }
        roleName
      }
    }
  }
`;

const GET_ROLE_SETTINGS_QUERY = `
  query GetRoleSettings {
    getRoleSettings {
      commission
      role
    }
  }
`;

// ============================================================================
// Mutations
// ============================================================================

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch the complete RBAC permissions grid
 */
export async function fetchRbacGrid(): Promise<RbacGridResource[]> {
  const response: GraphQLResponse<GetRbacGridResponse> = await crmGraphQLRequest({
    query: GET_RBAC_GRID_QUERY,
  });

  if (response.errors?.length) {
    throw new Error(response.errors[0].message);
  }

  return response.data?.getRbacGrid || [];
}

/**
 * Fetch role commission visibility settings
 */
export async function fetchRoleSettings(): Promise<RoleCommissionSetting[]> {
  const response: GraphQLResponse<GetRoleSettingsResponse> = await crmGraphQLRequest({
    query: GET_ROLE_SETTINGS_QUERY,
  });

  if (response.errors?.length) {
    throw new Error(response.errors[0].message);
  }

  return response.data?.getRoleSettings || [];
}

const UPDATE_RBAC_GRID_MUTATION = `
  mutation UpdateRbacGrid($rbacGrid: [RbacGridInput!]!) {
    updateRbacGrid(rbacGrid: $rbacGrid) {
      resource
      roles {
        roleName
        privileges {
          option
          privilege
        }
      }
    }
  }
`;

/**
 * Build the mutation query dynamically for updateCommissionVisibility
 * Based on the exact mutation format:
 * mutation { updateCommissionVisibility(input: {role: OWNER, commission: false}) { ... } }
 */
function buildUpdateCommissionVisibilityMutation(
  role: RbacRoleEnum,
  commission: boolean
): string {
  // Use anonymous mutation to match the exact API format
  return `mutation { updateCommissionVisibility(input: {role: ${role}, commission: ${commission}}) { commission role } }`;
}

/**
 * Update RBAC permissions for a specific resource and role
 * rbacGrid is an array, roles is an array, privileges is an array
 * Returns the full updated grid (array of all resources)
 */
export async function updateRbacGrid(
  resource: string,
  role: RbacRoleEnum,
  privileges: { privilege: RbacPrivilegeTypeEnum; option: RbacPrivilegeOptionEnum }[]
): Promise<RbacGridResource[]> {
  const variables = {
    rbacGrid: [
      {
        resource: resource.toUpperCase(),
        roles: [
          {
            role: role,
            privileges: privileges,
          },
        ],
      },
    ],
  };

  console.log('Sending RBAC mutation with variables:', JSON.stringify(variables, null, 2));

  const response: GraphQLResponse<UpdateRbacGridResponse> = await crmGraphQLRequest({
    query: UPDATE_RBAC_GRID_MUTATION,
    variables,
  });

  console.log('RBAC mutation response:', JSON.stringify(response, null, 2));

  if (response.errors?.length) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.updateRbacGrid) {
    throw new Error('Failed to update RBAC grid');
  }

  console.log('Returning updated grid with', response.data.updateRbacGrid.length, 'resources');
  return response.data.updateRbacGrid;
}

/**
 * Update commission visibility for a specific role
 */
export async function updateCommissionVisibility(
  role: RbacRoleEnum,
  commission: boolean
): Promise<RoleCommissionSetting> {
  const mutation = buildUpdateCommissionVisibilityMutation(role, commission);

  const response: GraphQLResponse<UpdateCommissionVisibilityResponse> = await crmGraphQLRequest({
    query: mutation,
  });

  if (response.errors?.length) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.updateCommissionVisibility) {
    throw new Error('Failed to update commission visibility');
  }

  return response.data.updateCommissionVisibility;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Map frontend role ID to API role enum
 * Role IDs are now the same as enum values
 */
export function mapRoleToEnum(roleId: string): RbacRoleEnum {
  // Role IDs are already in enum format
  const validRoles: RbacRoleEnum[] = ['OWNER', 'ADMINISTRATOR', 'INSIDE_REP', 'OUTSIDE_REP', 'WAREHOUSE_MANAGER', 'WAREHOUSE_EMPLOYEE', 'DRIVER'];
  if (validRoles.includes(roleId as RbacRoleEnum)) {
    return roleId as RbacRoleEnum;
  }
  return 'INSIDE_REP';
}

/**
 * Map API role enum to frontend role ID
 * They are now the same
 */
export function mapEnumToRole(roleEnum: RbacRoleEnum): string {
  return roleEnum;
}

/**
 * Convert API privilege option to frontend format
 */
export function mapPrivilegeOptionToFrontend(option: RbacPrivilegeOptionEnum): 'all' | 'own' {
  return option === 'ALL' ? 'all' : 'own';
}


/**
 * Get privilege value from role's privileges array
 */
export function getPrivilegeValue(
  privileges: RbacPrivilege[],
  privilegeType: RbacPrivilegeTypeEnum
): 'all' | 'own' | 'none' {
  const privilege = privileges.find(p => p.privilege === privilegeType);
  if (!privilege) return 'none';
  return mapPrivilegeOptionToFrontend(privilege.option);
}

/**
 * Build privileges array from frontend values
 * Only includes privileges that are not 'none' - absence means no access
 * option is REQUIRED and must be either OWN or ALL
 */
export function buildPrivilegesArray(
  view: 'all' | 'own' | 'none',
  write: 'all' | 'own' | 'none',
  del: 'all' | 'own' | 'none'
): { privilege: RbacPrivilegeTypeEnum; option: RbacPrivilegeOptionEnum }[] {
  const privileges: { privilege: RbacPrivilegeTypeEnum; option: RbacPrivilegeOptionEnum }[] = [];

  // Only add privileges that are not 'none' - option is required (OWN or ALL)
  if (view !== 'none') {
    privileges.push({ privilege: 'VIEW', option: view === 'all' ? 'ALL' : 'OWN' });
  }
  if (write !== 'none') {
    privileges.push({ privilege: 'WRITE', option: write === 'all' ? 'ALL' : 'OWN' });
  }
  if (del !== 'none') {
    privileges.push({ privilege: 'DELETE', option: del === 'all' ? 'ALL' : 'OWN' });
  }

  return privileges;
}
