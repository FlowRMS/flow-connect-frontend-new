/**
 * Team Members API Hook
 * React Query hooks for team member/user CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser,
  User,
  UserInput,
  UserRole,
} from '@/components/lib/graphql/users';
import { teamMemberToasts } from '@/components/lib/toast';

// ============================================================================
// Query Keys
// ============================================================================

export const teamQueryKeys = {
  all: ['team-members'] as const,
  list: () => [...teamQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...teamQueryKeys.all, 'detail', id] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch all team members
 */
export function useTeamMembers() {
  return useQuery<User[], Error>({
    queryKey: teamQueryKeys.list(),
    queryFn: () => fetchUsers(1000),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single team member by ID
 */
export function useTeamMember(id: string | null) {
  return useQuery<User | null, Error>({
    queryKey: teamQueryKeys.detail(id || ''),
    queryFn: () => (id ? fetchUser(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new team member
 */
export function useCreateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UserInput) => createUser(input),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all });
      teamMemberToasts.createSuccess(user.fullName || `${user.firstName} ${user.lastName}`);
    },
    onError: (error: Error) => {
      teamMemberToasts.createError(error.message);
    },
  });
}

/**
 * Update an existing team member
 */
export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<UserInput> }) =>
      updateUser(id, input),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all });
      teamMemberToasts.updateSuccess(user.fullName || `${user.firstName} ${user.lastName}`);
    },
    onError: (error: Error) => {
      teamMemberToasts.updateError(error.message);
    },
  });
}

/**
 * Delete a team member
 */
export function useDeleteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all });
      // Note: We don't have the user's name here, so we use a generic message
      teamMemberToasts.deleteSuccess('User');
    },
    onError: (error: Error) => {
      teamMemberToasts.deleteError(error.message);
    },
  });
}

/**
 * Toggle user enabled/disabled status
 */
export function useToggleTeamMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateUser(id, { enabled }),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: teamQueryKeys.all });
      teamMemberToasts.statusChanged(
        user.fullName || `${user.firstName} ${user.lastName}`,
        user.enabled
      );
    },
    onError: (error: Error) => {
      teamMemberToasts.updateError(error.message);
    },
  });
}

// ============================================================================
// Types Re-export
// ============================================================================

export type { User, UserInput, UserRole };
