/**
 * Shipping Carriers API Module
 * GraphQL API for warehouse shipping carriers CRUD operations
 */

import { crmGraphQLRequest } from '../../../lib/graphql/client';

// ============================================================================
// Types
// ============================================================================

export interface Address {
  id: string;
  sourceId: string;
  sourceType: string;
  addressType: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  zipCode?: string | null;
  country: string;
  notes?: string | null;
  isPrimary: boolean;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
}

export type CarrierType = 'PARCEL' | 'FREIGHT';

export interface ShippingCarrier {
  id: string;
  name: string;
  carrierType?: CarrierType | null;
  code?: string | null; // SCAC code
  accountNumber?: string | null;
  isActive?: boolean | null;
  createdAt?: string;
  // Account & Billing
  paymentTerms?: string | null;
  billingAddress?: Address | null;
  // API Integration
  apiKey?: string | null;
  apiEndpoint?: string | null;
  trackingUrlTemplate?: string | null;
  // Service Configuration
  serviceTypes?: string[] | null;
  defaultServiceType?: string | null;
  // Shipping Settings
  maxWeight?: number | null;
  maxDimensions?: string | null;
  residentialSurcharge?: number | null;
  fuelSurchargePercent?: number | null;
  // Pickup Settings
  pickupSchedule?: string | null;
  pickupLocation?: string | null;
  // Notes
  remarks?: string | null;
  internalNotes?: string | null;
  // Linked entities (read-only for now)
  primaryContact?: Contact | null;
  contacts?: Contact[];
  addresses?: Address[];
}

export interface CreateShippingCarrierInput {
  name: string;
  carrierType?: CarrierType | null;
  code?: string | null;
  accountNumber?: string | null;
  isActive?: boolean;
  paymentTerms?: string | null;
  apiKey?: string | null;
  apiEndpoint?: string | null;
  trackingUrlTemplate?: string | null;
  serviceTypes?: Record<string, boolean> | null; // Backend expects object like {"Ground": true}
  defaultServiceType?: string | null;
  maxWeight?: number | null;
  maxDimensions?: string | null;
  residentialSurcharge?: number | null;
  fuelSurchargePercent?: number | null;
  pickupSchedule?: string | null;
  pickupLocation?: string | null;
  remarks?: string | null;
  internalNotes?: string | null;
}

export type UpdateShippingCarrierInput = CreateShippingCarrierInput;

// ============================================================================
// GraphQL Queries
// ============================================================================

const GET_SHIPPING_CARRIERS = `
  query GetShippingCarriers($activeOnly: Boolean) {
    shippingCarriers(activeOnly: $activeOnly) {
      id
      name
      carrierType
      code
      accountNumber
      isActive
      createdAt
      paymentTerms
      apiKey
      apiEndpoint
      trackingUrlTemplate
      serviceTypes
      defaultServiceType
      maxWeight
      maxDimensions
      residentialSurcharge
      fuelSurchargePercent
      pickupSchedule
      pickupLocation
      remarks
      internalNotes
    }
  }
`;

const GET_SHIPPING_CARRIER = `
  query GetShippingCarrier($id: UUID!) {
    shippingCarrier(id: $id) {
      id
      name
      carrierType
      code
      accountNumber
      isActive
      createdAt
      paymentTerms
      apiKey
      apiEndpoint
      trackingUrlTemplate
      serviceTypes
      defaultServiceType
      maxWeight
      maxDimensions
      residentialSurcharge
      fuelSurchargePercent
      pickupSchedule
      pickupLocation
      remarks
      internalNotes
    }
  }
`;

const SEARCH_SHIPPING_CARRIERS = `
  query SearchShippingCarriers($searchTerm: String!, $limit: Int) {
    shippingCarrierSearch(searchTerm: $searchTerm, limit: $limit) {
      id
      name
      carrierType
      code
      accountNumber
      isActive
    }
  }
`;

const GET_SHIPPING_CARRIERS_BY_TYPE = `
  query GetShippingCarriersByType($carrierType: CarrierTypeEnum!, $activeOnly: Boolean) {
    shippingCarriersByType(carrierType: $carrierType, activeOnly: $activeOnly) {
      id
      name
      carrierType
      code
      accountNumber
      isActive
      trackingUrlTemplate
      defaultServiceType
    }
  }
`;

const CREATE_SHIPPING_CARRIER = `
  mutation CreateShippingCarrier($input: ShippingCarrierInput!) {
    createShippingCarrier(input: $input) {
      id
      name
      carrierType
      code
      accountNumber
      isActive
      createdAt
      paymentTerms
      apiKey
      apiEndpoint
      trackingUrlTemplate
      serviceTypes
      defaultServiceType
      maxWeight
      maxDimensions
      residentialSurcharge
      fuelSurchargePercent
      pickupSchedule
      pickupLocation
      remarks
      internalNotes
    }
  }
`;

const UPDATE_SHIPPING_CARRIER = `
  mutation UpdateShippingCarrier($id: UUID!, $input: ShippingCarrierInput!) {
    updateShippingCarrier(id: $id, input: $input) {
      id
      name
      carrierType
      code
      accountNumber
      isActive
      createdAt
      paymentTerms
      apiKey
      apiEndpoint
      trackingUrlTemplate
      serviceTypes
      defaultServiceType
      maxWeight
      maxDimensions
      residentialSurcharge
      fuelSurchargePercent
      pickupSchedule
      pickupLocation
      remarks
      internalNotes
    }
  }
`;

const DELETE_SHIPPING_CARRIER = `
  mutation DeleteShippingCarrier($id: UUID!) {
    deleteShippingCarrier(id: $id)
  }
`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all shipping carriers
 */
export async function fetchShippingCarriers(activeOnly = false): Promise<ShippingCarrier[]> {
  const response = await crmGraphQLRequest<{ shippingCarriers: ShippingCarrier[] }>({
    query: GET_SHIPPING_CARRIERS,
    variables: { activeOnly },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch shipping carriers');
  }

  return response.data?.shippingCarriers || [];
}

/**
 * Fetch a single shipping carrier by ID
 */
export async function fetchShippingCarrierById(id: string): Promise<ShippingCarrier | null> {
  const response = await crmGraphQLRequest<{ shippingCarrier: ShippingCarrier }>({
    query: GET_SHIPPING_CARRIER,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch shipping carrier');
  }

  return response.data?.shippingCarrier || null;
}

/**
 * Search shipping carriers by name
 */
export async function searchShippingCarriers(
  searchTerm: string,
  limit = 20
): Promise<ShippingCarrier[]> {
  const response = await crmGraphQLRequest<{ shippingCarrierSearch: ShippingCarrier[] }>({
    query: SEARCH_SHIPPING_CARRIERS,
    variables: { searchTerm, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search shipping carriers');
  }

  return response.data?.shippingCarrierSearch || [];
}

/**
 * Fetch shipping carriers by type (PARCEL or FREIGHT)
 */
export async function fetchShippingCarriersByType(
  carrierType: CarrierType,
  activeOnly = true
): Promise<ShippingCarrier[]> {
  const response = await crmGraphQLRequest<{ shippingCarriersByType: ShippingCarrier[] }>({
    query: GET_SHIPPING_CARRIERS_BY_TYPE,
    variables: { carrierType, activeOnly },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch shipping carriers by type');
  }

  return response.data?.shippingCarriersByType || [];
}

/**
 * Create a new shipping carrier
 */
export async function createShippingCarrier(
  input: CreateShippingCarrierInput
): Promise<ShippingCarrier> {
  const response = await crmGraphQLRequest<{ createShippingCarrier: ShippingCarrier }>({
    query: CREATE_SHIPPING_CARRIER,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create shipping carrier');
  }

  if (!response.data?.createShippingCarrier) {
    throw new Error('No shipping carrier returned from create mutation');
  }

  return response.data.createShippingCarrier;
}

/**
 * Update an existing shipping carrier
 */
export async function updateShippingCarrier(
  id: string,
  input: UpdateShippingCarrierInput
): Promise<ShippingCarrier> {
  const response = await crmGraphQLRequest<{ updateShippingCarrier: ShippingCarrier }>({
    query: UPDATE_SHIPPING_CARRIER,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update shipping carrier');
  }

  if (!response.data?.updateShippingCarrier) {
    throw new Error('No shipping carrier returned from update mutation');
  }

  return response.data.updateShippingCarrier;
}

/**
 * Delete a shipping carrier
 */
export async function deleteShippingCarrier(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteShippingCarrier: boolean }>({
    query: DELETE_SHIPPING_CARRIER,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete shipping carrier');
  }

  return true;
}

// ============================================================================
// Address API Functions for Shipping Carriers
// ============================================================================

// Import shared address types from warehousesApi
import type { AddressSourceType, AddressType, AddressInput } from './warehousesApi';

const GET_ADDRESSES_BY_SOURCE = `
  query GetAddressesBySource($sourceType: AddressSourceTypeEnum!, $sourceId: UUID!) {
    addressesBySource(sourceType: $sourceType, sourceId: $sourceId) {
      id
      sourceId
      sourceType
      addressType
      line1
      line2
      city
      state
      zipCode
      country
      notes
      isPrimary
      createdAt
    }
  }
`;

const CREATE_ADDRESS = `
  mutation CreateAddress($input: AddressInput!) {
    createAddress(input: $input) {
      id
      sourceId
      sourceType
      addressType
      line1
      line2
      city
      state
      zipCode
      country
      notes
      isPrimary
      createdAt
    }
  }
`;

const UPDATE_ADDRESS = `
  mutation UpdateAddress($id: UUID!, $input: AddressInput!) {
    updateAddress(id: $id, input: $input) {
      id
      sourceId
      sourceType
      addressType
      line1
      line2
      city
      state
      zipCode
      country
      notes
      isPrimary
      createdAt
    }
  }
`;

/**
 * Fetch addresses for a shipping carrier
 */
export async function fetchCarrierAddresses(carrierId: string): Promise<Address[]> {
  const response = await crmGraphQLRequest<{ addressesBySource: Address[] }>({
    query: GET_ADDRESSES_BY_SOURCE,
    variables: { sourceType: 'SHIPPING_CARRIER', sourceId: carrierId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch carrier addresses');
  }

  return response.data?.addressesBySource || [];
}

/**
 * Create a new address for a shipping carrier
 */
export async function createCarrierAddress(
  carrierId: string,
  address: Omit<AddressInput, 'sourceId' | 'sourceType'>
): Promise<Address> {
  const input: AddressInput = {
    ...address,
    sourceId: carrierId,
    sourceType: 'SHIPPING_CARRIER',
    addressType: address.addressType || 'BILLING',
  };

  const response = await crmGraphQLRequest<{ createAddress: Address }>({
    query: CREATE_ADDRESS,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create carrier address');
  }

  if (!response.data?.createAddress) {
    throw new Error('No address returned from create mutation');
  }

  return response.data.createAddress;
}

/**
 * Update an existing carrier address
 */
export async function updateCarrierAddress(
  addressId: string,
  carrierId: string,
  address: Omit<AddressInput, 'sourceId' | 'sourceType'>
): Promise<Address> {
  const input: AddressInput = {
    ...address,
    sourceId: carrierId,
    sourceType: 'SHIPPING_CARRIER',
    addressType: address.addressType || 'BILLING',
  };

  const response = await crmGraphQLRequest<{ updateAddress: Address }>({
    query: UPDATE_ADDRESS,
    variables: { id: addressId, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update carrier address');
  }

  if (!response.data?.updateAddress) {
    throw new Error('No address returned from update mutation');
  }

  return response.data.updateAddress;
}
