/**
 * Shared Bulk Delete Modal Component
 * Reusable confirmation modal for bulk deleting entities
 */

'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  bulkDelete,
  type BulkDeleteEntityType,
  type BulkDeleteResult,
  ENTITY_DISPLAY_NAMES,
} from '../../lib/graphql/bulk-operations';

interface BulkDeleteModalProps {
  isOpen: boolean;
  entityType: BulkDeleteEntityType;
  selectedCount: number;
  getAllSelectedIds: () => Promise<string[]>;
  onClose: () => void;
  onSuccess: () => void;
  /** Optional query keys to invalidate after successful deletion */
  queryKeysToInvalidate?: string[][];
}

export function BulkDeleteModal({
  isOpen,
  entityType,
  selectedCount,
  getAllSelectedIds,
  onClose,
  onSuccess,
  queryKeysToInvalidate = [],
}: BulkDeleteModalProps) {
  const queryClient = useQueryClient();
  const [isFetchingIds, setIsFetchingIds] = useState(false);

  const entityNames = ENTITY_DISPLAY_NAMES[entityType];
  const displayName = selectedCount === 1 ? entityNames.singular : entityNames.plural;
  const capitalizedDisplayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  const bulkDeleteMutation = useMutation<BulkDeleteResult, Error, string[]>({
    mutationFn: (entityIds) => bulkDelete(entityIds, entityType),
    onSuccess: () => {
      // Invalidate all specified query keys
      queryKeysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      // Fetch all IDs (handles both loaded and unloaded items)
      setIsFetchingIds(true);
      const allIds = await getAllSelectedIds();
      setIsFetchingIds(false);

      if (allIds.length === 0) {
        toast.error(`No ${entityNames.plural} to delete`);
        return;
      }

      const result = await bulkDeleteMutation.mutateAsync(allIds);

      if (result.failedCount > 0) {
        // Get unique error messages from failures
        const errorReasons = [...new Set(result.failures.map((f) => f.error))];
        const errorMessage =
          errorReasons.length > 0 ? `Reasons: ${errorReasons.join('; ')}` : '';

        toast.warning(
          `Deleted ${result.deletedCount} ${result.deletedCount === 1 ? entityNames.singular : entityNames.plural}. ${result.failedCount} failed. ${errorMessage}`
        );
      } else {
        toast.success(
          `Successfully deleted ${result.deletedCount} ${result.deletedCount === 1 ? entityNames.singular : entityNames.plural}`
        );
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Failed to bulk delete ${entityNames.plural}:`, error);
      setIsFetchingIds(false);
      toast.error(
        error instanceof Error ? error.message : `Failed to delete ${entityNames.plural}`
      );
    }
  };

  const isLoading = isFetchingIds || bulkDeleteMutation.isPending;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-red-50 dark:bg-red-900/20 px-6 py-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Delete {selectedCount} {capitalizedDisplayName}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[var(--foreground)]">
            Are you sure you want to delete{' '}
            <span className="font-semibold">
              {selectedCount} {displayName}
            </span>
            ?
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            This will permanently remove {selectedCount === 1 ? 'this' : 'these'}{' '}
            {displayName} and all associated data. This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-[var(--muted)]/30 px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isFetchingIds ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Preparing...
              </>
            ) : bulkDeleteMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete {selectedCount} {capitalizedDisplayName}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
