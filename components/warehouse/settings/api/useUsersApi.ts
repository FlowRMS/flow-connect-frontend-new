/**
 * Users API React Query Hooks
 * Hooks for fetching users that can be assigned as warehouse workers
 */

import { useQuery } from '@tanstack/react-query';
import { fetchUsers, searchUsers, fetchUserById, type User } from './usersApi';

// ============================================================================
// Query Keys
// ============================================================================

export const usersQueryKeys = {
  all: ['users'] as const,
  list: (limit?: number, offset?: number) => [...usersQueryKeys.all, 'list', { limit, offset }] as const,
  search: (searchTerm: string) => [...usersQueryKeys.all, 'search', searchTerm] as const,
  detail: (id: string) => [...usersQueryKeys.all, 'detail', id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all users
 */
export function useUsersQuery(limit?: number, offset = 0) {
  return useQuery<User[], Error>({
    queryKey: usersQueryKeys.list(limit, offset),
    queryFn: () => fetchUsers(limit, offset),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Search users by name or email
 */
export function useUserSearchQuery(
  searchTerm: string,
  options: {
    enabled?: boolean;
    isInside?: boolean;
    isOutside?: boolean;
    limit?: number;
  } = {}
) {
  return useQuery<User[], Error>({
    queryKey: usersQueryKeys.search(searchTerm),
    queryFn: () => searchUsers(searchTerm, options),
    enabled: searchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single user by ID
 */
export function useUserQuery(id: string | null) {
  return useQuery<User | null, Error>({
    queryKey: usersQueryKeys.detail(id || ''),
    queryFn: () => fetchUserById(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

// Re-export types
export type { User };
