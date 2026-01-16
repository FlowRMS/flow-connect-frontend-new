'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  mapDeliveryToShipment,
  mapIssueFromDelivery,
  mapRecurringShipment,
} from '../api';
import {
  useCreateDelivery,
  useCreateDeliveryItem,
  useCreateDeliveryStatusHistory,
  useCreateRecurringShipment,
  useUpdateDelivery,
  useUpdateRecurringShipment,
  useWarehouseDeliveries,
  useWarehouseLookups,
  useWarehouseRecurringShipments,
  warehouseDeliveriesQueryKeys,
} from '../../api/useWarehouseDeliveriesApi';
import {
  IncomingShipment,
  shipmentStatusColors,
  shipmentStatusLabels,
  ShipmentStatus,
  RecurringShipment,
  DeliveryIssue,
} from '@/lib/types/warehouse';
import { calculateNextDate, formatDateOnly, parseDateInput } from '../utils/recurrence';
import ReceiveShipmentModal from '../../modals/ReceiveShipmentModal';
import CreateShipmentRecordModal, { ShipmentRecord } from '../../modals/CreateShipmentRecordModal';
import ShipmentDetailModal from '../../modals/ShipmentDetailModal';
import ShipmentTypeSelectionModal, { ShipmentCreationType } from '../../modals/ShipmentTypeSelectionModal';
import WarehouseSelector from '../../WarehouseSelector';
import { useWarehouse } from '../../WarehouseContext';
import RecurringShipmentsContent from '../recurring/RecurringShipmentsContent';
import DeliveryIssuesTabContent from '../issues/DeliveryIssuesTabContent';
import DeliveriesCalendarView from '../calendar/DeliveriesCalendarView';
import RecurringShipmentDetailModal from '../../modals/RecurringShipmentDetailModal';
import {
  DateRangeFilterDropdown,
  MultiSelectFilterDropdown,
  SortIcon,
  TextFilterDropdown,
  type DeliverySortField,
  type SortDirection,
} from './DeliveryFilters';
import { useQueryClient } from '@tanstack/react-query';

type ViewMode = 'table' | 'cards';

// Statuses that workers can see (released = PENDING/CONFIRMED and beyond, not DRAFT)
const WORKER_VISIBLE_STATUSES: ShipmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'ARRIVED',
  'RECEIVING',
  'RECEIVED',
];

// Column filter types
interface DeliveryColumnFilters {
  poNumber: string;
  vendorName: string[];
  status: string[];
  dateRange: { start: string; end: string };
}

// Carrier tracking URLs
const carrierTrackingUrls: Record<string, string> = {
  'UPS': 'https://www.ups.com/track?tracknum=',
  'FedEx': 'https://www.fedex.com/fedextrack/?trknbr=',
  'USPS': 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  'DHL': 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
};

export default function WarehouseDeliveriesContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedWarehouse, isWorkerView, isManagerView, warehouses } = useWarehouse();
  const [activeTab, setActiveTab] = useState<'deliveries' | 'recurring' | 'issues' | 'calendar'>('deliveries');
  const { warehousesQuery, carriersQuery, vendorsQuery } = useWarehouseLookups();
  const deliveriesQuery = useWarehouseDeliveries(selectedWarehouse?.id || null, { includeIssues: false, enabled: !!selectedWarehouse });
  const recurringQuery = useWarehouseRecurringShipments(selectedWarehouse?.id || null, !!selectedWarehouse);
  const issuesDeliveriesQuery = useWarehouseDeliveries(selectedWarehouse?.id || null, {
    includeIssues: true,
    enabled: activeTab === 'issues' && !!selectedWarehouse,
  });
  const [selectedRecurringForModal, setSelectedRecurringForModal] = useState<RecurringShipment | null>(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [selectedShipment, setSelectedShipment] = useState<IncomingShipment | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showTypeSelectionModal, setShowTypeSelectionModal] = useState(false);
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [createRecordInitialStatus, setCreateRecordInitialStatus] = useState<ShipmentStatus | undefined>(undefined);
  const [isCreatingDelivery, setIsCreatingDelivery] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [quickStatusUpdate, setQuickStatusUpdate] = useState<{ id: string; status: ShipmentStatus } | null>(null);
  const [shipments, setShipments] = useState<IncomingShipment[]>([]);
  const [recurringShipments, setRecurringShipments] = useState<RecurringShipment[]>([]);
  const [deliveryIssues, setDeliveryIssues] = useState<DeliveryIssue[]>([]);
  const [carrierLookups, setCarrierLookups] = useState<Array<{ id: string; name: string; trackingUrlTemplate?: string | null }>>([]);
  const [factoryLookups, setFactoryLookups] = useState<Array<{ id: string; title: string; email?: string | null }>>([]);
  const [warehouseLookups, setWarehouseLookups] = useState<Array<{ id: string; name: string }>>([]);

  // Sorting state
  const [sortField, setSortField] = useState<DeliverySortField>('eta');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Column filters state
  const [columnFilters, setColumnFilters] = useState<DeliveryColumnFilters>({
    poNumber: '',
    vendorName: [],
    status: [],
    dateRange: { start: '', end: '' },
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const createDeliveryMutation = useCreateDelivery();
  const createDeliveryItemMutation = useCreateDeliveryItem();
  const createDeliveryStatusHistoryMutation = useCreateDeliveryStatusHistory();
  const updateDeliveryMutation = useUpdateDelivery();
  const createRecurringShipmentMutation = useCreateRecurringShipment();
  const updateRecurringShipmentMutation = useUpdateRecurringShipment();

  const factories = useMemo(() => {
    const uniqueFactories = new Map<string, { id: string; name: string }>();
    factoryLookups.forEach((factory) => {
      if (!uniqueFactories.has(factory.id)) {
        uniqueFactories.set(factory.id, { id: factory.id, name: factory.title });
      }
    });
    return Array.from(uniqueFactories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [factoryLookups]);

  const resolveWarehouseName = useCallback((warehouseId?: string) => {
    if (!warehouseId) return undefined;
    return warehouseLookups.find((warehouse) => warehouse.id === warehouseId)?.name;
  }, [warehouseLookups]);

  const resolveVendorName = useCallback((vendorId?: string) => {
    if (!vendorId) return undefined;
    return factoryLookups.find((factory) => factory.id === vendorId)?.title;
  }, [factoryLookups]);

  const isLoading =
    deliveriesQuery.isLoading ||
    recurringQuery.isLoading ||
    warehousesQuery.isLoading ||
    carriersQuery.isLoading;
  const loadError = deliveriesQuery.error ? deliveriesQuery.error.message : null;
  const isIssuesLoading = issuesDeliveriesQuery.isLoading;

  const updateRecurringState = useCallback((
    shipmentId: string,
    updates: Partial<RecurringShipment>
  ) => {
    setRecurringShipments((prev) =>
      prev.map((shipment) => {
        if (shipment.id !== shipmentId) return shipment;

        const nextVendorId = updates.vendorId ?? shipment.vendorId;
        const nextWarehouseId = updates.warehouseId ?? shipment.warehouseId;

        return {
          ...shipment,
          ...updates,
          vendorId: nextVendorId,
          vendorName: resolveVendorName(nextVendorId) || shipment.vendorName,
          warehouseId: nextWarehouseId,
          warehouseName: resolveWarehouseName(nextWarehouseId) || shipment.warehouseName,
          recurrencePattern: updates.recurrencePattern || shipment.recurrencePattern,
          expectedItems: updates.expectedItems || shipment.expectedItems,
        };
      })
    );

    setSelectedRecurringForModal((prev) => {
      if (!prev || prev.id !== shipmentId) return prev;
      return {
        ...prev,
        ...updates,
        vendorId: updates.vendorId ?? prev.vendorId,
        vendorName: resolveVendorName(updates.vendorId ?? prev.vendorId) || prev.vendorName,
        warehouseId: updates.warehouseId ?? prev.warehouseId,
        warehouseName: resolveWarehouseName(updates.warehouseId ?? prev.warehouseId) || prev.warehouseName,
        recurrencePattern: updates.recurrencePattern || prev.recurrencePattern,
        expectedItems: updates.expectedItems || prev.expectedItems,
      };
    });
  }, [resolveVendorName, resolveWarehouseName]);

  useEffect(() => {
    if (!selectedWarehouse) {
      setShipments([]);
      setFactoryLookups([]);
      setWarehouseLookups([]);
      setCarrierLookups([]);
      return;
    }

    const deliveriesData = deliveriesQuery.data || [];
    const warehouseSource = warehousesQuery.data && warehousesQuery.data.length > 0
      ? warehousesQuery.data
      : (selectedWarehouse ? [selectedWarehouse] : []);
    const warehouseEntries = warehouseSource.map((warehouse) => ({ id: warehouse.id, name: warehouse.name }));
    const carriersData = carriersQuery.data || [];

    const vendors = deliveriesData
      .map((delivery) => delivery.vendor)
      .filter(Boolean) as Array<{ id: string; title: string; email?: string | null }>;

    const warehouseMap = new Map(warehouseSource.map((warehouse) => [warehouse.id, warehouse]));
    const carrierMap = new Map(carriersData.map((carrier) => [carrier.id, carrier]));
    const factoryMap = new Map(vendors.map((vendor) => [vendor.id, vendor]));
    const mappedShipments = deliveriesData.map((delivery) =>
      mapDeliveryToShipment(delivery, warehouseMap, factoryMap, carrierMap)
    );

    setCarrierLookups(carriersData);
    setFactoryLookups(vendors);
    setWarehouseLookups(warehouseEntries);
    setShipments(mappedShipments);
  }, [selectedWarehouse, deliveriesQuery.data, carriersQuery.data, warehousesQuery.data]);

  useEffect(() => {
    if (!selectedWarehouse) {
      setRecurringShipments([]);
      return;
    }

    const recurringData = recurringQuery.data || [];
    const warehouseSource = warehousesQuery.data && warehousesQuery.data.length > 0
      ? warehousesQuery.data
      : (selectedWarehouse ? [selectedWarehouse] : []);
    const vendorsSource = vendorsQuery.data && vendorsQuery.data.length > 0
      ? vendorsQuery.data
      : factoryLookups;
    const warehouseMap = new Map(warehouseSource.map((warehouse) => [warehouse.id, warehouse]));
    const factoryMap = new Map(
      vendorsSource.map((vendor) => [vendor.id, vendor])
    );

    const mappedRecurring = recurringData.map((recurring) =>
      mapRecurringShipment(recurring, warehouseMap, factoryMap)
    );
    setRecurringShipments(mappedRecurring);
  }, [selectedWarehouse, recurringQuery.data, warehousesQuery.data, vendorsQuery.data, factoryLookups]);

  useEffect(() => {
    if (!selectedWarehouse || activeTab !== 'issues') {
      setDeliveryIssues([]);
      return;
    }

    const deliveriesData = issuesDeliveriesQuery.data || [];
    const warehouseSource = warehousesQuery.data && warehousesQuery.data.length > 0
      ? warehousesQuery.data
      : (selectedWarehouse ? [selectedWarehouse] : []);
    const warehouseMap = new Map(warehouseSource.map((warehouse) => [warehouse.id, warehouse]));
    const factoryMap = new Map(factoryLookups.map((vendor) => [vendor.id, vendor]));
    const mappedIssues = deliveriesData.flatMap((delivery) =>
      (delivery.issues || []).map((issue) => mapIssueFromDelivery(issue, delivery, warehouseMap, factoryMap))
    );
    setDeliveryIssues(mappedIssues);
  }, [activeTab, selectedWarehouse, issuesDeliveriesQuery.data, warehousesQuery.data, factoryLookups]);

  // Get unique values for filters
  const uniqueVendors = useMemo(() => {
    return [...new Set(shipments.map(s => s.vendorName))].sort();
  }, [shipments]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(shipments.map(s => s.status))];
  }, [shipments]);

  // Handle sorting
  const handleSort = (field: DeliverySortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredShipments = useMemo(() => {
    let result = shipments;

    // For workers, only show released deliveries (CONFIRMED and beyond)
    if (isWorkerView) {
      result = result.filter(shipment => WORKER_VISIBLE_STATUSES.includes(shipment.status));
    }

    result = result.filter(shipment => {
      const matchesSearch =
        shipment.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shipment.trackingNumber && shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
      const matchesVendor = vendorFilter === 'all' || shipment.vendorId === vendorFilter;
      return matchesSearch && matchesStatus && matchesVendor;
    });

    // Apply column filters
    if (columnFilters.poNumber) {
      const query = columnFilters.poNumber.toLowerCase();
      result = result.filter(s => s.poNumber.toLowerCase().includes(query));
    }

    if (columnFilters.vendorName.length > 0) {
      result = result.filter(s => columnFilters.vendorName.includes(s.vendorName));
    }

    if (columnFilters.status.length > 0) {
      result = result.filter(s => columnFilters.status.includes(s.status));
    }

    if (columnFilters.dateRange.start || columnFilters.dateRange.end) {
      result = result.filter(s => {
        const date = new Date(s.eta);
        if (columnFilters.dateRange.start && date < new Date(columnFilters.dateRange.start)) {
          return false;
        }
        if (columnFilters.dateRange.end && date > new Date(columnFilters.dateRange.end)) {
          return false;
        }
        return true;
      });
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'poNumber':
          comparison = a.poNumber.localeCompare(b.poNumber);
          break;
        case 'vendorName':
          comparison = a.vendorName.localeCompare(b.vendorName);
          break;
        case 'itemCount':
          comparison = a.itemCount - b.itemCount;
          break;
        case 'eta':
          comparison = new Date(a.eta).getTime() - new Date(b.eta).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [shipments, searchTerm, statusFilter, vendorFilter, columnFilters, sortField, sortDirection, isWorkerView]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleReceive = (shipment: IncomingShipment) => {
    setSelectedShipment(shipment);
    setShowDetailModal(false);
    setShowReceiveModal(true);
    setShowQuickActions(null);
  };

  const handleViewDetails = (shipment: IncomingShipment) => {
    // Navigate to the receiving detail page
    router.push(`/warehouse/deliveries/${shipment.id}`);
    setShowQuickActions(null);
  };

  const handleShipmentTypeSelect = (type: ShipmentCreationType) => {
    setShowTypeSelectionModal(false);
    setCreateRecordInitialStatus(type === 'arriving' ? 'ARRIVED' : 'DRAFT');
    setShowCreateRecordModal(true);
  };

  const handleOpenCreateExpected = () => {
    setShowCreateDropdown(false);
    setCreateRecordInitialStatus('DRAFT');
    setShowCreateRecordModal(true);
  };

  const handleOpenCreateArriving = () => {
    setShowCreateDropdown(false);
    setCreateRecordInitialStatus('ARRIVED');
    setShowCreateRecordModal(true);
  };

  const handleCreateRecord = useCallback(async (record: ShipmentRecord) => {
    const carrierId = carrierLookups.find((carrier) => carrier.name === record.carrier)?.id;
    const expectedDate = record.eta ? record.eta.split('T')[0] : null;

    setIsCreatingDelivery(true);
    try {
      const delivery = await createDeliveryMutation.mutateAsync({
        poNumber: record.poNumber,
        warehouseId: record.warehouseId,
        vendorId: record.vendorId,
        carrierId: carrierId || null,
        trackingNumber: record.trackingNumber || null,
        status: record.status,
        expectedDate,
        vendorContactName: record.vendorContact || null,
        vendorContactEmail: record.vendorEmail || null,
        notes: record.notes || null,
      });

      await Promise.all(
        record.items.map((item) =>
          createDeliveryItemMutation.mutateAsync({
            deliveryId: delivery.id,
            productId: item.productId,
            expectedQuantity: item.expectedQuantity,
            receivedQuantity: 0,
            damagedQuantity: 0,
            status: 'PENDING',
          })
        )
      );

      await createDeliveryStatusHistoryMutation.mutateAsync({
        deliveryId: delivery.id,
        status: record.status,
        timestamp: null,
        userId: null,
        note: 'Delivery created',
      });

      setShowCreateRecordModal(false);
      setCreateRecordInitialStatus(undefined);

      router.push(`/warehouse/deliveries/${delivery.id}`);
    } catch (error) {
      console.error('Failed to create delivery record', error);
    } finally {
      setIsCreatingDelivery(false);
    }
  }, [carrierLookups, createDeliveryMutation, createDeliveryItemMutation, createDeliveryStatusHistoryMutation, router]);

  const handleUpdateShipmentStatus = useCallback(async (status: ShipmentStatus) => {
    if (!selectedShipment) return;
    try {
      await updateDeliveryMutation.mutateAsync({
        id: selectedShipment.id,
        input: {
          poNumber: selectedShipment.poNumber,
          warehouseId: selectedShipment.warehouseId,
          vendorId: selectedShipment.vendorId,
          status,
          expectedDate: selectedShipment.eta ? selectedShipment.eta.split('T')[0] : null,
          trackingNumber: selectedShipment.trackingNumber || null,
          vendorContactName: selectedShipment.vendorContact || null,
          vendorContactEmail: selectedShipment.vendorEmail || null,
          notes: selectedShipment.notes || null,
        },
      });
      await createDeliveryStatusHistoryMutation.mutateAsync({
        deliveryId: selectedShipment.id,
        status,
        timestamp: null,
        userId: null,
        note: 'Status updated',
      });
    } catch (error) {
      console.error('Failed to update delivery status', error);
    }
  }, [selectedShipment, updateDeliveryMutation, createDeliveryStatusHistoryMutation]);

  const handleQuickStatusUpdate = useCallback(async (shipmentId: string, status: ShipmentStatus) => {
    const shipment = shipments.find((item) => item.id === shipmentId);
    if (!shipment) return;
    const previousStatus = shipment.status;
    setQuickStatusUpdate({ id: shipmentId, status });
    setShipments((prev) =>
      prev.map((item) => (item.id === shipmentId ? { ...item, status } : item))
    );
    try {
      await updateDeliveryMutation.mutateAsync({
        id: shipmentId,
        input: {
          poNumber: shipment.poNumber,
          warehouseId: shipment.warehouseId,
          vendorId: shipment.vendorId,
          status,
          expectedDate: shipment.eta ? shipment.eta.split('T')[0] : null,
          trackingNumber: shipment.trackingNumber || null,
          vendorContactName: shipment.vendorContact || null,
          vendorContactEmail: shipment.vendorEmail || null,
          notes: shipment.notes || null,
        },
      });
      await createDeliveryStatusHistoryMutation.mutateAsync({
        deliveryId: shipmentId,
        status,
        timestamp: null,
        userId: null,
        note: 'Quick status update',
      });
    } catch (error) {
      setShipments((prev) =>
        prev.map((item) => (item.id === shipmentId ? { ...item, status: previousStatus } : item))
      );
      console.error('Failed to update delivery status', error);
    } finally {
      setQuickStatusUpdate((prev) => (prev?.id === shipmentId ? null : prev));
      setShowQuickActions(null);
    }
  }, [shipments, updateDeliveryMutation, createDeliveryStatusHistoryMutation]);

  const handleReceiveComplete = useCallback(async () => {
    if (!selectedShipment) return;
    try {
      await updateDeliveryMutation.mutateAsync({
        id: selectedShipment.id,
        input: {
          poNumber: selectedShipment.poNumber,
          warehouseId: selectedShipment.warehouseId,
          vendorId: selectedShipment.vendorId,
          status: 'RECEIVED',
          expectedDate: selectedShipment.eta ? selectedShipment.eta.split('T')[0] : null,
          trackingNumber: selectedShipment.trackingNumber || null,
          vendorContactName: selectedShipment.vendorContact || null,
          vendorContactEmail: selectedShipment.vendorEmail || null,
          notes: selectedShipment.notes || null,
        },
      });
    } catch (error) {
      console.error('Failed to complete receiving', error);
    } finally {
      setShowReceiveModal(false);
      setSelectedShipment(null);
    }
  }, [selectedShipment, updateDeliveryMutation]);

  const getTrackingUrl = (carrier: string | undefined, trackingNumber: string | undefined) => {
    if (!carrier || !trackingNumber) return null;
    const baseUrl = carrierTrackingUrls[carrier];
    return baseUrl ? `${baseUrl}${trackingNumber}` : null;
  };

  const getEtaStatus = (eta: string, status: ShipmentStatus) => {
    if (status === 'RECEIVED') return null;
    const etaDate = new Date(eta);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    etaDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((etaDate.getTime() - today.getTime()) / 86400000);

    if (diffDays < 0) return { label: 'Overdue', color: 'text-red-600 bg-red-50' };
    if (diffDays === 0) return { label: 'Today', color: 'text-green-600 bg-green-50' };
    if (diffDays === 1) return { label: 'Tomorrow', color: 'text-blue-600 bg-blue-50' };
    return null;
  };

  if (isLoading && activeTab === 'deliveries' && selectedWarehouse) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading deliveries...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)]">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Deliveries & Receiving</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Track incoming deliveries and receive inventory
            </p>
          </div>
          <div className="flex items-center gap-3">
            <WarehouseSelector />
            {/* Split button with dropdown for create shipment - Only visible to managers */}
            {isManagerView && (
              <div className="relative flex">
                <button
                  onClick={() => setShowTypeSelectionModal(true)}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-l-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                  Create Delivery Record
                </button>
                <button
                  onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                  className="px-2 py-2 bg-[var(--primary)] text-white rounded-r-lg hover:bg-[var(--primary-hover)] transition-colors border-l border-white/20"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {showCreateDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCreateDropdown(false)} />
                    <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--card)] rounded-lg border border-[var(--border)] shadow-lg z-20 py-1">
                      <button
                        onClick={handleOpenCreateExpected}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-[var(--foreground)]">Expected in Future</div>
                          <div className="text-xs text-[var(--muted-foreground)]">Schedule expected delivery</div>
                        </div>
                      </button>
                      <button
                        onClick={handleOpenCreateArriving}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-[var(--foreground)]">Arriving Now</div>
                          <div className="text-xs text-[var(--muted-foreground)]">Start receiving immediately</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {loadError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}
        {isLoading && activeTab === 'deliveries' && (
          <div className="mb-6 flex min-h-[320px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4" />
              <p className="text-sm text-[var(--muted-foreground)]">Loading deliveries...</p>
            </div>
          </div>
        )}

        {/* Tabs - Recurring tab only visible to managers */}
        <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === 'deliveries'
                ? 'text-[var(--primary)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              Deliveries
            </div>
            {activeTab === 'deliveries' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
            )}
          </button>
          {isManagerView && (
            <button
              onClick={() => setActiveTab('recurring')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === 'recurring'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 1l4 4-4 4"/>
                  <path d="M3 11V9a4 4 0 014-4h14"/>
                  <path d="M7 23l-4-4 4-4"/>
                  <path d="M21 13v2a4 4 0 01-4 4H3"/>
                </svg>
                Recurring
              </div>
              {activeTab === 'recurring' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          )}
          {isManagerView && (
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === 'issues'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Delivery Issues
              </div>
              {activeTab === 'issues' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          )}
          {isManagerView && (
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === 'calendar'
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Calendar
              </div>
              {activeTab === 'calendar' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'recurring' ? (
          <RecurringShipmentsContent
            recurringShipments={recurringShipments}
            deliveries={shipments}
            onCreateRecurring={async (data) => {
              try {
                const recurrencePattern = {
                  ...data.recurrencePattern,
                  expectedItems: data.expectedItems,
                };
                const startDate = parseDateInput(data.startDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expectedDate = startDate >= today
                  ? startDate
                  : calculateNextDate(data.recurrencePattern, startDate);
                const expectedDateIso = formatDateOnly(expectedDate);

                const recurring = await createRecurringShipmentMutation.mutateAsync({
                  name: data.name,
                  vendorId: data.vendorId,
                  warehouseId: data.warehouseId,
                  recurrencePattern,
                  startDate: data.startDate.split('T')[0],
                  endDate: data.endDate ? data.endDate.split('T')[0] : null,
                  vendorContactName: data.vendorContact || null,
                  vendorContactEmail: data.vendorEmail || null,
                  carrier: data.carrier || null,
                  notes: data.notes || null,
                  status: data.status,
                  nextExpectedDate: expectedDateIso,
                });

                const carrierId = carrierLookups.find((carrier) => carrier.name === data.carrier)?.id;
                const delivery = await createDeliveryMutation.mutateAsync({
                  poNumber: `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
                  warehouseId: data.warehouseId,
                  vendorId: data.vendorId,
                  carrierId: carrierId || null,
                  trackingNumber: null,
                  status: 'PENDING',
                  expectedDate: expectedDateIso,
                  vendorContactName: data.vendorContact || null,
                  vendorContactEmail: data.vendorEmail || null,
                  notes: data.notes || null,
                  recurringShipmentId: recurring.id,
                });

                await Promise.all(
                  data.expectedItems.map((item) =>
                    createDeliveryItemMutation.mutateAsync({
                      deliveryId: delivery.id,
                      productId: item.productId,
                      expectedQuantity: item.expectedQuantity,
                      receivedQuantity: 0,
                      damagedQuantity: 0,
                      status: 'PENDING',
                    })
                  )
                );

                await createDeliveryStatusHistoryMutation.mutateAsync({
                  deliveryId: delivery.id,
                  status: 'PENDING',
                  timestamp: null,
                  userId: null,
                  note: 'Generated from recurring shipment',
                });

                const nextDate = calculateNextDate(data.recurrencePattern, expectedDate);
                await updateRecurringShipmentMutation.mutateAsync({
                  id: recurring.id,
                  input: {
                    name: data.name,
                    vendorId: data.vendorId,
                    warehouseId: data.warehouseId,
                    recurrencePattern,
                    startDate: data.startDate.split('T')[0],
                    endDate: data.endDate ? data.endDate.split('T')[0] : null,
                    vendorContactName: data.vendorContact || null,
                    vendorContactEmail: data.vendorEmail || null,
                    carrier: data.carrier || null,
                    notes: data.notes || null,
                    status: data.status,
                    lastGeneratedDate: expectedDateIso,
                    nextExpectedDate: formatDateOnly(nextDate),
                  },
                });
                queryClient.invalidateQueries({ queryKey: warehouseDeliveriesQueryKeys.all });
              } catch (error) {
                console.error('Failed to create recurring shipment', error);
              }
            }}
            onUpdateRecurring={async (id, updates) => {
              const current = recurringShipments.find((shipment) => shipment.id === id);
              if (!current) return;
              try {
                const recurrencePattern = {
                  ...(updates.recurrencePattern || current.recurrencePattern),
                  expectedItems: updates.expectedItems || current.expectedItems,
                };
                await updateRecurringShipmentMutation.mutateAsync({
                  id,
                  input: {
                    name: updates.name || current.name,
                    vendorId: updates.vendorId || current.vendorId,
                    warehouseId: updates.warehouseId || current.warehouseId,
                    recurrencePattern,
                    startDate: (updates.startDate || current.startDate).split('T')[0],
                    endDate: updates.endDate ? updates.endDate.split('T')[0] : current.endDate || null,
                    vendorContactName: updates.vendorContact || current.vendorContact || null,
                    vendorContactEmail: updates.vendorEmail || current.vendorEmail || null,
                    carrier: updates.carrier || current.carrier || null,
                    notes: updates.notes || current.notes || null,
                    status: updates.status || current.status,
                    nextExpectedDate: updates.nextExpectedDate || current.nextExpectedDate || null,
                  },
                });
                updateRecurringState(id, {
                  ...updates,
                  recurrencePattern,
                  expectedItems: updates.expectedItems || current.expectedItems,
                });
                queryClient.invalidateQueries({ queryKey: warehouseDeliveriesQueryKeys.recurring(selectedWarehouse?.id || null) });
              } catch (error) {
                console.error('Failed to update recurring shipment', error);
              }
            }}
            onToggleStatus={async (recurring, status) => {
              try {
                const recurrencePattern = {
                  ...recurring.recurrencePattern,
                  expectedItems: recurring.expectedItems,
                };
                await updateRecurringShipmentMutation.mutateAsync({
                  id: recurring.id,
                  input: {
                    name: recurring.name,
                    vendorId: recurring.vendorId,
                    warehouseId: recurring.warehouseId,
                    recurrencePattern,
                    startDate: recurring.startDate,
                    endDate: recurring.endDate || null,
                    vendorContactName: recurring.vendorContact || null,
                    vendorContactEmail: recurring.vendorEmail || null,
                    carrier: recurring.carrier || null,
                    notes: recurring.notes || null,
                    status,
                    nextExpectedDate: recurring.nextExpectedDate || null,
                  },
                });
                updateRecurringState(recurring.id, { status });
                queryClient.invalidateQueries({ queryKey: warehouseDeliveriesQueryKeys.recurring(selectedWarehouse?.id || null) });
              } catch (error) {
                console.error('Failed to toggle recurring shipment', error);
              }
            }}
            onCancel={async (recurring) => {
              try {
                const recurrencePattern = {
                  ...recurring.recurrencePattern,
                  expectedItems: recurring.expectedItems,
                };
                await updateRecurringShipmentMutation.mutateAsync({
                  id: recurring.id,
                  input: {
                    name: recurring.name,
                    vendorId: recurring.vendorId,
                    warehouseId: recurring.warehouseId,
                    recurrencePattern,
                    startDate: recurring.startDate,
                    endDate: recurring.endDate || null,
                    vendorContactName: recurring.vendorContact || null,
                    vendorContactEmail: recurring.vendorEmail || null,
                    carrier: recurring.carrier || null,
                    notes: recurring.notes || null,
                    status: 'CANCELLED',
                    nextExpectedDate: recurring.nextExpectedDate || null,
                  },
                });
                updateRecurringState(recurring.id, { status: 'CANCELLED' });
                queryClient.invalidateQueries({ queryKey: warehouseDeliveriesQueryKeys.recurring(selectedWarehouse?.id || null) });
              } catch (error) {
                console.error('Failed to cancel recurring shipment', error);
              }
            }}
          />
        ) : activeTab === 'issues' ? (
          <DeliveryIssuesTabContent deliveryIssues={deliveryIssues} isLoading={isIssuesLoading} />
        ) : activeTab === 'calendar' ? (
          <DeliveriesCalendarView
            deliveries={shipments}
            recurringShipments={recurringShipments}
            onViewRecurring={(recurring) => {
              setSelectedRecurringForModal(recurring);
              setShowRecurringModal(true);
            }}
          />
        ) : (
          <>
            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search by PO, tracking, or vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-transparent text-sm focus:outline-none border-b border-[var(--border)] focus:border-[var(--primary)]"
                />
              </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | 'all')}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ARRIVED">Arrived</option>
            <option value="RECEIVING">Receiving</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="all">All Vendors</option>
            {factories.map((factory) => (
              <option key={factory.id} value={factory.id}>
                {factory.name}
              </option>
            ))}
          </select>

          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 ${viewMode === 'table' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--background)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'}`}
              title="Table view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 ${viewMode === 'cards' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--background)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'}`}
              title="Card view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Deliveries Table or Cards */}
        {viewMode === 'table' ? (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Incoming Deliveries
                <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">
                  ({filteredShipments.length})
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center">
                        <button onClick={() => handleSort('poNumber')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                          Delivery<SortIcon field="poNumber" currentSortField={sortField} currentSortDirection={sortDirection} />
                        </button>
                        <TextFilterDropdown value={columnFilters.poNumber} onChange={(value) => setColumnFilters(prev => ({ ...prev, poNumber: value }))} placeholder="Search PO#..." isOpen={openFilter === 'poNumber'} onToggle={() => setOpenFilter(openFilter === 'poNumber' ? null : 'poNumber')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center">
                        <button onClick={() => handleSort('vendorName')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                          Vendor<SortIcon field="vendorName" currentSortField={sortField} currentSortDirection={sortDirection} />
                        </button>
                        <MultiSelectFilterDropdown options={uniqueVendors} value={columnFilters.vendorName} onChange={(value) => setColumnFilters(prev => ({ ...prev, vendorName: value }))} isOpen={openFilter === 'vendorName'} onToggle={() => setOpenFilter(openFilter === 'vendorName' ? null : 'vendorName')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <button onClick={() => handleSort('itemCount')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                          Items<SortIcon field="itemCount" currentSortField={sortField} currentSortDirection={sortDirection} />
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center">
                        <button onClick={() => handleSort('eta')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                          ETA<SortIcon field="eta" currentSortField={sortField} currentSortDirection={sortDirection} />
                        </button>
                        <DateRangeFilterDropdown value={columnFilters.dateRange} onChange={(value) => setColumnFilters(prev => ({ ...prev, dateRange: value }))} isOpen={openFilter === 'dateRange'} onToggle={() => setOpenFilter(openFilter === 'dateRange' ? null : 'dateRange')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center">
                        <button onClick={() => handleSort('status')} className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors">
                          Status<SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection} />
                        </button>
                        <MultiSelectFilterDropdown options={uniqueStatuses} value={columnFilters.status} onChange={(value) => setColumnFilters(prev => ({ ...prev, status: value }))} isOpen={openFilter === 'status'} onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')} renderLabel={(opt) => shipmentStatusLabels[opt as ShipmentStatus]} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredShipments.map((shipment) => {
                    const etaStatus = getEtaStatus(shipment.eta, shipment.status);
                    const trackingUrl = getTrackingUrl(shipment.carrier, shipment.trackingNumber);

                    return (
                      <tr
                        key={shipment.id}
                        className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(shipment)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-[var(--foreground)]">{shipment.poNumber}</div>
                          {shipment.trackingNumber && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {trackingUrl ? (
                                <a
                                  href={trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{shipment.carrier}: {shipment.trackingNumber}</span>
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              ) : (
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  {shipment.carrier && `${shipment.carrier}: `}{shipment.trackingNumber}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{shipment.vendorName}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-sm font-medium text-[var(--foreground)]">{shipment.itemCount}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">{shipment.expectedQuantity} units</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-[var(--foreground)]">{formatDate(shipment.eta)}</div>
                          {etaStatus && (
                            <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${etaStatus.color}`}>
                              {etaStatus.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${shipmentStatusColors[shipment.status]}`}>
                            {shipmentStatusLabels[shipment.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 relative">
                            {(shipment.status === 'ARRIVED' || shipment.status === 'RECEIVING') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReceive(shipment);
                                }}
                                className="px-2.5 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                              >
                                Receive
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(shipment);
                              }}
                              className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                              title="View Details"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowQuickActions(showQuickActions === shipment.id ? null : shipment.id);
                                }}
                                className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                                title="More actions"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="1"/>
                                  <circle cx="12" cy="5" r="1"/>
                                  <circle cx="12" cy="19" r="1"/>
                                </svg>
                              </button>
                              {showQuickActions === shipment.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--card)] rounded-lg border border-[var(--border)] shadow-lg z-10 py-1">
                                  {quickStatusUpdate?.id === shipment.id && (
                                    <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
                                      Updating status...
                                    </div>
                                  )}
                                  {shipment.status === 'PENDING' && (
                                    <button
                                      onClick={() => handleQuickStatusUpdate(shipment.id, 'CONFIRMED')}
                                      disabled={quickStatusUpdate?.id === shipment.id}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      {quickStatusUpdate?.id === shipment.id && quickStatusUpdate.status === 'CONFIRMED'
                                        ? 'Confirming...'
                                        : 'Mark as Confirmed'}
                                    </button>
                                  )}
                                  {shipment.status === 'CONFIRMED' && (
                                    <button
                                      onClick={() => handleQuickStatusUpdate(shipment.id, 'ARRIVED')}
                                      disabled={quickStatusUpdate?.id === shipment.id}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      {quickStatusUpdate?.id === shipment.id && quickStatusUpdate.status === 'ARRIVED'
                                        ? 'Marking as Arrived...'
                                        : 'Mark as Arrived'}
                                    </button>
                                  )}
                                  {shipment.status !== 'RECEIVED' && shipment.status !== 'CANCELLED' && (
                                    <button
                                      onClick={() => handleQuickStatusUpdate(shipment.id, 'CANCELLED')}
                                      disabled={quickStatusUpdate?.id === shipment.id}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      {quickStatusUpdate?.id === shipment.id && quickStatusUpdate.status === 'CANCELLED'
                                        ? 'Cancelling...'
                                        : 'Cancel Delivery'}
                                    </button>
                                  )}
                                  <hr className="my-1 border-[var(--border)]" />
                                  <button
                                    onClick={() => {
                                      handleViewDetails(shipment);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                                  >
                                    View Full Details
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredShipments.length === 0 && (
              <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                No deliveries found matching your criteria
              </div>
            )}
          </div>
        ) : (
          /* Card View */
          <div className="space-y-4">
            {filteredShipments.length === 0 ? (
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] px-6 py-12 text-center text-[var(--muted-foreground)]">
                No deliveries found matching your criteria
              </div>
            ) : (
              filteredShipments.map((shipment) => {
                const etaStatus = getEtaStatus(shipment.eta, shipment.status);
                const trackingUrl = getTrackingUrl(shipment.carrier, shipment.trackingNumber);

                return (
                  <div
                    key={shipment.id}
                    className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewDetails(shipment)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[var(--foreground)]">{shipment.poNumber}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${shipmentStatusColors[shipment.status]}`}>
                            {shipmentStatusLabels[shipment.status]}
                          </span>
                          {etaStatus && (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${etaStatus.color}`}>
                              {etaStatus.label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">{shipment.vendorName}</p>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {(shipment.status === 'ARRIVED' || shipment.status === 'RECEIVING') && (
                          <button
                            onClick={() => handleReceive(shipment)}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
                          >
                            Receive
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetails(shipment)}
                          className="px-3 py-1.5 border border-[var(--border)] text-sm font-medium rounded hover:bg-[var(--muted)] transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
                      <div>
                        <div className="text-xs text-[var(--muted-foreground)]">Items</div>
                        <div className="text-sm font-medium text-[var(--foreground)]">{shipment.itemCount} products</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--muted-foreground)]">Quantity</div>
                        <div className="text-sm font-medium text-[var(--foreground)]">{shipment.expectedQuantity} units</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--muted-foreground)]">ETA</div>
                        <div className="text-sm font-medium text-[var(--foreground)]">{formatDate(shipment.eta)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--muted-foreground)]">Carrier</div>
                        <div className="text-sm font-medium text-[var(--foreground)]">{shipment.carrier || '-'}</div>
                      </div>
                    </div>

                    {shipment.trackingNumber && (
                      <div className="mt-3 pt-3 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {trackingUrl ? (
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Track: {shipment.trackingNumber}
                            </a>
                          ) : (
                            <span className="text-sm text-[var(--muted-foreground)]">
                              Tracking: {shipment.trackingNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* Modals */}
      {showReceiveModal && selectedShipment && (
        <ReceiveShipmentModal
          shipment={selectedShipment}
          onClose={() => {
            setShowReceiveModal(false);
            setSelectedShipment(null);
          }}
          onComplete={handleReceiveComplete}
        />
      )}

      {showTypeSelectionModal && (
        <ShipmentTypeSelectionModal
          onClose={() => setShowTypeSelectionModal(false)}
          onSelect={handleShipmentTypeSelect}
        />
      )}

      {showCreateRecordModal && (
        <CreateShipmentRecordModal
          onClose={() => {
            setShowCreateRecordModal(false);
            setCreateRecordInitialStatus(undefined);
          }}
          onSubmit={handleCreateRecord}
          initialStatus={createRecordInitialStatus}
          isSubmitting={isCreatingDelivery}
          carriers={carrierLookups.map((carrier) => ({ id: carrier.id, name: carrier.name }))}
        />
      )}

      {showDetailModal && selectedShipment && (
        <ShipmentDetailModal
          shipment={selectedShipment}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedShipment(null);
          }}
          onReceive={() => handleReceive(selectedShipment)}
          onUpdateStatus={handleUpdateShipmentStatus}
        />
      )}

      {showRecurringModal && selectedRecurringForModal && (
        <RecurringShipmentDetailModal
          recurring={selectedRecurringForModal}
          linkedShipments={shipments.filter(
            (shipment) => shipment.recurringShipmentId === selectedRecurringForModal.id
          )}
          onClose={() => {
            setShowRecurringModal(false);
            setSelectedRecurringForModal(null);
          }}
          onPause={() => {
            // Toggling is handled in the Recurring tab content
            setShowRecurringModal(false);
            setSelectedRecurringForModal(null);
          }}
          onCancel={() => {
            setShowRecurringModal(false);
            setSelectedRecurringForModal(null);
          }}
          onSave={(updates) => {
            if (!selectedRecurringForModal) return;
            let nextExpectedDate = selectedRecurringForModal.nextExpectedDate;
            if (updates.recurrencePattern || updates.startDate) {
              const pattern = updates.recurrencePattern || selectedRecurringForModal.recurrencePattern;
              const startDate = updates.startDate || selectedRecurringForModal.startDate;
              nextExpectedDate = formatDateOnly(calculateNextDate(pattern, parseDateInput(startDate)));
            }
            updateRecurringShipmentMutation.mutateAsync({
              id: selectedRecurringForModal.id,
              input: {
                name: updates.name || selectedRecurringForModal.name,
                vendorId: updates.vendorId || selectedRecurringForModal.vendorId,
                warehouseId: updates.warehouseId || selectedRecurringForModal.warehouseId,
                recurrencePattern: updates.recurrencePattern || selectedRecurringForModal.recurrencePattern,
                startDate: (updates.startDate || selectedRecurringForModal.startDate).split('T')[0],
                endDate: updates.endDate ? updates.endDate.split('T')[0] : selectedRecurringForModal.endDate || null,
                vendorContactName: updates.vendorContact || selectedRecurringForModal.vendorContact || null,
                vendorContactEmail: updates.vendorEmail || selectedRecurringForModal.vendorEmail || null,
                carrier: updates.carrier || selectedRecurringForModal.carrier || null,
                notes: updates.notes || selectedRecurringForModal.notes || null,
                status: updates.status || selectedRecurringForModal.status,
                nextExpectedDate,
              },
            })
              .catch((error) => console.error('Failed to update recurring shipment', error))
              .finally(() => {
                setShowRecurringModal(false);
                setSelectedRecurringForModal(null);
              });
          }}
        />
      )}

      {/* Click outside handler for quick actions dropdown */}
      {showQuickActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowQuickActions(null)}
        />
      )}
    </main>
  );
}
