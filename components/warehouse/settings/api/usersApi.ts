/**
 * Users API Module
 * GraphQL API for fetching users that can be assigned as warehouse workers
 */

import { crmGraphQLRequest } from '../../../lib/graphql/client';

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
  enabled: boolean;
  role: string;
  inside?: boolean | null;
  outside?: boolean | null;
}

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_USERS = `
  query GetUsers($limit: Int, $offset: Int) {
    users(limit: $limit, offset: $offset) {
      id
      username
      firstName
      lastName
      email
      fullName
      enabled
      role
      inside
      outside
    }
  }
`;

const SEARCH_USERS = `
  query SearchUsers($searchTerm: String!, $enabled: Boolean, $isInside: Boolean, $isOutside: Boolean, $limit: Int) {
    userSearch(searchTerm: $searchTerm, enabled: $enabled, isInside: $isInside, isOutside: $isOutside, limit: $limit) {
      id
      username
      firstName
      lastName
      email
      fullName
      enabled
      role
      inside
      outside
    }
  }
`;

const GET_USER = `
  query GetUser($id: UUID!) {
    user(id: $id) {
      id
      username
      firstName
      lastName
      email
      fullName
      enabled
      role
      inside
      outside
    }
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all users with optional pagination
 */
export async function fetchUsers(limit?: number, offset = 0): Promise<User[]> {
  const response = await crmGraphQLRequest<{ users: User[] }>({
    query: GET_USERS,
    variables: { limit, offset },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch users');
  }

  return response.data?.users || [];
}

/**
 * Search users by name or email
 */
export async function searchUsers(
  searchTerm: string,
  options: {
    enabled?: boolean;
    isInside?: boolean;
    isOutside?: boolean;
    limit?: number;
  } = {}
): Promise<User[]> {
  const { enabled = true, isInside, isOutside, limit = 20 } = options;

  const response = await crmGraphQLRequest<{ userSearch: User[] }>({
    query: SEARCH_USERS,
    variables: { searchTerm, enabled, isInside, isOutside, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search users');
  }

  return response.data?.userSearch || [];
}

/**
 * Fetch a single user by ID
 */
export async function fetchUserById(id: string): Promise<User | null> {
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
 * Fetch multiple users by IDs
 * This is useful for batch fetching user details for warehouse members
 */
export async function fetchUsersByIds(ids: string[]): Promise<Map<string, User>> {
  const userMap = new Map<string, User>();

  // Fetch all users and filter by IDs
  // TODO: Add a batch query endpoint if available
  const allUsers = await fetchUsers(200);

  for (const user of allUsers) {
    if (ids.includes(user.id)) {
      userMap.set(user.id, user);
    }
  }

  return userMap;
}
