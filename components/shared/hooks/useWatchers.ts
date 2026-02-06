/**
 * useWatchers Hook
 * React Query wrapper for watchers API operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWatchersByEntity,
  addWatcher,
  removeWatcher,
  type WatchableEntityType,
  type Watcher,
} from '@/components/lib/graphql/watchers';

// ============================================================================
// Query Keys
// ============================================================================

export const watchersQueryKeys = {
  all: ['watchers'] as const,
  byEntity: (entityType: WatchableEntityType, entityId: string) =>
    ['watchers', entityType, entityId] as const,
};

// ============================================================================
// Query Hook
// ============================================================================

interface UseWatchersOptions {
  entityType: WatchableEntityType;
  entityId: string | null;
  enabled?: boolean;
}

/**
 * Hook to fetch watchers for an entity
 */
export function useWatchers({ entityType, entityId, enabled = true }: UseWatchersOptions) {
  return useQuery<Watcher[], Error>({
    queryKey: watchersQueryKeys.byEntity(entityType, entityId || ''),
    queryFn: () => fetchWatchersByEntity(entityType, entityId!),
    enabled: enabled && !!entityId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

interface UseAddWatcherOptions {
  entityType: WatchableEntityType;
  entityId: string;
  onSuccess?: (watchers: Watcher[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to add a watcher to an entity
 */
export function useAddWatcher({
  entityType,
  entityId,
  onSuccess,
  onError,
}: UseAddWatcherOptions) {
  const queryClient = useQueryClient();

  return useMutation<Watcher[], Error, string>({
    mutationFn: (userId: string) => addWatcher(entityType, entityId, userId),
    onSuccess: (watchers) => {
      // Update the cache with the new watchers list
      queryClient.setQueryData(
        watchersQueryKeys.byEntity(entityType, entityId),
        watchers
      );
      onSuccess?.(watchers);
    },
    onError,
  });
}

interface UseRemoveWatcherOptions {
  entityType: WatchableEntityType;
  entityId: string;
  onSuccess?: (watchers: Watcher[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to remove a watcher from an entity
 */
export function useRemoveWatcher({
  entityType,
  entityId,
  onSuccess,
  onError,
}: UseRemoveWatcherOptions) {
  const queryClient = useQueryClient();

  return useMutation<Watcher[], Error, string>({
    mutationFn: (userId: string) => removeWatcher(entityType, entityId, userId),
    onSuccess: (watchers) => {
      // Update the cache with the new watchers list
      queryClient.setQueryData(
        watchersQueryKeys.byEntity(entityType, entityId),
        watchers
      );
      onSuccess?.(watchers);
    },
    onError,
  });
}
