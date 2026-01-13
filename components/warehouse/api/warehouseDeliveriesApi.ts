import { crmGraphQLRequest } from '@/components/lib/graphql/client';
import type {
  DeliveryIssue,
  DeliveryIssueItem,
  IncomingShipment,
  IncomingShipmentIssue,
  RecurringShipment,
  ShipmentLineItem,
  ExpectedItem,
} from '@/lib/types/warehouse';

type WarehouseLookup = {
  id: string;
  name: string;
  status?: string | null;
  isActive?: boolean | null;
  city?: string | null;
  state?: string | null;
  addressLine1?: string | null;
};

type ShippingCarrierLookup = {
  id: string;
  name: string;
  trackingUrlTemplate?: string | null;
  code?: string | null;
  isActive?: boolean | null;
};

type FactoryLookup = {
  id: string;
  title: string;
  email?: string | null;
};

type DeliveryItemApi = {
  id: string;
  productId: string;
  product?: {
    id: string;
    factoryPartNumber: string;
    description?: string | null;
    unitPrice?: string | null;
  } | null;
  expectedQty: number;
  receivedQty: number;
  damagedQty: number;
  status: string;
  discrepancyNotes?: string | null;
};

type DeliveryIssueApi = {
  id: string;
  deliveryId: string;
  deliveryItemId: string;
  receiptId?: string | null;
  issueType: string;
  customIssueType?: string | null;
  qty: number;
  status: string;
  description?: string | null;
  notes?: string | null;
  communicatedAt?: string | null;
  createdAt: string;
  createdById?: string | null;
};

type DeliveryAssigneeApi = {
  id: string;
  userId: string;
  role: string;
};

type DeliveryDocumentApi = {
  id: string;
  name: string;
  docType: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number | null;
  uploadedById?: string | null;
  uploadedAt: string;
  notes?: string | null;
};

type WarehouseLocationApi = {
  id: string;
  warehouseId: string;
  parentId?: string | null;
  level: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type DeliveryApi = {
  id: string;
  poNumber: string;
  warehouseId: string;
  vendorId: string;
  vendor?: FactoryLookup | null;
  carrierId?: string | null;
  carrier?: ShippingCarrierLookup | null;
  trackingNumber?: string | null;
  status: string;
  expectedDate?: string | null;
  arrivedAt?: string | null;
  receivingStartedAt?: string | null;
  receivedAt?: string | null;
  originAddressId?: string | null;
  destinationAddressId?: string | null;
  recurringShipmentId?: string | null;
  vendorContactName?: string | null;
  vendorContactEmail?: string | null;
  notes?: string | null;
  createdAt: string;
  createdById?: string | null;
  updatedById?: string | null;
  updatedAt?: string | null;
  items: DeliveryItemApi[];
  issues?: DeliveryIssueApi[];
  documents?: DeliveryDocumentApi[];
  assignees?: DeliveryAssigneeApi[];
};

type RecurringShipmentApi = {
  id: string;
  name: string;
  vendorId: string;
  vendorContactName?: string | null;
  vendorContactEmail?: string | null;
  warehouseId: string;
  carrier?: string | null;
  notes?: string | null;
  recurrencePattern: Record<string, unknown>;
  startDate: string;
  endDate?: string | null;
  status: string;
  lastGeneratedDate?: string | null;
  nextExpectedDate?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
};

type WarehouseMemberApi = {
  id: string;
  warehouseId: string;
  userId: string;
  role: string | number;
  createdAt: string;
};

const DELIVERIES_LIST_QUERY = `
  query DeliveriesList($warehouseId: UUID) {
    deliveries(warehouseId: $warehouseId) {
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
        expectedQty
        receivedQty
        damagedQty
        status
        discrepancyNotes
      }
    }
  }
`;

const DELIVERIES_WITH_ISSUES_QUERY = `
  query DeliveriesWithIssues($warehouseId: UUID) {
    deliveries(warehouseId: $warehouseId) {
      id
      poNumber
      warehouseId
      vendorId
      vendor {
        id
        title
        email
      }
      expectedDate
      createdAt
      items {
        id
        productId
        expectedQty
        receivedQty
        damagedQty
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
        qty
        status
        description
        notes
        communicatedAt
        createdAt
        createdById
      }
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
        expectedQty
        receivedQty
        damagedQty
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
        qty
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
      qty
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

const CREATE_DELIVERY_MUTATION = `
  mutation CreateDelivery($input: DeliveryInput!) {
    createDelivery(input: $input) {
      id
      poNumber
      status
    }
  }
`;

const UPDATE_DELIVERY_MUTATION = `
  mutation UpdateDelivery($id: UUID!, $input: DeliveryInput!) {
    updateDelivery(id: $id, input: $input) {
      id
      poNumber
      status
      updatedAt
    }
  }
`;

const CREATE_DELIVERY_ITEM_MUTATION = `
  mutation CreateDeliveryItem($input: DeliveryItemInput!) {
    createDeliveryItem(input: $input) {
      id
      deliveryId
    }
  }
`;

const UPDATE_DELIVERY_ITEM_MUTATION = `
  mutation UpdateDeliveryItem($id: UUID!, $input: DeliveryItemInput!) {
    updateDeliveryItem(id: $id, input: $input) {
      id
      deliveryId
    }
  }
`;

const DELETE_DELIVERY_ITEM_MUTATION = `
  mutation DeleteDeliveryItem($id: UUID!) {
    deleteDeliveryItem(id: $id)
  }
`;

const CREATE_DELIVERY_ITEM_RECEIPT_MUTATION = `
  mutation CreateDeliveryItemReceipt($input: DeliveryItemReceiptInput!) {
    createDeliveryItemReceipt(input: $input) {
      id
      deliveryItemId
    }
  }
`;

const UPDATE_DELIVERY_ITEM_RECEIPT_MUTATION = `
  mutation UpdateDeliveryItemReceipt($id: UUID!, $input: DeliveryItemReceiptInput!) {
    updateDeliveryItemReceipt(id: $id, input: $input) {
      id
      deliveryItemId
    }
  }
`;

const DELETE_DELIVERY_ITEM_RECEIPT_MUTATION = `
  mutation DeleteDeliveryItemReceipt($id: UUID!) {
    deleteDeliveryItemReceipt(id: $id)
  }
`;

const CREATE_DELIVERY_DOCUMENT_MUTATION = `
  mutation CreateDeliveryDocument($input: DeliveryDocumentInput!) {
    createDeliveryDocument(input: $input) {
      id
      deliveryId
    }
  }
`;

const DELETE_DELIVERY_DOCUMENT_MUTATION = `
  mutation DeleteDeliveryDocument($id: UUID!) {
    deleteDeliveryDocument(id: $id)
  }
`;

const CREATE_DELIVERY_ASSIGNEE_MUTATION = `
  mutation CreateDeliveryAssignee($input: DeliveryAssigneeInput!) {
    createDeliveryAssignee(input: $input) {
      id
      deliveryId
      userId
      role
    }
  }
`;

const DELETE_DELIVERY_ASSIGNEE_MUTATION = `
  mutation DeleteDeliveryAssignee($id: UUID!) {
    deleteDeliveryAssignee(id: $id)
  }
`;

const CREATE_DELIVERY_ISSUE_MUTATION = `
  mutation CreateDeliveryIssue($input: DeliveryIssueInput!) {
    createDeliveryIssue(input: $input) {
      id
      deliveryId
      deliveryItemId
      issueType
      status
    }
  }
`;

const CREATE_DELIVERY_STATUS_HISTORY_MUTATION = `
  mutation CreateDeliveryStatusHistory($input: DeliveryStatusHistoryInput!) {
    createDeliveryStatusHistory(input: $input) {
      id
      deliveryId
      status
      timestamp
      note
    }
  }
`;

const UPDATE_DELIVERY_ISSUE_MUTATION = `
  mutation UpdateDeliveryIssue($id: UUID!, $input: DeliveryIssueInput!) {
    updateDeliveryIssue(id: $id, input: $input) {
      id
      status
      notes
    }
  }
`;

const CREATE_RECURRING_SHIPMENT_MUTATION = `
  mutation CreateRecurringShipment($input: RecurringShipmentInput!) {
    createRecurringShipment(input: $input) {
      id
      name
      status
    }
  }
`;

const UPDATE_RECURRING_SHIPMENT_MUTATION = `
  mutation UpdateRecurringShipment($id: UUID!, $input: RecurringShipmentInput!) {
    updateRecurringShipment(id: $id, input: $input) {
      id
      name
      status
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
  options?: { includeIssues?: boolean }
): Promise<DeliveryApi[]> {
  const response = await crmGraphQLRequest<{ deliveries: DeliveryApi[] }>({
    query: options?.includeIssues ? DELIVERIES_WITH_ISSUES_QUERY : DELIVERIES_LIST_QUERY,
    variables: { warehouseId: warehouseId || null },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to fetch deliveries');
  }

  return response.data?.deliveries || [];
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

export async function createDelivery(input: Record<string, unknown>): Promise<{ id: string; poNumber: string; status: string }> {
  const response = await crmGraphQLRequest<{ createDelivery: { id: string; poNumber: string; status: string } }>({
    query: CREATE_DELIVERY_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery');
  }

  if (!response.data?.createDelivery) {
    throw new Error('No delivery returned from createDelivery');
  }

  return response.data.createDelivery;
}

export async function updateDelivery(id: string, input: Record<string, unknown>): Promise<{ id: string; poNumber: string; status: string }> {
  const response = await crmGraphQLRequest<{ updateDelivery: { id: string; poNumber: string; status: string } }>({
    query: UPDATE_DELIVERY_MUTATION,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update delivery');
  }

  if (!response.data?.updateDelivery) {
    throw new Error('No delivery returned from updateDelivery');
  }

  return response.data.updateDelivery;
}

export async function createDeliveryItem(input: Record<string, unknown>): Promise<{ id: string; deliveryId: string }> {
  const response = await crmGraphQLRequest<{ createDeliveryItem: { id: string; deliveryId: string } }>({
    query: CREATE_DELIVERY_ITEM_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery item');
  }

  if (!response.data?.createDeliveryItem) {
    throw new Error('No delivery item returned from createDeliveryItem');
  }

  return response.data.createDeliveryItem;
}

export async function updateDeliveryItem(id: string, input: Record<string, unknown>): Promise<{ id: string; deliveryId: string }> {
  const response = await crmGraphQLRequest<{ updateDeliveryItem: { id: string; deliveryId: string } }>({
    query: UPDATE_DELIVERY_ITEM_MUTATION,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update delivery item');
  }

  if (!response.data?.updateDeliveryItem) {
    throw new Error('No delivery item returned from updateDeliveryItem');
  }

  return response.data.updateDeliveryItem;
}

export async function deleteDeliveryItem(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteDeliveryItem: boolean }>({
    query: DELETE_DELIVERY_ITEM_MUTATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete delivery item');
  }

  return response.data?.deleteDeliveryItem ?? false;
}

export async function createDeliveryItemReceipt(input: Record<string, unknown>): Promise<{ id: string; deliveryItemId: string }> {
  const response = await crmGraphQLRequest<{ createDeliveryItemReceipt: { id: string; deliveryItemId: string } }>({
    query: CREATE_DELIVERY_ITEM_RECEIPT_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery item receipt');
  }

  if (!response.data?.createDeliveryItemReceipt) {
    throw new Error('No delivery item receipt returned from createDeliveryItemReceipt');
  }

  return response.data.createDeliveryItemReceipt;
}

export async function updateDeliveryItemReceipt(id: string, input: Record<string, unknown>): Promise<{ id: string; deliveryItemId: string }> {
  const response = await crmGraphQLRequest<{ updateDeliveryItemReceipt: { id: string; deliveryItemId: string } }>({
    query: UPDATE_DELIVERY_ITEM_RECEIPT_MUTATION,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update delivery item receipt');
  }

  if (!response.data?.updateDeliveryItemReceipt) {
    throw new Error('No delivery item receipt returned from updateDeliveryItemReceipt');
  }

  return response.data.updateDeliveryItemReceipt;
}

export async function deleteDeliveryItemReceipt(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteDeliveryItemReceipt: boolean }>({
    query: DELETE_DELIVERY_ITEM_RECEIPT_MUTATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete delivery item receipt');
  }

  return response.data?.deleteDeliveryItemReceipt ?? false;
}

export async function createDeliveryDocument(input: Record<string, unknown>): Promise<{ id: string; deliveryId: string }> {
  const response = await crmGraphQLRequest<{ createDeliveryDocument: { id: string; deliveryId: string } }>({
    query: CREATE_DELIVERY_DOCUMENT_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery document');
  }

  if (!response.data?.createDeliveryDocument) {
    throw new Error('No delivery document returned from createDeliveryDocument');
  }

  return response.data.createDeliveryDocument;
}

export async function deleteDeliveryDocument(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteDeliveryDocument: boolean }>({
    query: DELETE_DELIVERY_DOCUMENT_MUTATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete delivery document');
  }

  return response.data?.deleteDeliveryDocument ?? false;
}

export async function createDeliveryAssignee(input: Record<string, unknown>): Promise<{ id: string; deliveryId: string; userId: string; role: string }> {
  const response = await crmGraphQLRequest<{ createDeliveryAssignee: { id: string; deliveryId: string; userId: string; role: string } }>({
    query: CREATE_DELIVERY_ASSIGNEE_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery assignee');
  }

  if (!response.data?.createDeliveryAssignee) {
    throw new Error('No delivery assignee returned from createDeliveryAssignee');
  }

  return response.data.createDeliveryAssignee;
}

export async function deleteDeliveryAssignee(id: string): Promise<boolean> {
  const response = await crmGraphQLRequest<{ deleteDeliveryAssignee: boolean }>({
    query: DELETE_DELIVERY_ASSIGNEE_MUTATION,
    variables: { id },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete delivery assignee');
  }

  return response.data?.deleteDeliveryAssignee ?? false;
}

export async function createDeliveryIssue(input: Record<string, unknown>): Promise<{ id: string; deliveryId: string; deliveryItemId: string; issueType: string; status: string }> {
  const response = await crmGraphQLRequest<{ createDeliveryIssue: { id: string; deliveryId: string; deliveryItemId: string; issueType: string; status: string } }>({
    query: CREATE_DELIVERY_ISSUE_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery issue');
  }

  if (!response.data?.createDeliveryIssue) {
    throw new Error('No delivery issue returned from createDeliveryIssue');
  }

  return response.data.createDeliveryIssue;
}

export async function createDeliveryStatusHistory(input: Record<string, unknown>): Promise<{ id: string; deliveryId: string; status: string; timestamp: string; note?: string | null }> {
  const response = await crmGraphQLRequest<{ createDeliveryStatusHistory: { id: string; deliveryId: string; status: string; timestamp: string; note?: string | null } }>({
    query: CREATE_DELIVERY_STATUS_HISTORY_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create delivery status history');
  }

  if (!response.data?.createDeliveryStatusHistory) {
    throw new Error('No delivery status history returned from createDeliveryStatusHistory');
  }

  return response.data.createDeliveryStatusHistory;
}

export async function updateDeliveryIssue(id: string, input: Record<string, unknown>): Promise<{ id: string; status: string }> {
  const response = await crmGraphQLRequest<{ updateDeliveryIssue: { id: string; status: string } }>({
    query: UPDATE_DELIVERY_ISSUE_MUTATION,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update delivery issue');
  }

  if (!response.data?.updateDeliveryIssue) {
    throw new Error('No delivery issue returned from updateDeliveryIssue');
  }

  return response.data.updateDeliveryIssue;
}

export async function createRecurringShipment(input: Record<string, unknown>): Promise<{ id: string; name: string; status: string }> {
  const response = await crmGraphQLRequest<{ createRecurringShipment: { id: string; name: string; status: string } }>({
    query: CREATE_RECURRING_SHIPMENT_MUTATION,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create recurring shipment');
  }

  if (!response.data?.createRecurringShipment) {
    throw new Error('No recurring shipment returned from createRecurringShipment');
  }

  return response.data.createRecurringShipment;
}

export async function updateRecurringShipment(id: string, input: Record<string, unknown>): Promise<{ id: string; name: string; status: string }> {
  const response = await crmGraphQLRequest<{ updateRecurringShipment: { id: string; name: string; status: string } }>({
    query: UPDATE_RECURRING_SHIPMENT_MUTATION,
    variables: { id, input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update recurring shipment');
  }

  if (!response.data?.updateRecurringShipment) {
    throw new Error('No recurring shipment returned from updateRecurringShipment');
  }

  return response.data.updateRecurringShipment;
}

export function mapDeliveryToShipment(
  delivery: DeliveryApi,
  warehouseMap: Map<string, WarehouseLookup>,
  factoryMap: Map<string, FactoryLookup>,
  carrierMap: Map<string, ShippingCarrierLookup>
): IncomingShipment {
  const warehouse = warehouseMap.get(delivery.warehouseId);
  const vendor = delivery.vendor || factoryMap.get(delivery.vendorId);
  const carrier = delivery.carrier || (delivery.carrierId ? carrierMap.get(delivery.carrierId) : undefined);
  const assignees = delivery.assignees || [];
  const documents = delivery.documents || [];
  const issues: IncomingShipmentIssue[] = (delivery.issues || []).map((issue) => ({
    id: issue.id,
    deliveryItemId: issue.deliveryItemId,
    issueType: issue.issueType as IncomingShipmentIssue['issueType'],
    customIssueType: issue.customIssueType || undefined,
    qty: issue.qty,
    description: issue.description || undefined,
  }));

  const getProductName = (item: DeliveryItemApi) => {
    if (item.product?.description) return item.product.description;
    if (item.product?.factoryPartNumber) return item.product.factoryPartNumber;
    return item.productId;
  };

  const getPartNumber = (item: DeliveryItemApi) => {
    return item.product?.factoryPartNumber || item.productId;
  };

  const items: ShipmentLineItem[] = delivery.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: getProductName(item),
    partNumber: getPartNumber(item),
    expectedQuantity: item.expectedQty,
    receivedQuantity: item.receivedQty,
    damagedQuantity: item.damagedQty,
  }));

  const expectedItems: ExpectedItem[] = delivery.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: getProductName(item),
    partNumber: getPartNumber(item),
    expectedQuantity: item.expectedQty,
    receivedQuantity: item.receivedQty,
    discrepancyNotes: item.discrepancyNotes || undefined,
    status: item.status.toLowerCase() as ExpectedItem['status'],
  }));

  return {
    id: delivery.id,
    poNumber: delivery.poNumber,
    vendorId: delivery.vendorId,
    vendorName: vendor?.title || delivery.vendorId,
    vendorContact: delivery.vendorContactName || undefined,
    vendorEmail: delivery.vendorContactEmail || vendor?.email || undefined,
    warehouseId: delivery.warehouseId,
    warehouseName: warehouse?.name || delivery.warehouseId,
    eta: delivery.expectedDate || delivery.createdAt,
    status: delivery.status as IncomingShipment['status'],
    expectedItems,
    items,
    itemCount: items.length,
    expectedQuantity: items.reduce((sum, item) => sum + item.expectedQuantity, 0),
    trackingNumber: delivery.trackingNumber || undefined,
    carrier: carrier?.name || undefined,
    carrierId: delivery.carrierId || undefined,
    expectedDate: delivery.expectedDate || undefined,
    arrivedAt: delivery.arrivedAt || undefined,
    receivingStartedAt: delivery.receivingStartedAt || undefined,
    receivedAt: delivery.receivedAt || undefined,
    notes: delivery.notes || undefined,
    recurringShipmentId: delivery.recurringShipmentId || undefined,
    assignedManagers: assignees
      .filter((assignee) => {
        if (typeof assignee.role === 'number') return assignee.role === 2;
        if (assignee.role === '2') return true;
        return assignee.role === 'MANAGER';
      })
      .map((assignee) => ({
        id: assignee.id,
        userId: assignee.userId,
        userName: assignee.userId,
        role: 'manager',
        assignedAt: delivery.createdAt,
      })),
    assignedWorkers: assignees
      .filter((assignee) => {
        if (typeof assignee.role === 'number') return assignee.role === 1;
        if (assignee.role === '1') return true;
        return assignee.role === 'WORKER';
      })
      .map((assignee) => ({
        id: assignee.id,
        userId: assignee.userId,
        userName: assignee.userId,
        role: 'worker',
        assignedAt: delivery.createdAt,
      })),
    documents: documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      type: doc.docType as string,
      fileUrl: doc.fileUrl,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize || undefined,
      uploadedAt: doc.uploadedAt,
      uploadedBy: doc.uploadedById || '',
      notes: doc.notes || undefined,
    })),
    issues,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt || delivery.createdAt,
  };
}

export function mapRecurringShipment(
  recurring: RecurringShipmentApi,
  warehouseMap: Map<string, WarehouseLookup>,
  factoryMap: Map<string, FactoryLookup>
): RecurringShipment {
  const warehouse = warehouseMap.get(recurring.warehouseId);
  const vendor = factoryMap.get(recurring.vendorId);
  const rawPattern = recurring.recurrencePattern;
  const parsedPattern =
    typeof rawPattern === 'string'
      ? (() => {
          try {
            return JSON.parse(rawPattern) as Record<string, unknown>;
          } catch {
            return {} as Record<string, unknown>;
          }
        })()
      : rawPattern;
  const pattern = parsedPattern as RecurringShipment['recurrencePattern'];
  const expectedItems = (pattern?.expectedItems || (parsedPattern as Record<string, unknown>)?.expected_items || []) as ExpectedItem[];

  return {
    id: recurring.id,
    name: recurring.name,
    vendorId: recurring.vendorId,
    vendorName: vendor?.title || recurring.vendorId,
    vendorContact: recurring.vendorContactName || undefined,
    vendorEmail: recurring.vendorContactEmail || vendor?.email || undefined,
    warehouseId: recurring.warehouseId,
    warehouseName: warehouse?.name || recurring.warehouseId,
    carrier: recurring.carrier || undefined,
    expectedItems,
    notes: recurring.notes || undefined,
    recurrencePattern: pattern,
    startDate: recurring.startDate,
    endDate: recurring.endDate || undefined,
    status: recurring.status as RecurringShipment['status'],
    lastGeneratedDate: recurring.lastGeneratedDate || undefined,
    nextExpectedDate: recurring.nextExpectedDate || undefined,
    generatedShipmentIds: [],
    createdAt: recurring.createdAt,
    updatedAt: recurring.updatedAt || recurring.createdAt,
    createdBy: recurring.createdById || undefined,
  };
}

export function mapIssueFromDelivery(
  issue: DeliveryIssueApi,
  delivery: DeliveryApi,
  warehouseMap: Map<string, WarehouseLookup>,
  factoryMap: Map<string, FactoryLookup>
): DeliveryIssue {
  const warehouse = warehouseMap.get(delivery.warehouseId);
  const vendor = delivery.vendor || factoryMap.get(delivery.vendorId);
  const deliveryItem = delivery.items.find((item) => item.id === issue.deliveryItemId);

  const issueItem: DeliveryIssueItem = {
    id: issue.deliveryItemId,
    productId: deliveryItem?.productId || '',
    productName:
      deliveryItem?.product?.description ||
      deliveryItem?.product?.factoryPartNumber ||
      deliveryItem?.productId ||
      '',
    partNumber:
      deliveryItem?.product?.factoryPartNumber ||
      deliveryItem?.productId ||
      '',
    issueType: issue.issueType as DeliveryIssueItem['issueType'],
    customIssueType: issue.customIssueType || undefined,
    quantity: issue.qty,
    description: issue.description || undefined,
    notes: issue.notes || undefined,
  };

  return {
    id: issue.id,
    issueNumber: `DI-${issue.id.slice(0, 8).toUpperCase()}`,
    shipmentId: delivery.id,
    poNumber: delivery.poNumber,
    vendorId: delivery.vendorId,
    vendorName: vendor?.title || delivery.vendorId,
    vendorEmail: delivery.vendorContactEmail || vendor?.email || undefined,
    vendorContact: delivery.vendorContactName || undefined,
    warehouseId: delivery.warehouseId,
    warehouseName: warehouse?.name || delivery.warehouseId,
    status: issue.status as DeliveryIssue['status'],
    items: [issueItem],
    totalAffectedQuantity: issue.qty,
    communicatedAt: issue.communicatedAt || undefined,
    communicatedBy: undefined,
    communicationMethod: undefined,
    communicationNotes: undefined,
    resolvedAt: undefined,
    resolvedBy: undefined,
    resolutionType: undefined,
    resolutionNotes: undefined,
    creditAmount: undefined,
    replacementShipmentId: undefined,
    notes: issue.notes || undefined,
    reportedAt: issue.createdAt,
    reportedBy: issue.createdById || '',
    createdAt: issue.createdAt,
    updatedAt: issue.createdAt,
    activities: [],
  };
}
