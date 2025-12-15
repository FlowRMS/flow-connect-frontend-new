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
  inventoryStatusColors,
  inventoryStatusLabels,
  ShipmentRequest,
  ShipmentRequestStatus,
  shipmentRequestStatusColors,
  shipmentRequestStatusLabels,
  shipmentRequestMethodLabels,
} from '@/lib/types/warehouse';
import AddInventoryItemModal from './modals/AddInventoryItemModal';
import RequestShipmentModal from './modals/RequestShipmentModal';
import ShipmentRequestDetailModal from './modals/ShipmentRequestDetailModal';
import WarehouseSelector from './WarehouseSelector';
import { useWarehouse } from './WarehouseContext';

// Filter types for stat card clicks
type StatFilter = 'all' | 'available' | 'reserved' | 'low_stock';
type TabType = 'inventory' | 'requests';

// Combined inventory item with product info
interface FlatInventoryItem extends InventoryItem {
  productName: string;
  partNumber: string;
  factoryName: string;
  factoryId: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  inTransitQuantity: number;
  reorderPoint?: number;
}

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

  const getStatCardClass = (filter: StatFilter) => {
    const baseClass = "bg-[var(--card)] rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md";
    if (activeStatFilter === filter) {
      return `${baseClass} border-[var(--primary)] ring-2 ring-[var(--primary)]/20`;
    }
    return `${baseClass} border-[var(--border)] hover:border-[var(--primary)]/50`;
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleAddItem = (inv: Inventory) => {
    setSelectedInventory(inv);
    setShowAddItemModal(true);
  };

  // Format location path from binLocation (e.g., "Shelf 1A, Bin A" -> "Section A > Aisle 1 > Shelf 3 > Bay 2 > Row 1 > Bin A")
  const formatLocation = (item: FlatInventoryItem) => {
    // Parse the binLocation which is typically in format "Shelf 1A, Bin A"
    // For now, show the full location path if available, otherwise show binLocation
    if (item.fullLocationPath) {
      return item.fullLocationPath;
    }
    return item.binLocation;
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
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Inventory</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Manage consignment inventory and stock levels
            </p>
          </div>
          <div className="flex items-center gap-3">
            <WarehouseSelector />
            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Import
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Request Inventory
            </button>
          </div>
        </div>

        {/* Stats Cards - Clickable to filter */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div
            className={getStatCardClass('all')}
            onClick={() => handleStatCardClick('all')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Total Products</div>
            <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.totalProducts}</div>
            {activeStatFilter === 'all' && (
              <div className="text-xs text-[var(--primary)] mt-1">Showing all</div>
            )}
          </div>
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <div className="text-sm text-[var(--muted-foreground)]">Total Quantity</div>
            <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.totalQuantity.toLocaleString()}</div>
          </div>
          <div
            className={getStatCardClass('available')}
            onClick={() => handleStatCardClick('available')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Available</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">{stats.availableQuantity.toLocaleString()}</div>
            {activeStatFilter === 'available' && (
              <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
            )}
          </div>
          <div
            className={getStatCardClass('reserved')}
            onClick={() => handleStatCardClick('reserved')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Reserved</div>
            <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.reservedQuantity.toLocaleString()}</div>
            {activeStatFilter === 'reserved' && (
              <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
            )}
          </div>
          <div
            className={getStatCardClass('low_stock')}
            onClick={() => handleStatCardClick('low_stock')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Low Stock</div>
            <div className="text-2xl font-semibold text-red-600 mt-1">{stats.lowStockCount}</div>
            {activeStatFilter === 'low_stock' && (
              <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
            )}
          </div>
        </div>

        {/* Backorder Alert */}
        {backorderItems.length > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-800">Backorder Alert</h3>
                <p className="text-sm text-orange-700 mt-1">
                  {backorderItems.length} product{backorderItems.length !== 1 ? 's' : ''} on backorder ({totalBackorderQty} total units) across {new Set(backorderItems.map(b => b.orderNumber)).size} order{new Set(backorderItems.map(b => b.orderNumber)).size !== 1 ? 's' : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {backorderItems.slice(0, 3).map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                      {item.partNumber}: {item.backorderQty} units ({item.orderNumber})
                    </span>
                  ))}
                  {backorderItems.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                      +{backorderItems.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex-shrink-0 px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                Request Inventory
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4">
          <div className="border-b border-[var(--border)]">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'inventory'
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
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'requests'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                Shipment Requests
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  pendingRequestsCount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-[var(--muted)]'
                }`}>
                  {shipmentRequests.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
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
              placeholder={activeTab === 'inventory' ? "Search by product, part number, location..." : "Search by request number or vendor..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
          <select
            value={selectedFactory}
            onChange={(e) => setSelectedFactory(e.target.value)}
            className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="All">All Factories</option>
            {factories.map((factory) => (
              <option key={factory.id} value={factory.id}>{factory.name}</option>
            ))}
          </select>
          {activeTab === 'inventory' ? (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="All">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="PICKING">Picking</option>
              <option value="DAMAGED">Damaged</option>
              <option value="IN_TRANSIT">In Transit</option>
            </select>
          ) : (
            <select
              value={requestStatusFilter}
              onChange={(e) => setRequestStatusFilter(e.target.value as ShipmentRequestStatus | 'all')}
              className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SENT">Sent</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}
        </div>

        {/* Results count */}
        <div className="text-sm text-[var(--muted-foreground)] mb-4">
          {activeTab === 'inventory'
            ? `Showing ${filteredItems.length} inventory items`
            : `Showing ${filteredRequests.length} shipment requests`
          }
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'inventory' ? (
        /* Inventory Table - Flat List */
        <div className="flex-1 overflow-auto p-6 pt-0">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Factory</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Part Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Available</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Reserved</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Lot #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Received</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.availableQuantity <= (item.reorderPoint || 0);
                  const inv = inventory.find(i => i.id === item.inventoryId);

                  return (
                    <tr key={item.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">
                          {item.factoryName.split(' ')[0]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--foreground)] line-clamp-1">{item.productName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                          {item.partNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium text-[var(--foreground)]">{formatLocation(item)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${inventoryStatusColors[item.status]}`}>
                          {inventoryStatusLabels[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-[var(--foreground)]">{item.quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${item.status === 'AVAILABLE' ? 'text-green-600' : 'text-[var(--muted-foreground)]'}`}>
                          {item.status === 'AVAILABLE' ? item.quantity : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${item.status === 'RESERVED' ? 'text-blue-600' : 'text-[var(--muted-foreground)]'}`}>
                          {item.status === 'RESERVED' ? item.quantity : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--foreground)]">{item.lotNumber || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--muted-foreground)]">{formatDate(item.receivedDate)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv && (
                            <button
                              onClick={() => handleAddItem(inv)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-[var(--primary)] text-white rounded text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14"/>
                              </svg>
                              Add
                            </button>
                          )}
                          <button className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors text-[var(--muted-foreground)]">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1"/>
                              <circle cx="12" cy="5" r="1"/>
                              <circle cx="12" cy="19" r="1"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        /* Shipment Requests Table */
        <div className="flex-1 overflow-auto p-6 pt-0">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Shipment Requests
                <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">
                  ({filteredRequests.length})
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Request #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Total Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Requested Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                      onClick={() => handleViewRequestDetails(request)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-[var(--foreground)]">{request.requestNumber}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {formatDate(request.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[var(--foreground)]">{request.vendorName}</div>
                        {request.contactName && (
                          <div className="text-xs text-[var(--muted-foreground)]">{request.contactName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                          request.requestMethod === 'EMAIL' ? 'bg-blue-100 text-blue-700' :
                          request.requestMethod === 'CALL' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {request.requestMethod === 'EMAIL' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                              <polyline points="22,6 12,13 2,6"/>
                            </svg>
                          )}
                          {request.requestMethod === 'CALL' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72"/>
                            </svg>
                          )}
                          {request.requestMethod === 'MANUFACTURER_SYSTEM' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                              <line x1="8" y1="21" x2="16" y2="21"/>
                              <line x1="12" y1="17" x2="12" y2="21"/>
                            </svg>
                          )}
                          {shipmentRequestMethodLabels[request.requestMethod]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{request.items.length}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{request.totalQuantity}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{formatDate(request.requestedDeliveryDate)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          request.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          request.priority === 'expedited' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {request.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${shipmentRequestStatusColors[request.status]}`}>
                          {shipmentRequestStatusLabels[request.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {(request.status === 'PENDING' || request.status === 'SENT') && (
                            <>
                              <button
                                onClick={() => handleConfirmRequest(request.id)}
                                className="px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 rounded transition-colors"
                                title="Mark as Confirmed"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleCancelRequest(request.id)}
                                className="px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Cancel Request"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleViewRequestDetails(request)}
                            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                            title="View Details"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRequests.length === 0 && (
              <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                <p>No shipment requests found</p>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="mt-2 text-sm text-[var(--primary)] hover:underline"
                >
                  Create your first request
                </button>
              </div>
            )}
          </div>
        </div>
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
