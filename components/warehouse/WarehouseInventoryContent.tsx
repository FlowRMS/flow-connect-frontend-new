'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  mockInventory,
  mockInventoryItems,
  getInventoryStats,
  getWarehouseFactories,
} from '@/lib/data/warehouse-mock';
import {
  Inventory,
  InventoryItem,
  inventoryStatusColors,
  inventoryStatusLabels,
} from '@/lib/types/warehouse';
import AddInventoryItemModal from './modals/AddInventoryItemModal';
import WarehouseSelector from './WarehouseSelector';
import { useWarehouse } from './WarehouseContext';

// Filter types for stat card clicks
type StatFilter = 'all' | 'available' | 'reserved' | 'low_stock';

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
              placeholder="Search by product, part number, location..."
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
        </div>

        {/* Results count */}
        <div className="text-sm text-[var(--muted-foreground)] mb-4">
          Showing {filteredItems.length} inventory items
        </div>
      </div>

      {/* Inventory Table - Flat List */}
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

      {/* Add Inventory Item Modal */}
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
    </main>
  );
}
