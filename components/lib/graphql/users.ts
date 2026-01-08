/**
 * GraphQL Users Module
 * CRUD operations for team members/users
 */

import { crmGraphQLRequest, GraphQLResponse } from './client';

// ============================================================================
// Types
// ============================================================================

export type UserRole =
  | 'OWNER'
  | 'ADMINISTRATOR'
  | 'INSIDE_REP'
  | 'OUTSIDE_REP'
  | 'WAREHOUSE_MANAGER'
  | 'WAREHOUSE_EMPLOYEE'
  | 'DRIVER';

export interface User {
  id: string;
  authProviderId: string | null;
  email: string;
  enabled: boolean;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  role: UserRole;
  inside: boolean;
  outside: boolean;
  visible: boolean;
}

export interface UserInput {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  inside: boolean;
  outside: boolean;
  visible: boolean;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_USER = `
  query GetUser($id: UUID!) {
    user(id: $id) {
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
      visible
    }
  }
`;

const GET_USERS = `
  query GetUsers($limit: Int) {
    users(limit: $limit) {
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
      visible
    }
  }
`;

// ============================================================================
// GraphQL Mutations
// ============================================================================

const CREATE_USER = `
  mutation CreateUser(
    $username: String!
    $firstName: String!
    $lastName: String!
    $email: String!
    $role: RbacRoleEnum!
    $enabled: Boolean!
    $inside: Boolean!
    $outside: Boolean!
    $visible: Boolean = true
  ) {
    createUser(
      input: {
        username: $username
        firstName: $firstName
        lastName: $lastName
        email: $email
        role: $role
        enabled: $enabled
        inside: $inside
        outside: $outside
        visible: $visible
      }
    ) {
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
      visible
    }
  }
`;

const UPDATE_USER = `
  mutation UpdateUser(
    $id: UUID!
    $username: String!
    $firstName: String!
    $lastName: String!
    $email: String!
    $role: RbacRoleEnum!
    $enabled: Boolean!
    $inside: Boolean!
    $outside: Boolean!
    $visible: Boolean = true
  ) {
    updateUser(
      id: $id
      input: {
        username: $username
        firstName: $firstName
        lastName: $lastName
        email: $email
        role: $role
        enabled: $enabled
        inside: $inside
        outside: $outside
        visible: $visible
      }
    ) {
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
      visible
    }
  }
`;

const DELETE_USER = `
  mutation DeleteUser($id: UUID!) {
    deleteUser(id: $id)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch a single user by ID
 */
export async function fetchUser(id: string): Promise<User | null> {
  const response = await crmGraphQLRequest<{ user: User }>({
    query: GET_USER,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch user');
  }

  return response.data?.user || null;
}

/**
 * Fetch all users with optional limit
 */
export async function fetchUsers(limit: number = 1000): Promise<User[]> {
  const response = await crmGraphQLRequest<{ users: User[] }>({
    query: GET_USERS,
    variables: { limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch users');
  }

  return response.data?.users || [];
}

/**
 * Create a new user
 */
export async function createUser(input: UserInput): Promise<User> {
  const response = await crmGraphQLRequest<{ createUser: User }>({
    query: CREATE_USER,
    variables: {
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      role: input.role,
      enabled: input.enabled,
      inside: input.inside,
      outside: input.outside,
      visible: input.visible,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create user');
  }

  if (!response.data?.createUser) {
    throw new Error('Failed to create user');
  }

  return response.data.createUser;
}

/**
 * Update an existing user
 */
export async function updateUser(id: string, input: Partial<UserInput>): Promise<User> {
  const response = await crmGraphQLRequest<{ updateUser: User }>({
    query: UPDATE_USER,
    variables: {
      id,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      role: input.role,
      enabled: input.enabled,
      inside: input.inside,
      outside: input.outside,
      visible: input.visible,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update user');
  }

  if (!response.data?.updateUser) {
    throw new Error('Failed to update user');
  }

  return response.data.updateUser;
}

/**
 * Delete a user by ID
 */
export async function deleteUser(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteUser: boolean }>({
    query: DELETE_USER,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete user');
  }

  return response.data?.deleteUser ?? false;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Map API role to display label
 */
export function getRoleDisplayLabel(role: UserRole): string {
  const roleLabels: Record<UserRole, string> = {
    OWNER: 'Owner',
    ADMINISTRATOR: 'Administrator',
    INSIDE_REP: 'Inside Rep',
    OUTSIDE_REP: 'Outside Rep',
    WAREHOUSE_MANAGER: 'Warehouse Manager',
    WAREHOUSE_EMPLOYEE: 'Warehouse Employee',
    DRIVER: 'Driver',
  };
  return roleLabels[role] || role;
}

/**
 * Map API role to internal role key for grouping
 */
export function getRoleKey(role: UserRole): string {
  const roleKeys: Record<UserRole, string> = {
    OWNER: 'owner',
    ADMINISTRATOR: 'administrator',
    INSIDE_REP: 'inside_rep',
    OUTSIDE_REP: 'outside_rep',
    WAREHOUSE_MANAGER: 'warehouse_manager',
    WAREHOUSE_EMPLOYEE: 'warehouse_employee',
    DRIVER: 'driver',
  };
  return roleKeys[role] || role.toLowerCase();
}

/**
 * All available roles for dropdown selection
 */
export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'ADMINISTRATOR', label: 'Administrator' },
  { value: 'INSIDE_REP', label: 'Inside Rep' },
  { value: 'OUTSIDE_REP', label: 'Outside Rep' },
  { value: 'WAREHOUSE_MANAGER', label: 'Warehouse Manager' },
  { value: 'WAREHOUSE_EMPLOYEE', label: 'Warehouse Employee' },
  { value: 'DRIVER', label: 'Driver' },
];
