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
// Mock imports only for features without backend support yet (shipment requests)
import {
  getPendingShipmentRequestsForManufacturer,
  addShipmentRequest,
} from '@/lib/data/warehouse-mock';
import { BackorderReviewData, AssignedUserRole, AttachedDocument } from '@/lib/types/warehouse';
// Inventory API for real inventory data
import { useInventoriesByProducts } from './api/useInventoryApi';
import type { Inventory } from './api/inventoryApi';

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
import { PackingBoxType } from './fulfillment-detail/packing/PackingBox';

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
  const { data: fulfillmentOrder, isLoading, error } = useFulfillmentOrder(fulfillmentOrderId);

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
  const markDeliveredMutation = useMarkDelivered();
  const addNoteMutation = useAddFulfillmentNote();
  const reportDiscrepancyMutation = useReportInventoryDiscrepancy();

  // New mutations for assignments and backorder
  const addAssignmentMutation = useAddFulfillmentAssignment();
  const removeAssignmentMutation = useRemoveFulfillmentAssignment();
  const markManufacturerFulfilledMutation = useMarkManufacturerFulfilled();
  const splitLineItemMutation = useSplitFulfillmentLineItem();
  const cancelBackorderMutation = useCancelBackorderItems();

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

  // Initialize form state when fulfillment order loads
  useEffect(() => {
    if (fulfillmentOrder) {
      setWarehouseId(fulfillmentOrder.warehouseId || '');
      setFulfillmentMethod(fulfillmentOrder.fulfillmentMethod || 'SHIP');
      setShipToName(fulfillmentOrder.shipToAddress?.street || '');
      setShipToAddressLine1(fulfillmentOrder.shipToAddress?.street || '');
      setShipToCity(fulfillmentOrder.shipToAddress?.city || '');
      setShipToState(fulfillmentOrder.shipToAddress?.state || '');
      setShipToPostalCode(fulfillmentOrder.shipToAddress?.postalCode || '');
      setNeedByDate(fulfillmentOrder.needByDate || '');
      setTrackingNumbers(fulfillmentOrder.trackingNumbers?.join(', ') || '');
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

  // Packing state
  const [packingBoxes, setPackingBoxes] = useState<PackingBoxType[]>([
    {
      id: 'box-1',
      packagingType: 'pallet_48x40x6',
      customWeight: '',
      useCustomWeight: false,
      customDimensions: { length: '', width: '', height: '' },
      lineItemIds: [],
    }
  ]);
  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>({});
  const [packingNotes, setPackingNotes] = useState<Record<string, string>>({});
  const [expandedPackingNoteId, setExpandedPackingNoteId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Activity feed state - initialize from fulfillmentOrder.activities if available
  const [activities, setActivities] = useState<FulfillmentActivity[]>(() => {
    return fulfillmentOrder?.activities || [];
  });

  // Modal state
  const [showPackingSlipModal, setShowPackingSlipModal] = useState(false);
  const [showShippingLabelsModal, setShowShippingLabelsModal] = useState(false);
  const [showBOLModal, setShowBOLModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedPackingTemplate, setSelectedPackingTemplate] = useState('standard');
  const [selectedLabelFormat, setSelectedLabelFormat] = useState('4x6');

  // Shipping state
  const [shippingMethod, setShippingMethod] = useState<'SHIP' | 'WILL_CALL'>(fulfillmentOrder?.fulfillmentMethod === 'JOBSITE' ? 'SHIP' : (fulfillmentOrder?.fulfillmentMethod || 'SHIP'));
  const [carrierType, setCarrierType] = useState<'parcel' | 'freight'>((fulfillmentOrder as any)?.carrierType || 'parcel');
  const [selectedCarrier, setSelectedCarrier] = useState(fulfillmentOrder?.carrier || '');
  const [freightClass, setFreightClass] = useState((fulfillmentOrder as any)?.freightClass || '');
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

  // Attached documents state
  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>(fulfillmentOrder?.documents || []);

  // Get backorder items for this order - items with backorderQty > 0
  const backorderItems = useMemo(() => {
    if (!fulfillmentOrder) return [];
    return fulfillmentOrder.lineItems
      .filter(item => item.backorderQty > 0)
      .map(item => ({
        lineItem: item,
        backorderQty: item.backorderQty,
        manufacturerId: '', // Will be populated when we have product->manufacturer mapping
        manufacturerName: 'Manufacturer', // Placeholder
        inventoryOnHand: 0,
      }));
  }, [fulfillmentOrder]);

  // Get pending shipment requests for manufacturers with backorder items
  const pendingShipmentRequests = useMemo(() => {
    if (backorderItems.length === 0) return [];
    const manufacturerIds = [...new Set(backorderItems.map(item => item.manufacturerId))];
    return manufacturerIds.flatMap(id => getPendingShipmentRequestsForManufacturer(id));
  }, [backorderItems]);

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

  // Convert inventory list to a Map for efficient lookup by productId
  const inventoryDataMap = useMemo(() => {
    if (!inventoryList) return undefined;
    const map = new Map<string, Inventory>();
    inventoryList.forEach((inv) => {
      map.set(inv.productId, inv);
    });
    return map;
  }, [inventoryList]);

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
  const addNewBox = () => {
    const newBox: PackingBoxType = {
      id: `box-${packingBoxes.length + 1}`,
      packagingType: 'small_box',
      customWeight: '',
      useCustomWeight: false,
      customDimensions: { length: '', width: '', height: '' },
      lineItemIds: [],
    };
    setPackingBoxes(prev => [...prev, newBox]);
  };

  const removeBox = (boxId: string) => {
    if (packingBoxes.length <= 1) return;
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
    const unassignedIds = getUnassignedItems().map(li => li.id);
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
    } catch (error) {
      console.error('Failed to release to warehouse:', error);
    }
  };

  const handleStartPicking = async () => {
    if (fulfillmentOrder.status !== 'RELEASED') return;
    try {
      await startPickingMutation.mutateAsync(fulfillmentOrder.id);
    } catch (error) {
      console.error('Failed to start picking:', error);
    }
  };

  const handleCompletePicking = async () => {
    if (fulfillmentOrder.status !== 'PICKING') return;
    try {
      await completePickingMutation.mutateAsync(fulfillmentOrder.id);
    } catch (error) {
      console.error('Failed to complete picking:', error);
    }
  };

  const handleCompletePacking = async () => {
    if (fulfillmentOrder.status !== 'PACKING') return;
    try {
      await completePackingMutation.mutateAsync(fulfillmentOrder.id);
    } catch (error) {
      console.error('Failed to complete packing:', error);
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
    } catch (error) {
      console.error('Failed to complete shipping:', error);
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
    updateFulfillmentOrder(fulfillmentOrder.id, {
      status: 'BACKORDER_REVIEW',
      holdReason: `Worker reported shortage: ${expectedQty - actualQty} units short on ${lineItem.partNumber}`,
      backorderReviewData,
      updatedAt: now,
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

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save clicked');
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

  const handleCreateInventoryRequest = (items: { lineItem: FulfillmentOrderLineItem; requestedQty: number }[]) => {
    // Group items by manufacturer
    const byManufacturer = items.reduce((acc, item) => {
      const inv = backorderItems.find(bi => bi.lineItem.id === item.lineItem.id);
      if (inv) {
        const mfrId = inv.manufacturerId;
        if (!acc[mfrId]) {
          acc[mfrId] = { name: inv.manufacturerName, items: [] };
        }
        acc[mfrId].items.push({
          id: `REQLI-${Date.now()}-${item.lineItem.id}`,
          productId: item.lineItem.productId,
          productName: item.lineItem.productName,
          partNumber: item.lineItem.partNumber,
          requestedQuantity: item.requestedQty,
          currentStock: inv.inventoryOnHand,
        });
      }
      return acc;
    }, {} as Record<string, { name: string; items: any[] }>);

    // Create shipment requests for each manufacturer
    Object.entries(byManufacturer).forEach(([mfrId, { name, items: reqItems }]) => {
      addShipmentRequest({
        vendorId: mfrId,
        vendorName: name,
        warehouseId: fulfillmentOrder.warehouseId,
        warehouseName: fulfillmentOrder.warehouseName,
        requestMethod: 'EMAIL',
        status: 'DRAFT',
        priority: 'standard',
        requestedDeliveryDate: fulfillmentOrder.needByDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        items: reqItems,
        totalQuantity: reqItems.reduce((sum, item) => sum + item.requestedQuantity, 0),
        notes: `Created from fulfillment order ${fulfillmentOrder.fulfillmentOrderNumber}`,
        createdBy: 'Current User',
      });
    });

    // Update the fulfillment order to show it's pending delivery
    updateFulfillmentOrder(fulfillmentOrderId, {
      holdReason: 'Pending inventory delivery request',
    });

    setShowRequestInventoryModal(false);
    setForceUpdate(prev => prev + 1);
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

    // Add activity note for email sent
    try {
      await addNoteMutation.mutateAsync({
        fulfillmentOrderId: fulfillmentOrder.id,
        content: `Shipment confirmation email sent to ${emailData.to}`,
      });
    } catch (error) {
      console.error('Failed to add email note:', error);
    }

    setShowShipmentConfirmationModal(false);
  };

  // Document handlers (local state only - documents API not yet implemented)
  const handleAddDocument = (document: Omit<AttachedDocument, 'id'>) => {
    const newDocument: AttachedDocument = {
      ...document,
      id: `DOC-${Date.now()}`,
    };
    setAttachedDocuments(prev => [...prev, newDocument]);
    // TODO: Persist to backend when documents API is implemented
  };

  const handleRemoveDocument = (documentId: string) => {
    const updatedDocs = attachedDocuments.filter(d => d.id !== documentId);
    setAttachedDocuments(updatedDocs);
    // TODO: Persist to backend when documents API is implemented
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
    carrier: fulfillmentOrder?.carrier || selectedCarrier,
    trackingNumbers: fulfillmentOrder?.trackingNumbers?.join(', ') || trackingNumbers,
    shipConfirmedAt: fulfillmentOrder?.shipConfirmedAt,
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
        />

        {/* Status Progress */}
        <StatusProgress
          currentStatus={fulfillmentOrder.status}
          viewingStatus={viewingStatus}
          onStatusClick={handleStatusClick}
          onBackToCurrent={() => setViewingStatus(null)}
        />

        {/* Backorder Notice - Show on PENDING status with backorder items */}
        {(fulfillmentOrder.status === 'PENDING' || fulfillmentOrder.status === 'RELEASED') && backorderItems.length > 0 && (
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
              trackingNumbers={trackingNumbers}
              freightClass={freightClass}
              shipToDifferentFromPO={shipToDifferentFromPO}
              isReleased={isReleased}
              deliveryMethod={shippingMethod}
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
            />
            <AssignmentPanel
              assignedManagers={fulfillmentOrder.assignments?.filter(a => a.role === 'MANAGER') || []}
              assignedWorkers={fulfillmentOrder.assignments?.filter(a => a.role === 'WORKER') || []}
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
              documents={attachedDocuments}
              onAddDocument={handleAddDocument}
              onRemoveDocument={handleRemoveDocument}
              isEditable={!isShipped}
            />

            {/* Activity Feed */}
            <ActivityFeed
              activities={activities as unknown as GenericActivity[]}
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
        attachedDocuments={attachedDocuments}
        carrierType={carrierType}
        carrier={selectedCarrier}
        trackingNumbers={trackingNumbers}
        onClose={() => setShowShipmentConfirmationModal(false)}
        onSend={handleSendShipmentConfirmation}
      />
    </main>
  );
}
