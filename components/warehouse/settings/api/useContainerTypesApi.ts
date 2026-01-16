/**
 * Container Types React Query Hooks
 * Custom hooks for interacting with the Container Types GraphQL API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchContainerTypes,
  fetchContainerTypeById,
  createContainerType,
  updateContainerType,
  deleteContainerType,
  reorderContainerTypes,
  type ContainerType,
  type CreateContainerTypeInput,
  type UpdateContainerTypeInput,
} from './containerTypesApi';

// ============================================================================
// Query Keys
// ============================================================================

export const containerTypesQueryKeys = {
  all: ['containerTypes'] as const,
  list: () => [...containerTypesQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...containerTypesQueryKeys.all, 'detail', id] as const,
};

// ============================================================================
// Container Type Hooks
// ============================================================================

/**
 * Fetch all container types ordered by display position
 */
export function useContainerTypesQuery() {
  return useQuery<ContainerType[], Error>({
    queryKey: containerTypesQueryKeys.list(),
    queryFn: fetchContainerTypes,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single container type by ID
 */
export function useContainerTypeQuery(id: string) {
  return useQuery<ContainerType | null, Error>({
    queryKey: containerTypesQueryKeys.detail(id),
    queryFn: () => fetchContainerTypeById(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Create a new container type
 * Note: Query invalidation is handled by useContainerTypes hook after all creates complete
 * to prevent mid-batch refetches that would lose pending containers.
 */
export function useCreateContainerType() {
  return useMutation<ContainerType, Error, CreateContainerTypeInput>({
    mutationFn: createContainerType,
    // No onSuccess - handled by useContainerTypes hook
  });
}

/**
 * Update an existing container type
 * Note: Optimistic updates and query invalidation are handled by useContainerTypes hook
 * to support debounced updates without causing re-renders during typing.
 */
export function useUpdateContainerType() {
  return useMutation<
    ContainerType,
    Error,
    { id: string; input: UpdateContainerTypeInput }
  >({
    mutationFn: ({ id, input }) => updateContainerType(id, input),
    // No onMutate, onError, or onSettled - all handled by useContainerTypes hook
    // This prevents query cache updates that would interfere with debounced typing
  });
}

/**
 * Delete a container type
 * Note: Query invalidation is handled by useContainerTypes hook after all deletes complete.
 */
export function useDeleteContainerType() {
  return useMutation<boolean, Error, string>({
    mutationFn: deleteContainerType,
    // No onSuccess - handled by useContainerTypes hook
  });
}

/**
 * Reorder container types (drag-drop support)
 */
export function useReorderContainerTypes() {
  const queryClient = useQueryClient();

  return useMutation<
    ContainerType[],
    Error,
    string[],
    { previousData: ContainerType[] | undefined }
  >({
    mutationFn: reorderContainerTypes,
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: containerTypesQueryKeys.list() });

      const previousData = queryClient.getQueryData<ContainerType[]>(
        containerTypesQueryKeys.list()
      );

      if (previousData) {
        // Optimistically reorder based on the ID list
        const reordered = orderedIds
          .map((id, index) => {
            const item = previousData.find((ct) => ct.id === id);
            return item ? { ...item, position: index } : null;
          })
          .filter((item): item is ContainerType => item !== null);

        queryClient.setQueryData<ContainerType[]>(containerTypesQueryKeys.list(), reordered);
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(containerTypesQueryKeys.list(), context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: containerTypesQueryKeys.list() });
    },
  });
}

// Re-export types
export type { ContainerType, CreateContainerTypeInput, UpdateContainerTypeInput };
