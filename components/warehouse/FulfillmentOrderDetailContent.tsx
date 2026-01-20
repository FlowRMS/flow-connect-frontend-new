'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useFulfillmentOrder,
  useUpdateFulfillmentOrder,
  useReleaseToWarehouse,
  useCancelFulfillmentOrder,
  useStartPicking,
  useUpdatePickedQuantity,
  useCompletePicking,
  useAddPackingBox,
  useDeletePackingBox,
  useAssignItemToBox,
  useRemoveItemFromBox,
  useCompletePacking,
  useCompleteShipping,
  useMarkCommunicated,
  useMarkDelivered,
  useAddFulfillmentNote,
  useReportInventoryDiscrepancy,
  // Hooks for assignments and backorder
  useAddFulfillmentAssignment,
  useRemoveFulfillmentAssignment,
  useMarkManufacturerFulfilled,
  useSplitFulfillmentLineItem,
  useCancelBackorderItems,
} from './api/useFulfillmentApi';
import type {
  FulfillmentOrderStatus,
  FulfillmentMethod,
  FulfillmentOrderLineItem,
  FulfillmentAssignmentRole,
  FulfillmentActivity,
} from './api/fulfillmentApi';
import { BackorderReviewData, AssignedUserRole, AttachedDocument } from '@/lib/types/warehouse';
// Shipment Request API
import { useCreateShipmentRequest, useShipmentRequests } from './api/useShipmentRequestApi';
import type { ShipmentPriority, ShipmentMethod } from './api/shipmentRequestApi';
// Inventory API for real inventory data
import { useInventoriesByProducts } from './api/useInventoryApi';
import type { Inventory } from './api/inventoryApi';
// Shipping carriers API
import { useShippingCarriersQuery } from './settings/api/useShippingCarriersApi';
import type { ShippingCarrier } from './settings/api/shippingCarriersApi';
// Warehouses API
import { useWarehousesQuery } from './settings/api/useWarehousesApi';
import type { Warehouse } from './settings/api/warehousesApi';
// Users API
import { useUsersQuery } from './settings/api/useUsersApi';
import type { User } from './settings/api/usersApi';
// Toast notifications
import { fulfillmentToasts } from '@/components/lib/toast';

// Local type for backorder items compatible with API types
interface BackorderItem {
  lineItem: FulfillmentOrderLineItem;
  backorderQty: number;
  inventoryOnHand: number;
  manufacturerName: string;
  manufacturerId: string;
}

// Import new sub-components
import FulfillmentHeader from './fulfillment-detail/FulfillmentHeader';
import StatusProgress from './fulfillment-detail/StatusProgress';
import PickingInterface, { InventoryDiscrepancy } from './fulfillment-detail/PickingInterface';
import PackingInterface from './fulfillment-detail/PackingInterface';
import ShippingInterface from './fulfillment-detail/ShippingInterface';
import ShippedInterface from './fulfillment-detail/ShippedInterface';
import FulfillmentDetailsForm from './fulfillment-detail/FulfillmentDetailsForm';
import AuditTimestamps from './fulfillment-detail/AuditTimestamps';
import LineItemsTable from './fulfillment-detail/LineItemsTable';
import { PackingBoxType, packagingOptions } from './fulfillment-detail/packing/PackingBox';

// Import modal components
import PackingSlipModal from './fulfillment-detail/modals/PackingSlipModal';
import ShippingLabelsModal from './fulfillment-detail/modals/ShippingLabelsModal';
import BillOfLadingModal from './fulfillment-detail/modals/BillOfLadingModal';
import SignatureCaptureModal from './fulfillment-detail/modals/SignatureCaptureModal';
import ShipmentConfirmationModal from './fulfillment-detail/modals/ShipmentConfirmationModal';

// Import backorder components
import BackorderNotice from './fulfillment-detail/BackorderNotice';
import ManufacturerDirectModal from './fulfillment-detail/modals/ManufacturerDirectModal';
import RequestInventoryModal from './fulfillment-detail/modals/RequestInventoryModal';
import SplitOrderModal from './fulfillment-detail/modals/SplitOrderModal';
import CancelBackorderModal from './fulfillment-detail/modals/CancelBackorderModal';

// Import assignment panel and activity feed
import AssignmentPanel from './AssignmentPanel';
import DocumentsSection from './DocumentsSection';
import ActivityFeed, { GenericActivity } from './ActivityFeed';

interface FulfillmentOrderDetailContentProps {
  fulfillmentOrderId: string;
}

export default function FulfillmentOrderDetailContent({ fulfillmentOrderId }: FulfillmentOrderDetailContentProps) {
  const router = useRouter();
  const [_, setForceUpdate] = useState(0);

  // Fetch fulfillment order from API
  const { data: fulfillmentOrder, isLoading, error, refetch: refetchOrder } = useFulfillmentOrder(fulfillmentOrderId);

  // Mutations
  const updateOrderMutation = useUpdateFulfillmentOrder();
  const releaseToWarehouseMutation = useReleaseToWarehouse();
  const cancelOrderMutation = useCancelFulfillmentOrder();
  const startPickingMutation = useStartPicking();
  const updatePickedQuantityMutation = useUpdatePickedQuantity();
  const completePickingMutation = useCompletePicking();
  const addPackingBoxMutation = useAddPackingBox();
  const deletePackingBoxMutation = useDeletePackingBox();
  const assignItemToBoxMutation = useAssignItemToBox();
  const removeItemFromBoxMutation = useRemoveItemFromBox();
  const completePackingMutation = useCompletePacking();
  const completeShippingMutation = useCompleteShipping();
  const markCommunicatedMutation = useMarkCommunicated();
  const markDeliveredMutation = useMarkDelivered();
  const addNoteMutation = useAddFulfillmentNote();
  const reportDiscrepancyMutation = useReportInventoryDiscrepancy();

  // New mutations for assignments and backorder
  const addAssignmentMutation = useAddFulfillmentAssignment();
  const removeAssignmentMutation = useRemoveFulfillmentAssignment();
  const markManufacturerFulfilledMutation = useMarkManufacturerFulfilled();
  const splitLineItemMutation = useSplitFulfillmentLineItem();
  const cancelBackorderMutation = useCancelBackorderItems();

  // Shipment request hooks
  const createShipmentRequestMutation = useCreateShipmentRequest();
  const { data: allShipmentRequests = [] } = useShipmentRequests(
    fulfillmentOrder?.warehouseId || '',
    undefined,
    { enabled: !!fulfillmentOrder?.warehouseId }
  );

  // Editable state - initialized with useEffect when data loads
  const [warehouseId, setWarehouseId] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('SHIP');
  const [shipToName, setShipToName] = useState('');
  const [shipToAddressLine1, setShipToAddressLine1] = useState('');
  const [shipToAddressLine2, setShipToAddressLine2] = useState('');
  const [shipToCity, setShipToCity] = useState('');
  const [shipToState, setShipToState] = useState('');
  const [shipToPostalCode, setShipToPostalCode] = useState('');
  const [shipToPhone, setShipToPhone] = useState('');
  const [needByDate, setNeedByDate] = useState('');
  const [shipToDifferentFromPO, setShipToDifferentFromPO] = useState(false);
  const [trackingNumbers, setTrackingNumbers] = useState('');

  // Shipping state - must be declared before the useEffect that uses them
  const [shippingMethod, setShippingMethod] = useState<'SHIP' | 'WILL_CALL'>(fulfillmentOrder?.fulfillmentMethod || 'SHIP');
  const [carrierType, setCarrierType] = useState<'parcel' | 'freight'>((fulfillmentOrder as any)?.carrierType?.toLowerCase() || 'parcel');
  const [selectedCarrier, setSelectedCarrier] = useState(fulfillmentOrder?.carrierId || '');
  const [freightClass, setFreightClass] = useState(fulfillmentOrder?.freightClass || '');

  // Initialize form state when fulfillment order loads
  useEffect(() => {
    if (fulfillmentOrder) {
      setWarehouseId(fulfillmentOrder.warehouseId || '');
      setFulfillmentMethod(fulfillmentOrder.fulfillmentMethod || 'SHIP');
      setShipToName(fulfillmentOrder.shipToAddress?.name || '');
      setShipToAddressLine1(fulfillmentOrder.shipToAddress?.street || '');
      setShipToAddressLine2(fulfillmentOrder.shipToAddress?.streetLine2 || '');
      setShipToCity(fulfillmentOrder.shipToAddress?.city || '');
      setShipToState(fulfillmentOrder.shipToAddress?.state || '');
      setShipToPostalCode(fulfillmentOrder.shipToAddress?.postalCode || '');
      setShipToPhone(fulfillmentOrder.shipToAddress?.phone || '');
      setNeedByDate(fulfillmentOrder.needByDate || '');
      setTrackingNumbers(fulfillmentOrder.trackingNumbers?.join(', ') || '');

      // Update shipping method state
      const method = fulfillmentOrder.fulfillmentMethod || 'SHIP';
      setShippingMethod(method);

      // Update carrier type if available
      if (fulfillmentOrder.carrierType) {
        setCarrierType(fulfillmentOrder.carrierType.toLowerCase() as 'parcel' | 'freight');
      }

      // Update carrier ID if available
      if (fulfillmentOrder.carrierId) {
        setSelectedCarrier(fulfillmentOrder.carrierId);
      }

      // Update freight class if available
      if (fulfillmentOrder.freightClass) {
        setFreightClass(fulfillmentOrder.freightClass);
      }
    }
  }, [fulfillmentOrder]);

  // Picking state
  const [viewingStatus, setViewingStatus] = useState<FulfillmentOrderStatus | null>(null);
  const [pickedItems, setPickedItems] = useState<Record<string, number>>({});
  const [pickingNotes, setPickingNotes] = useState<Record<string, string>>({});
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // Initialize picked items when fulfillment order loads
  useEffect(() => {
    if (fulfillmentOrder?.lineItems) {
      const initial: Record<string, number> = {};
      fulfillmentOrder.lineItems.forEach(item => {
        initial[item.id] = item.pickedQty || 0;
      });
      setPickedItems(initial);
    }
  }, [fulfillmentOrder?.lineItems]);

  // Helper to format decimal numbers - removes trailing zeros
  const formatDecimal = (value: number | null): string => {
    if (value === null || value === undefined) return '';
    // Parse the number and format it, removing unnecessary trailing zeros
    const num = Number(value);
    if (isNaN(num)) return '';
    // Use toFixed(2) then remove trailing zeros
    return parseFloat(num.toFixed(2)).toString();
  };

  // Helper to convert server PackingBox to local PackingBoxType
  // Note: This is a plain function, not a hook, so it can be called in useState initializers
  const convertServerBoxToLocal = (serverBox: {
    id: string;
    length: number | null;
    width: number | null;
    height: number | null;
    weight: number | null;
    items: { fulfillmentLineItemId: string }[];
  }): PackingBoxType => {
    // Format dimensions for comparison (remove decimals for matching)
    const lengthStr = formatDecimal(serverBox.length);
    const widthStr = formatDecimal(serverBox.width);
    const heightStr = formatDecimal(serverBox.height);

    // Determine packaging type from dimensions
    let packagingType = 'custom';
    if (serverBox.length && serverBox.width && serverBox.height) {
      const match = packagingOptions.find((opt) =>
        opt.dimensions.length === lengthStr &&
        opt.dimensions.width === widthStr &&
        opt.dimensions.height === heightStr
      );
      if (match) packagingType = match.value;
    }

    return {
      id: serverBox.id,
      packagingType,
      customWeight: formatDecimal(serverBox.weight),
      useCustomWeight: serverBox.weight !== null,
      customDimensions: {
        length: lengthStr,
        width: widthStr,
        height: heightStr,
      },
      lineItemIds: serverBox.items.map(item => item.fulfillmentLineItemId),
    };
  };

  // Packing state - initialize from server data if available
  const [packingBoxes, setPackingBoxes] = useState<PackingBoxType[]>(() => {
    if (fulfillmentOrder?.packingBoxes && fulfillmentOrder.packingBoxes.length > 0) {
      return fulfillmentOrder.packingBoxes.map(convertServerBoxToLocal);
    }
    // Default empty box
    return [{
      id: 'local-box-1',
      packagingType: 'pallet_48x40x6',
      customWeight: '',
      useCustomWeight: false,
      customDimensions: { length: '', width: '', height: '' },
      lineItemIds: [],
    }];
  });

  // Track which items are verified (packed)
  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>(() => {
    // Initialize from server packing boxes
    const verified: Record<string, boolean> = {};
    if (fulfillmentOrder?.packingBoxes) {
      fulfillmentOrder.packingBoxes.forEach(box => {
        box.items.forEach(item => {
          verified[item.fulfillmentLineItemId] = true;
        });
      });
    }
    return verified;
  });
  const [packingNotes, setPackingNotes] = useState<Record<string, string>>({});
  const [expandedPackingNoteId, setExpandedPackingNoteId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Activity feed state - initialize from fulfillmentOrder.activities if available
  const [activities, setActivities] = useState<FulfillmentActivity[]>(() => {
    return fulfillmentOrder?.activities || [];
  });

  // Sync activities when fulfillment order updates
  useEffect(() => {
    if (fulfillmentOrder?.activities) {
      setActivities(fulfillmentOrder.activities);
    }
  }, [fulfillmentOrder?.activities]);

  // Track if packing boxes have been initialized from server
  const [packingInitialized, setPackingInitialized] = useState(false);

  // Track boxes to delete on save (server-side boxes that were removed locally)
  const [boxesToDelete, setBoxesToDelete] = useState<string[]>([]);

  // Counter for generating unique local box IDs
  const [localBoxCounter, setLocalBoxCounter] = useState(1);

  // Initialize packing boxes from server data on first load only
  // After that, local state is managed independently until Save
  useEffect(() => {
    if (!packingInitialized && fulfillmentOrder?.packingBoxes && fulfillmentOrder.packingBoxes.length > 0) {
      setPackingBoxes(fulfillmentOrder.packingBoxes.map(convertServerBoxToLocal));
      // Update verified items based on what's in boxes
      const verified: Record<string, boolean> = {};
      fulfillmentOrder.packingBoxes.forEach(box => {
        box.items.forEach(item => {
          verified[item.fulfillmentLineItemId] = true;
        });
      });
      setVerifiedItems(verified);
      setPackingInitialized(true);
    }
  }, [fulfillmentOrder?.packingBoxes, packingInitialized]);

  // Modal state
  const [showPackingSlipModal, setShowPackingSlipModal] = useState(false);
  const [showShippingLabelsModal, setShowShippingLabelsModal] = useState(false);
  const [showBOLModal, setShowBOLModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedPackingTemplate, setSelectedPackingTemplate] = useState('standard');
  const [selectedLabelFormat, setSelectedLabelFormat] = useState('4x6');

  // Additional shipping state (shippingMethod, carrierType, selectedCarrier, freightClass declared earlier)
  const [serviceType, setServiceType] = useState((fulfillmentOrder as any)?.serviceType || '');
  const [bolNumber, setBolNumber] = useState((fulfillmentOrder as any)?.bolNumber || '');
  const [proNumber, setProNumber] = useState((fulfillmentOrder as any)?.proNumber || '');
  const [shippingNotes, setShippingNotes] = useState((fulfillmentOrder as any)?.shippingNotes || '');
  const [isShippingConfigLocked, setIsShippingConfigLocked] = useState(false);
  const [isShippingConfigCollapsed, setIsShippingConfigCollapsed] = useState(false);

  // Pickup / Handoff state
  const [pickupName, setPickupName] = useState((fulfillmentOrder as any)?.pickupCustomerName || '');
  const [driverName, setDriverName] = useState((fulfillmentOrder as any)?.pickupDriverName || '');
  const [pickupSignature, setPickupSignature] = useState<string | null>((fulfillmentOrder as any)?.pickupSignature || null);
  const [pickupTimestamp, setPickupTimestamp] = useState<Date | null>((fulfillmentOrder as any)?.pickupTimestamp ? new Date((fulfillmentOrder as any).pickupTimestamp) : null);
  const [pickupNotes, setPickupNotes] = useState((fulfillmentOrder as any)?.pickupNotes || '');

  // Backorder modal state
  const [showManufacturerDirectModal, setShowManufacturerDirectModal] = useState(false);
  const [showRequestInventoryModal, setShowRequestInventoryModal] = useState(false);
  const [showSplitOrderModal, setShowSplitOrderModal] = useState(false);
  const [showCancelBackorderModal, setShowCancelBackorderModal] = useState(false);

  // Shipment confirmation modal state
  const [showShipmentConfirmationModal, setShowShipmentConfirmationModal] = useState(false);

  // Get backorder items for this order - items with backorderQty > 0 that aren't already handled by manufacturer
  const backorderItems = useMemo(() => {
    if (!fulfillmentOrder) return [];
    return fulfillmentOrder.lineItems
      .filter(item => item.backorderQty > 0 && !item.fulfilledByManufacturer)
      .map(item => ({
        lineItem: item,
        backorderQty: item.backorderQty,
        manufacturerId: item.product?.factory?.id || '',
        manufacturerName: item.product?.factory?.title || 'Unknown Manufacturer',
        inventoryOnHand: 0,
      }));
  }, [fulfillmentOrder]);

  // Helper function to get pending shipment requests for a manufacturer
  const getPendingShipmentRequestsForManufacturer = (manufacturerId: string) => {
    return allShipmentRequests.filter(
      req => req.factoryId === manufacturerId && (req.status === 'DRAFT' || req.status === 'PENDING')
    );
  };

  // Get pending shipment requests for manufacturers with backorder items
  const pendingShipmentRequests = useMemo(() => {
    if (backorderItems.length === 0 || !allShipmentRequests) return [];
    const manufacturerIds = [...new Set(backorderItems.map(item => item.manufacturerId))];
    const requests = manufacturerIds.flatMap(id => getPendingShipmentRequestsForManufacturer(id));

    // Map API ShipmentRequest to component ShipmentRequest type expected by modal
    return requests.map(req => ({
      id: req.id,
      requestNumber: req.requestNumber,
      vendorId: req.factoryId || '',
      vendorName: req.factory?.title || 'Unknown Vendor',
      warehouseId: req.warehouseId || '',
      warehouseName: 'Warehouse', // TODO: Fetch warehouse name
      requestMethod: (req.method === 'PHONE_CALL' ? 'CALL' : (req.method || 'EMAIL')) as 'EMAIL' | 'CALL' | 'MANUFACTURER_SYSTEM',
      status: req.status as any,
      priority: req.priority.toLowerCase() as 'standard' | 'expedited' | 'urgent',
      requestedDeliveryDate: req.requestDate || new Date().toISOString(),
      items: req.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: 'Product', // TODO: Fetch product details
        partNumber: '', // TODO: Fetch part number
        requestedQuantity: item.quantity,
        currentStock: 0,
      })),
      totalQuantity: req.items.reduce((sum, item) => sum + item.quantity, 0),
      notes: req.notes || undefined,
      createdBy: 'System',
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
    }));
  }, [backorderItems, allShipmentRequests]);

  // Fetch real inventory data for picking - moved here to ensure hooks are called unconditionally
  const productIds = useMemo(
    () => fulfillmentOrder?.lineItems.map((li) => li.productId) || [],
    [fulfillmentOrder?.lineItems]
  );

  // Determine if we're in picking mode (need to check before early returns for hook consistency)
  const currentStatus = fulfillmentOrder?.status;
  const shouldFetchInventory = currentStatus === 'PICKING' && !!fulfillmentOrder?.warehouseId;

  const { data: inventoryList } = useInventoriesByProducts(
    productIds,
    fulfillmentOrder?.warehouseId || '',
    { enabled: shouldFetchInventory }
  );

  // Fetch shipping carriers from backend
  const { data: shippingCarriers, isLoading: isLoadingCarriers } = useShippingCarriersQuery(true); // activeOnly = true
  
  // Fetch warehouses from backend
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehousesQuery();
  
  // Fetch users for activity feed name resolution
  const { data: users } = useUsersQuery(200); // Fetch up to 200 users

  // Create user lookup map for activity feed
  const userMap = useMemo(() => {
    if (!users) return new Map<string, User>();
    return new Map(users.map(user => [user.id, user]));
  }, [users]);

  // Map FulfillmentActivity to GenericActivity format with user names
  const mappedActivities = useMemo((): GenericActivity[] => {
    return activities.map(activity => {
      const user = userMap.get(activity.createdById);
      const createdByName = user 
        ? user.fullName || `${user.firstName} ${user.lastName}`.trim() || user.username
        : activity.createdById || 'System';
      
      return {
        id: activity.id,
        type: activity.activityType,
        timestamp: activity.createdAt,
        createdBy: createdByName,
        content: activity.content || undefined,
        metadata: activity.metadata || undefined,
      };
    });
  }, [activities, userMap]);

  // Convert inventory list to a Map for efficient lookup by productId
  const inventoryDataMap = useMemo(() => {
    if (!inventoryList) return undefined;
    const map = new Map<string, Inventory>();
    inventoryList.forEach((inv) => {
      map.set(inv.productId, inv);
    });
    return map;
  }, [inventoryList]);

  // Track unsaved changes - compare current form state with original fulfillment order data
  const hasUnsavedChanges = useMemo(() => {
    if (!fulfillmentOrder) return false;

    const originalWarehouseId = fulfillmentOrder.warehouseId || '';
    const originalShippingMethod = fulfillmentOrder.fulfillmentMethod || 'SHIP';
    const originalCarrierId = fulfillmentOrder.carrierId || '';
    const originalCarrierType = fulfillmentOrder.carrierType?.toLowerCase() || 'parcel';
    const originalFreightClass = fulfillmentOrder.freightClass || '';
    const originalNeedByDate = fulfillmentOrder.needByDate || '';
    const originalShipToName = fulfillmentOrder.shipToAddress?.name || '';
    const originalShipToLine1 = fulfillmentOrder.shipToAddress?.street || '';
    const originalShipToLine2 = fulfillmentOrder.shipToAddress?.streetLine2 || '';
    const originalShipToCity = fulfillmentOrder.shipToAddress?.city || '';
    const originalShipToState = fulfillmentOrder.shipToAddress?.state || '';
    const originalShipToPostalCode = fulfillmentOrder.shipToAddress?.postalCode || '';
    const originalShipToPhone = fulfillmentOrder.shipToAddress?.phone || '';

    return (
      warehouseId !== originalWarehouseId ||
      shippingMethod !== originalShippingMethod ||
      selectedCarrier !== originalCarrierId ||
      carrierType !== originalCarrierType ||
      freightClass !== originalFreightClass ||
      needByDate !== originalNeedByDate ||
      shipToName !== originalShipToName ||
      shipToAddressLine1 !== originalShipToLine1 ||
      shipToAddressLine2 !== originalShipToLine2 ||
      shipToCity !== originalShipToCity ||
      shipToState !== originalShipToState ||
      shipToPostalCode !== originalShipToPostalCode ||
      shipToPhone !== originalShipToPhone
    );
  }, [
    fulfillmentOrder,
    warehouseId,
    shippingMethod,
    selectedCarrier,
    carrierType,
    freightClass,
    needByDate,
    shipToName,
    shipToAddressLine1,
    shipToAddressLine2,
    shipToCity,
    shipToState,
    shipToPostalCode,
    shipToPhone,
  ]);

  // Loading state
  if (isLoading) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-[var(--muted-foreground)]">Loading fulfillment order...</div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-destructive mb-2">Error Loading Order</h1>
          <p className="text-[var(--muted-foreground)] mb-4">{error.message}</p>
          <button
            onClick={() => router.push('/warehouse/fulfillment')}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Fulfillment
          </button>
        </div>
      </main>
    );
  }

  if (!fulfillmentOrder) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Fulfillment Order Not Found</h1>
          <p className="text-[var(--muted-foreground)] mb-4">The requested fulfillment order could not be found.</p>
          <button
            onClick={() => router.push('/warehouse/fulfillment')}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Fulfillment
          </button>
        </div>
      </main>
    );
  }

  // Use viewing status if set, otherwise use actual status
  const displayStatus = viewingStatus || fulfillmentOrder.status;
  const isReleased = displayStatus !== 'PENDING';
  const isPicking = displayStatus === 'PICKING';
  const isPacking = displayStatus === 'PACKING';
  const isShipping = displayStatus === 'SHIPPING';
  const isShipped = displayStatus === 'SHIPPED';

  // Picking handlers
  const handleMarkAsPicked = async (lineItemId: string, qty: number) => {
    // Update local state optimistically
    setPickedItems(prev => ({ ...prev, [lineItemId]: qty }));
    // Send to API
    try {
      await updatePickedQuantityMutation.mutateAsync({
        lineItemId,
        quantity: qty,
        notes: pickingNotes[lineItemId] || null,
      });
    } catch (error) {
      console.error('Failed to update picked quantity:', error);
      // Revert on error - will be refreshed from server
    }
  };

  const handlePickAll = async (lineItemId: string, allocatedQty: number) => {
    // Update local state optimistically
    setPickedItems(prev => ({ ...prev, [lineItemId]: allocatedQty }));
    // Send to API
    try {
      await updatePickedQuantityMutation.mutateAsync({
        lineItemId,
        quantity: allocatedQty,
        notes: pickingNotes[lineItemId] || null,
      });
    } catch (error) {
      console.error('Failed to update picked quantity:', error);
    }
  };

  const handleSimulateQRScan = (lineItemId: string, allocatedQty: number) => {
    handlePickAll(lineItemId, allocatedQty);
  };

  const handleUpdateNote = (lineItemId: string, note: string) => {
    setPickingNotes(prev => ({ ...prev, [lineItemId]: note }));
  };

  // Activity feed handlers
  const handleAddActivityNote = async (content: string) => {
    try {
      await addNoteMutation.mutateAsync({
        fulfillmentOrderId: fulfillmentOrder.id,
        content,
      });
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const getActivityIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'CREATED':
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
        );
      case 'RELEASED':
        return (
          <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-600">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
        );
      case 'PICK_STARTED':
      case 'PICK_COMPLETED':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
        );
      case 'PACK_STARTED':
      case 'PACK_COMPLETED':
        return (
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
              <path d="M12.89 1.45l8 4A2 2 0 0122 7.24v9.53a2 2 0 01-1.11 1.79l-8 4a2 2 0 01-1.79 0l-8-4a2 2 0 01-1.1-1.8V7.24a2 2 0 011.11-1.79l8-4a2 2 0 011.78 0z"/>
              <polyline points="2.32 6.16 12 11 21.68 6.16"/>
              <line x1="12" y1="22.76" x2="12" y2="11"/>
            </svg>
          </div>
        );
      case 'SHIPPED':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
        );
      case 'DELIVERED':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
        );
      case 'CANCELLED':
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
          </div>
        );
      case 'NOTE_ADDED':
      case 'ITEM_NOTE_ADDED':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
        );
      case 'BACKORDER_REPORTED':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
        );
      case 'ASSIGNMENT_ADDED':
      case 'ASSIGNMENT_REMOVED':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
        );
    }
  };

  const getActivityTitle = (activity: GenericActivity): string => {
    switch (activity.type) {
      case 'CREATED':
        return 'Order Created';
      case 'RELEASED':
        return 'Released to Warehouse';
      case 'PICK_STARTED':
        return 'Picking Started';
      case 'PICK_COMPLETED':
        return 'Picking Completed';
      case 'PACK_STARTED':
        return 'Packing Started';
      case 'PACK_COMPLETED':
        return 'Packing Completed';
      case 'SHIPPED':
        const carrier = activity.metadata?.carrier as string | undefined;
        const tracking = activity.metadata?.trackingNumber as string | undefined;
        if (carrier && tracking) {
          return `Shipped via ${carrier} (${tracking})`;
        }
        return 'Order Shipped';
      case 'DELIVERED':
        return 'Order Delivered';
      case 'CANCELLED':
        return 'Order Cancelled';
      case 'NOTE_ADDED':
        return 'Note Added';
      case 'ITEM_NOTE_ADDED':
        const partNumber = activity.metadata?.partNumber as string | undefined;
        return partNumber ? `Note Added to Item: ${partNumber}` : 'Item Note Added';
      case 'BACKORDER_REPORTED':
        return 'Backorder Reported';
      case 'ASSIGNMENT_ADDED':
        const addedName = activity.metadata?.assigneeName as string | undefined;
        const addedRole = activity.metadata?.assignmentType as string | undefined;
        return addedName ? `${addedName} assigned as ${addedRole}` : 'Assignment Added';
      case 'ASSIGNMENT_REMOVED':
        const removedName = activity.metadata?.assigneeName as string | undefined;
        return removedName ? `${removedName} unassigned` : 'Assignment Removed';
      default:
        return 'Activity';
    }
  };

  const formatActivityDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Packing handlers
  const handleVerifyItem = (lineItemId: string) => {
    setVerifiedItems(prev => ({
      ...prev,
      [lineItemId]: !prev[lineItemId]
    }));
  };

  const handleUpdatePackingNote = (lineItemId: string, note: string) => {
    setPackingNotes(prev => ({
      ...prev,
      [lineItemId]: note
    }));
  };

  // All packing operations are LOCAL ONLY - changes saved when clicking Save button
  const addNewBox = () => {
    const newBox: PackingBoxType = {
      id: `local-box-${localBoxCounter}`,
      packagingType: 'pallet_48x40x6',
      customWeight: '',
      useCustomWeight: false,
      customDimensions: { length: '', width: '', height: '' },
      lineItemIds: [],
    };
    setPackingBoxes(prev => [...prev, newBox]);
    setLocalBoxCounter(prev => prev + 1);
  };

  const removeBox = (boxId: string) => {
    if (packingBoxes.length <= 1) return;

    // Track server-side boxes for deletion on save
    if (!boxId.startsWith('local-')) {
      setBoxesToDelete(prev => [...prev, boxId]);
    }

    // Update verified items - unverify items that were in this box
    const boxToRemove = packingBoxes.find(b => b.id === boxId);
    if (boxToRemove) {
      const itemsToUnverify = boxToRemove.lineItemIds;
      setVerifiedItems(prev => {
        const updated = { ...prev };
        itemsToUnverify.forEach(id => { updated[id] = false; });
        return updated;
      });
    }

    // Remove from local state
    setPackingBoxes(prev => prev.filter(b => b.id !== boxId));
  };

  const updateBox = (boxId: string, updates: Partial<PackingBoxType>) => {
    setPackingBoxes(prev => prev.map(box =>
      box.id === boxId ? { ...box, ...updates } : box
    ));
  };

  const assignItemToBox = (lineItemId: string, boxId: string) => {
    setPackingBoxes(prev => prev.map(box => ({
      ...box,
      lineItemIds: box.id === boxId
        ? [...box.lineItemIds.filter(id => id !== lineItemId), lineItemId]
        : box.lineItemIds.filter(id => id !== lineItemId)
    })));
    setVerifiedItems(prev => ({ ...prev, [lineItemId]: true }));
  };

  const getUnassignedItems = () => {
    const assignedIds = packingBoxes.flatMap(b => b.lineItemIds);
    return fulfillmentOrder.lineItems.filter(li => !assignedIds.includes(li.id));
  };

  const addAllItemsToBox = (boxId: string) => {
    const unassignedItems = getUnassignedItems();
    if (unassignedItems.length === 0) return;

    const unassignedIds = unassignedItems.map(li => li.id);
    setPackingBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        return { ...box, lineItemIds: [...box.lineItemIds, ...unassignedIds] };
      }
      return box;
    }));

    const newVerified: Record<string, boolean> = {};
    unassignedIds.forEach(id => { newVerified[id] = true; });
    setVerifiedItems(prev => ({ ...prev, ...newVerified }));
  };

  const removeItemFromBox = (boxId: string, lineItemId: string) => {
    setPackingBoxes(prev => prev.map(b => ({
      ...b,
      lineItemIds: b.lineItemIds.filter(id => id !== lineItemId)
    })));
    setVerifiedItems(prev => ({ ...prev, [lineItemId]: false }));
  };

  const handleDragStart = (e: React.DragEvent, lineItemId: string) => {
    setDraggedItemId(lineItemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, boxId: string) => {
    e.preventDefault();
    if (draggedItemId) {
      assignItemToBox(draggedItemId, boxId);
      setDraggedItemId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  const getBoxWeight = (box: PackingBoxType): string => {
    if (box.useCustomWeight && box.customWeight) {
      return box.customWeight;
    }
    const itemsInBox = fulfillmentOrder.lineItems.filter(li => box.lineItemIds.includes(li.id));
    const calculated = itemsInBox.reduce((sum, li) => sum + (li.allocatedQty * 0.5), 0);
    return calculated > 0 ? calculated.toFixed(1) : '0.0';
  };

  // Status transition handlers
  const handleReleaseToWarehouse = async () => {
    if (fulfillmentOrder.status !== 'PENDING') return;
    try {
      await releaseToWarehouseMutation.mutateAsync(fulfillmentOrder.id);
      fulfillmentToasts.releaseSuccess(fulfillmentOrder.fulfillmentOrderNumber);
    } catch (error) {
      console.error('Failed to release to warehouse:', error);
      fulfillmentToasts.releaseError(error instanceof Error ? error.message : undefined);
    }
  };

  const handleStartPicking = async () => {
    if (fulfillmentOrder.status !== 'RELEASED') return;
    try {
      await startPickingMutation.mutateAsync(fulfillmentOrder.id);
      fulfillmentToasts.startPickingSuccess(fulfillmentOrder.fulfillmentOrderNumber);
    } catch (error) {
      console.error('Failed to start picking:', error);
      fulfillmentToasts.startPickingError(error instanceof Error ? error.message : undefined);
    }
  };

  const handleCompletePicking = async () => {
    if (fulfillmentOrder.status !== 'PICKING') return;
    try {
      await completePickingMutation.mutateAsync(fulfillmentOrder.id);
      fulfillmentToasts.completePickingSuccess(fulfillmentOrder.fulfillmentOrderNumber);
    } catch (error) {
      console.error('Failed to complete picking:', error);
      fulfillmentToasts.completePickingError(error instanceof Error ? error.message : undefined);
    }
  };

  const handleCompletePacking = async () => {
    if (fulfillmentOrder.status !== 'PACKING') return;
    try {
      await completePackingMutation.mutateAsync(fulfillmentOrder.id);
      fulfillmentToasts.completePackingSuccess(fulfillmentOrder.fulfillmentOrderNumber);
    } catch (error) {
      console.error('Failed to complete packing:', error);
      fulfillmentToasts.completePackingError(error instanceof Error ? error.message : undefined);
    }
  };

  const handleCompleteShipping = async () => {
    if (fulfillmentOrder.status !== 'SHIPPING') return;
    const requiresSignature = (shippingMethod === 'SHIP' && carrierType === 'freight') || shippingMethod === 'WILL_CALL';
    if (requiresSignature && !pickupSignature) {
      setShowSignatureModal(true);
      return;
    }
    try {
      await completeShippingMutation.mutateAsync({
        id: fulfillmentOrder.id,
        input: {
          trackingNumbers: trackingNumbers.split(',').map(t => t.trim()).filter(t => t),
          ...(pickupSignature && {
            signature: pickupSignature,
            pickupCustomerName: pickupName,
            driverName: driverName,
          }),
        },
      });
      fulfillmentToasts.shipmentConfirmed(fulfillmentOrder.fulfillmentOrderNumber);
    } catch (error) {
      console.error('Failed to complete shipping:', error);
      fulfillmentToasts.shipmentError(error instanceof Error ? error.message : undefined);
    }
  };

  const handleReportBackorder = (lineItemId: string, expectedQty: number, actualQty: number, notes: string) => {
    if (fulfillmentOrder.status !== 'PICKING') return;

    const lineItem = fulfillmentOrder.lineItems.find(li => li.id === lineItemId);
    if (!lineItem) return;

    const now = new Date().toISOString();

    // Create backorder review data
    const backorderReviewData: BackorderReviewData = {
      lineItemId,
      expectedTotal: expectedQty,
      actualTotal: actualQty,
      shortageQty: expectedQty - actualQty,
      workerNotes: notes,
      reportedBy: 'Current User',
      reportedAt: now,
      locationRecords: [], // Would be populated with actual location data
    };

    // Update the fulfillment order to BACKORDER_REVIEW status
    updateOrderMutation.mutate({
      id: fulfillmentOrder.id,
      input: {
        status: 'BACKORDER_REVIEW',
        holdReason: `Worker reported shortage: ${expectedQty - actualQty} units short on ${lineItem.product?.factoryPartNumber || 'Unknown'}`,
        backorderReviewData,
      },
    });

    setForceUpdate(prev => prev + 1);
  };

  // Handle inventory discrepancy - reports to backend and triggers backorder review
  const handleInventoryDiscrepancy = async (discrepancy: InventoryDiscrepancy) => {
    try {
      await reportDiscrepancyMutation.mutateAsync({
        lineItemId: discrepancy.lineItemId,
        actualQuantity: discrepancy.actualQty,
        reason: `Location ${discrepancy.locationName}: Expected ${discrepancy.expectedQty}, found ${discrepancy.actualQty}. Shortage: ${discrepancy.shortage}`,
      });
    } catch (error) {
      console.error('Failed to report inventory discrepancy:', error);
    }
  };

  const handleContinue = () => {
    if (fulfillmentOrder.status === 'PENDING') handleReleaseToWarehouse();
    else if (fulfillmentOrder.status === 'RELEASED') handleStartPicking();
    else if (fulfillmentOrder.status === 'PICKING') handleCompletePicking();
    else if (fulfillmentOrder.status === 'PACKING') handleCompletePacking();
    else if (fulfillmentOrder.status === 'SHIPPING') handleCompleteShipping();
    else if (fulfillmentOrder.status === 'SHIPPED' || fulfillmentOrder.status === 'PARTIAL_SHIPPED') {
      setShowShipmentConfirmationModal(true);
    }
  };

  const handleSave = async () => {
    if (!fulfillmentOrder) return;

    try {
      // 1. Save fulfillment order basic info
      await updateOrderMutation.mutateAsync({
        id: fulfillmentOrder.id,
        input: {
          warehouseId: warehouseId || null,
          fulfillmentMethod: shippingMethod,
          carrierId: selectedCarrier || null,
          carrierType: shippingMethod === 'SHIP' ? carrierType.toUpperCase() as 'PARCEL' | 'FREIGHT' : null,
          freightClass: freightClass || null,
          serviceType: serviceType || null,
          needByDate: needByDate || null,
          shipToName: shipToName || null,
          shipToPhone: shipToPhone || null,
          shipToAddress: {
            sourceId: fulfillmentOrder.id,
            sourceType: 'FULFILLMENT_ORDER',
            addressTypes: ['SHIPPING'],
            line1: shipToAddressLine1 || '',
            line2: shipToAddressLine2 || null,
            city: shipToCity || '',
            state: shipToState || null,
            zipCode: shipToPostalCode || null,
            country: 'USA',
          },
        },
      });

      // 2. Sync packing boxes if in PACKING status or later
      const isPacking = fulfillmentOrder.status === 'PACKING' ||
                        fulfillmentOrder.status === 'SHIPPING' ||
                        fulfillmentOrder.status === 'SHIPPED';

      if (isPacking) {
        // Get current server boxes
        const serverBoxIds = new Set(fulfillmentOrder.packingBoxes?.map(b => b.id) || []);

        // Delete boxes that were removed locally
        for (const boxId of boxesToDelete) {
          if (serverBoxIds.has(boxId)) {
            try {
              await deletePackingBoxMutation.mutateAsync(boxId);
            } catch (err) {
              console.error('Failed to delete box:', boxId, err);
            }
          }
        }

        // Map from local box ID to server box ID for new boxes
        const boxIdMap = new Map<string, string>();

        // Create new boxes and update existing ones
        for (const box of packingBoxes) {
          const packagingOpt = packagingOptions.find((opt) => opt.value === box.packagingType);
          const dimensions = packagingOpt?.dimensions || { length: '48', width: '40', height: '6' };

          const boxInput = {
            length: parseFloat(box.customDimensions.length || dimensions.length) || null,
            width: parseFloat(box.customDimensions.width || dimensions.width) || null,
            height: parseFloat(box.customDimensions.height || dimensions.height) || null,
            weight: box.useCustomWeight && box.customWeight ? parseFloat(box.customWeight) : null,
          };

          if (box.id.startsWith('local-')) {
            // Create new box on server
            try {
              const newBox = await addPackingBoxMutation.mutateAsync({
                fulfillmentOrderId,
                input: boxInput,
              });
              boxIdMap.set(box.id, newBox.id);
            } catch (err) {
              console.error('Failed to create box:', err);
            }
          } else {
            // Update existing box
            boxIdMap.set(box.id, box.id);
            // TODO: Could add updatePackingBox call here if dimensions changed
          }
        }

        // Get server's current item assignments
        const serverItemAssignments = new Map<string, string>(); // lineItemId -> boxId
        fulfillmentOrder.packingBoxes?.forEach(box => {
          box.items.forEach(item => {
            serverItemAssignments.set(item.fulfillmentLineItemId, box.id);
          });
        });

        // Sync item assignments
        for (const box of packingBoxes) {
          const serverBoxId = boxIdMap.get(box.id);
          if (!serverBoxId) continue;

          for (const lineItemId of box.lineItemIds) {
            const currentServerBoxId = serverItemAssignments.get(lineItemId);

            if (currentServerBoxId !== serverBoxId) {
              // Item needs to be moved or assigned
              if (currentServerBoxId) {
                // Remove from old box first
                try {
                  await removeItemFromBoxMutation.mutateAsync({
                    boxId: currentServerBoxId,
                    lineItemId
                  });
                } catch (err) {
                  console.error('Failed to remove item from box:', err);
                }
              }

              // Assign to new box
              const lineItem = fulfillmentOrder.lineItems.find(li => li.id === lineItemId);
              const quantity = lineItem?.allocatedQty || 1;
              try {
                await assignItemToBoxMutation.mutateAsync({
                  boxId: serverBoxId,
                  lineItemId,
                  quantity,
                });
              } catch (err) {
                console.error('Failed to assign item to box:', err);
              }
            }
          }
        }

        // Remove items that are no longer in any box
        const localAssignedItems = new Set(packingBoxes.flatMap(b => b.lineItemIds));
        for (const [lineItemId, boxId] of serverItemAssignments) {
          if (!localAssignedItems.has(lineItemId)) {
            try {
              await removeItemFromBoxMutation.mutateAsync({ boxId, lineItemId });
            } catch (err) {
              console.error('Failed to remove unassigned item:', err);
            }
          }
        }

        // Clear the boxes to delete list after successful save
        setBoxesToDelete([]);
      }

      fulfillmentToasts.saveSuccess(fulfillmentOrder.fulfillmentOrderNumber);
      // Refetch to sync state with server
      refetchOrder();
    } catch (error) {
      console.error('Failed to save fulfillment order:', error);
      fulfillmentToasts.saveError(error instanceof Error ? error.message : undefined);
    }
  };

  const handleStatusClick = (status: FulfillmentOrderStatus) => {
    setViewingStatus(status === fulfillmentOrder.status ? null : status);
  };

  const handleClearSignature = () => {
    setPickupSignature(null);
    setPickupTimestamp(null);
    setPickupName('');
    setDriverName('');
    setPickupNotes('');
  };

  // Backorder handling functions
  const handleManufacturerDirect = async (selectedItems: BackorderItem[]) => {
    const lineItemIds = selectedItems.map(item => item.lineItem.id);
    try {
      await markManufacturerFulfilledMutation.mutateAsync({
        fulfillmentOrderId,
        lineItemIds,
      });
      setShowManufacturerDirectModal(false);
    } catch (error) {
      console.error('Failed to mark as manufacturer fulfilled:', error);
    }
  };

  const handleCreateInventoryRequest = async (items: { lineItem: FulfillmentOrderLineItem; requestedQty: number }[]) => {
    // Validate warehouse is assigned
    if (!fulfillmentOrder.warehouseId) {
      alert('Error: No warehouse assigned to this fulfillment order. Please assign a warehouse before creating a shipment request.');
      return;
    }

    // Group items by manufacturer
    const byManufacturer = items.reduce((acc, item) => {
      const inv = backorderItems.find(bi => bi.lineItem.id === item.lineItem.id);
      if (inv && inv.manufacturerId) {
        const mfrId = inv.manufacturerId;
        if (!acc[mfrId]) {
          acc[mfrId] = { name: inv.manufacturerName, items: [] };
        }
        acc[mfrId].items.push({
          productId: item.lineItem.productId,
          quantity: item.requestedQty,
        });
      }
      return acc;
    }, {} as Record<string, { name: string; items: Array<{ productId: string; quantity: number }> }>);

    // Validate we have manufacturers to request from
    const manufacturerEntries = Object.entries(byManufacturer);
    if (manufacturerEntries.length === 0) {
      alert('Error: No manufacturers found for the selected items. Products need to have a manufacturer assigned.');
      return;
    }

    try {
      // Create shipment requests for each manufacturer
      for (const [mfrId, { items: reqItems }] of manufacturerEntries) {
        await createShipmentRequestMutation.mutateAsync({
          warehouseId: fulfillmentOrder.warehouseId,
          factoryId: mfrId,
          requestDate: new Date().toISOString(),
          priority: 'STANDARD',
          method: 'EMAIL',
          status: 'DRAFT',
          notes: `Created from fulfillment order ${fulfillmentOrder.fulfillmentOrderNumber}`,
          items: reqItems,
        });
      }

      // Update the fulfillment order to show it's pending delivery
      updateOrderMutation.mutate({
        id: fulfillmentOrderId,
        input: { holdReason: 'Pending inventory delivery request' },
      });

      setShowRequestInventoryModal(false);
      alert('Shipment request created successfully!');
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('Failed to create shipment request:', error);
      alert(`Failed to create shipment request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddToExistingRequest = (requestId: string, items: { lineItem: FulfillmentOrderLineItem; requestedQty: number }[]) => {
    // In a real app, this would add items to the existing request
    console.log('Adding items to existing request:', requestId, items);
    setShowRequestInventoryModal(false);
    setForceUpdate(prev => prev + 1);
  };

  const handleSplitOrder = async (allocations: { lineItemId: string; warehouseQty: number; manufacturerQty: number }[]) => {
    try {
      for (const alloc of allocations) {
        if (alloc.manufacturerQty > 0) {
          await splitLineItemMutation.mutateAsync({
            lineItemId: alloc.lineItemId,
            warehouseQty: alloc.warehouseQty,
            manufacturerQty: alloc.manufacturerQty,
          });
        }
      }
      setShowSplitOrderModal(false);
    } catch (error) {
      console.error('Failed to split line item:', error);
    }
  };

  const handleCancelBackorder = async (allocations: { lineItemId: string; originalQty: number; newQty: number; cancelledQty: number }[], cancellationReason: string) => {
    const lineItemIds = allocations
      .filter(alloc => alloc.cancelledQty > 0)
      .map(alloc => alloc.lineItemId);

    if (lineItemIds.length === 0) {
      setShowCancelBackorderModal(false);
      return;
    }

    try {
      await cancelBackorderMutation.mutateAsync({
        fulfillmentOrderId,
        lineItemIds,
        reason: cancellationReason,
      });
      setShowCancelBackorderModal(false);
    } catch (error) {
      console.error('Failed to cancel backorder items:', error);
    }
  };

  // Handle sending shipment confirmation email
  const handleSendShipmentConfirmation = async (emailData: {
    to: string;
    subject: string;
    body: string;
    attachedDocIds: string[];
  }) => {
    // Log the email (in a real app, this would send via email service)
    console.log('Sending shipment confirmation email:', emailData);

    try {
      // Mark order as communicated (status transition)
      await markCommunicatedMutation.mutateAsync(fulfillmentOrder.id);

      // Add activity note for email sent
      await addNoteMutation.mutateAsync({
        fulfillmentOrderId: fulfillmentOrder.id,
        content: `Shipment confirmation email sent to ${emailData.to}`,
      });
    } catch (error) {
      console.error('Failed to send shipment confirmation:', error);
      alert('Failed to send shipment confirmation. Please try again.');
      return;
    }

    setShowShipmentConfirmationModal(false);
  };

  // Get continue button props
  const getContinueButtonProps = () => {
    // Block release if there are unresolved backorder items
    const hasUnresolvedBackorders = backorderItems.length > 0;

    const statusMap: Record<FulfillmentOrderStatus, { text: string; color: string; canContinue: boolean; blockedReason?: string }> = {
      'PENDING': hasUnresolvedBackorders
        ? { text: 'Resolve Backorders', color: 'bg-amber-500 hover:bg-amber-600', canContinue: false, blockedReason: 'Resolve backorder items before releasing' }
        : { text: 'Release to Warehouse', color: 'bg-cyan-600 hover:bg-cyan-700', canContinue: true },
      'RELEASED': { text: 'Start Picking', color: 'bg-yellow-600 hover:bg-yellow-700', canContinue: true },
      'PICKING': { text: 'Complete Picking', color: 'bg-amber-600 hover:bg-amber-700', canContinue: true },
      'BACKORDER_REVIEW': { text: 'Under Review', color: 'bg-red-500', canContinue: false, blockedReason: 'Awaiting manager review for reported shortage' },
      'PACKING': { text: 'Complete Packing', color: 'bg-orange-600 hover:bg-orange-700', canContinue: true },
      'SHIPPING': {
        text: (shippingMethod === 'SHIP' && carrierType === 'freight') || shippingMethod === 'WILL_CALL' && !pickupSignature ? 'Capture Signature' : 'Complete Shipping',
        color: (shippingMethod === 'SHIP' && carrierType === 'freight') || shippingMethod === 'WILL_CALL' && !pickupSignature ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700',
        canContinue: true
      },
      'SHIPPED': { text: 'Send Confirmation', color: 'bg-teal-600 hover:bg-teal-700', canContinue: true },
      'PARTIAL_SHIPPED': { text: 'Send Confirmation', color: 'bg-teal-600 hover:bg-teal-700', canContinue: true },
      'COMMUNICATED': { text: 'Completed', color: 'bg-gray-400', canContinue: false },
      'DELIVERED': { text: 'Completed', color: 'bg-gray-400', canContinue: false },
      'CANCELLED': { text: 'Cancelled', color: 'bg-gray-400', canContinue: false },
    };
    return statusMap[fulfillmentOrder.status] || { text: 'Continue', color: 'bg-[var(--primary)]', canContinue: false };
  };

  const { text: continueButtonText, color: continueButtonColor, canContinue, blockedReason } = getContinueButtonProps();

  // Shipped data for ShippedInterface
  const shippedData = {
    carrierType: (fulfillmentOrder as any)?.carrierType || carrierType,
    carrier: fulfillmentOrder?.carrier?.name || selectedCarrier,
    trackingNumbers: fulfillmentOrder?.trackingNumbers?.join(', ') || trackingNumbers,
    shipConfirmedAt: fulfillmentOrder?.shipConfirmedAt ?? undefined,
    pickupSignature: (fulfillmentOrder as any)?.pickupSignature || pickupSignature,
    pickupTimestamp: (fulfillmentOrder as any)?.pickupTimestamp ? new Date((fulfillmentOrder as any).pickupTimestamp) : pickupTimestamp,
    pickupCustomerName: (fulfillmentOrder as any)?.pickupCustomerName || pickupName,
    pickupDriverName: (fulfillmentOrder as any)?.pickupDriverName || driverName,
    pickupNotes: (fulfillmentOrder as any)?.pickupNotes || pickupNotes,
    shippingNotes: (fulfillmentOrder as any)?.shippingNotes || shippingNotes,
    bolNumber: (fulfillmentOrder as any)?.bolNumber || bolNumber,
    proNumber: (fulfillmentOrder as any)?.proNumber || proNumber,
  };

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      <div className="max-w-[1400px] mx-auto p-6">
        {/* Header */}
        <FulfillmentHeader
          fulfillmentOrder={fulfillmentOrder}
          onSave={handleSave}
          onContinue={handleContinue}
          canContinue={canContinue}
          continueButtonText={continueButtonText}
          continueButtonColor={continueButtonColor}
          blockedReason={blockedReason}
          isSaving={updateOrderMutation.isPending}
          isContinuing={
            releaseToWarehouseMutation.isPending ||
            startPickingMutation.isPending ||
            completePickingMutation.isPending ||
            completePackingMutation.isPending ||
            completeShippingMutation.isPending
          }
        />

        {/* Status Progress */}
        <StatusProgress
          currentStatus={fulfillmentOrder.status}
          viewingStatus={viewingStatus}
          onStatusClick={handleStatusClick}
          onBackToCurrent={() => setViewingStatus(null)}
        />

        {/* Backorder Notice - Show on PENDING, RELEASED, or BACKORDER_REVIEW status with backorder items */}
        {(fulfillmentOrder.status === 'PENDING' || fulfillmentOrder.status === 'RELEASED' || fulfillmentOrder.status === 'BACKORDER_REVIEW') && backorderItems.length > 0 && (
          <BackorderNotice
            fulfillmentOrder={fulfillmentOrder}
            backorderItems={backorderItems}
            onManufacturerDirect={() => setShowManufacturerDirectModal(true)}
            onRequestInventory={() => setShowRequestInventoryModal(true)}
            onSplitOrder={() => setShowSplitOrderModal(true)}
            onCancelBackorder={() => setShowCancelBackorderModal(true)}
          />
        )}

        {/* Manufacturer Order Notice - Show when items are being fulfilled by manufacturer */}
        {fulfillmentOrder.manufacturerOrderStatus && fulfillmentOrder.manufacturerOrderStatus !== 'NONE' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-indigo-900">
                  {fulfillmentOrder.manufacturerOrderStatus === 'FULL'
                    ? 'Manufacturer Direct Fulfillment'
                    : 'Split Fulfillment - Warehouse & Manufacturer'}
                </h3>
                <p className="text-xs text-indigo-700 mt-0.5">
                  {fulfillmentOrder.manufacturerOrderStatus === 'FULL'
                    ? 'This entire order is being fulfilled directly by the manufacturer.'
                    : 'Some items on this order are being fulfilled directly by the manufacturer.'}
                </p>
              </div>
              <a
                href={`/orders/${fulfillmentOrder.orderId}`}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline"
              >
                View Original Order
              </a>
            </div>
          </div>
        )}

        {/* Hold Notice - Show when order is on hold */}
        {fulfillmentOrder.holdReason && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-amber-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900">Order On Hold</h3>
                <p className="text-xs text-amber-700 mt-0.5">{fulfillmentOrder.holdReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Picking Interface */}
        {isPicking && (
          <div className="mb-4">
            <PickingInterface
              fulfillmentOrder={fulfillmentOrder}
              pickedItems={pickedItems}
              pickingNotes={pickingNotes}
              expandedNoteId={expandedNoteId}
              onMarkAsPicked={handleMarkAsPicked}
              onPickAll={handlePickAll}
              onUpdateNote={handleUpdateNote}
              onExpandNote={setExpandedNoteId}
              onCompletePicking={handleCompletePicking}
              onReportInventoryDiscrepancy={handleInventoryDiscrepancy}
              inventoryData={inventoryDataMap}
            />
          </div>
        )}

        {/* Packing Interface */}
        {isPacking && (
          <div className="mb-4">
            <PackingInterface
              fulfillmentOrder={fulfillmentOrder}
              packingBoxes={packingBoxes}
              draggedItemId={draggedItemId}
              onAddNewBox={addNewBox}
              onRemoveBox={removeBox}
              onUpdateBox={updateBox}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onAddAllItemsToBox={addAllItemsToBox}
              onRemoveItemFromBox={removeItemFromBox}
              onCompletePacking={handleCompletePacking}
              onShowPackingSlipModal={() => setShowPackingSlipModal(true)}
              getUnassignedItems={getUnassignedItems}
            />
          </div>
        )}

        {/* Shipping Interface */}
        {isShipping && (
          <div className="mb-4">
            <ShippingInterface
              fulfillmentOrder={fulfillmentOrder}
              packingBoxes={packingBoxes}
              shippingMethod={shippingMethod}
              carrierType={carrierType}
              selectedCarrier={selectedCarrier}
              trackingNumbers={trackingNumbers}
              proNumber={proNumber}
              bolNumber={bolNumber}
              freightClass={freightClass}
              shippingNotes={shippingNotes}
              pickupSignature={pickupSignature}
              pickupTimestamp={pickupTimestamp}
              pickupName={pickupName}
              driverName={driverName}
              pickupNotes={pickupNotes}
              isShippingConfigLocked={isShippingConfigLocked}
              isShippingConfigCollapsed={isShippingConfigCollapsed}
              onShippingMethodChange={setShippingMethod}
              onCarrierTypeChange={setCarrierType}
              onCarrierChange={setSelectedCarrier}
              onTrackingNumbersChange={setTrackingNumbers}
              onProNumberChange={setProNumber}
              onBolNumberChange={setBolNumber}
              onFreightClassChange={setFreightClass}
              onShippingNotesChange={setShippingNotes}
              onToggleLock={() => setIsShippingConfigLocked(!isShippingConfigLocked)}
              onToggleCollapse={() => setIsShippingConfigCollapsed(!isShippingConfigCollapsed)}
              onShowPackingSlipModal={() => setShowPackingSlipModal(true)}
              onShowShippingLabelsModal={() => setShowShippingLabelsModal(true)}
              onShowBOLModal={() => setShowBOLModal(true)}
              onShowSignatureModal={() => setShowSignatureModal(true)}
              onClearSignature={handleClearSignature}
              onCompleteShipping={handleCompleteShipping}
              getBoxWeight={getBoxWeight}
            />
          </div>
        )}

        {/* Shipped Interface */}
        {isShipped && (
          <div className="mb-4">
            <ShippedInterface
              fulfillmentOrder={fulfillmentOrder}
              packingBoxes={packingBoxes}
              shippingMethod={shippingMethod}
              shippedData={shippedData}
              onShowPackingSlipModal={() => setShowPackingSlipModal(true)}
              onShowShippingLabelsModal={() => setShowShippingLabelsModal(true)}
              onShowBOLModal={() => setShowBOLModal(true)}
            />
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-3 gap-4">
          {/* Left Column - Fulfillment Details & Line Items */}
          <div className="col-span-2 space-y-4">
            <FulfillmentDetailsForm
              fulfillmentOrder={fulfillmentOrder}
              warehouseId={warehouseId}
              needByDate={needByDate}
              shipToName={shipToName}
              shipToAddressLine1={shipToAddressLine1}
              shipToAddressLine2={shipToAddressLine2}
              shipToCity={shipToCity}
              shipToState={shipToState}
              shipToPostalCode={shipToPostalCode}
              shipToPhone={shipToPhone}
              carrier={selectedCarrier}
              carrierType={carrierType}
              serviceType={serviceType}
              trackingNumbers={trackingNumbers}
              freightClass={freightClass}
              shipToDifferentFromPO={shipToDifferentFromPO}
              isReleased={isReleased}
              deliveryMethod={shippingMethod}
              warehouses={warehouses}
              isLoadingWarehouses={isLoadingWarehouses}
              shippingCarriers={shippingCarriers}
              isLoadingCarriers={isLoadingCarriers}
              onDeliveryMethodChange={setShippingMethod}
              onWarehouseIdChange={setWarehouseId}
              onNeedByDateChange={setNeedByDate}
              onShipToNameChange={setShipToName}
              onShipToAddressLine1Change={setShipToAddressLine1}
              onShipToAddressLine2Change={setShipToAddressLine2}
              onShipToCityChange={setShipToCity}
              onShipToStateChange={setShipToState}
              onShipToPostalCodeChange={setShipToPostalCode}
              onShipToPhoneChange={setShipToPhone}
              onCarrierChange={setSelectedCarrier}
              onCarrierTypeChange={setCarrierType}
              onServiceTypeChange={setServiceType}
              onTrackingNumbersChange={setTrackingNumbers}
              onFreightClassChange={setFreightClass}
              onShipToDifferentFromPOChange={setShipToDifferentFromPO}
            />

            {/* Line Items Table - Now in left column */}
            <LineItemsTable fulfillmentOrder={fulfillmentOrder} />
          </div>

          {/* Right Column - Audit Timestamps, Assignment, Documents & Activity */}
          <div className="space-y-4">
            <AuditTimestamps
              fulfillmentOrder={fulfillmentOrder}
              isReleased={isReleased}
              onReleaseToWarehouse={handleReleaseToWarehouse}
              userMap={userMap}
            />
            <AssignmentPanel
              assignedManagers={fulfillmentOrder.assignments?.filter(a => a.role === 'MANAGER').map(a => ({ ...a, role: 'manager' as const })) || []}
              assignedWorkers={fulfillmentOrder.assignments?.filter(a => a.role === 'WORKER').map(a => ({ ...a, role: 'worker' as const })) || []}
              warehouseId={fulfillmentOrder.warehouseId}
              onAddAssignment={async (userId, role) => {
                try {
                  await addAssignmentMutation.mutateAsync({
                    fulfillmentOrderId,
                    userId,
                    role: role.toUpperCase() as FulfillmentAssignmentRole,
                  });
                } catch (error) {
                  console.error('Failed to add assignment:', error);
                }
              }}
              onRemoveAssignment={async (assignmentId) => {
                try {
                  await removeAssignmentMutation.mutateAsync(assignmentId);
                } catch (error) {
                  console.error('Failed to remove assignment:', error);
                }
              }}
              isEditable={!isShipped}
              showRequiredWarnings={!isReleased}
            />

            {/* Documents Section */}
            <DocumentsSection
              fulfillmentOrderId={fulfillmentOrderId}
              documents={fulfillmentOrder?.documents || []}
              onDocumentsChange={() => refetchOrder()}
              isEditable={!isShipped}
            />

            {/* Activity Feed */}
            <ActivityFeed
              activities={mappedActivities}
              onAddNote={handleAddActivityNote}
              getActivityIcon={getActivityIcon}
              getActivityTitle={getActivityTitle}
              formatDate={formatActivityDate}
              placeholder="Add a note about this order..."
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <PackingSlipModal
        isOpen={showPackingSlipModal}
        fulfillmentOrder={fulfillmentOrder}
        packingBoxes={packingBoxes}
        onClose={() => setShowPackingSlipModal(false)}
        onPrint={() => alert('Printing packing slips...')}
      />

      <ShippingLabelsModal
        isOpen={showShippingLabelsModal}
        fulfillmentOrder={fulfillmentOrder}
        packingBoxes={packingBoxes}
        onClose={() => setShowShippingLabelsModal(false)}
        onPrint={() => alert('Printing shipping labels...')}
      />

      <BillOfLadingModal
        isOpen={showBOLModal}
        fulfillmentOrder={fulfillmentOrder}
        onClose={() => setShowBOLModal(false)}
        onPrint={() => window.print()}
      />

      <SignatureCaptureModal
        isOpen={showSignatureModal}
        pickupName={pickupName}
        driverName={driverName}
        pickupNotes={pickupNotes}
        onPickupNameChange={setPickupName}
        onDriverNameChange={setDriverName}
        onPickupNotesChange={setPickupNotes}
        onClose={() => setShowSignatureModal(false)}
        onConfirm={(signatureData, timestamp) => {
          setPickupSignature(signatureData);
          setPickupTimestamp(timestamp);
          setShowSignatureModal(false);
        }}
      />

      {/* Backorder Modals */}
      <ManufacturerDirectModal
        isOpen={showManufacturerDirectModal}
        fulfillmentOrder={fulfillmentOrder}
        backorderItems={backorderItems}
        onClose={() => setShowManufacturerDirectModal(false)}
        onConfirm={handleManufacturerDirect}
      />

      <RequestInventoryModal
        isOpen={showRequestInventoryModal}
        fulfillmentOrder={fulfillmentOrder}
        backorderItems={backorderItems}
        existingShipmentRequests={pendingShipmentRequests}
        onClose={() => setShowRequestInventoryModal(false)}
        onCreateNew={handleCreateInventoryRequest}
        onAddToExisting={handleAddToExistingRequest}
      />

      <SplitOrderModal
        isOpen={showSplitOrderModal}
        fulfillmentOrder={fulfillmentOrder}
        backorderItems={backorderItems}
        onClose={() => setShowSplitOrderModal(false)}
        onConfirm={handleSplitOrder}
      />

      <CancelBackorderModal
        isOpen={showCancelBackorderModal}
        fulfillmentOrder={fulfillmentOrder}
        backorderItems={backorderItems}
        onClose={() => setShowCancelBackorderModal(false)}
        onConfirm={handleCancelBackorder}
      />

      <ShipmentConfirmationModal
        isOpen={showShipmentConfirmationModal}
        fulfillmentOrder={fulfillmentOrder}
        attachedDocuments={fulfillmentOrder?.documents || []}
        carrierType={carrierType}
        carrier={selectedCarrier}
        trackingNumbers={trackingNumbers}
        onClose={() => setShowShipmentConfirmationModal(false)}
        onSend={handleSendShipmentConfirmation}
      />

      {/* Floating Save Bar - appears when there are unsaved changes */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-amber-50 border-t-2 border-amber-400 shadow-lg z-50 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-amber-800 font-medium text-sm">You have unsaved changes</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Reset form to original values
                  if (fulfillmentOrder) {
                    setWarehouseId(fulfillmentOrder.warehouseId || '');
                    setShippingMethod(fulfillmentOrder.fulfillmentMethod || 'SHIP');
                    setSelectedCarrier(fulfillmentOrder.carrierId || '');
                    setCarrierType((fulfillmentOrder.carrierType?.toLowerCase() as 'parcel' | 'freight') || 'parcel');
                    setFreightClass(fulfillmentOrder.freightClass || '');
                    setNeedByDate(fulfillmentOrder.needByDate || '');
                    setShipToName(fulfillmentOrder.shipToAddress?.name || '');
                    setShipToAddressLine1(fulfillmentOrder.shipToAddress?.street || '');
                    setShipToAddressLine2(fulfillmentOrder.shipToAddress?.streetLine2 || '');
                    setShipToCity(fulfillmentOrder.shipToAddress?.city || '');
                    setShipToState(fulfillmentOrder.shipToAddress?.state || '');
                    setShipToPostalCode(fulfillmentOrder.shipToAddress?.postalCode || '');
                    setShipToPhone(fulfillmentOrder.shipToAddress?.phone || '');
                  }
                }}
                className="px-4 py-2 text-amber-700 hover:text-amber-900 font-medium text-sm transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={updateOrderMutation.isPending}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {updateOrderMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="17 21 17 13 7 13 7 21" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="7 3 7 8 15 8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
