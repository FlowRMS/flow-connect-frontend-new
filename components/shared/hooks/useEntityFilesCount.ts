/**
 * useEntityFilesCount Hook
 * Generic hook to fetch and return the count of active (non-archived) files for any entity
 * 
 * This hook is reusable across all entity types (Orders, Invoices, Quotes, etc.)
 * and automatically handles query key generation based on entity type.
 */

import { useQuery } from '@tanstack/react-query';
import { 
  fetchFilesByLinkedEntity,
  type FileEntityType 
} from '@/components/lib/graphql/files';

interface UseEntityFilesCountProps {
  entityId: string | null;
  entityType: FileEntityType;
  enabled?: boolean;
}

/**
 * Generic hook to get the count of active files for any entity
 * Filters out archived files to match FilesTab behavior
 * 
 */
export function useEntityFilesCount({ 
  entityId, 
  entityType, 
  enabled = true 
}: UseEntityFilesCountProps) {
  const {
    data: files = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [`${entityType.toLowerCase()}Files`, entityId],
    queryFn: async () => {
      if (!entityId) return [];
      return fetchFilesByLinkedEntity(entityType, entityId);
    },
    enabled: enabled && !!entityId,
    staleTime: 30 * 1000, // 30 seconds - files don't change frequently
  });

  // Filter out archived files (matching FilesTab behavior)
  const activeFilesCount = files.filter((file) => !file.archived).length;

  return {
    filesCount: activeFilesCount,
    isLoading,
    error,
  };
}
