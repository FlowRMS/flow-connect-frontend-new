// Warehouse settings management hook with backend API integration
// Updates are batched locally and only saved when saveChanges() is called

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Warehouse, WarehouseLocationLevelConfig } from '@/lib/types/warehouse';
import type { WarehouseWithSettings, WarehouseWorker, PartialWarehouseSettingsState } from '../types';

// Type for local modifications - settings can be partial
interface WarehouseModifications extends Omit<Partial<WarehouseWithSettings>, 'settings'> {
  settings?: PartialWarehouseSettingsState;
}
import {
  useWarehousesQuery,
  warehousesQueryKeys,
  useCreateWarehouse,
  useDeleteWarehouse,
  useUsersQuery,
  type Warehouse as ApiWarehouse,
  type WarehouseAddress,
  type User,
} from '../api';
import {
  fetchWarehouseAddresses,
  updateWarehouse as updateWarehouseApi,
  updateWarehouseStructure as updateWarehouseStructureApi,
  assignWorkerToWarehouse as assignWorkerApi,
  removeWorkerFromWarehouse as removeWorkerApi,
  updateWorkerRole as updateWorkerRoleApi,
  createWarehouseAddress as createAddressApi,
  updateWarehouseAddress as updateAddressApi,
} from '../api/warehousesApi';

// Structure code to level mapping
const STRUCTURE_CODE_TO_LEVEL: Record<number, string> = {
  1: 'section',
  2: 'aisle',
  3: 'shelf',
  4: 'bay',
  5: 'row',
  6: 'bin',
};

// String enum to level mapping (for backend response)
const ENUM_TO_LEVEL: Record<string, string> = {
  SECTION: 'section',
  AISLE: 'aisle',
  SHELF: 'shelf',
  BAY: 'bay',
  ROW: 'row',
  BIN: 'bin',
};

const LEVEL_TO_STRUCTURE_CODE: Record<string, number> = {
  section: 1,
  aisle: 2,
  shelf: 3,
  bay: 4,
  row: 5,
  bin: 6,
};

// Helper to normalize structure code to level name
const normalizeCodeToLevel = (code: number | string): string | undefined => {
  if (typeof code === 'number') {
    return STRUCTURE_CODE_TO_LEVEL[code];
  }
  return ENUM_TO_LEVEL[code];
};

// Default location levels configuration
const defaultLocationLevels: WarehouseLocationLevelConfig[] = [
  { level: 'section', label: 'Section', icon: 'package', enabled: true, order: 1 },
  { level: 'aisle', label: 'Aisle', icon: 'shopping-cart', enabled: true, order: 2 },
  { level: 'shelf', label: 'Shelf', icon: 'layers', enabled: true, order: 3 },
  { level: 'bay', label: 'Bay', icon: 'grid', enabled: true, order: 4 },
  { level: 'row', label: 'Row', icon: 'folder', enabled: true, order: 5 },
  { level: 'bin', label: 'Bin', icon: 'map-pin', enabled: true, order: 6 },
];

// Convert API response to local format
const toLocalFormat = (
  warehouse: ApiWarehouse,
  address?: WarehouseAddress | null
): WarehouseWithSettings => {
  // Convert structure to location levels - handle both number and string enum codes from backend
  const enabledLevels = new Set(
    warehouse.structure?.map((s) => normalizeCodeToLevel(s.code)).filter(Boolean) || []
  );
  const locationLevels = defaultLocationLevels.map((defaultLevel) => ({
    ...defaultLevel,
    enabled: enabledLevels.has(defaultLevel.level),
  }));

  // Convert members to worker assignments
  // Backend may return role as number (1=WORKER, 2=MANAGER) or string enum ('WORKER', 'MANAGER')
  const workers =
    warehouse.members?.map((m) => ({
      workerId: m.userId,
      role: (m.role === 2 || m.role === 'MANAGER') ? ('manager' as const) : ('worker' as const),
    })) || [];

  return {
    id: warehouse.id,
    name: warehouse.name,
    addressLine1: address?.line1 || '',
    addressLine2: address?.line2 || undefined,
    city: address?.city || '',
    state: address?.state || '',
    postalCode: address?.zipCode || '',
    country: address?.country || '',
    description: warehouse.description ?? undefined,
    isActive: warehouse.isActive ?? true,
    createdAt: warehouse.createdAt,
    updatedAt: warehouse.createdAt, // Backend doesn't have updatedAt
    settings: {
      locationLevels,
      workers,
    },
    addressId: address?.id,
  };
};

// Convert User from API to WarehouseWorker format for UI
const userToWorker = (user: User): WarehouseWorker => ({
  id: user.id,
  name: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  role: 'worker', // Default role, actual role comes from warehouse membership
});

export function useWarehouseSettings() {
  // Query client for manual refetch after save
  const queryClient = useQueryClient();

  // React Query hooks for backend API
  const { data: apiWarehouses, isLoading, error } = useWarehousesQuery();
  const { data: apiUsers } = useUsersQuery(200); // Fetch up to 200 users
  const createMutation = useCreateWarehouse();
  const deleteMutation = useDeleteWarehouse();
  // Note: We use direct API calls in saveChanges to avoid race conditions from automatic query invalidations

  // Convert users to workers format for display
  const availableWorkers = useMemo(() => {
    if (!apiUsers) return [];
    return apiUsers.filter((u) => u.enabled).map(userToWorker);
  }, [apiUsers]);

  // Store addresses by warehouse ID
  const [addressesByWarehouse, setAddressesByWarehouse] = useState<
    Map<string, WarehouseAddress | null>
  >(new Map());
  const [addressesLoaded, setAddressesLoaded] = useState(false);

  // Fetch addresses for all warehouses when they load
  useEffect(() => {
    const loadAddresses = async () => {
      if (!apiWarehouses || apiWarehouses.length === 0 || addressesLoaded) return;

      const addressMap = new Map<string, WarehouseAddress | null>();

      await Promise.all(
        apiWarehouses.map(async (warehouse) => {
          try {
            const addresses = await fetchWarehouseAddresses(warehouse.id);
            // Get the primary address or first address
            const primaryAddress = addresses.find((a) => a.isPrimary) || addresses[0] || null;
            addressMap.set(warehouse.id, primaryAddress);
          } catch (err) {
            console.error(`Failed to load address for warehouse ${warehouse.id}:`, err);
            addressMap.set(warehouse.id, null);
          }
        })
      );

      setAddressesByWarehouse(addressMap);
      setAddressesLoaded(true);
    };

    loadAddresses();
  }, [apiWarehouses, addressesLoaded]);

  // Local modifications - map of warehouse ID to partial updates
  // Uses WarehouseModifications which allows partial settings (workers/locationLevels can be undefined)
  const [localModifications, setLocalModifications] = useState<
    Map<string, WarehouseModifications>
  >(new Map());

  // Track which warehouses have been deleted locally (not yet saved)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Track newly created warehouses (not yet in API)
  const [newWarehouses, setNewWarehouses] = useState<WarehouseWithSettings[]>([]);

  // UI state
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(null);
  const [showNewWarehouseModal, setShowNewWarehouseModal] = useState(false);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState<string | null>(null);
  const [showLayoutModal, setShowLayoutModal] = useState<string | null>(null);
  const [showQRCodesModal, setShowQRCodesModal] = useState<string | null>(null);

  // Derive local warehouses from API data + local modifications + new warehouses
  const warehouses = useMemo(() => {
    const fromApi = (apiWarehouses || [])
      .map((w) => toLocalFormat(w, addressesByWarehouse.get(w.id)))
      .filter((w) => !deletedIds.has(w.id))
      .map((warehouse) => {
        const mods = localModifications.get(warehouse.id);
        if (mods) {
          // Merge settings carefully - only override specific fields that were modified
          const mergedSettings = {
            locationLevels:
              mods.settings?.locationLevels !== undefined
                ? mods.settings.locationLevels
                : warehouse.settings.locationLevels,
            workers:
              mods.settings?.workers !== undefined
                ? mods.settings.workers
                : warehouse.settings.workers,
          };

          // Remove settings from mods to avoid double-applying
          const { settings: _settings, ...otherMods } = mods;

          return {
            ...warehouse,
            ...otherMods,
            settings: mergedSettings,
          };
        }
        return warehouse;
      });

    return [...fromApi, ...newWarehouses];
  }, [apiWarehouses, addressesByWarehouse, deletedIds, localModifications, newWarehouses]);

  // Track if there are unsaved changes
  const hasChanges = localModifications.size > 0 || deletedIds.size > 0 || newWarehouses.length > 0;

  // Set expanded warehouse to first one when data loads
  useEffect(() => {
    if (warehouses.length > 0 && expandedWarehouse === null) {
      setExpandedWarehouse(warehouses[0]?.id || null);
    }
  }, [warehouses.length]); // Only depend on length to avoid loop

  const toggleWarehouseExpansion = useCallback((warehouseId: string) => {
    setExpandedWarehouse((prev) => (prev === warehouseId ? null : warehouseId));
  }, []);

  const toggleLevel = useCallback((warehouseId: string, level: string) => {
    setLocalModifications((prev) => {
      const next = new Map(prev);
      const existing = next.get(warehouseId) || {};

      // Find the warehouse from current state
      const apiWarehouse = apiWarehouses?.find((w) => w.id === warehouseId);
      if (!apiWarehouse) return prev;
      const warehouse = toLocalFormat(apiWarehouse, addressesByWarehouse.get(warehouseId));

      // Get current location levels (from modifications or API)
      const currentLevels =
        existing.settings?.locationLevels !== undefined
          ? existing.settings.locationLevels
          : warehouse.settings.locationLevels;
      const updatedLevels = currentLevels.map((l) =>
        l.level === level ? { ...l, enabled: !l.enabled } : l
      );

      // Preserve existing worker modifications, or don't include workers key at all
      // This is important: only include workers if they were explicitly modified
      const existingSettings = existing.settings || {};
      next.set(warehouseId, {
        ...existing,
        settings: {
          ...existingSettings,
          locationLevels: updatedLevels,
        },
      });
      return next;
    });
  }, [apiWarehouses, addressesByWarehouse]);

  const updateWorkerRole = useCallback(
    (warehouseId: string, workerId: string, newRole: 'worker' | 'manager') => {
      setLocalModifications((prev) => {
        const next = new Map(prev);
        const existing = next.get(warehouseId) || {};

        const apiWarehouse = apiWarehouses?.find((w) => w.id === warehouseId);
        if (!apiWarehouse) return prev;
        const warehouse = toLocalFormat(apiWarehouse, addressesByWarehouse.get(warehouseId));

        // Get current workers - check modifications first, then API data
        // This ensures we include both API workers and locally-added workers
        let currentWorkers =
          existing.settings?.workers !== undefined
            ? existing.settings.workers
            : warehouse.settings.workers;

        // Make sure we have an array
        if (!Array.isArray(currentWorkers)) {
          currentWorkers = warehouse.settings.workers;
        }

        const updatedWorkers = currentWorkers.map((w) =>
          w.workerId === workerId ? { ...w, role: newRole } : w
        );

        // Only update workers, preserve any existing locationLevels modifications
        next.set(warehouseId, {
          ...existing,
          settings: {
            ...existing.settings,
            workers: updatedWorkers,
          },
        });
        return next;
      });
    },
    [apiWarehouses, addressesByWarehouse]
  );

  const removeWorker = useCallback(
    (warehouseId: string, workerId: string) => {
      setLocalModifications((prev) => {
        const next = new Map(prev);
        const existing = next.get(warehouseId) || {};

        const apiWarehouse = apiWarehouses?.find((w) => w.id === warehouseId);
        if (!apiWarehouse) return prev;
        const warehouse = toLocalFormat(apiWarehouse, addressesByWarehouse.get(warehouseId));

        // Get current workers - check modifications first, then API data
        let currentWorkers =
          existing.settings?.workers !== undefined
            ? existing.settings.workers
            : warehouse.settings.workers;

        // Make sure we have an array
        if (!Array.isArray(currentWorkers)) {
          currentWorkers = warehouse.settings.workers;
        }

        const updatedWorkers = currentWorkers.filter((w) => w.workerId !== workerId);

        // Only update workers, preserve any existing locationLevels modifications
        next.set(warehouseId, {
          ...existing,
          settings: {
            ...existing.settings,
            workers: updatedWorkers,
          },
        });
        return next;
      });
    },
    [apiWarehouses, addressesByWarehouse]
  );

  const updateWarehouseField = useCallback(
    (warehouseId: string, field: keyof Warehouse, value: string | boolean) => {
      // Check if it's a new warehouse
      const isNew = newWarehouses.some((w) => w.id === warehouseId);
      if (isNew) {
        setNewWarehouses((prev) =>
          prev.map((w) => (w.id === warehouseId ? { ...w, [field]: value } : w))
        );
        return;
      }

      setLocalModifications((prev) => {
        const next = new Map(prev);
        const existing = next.get(warehouseId) || {};
        next.set(warehouseId, { ...existing, [field]: value });
        return next;
      });
    },
    [newWarehouses]
  );

  const addWorker = useCallback(
    (warehouseId: string, workerId: string, role: 'worker' | 'manager') => {
      // Check if it's a new warehouse
      const isNew = newWarehouses.some((w) => w.id === warehouseId);
      if (isNew) {
        setNewWarehouses((prev) =>
          prev.map((w) =>
            w.id === warehouseId
              ? {
                  ...w,
                  settings: {
                    ...w.settings,
                    workers: [...w.settings.workers, { workerId, role }],
                  },
                }
              : w
          )
        );
        setShowAddWorkerModal(null);
        return;
      }

      setLocalModifications((prev) => {
        const next = new Map(prev);
        const existing = next.get(warehouseId) || {};

        const apiWarehouse = apiWarehouses?.find((w) => w.id === warehouseId);
        if (!apiWarehouse) return prev;
        const warehouse = toLocalFormat(apiWarehouse, addressesByWarehouse.get(warehouseId));

        // Get current workers - check modifications first, then API data
        let currentWorkers =
          existing.settings?.workers !== undefined
            ? existing.settings.workers
            : warehouse.settings.workers;

        // Make sure we have an array
        if (!Array.isArray(currentWorkers)) {
          currentWorkers = warehouse.settings.workers;
        }

        // Only update workers, preserve any existing locationLevels modifications
        next.set(warehouseId, {
          ...existing,
          settings: {
            ...existing.settings,
            workers: [...currentWorkers, { workerId, role }],
          },
        });
        return next;
      });
      setShowAddWorkerModal(null);
    },
    [apiWarehouses, addressesByWarehouse, newWarehouses]
  );

  const updateLocationLevels = useCallback(
    (warehouseId: string, levels: WarehouseLocationLevelConfig[]) => {
      // Check if it's a new warehouse
      const isNew = newWarehouses.some((w) => w.id === warehouseId);
      if (isNew) {
        setNewWarehouses((prev) =>
          prev.map((w) =>
            w.id === warehouseId
              ? {
                  ...w,
                  settings: {
                    ...w.settings,
                    locationLevels: levels,
                  },
                }
              : w
          )
        );
        return;
      }

      setLocalModifications((prev) => {
        const next = new Map(prev);
        const existing = next.get(warehouseId) || {};

        // Only update locationLevels, preserve any existing workers modifications
        next.set(warehouseId, {
          ...existing,
          settings: {
            ...existing.settings,
            locationLevels: levels,
          },
        });
        return next;
      });
    },
    [newWarehouses]
  );

  // Create a new warehouse - immediate save to backend
  const handleCreateWarehouse = useCallback(
    async (name: string, description?: string) => {
      try {
        const created = await createMutation.mutateAsync({
          name,
          description: description || null,
          isActive: true,
        });

        // Expand the newly created warehouse
        setExpandedWarehouse(created.id);
        setShowNewWarehouseModal(false);
      } catch (err) {
        console.error('Failed to create warehouse:', err);
        throw err;
      }
    },
    [createMutation]
  );

  // Mark warehouse for deletion
  const handleDeleteWarehouse = useCallback((warehouseId: string) => {
    // Check if it's a new warehouse
    setNewWarehouses((prev) => {
      const isNew = prev.some((w) => w.id === warehouseId);
      if (isNew) {
        return prev.filter((w) => w.id !== warehouseId);
      }
      return prev;
    });

    setDeletedIds((prev) => new Set(prev).add(warehouseId));
    setLocalModifications((prev) => {
      const next = new Map(prev);
      next.delete(warehouseId);
      return next;
    });
  }, []);

  const getWorkerById = useCallback(
    (workerId: string) => availableWorkers.find((w: WarehouseWorker) => w.id === workerId),
    [availableWorkers]
  );

  const markChanged = useCallback(() => {
    // No-op - changes are tracked automatically
  }, []);

  const resetChanges = useCallback(() => {
    setLocalModifications(new Map());
    setDeletedIds(new Set());
    setNewWarehouses([]);
  }, []);

  // Save all pending changes to backend
  // Uses direct API calls instead of React Query mutations to avoid race conditions
  // from automatic query invalidations that would occur mid-save
  const saveChanges = useCallback(async () => {
    const errors: string[] = [];

    // DEBUG: Log what we're about to save
    console.log('=== SAVE CHANGES START ===');
    console.log('localModifications:', Object.fromEntries(localModifications));

    // Process deletions using mutation (this is safe since we're deleting)
    for (const id of deletedIds) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        errors.push(`Failed to delete warehouse: ${err}`);
      }
    }

    // Process updates using direct API calls to avoid race conditions
    for (const [id, mods] of localModifications) {
      console.log(`Processing warehouse ${id}:`, mods);
      console.log(`  mods.settings?.workers:`, mods.settings?.workers);
      console.log(`  mods.settings?.locationLevels:`, mods.settings?.locationLevels);

      const apiWarehouse = apiWarehouses?.find((w) => w.id === id);
      if (apiWarehouse) {
        console.log(`  apiWarehouse.members:`, apiWarehouse.members);
        console.log(`  apiWarehouse.structure:`, apiWarehouse.structure);

        const existingAddress = addressesByWarehouse.get(id);
        const baseWarehouse = toLocalFormat(apiWarehouse, existingAddress);

        // Merge settings properly - don't let mods.settings completely overwrite base settings
        // Only override the specific fields that were modified
        const mergedSettings = {
          locationLevels: mods.settings?.locationLevels !== undefined
            ? mods.settings.locationLevels
            : baseWarehouse.settings.locationLevels,
          workers: mods.settings?.workers !== undefined
            ? mods.settings.workers
            : baseWarehouse.settings.workers,
        };

        // Remove settings from mods to avoid double-applying
        const { settings: _modsSettings, ...otherMods } = mods;
        const merged = { ...baseWarehouse, ...otherMods, settings: mergedSettings };

        console.log(`  merged.settings:`, merged.settings);

        // Only update basic warehouse info if those fields were actually modified
        const basicFieldsChanged =
          mods.name !== undefined ||
          mods.description !== undefined ||
          mods.isActive !== undefined;

        if (basicFieldsChanged) {
          try {
            console.log(`  Updating basic warehouse info`);
            await updateWarehouseApi(id, {
              name: merged.name,
              description: merged.description || null,
              isActive: merged.isActive,
            });
          } catch (err) {
            errors.push(`Failed to update ${merged.name}: ${err}`);
          }
        }

        // Update address if any address fields changed
        const addressFieldsChanged =
          mods.addressLine1 !== undefined ||
          mods.addressLine2 !== undefined ||
          mods.city !== undefined ||
          mods.state !== undefined ||
          mods.postalCode !== undefined ||
          mods.country !== undefined;

        if (addressFieldsChanged) {
          const hasAddressData =
            merged.addressLine1 || merged.city || merged.state || merged.postalCode || merged.country;

          if (hasAddressData) {
            const addressData = {
              line1: merged.addressLine1 || '',
              line2: merged.addressLine2 || null,
              city: merged.city || '',
              state: merged.state || null,
              zipCode: merged.postalCode || null,
              country: merged.country || 'USA',
              isPrimary: true,
            };

            try {
              if (existingAddress?.id) {
                // Update existing address
                await updateAddressApi(existingAddress.id, id, addressData);
              } else {
                // Create new address
                await createAddressApi(id, addressData);
              }
            } catch (err) {
              errors.push(`Failed to update address for ${merged.name}: ${err}`);
            }
          }
        }

        // Update structure (location levels)
        if (mods.settings?.locationLevels) {
          try {
            const enabledLevels = mods.settings.locationLevels
              .filter((l) => l.enabled)
              .map((l, idx) => ({
                code: LEVEL_TO_STRUCTURE_CODE[l.level],
                levelOrder: idx + 1,
              }));
            console.log(`  Updating structure with levels:`, enabledLevels);
            await updateWarehouseStructureApi(id, enabledLevels);
          } catch (err) {
            errors.push(`Failed to update structure for ${merged.name}: ${err}`);
          }
        }

        // Handle worker changes
        if (mods.settings?.workers) {
          const originalWorkers = apiWarehouse.members || [];
          const newWorkers = mods.settings.workers;

          // Find workers to remove
          for (const original of originalWorkers) {
            if (!newWorkers.some((w) => w.workerId === original.userId)) {
              try {
                console.log(`  Removing worker: ${original.userId}`);
                await removeWorkerApi(id, original.userId);
              } catch (err) {
                errors.push(`Failed to remove worker: ${err}`);
              }
            }
          }

          // Find workers to add or update
          for (const worker of newWorkers) {
            const originalWorker = originalWorkers.find((o) => o.userId === worker.workerId);
            const role = worker.role === 'manager' ? 2 : 1;

            if (!originalWorker) {
              // New worker
              try {
                console.log(`  Adding new worker: ${worker.workerId} with role ${role}`);
                const result = await assignWorkerApi(id, worker.workerId, role);
                console.log(`  Worker assigned successfully:`, result);
              } catch (err) {
                console.error(`  Failed to assign worker:`, err);
                errors.push(`Failed to assign worker: ${err}`);
              }
            } else {
              // Check if role changed - backend returns role as number (1/2) or string enum ('WORKER'/'MANAGER')
              const originalRoleIsManager = originalWorker.role === 2 || originalWorker.role === 'MANAGER';
              const newRoleIsManager = worker.role === 'manager';

              if (originalRoleIsManager !== newRoleIsManager) {
                // Role changed
                try {
                  console.log(`  Updating worker role: ${worker.workerId} from ${originalWorker.role} to ${role}`);
                  await updateWorkerRoleApi(id, worker.workerId, role);
                } catch (err) {
                  errors.push(`Failed to update worker role: ${err}`);
                }
              }
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      console.error('Save errors:', errors);
    }

    // Now that ALL saves are complete, invalidate and refetch once
    // This ensures we get fresh data with all changes applied
    console.log('=== REFETCHING DATA ===');
    await queryClient.invalidateQueries({ queryKey: warehousesQueryKeys.all });
    await queryClient.refetchQueries({ queryKey: warehousesQueryKeys.list() });

    // Log what the API returned after refetch
    const newApiData = queryClient.getQueryData(warehousesQueryKeys.list());
    console.log('New API data after refetch:', newApiData);

    // Clear modification tracking and reload addresses
    console.log('=== CLEARING LOCAL MODIFICATIONS ===');
    setLocalModifications(new Map());
    setDeletedIds(new Set());
    setNewWarehouses([]);
    setAddressesLoaded(false); // Trigger address reload
    console.log('=== SAVE CHANGES END ===');
  }, [
    apiWarehouses,
    addressesByWarehouse,
    localModifications,
    deletedIds,
    queryClient,
    deleteMutation,
  ]);

  return {
    // State
    warehouses,
    availableWorkers,
    expandedWarehouse,
    showNewWarehouseModal,
    showAddWorkerModal,
    showLayoutModal,
    showQRCodesModal,
    hasChanges,
    isLoading,
    error,

    // Setters
    setExpandedWarehouse,
    setShowNewWarehouseModal,
    setShowAddWorkerModal,
    setShowLayoutModal,
    setShowQRCodesModal,
    setWarehouses: () => {}, // No-op for compatibility

    // Handlers
    toggleWarehouseExpansion,
    toggleLevel,
    updateWarehouseField,
    updateLocationLevels,
    addWorker,
    updateWorkerRole,
    removeWorker,
    getWorkerById,
    handleCreateWarehouse,
    handleDeleteWarehouse,
    saveChanges,
    markChanged,
    resetChanges,
  };
}
