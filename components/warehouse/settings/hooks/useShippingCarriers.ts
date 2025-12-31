// Shipping carriers management hook with backend API integration
// Updates are batched locally and only saved when saveChanges() is called

import { useState, useCallback, useMemo } from 'react';
import {
  useShippingCarriersQuery,
  useCreateShippingCarrier,
  useUpdateShippingCarrier,
  useDeleteShippingCarrier,
  useSetShippingCarrierAddress,
  useLinkContactToShippingCarrier,
  useUnlinkContactFromShippingCarrier,
  type ShippingCarrier as ApiShippingCarrier,
} from '../api';
import { createContact } from '../../../lib/graphql/contacts';

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
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactId?: string; // ID of the linked contact
  contactData?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    role?: string;
    territory?: string;
    notes?: string;
  };
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
  contactName: carrier.primaryContact
    ? `${carrier.primaryContact.firstName} ${carrier.primaryContact.lastName}`.trim()
    : undefined,
  contactPhone: carrier.primaryContact?.phone ?? undefined,
  contactEmail: carrier.primaryContact?.email ?? undefined,
  contactId: carrier.primaryContact?.id,
  contactData: carrier.primaryContact ? {
    firstName: carrier.primaryContact.firstName,
    lastName: carrier.primaryContact.lastName,
    email: carrier.primaryContact.email ?? undefined,
    phone: carrier.primaryContact.phone ?? undefined,
    role: carrier.primaryContact.role ?? undefined,
  } : undefined,
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
  const setAddressMutation = useSetShippingCarrierAddress();
  const linkContactMutation = useLinkContactToShippingCarrier();
  const unlinkContactMutation = useUnlinkContactFromShippingCarrier();

  // Local modifications - map of carrier ID to partial updates
  const [localModifications, setLocalModifications] = useState<Map<string, Partial<ShippingCarrier>>>(new Map());

  // Track which carriers have been deleted locally (not yet saved)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // UI state
  const [expandedCarrierId, setExpandedCarrierId] = useState<string | null>(null);
  const [newCarrierName, setNewCarrierName] = useState('');
  const [newCarrierAccount, setNewCarrierAccount] = useState('');
  const [newCarrierRemarks, setNewCarrierRemarks] = useState('');

  // Derive local carriers from API data + local modifications
  const localCarriers = useMemo(() => {
    if (!apiCarriers) return [];

    return apiCarriers
      .map(toLocalFormat)
      .filter(c => !deletedIds.has(c.id))
      .map(carrier => {
        const mods = localModifications.get(carrier.id);
        return mods ? { ...carrier, ...mods } : carrier;
      });
  }, [apiCarriers, deletedIds, localModifications]);

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

    // Process updates - need to merge with current API data
    for (const [id, mods] of localModifications) {
      const apiCarrier = apiCarriers?.find(c => c.id === id);
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

        // Save billing address if address data was modified
        if (mods.billingAddressData) {
          try {
            await setAddressMutation.mutateAsync({
              carrierId: id,
              input: {
                line1: mods.billingAddressData.line1,
                line2: mods.billingAddressData.line2 ?? null,
                city: mods.billingAddressData.city,
                state: mods.billingAddressData.state ?? null,
                zipCode: mods.billingAddressData.zipCode ?? null,
                country: mods.billingAddressData.country,
                addressType: 'BILLING',
                isPrimary: true,
              },
            });
          } catch (err) {
            errors.push(`Failed to save billing address for ${merged.name}: ${err}`);
          }
        }

        // Save contact if contactData was modified and no contact is linked yet
        if (mods.contactData && !merged.contactId && mods.contactData.firstName) {
          console.log('Creating new contact for carrier:', merged.name, mods.contactData);
          try {
            // Create a new contact using the structured contactData
            const newContact = await createContact({
              firstName: mods.contactData.firstName,
              lastName: mods.contactData.lastName || '',
              email: mods.contactData.email || undefined,
              phone: mods.contactData.phone || undefined,
              role: mods.contactData.role || 'Carrier Contact',
              territory: mods.contactData.territory || undefined,
              notes: mods.contactData.notes || undefined,
            });
            console.log('Contact created:', newContact);

            // Link the contact to this shipping carrier
            console.log('Linking contact to carrier:', id, newContact.id);
            await linkContactMutation.mutateAsync({
              carrierId: id,
              contactId: newContact.id,
            });
            console.log('Contact linked successfully');
          } catch (err) {
            console.error('Failed to save contact:', err);
            errors.push(`Failed to save contact for ${merged.name}: ${err}`);
          }
        } else {
          console.log('Skipping contact save:', {
            hasContactData: !!mods.contactData,
            hasExistingContactId: !!merged.contactId,
            hasFirstName: !!mods.contactData?.firstName,
          });
        }
      }
    }

    if (errors.length > 0) {
      console.error('Save errors:', errors);
    }

    // Clear modification tracking
    setLocalModifications(new Map());
    setDeletedIds(new Set());
  }, [apiCarriers, localModifications, deletedIds, updateMutation, deleteMutation, setAddressMutation, linkContactMutation]);

  const markChanged = useCallback(() => {
    // No-op - changes are tracked automatically
  }, []);

  const resetChanges = useCallback(() => {
    setLocalModifications(new Map());
    setDeletedIds(new Set());
  }, []);

  // Unlink contact from carrier (immediate API call)
  const handleUnlinkContact = useCallback(async (carrierId: string) => {
    const carrier = localCarriers.find(c => c.id === carrierId);
    if (!carrier?.contactId) return;

    try {
      await unlinkContactMutation.mutateAsync({
        carrierId,
        contactId: carrier.contactId,
      });
    } catch (err) {
      console.error('Failed to unlink contact:', err);
    }
  }, [localCarriers, unlinkContactMutation]);

  // Link existing contact to carrier (immediate API call)
  const handleLinkContact = useCallback(async (carrierId: string, contactId: string) => {
    try {
      await linkContactMutation.mutateAsync({
        carrierId,
        contactId,
      });
    } catch (err) {
      console.error('Failed to link contact:', err);
    }
  }, [linkContactMutation]);

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
    handleUnlinkContact,
    handleLinkContact,
    saveChanges,
    markChanged,
    resetChanges,
  };
}
