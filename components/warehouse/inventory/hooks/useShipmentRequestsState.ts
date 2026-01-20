import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { ShipmentRequest, ShipmentRequestStatus } from '@/lib/types/warehouse';
import { useShipmentRequestsQuery, useCreateShipmentRequestMutation, useUpdateShipmentRequestMutation } from '../api/useShipmentRequestsApi';
import { updateShipmentRequestStatus } from '@/lib/data/warehouse-mock';
import type { CreateShipmentRequestInput, UpdateShipmentRequestInput } from '../../modals/RequestShipmentModal';
import { Inventory } from '@/lib/types/warehouse';

export function useShipmentRequestsState(warehouseId?: string, inventory?: Inventory[], searchQuery: string = '', selectedFactory: string = 'All') {
  const { data: requestsData, refetch: refetchRequests } = useShipmentRequestsQuery(warehouseId);
  const [createShipmentRequest] = useCreateShipmentRequestMutation();
  const [updateShipmentRequest] = useUpdateShipmentRequestMutation();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRequestDetailModal, setShowRequestDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ShipmentRequest | null>(null);
  const [requestStatusFilter, setRequestStatusFilter] = useState<ShipmentRequestStatus | 'all'>('all');
  
  const [requestInitialData, setRequestInitialData] = useState<{
    requestId?: string;
    vendorId?: string;
    items?: { productId: string; quantity: number }[];
  } | undefined>(undefined);

  const shipmentRequests: ShipmentRequest[] = useMemo(() => {
    if (!requestsData?.shipmentRequests) return [];

    const inventoryMap = new Map();
    if (inventory) {
      inventory.forEach((item: any) => {
        if (item.productId) {
          inventoryMap.set(item.productId, item);
        }
      });
    }

    return requestsData.shipmentRequests.map((req: any) => ({
      ...req,
      requestMethod: req.method,
      requestedDeliveryDate: req.requestDate,
      totalQuantity: req.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
      vendorName: req.factory?.title || 'Unknown',
      vendorId: req.factory?.id || req.factoryId,
      items: req.items.map((item: any) => {
        const invItem = inventoryMap.get(item.productId);
        return {
          ...item,
          productName: item.product?.description || 'Unknown',
          partNumber: item.product?.factoryPartNumber || 'N/A',
          requestedQuantity: item.requestedQuantity || item.quantity, 
          currentStock: invItem ? invItem.availableQuantity : 0,
          reorderPoint: invItem ? invItem.reorderPoint : 0,
        };
      })
    }));
  }, [requestsData, inventory]);

  const filteredRequests = useMemo(() => {
    return shipmentRequests.filter(request => {
      const matchesSearch =
        (request.requestNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = requestStatusFilter === 'all' || request.status === requestStatusFilter;
      const matchesVendor = selectedFactory === 'All' || request.vendorId === selectedFactory;
      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [shipmentRequests, searchQuery, requestStatusFilter, selectedFactory]);

  const pendingRequestsCount = useMemo(() =>
    shipmentRequests.filter(r => r.status === 'PENDING' || r.status === 'SENT').length,
    [shipmentRequests]
  );

  const handleViewRequestDetails = useCallback((request: ShipmentRequest) => {
    setSelectedRequest(request);
    setShowRequestDetailModal(true);
  }, []);

  const handleCreateShipmentRequest = async (input: CreateShipmentRequestInput) => {
    try {
      await createShipmentRequest({ variables: { input } });
      toast.success('Shipment request created successfully');
      refetchRequests();
      setShowRequestModal(false);
      setRequestInitialData(undefined);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create shipment request');
    }
  };

  const handleUpdateShipmentRequest = async (requestId: string, input: UpdateShipmentRequestInput) => {
    try {
      await updateShipmentRequest({ variables: { input } });
      toast.success('Shipment request updated successfully');
      refetchRequests();
      setShowRequestModal(false);
      setRequestInitialData(undefined);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update shipment request');
    }
  };
  
    // MOCK Handlers for things not yet in mutation
  const handleCancelRequest = useCallback((requestId: string) => {
    updateShipmentRequestStatus(requestId, 'CANCELLED');
    refetchRequests();
  }, [refetchRequests]);

  const handleConfirmRequest = useCallback((requestId: string) => {
    updateShipmentRequestStatus(requestId, 'CONFIRMED', {
      confirmedAt: new Date().toISOString(),
    });
    refetchRequests();
  }, [refetchRequests]);

  const handleEditRequest = useCallback((request: ShipmentRequest) => {
    setRequestInitialData({
      requestId: request.id,
      vendorId: request.vendorId,
      items: request.items.map(item => ({
        productId: item.productId,
        quantity: item.requestedQuantity,
      })),
    });
    setShowRequestModal(true);
  }, []);

  return {
    shipmentRequests,
    filteredRequests,
    pendingRequestsCount,
    showRequestModal,
    setShowRequestModal,
    showRequestDetailModal,
    setShowRequestDetailModal,
    selectedRequest,
    setSelectedRequest,
    requestStatusFilter,
    setRequestStatusFilter,
    requestInitialData,
    setRequestInitialData,
    handleViewRequestDetails,
    handleCreateShipmentRequest,
    handleUpdateShipmentRequest,
    handleCancelRequest,
    handleConfirmRequest,
    handleEditRequest,
    refetchRequests,
  };
}
