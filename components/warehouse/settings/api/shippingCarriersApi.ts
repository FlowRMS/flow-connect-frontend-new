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
  addressTypes: string[];
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
  // Linked entities (read-only for now)
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
    }
  }
`;

// Separate queries for linked entities (avoids N+1 on list queries)
const GET_CARRIER_ADDRESSES = `
  query GetCarrierAddresses($sourceId: UUID!, $sourceType: AddressSourceTypeEnum!) {
    addressesBySource(sourceId: $sourceId, sourceType: $sourceType) {
      id
      line1
      line2
      city
      state
      zipCode
      country
      isPrimary
    }
  }
`;

const GET_CARRIER_CONTACT_LINKS = `
  query GetCarrierContactLinks($sourceType: EntityType!, $sourceId: UUID!) {
    linksFromSource(sourceType: $sourceType, sourceId: $sourceId) {
      targetEntityType
      targetEntityId
    }
  }
`;

const GET_CONTACT = `
  query GetContact($id: UUID!) {
    contact(id: $id) {
      id
      firstName
      lastName
      email
      phone
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
 * Fetch billing address for a shipping carrier using separate query
 */
export async function fetchCarrierBillingAddress(carrierId: string): Promise<Address | null> {
  const response = await crmGraphQLRequest<{ addressesBySource: Address[] }>({
    query: GET_CARRIER_ADDRESSES,
    variables: { sourceId: carrierId, sourceType: 'SHIPPING_CARRIER' },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch carrier address');
  }

  // Return the first (billing) address if exists
  return response.data?.addressesBySource?.[0] || null;
}

interface LinkRelation {
  targetEntityType: string;
  targetEntityId: string;
}

/**
 * Fetch primary contact for a shipping carrier using separate queries
 */
export async function fetchCarrierPrimaryContact(carrierId: string): Promise<Contact | null> {
  // First get the link to find the contact ID
  const linksResponse = await crmGraphQLRequest<{ linksFromSource: LinkRelation[] }>({
    query: GET_CARRIER_CONTACT_LINKS,
    variables: { sourceType: 'SHIPPING_CARRIER', sourceId: carrierId },
  });

  if (linksResponse.errors) {
    throw new Error(linksResponse.errors[0]?.message || 'Failed to fetch carrier contact links');
  }

  // Find the contact link
  const contactLink = linksResponse.data?.linksFromSource?.find(
    link => link.targetEntityType === 'CONTACT'
  );

  if (!contactLink) {
    return null;
  }

  // Fetch the contact details
  const contactResponse = await crmGraphQLRequest<{ contact: Contact }>({
    query: GET_CONTACT,
    variables: { id: contactLink.targetEntityId },
  });

  if (contactResponse.errors) {
    throw new Error(contactResponse.errors[0]?.message || 'Failed to fetch contact');
  }

  return contactResponse.data?.contact || null;
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
      addressTypes
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
      addressTypes
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
      addressTypes
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
    addressTypes: address.addressTypes || ['BILLING'],
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
    addressTypes: address.addressTypes || ['BILLING'],
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

// ============================================================================
// Contact Mutations for Shipping Carriers
// ============================================================================

export interface ContactInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
}

export interface LinkRelationInput {
  sourceEntityType: string;
  sourceEntityId: string;
  targetEntityType: string;
  targetEntityId: string;
}

const CREATE_CONTACT = `
  mutation CreateContact($input: ContactInput!) {
    createContact(input: $input) {
      id
      firstName
      lastName
      email
      phone
      role
    }
  }
`;

const UPDATE_CONTACT = `
  mutation UpdateContact($id: UUID!, $input: ContactInput!) {
    updateContact(id: $id, input: $input) {
      id
      firstName
      lastName
      email
      phone
      role
    }
  }
`;

const CREATE_LINK = `
  mutation CreateLink($input: LinkRelationInput!) {
    createLink(input: $input) {
      id
      sourceEntityType
      sourceEntityId
      targetEntityType
      targetEntityId
    }
  }
`;

const DELETE_LINK_BY_ENTITIES = `
  mutation DeleteLinkByEntities($input: DeleteLinkByEntitiesInput!) {
    deleteLinkByEntities(input: $input)
  }
`;

/**
 * Create a contact for a shipping carrier
 */
export async function createCarrierContact(
  carrierId: string,
  contact: ContactInput
): Promise<Contact> {
  // First create the contact
  const contactResponse = await crmGraphQLRequest<{ createContact: Contact }>({
    query: CREATE_CONTACT,
    variables: { input: contact },
  });

  if (contactResponse.errors) {
    throw new Error(contactResponse.errors[0]?.message || 'Failed to create contact');
  }

  if (!contactResponse.data?.createContact) {
    throw new Error('No contact returned from create mutation');
  }

  const createdContact = contactResponse.data.createContact;

  // Then link it to the carrier
  const linkInput: LinkRelationInput = {
    sourceEntityType: 'SHIPPING_CARRIER',
    sourceEntityId: carrierId,
    targetEntityType: 'CONTACT',
    targetEntityId: createdContact.id,
  };

  const linkResponse = await crmGraphQLRequest<{ createLink: { id: string } }>({
    query: CREATE_LINK,
    variables: { input: linkInput },
  });

  if (linkResponse.errors) {
    throw new Error(linkResponse.errors[0]?.message || 'Failed to link contact to carrier');
  }

  return createdContact;
}

/**
 * Update an existing contact for a shipping carrier
 */
export async function updateCarrierContact(
  contactId: string,
  contact: ContactInput
): Promise<Contact> {
  const response = await crmGraphQLRequest<{ updateContact: Contact }>({
    query: UPDATE_CONTACT,
    variables: { id: contactId, input: contact },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update contact');
  }

  if (!response.data?.updateContact) {
    throw new Error('No contact returned from update mutation');
  }

  return response.data.updateContact;
}

/**
 * Link an existing contact to a shipping carrier
 * This will first unlink any existing contact, then create a new link
 */
export async function linkCarrierContact(
  carrierId: string,
  contactId: string,
  previousContactId?: string
): Promise<void> {
  // If there was a previous contact, unlink it first
  if (previousContactId) {
    try {
      await crmGraphQLRequest<{ deleteLinkByEntities: boolean }>({
        query: DELETE_LINK_BY_ENTITIES,
        variables: {
          input: {
            sourceEntityType: 'SHIPPING_CARRIER',
            sourceEntityId: carrierId,
            targetEntityType: 'CONTACT',
            targetEntityId: previousContactId,
          },
        },
      });
    } catch {
      // Ignore errors when unlinking - the link may not exist
    }
  }

  // Create the new link
  const linkInput: LinkRelationInput = {
    sourceEntityType: 'SHIPPING_CARRIER',
    sourceEntityId: carrierId,
    targetEntityType: 'CONTACT',
    targetEntityId: contactId,
  };

  const linkResponse = await crmGraphQLRequest<{ createLink: { id: string } }>({
    query: CREATE_LINK,
    variables: { input: linkInput },
  });

  if (linkResponse.errors) {
    throw new Error(linkResponse.errors[0]?.message || 'Failed to link contact to carrier');
  }
}

/**
 * Unlink a contact from a shipping carrier
 */
export async function unlinkCarrierContact(
  carrierId: string,
  contactId: string
): Promise<void> {
  const response = await crmGraphQLRequest<{ deleteLinkByEntities: boolean }>({
    query: DELETE_LINK_BY_ENTITIES,
    variables: {
      input: {
        sourceEntityType: 'SHIPPING_CARRIER',
        sourceEntityId: carrierId,
        targetEntityType: 'CONTACT',
        targetEntityId: contactId,
      },
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to unlink contact from carrier');
  }
}
