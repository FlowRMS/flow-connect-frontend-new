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
  InventoryStatus,
  ownershipTypeLabels,
  ownershipTypeColors,
  OwnershipType,
} from '@/lib/types/warehouse';
import AddInventoryItemModal from './modals/AddInventoryItemModal';

// Filter types for stat card clicks
type StatFilter = 'all' | 'available' | 'reserved' | 'low_stock';

export default function WarehouseInventoryContent() {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter') as StatFilter | null;

  const [inventory] = useState<Inventory[]>(mockInventory);
  const [inventoryItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [selectedFactory, setSelectedFactory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedOwnership, setSelectedOwnership] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>(urlFilter || 'all');

  // Update filter when URL changes
  useEffect(() => {
    if (urlFilter && ['all', 'available', 'reserved', 'low_stock'].includes(urlFilter)) {
      setActiveStatFilter(urlFilter);
    }
  }, [urlFilter]);

  const stats = useMemo(() => getInventoryStats(), []);
  const factories = useMemo(() => getWarehouseFactories(), []);

  const filteredInventory = useMemo(() => {
    let result = inventory;

    // Apply stat card filter
    if (activeStatFilter === 'available') {
      result = result.filter(inv => inv.availableQuantity > 0);
    } else if (activeStatFilter === 'reserved') {
      result = result.filter(inv => inv.reservedQuantity > 0);
    } else if (activeStatFilter === 'low_stock') {
      result = result.filter(inv => inv.availableQuantity > 0 && inv.availableQuantity <= (inv.reorderPoint || 0));
    }

    if (selectedFactory !== 'All') {
      result = result.filter(inv => inv.factoryId === selectedFactory);
    }

    if (selectedOwnership !== 'All') {
      result = result.filter(inv => inv.ownershipType === selectedOwnership);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv =>
        inv.productName.toLowerCase().includes(query) ||
        inv.partNumber.toLowerCase().includes(query) ||
        inv.factoryName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [inventory, selectedFactory, selectedOwnership, searchQuery, activeStatFilter]);

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

  const toggleRow = (inventoryId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(inventoryId)) {
        next.delete(inventoryId);
      } else {
        next.add(inventoryId);
      }
      return next;
    });
  };

  const getItemsForInventory = (inventoryId: string) => {
    return inventoryItems.filter(item => item.inventoryId === inventoryId);
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleAddItem = (inventoryRecord: Inventory) => {
    setSelectedInventory(inventoryRecord);
    setShowAddItemModal(true);
  };

  const handleViewDetails = (inventoryRecord: Inventory) => {
    // Expand the row to show details
    if (!expandedRows.has(inventoryRecord.id)) {
      toggleRow(inventoryRecord.id);
    }
  };

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Inventory</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Manage your products and inventory. Click on a row to see inventory items.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Update from Manifest
          </button>
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
              placeholder="Search by product, part number, description..."
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
            value={selectedOwnership}
            onChange={(e) => setSelectedOwnership(e.target.value)}
            className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="All">All Types</option>
            <option value="CONSIGNMENT">Consignment</option>
            <option value="BUY_SELL">Buy/Sell</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="All">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="DAMAGED">Damaged</option>
            <option value="IN_TRANSIT">In Transit</option>
          </select>
        </div>

        {/* Results count */}
        <div className="text-sm text-[var(--muted-foreground)] mb-4">
          Showing {filteredInventory.length} of {inventory.length} products
        </div>
      </div>

      {/* Inventory Table */}
      <div className="flex-1 overflow-auto p-6 pt-0">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-14 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              {/* Expand */}
            </div>
            <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Factory
            </div>
            <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Description
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Part Number
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Type
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
              Total
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
              Available
            </div>
            <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
              Cost/Unit
            </div>
            <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
              Actions
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {filteredInventory.length === 0 ? (
              <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                No inventory found
              </div>
            ) : (
              filteredInventory.map((inv) => {
                const isExpanded = expandedRows.has(inv.id);
                const items = getItemsForInventory(inv.id);
                const isLowStock = inv.availableQuantity <= (inv.reorderPoint || 0);

                return (
                  <React.Fragment key={inv.id}>
                    {/* Main Row */}
                    <div
                      className={`grid grid-cols-14 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${isExpanded ? 'bg-[var(--muted)]/10' : ''}`}
                      onClick={() => toggleRow(inv.id)}
                    >
                      <div className="col-span-1 flex items-center">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        >
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {inv.factoryName.split(' ')[0]}
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center">
                        <span className="text-sm text-[var(--foreground)] line-clamp-2">{inv.productName}</span>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${isLowStock ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                          {inv.partNumber.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${ownershipTypeColors[inv.ownershipType]}`}>
                          {inv.ownershipType === 'CONSIGNMENT' ? 'Consign' : 'Buy/Sell'}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <span className="text-sm font-medium text-[var(--foreground)]">{inv.totalQuantity}</span>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                          {inv.availableQuantity}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        {inv.ownershipType === 'BUY_SELL' && inv.unitCost ? (
                          <span className="text-sm text-[var(--foreground)]">${inv.unitCost.toFixed(2)}</span>
                        ) : inv.ownershipType === 'CONSIGNMENT' && inv.commissionPercentage ? (
                          <span className="text-sm text-[var(--muted-foreground)]">{inv.commissionPercentage}%</span>
                        ) : (
                          <span className="text-sm text-[var(--muted-foreground)]">-</span>
                        )}
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(inv);
                          }}
                          className="text-sm text-[var(--primary)] hover:underline"
                        >
                          View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddItem(inv);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 8v8M8 12h8"/>
                          </svg>
                          Add Item
                        </button>
                      </div>
                    </div>

                    {/* Expanded Row - Inventory Items */}
                    {isExpanded && (
                      <div className="bg-[var(--muted)]/20 px-6 py-4 border-t border-[var(--border)]">
                        <div className="ml-8">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-[var(--foreground)]">{inv.productName}</h3>
                              <p className="text-sm text-[var(--muted-foreground)]">
                                SKU: {inv.partNumber}
                              </p>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div>
                                <span className="text-[var(--muted-foreground)]">Total: </span>
                                <span className="font-semibold text-[var(--foreground)]">{inv.totalQuantity}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">Available: </span>
                                <span className="font-semibold text-green-600">{inv.availableQuantity}</span>
                              </div>
                              <div>
                                <span className="text-[var(--muted-foreground)]">In Transit: </span>
                                <span className="font-semibold text-blue-600">{inv.inTransitQuantity}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                            Inventory Items ({items.length})
                          </div>

                          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Quantity</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Status</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Bin</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Lot #</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Serial #</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Received</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Expiration</th>
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Notes</th>
                                  <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)]">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border)]">
                                {items.length === 0 ? (
                                  <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                                      No inventory items found
                                    </td>
                                  </tr>
                                ) : (
                                  items.map((item) => (
                                    <tr key={item.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                                      <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">{item.quantity}</td>
                                      <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${inventoryStatusColors[item.status]}`}>
                                          {inventoryStatusLabels[item.status]}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.binLocation}</td>
                                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.lotNumber || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.serialNumber || '-'}</td>
                                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{formatDate(item.receivedDate)}</td>
                                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">{formatDate(item.expirationDate)}</td>
                                      <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{item.notes || '-'}</td>
                                      <td className="px-4 py-3 text-right">
                                        <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="1"/>
                                            <circle cx="12" cy="5" r="1"/>
                                            <circle cx="12" cy="19" r="1"/>
                                          </svg>
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
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
