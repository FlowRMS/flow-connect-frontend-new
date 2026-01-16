# Warehouse Settings Module - Frontend Documentation

## Overview

The warehouse settings UI allows users to manage warehouses, shipping carriers, and container types. Located in the Settings section under Warehouse.

## File Structure

```
components/warehouse/settings/
├── WarehouseSettingsContent.tsx      # Main tab container
├── api/                              # GraphQL API & React Query hooks
│   ├── index.ts                      # Public exports
│   ├── containerTypesApi.ts          # Container types GraphQL calls
│   ├── useContainerTypesApi.ts       # Container types React Query hooks
│   ├── shippingCarriersApi.ts        # Shipping carriers GraphQL calls
│   └── useShippingCarriersApi.ts     # Shipping carriers React Query hooks
├── components/
│   ├── ShippingCarriersList.tsx      # List of carriers with accordion
│   ├── ShippingCarrierAccordionItem.tsx  # Individual carrier accordion
│   ├── CarrierBasicInfo.tsx          # Name, code, account fields
│   ├── CarrierAccountBilling.tsx     # Billing address section
│   ├── CarrierContactInfo.tsx        # Contact linking/creation
│   ├── CarrierApiSettings.tsx        # API integration settings
│   ├── CarrierServiceOptions.tsx     # Service types, weights
│   ├── CarrierPickupSchedule.tsx     # Pickup configuration
│   ├── CarrierNotes.tsx              # Notes section
│   └── ContainerTypesList.tsx        # Container types with drag-drop
├── hooks/
│   ├── useShippingCarriers.ts        # Shipping carriers state management
│   └── useContainerTypes.ts          # Container types state management
└── types.ts                          # TypeScript interfaces
```

## Components

### WarehouseSettingsContent
Main container with three tabs:
- **Warehouses** - Warehouse management (future)
- **Shipping Carriers** - Carrier configuration
- **Container Types** - Box/pallet types

### ShippingCarriersList
Displays list of shipping carriers:
- Accordion UI for each carrier
- Expand to edit carrier details
- Add new carrier button
- Save/delete actions

### ShippingCarrierAccordionItem
Individual carrier with sections:
- Basic Info (name, code, account number)
- Account & Billing (billing address)
- Contact Information (link/create contacts)
- API Settings (integration config)
- Service Options (service types, limits)
- Pickup Schedule (pickup config)
- Notes (internal notes)

### CarrierContactInfo
Contact management for carriers:
- **View Mode**: Shows linked contact details
- **Search Mode**: Search existing CRM contacts to link
- **Create Mode**: Create new contact inline
- Unlink contact functionality

### ContainerTypesList
Container type management:
- Drag-drop reordering
- Name, dimensions (L×W×H), weight
- CRUD operations
- Order persists to database

## API Layer

### GraphQL Queries

```graphql
# Shipping Carriers
query ShippingCarriers {
  shippingCarriers {
    id
    name
    code
    accountNumber
    isActive
    contactId
    contactData {
      firstName
      lastName
      email
      phone
      role
      territory
      notes
    }
    billingAddress {
      line1
      line2
      city
      state
      postalCode
      country
    }
    # ... other fields
  }
}

# Contact Search (for linking)
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

# Container Types
query ContainerTypes {
  containerTypes {
    id
    name
    length
    width
    height
    weight
    order
  }
}
```

### GraphQL Mutations

```graphql
# Shipping Carriers
mutation CreateShippingCarrier($input: ShippingCarrierInput!) {
  createShippingCarrier(input: $input) {
    id
    name
  }
}

mutation UpdateShippingCarrier($id: ID!, $input: ShippingCarrierInput!) {
  updateShippingCarrier(id: $id, input: $input) {
    id
    name
  }
}

mutation DeleteShippingCarrier($id: ID!) {
  deleteShippingCarrier(id: $id)
}

# Contact Linking
mutation LinkContactToCarrier($carrierId: ID!, $contactId: ID!) {
  linkContactToCarrier(carrierId: $carrierId, contactId: $contactId) {
    id
    contactId
  }
}

mutation UnlinkContactFromCarrier($carrierId: ID!, $contactId: ID!) {
  unlinkContactFromCarrier(carrierId: $carrierId, contactId: $contactId) {
    id
    contactId
  }
}

# Container Types
mutation CreateContainerType($input: ContainerTypeInput!) {
  createContainerType(input: $input) {
    id
    name
  }
}

mutation ReorderContainerTypes($orderedIds: [ID!]!) {
  reorderContainerTypes(orderedIds: $orderedIds) {
    id
    order
  }
}
```

## React Query Hooks

### Shipping Carriers

```typescript
// Fetch all carriers
const { data: carriers, isLoading } = useShippingCarriersQuery();

// Create carrier
const createMutation = useCreateShippingCarrierMutation();

// Update carrier
const updateMutation = useUpdateShippingCarrierMutation();

// Delete carrier
const deleteMutation = useDeleteShippingCarrierMutation();

// Link contact to carrier
const linkMutation = useLinkContactMutation();

// Unlink contact from carrier
const unlinkMutation = useUnlinkContactMutation();

// Search contacts (for linking)
const { data: contacts } = useContactSearchForCarrier(searchTerm, enabled);
```

### Container Types

```typescript
// Fetch all container types
const { data: types } = useContainerTypesQuery();

// Create type
const createMutation = useCreateContainerTypeMutation();

// Update type
const updateMutation = useUpdateContainerTypeMutation();

// Delete type
const deleteMutation = useDeleteContainerTypeMutation();

// Reorder types
const reorderMutation = useReorderContainerTypesMutation();
```

## State Management

### useShippingCarriers Hook

Manages local state for optimistic updates:

```typescript
const {
  carriers,           // Current carrier list
  updateCarrier,      // Update carrier locally
  saveCarrier,        // Persist to server
  deleteCarrier,      // Delete carrier
  handleLinkContact,  // Link contact to carrier
  handleUnlinkContact,// Unlink contact from carrier
  hasChanges,         // Track unsaved changes
  isSaving,           // Loading state
} = useShippingCarriers();
```

### useContainerTypes Hook

```typescript
const {
  containerTypes,     // Current types list
  updateType,         // Update type locally
  saveType,           // Persist to server
  deleteType,         // Delete type
  reorderTypes,       // Reorder types
} = useContainerTypes();
```

## TypeScript Types

```typescript
interface ShippingCarrier {
  id: string;
  name: string;
  code?: string;
  accountNumber?: string;
  isActive: boolean;

  // Contact linking
  contactId?: string;
  contactData?: ContactData;

  // Billing address
  billingAddress?: BillingAddress;

  // API settings
  apiKey?: string;
  apiEndpoint?: string;
  trackingUrlTemplate?: string;

  // Service options
  serviceTypes?: ServiceType[];
  defaultServiceType?: string;
  maxWeight?: number;
  maxDimensions?: string;
  residentialSurcharge?: number;
  fuelSurchargePercent?: number;

  // Pickup
  pickupSchedule?: string;
  pickupLocation?: string;

  // Notes
  remarks?: string;
  internalNotes?: string;
}

interface ContactData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  territory?: string;
  notes?: string;
}

interface BillingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface ContainerType {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight?: number;
  order: number;
}
```

## Contact Linking Flow

### Link Existing Contact

1. User clicks "Search Existing Contact"
2. Component enters search mode
3. User types name (min 2 chars)
4. `useContactSearchForCarrier` queries backend
5. Results shown in dropdown
6. User clicks contact to select
7. `handleLinkContact(carrierId, contactId)` called
8. Backend creates link in `link_relations` table
9. Carrier refetched with `contactData` populated

### Create New Contact

1. User clicks "Create New Contact"
2. Component enters create mode
3. User fills contact fields (firstName, lastName required)
4. On carrier save, contact created and linked
5. Backend creates contact in `pycrm.contacts`
6. Backend creates link in `pycrm.link_relations`

### Unlink Contact

1. User clicks "Unlink" button
2. `handleUnlinkContact(carrierId)` called
3. Backend removes link from `link_relations`
4. `contactId` set to null on carrier
5. UI returns to "no contact" view

## Database Tables

### pycrm.shipping_carriers
Main carrier data including billing address fields.

### pycrm.contacts
CRM contacts that can be linked to carriers.

### pycrm.link_relations
Bidirectional entity links:
- `source_type`: 'SHIPPING_CARRIER'
- `source_id`: carrier UUID
- `target_type`: 'CONTACT'
- `target_id`: contact UUID

## Notes

- Contact search uses same GraphQL client as shipping carriers (`crmGraphQLRequest`)
- Billing address stored directly on carrier (not via Address model)
- Contact data denormalized on carrier response for display
- Link relations enable bidirectional queries (carrier→contact, contact→carrier)
- Container type `order` field controls display order in dropdowns
