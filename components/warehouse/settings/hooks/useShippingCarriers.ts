// Shipping carriers management hook with backend API integration
// Updates are batched locally and only saved when saveChanges() is called

import { useState, useCallback, useMemo } from 'react';
import {
  useShippingCarriersQuery,
  useCreateShippingCarrier,
  useUpdateShippingCarrier,
  useDeleteShippingCarrier,
  type ShippingCarrier as ApiShippingCarrier,
} from '../api';
import {
  createCarrierAddress,
  updateCarrierAddress,
  linkCarrierContact,
  unlinkCarrierContact,
} from '../api/shippingCarriersApi';

// Local shipping carrier type for backward compatibility with UI
export interface ShippingCarrier {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
  accountNumber?: string;
  // Billing address - stored as linked Address entity
  billingAddress?: string; // Formatted address string for display
  billingAddressId?: string; // ID of the linked address
  billingAddressData?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    zipCode?: string;
    country: string;
  };
  paymentTerms?: string;
  apiKey?: string;
  apiEndpoint?: string;
  trackingUrlTemplate?: string;
  // Contact info - stored as linked Contact entity
  primaryContactId?: string; // ID of the linked contact
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  serviceTypes?: string[];
  defaultServiceType?: string;
  maxWeight?: number;
  maxDimensions?: string;
  residentialSurcharge?: number;
  fuelSurchargePercent?: number;
  pickupSchedule?: string;
  pickupLocation?: string;
  remarks?: string;
  internalNotes?: string;
}

// Convert object format from backend to array for UI
// {"Ground": true, "Express": true} -> ["Ground", "Express"]
// Also handles JSON string format: "{\"Express\":true}" -> ["Express"]
const objectToArray = (obj: Record<string, boolean> | string[] | string | null | undefined): string[] | undefined => {
  if (!obj) return undefined;
  if (Array.isArray(obj)) return obj;

  // Handle JSON string from backend (GraphQL returns JSONB as string)
  if (typeof obj === 'string') {
    try {
      const parsed = JSON.parse(obj);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return Object.keys(parsed);
      }
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Not valid JSON, return undefined
      return undefined;
    }
    // If it's a string but not valid JSON object, return undefined
    return undefined;
  }

  // It's an object - get keys
  if (typeof obj === 'object') {
    return Object.keys(obj);
  }

  return undefined;
};

// Format address for display
const formatAddress = (addr: ApiShippingCarrier['billingAddress']): string | undefined => {
  if (!addr) return undefined;
  const parts = [addr.line1];
  if (addr.line2) parts.push(addr.line2);
  parts.push(`${addr.city}${addr.state ? `, ${addr.state}` : ''} ${addr.zipCode || ''}`);
  if (addr.country) parts.push(addr.country);
  return parts.filter(Boolean).join(', ');
};

// Convert API response to local format
const toLocalFormat = (carrier: ApiShippingCarrier): ShippingCarrier => ({
  id: carrier.id,
  name: carrier.name,
  code: carrier.code ?? undefined,
  isActive: carrier.isActive ?? true,
  accountNumber: carrier.accountNumber ?? undefined,
  // Billing address from linked entity
  billingAddress: formatAddress(carrier.billingAddress),
  billingAddressId: carrier.billingAddress?.id,
  billingAddressData: carrier.billingAddress ? {
    line1: carrier.billingAddress.line1,
    line2: carrier.billingAddress.line2 ?? undefined,
    city: carrier.billingAddress.city,
    state: carrier.billingAddress.state ?? undefined,
    zipCode: carrier.billingAddress.zipCode ?? undefined,
    country: carrier.billingAddress.country,
  } : undefined,
  paymentTerms: carrier.paymentTerms ?? undefined,
  apiKey: carrier.apiKey ?? undefined,
  apiEndpoint: carrier.apiEndpoint ?? undefined,
  trackingUrlTemplate: carrier.trackingUrlTemplate ?? undefined,
  // Contact from linked entity
  primaryContactId: carrier.primaryContact?.id,
  contactName: carrier.primaryContact
    ? `${carrier.primaryContact.firstName} ${carrier.primaryContact.lastName}`.trim()
    : undefined,
  contactPhone: carrier.primaryContact?.phone ?? undefined,
  contactEmail: carrier.primaryContact?.email ?? undefined,
  serviceTypes: objectToArray(carrier.serviceTypes as Record<string, boolean> | string[] | null),
  defaultServiceType: carrier.defaultServiceType ?? undefined,
  maxWeight: carrier.maxWeight ?? undefined,
  maxDimensions: carrier.maxDimensions ?? undefined,
  residentialSurcharge: carrier.residentialSurcharge ?? undefined,
  fuelSurchargePercent: carrier.fuelSurchargePercent ?? undefined,
  pickupSchedule: carrier.pickupSchedule ?? undefined,
  pickupLocation: carrier.pickupLocation ?? undefined,
  remarks: carrier.remarks ?? undefined,
  internalNotes: carrier.internalNotes ?? undefined,
});

// Convert array of service types to object format for backend JSONB field
const arrayToObject = (arr: string[] | undefined | null): Record<string, boolean> | null => {
  if (!arr || arr.length === 0) return null;
  return arr.reduce((obj, item) => ({ ...obj, [item]: true }), {} as Record<string, boolean>);
};

// Convert local format to API input
const toApiInput = (carrier: ShippingCarrier) => ({
  name: carrier.name,
  code: carrier.code ?? null,
  accountNumber: carrier.accountNumber ?? null,
  isActive: carrier.isActive ?? true,
  paymentTerms: carrier.paymentTerms ?? null,
  apiKey: carrier.apiKey ?? null,
  apiEndpoint: carrier.apiEndpoint ?? null,
  trackingUrlTemplate: carrier.trackingUrlTemplate ?? null,
  serviceTypes: arrayToObject(carrier.serviceTypes),
  defaultServiceType: carrier.defaultServiceType ?? null,
  maxWeight: carrier.maxWeight ?? null,
  maxDimensions: carrier.maxDimensions ?? null,
  residentialSurcharge: carrier.residentialSurcharge ?? null,
  fuelSurchargePercent: carrier.fuelSurchargePercent ?? null,
  pickupSchedule: carrier.pickupSchedule ?? null,
  pickupLocation: carrier.pickupLocation ?? null,
  remarks: carrier.remarks ?? null,
  internalNotes: carrier.internalNotes ?? null,
});

export function useShippingCarriers() {
  // React Query hooks for backend API
  const { data: apiCarriers, isLoading, error } = useShippingCarriersQuery();
  const createMutation = useCreateShippingCarrier();
  const updateMutation = useUpdateShippingCarrier();
  const deleteMutation = useDeleteShippingCarrier();

  // Local modifications - map of carrier ID to partial updates
  const [localModifications, setLocalModifications] = useState<Map<string, Partial<ShippingCarrier>>>(new Map());

  // Track which carriers have been deleted locally (not yet saved)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Track newly created carriers (before query refetch)
  // This ensures we can save changes to newly created carriers immediately
  const [newlyCreatedCarriers, setNewlyCreatedCarriers] = useState<Map<string, ApiShippingCarrier>>(new Map());

  // UI state
  const [expandedCarrierId, setExpandedCarrierId] = useState<string | null>(null);
  const [newCarrierName, setNewCarrierName] = useState('');
  const [newCarrierAccount, setNewCarrierAccount] = useState('');
  const [newCarrierRemarks, setNewCarrierRemarks] = useState('');

  // Derive local carriers from API data + newly created + local modifications
  const localCarriers = useMemo(() => {
    // Start with API carriers or empty array
    const apiList = apiCarriers || [];

    // Merge API carriers with newly created ones (avoid duplicates)
    const apiIds = new Set(apiList.map(c => c.id));
    const newCarriersNotInApi = Array.from(newlyCreatedCarriers.values())
      .filter(c => !apiIds.has(c.id));

    const allCarriers = [...apiList, ...newCarriersNotInApi];

    return allCarriers
      .map(toLocalFormat)
      .filter(c => !deletedIds.has(c.id))
      .map(carrier => {
        const mods = localModifications.get(carrier.id);
        return mods ? { ...carrier, ...mods } : carrier;
      });
  }, [apiCarriers, newlyCreatedCarriers, deletedIds, localModifications]);

  // Track if there are unsaved changes
  const hasChanges = localModifications.size > 0 || deletedIds.size > 0;

  const toggleCarrierExpansion = useCallback((carrierId: string) => {
    setExpandedCarrierId((prev) => (prev === carrierId ? null : carrierId));
  }, []);

  // Add carrier - creates immediately on backend
  const handleAddCarrier = useCallback(async () => {
    if (!newCarrierName.trim()) return;

    try {
      const created = await createMutation.mutateAsync({
        name: newCarrierName.trim(),
        isActive: true,
        accountNumber: newCarrierAccount.trim() || null,
        remarks: newCarrierRemarks.trim() || null,
      });

      // Track the newly created carrier locally so we can save changes immediately
      // (before the query refetches)
      setNewlyCreatedCarriers(prev => {
        const next = new Map(prev);
        next.set(created.id, created);
        return next;
      });

      // Clear form fields
      setNewCarrierName('');
      setNewCarrierAccount('');
      setNewCarrierRemarks('');

      // Expand the newly added carrier
      setExpandedCarrierId(created.id);
    } catch (err) {
      console.error('Failed to create shipping carrier:', err);
    }
  }, [newCarrierName, newCarrierAccount, newCarrierRemarks, createMutation]);

  // Mark carrier for deletion (actual delete happens on save)
  const handleDeleteCarrier = useCallback((id: string) => {
    setDeletedIds(prev => new Set(prev).add(id));
    setLocalModifications(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Update carrier locally only (no API call until save)
  const handleUpdateCarrier = useCallback((id: string, updates: Partial<ShippingCarrier>) => {
    setLocalModifications(prev => {
      const next = new Map(prev);
      const existing = next.get(id) || {};
      next.set(id, { ...existing, ...updates });
      return next;
    });
  }, []);

  // Save all pending changes to backend
  const saveChanges = useCallback(async () => {
    const errors: string[] = [];

    // Process deletions
    for (const id of deletedIds) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        errors.push(`Failed to delete carrier: ${err}`);
      }
    }

    // Process updates - need to merge with current API data or newly created carriers
    for (const [id, mods] of localModifications) {
      const apiCarrier = apiCarriers?.find(c => c.id === id) || newlyCreatedCarriers.get(id);
      if (apiCarrier) {
        const merged = { ...toLocalFormat(apiCarrier), ...mods };
        try {
          await updateMutation.mutateAsync({
            id,
            input: toApiInput(merged),
          });
        } catch (err) {
          errors.push(`Failed to update ${merged.name}: ${err}`);
        }

        // Update billing address if any address fields changed
        const addressFieldsChanged = mods.billingAddressData !== undefined;

        if (addressFieldsChanged && mods.billingAddressData) {
          const addressData = {
            line1: mods.billingAddressData.line1 || '',
            line2: mods.billingAddressData.line2 || null,
            city: mods.billingAddressData.city || '',
            state: mods.billingAddressData.state || null,
            zipCode: mods.billingAddressData.zipCode || null,
            country: mods.billingAddressData.country || 'USA',
            isPrimary: true,
          };

          // Only save if there's actual address data
          const hasAddressData = addressData.line1 || addressData.city;

          if (hasAddressData) {
            try {
              if (apiCarrier.billingAddress?.id) {
                // Update existing address
                await updateCarrierAddress(apiCarrier.billingAddress.id, id, addressData);
              } else {
                // Create new address
                await createCarrierAddress(id, addressData);
              }
            } catch (err) {
              errors.push(`Failed to update billing address for ${merged.name}: ${err}`);
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      console.error('Save errors:', errors);
    }

    // Clear modification tracking
    setLocalModifications(new Map());
    setDeletedIds(new Set());
  }, [apiCarriers, newlyCreatedCarriers, localModifications, deletedIds, updateMutation, deleteMutation]);

  // Save changes for a single carrier
  const saveCarrier = useCallback(async (carrierId: string) => {
    const mods = localModifications.get(carrierId);
    if (!mods) return;

    // Look in both API carriers and newly created carriers
    const apiCarrier = apiCarriers?.find(c => c.id === carrierId) || newlyCreatedCarriers.get(carrierId);
    if (!apiCarrier) return;

    const merged = { ...toLocalFormat(apiCarrier), ...mods };

    try {
      await updateMutation.mutateAsync({
        id: carrierId,
        input: toApiInput(merged),
      });

      // Update billing address if any address fields changed
      const addressFieldsChanged = mods.billingAddressData !== undefined;

      if (addressFieldsChanged && mods.billingAddressData) {
        const addressData = {
          line1: mods.billingAddressData.line1 || '',
          line2: mods.billingAddressData.line2 || null,
          city: mods.billingAddressData.city || '',
          state: mods.billingAddressData.state || null,
          zipCode: mods.billingAddressData.zipCode || null,
          country: mods.billingAddressData.country || 'USA',
          isPrimary: true,
        };

        const hasAddressData = addressData.line1 || addressData.city;

        if (hasAddressData) {
          if (apiCarrier.billingAddress?.id) {
            await updateCarrierAddress(apiCarrier.billingAddress.id, carrierId, addressData);
          } else {
            await createCarrierAddress(carrierId, addressData);
          }
        }
      }

      // Update contact link if primaryContactId changed
      const contactChanged = mods.primaryContactId !== undefined;

      if (contactChanged) {
        const previousContactId = apiCarrier.primaryContact?.id;
        const newContactId = merged.primaryContactId;

        if (newContactId && newContactId !== previousContactId) {
          // Link new contact (will unlink previous if exists)
          await linkCarrierContact(carrierId, newContactId, previousContactId);
        } else if (!newContactId && previousContactId) {
          // Contact was cleared - unlink it
          await unlinkCarrierContact(carrierId, previousContactId);
        }
      }

      // Clear modifications for this carrier only
      setLocalModifications(prev => {
        const next = new Map(prev);
        next.delete(carrierId);
        return next;
      });
    } catch (err) {
      console.error(`Failed to save carrier ${merged.name}:`, err);
      throw err;
    }
  }, [apiCarriers, newlyCreatedCarriers, localModifications, updateMutation]);

  // Delete carrier immediately with API call
  const deleteCarrierImmediately = useCallback(async (carrierId: string) => {
    try {
      await deleteMutation.mutateAsync(carrierId);
      // Clear from local modifications if any
      setLocalModifications(prev => {
        const next = new Map(prev);
        next.delete(carrierId);
        return next;
      });
    } catch (err) {
      console.error('Failed to delete carrier:', err);
      throw err;
    }
  }, [deleteMutation]);

  // Check if a specific carrier has unsaved changes
  const hasCarrierChanges = useCallback((carrierId: string) => {
    return localModifications.has(carrierId);
  }, [localModifications]);

  const markChanged = useCallback(() => {
    // No-op - changes are tracked automatically
  }, []);

  const resetChanges = useCallback(() => {
    setLocalModifications(new Map());
    setDeletedIds(new Set());
  }, []);

  return {
    // State
    shippingCarriers: localCarriers,
    expandedCarrierId,
    newCarrierName,
    newCarrierAccount,
    newCarrierRemarks,
    hasChanges,
    isLoading,
    error,

    // Setters
    setExpandedCarrierId,
    setNewCarrierName,
    setNewCarrierAccount,
    setNewCarrierRemarks,
    setShippingCarriers: () => {}, // No-op for compatibility

    // Handlers
    toggleCarrierExpansion,
    handleAddCarrier,
    handleUpdateCarrier,
    handleDeleteCarrier,
    saveCarrier,
    deleteCarrierImmediately,
    hasCarrierChanges,
    saveChanges,
    markChanged,
    resetChanges,
  };
}
