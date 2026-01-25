import { crmGraphQLRequest } from '@/components/lib/graphql/client';
import type {
  WarehouseLookup,
  ShippingCarrierLookup,
  FactoryLookup,
  DeliveryApi,
  DeliveryIssueApi,
  WarehouseMemberApi,
  WarehouseLocationApi,
  RecurringShipmentApi,
} from './types';

const DELIVERIES_LIST_QUERY = `
  query DeliveriesList($warehouseId: UUID, $limit: Int, $offset: Int) {
    deliveries(warehouseId: $warehouseId, limit: $limit, offset: $offset) {
      id
      poNumber
      warehouseId
      vendorId
      carrierId
      trackingNumber
      status
      expectedDate
      arrivedAt
      receivingStartedAt
      receivedAt
      originAddressId
      destinationAddressId
      recurringShipmentId
      vendorContactName
      vendorContactEmail
      notes
      createdAt
      createdById
      updatedById
      updatedAt
    }
  }
`;

const WAREHOUSE_MEMBERS_QUERY = `
  query WarehouseMembers($warehouseId: UUID!) {
    warehouseMembers(warehouseId: $warehouseId) {
      id
      warehouseId
      userId
      role
      createdAt
    }
  }
`;

const WAREHOUSE_LOCATIONS_QUERY = `
  query WarehouseLocations($warehouseId: UUID!) {
    warehouseLocations(warehouseId: $warehouseId) {
      id
      warehouseId
      parentId
      level
      name
      code
      description
      isActive
      sortOrder
    }
  }
`;

const DELIVERY_QUERY = `
  query Delivery($id: UUID!) {
    delivery(id: $id) {
      id
      poNumber
      warehouseId
      vendorId
      vendor {
        id
        title
        email
      }
      carrierId
      carrier {
        id
        name
        trackingUrlTemplate
        code
        isActive
      }
      trackingNumber
      status
      expectedDate
      arrivedAt
      receivingStartedAt
      receivedAt
      originAddressId
      destinationAddressId
      recurringShipmentId
      vendorContactName
      vendorContactEmail
      notes
      createdAt
      createdById
      updatedById
      updatedAt
      items {
        id
        productId
        expectedQuantity
        receivedQuantity
        damagedQuantity
        status
        discrepancyNotes
        product {
          id
          factoryPartNumber
          description
          unitPrice
        }
      }
      issues {
        id
        deliveryId
        deliveryItemId
        receiptId
        issueType
        customIssueType
        quantity
        status
        description
        notes
        communicatedAt
        createdAt
        createdById
      }
      documents {
        id
        name
        docType
        fileId
        fileUrl
        mimeType
        fileSize
        uploadedById
        uploadedAt
        notes
      }
      assignees {
        id
        userId
        role
      }
    }
  }
`;

const DELIVERY_ISSUE_QUERY = `
  query DeliveryIssue($id: UUID!) {
    deliveryIssue(id: $id) {
      id
      deliveryId
      deliveryItemId
      receiptId
      issueType
      customIssueType
      quantity
      status
      description
      notes
      communicatedAt
      createdAt
      createdById
    }
  }
`;

const WAREHOUSES_QUERY = `
  query Warehouses {
    warehouses {
      id
      name
      status
      isActive
    }
  }
`;

const SHIPPING_CARRIERS_QUERY = `
  query ShippingCarriers($activeOnly: Boolean) {
    shippingCarriers(activeOnly: $activeOnly) {
      id
      name
      trackingUrlTemplate
    }
  }
`;

const FACTORY_QUERY = `
  query Factory($id: UUID!) {
    factory(id: $id) {
      id
      title
      email
    }
  }
`;

const FACTORY_SEARCH_QUERY = `
  query FactorySearch($searchTerm: String!, $published: Boolean, $limit: Int) {
    factorySearch(searchTerm: $searchTerm, published: $published, limit: $limit) {
      id
      title
      email
    }
  }
`;

const PRODUCT_SEARCH_QUERY = `
  query ProductSearch($searchTerm: String!, $factoryId: UUID, $limit: Int) {
    productSearch(searchTerm: $searchTerm, factoryId: $factoryId, limit: $limit) {
      id
      factoryPartNumber
      description
    }
  }
`;

const RECURRING_SHIPMENTS_QUERY = `
  query RecurringShipments($warehouseId: UUID) {
    recurringShipments(warehouseId: $warehouseId) {
      id
      name
      vendorId
      vendorContactName
      vendorContactEmail
      warehouseId
      carrier
      notes
      recurrencePattern
      startDate
      endDate
      status
      lastGeneratedDate
      nextExpectedDate
      createdAt
      updatedAt
      createdById
      updatedById
    }
  }
`;

export async function fetchWarehouses(): Promise<WarehouseLookup[]> {
  const response = await crmGraphQLRequest<{ warehouses: WarehouseLookup[] }>({
    query: WAREHOUSES_QUERY,
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch warehouses');
  }

  return response.data?.warehouses || [];
}

export async function fetchShippingCarriers(activeOnly: boolean = false): Promise<ShippingCarrierLookup[]> {
  const response = await crmGraphQLRequest<{ shippingCarriers: ShippingCarrierLookup[] }>({
    query: SHIPPING_CARRIERS_QUERY,
    variables: { activeOnly },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch shipping carriers');
  }

  return response.data?.shippingCarriers || [];
}

export async function fetchWarehouseMembers(warehouseId: string): Promise<WarehouseMemberApi[]> {
  const response = await crmGraphQLRequest<{ warehouseMembers: WarehouseMemberApi[] }>({
    query: WAREHOUSE_MEMBERS_QUERY,
    variables: { warehouseId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch warehouse members');
  }

  return response.data?.warehouseMembers || [];
}

export async function fetchWarehouseLocations(warehouseId: string): Promise<WarehouseLocationApi[]> {
  const response = await crmGraphQLRequest<{ warehouseLocations: WarehouseLocationApi[] }>({
    query: WAREHOUSE_LOCATIONS_QUERY,
    variables: { warehouseId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch warehouse locations');
  }

  return response.data?.warehouseLocations || [];
}

export async function fetchDeliveries(
  warehouseId?: string,
  options?: { includeIssues?: boolean; limit?: number; offset?: number }
): Promise<DeliveryApi[]> {
  const response = await crmGraphQLRequest<{ deliveries: DeliveryApi[] }>({
    query: DELIVERIES_LIST_QUERY,
    variables: {
      warehouseId: warehouseId || null,
      limit: options?.limit ?? null,
      offset: options?.offset ?? null,
    },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch deliveries');
  }

  const deliveries = response.data?.deliveries || [];
  if (!deliveries.length) {
    return [];
  }

  const detailedDeliveries = await Promise.all(
    deliveries.map((delivery) => fetchDeliveryById(delivery.id))
  );

  return detailedDeliveries.filter((delivery): delivery is DeliveryApi => delivery !== null);
}

export async function fetchDeliveryById(id: string): Promise<DeliveryApi | null> {
  const response = await crmGraphQLRequest<{ delivery: DeliveryApi }>({
    query: DELIVERY_QUERY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch delivery');
  }

  return response.data?.delivery || null;
}

export async function fetchDeliveryIssueById(id: string): Promise<DeliveryIssueApi | null> {
  const response = await crmGraphQLRequest<{ deliveryIssue: DeliveryIssueApi }>({
    query: DELIVERY_ISSUE_QUERY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch delivery issue');
  }

  return response.data?.deliveryIssue || null;
}

export async function fetchFactoryById(id: string): Promise<FactoryLookup | null> {
  const response = await crmGraphQLRequest<{ factory: FactoryLookup }>({
    query: FACTORY_QUERY,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch factory');
  }

  return response.data?.factory || null;
}

export async function fetchFactories(searchTerm: string, published: boolean = true, limit: number = 50): Promise<FactoryLookup[]> {
  const response = await crmGraphQLRequest<{ factorySearch: FactoryLookup[] }>({
    query: FACTORY_SEARCH_QUERY,
    variables: { searchTerm, published, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search factories');
  }

  return response.data?.factorySearch || [];
}

export async function fetchProducts(
  searchTerm: string,
  factoryId?: string,
  limit: number = 50
): Promise<Array<{ id: string; factoryPartNumber: string; description?: string | null }>> {
  const response = await crmGraphQLRequest<{
    productSearch: Array<{ id: string; factoryPartNumber: string; description?: string | null }>;
  }>({
    query: PRODUCT_SEARCH_QUERY,
    variables: { searchTerm, factoryId: factoryId || null, limit },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to search products');
  }

  return response.data?.productSearch || [];
}

export async function fetchRecurringShipments(warehouseId?: string): Promise<RecurringShipmentApi[]> {
  const response = await crmGraphQLRequest<{ recurringShipments: RecurringShipmentApi[] }>({
    query: RECURRING_SHIPMENTS_QUERY,
    variables: { warehouseId: warehouseId || null },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch recurring shipments');
  }

  return response.data?.recurringShipments || [];
}
