'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  mapDeliveryToShipment,
  type DeliveryApi,
} from '../api';
import {
  useCreateDeliveryAssignee,
  useCreateDeliveryDocument,
  useCreateDeliveryIssue,
  useCreateDeliveryItem,
  useCreateDeliveryItemReceipt,
  useCreateDeliveryStatusHistory,
  useCreateRecurringShipment,
  useDeleteDeliveryAssignee,
  useDeleteDeliveryDocument,
  useDeleteDeliveryItem,
  useUpdateDelivery,
  useUpdateDeliveryItem,
  useWarehouseDelivery,
  useWarehouseLocations,
  useWarehouseLookups,
  useWarehouseMembers,
  useUsersByIds,
  useVendorContacts,
  warehouseDeliveriesQueryKeys,
} from '@/components/warehouse/api/useWarehouseDeliveriesApi';
import { useQueryClient } from '@tanstack/react-query';
import { deleteFile, uploadFile } from '@/components/lib/graphql/files';
import { RecurrencePattern, AssignedUser, AssignedUserRole, DeliveryIssueType, AttachedDocument, IncomingShipment } from '@/lib/types/warehouse';
import RecurringShipmentModal from '../../modals/RecurringShipmentModal';
import { useWarehouse } from '../../WarehouseContext';
import {
  ShipmentStatus,
  shipmentStatusLabels,
} from '@/lib/types/warehouse';
import AddProductModal from './modals/AddProductModal';
import PackingSlipViewerModal from './modals/PackingSlipViewerModal';
import ReceivingHeader from './sections/ReceivingHeader';
import ReceivingSummarySidebar from './sections/ReceivingSummarySidebar';
import LineItemsTable from './sections/LineItemsTable';
import ReceivingInterface from './ReceivingInterface';
import { ReceivingProvider } from './context/ReceivingContext';
import PutAwayInterface from './sections/PutAwayInterface';
import PackingSlipSection from './sections/PackingSlipSection';
import NotesSection from './sections/NotesSection';
import type {
  DeliveryDiscrepancy,
  LineItemReceive,
  PackingSlipDiscrepancy,
  PackingSlipLineItem,
  ScannedPackingSlip,
  WarehouseUser,
  ConditionType,
} from './types';
import { receivingSteps } from './types';

type DeliveryItemReceiptInput = {
  deliveryItemId: string;
  receiptType: 'RECEIPT' | 'ADJUSTMENT' | 'RETURN';
  receivedQuantity: number;
  damagedQuantity: number;
  locationId: string | null;
  receivedById: string | null;
  receivedAt: string | null;
  note: string | null;
};

interface ReceivingDetailContentProps {
  shipmentId: string;
}

export default function ReceivingDetailContent({ shipmentId }: ReceivingDetailContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isWorkerView } = useWarehouse();
  const deliveryQuery = useWarehouseDelivery(shipmentId);
  const { warehousesQuery, carriersQuery, vendorsQuery } = useWarehouseLookups();

  const [shipment, setShipment] = useState<IncomingShipment | null>(null);
  const [isLoadingShipment, setIsLoadingShipment] = useState(true);
  const [shipmentError, setShipmentError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [availableManagers, setAvailableManagers] = useState<WarehouseUser[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<WarehouseUser[]>([]);
  const [resolvedManagers, setResolvedManagers] = useState<AssignedUser[]>([]);
  const [resolvedWorkers, setResolvedWorkers] = useState<AssignedUser[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [carrierOptions, setCarrierOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [vendorOptions, setVendorOptions] = useState<Array<{ id: string; name: string; email?: string | null }>>([]);
  const updateDeliveryMutation = useUpdateDelivery();
  const updateDeliveryItemMutation = useUpdateDeliveryItem();
  const deleteDeliveryItemMutation = useDeleteDeliveryItem();
  const createDeliveryItemMutation = useCreateDeliveryItem();
  const createDeliveryItemReceiptMutation = useCreateDeliveryItemReceipt();
  const createDeliveryStatusHistoryMutation = useCreateDeliveryStatusHistory();
  const createDeliveryDocumentMutation = useCreateDeliveryDocument();
  const deleteDeliveryDocumentMutation = useDeleteDeliveryDocument();
  const createDeliveryAssigneeMutation = useCreateDeliveryAssignee();
  const deleteDeliveryAssigneeMutation = useDeleteDeliveryAssignee();
  const createDeliveryIssueMutation = useCreateDeliveryIssue();
  const createRecurringShipmentMutation = useCreateRecurringShipment();

  // Editable shipment details state
  const [isEditingDetails, setIsEditingDetails] = useState(!isWorkerView); // Start in edit mode for managers
  const [editPoNumber, setEditPoNumber] = useState(shipment?.poNumber || '');
  const [editWarehouseId, setEditWarehouseId] = useState(shipment?.warehouseId || '');
  const [editVendorId, setEditVendorId] = useState(shipment?.vendorId || '');
  const [editCarrier, setEditCarrier] = useState(shipment?.carrier || '');
  const [editTrackingNumber, setEditTrackingNumber] = useState(shipment?.trackingNumber || '');
  const [editEta, setEditEta] = useState(shipment?.eta ? new Date(shipment.eta).toISOString().split('T')[0] : '');
  const [editVendorContact, setEditVendorContact] = useState(shipment?.vendorContact || '');
  const [editVendorEmail, setEditVendorEmail] = useState(shipment?.vendorEmail || '');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const resolvedWarehouseName = warehouseOptions.find((w) => w.id === shipment?.warehouseId)?.name || shipment?.warehouseName || shipment?.warehouseId;
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsEditingDetails(!isWorkerView);
  }, [isWorkerView]);

  const applyShipmentPatch = (
    patch: Partial<IncomingShipment>,
    deliveryPatch?: Partial<DeliveryApi> & { id: string }
  ) => {
    setShipment((prev) => (prev ? { ...prev, ...patch } : prev));
    void deliveryPatch;
  };

  useEffect(() => {
    setShipmentError(null);
    if (deliveryQuery.isLoading) {
      setIsLoadingShipment(true);
      return;
    }
    if (deliveryQuery.error) {
      setShipmentError(deliveryQuery.error.message);
      setIsLoadingShipment(false);
      return;
    }
    if (!deliveryQuery.data) {
      setShipment(null);
      setIsLoadingShipment(false);
      return;
    }
    setShipment(mapDeliveryToShipment(deliveryQuery.data, new Map(), new Map(), new Map()));
    setIsLoadingShipment(false);
  }, [deliveryQuery.data, deliveryQuery.error, deliveryQuery.isLoading]);

  useEffect(() => {
    const warehouses = warehousesQuery.data || [];
    const carriers = carriersQuery.data || [];
    const vendors = vendorsQuery.data || [];

    setWarehouseOptions(warehouses.map((warehouse) => ({ id: warehouse.id, name: warehouse.name })));
    setCarrierOptions(carriers.map((carrier) => ({ id: carrier.id, name: carrier.name })));
    const uniqueVendors = new Map<string, { id: string; name: string; email?: string | null }>();
    vendors.forEach((vendor) => {
      if (!uniqueVendors.has(vendor.id)) {
        uniqueVendors.set(vendor.id, { id: vendor.id, name: vendor.title, email: vendor.email });
      }
    });
    setVendorOptions(Array.from(uniqueVendors.values()));
  }, [warehousesQuery.data, carriersQuery.data, vendorsQuery.data]);

  const refreshShipment = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: warehouseDeliveriesQueryKeys.detail(shipmentId) });
      const refreshed = await deliveryQuery.refetch();
      if (!refreshed.data) {
        setShipment(null);
        return;
      }
      setHasInitialized(false);
      setShipment(mapDeliveryToShipment(refreshed.data, new Map(), new Map(), new Map()));
    } catch (error) {
      console.error('Failed to refresh delivery:', error);
    }
  };

  const membersWarehouseId = editWarehouseId || shipment?.warehouseId;
  const membersQuery = useWarehouseMembers(membersWarehouseId || null, Boolean(membersWarehouseId));
  const locationsQuery = useWarehouseLocations(membersWarehouseId || null, Boolean(membersWarehouseId));
  const memberIds = React.useMemo(() => {
    const ids = new Set<string>();
    (membersQuery.data || []).forEach((member) => ids.add(member.userId));
    (shipment?.assignedManagers || []).forEach((manager) => {
      if (manager.user?.id) ids.add(manager.user.id);
    });
    (shipment?.assignedWorkers || []).forEach((worker) => {
      if (worker.user?.id) ids.add(worker.user.id);
    });
    return Array.from(ids);
  }, [membersQuery.data, shipment?.assignedManagers, shipment?.assignedWorkers]);
  const usersQuery = useUsersByIds(memberIds);

  useEffect(() => {
    if (!membersWarehouseId) {
      setAvailableManagers([]);
      setAvailableWorkers([]);
      setResolvedManagers(shipment?.assignedManagers || []);
      setResolvedWorkers(shipment?.assignedWorkers || []);
      return;
    }

    const members = membersQuery.data || [];
    const users = usersQuery.data || [];
    const userLookup = new Map(
      users.map((user) => [
        user.id,
        {
          name:
            user.fullName ||
            [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
            user.email ||
            user.id,
          email: user.email || '',
        },
      ])
    );

    const normalizeRole = (role: string | number) => {
      if (typeof role === 'number') {
        if (role === 2) return 'MANAGER';
        if (role === 3) return 'WORKER';
        return 'UNKNOWN';
      }
      return role.toUpperCase();
    };

    const managers = members
      .filter((member) => normalizeRole(member.role) === 'MANAGER')
      .map((member) => {
        const userInfo = userLookup.get(member.userId);
        return {
          id: member.userId,
          name: userInfo?.name || member.userId,
          email: userInfo?.email || '',
          role: 'manager' as AssignedUserRole,
          warehouseIds: [membersWarehouseId],
          isActive: true,
        };
      });

    const workers = members
      .filter((member) => normalizeRole(member.role) === 'WORKER')
      .map((member) => {
        const userInfo = userLookup.get(member.userId);
        return {
          id: member.userId,
          name: userInfo?.name || member.userId,
          email: userInfo?.email || '',
          role: 'worker' as AssignedUserRole,
          warehouseIds: [membersWarehouseId],
          isActive: true,
        };
      });

    const assignedManagers = (shipment?.assignedManagers || []).map((manager) => {
      const managerId = manager.user?.id;
      const userInfo = managerId ? userLookup.get(managerId) : undefined;
      return {
        ...manager,
        user: manager.user ? {
          ...manager.user,
          fullName: userInfo?.name || manager.user.fullName,
          email: userInfo?.email || manager.user.email || '',
        } : null,
      };
    });

    const assignedWorkers = (shipment?.assignedWorkers || []).map((worker) => {
      const workerId = worker.user?.id;
      const userInfo = workerId ? userLookup.get(workerId) : undefined;
      return {
        ...worker,
        user: worker.user ? {
          ...worker.user,
          fullName: userInfo?.name || worker.user.fullName,
          email: userInfo?.email || worker.user.email || '',
        } : null,
      };
    });

    setAvailableManagers(managers);
    setAvailableWorkers(workers);
    setResolvedManagers(assignedManagers);
    setResolvedWorkers(assignedWorkers);
  }, [membersWarehouseId, membersQuery.data, usersQuery.data, shipment?.assignedManagers, shipment?.assignedWorkers]);

  useEffect(() => {
    if (!membersWarehouseId) {
      setWarehouseBins([]);
      return;
    }
    const locations = locationsQuery.data || [];
    const bins = locations
      .filter((location) => location.level === 'BIN' && location.isActive)
      .map((location) => ({
        id: location.id,
        letterCode: location.code || location.name,
      }));
    setWarehouseBins(bins);
  }, [membersWarehouseId, locationsQuery.data]);


  // Add expected items state
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Recurring shipment modal state
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const isUuid = (value: string | undefined) =>
    Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));

  const vendorIdForContacts = isUuid(editVendorId)
    ? editVendorId
    : isUuid(shipment?.vendorId)
    ? shipment?.vendorId
    : null;
  const vendorContactsQuery = useVendorContacts(vendorIdForContacts);
  const currentVendorContacts = useMemo(
    () =>
      (vendorContactsQuery.data || [])
        .map((contact) => ({
          name: [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() || contact.email || 'Unknown',
          email: contact.email || '',
        }))
        .filter((contact) => contact.email || contact.name),
    [vendorContactsQuery.data]
  );
  // Show all contacts when input is empty, otherwise filter by input
  const filteredContacts = currentVendorContacts.filter(c =>
    editVendorContact === '' || c.name.toLowerCase().includes(editVendorContact.toLowerCase())
  );
  const filteredEmails = currentVendorContacts.filter(c =>
    editVendorEmail === '' || c.email.toLowerCase().includes(editVendorEmail.toLowerCase())
  );

  // View state for step navigation
  const [viewingStatus, setViewingStatus] = useState<ShipmentStatus | null>(null);

  // Packing Slip capture (replaces BOL focus)
  const [packingSlipImage, setPackingSlipImage] = useState<string | null>(null);
  const [packingSlipFile, setPackingSlipFile] = useState<File | null>(null);
  const [packingSlipCaptured, setPackingSlipCaptured] = useState(false);
  const [packingSlipInputMode, setPackingSlipInputMode] = useState<'scan' | 'manual' | null>(null);
  const [isProcessingPackingSlip, setIsProcessingPackingSlip] = useState(false);
  const [packingSlipLineItems, setPackingSlipLineItems] = useState<PackingSlipLineItem[]>([]);
  const [packingSlipDiscrepancies, setPackingSlipDiscrepancies] = useState<PackingSlipDiscrepancy[]>([]);
  const [isEditingPackingSlip, setIsEditingPackingSlip] = useState(false);
  const [lastManualPackingSlipNotes, setLastManualPackingSlipNotes] = useState<string | null>(null);

  // Scanned packing slip documents
  const [scannedPackingSlips, setScannedPackingSlips] = useState<ScannedPackingSlip[]>([]);
  const [currentPackingSlipId, setCurrentPackingSlipId] = useState<string | null>(null);
  const [viewingPackingSlip, setViewingPackingSlip] = useState<ScannedPackingSlip | null>(null);

  // Attached documents state
  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>(shipment?.documents || []);
  const [baseDocuments, setBaseDocuments] = useState<AttachedDocument[]>([]);

  // Incremental receiving / pallet tracking
  const [currentPalletNumber, setCurrentPalletNumber] = useState(1);
  const [palletSessions, setPalletSessions] = useState<Array<{
    id: string;
    palletNumber: number;
    timestamp: Date;
    items: Array<{ lineItemId: string; quantity: number }>;
  }>>([]);
  const [showSavePalletConfirm, setShowSavePalletConfirm] = useState(false);

  // Voice input state
  const [isRecordingVoice, setIsRecordingVoice] = useState<string | null>(null); // lineItemId currently recording
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Check for voice support on mount
  React.useEffect(() => {
    setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  // Receiving state - track quantities per line item
  const [lineItems, setLineItems] = useState<LineItemReceive[]>([]);
  const [baseLineItems, setBaseLineItems] = useState<LineItemReceive[]>([]);
  const [warehouseBins, setWarehouseBins] = useState<Array<{ id: string; letterCode?: string; currentQuantity?: number; maxCapacity?: number }>>([]);
  const [baseAssignedManagers, setBaseAssignedManagers] = useState<AssignedUser[]>([]);
  const [baseAssignedWorkers, setBaseAssignedWorkers] = useState<AssignedUser[]>([]);

  // Discrepancy reporting
  const [discrepancies, setDiscrepancies] = useState<DeliveryDiscrepancy[]>([]);
  // Collapsed items for detailed entry - all collapsed by default
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());

  const discrepancySummary = React.useMemo(() => {
    const totals = { total: 0, damage: 0, shortage: 0, overage: 0, wrongItem: 0, other: 0 };
    const byItem: Record<string, typeof totals> = {};
    discrepancies.forEach((disc) => {
      totals.total += disc.quantity;
      if (!byItem[disc.lineItemId]) {
        byItem[disc.lineItemId] = { total: 0, damage: 0, shortage: 0, overage: 0, wrongItem: 0, other: 0 };
      }
      const bucket = byItem[disc.lineItemId];
      bucket.total += disc.quantity;
      if (disc.type === 'damage') {
        totals.damage += disc.quantity;
        bucket.damage += disc.quantity;
      } else if (disc.type === 'shortage') {
        totals.shortage += disc.quantity;
        bucket.shortage += disc.quantity;
      } else if (disc.type === 'overage') {
        totals.overage += disc.quantity;
        bucket.overage += disc.quantity;
      } else if (disc.type === 'wrong_item') {
        totals.wrongItem += disc.quantity;
        bucket.wrongItem += disc.quantity;
      } else {
        totals.other += disc.quantity;
        bucket.other += disc.quantity;
      }
    });
    return { totals, byItem };
  }, [discrepancies]);

  const toNumber = (value: number | string | null | undefined) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  useEffect(() => {
    if (!shipment || hasInitialized) return;

    setEditPoNumber(shipment.poNumber);
    setEditWarehouseId(shipment.warehouseId);
    setEditVendorId(shipment.vendorId);
    setEditCarrier(shipment.carrier || '');
    setEditTrackingNumber(shipment.trackingNumber || '');
    setEditEta(shipment.eta ? new Date(shipment.eta).toISOString().split('T')[0] : '');
    setEditVendorContact(shipment.vendorContact || '');
    setEditVendorEmail(shipment.vendorEmail || '');
    setAttachedDocuments(shipment.documents || []);
    setBaseDocuments(shipment.documents || []);
    setLastManualPackingSlipNotes(null);
    const packingSlipDocs = (shipment.documents || []).filter((doc) => doc.type === 'PACKING_SLIP');
    const mappedPackingSlips = packingSlipDocs.map((doc, index) => ({
      id: doc.id,
      name: doc.name || `Packing Slip ${index + 1}`,
      scannedAt: doc.uploadedAt,
      imageUrl: doc.fileUrl,
      fileId: doc.fileId,
      lineItemIds: [],
    }));
    setScannedPackingSlips((prev) => {
      const localOnly = prev.filter((ps) => ps.id.startsWith('PS-'));
      return [...mappedPackingSlips, ...localOnly];
    });
    setPackingSlipCaptured((prev) => mappedPackingSlips.length > 0 || prev);
    if (!packingSlipImage && mappedPackingSlips.length > 0) {
      setPackingSlipImage(mappedPackingSlips[mappedPackingSlips.length - 1]?.imageUrl || null);
    }
    setBaseAssignedManagers(shipment.assignedManagers || []);
    setBaseAssignedWorkers(shipment.assignedWorkers || []);
    setDiscrepancies(
      (shipment.issues || []).map((issue) => ({
        id: issue.id,
        lineItemId: issue.deliveryItemId,
        type: mapIssueTypeToDiscrepancy(issue.issueType),
        quantity: issue.qty,
        description: issue.description || '',
        customType: issue.customIssueType,
      }))
    );

    const initialLineItems = shipment.items.map((item) => {
      const defaultBinId = '';
      const receivedQty = toNumber(item.receivedQuantity);
      const damagedQty = toNumber(item.damagedQuantity);
      const expectedQty = toNumber(item.expectedQuantity);
      const hasProgress = receivedQty > 0 || damagedQty > 0;
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        partNumber: item.partNumber,
        expectedQty,
        receivedQty,
        damagedQty,
        binId: defaultBinId,
        primaryBinId: defaultBinId,
        binAssignments: [],
        showAlternateLocations: false,
        condition: 'good' as ConditionType,
        notes: '',
        lotNumber: '',
        expirationDate: '',
        verified: hasProgress,
        putAway: shipment.status === 'RECEIVED' && hasProgress,
      };
    });
    setLineItems(initialLineItems);
    setBaseLineItems(initialLineItems);

    setCollapsedItems(new Set(shipment.items.map(item => item.id)));
    setHasInitialized(true);
  }, [shipment, hasInitialized]);

  useEffect(() => {
    if (!shipment) return;
    const packingSlipDocs = (shipment.documents || []).filter((doc) => doc.type === 'PACKING_SLIP');
    const mappedPackingSlips = packingSlipDocs
      .map((doc, index) => ({
        id: doc.id,
        name: doc.name || `Packing Slip ${index + 1}`,
        scannedAt: doc.uploadedAt,
        imageUrl: doc.fileUrl,
        fileId: doc.fileId,
        lineItemIds: [],
      }))
      .sort((a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime());

    setScannedPackingSlips((prev) => {
      const localOnly = prev.filter((ps) => ps.id.startsWith('PS-'));
      return [...mappedPackingSlips, ...localOnly];
    });

    if (mappedPackingSlips.length > 0) {
      setPackingSlipCaptured(true);
      if (!packingSlipImage) {
        setPackingSlipImage(mappedPackingSlips[mappedPackingSlips.length - 1]?.imageUrl || null);
      }
    }
  }, [packingSlipImage, shipment]);

  // Search/filter for line items
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  if (isLoadingShipment) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col items-center justify-center p-6">
        <div className="text-center text-[var(--muted-foreground)]">Loading delivery...</div>
      </main>
    );
  }

  if (shipmentError) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Failed to Load Delivery</h1>
          <p className="text-[var(--muted-foreground)] mb-6">{shipmentError}</p>
          <button
            onClick={() => router.push('/warehouse/deliveries')}
            className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-md hover:opacity-90"
          >
            Back to Deliveries
          </button>
        </div>
      </main>
    );
  }

  if (!shipment) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Delivery Not Found</h1>
          <p className="text-[var(--muted-foreground)] mb-4">The requested delivery could not be found.</p>
          <button
            onClick={() => router.push('/warehouse/deliveries')}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Deliveries
          </button>
        </div>
      </main>
    );
  }

  const getStatusStepIndex = (status: ShipmentStatus) => {
    const index = receivingSteps.indexOf(status);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getStatusStepIndex(shipment.status);
  const displayStatus = viewingStatus || shipment.status;
  const isReceiving = displayStatus === 'RECEIVING';
  const shouldDeferPersistence =
    shipment?.status === 'DRAFT' ||
    ['PENDING', 'CONFIRMED'].includes(shipment?.status || '');

  // Helper functions
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isTempId = (value: string) => value.startsWith('temp-');
  const mapIssueTypeToDiscrepancy = (
    issueType: string
  ): 'shortage' | 'overage' | 'damage' | 'wrong_item' | 'other' => {
    switch (issueType.toUpperCase()) {
      case 'DAMAGED':
        return 'damage';
      case 'MISSING':
        return 'shortage';
      case 'OVERAGE':
        return 'overage';
      case 'WRONG_ITEM':
        return 'wrong_item';
      default:
        return 'other';
    }
  };

  const getItemDiscrepancyTotals = (itemId: string) =>
    discrepancySummary.byItem[itemId] || { total: 0, damage: 0, shortage: 0, overage: 0, wrongItem: 0, other: 0 };

  const getItemAdjustedReceived = (item: LineItemReceive) => {
    return Math.max(0, toNumber(item.receivedQty));
  };

  const getItemDamagedTotal = (item: LineItemReceive) => {
    const disc = getItemDiscrepancyTotals(item.id);
    return toNumber(item.damagedQty) + toNumber(disc.damage);
  };

  const getItemAccountedTotal = (item: LineItemReceive) => {
    const disc = getItemDiscrepancyTotals(item.id);
    return (
      getItemAdjustedReceived(item) +
      getItemDamagedTotal(item) +
      toNumber(disc.wrongItem) +
      toNumber(disc.other) +
      toNumber(disc.overage)
    );
  };

  // Calculate totals
    const totalExpected = lineItems.reduce((sum, item) => sum + toNumber(item.expectedQty), 0);
    const totalRawReceived = lineItems.reduce((sum, item) => sum + toNumber(item.receivedQty), 0);
    const totalRawDamaged = lineItems.reduce((sum, item) => sum + toNumber(item.damagedQty), 0);
    const totalIssues = discrepancySummary.totals.total;
    const totalReceived = Math.max(0, totalRawReceived);
    const totalDamaged = totalRawDamaged + toNumber(discrepancySummary.totals.damage);
    const totalVariance =
      totalReceived +
      totalDamaged +
      toNumber(discrepancySummary.totals.wrongItem) +
      toNumber(discrepancySummary.totals.other) +
      toNumber(discrepancySummary.totals.overage) -
      totalExpected;
  const allItemsVerified = lineItems.every(item => item.verified || getItemAccountedTotal(item) >= item.expectedQty);

  // Save shipment details handler
  const handleSaveDetails = () => {
    const selectedVendor = vendorOptions.find((vendor) => vendor.id === editVendorId);
    if (!shipment) return;

    const carrierId =
      carrierOptions.find((carrier) => carrier.name === editCarrier)?.id ||
      null;
    const expectedDate =
      editEta || (shipment.eta ? shipment.eta.split('T')[0] : null);

    updateDeliveryMutation.mutateAsync({
      id: shipment.id,
      input: {
        poNumber: editPoNumber,
        warehouseId: editWarehouseId,
        vendorId: editVendorId,
        carrierId,
        trackingNumber: editTrackingNumber || null,
        status: shipment.status,
        expectedDate,
        arrivedAt: undefined,
        receivingStartedAt: undefined,
        receivedAt: shipment.receivedAt || null,
        originAddressId: null,
        destinationAddressId: null,
        recurringShipmentId: shipment.recurringShipmentId || null,
        vendorContactName: editVendorContact || null,
        vendorContactEmail: editVendorEmail || selectedVendor?.email || null,
        notes: shipment.notes || null,
        updatedById: null,
      },
    })
      .then(() => {
        setEditVendorEmail(editVendorEmail || selectedVendor?.email || '');
        setEditWarehouseId(editWarehouseId || shipment.warehouseId);
        setEditVendorId(editVendorId || shipment.vendorId);
        refreshShipment();
      })
      .catch((error) => {
        console.error('Failed to update delivery details:', error);
      });
  };

  // Expected items handlers
  const handleUpdateExpectedQty = (itemId: string, newQty: number) => {
    if (newQty < 0) return;

    // Update local state
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, expectedQty: newQty } : item
    ));
    if (shouldDeferPersistence) {
      return;
    }
    const lineItem = lineItems.find((item) => item.id === itemId);
    const expectedItem = shipment.expectedItems?.find((item) => item.id === itemId);
    if (!lineItem) return;

    updateDeliveryItemMutation.mutateAsync({
      id: itemId,
      input: {
        deliveryId: shipment.id,
        productId: lineItem.productId,
        expectedQuantity: newQty,
        receivedQuantity: lineItem.receivedQty,
        damagedQuantity: lineItem.damagedQty,
        status: (expectedItem?.status || 'pending').toUpperCase(),
        discrepancyNotes: expectedItem?.discrepancyNotes || null,
      },
    })
      .then(() => refreshShipment())
      .catch((error) => {
        console.error('Failed to update expected quantity:', error);
      });
  };

  const handleRemoveExpectedItem = (itemId: string) => {
    // Update local state
    setLineItems(prev => prev.filter(item => item.id !== itemId));
    if (shouldDeferPersistence) {
      return;
    }
    deleteDeliveryItemMutation.mutateAsync(itemId)
      .then(() => refreshShipment())
      .catch((error) => {
        console.error('Failed to remove expected item:', error);
      });
  };

  const handleAddExpectedItem = (product: { id: string; name: string; partNumber: string }, quantity: number) => {
    if (shouldDeferPersistence) {
      const newItem: LineItemReceive = {
        id: `temp-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        partNumber: product.partNumber,
        expectedQty: quantity,
        receivedQty: 0,
        damagedQty: 0,
        binId: '',
        primaryBinId: '',
        binAssignments: [],
        showAlternateLocations: false,
        condition: 'good' as ConditionType,
        notes: '',
        lotNumber: '',
        expirationDate: '',
        verified: false,
        putAway: false,
      };
      setLineItems(prev => [...prev, newItem]);
      setShowAddProductModal(false);
      return;
    }
    createDeliveryItemMutation.mutateAsync({
      deliveryId: shipment.id,
      productId: product.id,
      expectedQuantity: quantity,
      receivedQuantity: 0,
      damagedQuantity: 0,
      status: 'PENDING',
      discrepancyNotes: null,
    })
      .then(() => refreshShipment())
      .catch((error) => {
        console.error('Failed to add expected item:', error);
      })
      .finally(() => {
        setShowAddProductModal(false);
      });
  };

  const syncPendingChanges = async () => {
    if (!shipment || !shouldDeferPersistence) return;

    const baseItemsById = new Map(baseLineItems.map((item) => [item.id, item]));
    const currentItemsById = new Map(lineItems.map((item) => [item.id, item]));
    const itemsToCreate = lineItems.filter((item) => isTempId(item.id));
    const itemsToDelete = baseLineItems.filter((item) => !currentItemsById.has(item.id));
    const itemsToUpdate = lineItems.filter((item) => {
      if (isTempId(item.id)) return false;
      const baseItem = baseItemsById.get(item.id);
      return baseItem ? baseItem.expectedQty !== item.expectedQty : false;
    });

    const currentDocsById = new Set(attachedDocuments.map((doc) => doc.id));
    const docsToCreate = attachedDocuments.filter((doc) => isTempId(doc.id));
    const docsToDelete = baseDocuments.filter((doc) => !currentDocsById.has(doc.id));

    const baseAssignments = [
      ...baseAssignedManagers.map((assignment) => ({ ...assignment, role: 'manager' as AssignedUserRole })),
      ...baseAssignedWorkers.map((assignment) => ({ ...assignment, role: 'worker' as AssignedUserRole })),
    ];
    const currentAssignments = [
      ...resolvedManagers.map((assignment) => ({ ...assignment, role: 'manager' as AssignedUserRole })),
      ...resolvedWorkers.map((assignment) => ({ ...assignment, role: 'worker' as AssignedUserRole })),
    ];
    const baseAssignmentKeys = new Set(baseAssignments.map((assignment) => `${assignment.user?.id}:${assignment.role}`));
    const currentAssignmentKeys = new Set(currentAssignments.map((assignment) => `${assignment.user?.id}:${assignment.role}`));
    const assignmentsToCreate = currentAssignments.filter(
      (assignment) => !baseAssignmentKeys.has(`${assignment.user?.id}:${assignment.role}`)
    );
    const assignmentsToDelete = baseAssignments.filter(
      (assignment) => !currentAssignmentKeys.has(`${assignment.user?.id}:${assignment.role}`)
    );

    const tasks: Array<Promise<unknown>> = [];

    itemsToCreate.forEach((item) => {
      tasks.push(
        createDeliveryItemMutation.mutateAsync({
          deliveryId: shipment.id,
          productId: item.productId,
          expectedQuantity: item.expectedQty,
          receivedQuantity: item.receivedQty,
          damagedQuantity: item.damagedQty,
          status: 'PENDING',
          discrepancyNotes: null,
        })
      );
    });

    itemsToUpdate.forEach((item) => {
      tasks.push(
        updateDeliveryItemMutation.mutateAsync({
          id: item.id,
          input: {
            deliveryId: shipment.id,
            productId: item.productId,
            expectedQuantity: item.expectedQty,
            receivedQuantity: item.receivedQty,
            damagedQuantity: item.damagedQty,
            status: 'PENDING',
            discrepancyNotes: null,
          },
        })
      );
    });

    itemsToDelete.forEach((item) => {
      tasks.push(deleteDeliveryItemMutation.mutateAsync(item.id));
    });

    docsToCreate.forEach((doc) => {
      tasks.push(
        (async () => {
          let fileId = doc.fileId;

          if (!fileId) {
            if (!doc.file) {
              console.error('Missing file for delivery document upload:', doc);
                return;
              }
              const uploaded = await uploadFile({
                file: doc.file,
                fileName: doc.file.name,
                fileEntityType: 'DELIVERIES',
                folderPath: `/warehouse/deliveries/${shipmentId}`,
              });
              fileId = uploaded.id;
            }
          if (!fileId) {
            console.error('Missing fileId for delivery document:', doc);
            return;
          }
          return createDeliveryDocumentMutation.mutateAsync({
            deliveryId: shipment.id,
            docType: doc.type,
            fileId,
            uploadedById: isUuid(doc.uploadedBy) ? doc.uploadedBy : null,
            notes: doc.notes || null,
          });
        })()
      );
    });

    docsToDelete.forEach((doc) => {
      tasks.push(deleteDeliveryDocumentMutation.mutateAsync(doc.id));
    });

    assignmentsToCreate.forEach((assignment) => {
      if (!assignment.user?.id) return;
      tasks.push(
        createDeliveryAssigneeMutation.mutateAsync({
          deliveryId: shipment.id,
          userId: assignment.user.id,
          role: assignment.role === 'manager' ? 'MANAGER' : 'WORKER',
        })
      );
    });

    assignmentsToDelete.forEach((assignment) => {
      if (!assignment.id || isTempId(assignment.id)) return;
      tasks.push(deleteDeliveryAssigneeMutation.mutateAsync(assignment.id));
    });

    if (tasks.length === 0) return;

    await Promise.all(tasks);
  };

  // Status transition handlers
  const handleReleaseToWarehouse = async () => {
    // From DRAFT -> PENDING (Expected)
    if (!shipment || shipment.status !== 'DRAFT' || isTransitioning) return;
    setIsTransitioning(true);

    const carrierId =
      carrierOptions.find((carrier) => carrier.name === editCarrier)?.id ||
      null;
    const expectedDate =
      editEta || (shipment.eta ? shipment.eta.split('T')[0] : null);
    const nowIso = new Date().toISOString();

    const payload = {
      poNumber: editPoNumber || shipment.poNumber,
      warehouseId: editWarehouseId || shipment.warehouseId,
      vendorId: editVendorId || shipment.vendorId,
      carrierId,
      trackingNumber: editTrackingNumber || null,
      status: 'PENDING',
      expectedDate,
      arrivedAt: undefined,
      receivingStartedAt: undefined,
      receivedAt: undefined,
      originAddressId: null,
      destinationAddressId: null,
      recurringShipmentId: shipment.recurringShipmentId || null,
      vendorContactName: editVendorContact || null,
      vendorContactEmail: editVendorEmail || null,
      notes: shipment.notes || null,
      updatedById: null,
    };

    applyShipmentPatch(
      {
        status: 'PENDING',
        eta: expectedDate || shipment.eta,
        arrivedAt: undefined,
        receivingStartedAt: undefined,
        receivedAt: undefined,
      },
      {
        id: shipment.id,
        status: 'PENDING',
        expectedDate,
        carrierId,
        trackingNumber: editTrackingNumber || null,
        vendorContactName: editVendorContact || null,
        vendorContactEmail: editVendorEmail || null,
        warehouseId: payload.warehouseId,
        vendorId: payload.vendorId,
        poNumber: payload.poNumber,
        updatedAt: nowIso,
      }
    );

    try {
      await syncPendingChanges();
      await updateDeliveryMutation.mutateAsync({ id: shipment.id, input: payload });
      await createDeliveryStatusHistoryMutation.mutateAsync({
        deliveryId: shipment.id,
        status: 'PENDING',
        timestamp: null,
        userId: null,
        note: 'Released to warehouse',
      });
      void refreshShipment();
    } catch (error) {
      console.error('Failed to release delivery:', error);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleMakeRecurring = async (name: string, pattern: RecurrencePattern, startDate: string, endDate?: string) => {
    if (!shipment || isTransitioning) return;
    setIsTransitioning(true);

    const carrierId =
      carrierOptions.find((carrier) => carrier.name === editCarrier)?.id ||
      null;
    const nowIso = new Date().toISOString();

    try {
      await syncPendingChanges();
      const recurrencePattern = {
        ...pattern,
        expectedItems: shipment.expectedItems || [],
      };
      const recurring = await createRecurringShipmentMutation.mutateAsync({
        name,
        vendorId: editVendorId || shipment.vendorId,
        warehouseId: editWarehouseId || shipment.warehouseId,
        recurrencePattern,
        startDate,
        endDate: endDate || null,
        vendorContactName: editVendorContact || null,
        vendorContactEmail: editVendorEmail || null,
        carrier: editCarrier || null,
        notes: shipment.notes || null,
        status: 'ACTIVE',
      });
      applyShipmentPatch(
        {
          status: 'PENDING',
          eta: shipment.eta,
        },
        {
          id: shipment.id,
          status: 'PENDING',
          recurringShipmentId: recurring.id,
          carrierId,
          trackingNumber: shipment.trackingNumber || null,
          vendorContactName: shipment.vendorContact || null,
          vendorContactEmail: shipment.vendorEmail || null,
          expectedDate: shipment.eta ? shipment.eta.split('T')[0] : null,
          updatedAt: nowIso,
        }
      );
      await updateDeliveryMutation.mutateAsync({
        id: shipment.id,
        input: {
          poNumber: shipment.poNumber,
          warehouseId: shipment.warehouseId,
          vendorId: shipment.vendorId,
          carrierId,
          trackingNumber: shipment.trackingNumber || null,
          status: 'PENDING',
          expectedDate: shipment.eta ? shipment.eta.split('T')[0] : null,
          arrivedAt: undefined,
          receivingStartedAt: undefined,
          receivedAt: shipment.receivedAt || null,
          originAddressId: null,
          destinationAddressId: null,
          recurringShipmentId: recurring.id,
          vendorContactName: shipment.vendorContact || null,
          vendorContactEmail: shipment.vendorEmail || null,
          notes: shipment.notes || null,
          updatedById: null,
        },
      });
      await createDeliveryStatusHistoryMutation.mutateAsync({
        deliveryId: shipment.id,
        status: 'PENDING',
        timestamp: null,
        userId: null,
        note: 'Released to warehouse',
      });
      void refreshShipment();
    } catch (error) {
      console.error('Failed to create recurring shipment:', error);
    } finally {
      setShowRecurringModal(false);
      setIsTransitioning(false);
    }
  };

  const handleMarkArrived = async () => {
    // From Expected (PENDING/CONFIRMED) -> ARRIVED
    if (!shipment || !['PENDING', 'CONFIRMED'].includes(shipment.status) || isTransitioning) return;
    setIsTransitioning(true);
    const nowIso = new Date().toISOString();
    applyShipmentPatch(
      {
        status: 'ARRIVED',
        arrivedAt: nowIso,
      },
      {
        id: shipment.id,
        status: 'ARRIVED',
        arrivedAt: nowIso,
        updatedAt: nowIso,
      }
    );
    try {
      await syncPendingChanges();
      await updateDeliveryMutation.mutateAsync({
        id: shipment.id,
        input: {
          poNumber: shipment.poNumber,
          warehouseId: shipment.warehouseId,
          vendorId: shipment.vendorId,
          carrierId: shipment.carrierId || null,
          trackingNumber: shipment.trackingNumber || null,
          status: 'ARRIVED',
          expectedDate: shipment.eta ? shipment.eta.split('T')[0] : null,
          arrivedAt: nowIso,
          receivingStartedAt: undefined,
          receivedAt: shipment.receivedAt || null,
          originAddressId: null,
          destinationAddressId: null,
          recurringShipmentId: shipment.recurringShipmentId || null,
          vendorContactName: shipment.vendorContact || null,
          vendorContactEmail: shipment.vendorEmail || null,
          notes: shipment.notes || null,
          updatedById: null,
        },
      });
      await createDeliveryStatusHistoryMutation.mutateAsync({
        deliveryId: shipment.id,
        status: 'ARRIVED',
        timestamp: null,
        userId: null,
        note: 'Marked arrived',
      });
      void refreshShipment();
    } catch (error) {
      console.error('Failed to mark delivery arrived:', error);
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleStartReceiving = () => {
    if (!shipment || shipment.status !== 'ARRIVED' || isTransitioning) return;
    setIsTransitioning(true);
    const nowIso = new Date().toISOString();
    applyShipmentPatch(
      {
        status: 'RECEIVING',
        receivingStartedAt: nowIso,
      },
      {
        id: shipment.id,
        status: 'RECEIVING',
        receivingStartedAt: nowIso,
        updatedAt: nowIso,
      }
    );
    updateDeliveryMutation.mutateAsync({
      id: shipment.id,
      input: {
        poNumber: shipment.poNumber,
        warehouseId: shipment.warehouseId,
        vendorId: shipment.vendorId,
        carrierId: shipment.carrierId || null,
        trackingNumber: shipment.trackingNumber || null,
        status: 'RECEIVING',
        expectedDate: shipment.eta ? shipment.eta.split('T')[0] : null,
        arrivedAt: shipment.arrivedAt || null,
        receivingStartedAt: nowIso,
        receivedAt: shipment.receivedAt || null,
        originAddressId: null,
        destinationAddressId: null,
        recurringShipmentId: shipment.recurringShipmentId || null,
        vendorContactName: shipment.vendorContact || null,
        vendorContactEmail: shipment.vendorEmail || null,
        notes: shipment.notes || null,
        updatedById: null,
      },
    })
      .then(() =>
        createDeliveryStatusHistoryMutation.mutateAsync({
          deliveryId: shipment.id,
          status: 'RECEIVING',
          timestamp: null,
          userId: null,
          note: 'Receiving started',
        })
      )
      .then(() => void refreshShipment())
      .catch((error) => {
        console.error('Failed to start receiving:', error);
      })
      .finally(() => {
        setIsTransitioning(false);
      });
  };

  const handleCompleteReceiving = async () => {
    if (shipment.status !== 'RECEIVING' || isTransitioning) return;
    setIsTransitioning(true);
    const nowIso = new Date().toISOString();
    applyShipmentPatch(
      {
        status: 'RECEIVED',
        receivedAt: nowIso,
      },
      {
        id: shipment.id,
        status: 'RECEIVED',
        receivedAt: nowIso,
        updatedAt: nowIso,
      }
    );

    const computeLineItemStatus = (item: LineItemReceive) => {
      const disc = getItemDiscrepancyTotals(item.id);
      const adjustedReceived = getItemAdjustedReceived(item);
      const damagedTotal = getItemDamagedTotal(item);
      const accountedTotal = getItemAccountedTotal(item);
      const hasNonShortageIssue =
        damagedTotal > 0 ||
        toNumber(disc.wrongItem) > 0 ||
        toNumber(disc.other) > 0 ||
        toNumber(disc.overage) > 0;
      if (accountedTotal === 0) return 'PENDING';
      if (accountedTotal < item.expectedQty && !hasNonShortageIssue) return 'PARTIAL';
      if (hasNonShortageIssue || accountedTotal > item.expectedQty) return 'DISCREPANCY';
      return 'RECEIVED';
    };

    try {
      const receiptQueue = lineItems.reduce<
        Array<{ input: DeliveryItemReceiptInput; isDamage: boolean }>
      >((acc, item) => {
        const goodQty = Math.max(0, getItemAdjustedReceived(item));
        const damagedTotal = Math.max(0, getItemDamagedTotal(item));
        const baseReceipt = {
          receiptType: 'RECEIPT' as const,
          receivedById: null,
          receivedAt: nowIso,
          note: null,
        };

        if (item.binAssignments.length > 0) {
          item.binAssignments.forEach((assignment) => {
            if (assignment.quantity <= 0) return;
            acc.push({
              input: {
                deliveryItemId: item.id,
                receivedQuantity: assignment.quantity,
                damagedQuantity: 0,
                locationId: assignment.binId || null,
                ...baseReceipt,
              },
              isDamage: false,
            });
          });
        } else if (goodQty > 0) {
          acc.push({
            input: {
              deliveryItemId: item.id,
              receivedQuantity: goodQty,
              damagedQuantity: 0,
              locationId: item.binId || item.primaryBinId || null,
              ...baseReceipt,
            },
            isDamage: false,
          });
        }

        if (damagedTotal > 0) {
          acc.push({
            input: {
              deliveryItemId: item.id,
              receivedQuantity: 0,
              damagedQuantity: damagedTotal,
              locationId: null,
              ...baseReceipt,
            },
            isDamage: true,
          });
        }

        return acc;
      }, []);

      await Promise.all(
        lineItems.map((item) =>
          updateDeliveryItemMutation.mutateAsync({
            id: item.id,
            input: {
              deliveryId: shipment.id,
              productId: item.productId,
              expectedQuantity: item.expectedQty,
              receivedQuantity: item.receivedQty,
              damagedQuantity: Math.max(0, getItemDamagedTotal(item)),
              status: computeLineItemStatus(item),
              discrepancyNotes: null,
            },
          })
        )
      );

      const receiptIdByItem = new Map<string, { any?: string; damage?: string }>();
      if (receiptQueue.length > 0) {
        const createdReceipts = await Promise.all(
          receiptQueue.map(({ input }) => createDeliveryItemReceiptMutation.mutateAsync(input))
        );
        createdReceipts.forEach((receipt, index) => {
          const queueEntry = receiptQueue[index];
          const entry = receiptIdByItem.get(receipt.deliveryItemId) || {};
          if (queueEntry?.isDamage) {
            entry.damage = receipt.id;
          }
          if (!entry.any) {
            entry.any = receipt.id;
          }
          receiptIdByItem.set(receipt.deliveryItemId, entry);
        });
      }

      if (discrepancies.length > 0) {
        const mapDiscrepancyType = (type: 'shortage' | 'overage' | 'damage' | 'wrong_item' | 'other'): DeliveryIssueType => {
          switch (type) {
            case 'damage':
              return 'DAMAGED';
            case 'shortage':
              return 'MISSING';
            case 'overage':
              return 'OVERAGE';
            case 'wrong_item':
              return 'WRONG_ITEM';
            case 'other':
              return 'OTHER';
            default:
              return 'DAMAGED';
          }
        };

        await Promise.all(
          discrepancies.map((disc) => {
            const receiptEntry = receiptIdByItem.get(disc.lineItemId);
            const receiptId =
              disc.type === 'damage'
                ? receiptEntry?.damage || receiptEntry?.any || null
                : receiptEntry?.any || null;
            return createDeliveryIssueMutation.mutateAsync({
              deliveryId: shipment.id,
              deliveryItemId: disc.lineItemId,
              receiptId,
              issueType: mapDiscrepancyType(disc.type),
              customIssueType: disc.type === 'other' ? disc.customType : null,
              quantity: disc.quantity,
              status: 'OPEN',
              description: disc.description || null,
              notes: null,
              communicatedAt: undefined,
            });
          })
        );
      }

      await updateDeliveryMutation.mutateAsync({
        id: shipment.id,
        input: {
          poNumber: shipment.poNumber,
          warehouseId: shipment.warehouseId,
          vendorId: shipment.vendorId,
          carrierId: shipment.carrierId || null,
          trackingNumber: shipment.trackingNumber || null,
          status: 'RECEIVED',
          expectedDate: shipment.eta ? shipment.eta.split('T')[0] : null,
          arrivedAt: shipment.arrivedAt || null,
          receivingStartedAt: shipment.receivingStartedAt || null,
          receivedAt: nowIso,
          originAddressId: null,
          destinationAddressId: null,
          recurringShipmentId: shipment.recurringShipmentId || null,
          vendorContactName: shipment.vendorContact || null,
          vendorContactEmail: shipment.vendorEmail || null,
          notes: shipment.notes || null,
          updatedById: null,
        },
      });

      await createDeliveryStatusHistoryMutation.mutateAsync({
        deliveryId: shipment.id,
        status: 'RECEIVED',
        timestamp: null,
        userId: null,
        note: 'Receiving completed',
      });
      void refreshShipment();
    } catch (error) {
      console.error('Failed to complete receiving:', error);
    } finally {
      setIsTransitioning(false);
    }
  };

  // Line item handlers
  const handleUpdateLineItem = (itemId: string, updates: Partial<LineItemReceive>) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const handleVerifyItem = (itemId: string) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, verified: true } : item
    ));
  };

  const handleUnverifyItem = (itemId: string) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, verified: false } : item
    ));
  };

  const handleReceiveAll = (itemId: string, expectedQty: number) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, receivedQty: expectedQty, verified: true, packingSlipId: currentPackingSlipId || undefined } : item
    ));
    // Link item to current packing slip
    if (currentPackingSlipId) {
      setScannedPackingSlips(prev => prev.map(ps =>
        ps.id === currentPackingSlipId ? { ...ps, lineItemIds: [...ps.lineItemIds, itemId] } : ps
      ));
    }
  };

  const handlePutAway = (itemId: string) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, putAway: true } : item
    ));
  };

  // Packing Slip handlers
  const handlePackingSlipImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store delivery context for returning after AI processing
      if (shipment) {
        sessionStorage.setItem('warehouse_delivery_return', JSON.stringify({
          deliveryId: shipment.id,
          returnPath: `/warehouse/deliveries/${shipment.id}`,
        }));
      }
      // Navigate to AI uploader with deliveries type pre-selected
      router.push('/flow-ai/upload?type=deliveries&source=packing_slip');
    }
  };

  const handleCameraCapture = () => {
    // Store delivery context for returning after AI processing
    if (shipment) {
      sessionStorage.setItem('warehouse_delivery_return', JSON.stringify({
        deliveryId: shipment.id,
        returnPath: `/warehouse/deliveries/${shipment.id}`,
      }));
    }

    // Open camera capture, then navigate to AI uploader
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = () => {
      router.push('/flow-ai/upload?type=deliveries&source=packing_slip');
    };
    input.click();
  };

  const processPackingSlipImage = async (file?: File) => {
    setIsProcessingPackingSlip(true);
    const newPackingSlipId = `PS-${Date.now()}`;
    const newPackingSlip: ScannedPackingSlip = {
      id: newPackingSlipId,
      name: `Packing Slip ${scannedPackingSlips.length + 1}`,
      scannedAt: new Date().toISOString(),
      imageUrl: packingSlipImage || '',
      fileId: undefined,
      lineItemIds: [],
    };
    setScannedPackingSlips(prev => [...prev, newPackingSlip]);
    setCurrentPackingSlipId(newPackingSlipId);
    if (file && shipment) {
      const created = await handleAddDocument({
        name: `Packing Slip ${new Date().toLocaleDateString()}`,
        type: 'PACKING_SLIP',
        fileUrl: '',
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        file,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Packing Slip Capture',
        notes: 'Captured from Arrived workflow.',
      });
      if (created?.id) {
        setScannedPackingSlips((prev) =>
          prev.map((ps) =>
            ps.id === newPackingSlipId
              ? {
                  ...ps,
                  id: created.id,
                  name: created.name || ps.name,
                  scannedAt: created.uploadedAt || ps.scannedAt,
                  imageUrl: created.fileUrl || ps.imageUrl,
                  fileId: created.fileId,
                }
              : ps
          )
        );
        setLineItems((prev) =>
          prev.map((item) =>
            item.packingSlipId === newPackingSlipId ? { ...item, packingSlipId: created.id } : item
          )
        );
        setCurrentPackingSlipId(created.id);
      }
    }
    setIsProcessingPackingSlip(false);
    setPackingSlipCaptured(true);
  };

  const handleAddPackingSlipLine = () => {
    setPackingSlipLineItems(prev => [...prev, {
      id: `PS-${Date.now()}`,
      partNumber: '',
      description: '',
      quantity: 0,
      matched: false,
    }]);
  };

  const handleClearPackingSlip = () => {
    setPackingSlipImage(null);
    setPackingSlipFile(null);
    setPackingSlipInputMode(null);
    setPackingSlipLineItems([]);
    setPackingSlipCaptured(false);
    setPackingSlipDiscrepancies([]);
    setCurrentPackingSlipId(null);
  };

  const latestPackingSlip = scannedPackingSlips[scannedPackingSlips.length - 1];
  const latestPersistedPackingSlip = [...scannedPackingSlips]
    .filter((ps) => !ps.id.startsWith('PS-'))
    .pop();

  const handleEditPackingSlip = async () => {
    if (isEditingPackingSlip) return;
    setIsEditingPackingSlip(true);
    const resetPackingSlipState = () => {
      setPackingSlipCaptured(false);
      setPackingSlipImage(null);
      setPackingSlipFile(null);
      setPackingSlipInputMode(null);
      setPackingSlipLineItems([]);
      setPackingSlipDiscrepancies([]);
      setCurrentPackingSlipId(null);
    };

    if (latestPersistedPackingSlip && shipment) {
      try {
        const removedId = latestPersistedPackingSlip.id;
        const fileId = latestPersistedPackingSlip.fileId || null;
        await deleteDeliveryDocumentMutation.mutateAsync(removedId);
        if (fileId) {
          await deleteFile(fileId);
        }
        applyShipmentPatch({
          documents: (shipment.documents || []).filter((doc) => doc.id !== removedId),
        });
        setAttachedDocuments((prev) => prev.filter((doc) => doc.id !== removedId));
        setScannedPackingSlips((prev) => prev.filter((ps) => ps.id !== removedId));
        setLineItems((prev) =>
          prev.map((item) =>
            item.packingSlipId === removedId ? { ...item, packingSlipId: undefined } : item
          )
        );
        resetPackingSlipState();
        void refreshShipment();
      } catch (error) {
        console.error('Failed to remove packing slip document:', error);
      } finally {
        setIsEditingPackingSlip(false);
      }
      return;
    }

    if (latestPackingSlip) {
      const removedId = latestPackingSlip.id;
      setScannedPackingSlips((prev) => prev.filter((ps) => ps.id !== latestPackingSlip.id));
      setLineItems((prev) =>
        prev.map((item) =>
          item.packingSlipId === removedId ? { ...item, packingSlipId: undefined } : item
        )
      );
    }
    if (shipment && lastManualPackingSlipNotes && shipment.notes?.includes(lastManualPackingSlipNotes)) {
      const trimmedNotes = shipment.notes.replace(`\n\n${lastManualPackingSlipNotes}`, '').trim();
      await updateDeliveryMutation.mutateAsync({
        id: shipment.id,
        input: {
          poNumber: shipment.poNumber,
          warehouseId: shipment.warehouseId,
          vendorId: shipment.vendorId,
          status: shipment.status,
          expectedDate: shipment.eta ? shipment.eta.split('T')[0] : null,
          carrierId: shipment.carrierId || null,
          trackingNumber: shipment.trackingNumber || null,
          recurringShipmentId: shipment.recurringShipmentId || null,
          vendorContactName: shipment.vendorContact || null,
          vendorContactEmail: shipment.vendorEmail || null,
          notes: trimmedNotes || null,
          updatedById: null,
        },
      });
      applyShipmentPatch({ notes: trimmedNotes || undefined });
      setLastManualPackingSlipNotes(null);
    }
    resetPackingSlipState();
    setIsEditingPackingSlip(false);
  };

  const formatPackingSlipNotes = (lines: PackingSlipLineItem[]) => {
    const cleaned = lines.filter((line) => line.partNumber || line.description);
    if (cleaned.length === 0) return null;
    const header = `Packing Slip (manual) - ${new Date().toLocaleString()}`;
    const rows = cleaned
      .map((line) => `- ${line.partNumber || 'N/A'} | ${line.description || 'N/A'} | qty: ${line.quantity}`)
      .join('\n');
    return `${header}\n${rows}`;
  };

  const persistPackingSlipNotes = async (lines: PackingSlipLineItem[]) => {
    if (!shipment) return;
    const notesPayload = formatPackingSlipNotes(lines);
    if (!notesPayload) return;
    const nextNotes = shipment.notes ? `${shipment.notes}\n\n${notesPayload}` : notesPayload;
    await updateDeliveryMutation.mutateAsync({
      id: shipment.id,
      input: {
        poNumber: shipment.poNumber,
        warehouseId: shipment.warehouseId,
        vendorId: shipment.vendorId,
        status: shipment.status,
        expectedDate: shipment.eta ? shipment.eta.split('T')[0] : null,
        carrierId: shipment.carrierId || null,
        trackingNumber: shipment.trackingNumber || null,
        recurringShipmentId: shipment.recurringShipmentId || null,
        vendorContactName: shipment.vendorContact || null,
        vendorContactEmail: shipment.vendorEmail || null,
        notes: nextNotes,
        updatedById: null,
      },
    });
    setLastManualPackingSlipNotes(notesPayload);
    applyShipmentPatch({ notes: nextNotes });
  };

  // Incremental receiving / pallet handlers
  const handleSavePallet = () => {
    const itemsOnPallet = lineItems
      .filter(li => li.receivedQty > 0 && !li.verified)
      .map(li => ({ lineItemId: li.id, quantity: li.receivedQty }));

    if (itemsOnPallet.length > 0) {
      setPalletSessions(prev => [...prev, {
        id: `PALLET-${Date.now()}`,
        palletNumber: currentPalletNumber,
        timestamp: new Date(),
        items: itemsOnPallet,
      }]);
      setCurrentPalletNumber(prev => prev + 1);
      setShowSavePalletConfirm(false);
    }
  };

  // Voice input handler
  const handleVoiceInput = (lineItemId: string) => {
    if (!voiceSupported) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecordingVoice(lineItemId);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setLineItems(prev => prev.map(item =>
        item.id === lineItemId ? { ...item, notes: item.notes ? `${item.notes} ${transcript}` : transcript } : item
      ));
    };

    recognition.onerror = () => {
      setIsRecordingVoice(null);
    };

    recognition.onend = () => {
      setIsRecordingVoice(null);
    };

    recognition.start();
  };

  // Put-away helpers
  const getEmptyBins = () => warehouseBins.filter(bin => (bin.currentQuantity ?? 0) === 0);
  const isNonPrimaryBin = (lineItem: LineItemReceive) => lineItem.binId !== lineItem.primaryBinId;

  const handleOneClickPutAway = (itemId: string) => {
    // One-click confirm for primary bin
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, verified: true, putAway: true } : item
    ));
  };

  // Document handlers
  const handleAddDocument = async (document: Omit<AttachedDocument, 'id'>) => {
    if (shouldDeferPersistence) {
      const newDocument: AttachedDocument = {
        id: `temp-${Date.now()}`,
        ...document,
      };
      setAttachedDocuments((prev) => [...prev, newDocument]);
      return null;
    }
    try {
      let fileUrl = document.fileUrl;
      let mimeType = document.mimeType;
      let fileSize = document.fileSize;
      let name = document.name;
      let fileId = document.fileId;

        if (!fileId) {
          if (!document.file) {
            console.error('Missing file for delivery document upload:', document);
            return;
          }
          const uploaded = await uploadFile({
            file: document.file,
            fileName: document.file.name,
            fileEntityType: 'DELIVERIES',
            folderPath: `/warehouse/deliveries/${shipmentId}`,
          });
          fileUrl = uploaded.filePath;
          mimeType = uploaded.fileType || document.file.type || 'application/octet-stream';
          fileSize = uploaded.fileSize || document.file.size;
          name = uploaded.fileName;
          fileId = uploaded.id;
        }
      if (!fileId) {
        console.error('Missing fileId for delivery document:', document);
        return null;
      }
      const created = await createDeliveryDocumentMutation.mutateAsync({
        deliveryId: shipment.id,
        docType: document.type,
        fileId,
        uploadedById: isUuid(document.uploadedBy) ? document.uploadedBy : null,
        notes: document.notes || null,
      });
      void refreshShipment();
      return {
        id: created.id,
        fileId,
        fileUrl,
        name,
        uploadedAt: document.uploadedAt,
      };
    } catch (error) {
      console.error('Failed to add delivery document:', error);
      return null;
    }
  };

  const handleRemoveDocument = (documentId: string) => {
    if (shouldDeferPersistence) {
      setAttachedDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      return;
    }
    deleteDeliveryDocumentMutation.mutateAsync(documentId)
      .then(() => refreshShipment())
      .catch((error) => {
        console.error('Failed to remove delivery document:', error);
      });
  };

  const handleAddAssignment = async (userId: string, role: AssignedUserRole) => {
    if (role !== 'manager' && role !== 'worker') {
      console.warn('Unsupported assignment role for receiving:', role);
      return;
    }
    if (shouldDeferPersistence) {
      const userPool = role === 'manager' ? availableManagers : availableWorkers;
      const userInfo = userPool.find((user) => user.id === userId);
      const newAssignment: AssignedUser = {
        id: `temp-${Date.now()}`,
        user: {
          id: userId,
          fullName: userInfo?.name || userId,
          email: userInfo?.email || '',
        },
        role,
        createdAt: new Date().toISOString(),
      };
      if (role === 'manager') {
        setResolvedManagers((prev) =>
          prev.some((assignment) => assignment.user?.id === userId) ? prev : [...prev, newAssignment]
        );
      } else {
        setResolvedWorkers((prev) =>
          prev.some((assignment) => assignment.user?.id === userId) ? prev : [...prev, newAssignment]
        );
      }
      return;
    }
    const rolePayload = role === 'manager' ? 'MANAGER' : 'WORKER';
    await createDeliveryAssigneeMutation.mutateAsync({
      deliveryId: shipmentId,
      userId,
      role: rolePayload,
    });
    await refreshShipment();
  };

  const handleRemoveAssignment = async (assignmentId: string, role: AssignedUserRole) => {
    void role;
    if (shouldDeferPersistence) {
      setResolvedManagers((prev) => prev.filter((assignment) => assignment.id !== assignmentId));
      setResolvedWorkers((prev) => prev.filter((assignment) => assignment.id !== assignmentId));
      return;
    }
    await deleteDeliveryAssigneeMutation.mutateAsync(assignmentId);
    await refreshShipment();
  };

  // Receiving Interface Component
  const receivingInterface = (
    <ReceivingProvider
      lineItems={lineItems}
      warehouseBins={warehouseBins}
      onCompleteReceiving={handleCompleteReceiving}
      onCameraCapture={handleCameraCapture}
      onPackingSlipImageUpload={handlePackingSlipImageUpload}
      onClearPackingSlip={handleClearPackingSlip}
      setLineItems={setLineItems}
      setDiscrepancies={setDiscrepancies}
      setPackingSlipInputMode={setPackingSlipInputMode}
      setViewingPackingSlip={setViewingPackingSlip}
      isTransitioning={isTransitioning}
      packingSlipCaptured={packingSlipCaptured}
      packingSlipLineItems={packingSlipLineItems}
      isProcessingPackingSlip={isProcessingPackingSlip}
      scannedPackingSlips={scannedPackingSlips}
      palletSessions={palletSessions}
      currentPalletNumber={currentPalletNumber}
      discrepancies={discrepancies}
    >
      <ReceivingInterface />
    </ReceivingProvider>
  );
  // Put-Away Interface Component
  const putAwayInterface = (
    <PutAwayInterface
      lineItems={lineItems}
      warehouseBins={warehouseBins}
      onPutAway={handlePutAway}
    />
  );

  // Line Items Summary Table
  const currentVendorId = editVendorId || shipment.vendorId;
  const hasVendorSelected = Boolean(currentVendorId);

  const lineItemsTable = (
    <LineItemsTable
      lineItems={lineItems}
      totalExpected={totalExpected}
      isEditingDetails={isEditingDetails}
      hasVendorSelected={hasVendorSelected}
        onAddProductClick={() => setShowAddProductModal(true)}
        onUpdateExpectedQty={handleUpdateExpectedQty}
        onRemoveExpectedItem={handleRemoveExpectedItem}
        getItemAdjustedReceived={getItemAdjustedReceived}
        getItemDamagedTotal={getItemDamagedTotal}
        getItemAccountedTotal={getItemAccountedTotal}
        getItemDiscrepancyTotals={getItemDiscrepancyTotals}
      />
  );

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      <div className="max-w-[1400px] mx-auto p-6">
        <ReceivingHeader
          shipment={shipment}
          onBack={() => router.push('/warehouse/deliveries')}
          onReleaseToWarehouse={handleReleaseToWarehouse}
          onMarkArrived={handleMarkArrived}
          onStartReceiving={handleStartReceiving}
          onCompleteReceiving={handleCompleteReceiving}
          isTransitioning={isTransitioning}
          allItemsVerified={allItemsVerified}
          formatDate={formatDate}
        />

        {/* Draft Notice Banner */}
        {shipment.status === 'DRAFT' && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-800">Draft Delivery</h4>
                <p className="text-xs text-slate-600">This delivery is not visible to warehouse workers. Fill in the details and release when ready.</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-3">
              <button
                onClick={handleReleaseToWarehouse}
                disabled={isTransitioning}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                  isTransitioning ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {isTransitioning ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Release to Warehouse
                  </>
                )}
              </button>
              <button
                onClick={() => setShowRecurringModal(true)}
                disabled={isTransitioning}
                className={`px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                  isTransitioning ? 'opacity-60 cursor-not-allowed' : 'hover:bg-purple-700'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 1l4 4-4 4"/>
                  <path d="M3 11V9a4 4 0 014-4h14"/>
                  <path d="M7 23l-4-4 4-4"/>
                  <path d="M21 13v2a4 4 0 01-4 4H3"/>
                </svg>
                Make Recurring
              </button>
            </div>
          </div>
        )}

        {/* Status Progress - Compact & Clickable */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 mb-4">
          {viewingStatus && viewingStatus !== shipment.status && (
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border)]">
              <span className="text-xs text-[var(--muted-foreground)]">
                Viewing: <span className="font-medium text-[var(--foreground)]">{shipmentStatusLabels[viewingStatus]}</span>
                <span className="mx-2">·</span>
                Actual status: <span className="font-medium text-[var(--primary)]">{shipmentStatusLabels[shipment.status]}</span>
              </span>
              <button
                onClick={() => setViewingStatus(null)}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                Back to current
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            {receivingSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isViewing = viewingStatus === step;

              return (
                <React.Fragment key={step}>
                  <button
                    onClick={() => setViewingStatus(step === shipment.status ? null : step)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium relative ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                      }`}
                    >
                      {isCompleted ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        index + 1
                      )}
                      {isViewing && !isCurrent && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <span className={`text-xs ${
                      isViewing && !isCurrent
                        ? 'text-amber-600 font-medium'
                        : isCurrent
                          ? 'text-[var(--primary)] font-medium'
                          : 'text-[var(--muted-foreground)]'
                    }`}>
                      {shipmentStatusLabels[step]}
                    </span>
                  </button>
                  {index < receivingSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-[var(--muted)]'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {(() => {
          const canViewPackingSlip =
            (packingSlipImage && packingSlipImage.startsWith('data:')) ||
            Boolean(latestPersistedPackingSlip?.fileId || latestPersistedPackingSlip?.imageUrl);

          return (
            <PackingSlipSection
              displayStatus={displayStatus}
              packingSlipCaptured={packingSlipCaptured}
              packingSlipInputMode={packingSlipInputMode}
              packingSlipImage={packingSlipImage}
              isProcessingPackingSlip={isProcessingPackingSlip}
              isEditingPackingSlip={isEditingPackingSlip}
              packingSlipLineItems={packingSlipLineItems}
              packingSlipDiscrepancies={packingSlipDiscrepancies}
              onCameraCapture={handleCameraCapture}
              onImageUpload={handlePackingSlipImageUpload}
              onClearPackingSlip={handleClearPackingSlip}
              onViewPackingSlip={
                canViewPackingSlip
                  ? () => {
                      if (latestPersistedPackingSlip || latestPackingSlip) {
                        setViewingPackingSlip(latestPersistedPackingSlip || latestPackingSlip);
                      }
                    }
                  : undefined
              }
              onEditPackingSlip={handleEditPackingSlip}
              setPackingSlipInputMode={setPackingSlipInputMode}
              setPackingSlipCaptured={setPackingSlipCaptured}
              setPackingSlipLineItems={setPackingSlipLineItems}
              setPackingSlipDiscrepancies={setPackingSlipDiscrepancies}
              onAddPackingSlipLine={handleAddPackingSlipLine}
              onConfirmManualPackingSlip={persistPackingSlipNotes}
            />
          );
        })()}

        {/* Receiving Interface - Show when status is RECEIVING */}
        {isReceiving && (
          <div className="mb-4">
            {receivingInterface}
          </div>
        )}

        {/* Put-Away Interface - Show items that are verified but not put away */}
        {isReceiving && lineItems.some(li => li.verified && !li.putAway) && (
          <div className="mb-4">
            {putAwayInterface}
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Left Column - Shipment Details */}
          <div className="col-span-2 space-y-4">
            {/* Shipment Info Row */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Warehouse</label>
                  {isEditingDetails ? (
                    <select
                      value={editWarehouseId}
                      onChange={(e) => setEditWarehouseId(e.target.value)}
                      onBlur={handleSaveDetails}
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    >
                      {warehouseOptions.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-[var(--foreground)]">{resolvedWarehouseName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Carrier</label>
                  {isEditingDetails ? (
                    <select
                      value={editCarrier}
                      onChange={(e) => setEditCarrier(e.target.value)}
                      onBlur={handleSaveDetails}
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    >
                      <option value="">Select carrier</option>
                      {carrierOptions.map((carrier) => (
                        <option key={carrier.id} value={carrier.name}>{carrier.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-[var(--foreground)]">{shipment.carrier || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Tracking #</label>
                  {isEditingDetails ? (
                    <input
                      type="text"
                      value={editTrackingNumber}
                      onChange={(e) => setEditTrackingNumber(e.target.value)}
                      onBlur={handleSaveDetails}
                      placeholder="Enter tracking number"
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                  ) : shipment.trackingNumber ? (
                    <a
                      href={`https://www.ups.com/track?tracknum=${shipment.trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {shipment.trackingNumber}
                    </a>
                  ) : (
                    <p className="text-sm text-[var(--muted-foreground)]">-</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Expected Date</label>
                  {isEditingDetails ? (
                    <input
                      type="date"
                      value={editEta}
                      onChange={(e) => setEditEta(e.target.value)}
                      onBlur={handleSaveDetails}
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                  ) : (
                    <p className="text-sm font-medium text-[var(--foreground)]">{formatDate(shipment.eta)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor Info */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Vendor</label>
                  {isEditingDetails ? (
                    <select
                      value={editVendorId}
                      onChange={(e) => setEditVendorId(e.target.value)}
                      onBlur={handleSaveDetails}
                      className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    >
                      <option value="">Select vendor</option>
                      {vendorOptions.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-[var(--foreground)]">{shipment.vendorName || '-'}</p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Contact</label>
                  {isEditingDetails ? (
                    <div className="relative">
                      <div className="relative">
                        <input
                          type="text"
                          value={editVendorContact}
                          onChange={(e) => setEditVendorContact(e.target.value)}
                          onFocus={() => setShowContactDropdown(true)}
                          onBlur={() => {
                            setTimeout(() => setShowContactDropdown(false), 200);
                            handleSaveDetails();
                          }}
                          placeholder={currentVendorContacts.length > 0 ? "Search or enter contact name" : "Enter contact name"}
                          className="w-full pl-2 pr-8 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                        {currentVendorContacts.length > 0 && (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShowContactDropdown(!showContactDropdown);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </button>
                        )}
                      </div>
                      {showContactDropdown && filteredContacts.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {filteredContacts.map((contact, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setEditVendorContact(contact.name);
                                setEditVendorEmail(contact.email);
                                setShowContactDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                            >
                              <div className="font-medium text-[var(--foreground)]">{contact.name}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">{contact.email}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--foreground)]">{shipment.vendorContact || '-'}</p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Email</label>
                  {isEditingDetails ? (
                    <div className="relative">
                      <div className="relative">
                        <input
                          type="email"
                          value={editVendorEmail}
                          onChange={(e) => setEditVendorEmail(e.target.value)}
                          onFocus={() => setShowEmailDropdown(true)}
                          onBlur={() => {
                            setTimeout(() => setShowEmailDropdown(false), 200);
                            handleSaveDetails();
                          }}
                          placeholder={currentVendorContacts.length > 0 ? "Search or enter email" : "Enter email address"}
                          className="w-full pl-2 pr-8 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                        {currentVendorContacts.length > 0 && (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShowEmailDropdown(!showEmailDropdown);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </button>
                        )}
                      </div>
                      {showEmailDropdown && filteredEmails.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {filteredEmails.map((contact, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setEditVendorContact(contact.name);
                                setEditVendorEmail(contact.email);
                                setShowEmailDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                            >
                              <div className="font-medium text-[var(--foreground)]">{contact.email}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">{contact.name}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--foreground)]">{shipment.vendorEmail || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Scanned Documents */}
            {scannedPackingSlips.length > 0 && (
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Scanned Documents</h3>
                  <span className="ml-auto text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    {scannedPackingSlips.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {scannedPackingSlips.map((ps) => (
                    <button
                      key={ps.id}
                      onClick={() => setViewingPackingSlip(ps)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-left"
                    >
                      <div className="w-8 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <path d="M14 2v6h6"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">{ps.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {new Date(ps.scannedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {ps.lineItemIds.length > 0 && ` - ${ps.lineItemIds.length} items`}
                        </p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Line Items Table - Now in left column */}
            {lineItemsTable}
          </div>

          <ReceivingSummarySidebar
            totalExpected={totalExpected}
            totalReceived={totalReceived}
            totalDamaged={totalDamaged}
            totalVariance={totalVariance}
            shipment={shipment}
            formatDateTime={formatDateTime}
            discrepancies={discrepancies}
            resolvedManagers={resolvedManagers}
            resolvedWorkers={resolvedWorkers}
            availableManagers={availableManagers}
            availableWorkers={availableWorkers}
            onAddAssignment={handleAddAssignment}
            onRemoveAssignment={handleRemoveAssignment}
            attachedDocuments={attachedDocuments}
            onAddDocument={async (doc) => { await handleAddDocument(doc); }}
            onRemoveDocument={handleRemoveDocument}
            isEditable={!isWorkerView && shipment.status !== 'RECEIVED' && shipment.status !== 'CANCELLED'}
          />
        </div>

        <NotesSection notes={shipment.notes} />
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <AddProductModal
          vendorId={editVendorId || shipment.vendorId}
          onClose={() => setShowAddProductModal(false)}
          onAddProduct={handleAddExpectedItem}
          existingProductIds={lineItems.map(li => li.productId)}
        />
      )}

      {/* Recurring Shipment Modal */}
      {showRecurringModal && (
        <RecurringShipmentModal
          onClose={() => setShowRecurringModal(false)}
          onSubmit={handleMakeRecurring}
          shipmentVendorName={vendorOptions.find(vendor => vendor.id === editVendorId)?.name || shipment.vendorName}
        />
      )}

      {viewingPackingSlip && (
        <PackingSlipViewerModal
          packingSlip={viewingPackingSlip}
          lineItems={lineItems}
          onClose={() => setViewingPackingSlip(null)}
        />
      )}
    </main>
  );
}
