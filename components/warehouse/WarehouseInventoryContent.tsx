'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
import RequestShipmentModal from './modals/RequestShipmentModal';
import ShipmentRequestDetailModal from './modals/ShipmentRequestDetailModal';
import { useWarehouse } from './WarehouseContext';
import { StatFilter, TabType, FlatInventoryItem } from './inventory/types';
import InventoryStats from './inventory/InventoryStats';
import BackorderAlert from './inventory/BackorderAlert';
import InventoryHeader from './inventory/InventoryHeader';
import InventoryFilters from './inventory/InventoryFilters';
import InventoryTable from './inventory/InventoryTable';
import ShipmentRequestsTable from './inventory/ShipmentRequestsTable';

export default function WarehouseInventoryContent() {
  const { selectedWarehouse } = useWarehouse();
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

  // Calculate backorder items from fulfillment orders
  const backorderItems = useMemo(() => {
    const fulfillmentOrders = getAllFulfillmentOrders();
    const backordered: Array<{
      productId: string;
      productName: string;
      partNumber: string;
      backorderQty: number;
      orderNumber: string;
      customerName: string;
    }> = [];

    fulfillmentOrders.forEach(fo => {
      fo.lineItems.forEach(item => {
        if (item.backorderQty > 0) {
          backordered.push({
            productId: item.productId,
            productName: item.productName,
            partNumber: item.partNumber,
            backorderQty: item.backorderQty,
            orderNumber: fo.orderNumber,
            customerName: fo.customerName,
          });
        }
      });
    });

    return backordered;
  }, [refreshKey]);

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

    return result;
  }, [flatInventoryItems, selectedFactory, selectedStatus, searchQuery, activeStatFilter]);

  const handleStatCardClick = (filter: StatFilter) => {
    setActiveStatFilter(prev => prev === filter ? 'all' : filter);
  };

  const handleAddItem = (inv: Inventory) => {
    setSelectedInventory(inv);
    setShowAddItemModal(true);
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
  const handleRequestShipment = useCallback((request: ShipmentRequest) => {
    setShowRequestModal(false);
    setRefreshKey(prev => prev + 1);
    setActiveTab('requests');
  }, []);

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

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      <InventoryHeader onRequestInventory={() => setShowRequestModal(true)} />

      <div className="p-6 pb-0">
        <InventoryStats
          stats={stats}
          activeStatFilter={activeStatFilter}
          onStatCardClick={handleStatCardClick}
        />

        <BackorderAlert
          backorderItems={backorderItems}
          totalBackorderQty={totalBackorderQty}
          onRequestInventory={() => setShowRequestModal(true)}
        />

        {/* Tabs */}
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
          {activeTab === 'inventory'
            ? `Showing ${filteredItems.length} inventory items`
            : `Showing ${filteredRequests.length} shipment requests`
          }
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'inventory' && (
        <InventoryTable
          items={filteredItems}
          inventory={inventory}
          onAddItem={handleAddItem}
        />
      )}

      {activeTab === 'requests' && (
        <ShipmentRequestsTable
          requests={filteredRequests}
          onViewDetails={handleViewRequestDetails}
          onConfirm={handleConfirmRequest}
          onCancel={handleCancelRequest}
          onShowRequestModal={() => setShowRequestModal(true)}
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

      {showRequestModal && (
        <RequestShipmentModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleRequestShipment}
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
    </main>
  );
}
