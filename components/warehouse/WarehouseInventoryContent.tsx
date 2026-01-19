'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  mockInventory,
  mockInventoryItems,
  getInventoryStats,
  getWarehouseFactories,
  getAllShipmentRequests,
  updateShipmentRequestStatus,
  getAllFulfillmentOrders,
} from '@/lib/data/warehouse-mock';
import {
  Inventory,
  InventoryItem,
  ShipmentRequest,
  ShipmentRequestStatus,
} from '@/lib/types/warehouse';
import AddInventoryItemModal from './modals/AddInventoryItemModal';
import ShipmentRequestDetailModal from './modals/ShipmentRequestDetailModal';
import ProductProfileModal from './modals/ProductProfileModal';
import { useWarehouse } from './WarehouseContext';
import { StatFilter, TabType, FlatInventoryItem, BackorderItem, InventorySortField, SortDirection, InventoryColumnFilters } from './inventory/types';
import InventoryStats from './inventory/InventoryStats';
import BackorderAlert from './inventory/BackorderAlert';
import InventoryHeader from './inventory/InventoryHeader';
import InventoryFilters from './inventory/InventoryFilters';
import InventoryTable from './inventory/InventoryTable';
import ShipmentRequestsTable from './inventory/ShipmentRequestsTable';
import BackordersTable from './inventory/BackordersTable';

export default function WarehouseInventoryContent() {
  const { selectedWarehouse, isWorkerView, isManagerView } = useWarehouse();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter') as StatFilter | null;
  const urlSearch = searchParams.get('search');

  const [inventory] = useState<Inventory[]>(mockInventory);
  const [inventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [selectedFactory, setSelectedFactory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState(urlSearch || '');
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>(urlFilter || 'all');

  // Tab and shipment request state
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRequestDetailModal, setShowRequestDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ShipmentRequest | null>(null);
  const [requestStatusFilter, setRequestStatusFilter] = useState<ShipmentRequestStatus | 'all'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Product profile modal state
  const [showProductProfileModal, setShowProductProfileModal] = useState(false);
  const [selectedProductInventory, setSelectedProductInventory] = useState<Inventory | null>(null);

  // Backorder tracking state
  const [dismissedBackorders, setDismissedBackorders] = useState<Set<string>>(new Set());
  const [loggedBackorders, setLoggedBackorders] = useState<BackorderItem[]>([]);

  // Inventory sorting state
  const [sortField, setSortField] = useState<InventorySortField>('productName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Inventory column filters state
  const [columnFilters, setColumnFilters] = useState<InventoryColumnFilters>({
    factoryName: [],
    productName: '',
    partNumber: '',
    location: '',
    status: [],
    dateRange: { start: '', end: '' },
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // Update filter when URL changes
  useEffect(() => {
    if (urlFilter && ['all', 'available', 'reserved', 'low_stock'].includes(urlFilter)) {
      setActiveStatFilter(urlFilter);
    }
  }, [urlFilter]);

  // Update search query when URL search param changes
  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  const stats = useMemo(() => getInventoryStats(), []);
  const factories = useMemo(() => getWarehouseFactories(), []);
  const shipmentRequests = useMemo(() => getAllShipmentRequests(), [refreshKey]);

  // Handle sorting
  const handleSort = (field: InventorySortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Calculate backorder items from fulfillment orders
  const allBackorderItems = useMemo(() => {
    const fulfillmentOrders = getAllFulfillmentOrders();
    const backordered: BackorderItem[] = [];

    fulfillmentOrders.forEach(fo => {
      fo.lineItems.forEach(item => {
        if (item.backorderQty > 0) {
          const id = `${fo.order?.orderNumber || fo.id}-${item.productId}`;
          backordered.push({
            id,
            productId: item.productId,
            productName: item.product?.description || item.product?.factoryPartNumber || '',
            partNumber: item.product?.factoryPartNumber || '',
            backorderQty: item.backorderQty,
            orderNumber: fo.order?.orderNumber || '',
            customerName: fo.customer?.companyName || '',
          });
        }
      });
    });

    return backordered;
  }, [refreshKey]);

  // Filter out dismissed backorders for the alert
  const backorderItems = useMemo(() => {
    return allBackorderItems.filter(item => !dismissedBackorders.has(item.id));
  }, [allBackorderItems, dismissedBackorders]);

  const totalBackorderQty = useMemo(() =>
    backorderItems.reduce((sum, item) => sum + item.backorderQty, 0),
    [backorderItems]
  );

  // Create flat list of all inventory items with product info
  const flatInventoryItems = useMemo(() => {
    const items: FlatInventoryItem[] = [];

    inventory.forEach(inv => {
      const invItems = inventoryItems.filter(item => item.inventoryId === inv.id);
      invItems.forEach(item => {
        items.push({
          ...item,
          productName: inv.productName,
          partNumber: inv.partNumber,
          factoryName: inv.factoryName,
          factoryId: inv.factoryId,
          totalQuantity: inv.totalQuantity,
          availableQuantity: inv.availableQuantity,
          reservedQuantity: inv.reservedQuantity,
          inTransitQuantity: inv.inTransitQuantity,
          reorderPoint: inv.reorderPoint,
        });
      });
    });

    return items;
  }, [inventory, inventoryItems]);

  // Get unique values for inventory filters
  const uniqueFactories = useMemo(() => {
    return [...new Set(flatInventoryItems.map(item => item.factoryName))].sort();
  }, [flatInventoryItems]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(flatInventoryItems.map(item => item.status))];
  }, [flatInventoryItems]);

  const filteredItems = useMemo(() => {
    let result = flatInventoryItems;

    // Apply stat card filter
    if (activeStatFilter === 'available') {
      result = result.filter(item => item.status === 'AVAILABLE');
    } else if (activeStatFilter === 'reserved') {
      result = result.filter(item => item.status === 'RESERVED');
    } else if (activeStatFilter === 'low_stock') {
      result = result.filter(item => item.availableQuantity <= (item.reorderPoint || 0));
    }

    if (selectedFactory !== 'All') {
      result = result.filter(item => item.factoryId === selectedFactory);
    }

    if (selectedStatus !== 'All') {
      result = result.filter(item => item.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.productName.toLowerCase().includes(query) ||
        item.partNumber.toLowerCase().includes(query) ||
        item.factoryName.toLowerCase().includes(query) ||
        item.binLocation.toLowerCase().includes(query) ||
        (item.lotNumber && item.lotNumber.toLowerCase().includes(query))
      );
    }

    // Apply column filters
    if (columnFilters.factoryName.length > 0) {
      result = result.filter(item => columnFilters.factoryName.includes(item.factoryName));
    }

    if (columnFilters.productName) {
      const query = columnFilters.productName.toLowerCase();
      result = result.filter(item => item.productName.toLowerCase().includes(query));
    }

    if (columnFilters.partNumber) {
      const query = columnFilters.partNumber.toLowerCase();
      result = result.filter(item => item.partNumber.toLowerCase().includes(query));
    }

    if (columnFilters.location) {
      const query = columnFilters.location.toLowerCase();
      result = result.filter(item => item.binLocation.toLowerCase().includes(query));
    }

    if (columnFilters.status.length > 0) {
      result = result.filter(item => columnFilters.status.includes(item.status));
    }

    if (columnFilters.dateRange.start || columnFilters.dateRange.end) {
      result = result.filter(item => {
        if (!item.receivedDate) return true;
        const date = new Date(item.receivedDate);
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
        case 'factoryName':
          comparison = a.factoryName.localeCompare(b.factoryName);
          break;
        case 'productName':
          comparison = a.productName.localeCompare(b.productName);
          break;
        case 'partNumber':
          comparison = a.partNumber.localeCompare(b.partNumber);
          break;
        case 'binLocation':
          comparison = a.binLocation.localeCompare(b.binLocation);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'receivedDate':
          const aDate = a.receivedDate ? new Date(a.receivedDate).getTime() : 0;
          const bDate = b.receivedDate ? new Date(b.receivedDate).getTime() : 0;
          comparison = aDate - bDate;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [flatInventoryItems, selectedFactory, selectedStatus, searchQuery, activeStatFilter, columnFilters, sortField, sortDirection]);

  const handleStatCardClick = (filter: StatFilter) => {
    setActiveStatFilter(prev => prev === filter ? 'all' : filter);
  };

  const handleAddItem = (inv: Inventory) => {
    setSelectedInventory(inv);
    setShowAddItemModal(true);
  };

  const handleProductClick = (inv: Inventory) => {
    setSelectedProductInventory(inv);
    setShowProductProfileModal(true);
  };

  // Filtered shipment requests
  const filteredRequests = useMemo(() => {
    return shipmentRequests.filter(request => {
      const matchesSearch =
        request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = requestStatusFilter === 'all' || request.status === requestStatusFilter;
      const matchesVendor = selectedFactory === 'All' || request.vendorId === selectedFactory;
      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [shipmentRequests, searchQuery, requestStatusFilter, selectedFactory]);

  // Shipment request handlers
  const handleViewRequestDetails = useCallback((request: ShipmentRequest) => {
    setSelectedRequest(request);
    setShowRequestDetailModal(true);
  }, []);

  const handleCancelRequest = useCallback((requestId: string) => {
    updateShipmentRequestStatus(requestId, 'CANCELLED');
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleConfirmRequest = useCallback((requestId: string) => {
    updateShipmentRequestStatus(requestId, 'CONFIRMED', {
      confirmedAt: new Date().toISOString(),
    });
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleRequestDetailConfirm = useCallback(() => {
    if (!selectedRequest) return;
    handleConfirmRequest(selectedRequest.id);
    setShowRequestDetailModal(false);
    setSelectedRequest(null);
  }, [selectedRequest, handleConfirmRequest]);

  const handleRequestDetailCancel = useCallback(() => {
    if (!selectedRequest) return;
    handleCancelRequest(selectedRequest.id);
    setShowRequestDetailModal(false);
    setSelectedRequest(null);
  }, [selectedRequest, handleCancelRequest]);

  const handleRequestStatusUpdate = useCallback((status: ShipmentRequestStatus) => {
    if (!selectedRequest) return;
    updateShipmentRequestStatus(selectedRequest.id, status);
    setRefreshKey(prev => prev + 1);
    setShowRequestDetailModal(false);
    setSelectedRequest(null);
  }, [selectedRequest]);

  const pendingRequestsCount = useMemo(() =>
    shipmentRequests.filter(r => r.status === 'PENDING' || r.status === 'SENT').length,
    [shipmentRequests]
  );

  // Backorder handlers
  const handleDismissBackorder = useCallback((backorderId: string) => {
    setDismissedBackorders(prev => new Set(prev).add(backorderId));
  }, []);

  const handleDismissAllBackorders = useCallback(() => {
    setDismissedBackorders(prev => {
      const newSet = new Set(prev);
      backorderItems.forEach(item => newSet.add(item.id));
      return newSet;
    });
  }, [backorderItems]);

  const handleLogBackorder = useCallback((backorder: BackorderItem) => {
    setLoggedBackorders(prev => {
      // Don't add if already logged
      if (prev.some(b => b.id === backorder.id)) return prev;
      return [...prev, { ...backorder, loggedAt: new Date().toISOString() }];
    });
    setDismissedBackorders(prev => new Set(prev).add(backorder.id));
  }, []);

  const handleLogAllBackorders = useCallback(() => {
    const now = new Date().toISOString();
    setLoggedBackorders(prev => {
      const existingIds = new Set(prev.map(b => b.id));
      const newItems = backorderItems
        .filter(item => !existingIds.has(item.id))
        .map(item => ({ ...item, loggedAt: now }));
      return [...prev, ...newItems];
    });
    handleDismissAllBackorders();
    setActiveTab('backorders');
  }, [backorderItems, handleDismissAllBackorders]);

  const handleRemoveLoggedBackorder = useCallback((backorderId: string) => {
    setLoggedBackorders(prev => prev.filter(b => b.id !== backorderId));
  }, []);

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      <InventoryHeader />

      <div className="p-6 pb-0">
        <InventoryStats
          stats={stats}
          activeStatFilter={activeStatFilter}
          onStatCardClick={handleStatCardClick}
        />

        {/* BackorderAlert only visible to managers */}
        {isManagerView && (
          <BackorderAlert
            backorderItems={backorderItems}
            totalBackorderQty={totalBackorderQty}
          />
        )}

        {/* Tabs - Shipment Requests and Backorders tabs only visible to managers */}
        <div className="mb-4">
          <div className="border-b border-[var(--border)]">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inventory'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
              >
                Inventory
                <span className="ml-2 px-2 py-0.5 bg-[var(--muted)] rounded-full text-xs">
                  {filteredItems.length}
                </span>
              </button>
              {isManagerView && (
                <>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requests'
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                  >
                    Shipment Requests
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${pendingRequestsCount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-[var(--muted)]'
                      }`}>
                      {shipmentRequests.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('backorders')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'backorders'
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                  >
                    Backorders
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${loggedBackorders.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-[var(--muted)]'
                      }`}>
                      {loggedBackorders.length}
                    </span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>

        <InventoryFilters
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFactory={selectedFactory}
          onFactoryChange={setSelectedFactory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          requestStatusFilter={requestStatusFilter}
          onRequestStatusFilterChange={setRequestStatusFilter}
          factories={factories}
        />

        {/* Results count */}
        <div className="text-sm text-[var(--muted-foreground)] mb-4">
          {isWorkerView
            ? `Showing ${filteredItems.length} inventory items`
            : activeTab === 'inventory'
              ? `Showing ${filteredItems.length} inventory items`
              : activeTab === 'requests'
                ? `Showing ${filteredRequests.length} shipment requests`
                : `Showing ${loggedBackorders.length} logged backorders`
          }
        </div>
      </div>

      {/* Content based on active tab - Workers only see inventory tab */}
      {activeTab === 'inventory' && (
        <InventoryTable
          items={filteredItems}
          inventory={inventory}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          uniqueFactories={uniqueFactories}
          uniqueStatuses={uniqueStatuses}
          onProductClick={handleProductClick}
        />
      )}

      {activeTab === 'requests' && isManagerView && (
        <ShipmentRequestsTable
          requests={filteredRequests}
          onViewDetails={handleViewRequestDetails}
          onConfirm={handleConfirmRequest}
          onCancel={handleCancelRequest}
        />
      )}

      {activeTab === 'backorders' && isManagerView && (
        <BackordersTable
          backorders={loggedBackorders}
          searchQuery={searchQuery}
          onRemoveBackorder={handleRemoveLoggedBackorder}
        />
      )}

      {/* Modals */}
      {showAddItemModal && selectedInventory && (
        <AddInventoryItemModal
          inventory={selectedInventory}
          onClose={() => {
            setShowAddItemModal(false);
            setSelectedInventory(null);
          }}
          onSave={(newItem) => {
            console.log('New item:', newItem);
            setShowAddItemModal(false);
            setSelectedInventory(null);
          }}
        />
      )}

      {showRequestDetailModal && selectedRequest && (
        <ShipmentRequestDetailModal
          request={selectedRequest}
          onClose={() => {
            setShowRequestDetailModal(false);
            setSelectedRequest(null);
          }}
          onConfirm={handleRequestDetailConfirm}
          onCancel={handleRequestDetailCancel}
          onUpdateStatus={handleRequestStatusUpdate}
        />
      )}

      {showProductProfileModal && selectedProductInventory && (
        <ProductProfileModal
          inventory={selectedProductInventory}
          onClose={() => {
            setShowProductProfileModal(false);
            setSelectedProductInventory(null);
          }}
          onSave={(data) => {
            console.log('Updated product profile:', data);
            setShowProductProfileModal(false);
            setSelectedProductInventory(null);
          }}
        />
      )}
    </main>
  );
}
