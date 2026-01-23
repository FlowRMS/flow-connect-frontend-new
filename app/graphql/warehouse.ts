import { gql } from '@apollo/client';

export const GET_WAREHOUSE_INVENTORY = gql`
  query GetWarehouseInventory($warehouseId: UUID!, $search: String, $limit: Int, $offset: Int) {
    inventories(warehouseId: $warehouseId, search: $search, limit: $limit, offset: $offset) {
      id
      productId
      warehouseId
      totalQuantity
      availableQuantity
      reservedQuantity
      pickingQuantity
      ownershipType
      abcClass
      createdAt
      updatedAt
      product {
        id
        factoryPartNumber
        description
        factory {
          id
          name: title
        }
      }
      items {
        id
        inventoryId
        locationName
        quantity
        status # Assuming status is available
        receivedDate # Assuming camelCase for received_date
        lotNumber
        createdAt
      }
    }
  }
`;

export const GET_INVENTORY_STATS = gql`
  query GetInventoryStats($warehouseId: UUID!) {
    inventoryStats(warehouseId: $warehouseId) {
      totalSkuCount: totalProducts
      totalItemsCount: totalQuantity
      availableQuantity
      reservedQuantity
      lowStockCount
      outOfStockCount
      totalValue
    }
  }
`;

export const GET_SHIPMENT_REQUESTS = gql`
  query GetShipmentRequests($warehouseId: UUID!, $status: ShipmentRequestStatus, $limit: Int, $offset: Int) {
    shipmentRequests(warehouseId: $warehouseId, status: $status, limit: $limit, offset: $offset) {
      id
      requestNumber
      warehouseId
      factoryId
      factory {
        id
        name: title
      }
      status
      method
      priority
      notes
      requestDate
      requestedDeliveryDate: requestDate
      totalQuantity
      isActive
      createdAt
      updatedAt
      items {
        id
        requestId
        productId
        quantity
        product {
          description
          factoryPartNumber
        }
      }
    }
  }
`;

export const GET_SHIPMENT_REQUEST_STATUSES = gql`
  query GetShipmentRequestStatuses {
    shipmentRequestStatuses {
      label
      value
    }
  }
`;

export const GET_INVENTORY_STATUSES = gql`
  query GetInventoryStatuses {
    inventoryStatuses {
      label
      value
    }
  }
`;

export const GET_BACKORDERS = gql`
  query GetBackorders($customerId: UUID, $productId: UUID, $limit: Int, $offset: Int) {
    backorders(customerId: $customerId, productId: $productId, limit: $limit, offset: $offset) {
      id
      orderedQuantity
      orderId
      orderNumber
      productId
      product {
        id
        factoryPartNumber
        description
        factory {
          id
          name: title
        }
      }
      customerId
      customer {
        id
        name: companyName
      }
      dueDate
      status
      shippedQuantity
      backorderedQuantity
    }
  }
`;

export const CREATE_SHIPMENT_REQUEST = gql`
  mutation CreateShipmentRequest($input: CreateShipmentRequestInput!) {
    createShipmentRequest(input: $input) {
      id
      requestNumber
      warehouseId
      factoryId
      status
      method
      priority
      notes
      requestDate
      items {
        id
        productId
        quantity
      }
    }
  }
`;

export const UPDATE_SHIPMENT_REQUEST_STATUS = gql`
  mutation UpdateShipmentRequestStatus($id: UUID!, $status: ShipmentRequestStatus!, $notes: String) {
    updateShipmentRequestStatus(id: $id, status: $status, notes: $notes) {
      id
      status
      updatedAt
    }
  }
`;

export const UPDATE_SHIPMENT_REQUEST = gql`
  mutation UpdateShipmentRequest($input: UpdateShipmentRequestInput!) {
    updateShipmentRequest(input: $input) {
      id
      requestNumber
      status
      updatedAt
    }
  }
`;

export const GET_FACTORIES = gql`
  query GetFactories($search: String!) {
    factorySearch(searchTerm: $search) {
      id
      title
      email
      phone
    }
  }
`;

export const GET_PRODUCTS = gql`
  query GetProducts($search: String!, $factoryId: UUID) {
    productSearch(searchTerm: $search, factoryId: $factoryId, limit: 100) {
      id
      factoryPartNumber
      description
    }
  }
`;

export const GET_ALL_WAREHOUSES = gql`
  query GetAllWarehouses {
    warehouses {
      id
      name
    }
  }
`;

export const EXPORT_INVENTORY = gql`
  mutation ExportInventory($warehouseId: UUID!) {
    exportInventory(warehouseId: $warehouseId)
  }
`;

export const IMPORT_INVENTORY = gql`
  mutation ImportInventory($warehouseId: UUID!, $file: String!) {
    importInventory(warehouseId: $warehouseId, file: $file) {
      processed
      created
      updated
      errors
      skipped
    }
  }
`;

export const GET_WAREHOUSE_LOCATIONS = gql`
  query GetWarehouseLocations($warehouseId: UUID!) {
    warehouseLocations(warehouseId: $warehouseId) {
      id
      name
      code
      level
      parentId
    }
  }
`;
