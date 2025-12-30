'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockIncomingShipments,
  mockWarehouses,
  getWarehouseFactories,
  addIncomingShipment,
  updateShipmentStatus,
  completeShipmentReceiving,
} from '@/lib/data/warehouse-mock';
import {
  IncomingShipment,
  shipmentStatusColors,
  shipmentStatusLabels,
  ShipmentStatus,
  RecurringShipment,
} from '@/lib/types/warehouse';
import { updateRecurringShipment, calculateNextDate, getShipmentsForRecurring } from '@/lib/data/warehouse-mock';
import ReceiveShipmentModal from './modals/ReceiveShipmentModal';
import CreateShipmentRecordModal, { ShipmentRecord } from './modals/CreateShipmentRecordModal';
import ShipmentDetailModal from './modals/ShipmentDetailModal';
import ShipmentTypeSelectionModal, { ShipmentCreationType } from './modals/ShipmentTypeSelectionModal';
import WarehouseSelector from './WarehouseSelector';
import { useWarehouse } from './WarehouseContext';
import RecurringShipmentsContent from './RecurringShipmentsContent';
import DeliveryIssuesTabContent from './DeliveryIssuesTabContent';
import DeliveriesCalendarView from './DeliveriesCalendarView';
import RecurringShipmentDetailModal from './modals/RecurringShipmentDetailModal';

type ViewMode = 'table' | 'cards';

// Statuses that workers can see (released = CONFIRMED and beyond, not DRAFT/PENDING)
const WORKER_VISIBLE_STATUSES: ShipmentStatus[] = [
  'CONFIRMED',
  'IN_TRANSIT',
  'ARRIVED',
  'RECEIVING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'RECEIVED',
];

// Sort types
type DeliverySortField = 'poNumber' | 'vendorName' | 'itemCount' | 'eta' | 'status';
type SortDirection = 'asc' | 'desc';

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

// Sort Icon Component
function SortIcon({ field, currentSortField, currentSortDirection }: { field: DeliverySortField; currentSortField: DeliverySortField; currentSortDirection: SortDirection }) {
  const isActive = currentSortField === field;
  return (
    <span className="ml-1 inline-flex flex-col">
      <svg className={`w-2 h-2 ${isActive && currentSortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} viewBox="0 0 8 4" fill="currentColor">
        <path d="M4 0L8 4H0L4 0Z" />
      </svg>
      <svg className={`w-2 h-2 -mt-0.5 ${isActive && currentSortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} viewBox="0 0 8 4" fill="currentColor">
        <path d="M4 4L0 0H8L4 4Z" />
      </svg>
    </span>
  );
}

// Text Filter Dropdown
function TextFilterDropdown({ value, onChange, placeholder, isOpen, onToggle }: { value: string; onChange: (value: string) => void; placeholder?: string; isOpen: boolean; onToggle: () => void }) {
  const hasValue = value !== '';
  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} title="Filter">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[180px] p-2">
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" autoFocus onClick={(e) => e.stopPropagation()} />
            {hasValue && <button onClick={() => onChange('')} className="w-full mt-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors">Clear</button>}
          </div>
        </>
      )}
    </div>
  );
}

// MultiSelect Filter Dropdown
function MultiSelectFilterDropdown({ options, value, onChange, isOpen, onToggle, renderLabel }: { options: string[]; value: string[]; onChange: (value: string[]) => void; isOpen: boolean; onToggle: () => void; renderLabel?: (opt: string) => string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const hasValue = value.length > 0;
  const filteredOptions = options.filter((opt) => (renderLabel ? renderLabel(opt) : opt).toLowerCase().includes(searchTerm.toLowerCase()));
  const toggleOption = (optValue: string) => { if (value.includes(optValue)) { onChange(value.filter((v) => v !== optValue)); } else { onChange([...value, optValue]); } };
  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} title="Filter">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
        {hasValue && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-[10px] rounded-full flex items-center justify-center">{value.length}</span>}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] flex flex-col">
            <div className="p-2 border-b border-[var(--border)]">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" autoFocus onClick={(e) => e.stopPropagation()} />
            </div>
            <div className="overflow-y-auto flex-1 py-1">
              {filteredOptions.length === 0 ? <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">No results</div> : filteredOptions.map((opt) => (
                <label key={opt} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={value.includes(opt)} onChange={() => toggleOption(opt)} className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/50" />
                  <span className={value.includes(opt) ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'}>{renderLabel ? renderLabel(opt) : opt}</span>
                </label>
              ))}
            </div>
            {hasValue && <div className="p-2 border-t border-[var(--border)]"><button onClick={(e) => { e.stopPropagation(); onChange([]); }} className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors">Clear all</button></div>}
          </div>
        </>
      )}
    </div>
  );
}

// Date Range Filter Dropdown
function DateRangeFilterDropdown({ value, onChange, isOpen, onToggle }: { value: { start: string; end: string }; onChange: (value: { start: string; end: string }) => void; isOpen: boolean; onToggle: () => void }) {
  const hasValue = value.start !== '' || value.end !== '';
  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`} title="Filter">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 p-3 min-w-[200px]">
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">From</label><input type="date" value={value.start} onChange={(e) => onChange({ ...value, start: e.target.value })} className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" onClick={(e) => e.stopPropagation()} /></div>
              <div><label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">To</label><input type="date" value={value.end} onChange={(e) => onChange({ ...value, end: e.target.value })} className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50" onClick={(e) => e.stopPropagation()} /></div>
              {hasValue && <button onClick={(e) => { e.stopPropagation(); onChange({ start: '', end: '' }); }} className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors">Clear</button>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function WarehouseDeliveriesContent() {
  const router = useRouter();
  const { selectedWarehouse, isWorkerView, isManagerView } = useWarehouse();
  const [activeTab, setActiveTab] = useState<'deliveries' | 'recurring' | 'issues' | 'calendar'>('deliveries');
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

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

  const factories = useMemo(() => getWarehouseFactories(), []);

  // Get unique values for filters
  const uniqueVendors = useMemo(() => {
    return [...new Set(mockIncomingShipments.map(s => s.vendorName))].sort();
  }, []);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(mockIncomingShipments.map(s => s.status))];
  }, []);

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
    let result = mockIncomingShipments;

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
  }, [searchTerm, statusFilter, vendorFilter, refreshKey, columnFilters, sortField, sortDirection, isWorkerView]);

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
    createAndNavigateToShipment(type === 'arriving' ? 'ARRIVED' : 'DRAFT');
  };

  const handleOpenCreateExpected = () => {
    setShowCreateDropdown(false);
    createAndNavigateToShipment('DRAFT');
  };

  const handleOpenCreateArriving = () => {
    setShowCreateDropdown(false);
    createAndNavigateToShipment('ARRIVED');
  };

  const createAndNavigateToShipment = (status: ShipmentStatus) => {
    const selectedWarehouse = mockWarehouses[0];
    const newShipment = addIncomingShipment({
      poNumber: `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      vendorId: '',
      vendorName: '',
      warehouseId: selectedWarehouse?.id || '',
      warehouseName: selectedWarehouse?.name || '',
      eta: status === 'ARRIVED'
        ? new Date().toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status,
      expectedItems: [],
      items: [],
      itemCount: 0,
      expectedQuantity: 0,
    });

    setRefreshKey(prev => prev + 1);
    router.push(`/warehouse/deliveries/${newShipment.id}`);
  };

  const handleCreateRecord = useCallback((record: ShipmentRecord) => {
    const newShipment = addIncomingShipment({
      poNumber: record.poNumber,
      vendorId: record.vendorId,
      vendorName: record.vendorName,
      warehouseId: record.warehouseId,
      warehouseName: record.warehouseName,
      eta: record.eta,
      status: record.status,
      trackingNumber: record.trackingNumber,
      carrier: record.carrier,
      expectedItems: record.items.map((item, index) => ({
        id: `EI-NEW-${index}`,
        productId: item.productId,
        productName: item.productName,
        partNumber: item.partNumber,
        expectedQuantity: item.expectedQuantity,
        receivedQuantity: 0,
        status: 'pending' as const,
      })),
      items: record.items.map((item, index) => ({
        id: `SLI-NEW-${index}`,
        productId: item.productId,
        productName: item.productName,
        partNumber: item.partNumber,
        expectedQuantity: item.expectedQuantity,
        receivedQuantity: 0,
      })),
      itemCount: record.items.length,
      expectedQuantity: record.items.reduce((sum, item) => sum + item.expectedQuantity, 0),
      notes: record.notes,
    });

    setShowCreateRecordModal(false);
    setCreateRecordInitialStatus(undefined);
    setRefreshKey(prev => prev + 1);

    // If arriving now, navigate directly to the detail page for receiving
    if (record.status === 'ARRIVED') {
      router.push(`/warehouse/deliveries/${newShipment.id}`);
    } else {
      setSelectedShipment(newShipment);
      setShowDetailModal(true);
    }
  }, [router]);

  const handleUpdateShipmentStatus = useCallback((status: ShipmentStatus) => {
    if (!selectedShipment) return;
    const updated = updateShipmentStatus(selectedShipment.id, status);
    if (updated) {
      setSelectedShipment(updated);
      setRefreshKey(prev => prev + 1);
    }
  }, [selectedShipment]);

  const handleQuickStatusUpdate = useCallback((shipmentId: string, status: ShipmentStatus) => {
    const updated = updateShipmentStatus(shipmentId, status);
    if (updated) {
      setRefreshKey(prev => prev + 1);
    }
    setShowQuickActions(null);
  }, []);

  const handleReceiveComplete = useCallback(() => {
    if (!selectedShipment) return;
    const updatedItems = selectedShipment.items.map(item => ({
      productId: item.productId,
      receivedQuantity: item.expectedQuantity,
    }));
    completeShipmentReceiving(selectedShipment.id, updatedItems);
    setShowReceiveModal(false);
    setSelectedShipment(null);
    setRefreshKey(prev => prev + 1);
  }, [selectedShipment]);

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
          <RecurringShipmentsContent />
        ) : activeTab === 'issues' ? (
          <DeliveryIssuesTabContent />
        ) : activeTab === 'calendar' ? (
          <DeliveriesCalendarView
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
            <option value="IN_TRANSIT">In Transit</option>
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
                                  {shipment.status === 'PENDING' && (
                                    <button
                                      onClick={() => handleQuickStatusUpdate(shipment.id, 'CONFIRMED')}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                                    >
                                      Mark as Confirmed
                                    </button>
                                  )}
                                  {shipment.status === 'CONFIRMED' && (
                                    <button
                                      onClick={() => handleQuickStatusUpdate(shipment.id, 'IN_TRANSIT')}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                                    >
                                      Mark In Transit
                                    </button>
                                  )}
                                  {shipment.status === 'IN_TRANSIT' && (
                                    <button
                                      onClick={() => handleQuickStatusUpdate(shipment.id, 'ARRIVED')}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                                    >
                                      Mark as Arrived
                                    </button>
                                  )}
                                  {shipment.status !== 'RECEIVED' && shipment.status !== 'CANCELLED' && (
                                    <button
                                      onClick={() => handleQuickStatusUpdate(shipment.id, 'CANCELLED')}
                                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      Cancel Delivery
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
          linkedShipments={getShipmentsForRecurring(selectedRecurringForModal.id)}
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
              nextExpectedDate = calculateNextDate(pattern, new Date(startDate)).toISOString().split('T')[0];
            }
            updateRecurringShipment(selectedRecurringForModal.id, {
              ...updates,
              nextExpectedDate,
            });
            setShowRecurringModal(false);
            setSelectedRecurringForModal(null);
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
