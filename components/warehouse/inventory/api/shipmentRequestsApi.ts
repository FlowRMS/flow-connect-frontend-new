import { gql } from '@apollo/client';

export const GET_SHIPMENT_REQUESTS = gql`
  query GetShipmentRequests($warehouseId: UUID!) {
    shipmentRequests(warehouseId: $warehouseId) {
      id
      requestNumber
      warehouseId
      factoryId
      factory {
        id
        title
      }
      status
      priority
      method
      notes
      requestDate
      createdAt
      updatedAt
      items {
        id
        productId
        product {
          id
          description
          factoryPartNumber
        }
        quantity
      }
    }
  }
`;

export const CREATE_SHIPMENT_REQUEST = gql`
  mutation CreateShipmentRequest($input: CreateShipmentRequestInput!) {
    createShipmentRequest(input: $input) {
      id
      requestNumber
      status
    }
  }
`;

export const UPDATE_SHIPMENT_REQUEST = gql`
  mutation UpdateShipmentRequest($input: UpdateShipmentRequestInput!) {
    updateShipmentRequest(input: $input) {
      id
      requestNumber
      status
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

export const GET_SHIPMENT_REQUEST_STATUSES = gql`
  query GetShipmentRequestStatuses {
    shipmentRequestStatuses {
      label
      value
    }
  }
`;
