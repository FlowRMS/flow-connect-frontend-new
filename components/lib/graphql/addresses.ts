/**
 * Address GraphQL Operations
 * CRUD operations for addresses with Google Maps integration
 */

import { crmGraphQLRequest } from './client';
import type { AddressSourceType, AddressType, Address, CreateAddressInput, UpdateAddressInput } from '../../shared/google-maps-address/types';

// ============================================================================
// GraphQL Fragments
// ============================================================================

const ADDRESS_FRAGMENT = `
  id
  addressType
  city
  country
  createdAt
  isPrimary
  line1
  line2
  notes
  sourceId
  sourceType
  state
  zipCode
`;

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Fetch a single address by ID
 */
export async function fetchAddress(id: string): Promise<Address | null> {
  const query = `
    query GetAddress($id: UUID!) {
      address(id: $id) {
        ${ADDRESS_FRAGMENT}
      }
    }
  `;

  const response = await crmGraphQLRequest<{ address: Address | null }>({
    query,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch address');
  }

  return response.data?.address || null;
}

/**
 * Fetch all addresses for a source entity
 */
export async function fetchAddressesBySource(
  sourceId: string,
  sourceType: AddressSourceType
): Promise<Address[]> {
  const query = `
    query GetAddressesBySource($sourceId: UUID!, $sourceType: AddressSourceTypeEnum!) {
      addressesBySource(sourceId: $sourceId, sourceType: $sourceType) {
        ${ADDRESS_FRAGMENT}
      }
    }
  `;

  const response = await crmGraphQLRequest<{ addressesBySource: Address[] }>({
    query,
    variables: { sourceId, sourceType },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch addresses');
  }

  return response.data?.addressesBySource || [];
}

/**
 * Fetch all addresses for a source ID (regardless of source type)
 */
export async function fetchAddressesBySourceId(sourceId: string): Promise<Address[]> {
  const query = `
    query GetAddressesBySourceId($sourceId: UUID!) {
      addressesBySourceId(sourceId: $sourceId) {
        ${ADDRESS_FRAGMENT}
      }
    }
  `;

  const response = await crmGraphQLRequest<{ addressesBySourceId: Address[] }>({
    query,
    variables: { sourceId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch addresses');
  }

  return response.data?.addressesBySourceId || [];
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Create a new address
 */
export async function createAddress(input: CreateAddressInput): Promise<Address> {
  const query = `
    mutation CreateAddress($input: AddressInput!) {
      createAddress(input: $input) {
        ${ADDRESS_FRAGMENT}
      }
    }
  `;

  const response = await crmGraphQLRequest<{ createAddress: Address }>({
    query,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create address');
  }

  if (!response.data?.createAddress) {
    throw new Error('Failed to create address');
  }

  return response.data.createAddress;
}

/**
 * Update an existing address
 */
export async function updateAddress(
  id: string,
  input: UpdateAddressInput
): Promise<Address> {
  const query = `
    mutation UpdateAddress($id: UUID!, $input: AddressInput!) {
      updateAddress(id: $id, input: $input) {
        ${ADDRESS_FRAGMENT}
      }
    }
  `;

  const response = await crmGraphQLRequest<{ updateAddress: Address }>({
    query,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update address');
  }

  if (!response.data?.updateAddress) {
    throw new Error('Failed to update address');
  }

  return response.data.updateAddress;
}

/**
 * Delete an address
 */
export async function deleteAddress(id: string): Promise<boolean> {
  const query = `
    mutation DeleteAddress($id: UUID!) {
      deleteAddress(id: $id)
    }
  `;

  const response = await crmGraphQLRequest<{ deleteAddress: boolean }>({
    query,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete address');
  }

  return response.data?.deleteAddress ?? false;
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  Address,
  AddressType,
  AddressSourceType,
  CreateAddressInput,
  UpdateAddressInput,
};
