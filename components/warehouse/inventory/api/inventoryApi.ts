import { gql } from '@apollo/client';

export const GET_WAREHOUSE_INVENTORY = gql`
  query GetWarehouseInventory($warehouseId: UUID!) {
    inventories(warehouseId: $warehouseId) {
      id
      productId
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
        description
        factoryPartNumber
      }
      factory {
        id
        title
      }
      items {
        id
        quantity
        status
        receivedDate
        locationId
        locationName
        lotNumber
        createdAt
      }
    }
  }
`;

export const GET_INVENTORY_STATS = gql`
  query GetInventoryStats($warehouseId: UUID!) {
    inventoryStats(warehouseId: $warehouseId) {
      totalProducts
      totalQuantity
      availableQuantity
      reservedQuantity
      lowStockCount
      outOfStockCount
      totalValue
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

export const EXPORT_INVENTORY = gql`
  mutation ExportInventory($warehouseId: UUID!) {
    exportInventory(warehouseId: $warehouseId)
  }
`;

export const IMPORT_INVENTORY = gql`
  mutation ImportInventory($file: Upload!, $warehouseId: UUID!) {
    importInventory(file: $file, warehouseId: $warehouseId)
  }
`;

export const CREATE_INVENTORY = gql`
  mutation CreateInventory($input: CreateInventoryInput!) {
    createInventory(input: $input) {
      id
      productId
      totalQuantity
      availableQuantity
      product {
        id
        description
        factoryPartNumber
      }
    }
  }
`;

export const ADD_INVENTORY_ITEM = gql`
  mutation AddInventoryItem($input: AddInventoryItemInput!) {
    addInventoryItem(input: $input) {
      id
      quantity
      status
      receivedDate
      locationId
      locationName
      lotNumber
      createdAt
    }
  }
`;

export const UPDATE_INVENTORY_ITEM = gql`
  mutation UpdateInventoryItem($input: UpdateInventoryItemInput!) {
    updateInventoryItem(input: $input) {
      id
      quantity
      status
      receivedDate
      locationId
      locationName
      lotNumber
      createdAt
    }
  }
`;

export const DELETE_INVENTORY_ITEM = gql`
  mutation DeleteInventoryItem($id: UUID!) {
    deleteInventoryItem(id: $id)
  }
`;

export const DELETE_INVENTORY = gql`
  mutation DeleteInventory($id: UUID!) {
    deleteInventory(id: $id)
  }
`;

export const UPDATE_INVENTORY = gql`
  mutation UpdateInventory($input: UpdateInventoryInput!) {
    updateInventory(input: $input) {
      id
      ownershipType
      abcClass
      updatedAt
    }
  }
`;

export const GET_BACKORDERS = gql`
  query GetBackorders {
    backorders {
      id
      productId
      product {
        id
        description
        factoryPartNumber
      }
      factory {
        id
        title
      }
      backorderedQuantity
      orderNumber
      customer {
        companyName
      }
    }
  }
`;
