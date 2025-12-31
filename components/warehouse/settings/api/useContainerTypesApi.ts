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
 */
export function useCreateContainerType() {
  const queryClient = useQueryClient();

  return useMutation<ContainerType, Error, CreateContainerTypeInput>({
    mutationFn: createContainerType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: containerTypesQueryKeys.all });
    },
  });
}

/**
 * Update an existing container type with optimistic updates
 */
export function useUpdateContainerType() {
  const queryClient = useQueryClient();

  return useMutation<
    ContainerType,
    Error,
    { id: string; input: UpdateContainerTypeInput },
    { previousData: ContainerType[] | undefined }
  >({
    mutationFn: ({ id, input }) => updateContainerType(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: containerTypesQueryKeys.list() });

      const previousData = queryClient.getQueryData<ContainerType[]>(
        containerTypesQueryKeys.list()
      );

      if (previousData) {
        queryClient.setQueryData<ContainerType[]>(
          containerTypesQueryKeys.list(),
          previousData.map((ct) =>
            ct.id === id
              ? {
                  ...ct,
                  name: input.name ?? ct.name,
                  length: input.length ?? ct.length,
                  width: input.width ?? ct.width,
                  height: input.height ?? ct.height,
                  weight: input.weight ?? ct.weight,
                  position: input.position ?? ct.position,
                }
              : ct
          )
        );
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(containerTypesQueryKeys.list(), context.previousData);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: containerTypesQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: containerTypesQueryKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete a container type
 */
export function useDeleteContainerType() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteContainerType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: containerTypesQueryKeys.list() });
    },
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
