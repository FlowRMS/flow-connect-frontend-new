'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createDeliveryAssignee,
  createDeliveryDocument,
  createDeliveryIssue,
  createDeliveryItem,
  createDeliveryItemReceipt,
  createDeliveryStatusHistory,
  deleteDeliveryAssignee,
  deleteDeliveryDocument,
  deleteDeliveryItem,
  fetchDeliveryById,
  fetchFactories,
  fetchShippingCarriers,
  fetchWarehouseMembers,
  fetchWarehouseLocations,
  fetchWarehouses,
  mapDeliveryToShipment,
  updateDelivery,
  updateDeliveryItem,
  createRecurringShipment,
} from '@/components/warehouse/api/warehouseDeliveriesApi';
import type { DeliveryApi } from '@/components/warehouse/api/warehouseDeliveriesApi';
import { fetchUserById } from '@/components/lib/api/search';
import { fetchContactsByCompanyId } from '@/components/lib/graphql';
import { RecurrencePattern, AssignedUser, AssignedUserRole, DeliveryIssueType, AttachedDocument, IncomingShipment } from '@/lib/types/warehouse';
import RecurringShipmentModal from './modals/RecurringShipmentModal';
import { useWarehouse } from './WarehouseContext';
import {
  ShipmentStatus,
  shipmentStatusLabels,
} from '@/lib/types/warehouse';
import AddProductModal from './receiving/modals/AddProductModal';
import PackingSlipViewerModal from './receiving/modals/PackingSlipViewerModal';
import ReceivingHeader from './receiving/sections/ReceivingHeader';
import ReceivingSummarySidebar from './receiving/sections/ReceivingSummarySidebar';
import LineItemsTable from './receiving/sections/LineItemsTable';
import PutAwayInterface from './receiving/sections/PutAwayInterface';
import PackingSlipSection from './receiving/sections/PackingSlipSection';
import NotesSection from './receiving/sections/NotesSection';
import {
  readCachedDelivery,
  readCachedLookups,
  readCachedDeliveryDetail,
  writeCachedDeliveryDetail,
  updateCachedDeliveriesList,
  invalidateDeliveryCaches,
  patchDeliveryCaches,
} from './receiving/cache';
import type {
  BinAssignment,
  DeliveryDiscrepancy,
  LineItemReceive,
  PackingSlipDiscrepancy,
  PackingSlipLineItem,
  ScannedPackingSlip,
  WarehouseUser,
} from './receiving/types';
import { receivingSteps, stepInfo } from './receiving/types';

type DeliveryItemReceiptInput = {
  deliveryItemId: string;
  receiptType: 'RECEIPT' | 'ADJUSTMENT' | 'RETURN';
  receivedQty: number;
  damagedQty: number;
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
  const { isWorkerView } = useWarehouse();
  const [_, setForceUpdate] = useState(0);

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
    if (deliveryPatch) {
      patchDeliveryCaches(deliveryPatch);
    }
  };

  useEffect(() => {
    let isActive = true;

    setIsLoadingShipment(true);
    setShipmentError(null);
    setShipment(null);
    setHasInitialized(false);

    const loadShipment = async () => {
      try {
        let usedCachedList = false;
        const cachedDetail = readCachedDeliveryDetail(shipmentId);
        if (cachedDetail) {
          const { carriers, vendors } = readCachedLookups();
          const carrierMap = new Map((carriers || []).map((carrier) => [carrier.id, carrier]));
          const factoryMap = new Map((vendors || []).map((vendor) => [vendor.id, vendor]));
          setShipment(mapDeliveryToShipment(cachedDetail, new Map(), factoryMap, carrierMap));
          setIsLoadingShipment(false);
          return;
        }

        const cached = readCachedDelivery(shipmentId);
        if (cached) {
          const { carriers, vendors } = readCachedLookups();
          const carrierMap = new Map((carriers || []).map((carrier) => [carrier.id, carrier]));
          const factoryMap = new Map((vendors || []).map((vendor) => [vendor.id, vendor]));
          setShipment(mapDeliveryToShipment(cached, new Map(), factoryMap, carrierMap));
          setIsLoadingShipment(false);
          usedCachedList = true;
        }

        const delivery = await fetchDeliveryById(shipmentId);
        if (!isActive) return;
        if (!delivery) {
          setShipment(null);
          setIsLoadingShipment(false);
          return;
        }
        writeCachedDeliveryDetail(delivery);
        if (usedCachedList) {
          setHasInitialized(false);
        }
        setShipment(mapDeliveryToShipment(delivery, new Map(), new Map(), new Map()));
        setIsLoadingShipment(false);
      } catch (error) {
        if (!isActive) return;
        setShipmentError(error instanceof Error ? error.message : 'Failed to load delivery');
        setIsLoadingShipment(false);
      }
    };

    loadShipment();

    return () => {
      isActive = false;
    };
  }, [shipmentId]);

  useEffect(() => {
    let isActive = true;

    const loadOptions = async () => {
      try {
        const cached = readCachedLookups();
        if (cached.warehouses) {
          setWarehouseOptions(cached.warehouses);
        }
        if (cached.carriers && cached.vendors) {
          setCarrierOptions(cached.carriers.map((carrier) => ({ id: carrier.id, name: carrier.name })));
          const cachedVendorMap = new Map<string, { id: string; name: string; email?: string | null }>();
          cached.vendors.forEach((vendor) => {
            if (!cachedVendorMap.has(vendor.id)) {
              cachedVendorMap.set(vendor.id, {
                id: vendor.id,
                name: vendor.title,
                email: vendor.email,
              });
            }
          });
          setVendorOptions(Array.from(cachedVendorMap.values()));
        }

        const [warehouses, carriersList, vendors] = await Promise.all([
          cached.warehouses ? Promise.resolve(cached.warehouses) : fetchWarehouses(),
          cached.carriers ? Promise.resolve(cached.carriers) : fetchShippingCarriers(true),
          cached.vendors ? Promise.resolve(cached.vendors) : fetchFactories('', true, 200),
        ]);
        if (!isActive) return;
        const warehouseOptionsList = warehouses.map((warehouse) => ({ id: warehouse.id, name: warehouse.name }));
        setWarehouseOptions(warehouseOptionsList);
        if (!cached.warehouses) {
          try {
            sessionStorage.setItem('warehouseLookupCache', JSON.stringify({ warehouses: warehouseOptionsList }));
          } catch {
            // Ignore cache write failures (private mode / quota).
          }
        }
        setCarrierOptions(carriersList.map((carrier) => ({ id: carrier.id, name: carrier.name })));
        const uniqueVendors = new Map<string, { id: string; name: string; email?: string | null }>();
        vendors.forEach((vendor) => {
          if (!uniqueVendors.has(vendor.id)) {
            uniqueVendors.set(vendor.id, { id: vendor.id, name: vendor.title, email: vendor.email });
          }
        });
        setVendorOptions(Array.from(uniqueVendors.values()));
      } catch (error) {
        if (!isActive) return;
        console.error('Failed to load delivery options:', error);
        setWarehouseOptions([]);
        setCarrierOptions([]);
        setVendorOptions([]);
      }
    };

    loadOptions();

    return () => {
      isActive = false;
    };
  }, []);

  const refreshShipment = async () => {
    try {
      const delivery = await fetchDeliveryById(shipmentId);
      if (!delivery) {
        setShipment(null);
        return;
      }
      setHasInitialized(false);
      writeCachedDeliveryDetail(delivery);
      updateCachedDeliveriesList(delivery);
      setShipment(mapDeliveryToShipment(delivery, new Map(), new Map(), new Map()));
    } catch (error) {
      console.error('Failed to refresh delivery:', error);
    }
  };

  useEffect(() => {
    const membersWarehouseId = editWarehouseId || shipment?.warehouseId;
    if (!membersWarehouseId) {
      setAvailableManagers([]);
      setAvailableWorkers([]);
      setResolvedManagers(shipment?.assignedManagers || []);
      setResolvedWorkers(shipment?.assignedWorkers || []);
      return;
    }

    let isActive = true;

    const loadMembers = async () => {
      try {
        const members = await fetchWarehouseMembers(membersWarehouseId);
        if (!isActive) return;

        const userIds = new Set<string>();
        members.forEach((member) => userIds.add(member.userId));
        (shipment.assignedManagers || []).forEach((manager) => userIds.add(manager.userId));
        (shipment.assignedWorkers || []).forEach((worker) => userIds.add(worker.userId));

        const users = await Promise.all(
          Array.from(userIds).map(async (userId) => ({
            userId,
            user: await fetchUserById(userId),
          }))
        );
        if (!isActive) return;

        const userLookup = new Map(
          users.map(({ userId, user }) => {
            const name =
              user?.fullName ||
              [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
              user?.email ||
              userId;
            return [userId, { name, email: user?.email || '' }];
          })
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

        const assignedManagers = (shipment.assignedManagers || []).map((manager) => {
          const userInfo = userLookup.get(manager.userId);
          return {
            ...manager,
            userName: userInfo?.name || manager.userName,
            userEmail: userInfo?.email || manager.userEmail,
          };
        });

        const assignedWorkers = (shipment.assignedWorkers || []).map((worker) => {
          const userInfo = userLookup.get(worker.userId);
          return {
            ...worker,
            userName: userInfo?.name || worker.userName,
            userEmail: userInfo?.email || worker.userEmail,
          };
        });

        setAvailableManagers(managers);
        setAvailableWorkers(workers);
        setResolvedManagers(assignedManagers);
        setResolvedWorkers(assignedWorkers);
      } catch (error) {
        if (!isActive) return;
        console.error('Failed to load warehouse members:', error);
        setAvailableManagers([]);
        setAvailableWorkers([]);
        setResolvedManagers(shipment.assignedManagers || []);
        setResolvedWorkers(shipment.assignedWorkers || []);
      }
    };

    loadMembers();

    return () => {
      isActive = false;
    };
  }, [shipment, editWarehouseId]);

  useEffect(() => {
    const warehouseId = editWarehouseId || shipment?.warehouseId;
    if (!warehouseId) {
      setWarehouseBins([]);
      return;
    }

    let isActive = true;
    const cacheKey = `warehouseBinsCache:${warehouseId}`;
    const cacheMaxAgeMs = 5 * 60 * 1000;
    let shouldFetch = true;

    try {
      const cachedRaw = sessionStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as {
          timestamp: number;
          bins: Array<{ id: string; letterCode?: string }>;
        };
        if (cached?.bins) {
          setWarehouseBins(cached.bins);
        }
        if (cached?.timestamp && Date.now() - cached.timestamp < cacheMaxAgeMs) {
          shouldFetch = false;
        }
      }
    } catch {
      // Ignore cache parse errors.
    }

    if (!shouldFetch) {
      return () => {
        isActive = false;
      };
    }

    fetchWarehouseLocations(warehouseId)
      .then((locations) => {
        if (!isActive) return;
        const bins = locations
          .filter((location) => location.level === 'BIN' && location.isActive)
          .map((location) => ({
            id: location.id,
            letterCode: location.code || location.name,
          }));
        setWarehouseBins(bins);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), bins }));
        } catch {
          // Ignore cache write failures.
        }
      })
      .catch((error) => {
        if (!isActive) return;
        console.error('Failed to load warehouse bins:', error);
        setWarehouseBins([]);
      });

    return () => {
      isActive = false;
    };
  }, [editWarehouseId, shipment?.warehouseId]);


  // Add expected items state
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Recurring shipment modal state
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [vendorContacts, setVendorContacts] = useState<Array<{ name: string; email: string }>>([]);

  const currentVendorContacts = vendorContacts;
  // Show all contacts when input is empty, otherwise filter by input
  const filteredContacts = currentVendorContacts.filter(c =>
    editVendorContact === '' || c.name.toLowerCase().includes(editVendorContact.toLowerCase())
  );
  const filteredEmails = currentVendorContacts.filter(c =>
    editVendorEmail === '' || c.email.toLowerCase().includes(editVendorEmail.toLowerCase())
  );

  const isUuid = (value: string | undefined) =>
    Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));

  useEffect(() => {
    const vendorId = editVendorId || shipment?.vendorId;
    if (!vendorId || !isUuid(vendorId)) {
      setVendorContacts([]);
      return;
    }

    let isActive = true;
    const cacheKey = `vendorContactsCache:${vendorId}`;
    const cacheMaxAgeMs = 5 * 60 * 1000;
    let shouldFetch = true;

    try {
      const cachedRaw = sessionStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { timestamp: number; contacts: Array<{ name: string; email: string }> };
        if (cached?.contacts) {
          setVendorContacts(cached.contacts);
        }
        if (cached?.timestamp && Date.now() - cached.timestamp < cacheMaxAgeMs) {
          shouldFetch = false;
        }
      }
    } catch {
      // Ignore cache parse errors.
    }

    if (!shouldFetch) {
      return () => {
        isActive = false;
      };
    }

    fetchContactsByCompanyId(vendorId)
      .then((contacts) => {
        if (!isActive) return;
        const mapped = contacts
          .map((contact) => ({
            name: [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() || contact.email || 'Unknown',
            email: contact.email || '',
          }))
          .filter((contact) => contact.email || contact.name);
        setVendorContacts(mapped);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), contacts: mapped }));
        } catch {
          // Ignore cache write failures.
        }
      })
      .catch((error) => {
        if (!isActive) return;
        console.error('Failed to load vendor contacts:', error);
        setVendorContacts([]);
      });

    return () => {
      isActive = false;
    };
  }, [editVendorId, shipment?.vendorId]);

  // View state for step navigation
  const [viewingStatus, setViewingStatus] = useState<ShipmentStatus | null>(null);

  // Packing Slip capture (replaces BOL focus)
  const [packingSlipImage, setPackingSlipImage] = useState<string | null>(null);
  const [packingSlipCaptured, setPackingSlipCaptured] = useState(false);
  const [packingSlipInputMode, setPackingSlipInputMode] = useState<'scan' | 'manual' | null>(null);
  const [isProcessingPackingSlip, setIsProcessingPackingSlip] = useState(false);
  const [packingSlipLineItems, setPackingSlipLineItems] = useState<PackingSlipLineItem[]>([]);
  const [packingSlipDiscrepancies, setPackingSlipDiscrepancies] = useState<PackingSlipDiscrepancy[]>([]);

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
  const [showDiscrepancyForm, setShowDiscrepancyForm] = useState<string | null>(null);
  const [newDiscrepancy, setNewDiscrepancy] = useState<{ type: 'shortage' | 'overage' | 'damage' | 'wrong_item' | 'other'; quantity: number; description: string }>({ type: 'damage', quantity: 0, description: '' });

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
      const receivedQty = item.receivedQuantity || 0;
      const damagedQty = item.damagedQuantity || 0;
      const hasProgress = receivedQty > 0 || damagedQty > 0;
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        partNumber: item.partNumber,
        expectedQty: item.expectedQuantity,
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
  const isArrived = displayStatus === 'ARRIVED' || currentStepIndex >= receivingSteps.indexOf('ARRIVED');
  const isReceiving = displayStatus === 'RECEIVING';
  const isReceived = displayStatus === 'RECEIVED';
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
    return Math.max(0, item.receivedQty);
  };

  const getItemDamagedTotal = (item: LineItemReceive) => {
    const disc = getItemDiscrepancyTotals(item.id);
    return item.damagedQty + disc.damage;
  };

  const getItemAccountedTotal = (item: LineItemReceive) => {
    const disc = getItemDiscrepancyTotals(item.id);
    return (
      getItemAdjustedReceived(item) +
      getItemDamagedTotal(item) +
      disc.shortage +
      disc.wrongItem +
      disc.other +
      disc.overage
    );
  };

  // Calculate totals
  const totalExpected = lineItems.reduce((sum, item) => sum + item.expectedQty, 0);
  const totalRawReceived = lineItems.reduce((sum, item) => sum + item.receivedQty, 0);
  const totalRawDamaged = lineItems.reduce((sum, item) => sum + item.damagedQty, 0);
  const totalIssues = discrepancySummary.totals.total;
  const totalReceived = Math.max(0, totalRawReceived);
  const totalDamaged = totalRawDamaged + discrepancySummary.totals.damage;
  const totalVariance = totalReceived - totalExpected;
  const allItemsVerified = lineItems.every(item => item.verified || getItemAccountedTotal(item) >= item.expectedQty);
  const allItemsPutAway = lineItems.every(item => item.putAway);
  const allBinsAssigned = lineItems.every(item => item.binId);

  // Save shipment details handler
  const handleSaveDetails = () => {
    const selectedVendor = vendorOptions.find((vendor) => vendor.id === editVendorId);
    if (!shipment) return;

    const carrierId =
      carrierOptions.find((carrier) => carrier.name === editCarrier)?.id ||
      null;
    const expectedDate =
      editEta || (shipment.eta ? shipment.eta.split('T')[0] : null);

    updateDelivery(shipment.id, {
      poNumber: editPoNumber,
      warehouseId: editWarehouseId,
      vendorId: editVendorId,
      carrierId,
      trackingNumber: editTrackingNumber || null,
      status: shipment.status,
      expectedDate,
      arrivedAt: null,
      receivingStartedAt: null,
      receivedAt: shipment.receivedAt || null,
      originAddressId: null,
      destinationAddressId: null,
      recurringShipmentId: shipment.recurringShipmentId || null,
      vendorContactName: editVendorContact || null,
      vendorContactEmail: editVendorEmail || selectedVendor?.email || null,
      notes: shipment.notes || null,
      updatedById: null,
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

    updateDeliveryItem(itemId, {
      deliveryId: shipment.id,
      productId: lineItem.productId,
      expectedQty: newQty,
      receivedQty: lineItem.receivedQty,
      damagedQty: lineItem.damagedQty,
      status: (expectedItem?.status || 'pending').toUpperCase(),
      discrepancyNotes: expectedItem?.discrepancyNotes || null,
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
    deleteDeliveryItem(itemId)
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
    createDeliveryItem({
      deliveryId: shipment.id,
      productId: product.id,
      expectedQty: quantity,
      receivedQty: 0,
      damagedQty: 0,
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

    const baseDocsById = new Set(baseDocuments.map((doc) => doc.id));
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
    const baseAssignmentKeys = new Set(baseAssignments.map((assignment) => `${assignment.userId}:${assignment.role}`));
    const currentAssignmentKeys = new Set(currentAssignments.map((assignment) => `${assignment.userId}:${assignment.role}`));
    const assignmentsToCreate = currentAssignments.filter(
      (assignment) => !baseAssignmentKeys.has(`${assignment.userId}:${assignment.role}`)
    );
    const assignmentsToDelete = baseAssignments.filter(
      (assignment) => !currentAssignmentKeys.has(`${assignment.userId}:${assignment.role}`)
    );

    const tasks: Array<Promise<unknown>> = [];

    itemsToCreate.forEach((item) => {
      tasks.push(
        createDeliveryItem({
          deliveryId: shipment.id,
          productId: item.productId,
          expectedQty: item.expectedQty,
          receivedQty: item.receivedQty,
          damagedQty: item.damagedQty,
          status: 'PENDING',
          discrepancyNotes: null,
        })
      );
    });

    itemsToUpdate.forEach((item) => {
      tasks.push(
        updateDeliveryItem(item.id, {
          deliveryId: shipment.id,
          productId: item.productId,
          expectedQty: item.expectedQty,
          receivedQty: item.receivedQty,
          damagedQty: item.damagedQty,
          status: 'PENDING',
          discrepancyNotes: null,
        })
      );
    });

    itemsToDelete.forEach((item) => {
      tasks.push(deleteDeliveryItem(item.id));
    });

    docsToCreate.forEach((doc) => {
      tasks.push(
        createDeliveryDocument({
          deliveryId: shipment.id,
          name: doc.name,
          docType: doc.type,
          fileUrl: doc.fileUrl,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize || null,
          uploadedById: isUuid(doc.uploadedBy) ? doc.uploadedBy : null,
          notes: doc.notes || null,
        })
      );
    });

    docsToDelete.forEach((doc) => {
      tasks.push(deleteDeliveryDocument(doc.id));
    });

    assignmentsToCreate.forEach((assignment) => {
      tasks.push(
        createDeliveryAssignee({
          deliveryId: shipment.id,
          userId: assignment.userId,
          role: assignment.role === 'manager' ? 'MANAGER' : 'WORKER',
        })
      );
    });

    assignmentsToDelete.forEach((assignment) => {
      if (!assignment.id || isTempId(assignment.id)) return;
      tasks.push(deleteDeliveryAssignee(assignment.id));
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
      arrivedAt: null,
      receivingStartedAt: null,
      receivedAt: null,
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
        arrivedAt: null,
        receivingStartedAt: null,
        receivedAt: null,
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
      await updateDelivery(shipment.id, payload);
      await createDeliveryStatusHistory({
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
      const recurring = await createRecurringShipment({
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
      await updateDelivery(shipment.id, {
        poNumber: shipment.poNumber,
        warehouseId: shipment.warehouseId,
        vendorId: shipment.vendorId,
        carrierId,
        trackingNumber: shipment.trackingNumber || null,
        status: 'PENDING',
        expectedDate: shipment.eta ? shipment.eta.split('T')[0] : null,
        arrivedAt: null,
        receivingStartedAt: null,
        receivedAt: shipment.receivedAt || null,
        originAddressId: null,
        destinationAddressId: null,
        recurringShipmentId: recurring.id,
        vendorContactName: shipment.vendorContact || null,
        vendorContactEmail: shipment.vendorEmail || null,
        notes: shipment.notes || null,
        updatedById: null,
      });
      await createDeliveryStatusHistory({
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
      await updateDelivery(shipment.id, {
        poNumber: shipment.poNumber,
        warehouseId: shipment.warehouseId,
        vendorId: shipment.vendorId,
        carrierId: shipment.carrierId || null,
        trackingNumber: shipment.trackingNumber || null,
        status: 'ARRIVED',
        expectedDate: shipment.eta ? shipment.eta.split('T')[0] : null,
        arrivedAt: nowIso,
        receivingStartedAt: null,
        receivedAt: shipment.receivedAt || null,
        originAddressId: null,
        destinationAddressId: null,
        recurringShipmentId: shipment.recurringShipmentId || null,
        vendorContactName: shipment.vendorContact || null,
        vendorContactEmail: shipment.vendorEmail || null,
        notes: shipment.notes || null,
        updatedById: null,
      });
      await createDeliveryStatusHistory({
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
    updateDelivery(shipment.id, {
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
    })
      .then(() =>
        createDeliveryStatusHistory({
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
      if (accountedTotal === 0) return 'PENDING';
      if (damagedTotal > 0 || disc.total > 0) return 'DISCREPANCY';
      if (adjustedReceived < item.expectedQty) return 'PARTIAL';
      return 'RECEIVED';
    };

    try {
      const receiptInputs = lineItems.reduce<DeliveryItemReceiptInput[]>(
        (acc, item) => {
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
                deliveryItemId: item.id,
                receivedQty: assignment.quantity,
                damagedQty: 0,
                locationId: assignment.binId || null,
                ...baseReceipt,
              });
            });
          } else if (goodQty > 0) {
            acc.push({
              deliveryItemId: item.id,
              receivedQty: goodQty,
              damagedQty: 0,
              locationId: item.binId || item.primaryBinId || null,
              ...baseReceipt,
            });
          }

          if (damagedTotal > 0) {
            acc.push({
              deliveryItemId: item.id,
              receivedQty: 0,
              damagedQty: damagedTotal,
              locationId: null,
              ...baseReceipt,
            });
          }

          return acc;
        },
        []
      );

      await Promise.all(
        lineItems.map((item) =>
          updateDeliveryItem(item.id, {
            deliveryId: shipment.id,
            productId: item.productId,
            expectedQty: item.expectedQty,
            receivedQty: item.receivedQty,
            damagedQty: item.damagedQty,
            status: computeLineItemStatus(item),
            discrepancyNotes: null,
          })
        )
      );

      if (receiptInputs.length > 0) {
        await Promise.all(
          receiptInputs.map((input) => createDeliveryItemReceipt(input))
        );
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
          discrepancies.map((disc) =>
            createDeliveryIssue({
              deliveryId: shipment.id,
              deliveryItemId: disc.lineItemId,
              receiptId: null,
              issueType: mapDiscrepancyType(disc.type),
              customIssueType: disc.type === 'other' ? disc.customType : null,
              qty: disc.quantity,
              status: 'OPEN',
              description: disc.description || null,
              notes: null,
              communicatedAt: null,
            })
          )
        );
      }

      await updateDelivery(shipment.id, {
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
      });

      await createDeliveryStatusHistory({
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

  const handleAddDiscrepancy = (itemId: string) => {
    if (!newDiscrepancy.quantity) return;
    const newId = `DISC-${Date.now()}`;
    setDiscrepancies(prev => [...prev, {
      id: newId,
      lineItemId: itemId,
      ...newDiscrepancy,
    }]);
    setNewDiscrepancy({ type: 'damage', quantity: 0, description: '' });
    setShowDiscrepancyForm(null);
  };

  // Packing Slip handlers
  const handlePackingSlipImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPackingSlipImage(reader.result as string);
        setPackingSlipInputMode('scan');
        // Simulate OCR processing
        processPackingSlipImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPackingSlipImage(reader.result as string);
          setPackingSlipInputMode('scan');
          processPackingSlipImage();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const processPackingSlipImage = () => {
    setIsProcessingPackingSlip(true);
    const newPackingSlipId = `PS-${Date.now()}`;
    const newPackingSlip: ScannedPackingSlip = {
      id: newPackingSlipId,
      name: `Packing Slip ${scannedPackingSlips.length + 1}`,
      scannedAt: new Date().toISOString(),
      imageUrl: packingSlipImage || '',
      lineItemIds: [],
    };
    setScannedPackingSlips(prev => [...prev, newPackingSlip]);
    setCurrentPackingSlipId(newPackingSlipId);
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

  const handleUpdatePackingSlipLine = (id: string, updates: Partial<PackingSlipLineItem>) => {
    setPackingSlipLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleRemovePackingSlipLine = (id: string) => {
    setPackingSlipLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleMatchPackingSlipLine = (packingSlipId: string, lineItemId: string) => {
    setPackingSlipLineItems(prev => prev.map(item =>
      item.id === packingSlipId ? { ...item, matched: true, matchedLineItemId: lineItemId } : item
    ));
  };

  const handleClearPackingSlip = () => {
    setPackingSlipImage(null);
    setPackingSlipInputMode(null);
    setPackingSlipLineItems([]);
    setPackingSlipCaptured(false);
    setPackingSlipDiscrepancies([]);
  };

  // Incremental receiving / pallet handlers
  const handleIncrementalReceive = (itemId: string, quantity: number) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, receivedQty: item.receivedQty + quantity } : item
    ));
  };

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
  const getLowCapacityBins = () => warehouseBins.filter(bin => (bin.currentQuantity ?? 0) < (bin.maxCapacity ?? 0) * 0.5);
  const isNonPrimaryBin = (lineItem: LineItemReceive) => lineItem.binId !== lineItem.primaryBinId;

  const handleOneClickPutAway = (itemId: string) => {
    // One-click confirm for primary bin
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, verified: true, putAway: true } : item
    ));
  };

  const handleAddBinAssignment = (lineItemId: string, binId: string, quantity: number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== lineItemId) return item;
      const newAssignment: BinAssignment = {
        id: `ba-${Date.now()}`,
        binId,
        quantity,
        isPrimary: item.binAssignments.length === 0,
      };
      return {
        ...item,
        binAssignments: [...item.binAssignments, newAssignment],
      };
    }));
  };

  // Document handlers
  const handleAddDocument = (document: Omit<AttachedDocument, 'id'>) => {
    if (shouldDeferPersistence) {
      const newDocument: AttachedDocument = {
        id: `temp-${Date.now()}`,
        ...document,
      };
      setAttachedDocuments((prev) => [...prev, newDocument]);
      return;
    }
    createDeliveryDocument({
      deliveryId: shipment.id,
      name: document.name,
      docType: document.type,
      fileUrl: document.fileUrl,
      mimeType: document.mimeType,
      fileSize: document.fileSize || null,
      uploadedById: isUuid(document.uploadedBy) ? document.uploadedBy : null,
      notes: document.notes || null,
    })
      .then(() => refreshShipment())
      .catch((error) => {
        console.error('Failed to add delivery document:', error);
      });
  };

  const handleRemoveDocument = (documentId: string) => {
    if (shouldDeferPersistence) {
      setAttachedDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      return;
    }
    deleteDeliveryDocument(documentId)
      .then(() => refreshShipment())
      .catch((error) => {
        console.error('Failed to remove delivery document:', error);
      });
  };

  const handleAddAssignment = async (userId: string, role: 'manager' | 'worker') => {
    if (shouldDeferPersistence) {
      const userPool = role === 'manager' ? availableManagers : availableWorkers;
      const userInfo = userPool.find((user) => user.id === userId);
      const newAssignment: AssignedUser = {
        id: `temp-${Date.now()}`,
        userId,
        userName: userInfo?.name || userId,
        userEmail: userInfo?.email || '',
        role,
        assignedAt: new Date().toISOString(),
      };
      if (role === 'manager') {
        setResolvedManagers((prev) =>
          prev.some((assignment) => assignment.userId === userId) ? prev : [...prev, newAssignment]
        );
      } else {
        setResolvedWorkers((prev) =>
          prev.some((assignment) => assignment.userId === userId) ? prev : [...prev, newAssignment]
        );
      }
      return;
    }
    await createDeliveryAssignee({
      deliveryId: shipmentId,
      userId,
      role: role === 'manager' ? 'MANAGER' : 'WORKER',
    });
    await refreshShipment();
  };

  const handleRemoveAssignment = async (assignmentId: string, role: 'manager' | 'worker') => {
    void role;
    if (shouldDeferPersistence) {
      setResolvedManagers((prev) => prev.filter((assignment) => assignment.id !== assignmentId));
      setResolvedWorkers((prev) => prev.filter((assignment) => assignment.id !== assignmentId));
      return;
    }
    await deleteDeliveryAssignee(assignmentId);
    await refreshShipment();
  };

  // Receiving Interface Component
  const receivingInterface = (
    <div className="bg-[var(--card)] rounded-lg border-2 border-yellow-400 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-yellow-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 14l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Receiving Mode</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {totalReceived} of {totalExpected} items received · {totalIssues > 0 ? `${totalIssues} with issues` : 'No issues reported'}
              {palletSessions.length > 0 && ` · ${palletSessions.length} pallet(s) saved`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Save Pallet Button for incremental receiving */}
          {totalReceived > 0 && !allItemsVerified && (
            <button
              onClick={() => setShowSavePalletConfirm(true)}
              className="px-3 py-2 border border-amber-400 text-amber-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-amber-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="22" height="5" rx="1"/>
                <path d="M1 8h22v11a2 2 0 01-2 2H3a2 2 0 01-2-2V8z"/>
              </svg>
              Save Pallet #{currentPalletNumber}
            </button>
          )}
          {allItemsVerified && (
            <button
              onClick={handleCompleteReceiving}
              disabled={isTransitioning}
              className={`px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                isTransitioning ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-700'
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
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Complete Receiving
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Packing Slip Capture Section */}
      {!packingSlipCaptured && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span className="text-sm font-medium text-blue-800">Scan Additional Packing Slips</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCameraCapture}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Camera
              </button>
              <label className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-100 transition-colors cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePackingSlipImageUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setPackingSlipInputMode('manual')}
                className="px-3 py-1.5 text-blue-600 text-sm font-medium hover:underline"
              >
                Enter Manually
              </button>
            </div>
          </div>
          {isProcessingPackingSlip && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Processing packing slip...
            </div>
          )}
        </div>
      )}

      {/* Digital Packing Slip Display */}
      {packingSlipCaptured && packingSlipLineItems.length > 0 && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span className="text-sm font-medium text-green-800">Packing Slip Captured ({packingSlipLineItems.length} items)</span>
            </div>
            <button
              onClick={handleClearPackingSlip}
              className="text-xs text-green-600 hover:underline"
            >
              Clear & Rescan
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar with incremental tracking */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20">
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-2">
          <span>Receiving Progress</span>
          <span>{Math.round((totalReceived / totalExpected) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--muted)] rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(totalReceived / totalExpected) * 100}%` }}
          />
        </div>
        {palletSessions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {palletSessions.map((session) => (
              <span key={session.id} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                Pallet #{session.palletNumber}: {session.items.reduce((sum, i) => sum + i.quantity, 0)} units
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Save Pallet Confirmation Modal */}
      {showSavePalletConfirm && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Save current progress as Pallet #{currentPalletNumber}?</p>
              <p className="text-xs text-amber-600 mt-1">You can continue receiving more items after saving.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSavePalletConfirm(false)}
                className="px-3 py-1.5 text-sm text-amber-700 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePallet}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
              >
                Save Pallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search bar for quick filtering */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search by part number or product name..."
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
            {itemSearchQuery && (
              <button
                onClick={() => setItemSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          {/* Expand/Collapse All button */}
          <button
            onClick={() => {
              const allCollapsed = collapsedItems.size === lineItems.length;
              if (allCollapsed) {
                // Expand all
                setCollapsedItems(new Set());
              } else {
                // Collapse all
                setCollapsedItems(new Set(lineItems.map(li => li.id)));
              }
            }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {collapsedItems.size === lineItems.length ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
                Expand All
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
                Collapse All
              </>
            )}
          </button>
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {lineItems
          .filter((item) => {
            if (!itemSearchQuery) return true;
            const query = itemSearchQuery.toLowerCase();
            return (
              item.partNumber.toLowerCase().includes(query) ||
              item.productName.toLowerCase().includes(query)
            );
          })
          .map((lineItem) => {
          const isVerified = lineItem.verified;
          const isPutAway = lineItem.putAway;
          const itemDiscrepancies = getItemDiscrepancyTotals(lineItem.id);
          const adjustedReceived = getItemAdjustedReceived(lineItem);
          const accountedTotal = getItemAccountedTotal(lineItem);
          const hasDiscrepancy = itemDiscrepancies.total > 0;
          const isExpanded = !collapsedItems.has(lineItem.id);
          const hasNotes = lineItem.notes && lineItem.notes.trim().length > 0;
          const isNonPrimary = isNonPrimaryBin(lineItem);
          const remainingToReceive = Math.max(0, lineItem.expectedQty - accountedTotal);

          return (
            <div
              key={lineItem.id}
              className={`transition-colors ${isVerified ? 'bg-green-50' : isPutAway ? 'bg-blue-50' : 'hover:bg-[var(--muted)]/20'}`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Status indicator */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isPutAway ? 'bg-blue-500' : isVerified ? 'bg-green-500' : 'bg-[var(--muted)]'
                }`}>
                  {isPutAway ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  ) : isVerified ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="text-lg font-bold text-[var(--muted-foreground)]">{lineItem.expectedQty}</span>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--foreground)]">{lineItem.partNumber}</span>
                    {hasDiscrepancy && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Issue
                      </span>
                    )}
                    {lineItem.lotNumber && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        Lot: {lineItem.lotNumber}
                      </span>
                    )}
                    {/* Notes indicator */}
                    {hasNotes && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded flex items-center gap-1" title={lineItem.notes}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        Note
                      </span>
                    )}
                    {/* Packing slip link */}
                    {lineItem.packingSlipId && (() => {
                      const ps = scannedPackingSlips.find(p => p.id === lineItem.packingSlipId);
                      return ps ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingPackingSlip(ps);
                          }}
                          className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded flex items-center gap-1 hover:bg-green-200 transition-colors"
                          title={`View ${ps.name}`}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <path d="M14 2v6h6"/>
                          </svg>
                          {ps.name}
                        </button>
                      ) : null;
                    })()}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] truncate">{lineItem.productName}</p>
                  {lineItem.binId && (
                    <div className="flex items-center gap-1 mt-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span className={`text-xs font-medium ${isNonPrimary ? 'text-orange-600' : 'text-amber-600'}`}>
                        Bin {warehouseBins.find(b => b.id === lineItem.binId)?.letterCode || lineItem.binId}
                        {isNonPrimary && (
                          <span className="ml-1 text-orange-500" title="Not the default bin for this item">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline">
                              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {/* Show inline note preview */}
                  {hasNotes && (
                    <p className="text-xs text-purple-600 mt-1 truncate max-w-xs" title={lineItem.notes}>
                      "{lineItem.notes}"
                    </p>
                  )}
                </div>

                {/* Quantity display */}
                <div className="text-right mr-4">
                  <div className="text-2xl font-bold text-[var(--foreground)]">
                    {adjustedReceived} / {lineItem.expectedQty}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {isVerified ? 'verified' : remainingToReceive > 0 ? `${remainingToReceive} remaining` : 'received'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newCollapsed = new Set(collapsedItems);
                      if (isExpanded) {
                        newCollapsed.add(lineItem.id);
                      } else {
                        newCollapsed.delete(lineItem.id);
                      }
                      setCollapsedItems(newCollapsed);
                    }}
                    className="p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                    title="Expand details"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {!isVerified && (
                    <>
                      <button
                        onClick={() => handleReceiveAll(lineItem.id, lineItem.expectedQty)}
                        className="px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium text-sm hover:bg-yellow-600 transition-colors flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        Receive All
                      </button>
                    </>
                  )}
                  {isVerified && !isPutAway && lineItem.binId && (
                    <button
                      onClick={() => handleOneClickPutAway(lineItem.id)}
                      className={`px-4 py-3 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                        isNonPrimary ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                      title={isNonPrimary ? 'Put away to non-primary bin' : `Put away to Bin ${warehouseBins.find(b => b.id === lineItem.binId)?.letterCode}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      </svg>
                      Put Away {warehouseBins.find(b => b.id === lineItem.binId)?.letterCode}
                    </button>
                  )}
                  {isVerified && (
                    <button
                      onClick={() => handleUnverifyItem(lineItem.id)}
                      className="px-4 py-3 border border-[var(--border)] rounded-lg font-medium text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Content - Compact Design */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-[var(--border)] bg-[var(--muted)]/10">
                  <div className="ml-16 mt-3 space-y-3">
                    {/* Receiving Line - First row: Received, Lot #, Notes */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-[var(--muted-foreground)] whitespace-nowrap">Received</label>
                        <input
                          type="number"
                          min="0"
                          value={lineItem.receivedQty}
                          onChange={(e) => handleUpdateLineItem(lineItem.id, { receivedQty: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-[var(--muted-foreground)] whitespace-nowrap">Lot #</label>
                        <input
                          type="text"
                          value={lineItem.lotNumber}
                          onChange={(e) => handleUpdateLineItem(lineItem.id, { lotNumber: e.target.value })}
                          placeholder="Optional"
                          className="w-24 px-2 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <label className="text-xs font-medium text-[var(--muted-foreground)] whitespace-nowrap">Notes</label>
                        <input
                          type="text"
                          value={lineItem.notes}
                          onChange={(e) => handleUpdateLineItem(lineItem.id, { notes: e.target.value })}
                          placeholder="Optional notes..."
                          className="flex-1 px-2 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                        {voiceSupported && (
                          <button
                            onClick={() => handleVoiceInput(lineItem.id)}
                            className={`p-1.5 rounded-lg text-sm transition-colors ${
                              isRecordingVoice === lineItem.id
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                            }`}
                            title={isRecordingVoice === lineItem.id ? 'Recording...' : 'Voice input'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                              <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                              <line x1="12" y1="19" x2="12" y2="23"/>
                              <line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delivery Issues Section */}
                    <div className="space-y-2">
                      {/* Quick-add issue buttons */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--muted-foreground)]">Delivery Issues:</span>
                        <div className="flex items-center gap-1">
                          {/* Damaged quick-add */}
                          <button
                            onClick={() => {
                              const existing = discrepancies.find(d => d.lineItemId === lineItem.id && d.type === 'damage');
                              if (existing) {
                                setDiscrepancies(prev => prev.map(d =>
                                  d.id === existing.id ? { ...d, quantity: d.quantity + 1 } : d
                                ));
                              } else {
                                setDiscrepancies(prev => [...prev, {
                                  id: `disc-${Date.now()}-dmg`,
                                  lineItemId: lineItem.id,
                                  type: 'damage',
                                  quantity: 1,
                                  description: '',
                                }]);
                              }
                            }}
                            className="px-2 py-1 text-xs border border-orange-200 rounded-md bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                          >
                            + Damaged
                          </button>
                          {/* Missing quick-add */}
                          <button
                            onClick={() => {
                              const existing = discrepancies.find(d => d.lineItemId === lineItem.id && d.type === 'shortage');
                              if (existing) {
                                setDiscrepancies(prev => prev.map(d =>
                                  d.id === existing.id ? { ...d, quantity: d.quantity + 1 } : d
                                ));
                              } else {
                                setDiscrepancies(prev => [...prev, {
                                  id: `disc-${Date.now()}-short`,
                                  lineItemId: lineItem.id,
                                  type: 'shortage',
                                  quantity: 1,
                                  description: '',
                                }]);
                              }
                            }}
                            className="px-2 py-1 text-xs border border-red-200 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            + Missing
                          </button>
                          {/* Overage quick-add */}
                          <button
                            onClick={() => {
                              const existing = discrepancies.find(d => d.lineItemId === lineItem.id && d.type === 'overage');
                              if (existing) {
                                setDiscrepancies(prev => prev.map(d =>
                                  d.id === existing.id ? { ...d, quantity: d.quantity + 1 } : d
                                ));
                              } else {
                                setDiscrepancies(prev => [...prev, {
                                  id: `disc-${Date.now()}-over`,
                                  lineItemId: lineItem.id,
                                  type: 'overage',
                                  quantity: 1,
                                  description: '',
                                }]);
                              }
                            }}
                            className="px-2 py-1 text-xs border border-blue-200 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            + Overage
                          </button>
                          {/* Wrong Item quick-add */}
                          <button
                            onClick={() => {
                              const existing = discrepancies.find(d => d.lineItemId === lineItem.id && d.type === 'wrong_item');
                              if (existing) {
                                setDiscrepancies(prev => prev.map(d =>
                                  d.id === existing.id ? { ...d, quantity: d.quantity + 1 } : d
                                ));
                              } else {
                                setDiscrepancies(prev => [...prev, {
                                  id: `disc-${Date.now()}-wrong`,
                                  lineItemId: lineItem.id,
                                  type: 'wrong_item',
                                  quantity: 1,
                                  description: '',
                                }]);
                              }
                            }}
                            className="px-2 py-1 text-xs border border-purple-200 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                          >
                            + Wrong Item
                          </button>
                          {/* Other/Custom issue type */}
                          <button
                            onClick={() => {
                              setDiscrepancies(prev => [...prev, {
                                id: `disc-${Date.now()}-other`,
                                lineItemId: lineItem.id,
                                type: 'other',
                                quantity: 1,
                                description: '',
                              }]);
                            }}
                            className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            + Other
                          </button>
                        </div>
                      </div>

                      {/* Existing delivery issues - styled like the main receiving row */}
                      {discrepancies.filter(d => d.lineItemId === lineItem.id).map(disc => (
                        <div key={disc.id} className="flex items-center gap-4">
                          {/* Type badge or editable input for 'other' */}
                          {disc.type === 'other' ? (
                            <input
                              type="text"
                              placeholder="Issue type..."
                              value={disc.customType || ''}
                              onChange={(e) => {
                                setDiscrepancies(prev => prev.map(d =>
                                  d.id === disc.id ? { ...d, customType: e.target.value } : d
                                ));
                              }}
                              className="w-24 px-2 py-1 border border-[var(--border)] rounded-lg bg-[var(--background)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 placeholder:text-[var(--muted-foreground)]/50"
                            />
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              disc.type === 'damage' ? 'bg-orange-100 text-orange-700' :
                              disc.type === 'shortage' ? 'bg-red-100 text-red-700' :
                              disc.type === 'overage' ? 'bg-blue-100 text-blue-700' :
                              disc.type === 'wrong_item' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {disc.type === 'damage' ? 'Damaged' :
                               disc.type === 'shortage' ? 'Missing' :
                               disc.type === 'overage' ? 'Overage' :
                               disc.type === 'wrong_item' ? 'Wrong Item' :
                               'Other'}
                            </span>
                          )}

                          {/* Quantity input - styled like main row */}
                          <input
                            type="number"
                            min="1"
                            value={disc.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setDiscrepancies(prev => prev.map(d =>
                                d.id === disc.id ? { ...d, quantity: val } : d
                              ));
                            }}
                            className="w-16 px-2 py-1 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                          />

                          {/* Notes label and input - boxed style like other inputs */}
                          <span className="text-xs text-[var(--muted-foreground)]">Notes</span>
                          <input
                            type="text"
                            placeholder="Optional notes..."
                            value={disc.description}
                            onChange={(e) => {
                              setDiscrepancies(prev => prev.map(d =>
                                d.id === disc.id ? { ...d, description: e.target.value } : d
                              ));
                            }}
                            className="flex-1 px-2 py-1 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 placeholder:text-[var(--muted-foreground)]/50"
                          />

                          {/* Remove button */}
                          <button
                            onClick={() => setDiscrepancies(prev => prev.filter(d => d.id !== disc.id))}
                            className="text-[var(--muted-foreground)] hover:text-red-500 p-1 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Put-Away Row */}
                    <div className="pt-2 border-t border-[var(--border)]">
                      {!lineItem.showAlternateLocations ? (
                        /* Simple Mode - Default bin with option to expand */
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 flex-1">
                          <label className="text-xs font-medium text-[var(--muted-foreground)] whitespace-nowrap">Put-Away</label>
                          {lineItem.primaryBinId ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-700">
                                Bin {warehouseBins.find(b => b.id === lineItem.primaryBinId)?.letterCode} (Default)
                              </span>
                              <span className="text-sm text-[var(--muted-foreground)]">
                                Qty: {Math.max(0, lineItem.receivedQty - lineItem.damagedQty)}
                              </span>
                            </div>
                          ) : warehouseBins.length > 0 ? (
                            <select
                              value=""
                              onChange={(e) => {
                                const selectedBinId = e.target.value;
                                handleUpdateLineItem(lineItem.id, {
                                  primaryBinId: selectedBinId,
                                  binId: selectedBinId,
                                });
                              }}
                              className="px-2 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            >
                              <option value="">Select default bin</option>
                              {warehouseBins.map((bin) => (
                                <option key={bin.id} value={bin.id}>
                                  Bin {bin.letterCode}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm text-orange-600">No bins configured for this warehouse</span>
                          )}
                        </div>

                        {/* Split to Alternate Locations Button */}
                        <button
                            onClick={() => {
                              // Initialize bin assignments with the primary bin and all received quantity
                              const primaryAssignment: BinAssignment = {
                                id: `ba-${Date.now()}-primary`,
                                binId: lineItem.primaryBinId || '',
                                quantity: Math.max(0, lineItem.receivedQty - lineItem.damagedQty),
                                isPrimary: true,
                              };
                              handleUpdateLineItem(lineItem.id, {
                                showAlternateLocations: true,
                                binAssignments: [primaryAssignment],
                              });
                            }}
                            disabled={!lineItem.primaryBinId}
                            className={`px-3 py-1.5 text-xs border border-orange-300 text-orange-600 rounded-lg transition-colors flex items-center gap-1 ${
                              lineItem.primaryBinId ? 'hover:bg-orange-50' : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5"/>
                            </svg>
                            Split to Alternate Locations
                          </button>

                          {/* Put-Away Button */}
                          <button
                            onClick={() => handleVerifyItem(lineItem.id)}
                            disabled={!lineItem.primaryBinId || lineItem.verified}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              lineItem.verified
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              {lineItem.verified ? (
                                <path d="M20 6L9 17l-5-5"/>
                              ) : (
                                <>
                                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                                </>
                              )}
                            </svg>
                            {lineItem.verified ? 'Verified' : 'Verify Item'}
                          </button>
                        </div>
                      ) : (
                        /* Multi-Location Mode - Show all bin assignments */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-[var(--muted-foreground)]">Put-Away Locations</label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[var(--muted-foreground)]">
                                Total: {lineItem.binAssignments.reduce((sum, ba) => sum + ba.quantity, 0)} / {lineItem.receivedQty - lineItem.damagedQty} units
                              </span>
                              <button
                                onClick={() => handleUpdateLineItem(lineItem.id, {
                                  showAlternateLocations: false,
                                  binId: lineItem.primaryBinId,
                                  binAssignments: [],
                                })}
                                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>

                          {/* Bin Assignment Lines */}
                          <div className="space-y-2">
                            {lineItem.binAssignments.map((assignment, index) => (
                              <div key={assignment.id} className="flex items-center gap-3 bg-[var(--muted)]/30 p-2 rounded-lg">
                                <span className="text-xs font-medium text-[var(--muted-foreground)] w-24">
                                  {assignment.isPrimary ? 'Main Location' : `Alternate ${index}`}
                                </span>
                                <select
                                  value={assignment.binId}
                                  onChange={(e) => {
                                    const updated = lineItem.binAssignments.map(ba =>
                                      ba.id === assignment.id ? { ...ba, binId: e.target.value } : ba
                                    );
                                    handleUpdateLineItem(lineItem.id, { binAssignments: updated });
                                  }}
                                  className={`flex-1 max-w-xs px-2 py-1.5 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                                    assignment.isPrimary ? 'border-green-300' : 'border-orange-300'
                                  }`}
                                >
                                  <option value="">Select bin</option>
                                  {lineItem.primaryBinId && (
                                    <option value={lineItem.primaryBinId}>
                                      Bin {warehouseBins.find(b => b.id === lineItem.primaryBinId)?.letterCode} (Default)
                                    </option>
                                  )}
                                  <optgroup label="Empty Bins">
                                    {getEmptyBins().filter(b => b.id !== lineItem.primaryBinId).map((bin) => (
                                      <option key={bin.id} value={bin.id}>
                                        Bin {bin.letterCode} - Empty
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="Available Bins">
                                    {warehouseBins.filter(b => b.id !== lineItem.primaryBinId && b.currentQuantity > 0).map((bin) => (
                                      <option key={bin.id} value={bin.id}>
                                        Bin {bin.letterCode} ({Math.round((bin.currentQuantity / bin.maxCapacity) * 100)}% full)
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-[var(--muted-foreground)]">Qty:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={lineItem.receivedQty - lineItem.damagedQty}
                                    value={assignment.quantity}
                                    onChange={(e) => {
                                      const updated = lineItem.binAssignments.map(ba =>
                                        ba.id === assignment.id ? { ...ba, quantity: parseInt(e.target.value) || 0 } : ba
                                      );
                                      handleUpdateLineItem(lineItem.id, { binAssignments: updated });
                                    }}
                                    className="w-20 px-2 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                                  />
                                </div>
                                {/* Remove button (only for non-primary) */}
                                {!assignment.isPrimary && (
                                  <button
                                    onClick={() => {
                                      const updated = lineItem.binAssignments.filter(ba => ba.id !== assignment.id);
                                      handleUpdateLineItem(lineItem.id, { binAssignments: updated });
                                    }}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="18" y1="6" x2="6" y2="18"/>
                                      <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Add Another Location Button */}
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                const newAssignment: BinAssignment = {
                                  id: `ba-${Date.now()}`,
                                  binId: '',
                                  quantity: 0,
                                  isPrimary: false,
                                };
                                handleUpdateLineItem(lineItem.id, {
                                  binAssignments: [...lineItem.binAssignments, newAssignment],
                                });
                              }}
                              className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                              Add Another Location
                            </button>

                            {/* Confirm Put-Away Button */}
                            <button
                              onClick={() => {
                                // Validate all assignments have bins and total equals received
                                const totalAssigned = lineItem.binAssignments.reduce((sum, ba) => sum + ba.quantity, 0);
                                const expectedTotal = lineItem.receivedQty - lineItem.damagedQty;
                                if (totalAssigned !== expectedTotal) {
                                  alert(`Total assigned (${totalAssigned}) must equal received quantity (${expectedTotal})`);
                                  return;
                                }
                                if (lineItem.binAssignments.some(ba => !ba.binId)) {
                                  alert('Please select a bin for all locations');
                                  return;
                                }
                                // Set the primary bin and verify
                                const primaryBin = lineItem.binAssignments.find(ba => ba.isPrimary);
                                handleUpdateLineItem(lineItem.id, {
                                  binId: primaryBin?.binId || lineItem.binAssignments[0]?.binId || '',
                                });
                                handleVerifyItem(lineItem.id);
                              }}
                              disabled={
                                lineItem.verified ||
                                lineItem.binAssignments.length === 0 ||
                                lineItem.binAssignments.some(ba => !ba.binId)
                              }
                              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                lineItem.verified
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {lineItem.verified ? (
                                  <path d="M20 6L9 17l-5-5"/>
                                ) : (
                                  <>
                                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                                  </>
                                )}
                              </svg>
                              {lineItem.verified ? 'Verified' : 'Verify Item'}
                            </button>
                          </div>

                          {/* Warning if quantities don't match */}
                          {(() => {
                            const totalAssigned = lineItem.binAssignments.reduce((sum, ba) => sum + ba.quantity, 0);
                            const expectedTotal = lineItem.receivedQty - lineItem.damagedQty;
                            if (totalAssigned !== expectedTotal && lineItem.binAssignments.length > 0) {
                              return (
                                <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                                    <line x1="12" y1="9" x2="12" y2="13"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                                  </svg>
                                  <span>
                                    Assigned quantity ({totalAssigned}) does not match received quantity ({expectedTotal}).
                                    {totalAssigned < expectedTotal
                                      ? ` ${expectedTotal - totalAssigned} units remaining.`
                                      : ` ${totalAssigned - expectedTotal} units over-assigned.`}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
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

        <PackingSlipSection
          displayStatus={displayStatus}
          packingSlipCaptured={packingSlipCaptured}
          packingSlipInputMode={packingSlipInputMode}
          packingSlipImage={packingSlipImage}
          isProcessingPackingSlip={isProcessingPackingSlip}
          packingSlipLineItems={packingSlipLineItems}
          packingSlipDiscrepancies={packingSlipDiscrepancies}
          onCameraCapture={handleCameraCapture}
          onImageUpload={handlePackingSlipImageUpload}
          onClearPackingSlip={handleClearPackingSlip}
          setPackingSlipInputMode={setPackingSlipInputMode}
          setPackingSlipCaptured={setPackingSlipCaptured}
          setPackingSlipLineItems={setPackingSlipLineItems}
          setPackingSlipDiscrepancies={setPackingSlipDiscrepancies}
          onAddPackingSlipLine={handleAddPackingSlipLine}
        />

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
                          {ps.lineItemIds.length > 0 && ` • ${ps.lineItemIds.length} items`}
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
            onAddDocument={handleAddDocument}
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

