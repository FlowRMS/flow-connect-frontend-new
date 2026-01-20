'use client';

import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_SHIPMENT_REQUESTS,
  CREATE_SHIPMENT_REQUEST,
  UPDATE_SHIPMENT_REQUEST,
  GET_SHIPMENT_REQUEST_STATUSES,
} from './shipmentRequestsApi';

interface ShipmentRequestsData {
  shipmentRequests: any[]; // Using any temporarily to avoid deep typing issues, but sufficient for consumption
}

interface ShipmentRequestStatusesData {
  shipmentRequestStatuses: {
    label: string;
    value: string;
  }[];
}

export const useShipmentRequestsQuery = (warehouseId?: string) => {
  return useQuery<ShipmentRequestsData>(GET_SHIPMENT_REQUESTS, {
    variables: { warehouseId },
    skip: !warehouseId,
  });
};

export const useCreateShipmentRequestMutation = () => {
  return useMutation(CREATE_SHIPMENT_REQUEST);
};

export const useUpdateShipmentRequestMutation = () => {
  return useMutation(UPDATE_SHIPMENT_REQUEST);
};

export const useShipmentRequestStatusesQuery = () => {
  return useQuery<ShipmentRequestStatusesData>(GET_SHIPMENT_REQUEST_STATUSES);
};
