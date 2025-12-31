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

export interface ShippingCarrier {
  id: string;
  name: string;
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
  // Linked entities
  primaryContact?: Contact | null;
  contacts?: Contact[];
  addresses?: Address[];
}

export interface CreateShippingCarrierInput {
  name: string;
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
      billingAddress {
        id
        line1
        line2
        city
        state
        zipCode
        country
        isPrimary
      }
      primaryContact {
        id
        firstName
        lastName
        email
        phone
        role
      }
    }
  }
`;

const GET_SHIPPING_CARRIER = `
  query GetShippingCarrier($id: UUID!) {
    shippingCarrier(id: $id) {
      id
      name
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
      billingAddress {
        id
        line1
        line2
        city
        state
        zipCode
        country
        isPrimary
      }
      primaryContact {
        id
        firstName
        lastName
        email
        phone
        role
      }
    }
  }
`;

const SEARCH_SHIPPING_CARRIERS = `
  query SearchShippingCarriers($searchTerm: String!, $limit: Int) {
    shippingCarrierSearch(searchTerm: $searchTerm, limit: $limit) {
      id
      name
      code
      accountNumber
      isActive
    }
  }
`;

const CREATE_SHIPPING_CARRIER = `
  mutation CreateShippingCarrier($input: ShippingCarrierInput!) {
    createShippingCarrier(input: $input) {
      id
      name
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

const SET_SHIPPING_CARRIER_ADDRESS = `
  mutation SetShippingCarrierAddress($carrierId: UUID!, $input: ShippingCarrierAddressInput!) {
    setShippingCarrierAddress(carrierId: $carrierId, input: $input) {
      id
      line1
      line2
      city
      state
      zipCode
      country
      isPrimary
      addressType
    }
  }
`;

const DELETE_SHIPPING_CARRIER_ADDRESS = `
  mutation DeleteShippingCarrierAddress($carrierId: UUID!, $addressId: UUID!) {
    deleteShippingCarrierAddress(carrierId: $carrierId, addressId: $addressId)
  }
`;

const LINK_CONTACT_TO_SHIPPING_CARRIER = `
  mutation LinkContactToShippingCarrier($carrierId: UUID!, $contactId: UUID!) {
    linkContactToShippingCarrier(carrierId: $carrierId, contactId: $contactId)
  }
`;

const UNLINK_CONTACT_FROM_SHIPPING_CARRIER = `
  mutation UnlinkContactFromShippingCarrier($carrierId: UUID!, $contactId: UUID!) {
    unlinkContactFromShippingCarrier(carrierId: $carrierId, contactId: $contactId)
  }
`;

// ============================================================================
// Input Types for Address/Contact Mutations
// ============================================================================

export interface ShippingCarrierAddressInput {
  line1: string;
  city: string;
  country: string;
  line2?: string | null;
  state?: string | null;
  zipCode?: string | null;
  notes?: string | null;
  isPrimary?: boolean;
  addressType?: 'BILLING' | 'SHIPPING' | 'MAILING' | 'OTHER';
}

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

/**
 * Set or update a shipping carrier's address
 */
export async function setShippingCarrierAddress(
  carrierId: string,
  input: ShippingCarrierAddressInput
): Promise<Address> {
  const response = await crmGraphQLRequest<{ setShippingCarrierAddress: Address }>({
    query: SET_SHIPPING_CARRIER_ADDRESS,
    variables: { carrierId, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to set shipping carrier address');
  }

  if (!response.data?.setShippingCarrierAddress) {
    throw new Error('No address returned from mutation');
  }

  return response.data.setShippingCarrierAddress;
}

/**
 * Delete a shipping carrier's address
 */
export async function deleteShippingCarrierAddress(
  carrierId: string,
  addressId: string
): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteShippingCarrierAddress: boolean }>({
    query: DELETE_SHIPPING_CARRIER_ADDRESS,
    variables: { carrierId, addressId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete shipping carrier address');
  }

  return true;
}

/**
 * Link a contact to a shipping carrier
 */
export async function linkContactToShippingCarrier(
  carrierId: string,
  contactId: string
): Promise<boolean> {
  const response = await crmGraphQLRequest<{ linkContactToShippingCarrier: boolean }>({
    query: LINK_CONTACT_TO_SHIPPING_CARRIER,
    variables: { carrierId, contactId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to link contact to shipping carrier');
  }

  return true;
}

/**
 * Unlink a contact from a shipping carrier
 */
export async function unlinkContactFromShippingCarrier(
  carrierId: string,
  contactId: string
): Promise<boolean> {
  const response = await crmGraphQLRequest<{ unlinkContactFromShippingCarrier: boolean }>({
    query: UNLINK_CONTACT_FROM_SHIPPING_CARRIER,
    variables: { carrierId, contactId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to unlink contact from shipping carrier');
  }

  return true;
}

// ============================================================================
// Contact Search (for linking contacts to carriers)
// ============================================================================

const CONTACT_SEARCH = `
  query ContactSearch($searchTerm: String!, $limit: Int) {
    contactSearch(searchTerm: $searchTerm, limit: $limit) {
      id
      firstName
      lastName
      email
      phone
      role
    }
  }
`;

export interface ContactSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
}

/**
 * Search contacts by name
 */
export async function searchContactsForCarrier(
  searchTerm: string,
  limit: number = 20
): Promise<ContactSearchResult[]> {
  const response = await crmGraphQLRequest<{ contactSearch: ContactSearchResult[] }>({
    query: CONTACT_SEARCH,
    variables: { searchTerm, limit },
  });

  if (response.errors) {
    console.error('Contact search error:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to search contacts');
  }

  return response.data?.contactSearch || [];
}
