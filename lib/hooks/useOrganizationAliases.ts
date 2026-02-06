'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  getOrganizationAliases,
  createOrganizationAlias,
  deleteOrganizationAlias,
  bulkCreateOrganizationAliases,
  flattenAliases,
  findAliasesForOrganization,
  aliasExists,
  type OrganizationAliasGroupResponse,
  type OrganizationAliasResponse,
  type BulkCreateOrganizationAliasesResponse,
} from '@/lib/graphql/index';

export interface UseOrganizationAliasesOptions {
  /**
   * Whether to load data on mount (default: true)
   */
  loadOnMount?: boolean;
}

export interface UseOrganizationAliasesReturn {
  /**
   * Loading state
   */
  isLoading: boolean;
  /**
   * Error message if any
   */
  error: string | null;
  /**
   * Operation in progress state
   */
  isOperating: boolean;
  /**
   * Aliases grouped by organization
   */
  aliasGroups: OrganizationAliasGroupResponse[];
  /**
   * Flattened list of all aliases
   */
  allAliases: OrganizationAliasResponse[];
  /**
   * Add a new alias
   */
  addAlias: (connectedOrgId: string, alias: string) => Promise<OrganizationAliasResponse | null>;
  /**
   * Remove an alias by ID
   */
  removeAlias: (aliasId: string) => Promise<boolean>;
  /**
   * Bulk upload aliases from a file
   */
  bulkUpload: (file: File) => Promise<BulkCreateOrganizationAliasesResponse | null>;
  /**
   * Reload aliases from server
   */
  reload: () => Promise<void>;
  /**
   * Find aliases for a specific organization
   */
  findForOrganization: (connectedOrgId: string) => OrganizationAliasResponse[];
  /**
   * Check if an alias already exists
   */
  checkExists: (alias: string) => boolean;
}

/**
 * Hook for managing organization aliases with GraphQL operations.
 */
export function useOrganizationAliases(
  options: UseOrganizationAliasesOptions = {}
): UseOrganizationAliasesReturn {
  const { loadOnMount = true } = options;

  // Loading states
  const [isLoading, setIsLoading] = useState(loadOnMount);
  const [isOperating, setIsOperating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [aliasGroups, setAliasGroups] = useState<OrganizationAliasGroupResponse[]>([]);

  // Computed flattened aliases
  const allAliases = useMemo(() => flattenAliases(aliasGroups), [aliasGroups]);

  // Load aliases from server
  const loadAliases = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getOrganizationAliases();
      setAliasGroups(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load aliases';
      setError(message);
      console.error('useOrganizationAliases load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount if enabled
  useEffect(() => {
    if (loadOnMount) {
      loadAliases();
    }
  }, [loadOnMount, loadAliases]);

  // Add a new alias
  const addAlias = useCallback(async (
    connectedOrgId: string,
    alias: string
  ): Promise<OrganizationAliasResponse | null> => {
    // Check for duplicates locally first
    if (aliasExists(aliasGroups, alias)) {
      toast.error('This alias already exists');
      return null;
    }

    setIsOperating(true);
    setError(null);

    try {
      const newAlias = await createOrganizationAlias({
        connectedOrgId,
        alias: alias.trim(),
      });

      // Update local state by adding the new alias to the appropriate group
      setAliasGroups(prev => {
        const existingGroupIndex = prev.findIndex(g => g.connectedOrgId === connectedOrgId);

        if (existingGroupIndex >= 0) {
          // Add to existing group
          const newGroups = [...prev];
          newGroups[existingGroupIndex] = {
            ...newGroups[existingGroupIndex],
            aliases: [...newGroups[existingGroupIndex].aliases, newAlias],
          };
          return newGroups;
        } else {
          // Create new group
          return [
            ...prev,
            {
              connectedOrgId,
              connectedOrgName: newAlias.connectedOrgName,
              aliases: [newAlias],
            },
          ];
        }
      });

      toast.success('Alias added successfully');
      return newAlias;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add alias';
      setError(message);
      toast.error(message);
      console.error('useOrganizationAliases addAlias error:', err);
      return null;
    } finally {
      setIsOperating(false);
    }
  }, [aliasGroups]);

  // Remove an alias
  const removeAlias = useCallback(async (aliasId: string): Promise<boolean> => {
    setIsOperating(true);
    setError(null);

    try {
      const success = await deleteOrganizationAlias(aliasId);

      if (success) {
        // Update local state by removing the alias
        setAliasGroups(prev => {
          return prev.map(group => ({
            ...group,
            aliases: group.aliases.filter(a => a.id !== aliasId),
          })).filter(group => group.aliases.length > 0); // Remove empty groups
        });

        toast.success('Alias removed');
      }

      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove alias';
      setError(message);
      toast.error(message);
      console.error('useOrganizationAliases removeAlias error:', err);
      return false;
    } finally {
      setIsOperating(false);
    }
  }, []);

  // Bulk upload aliases
  const bulkUpload = useCallback(async (
    file: File
  ): Promise<BulkCreateOrganizationAliasesResponse | null> => {
    setIsOperating(true);
    setError(null);

    try {
      const result = await bulkCreateOrganizationAliases(file);

      // Show appropriate toast based on result
      if (result.insertedCount > 0 && result.failures.length === 0) {
        toast.success(`Successfully imported ${result.insertedCount} aliases`);
      } else if (result.insertedCount > 0 && result.failures.length > 0) {
        toast.warning(
          `Imported ${result.insertedCount} aliases, ${result.failures.length} failed`
        );
      } else if (result.failures.length > 0) {
        toast.error(`Failed to import aliases: ${result.failures.length} errors`);
      }

      // Reload to get fresh data
      await loadAliases();

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload aliases';
      setError(message);
      toast.error(message);
      console.error('useOrganizationAliases bulkUpload error:', err);
      return null;
    } finally {
      setIsOperating(false);
    }
  }, [loadAliases]);

  // Find aliases for a specific organization
  const findForOrganization = useCallback((connectedOrgId: string) => {
    return findAliasesForOrganization(aliasGroups, connectedOrgId);
  }, [aliasGroups]);

  // Check if an alias exists
  const checkExists = useCallback((alias: string) => {
    return aliasExists(aliasGroups, alias);
  }, [aliasGroups]);

  return {
    isLoading,
    error,
    isOperating,
    aliasGroups,
    allAliases,
    addAlias,
    removeAlias,
    bulkUpload,
    reload: loadAliases,
    findForOrganization,
    checkExists,
  };
}
