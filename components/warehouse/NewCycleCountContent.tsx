'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  mockWarehouses,
  getWarehouseFactories,
  mockInventory,
  addCycleCount,
  getItemsNotRecentlyCounted,
  getFastMovingItems,
  getAClassItems,
  getItemsBelowThreshold,
} from '@/lib/data/warehouse-mock';
import {
  CycleCountPriority,
  cycleCountPriorityLabels,
} from '@/lib/types/warehouse';

// Movement speed categories
type MovementSpeed = 'all' | 'fast' | 'medium' | 'slow';

export default function NewCycleCountContent() {
  const router = useRouter();
  const factories = useMemo(() => getWarehouseFactories(), []);
  const warehouses = useMemo(() => mockWarehouses, []);

  // Basic Information
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || '');
  const [priority, setPriority] = useState<CycleCountPriority>('medium');

  // Schedule & Assignment
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  // Product Settings - Filters
  const [selectedManufacturerId, setSelectedManufacturerId] = useState('');
  const [quantityThreshold, setQuantityThreshold] = useState<number | ''>('');
  const [movementSpeed, setMovementSpeed] = useState<MovementSpeed>('all');

  // Selected Products
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Random selection modal
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [randomCount, setRandomCount] = useState(10);
  const [daysSinceLastCount, setDaysSinceLastCount] = useState(60);

  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  // Get filtered products based on current filters
  const getFilteredProducts = useCallback(() => {
    let products = [...mockInventory];

    // Filter by manufacturer
    if (selectedManufacturerId) {
      products = products.filter(p => p.factoryId === selectedManufacturerId);
    }

    // Filter by quantity threshold
    if (quantityThreshold !== '' && quantityThreshold > 0) {
      products = products.filter(p => p.totalQuantity <= quantityThreshold);
    }

    // Filter by movement speed
    if (movementSpeed !== 'all') {
      const fastMoving = getFastMovingItems();
      const fastMovingIds = new Set(fastMoving.map(f => f.id));

      if (movementSpeed === 'fast') {
        products = products.filter(p => fastMovingIds.has(p.id));
      } else if (movementSpeed === 'slow') {
        // Slow = not in fast moving list
        products = products.filter(p => !fastMovingIds.has(p.id));
      }
      // 'medium' would need more sophisticated logic - for now treat as all
    }

    return products;
  }, [selectedManufacturerId, quantityThreshold, movementSpeed]);

  // Products matching current filters
  const filteredProductCount = useMemo(() => {
    return getFilteredProducts().length;
  }, [getFilteredProducts]);

  // Products for search dropdown
  const searchResults = useMemo(() => {
    if (!productSearch.trim()) return [];
    const search = productSearch.toLowerCase();

    // Start with filtered products, then search within them
    let products = getFilteredProducts();

    return products
      .filter(p =>
        p.productName.toLowerCase().includes(search) ||
        p.partNumber.toLowerCase().includes(search)
      )
      .filter(p => !selectedProducts.includes(p.productId))
      .slice(0, 10);
  }, [productSearch, getFilteredProducts, selectedProducts]);

  // Handle adding a product
  const handleAddProduct = (productId: string) => {
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts(prev => [...prev, productId]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  // Handle removing a product
  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(id => id !== productId));
  };

  // Handle random selection
  const handleRandomSelect = () => {
    // Get products not counted in the specified days
    const notRecentlyCounted = getItemsNotRecentlyCounted(daysSinceLastCount);
    const notRecentlyCountedIds = new Set(notRecentlyCounted.map(n => n.id));

    // Apply current filters and exclude recently counted
    let eligibleProducts = getFilteredProducts()
      .filter(p => notRecentlyCountedIds.has(p.id));

    // Shuffle and pick random items
    const shuffled = eligibleProducts.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, randomCount).map(p => p.productId);

    // Add to selected products (avoiding duplicates)
    setSelectedProducts(prev => {
      const newSet = new Set([...prev, ...selected]);
      return Array.from(newSet);
    });

    setShowRandomModal(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedManufacturerId('');
    setQuantityThreshold('');
    setMovementSpeed('all');
  };

  // Validation
  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!selectedWarehouseId) return false;
    if (!scheduledDate) return false;
    if (selectedProducts.length === 0) return false;
    return true;
  }, [name, selectedWarehouseId, scheduledDate, selectedProducts.length]);

  const handleSubmit = useCallback(() => {
    const newCycleCount = addCycleCount({
      name,
      description: description || undefined,
      type: 'PARTIAL',
      priority,
      status: 'DRAFT',
      triggerType: 'MANUAL',
      warehouseId: selectedWarehouseId,
      warehouseName: selectedWarehouse?.name || '',
      scope: { products: selectedProducts },
      scheduledDate: new Date(scheduledDate).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      assignedTo: assignedTo || undefined,
      assignedToName: assignedTo === 'user-003' ? 'Mike Johnson' : assignedTo === 'user-004' ? 'Lisa Anderson' : undefined,
      lineItems: [],
      totalItems: selectedProducts.length,
      countedItems: 0,
      itemsWithVariance: 0,
      notes: notes || undefined,
      createdBy: 'Current User',
    });

    router.push(`/warehouse/cycle-counts/${newCycleCount.id}`);
  }, [
    name, description, priority, selectedWarehouseId, selectedWarehouse,
    scheduledDate, dueDate, assignedTo, notes, selectedProducts, router
  ]);

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/warehouse/cycle-counts"
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">New Cycle Count</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Create a new inventory cycle count
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Monthly Full Count - December"
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Warehouse <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high', 'urgent'] as CycleCountPriority[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                          priority === p
                            ? p === 'urgent' ? 'bg-red-100 text-red-700 border-2 border-red-500' :
                              p === 'high' ? 'bg-orange-100 text-orange-700 border-2 border-orange-500' :
                              p === 'medium' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500' :
                              'bg-green-100 text-green-700 border-2 border-green-500'
                            : 'bg-[var(--muted)] text-[var(--foreground)] border-2 border-transparent hover:border-[var(--border)]'
                        }`}
                      >
                        {cycleCountPriorityLabels[p]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule & Assignment */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Schedule & Assignment</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Scheduled Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={scheduledDate}
                    className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Assign To
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Unassigned - Assign later</option>
                  <option value="user-003">Mike Johnson</option>
                  <option value="user-004">Lisa Anderson</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Notes / Instructions
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any special instructions..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Product Settings */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Product Settings</h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Filter and select products to include in this cycle count
                </p>
              </div>
              {(selectedManufacturerId || quantityThreshold || movementSpeed !== 'all') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Manufacturer
                </label>
                <select
                  value={selectedManufacturerId}
                  onChange={(e) => setSelectedManufacturerId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">All Manufacturers</option>
                  {factories.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Quantity Threshold
                </label>
                <input
                  type="number"
                  value={quantityThreshold}
                  onChange={(e) => setQuantityThreshold(e.target.value ? parseInt(e.target.value) : '')}
                  onFocus={(e) => e.target.select()}
                  placeholder="e.g., 100"
                  min={0}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                {quantityThreshold !== '' && quantityThreshold > 0 && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Items with qty &le; {quantityThreshold}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Movement Speed
                </label>
                <select
                  value={movementSpeed}
                  onChange={(e) => setMovementSpeed(e.target.value as MovementSpeed)}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="all">All Products</option>
                  <option value="fast">Fast Moving</option>
                  <option value="slow">Slow Moving</option>
                </select>
              </div>
            </div>

            {/* Products to Count - Header with count */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium text-[var(--foreground)]">Products to Count</h3>
              <span className="text-sm text-[var(--muted-foreground)]">
                {filteredProductCount} products available
              </span>
            </div>

            {/* Filter pills and Random button */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {selectedProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedProducts([])}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--primary)] text-white flex items-center gap-1.5"
                >
                  Selected ({selectedProducts.length})
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowRandomModal(true)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="5" height="5" rx="1"/>
                  <rect x="17" y="2" width="5" height="5" rx="1"/>
                  <rect x="2" y="17" width="5" height="5" rx="1"/>
                  <rect x="17" y="17" width="5" height="5" rx="1"/>
                </svg>
                Random Select
              </button>
            </div>

            {/* Search bar */}
            <div className="relative mb-4">
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
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name or part number..."
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Product List */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="max-h-80 overflow-auto divide-y divide-[var(--border)]">
                {searchResults.length > 0 ? (
                  searchResults.map(product => {
                    const isSelected = selectedProducts.includes(product.productId);
                    const isLowStock = product.totalQuantity < 50;
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center gap-3 p-3 hover:bg-[var(--muted)]/30 transition-colors ${
                          isSelected ? 'bg-[var(--primary)]/5' : ''
                        }`}
                      >
                        {/* Stock indicator */}
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          isLowStock ? 'bg-orange-500' : 'bg-green-500'
                        }`} />

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-[var(--foreground)]">{product.productName}</span>
                            {isLowStock && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-700 rounded uppercase">
                                Low
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">{product.partNumber}</div>
                        </div>

                        {/* Quantity */}
                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm font-semibold ${isLowStock ? 'text-orange-600' : 'text-[var(--foreground)]'}`}>
                            {product.totalQuantity}
                          </div>
                        </div>

                        {/* Add/Remove button */}
                        {isSelected ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(product.productId)}
                            className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddProduct(product.productId)}
                            className="px-3 py-1 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors flex-shrink-0"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : productSearch ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-[var(--muted-foreground)]">No products found matching &quot;{productSearch}&quot;</p>
                  </div>
                ) : (
                  // Show first 10 products when no search
                  getFilteredProducts().slice(0, 10).map(product => {
                    const isSelected = selectedProducts.includes(product.productId);
                    const isLowStock = product.totalQuantity < 50;
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center gap-3 p-3 hover:bg-[var(--muted)]/30 transition-colors ${
                          isSelected ? 'bg-[var(--primary)]/5' : ''
                        }`}
                      >
                        {/* Stock indicator */}
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          isLowStock ? 'bg-orange-500' : 'bg-green-500'
                        }`} />

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-[var(--foreground)]">{product.productName}</span>
                            {isLowStock && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-orange-100 text-orange-700 rounded uppercase">
                                Low
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">{product.partNumber}</div>
                        </div>

                        {/* Quantity */}
                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm font-semibold ${isLowStock ? 'text-orange-600' : 'text-[var(--foreground)]'}`}>
                            {product.totalQuantity}
                          </div>
                        </div>

                        {/* Add/Remove button */}
                        {isSelected ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(product.productId)}
                            className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddProduct(product.productId)}
                            className="px-3 py-1 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors flex-shrink-0"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Validation message */}
            {selectedProducts.length === 0 && (
              <p className="mt-3 text-sm text-orange-600">
                Please select at least one product to count
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/warehouse/cycle-counts"
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 14l2 2 4-4"/>
            </svg>
            Create Cycle Count
          </button>
        </div>
      </div>

      {/* Random Selection Modal */}
      {showRandomModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-md border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Randomly Select Products</h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Randomly select products based on your current filters
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Current filters summary */}
              {(selectedManufacturerId || (quantityThreshold !== '' && quantityThreshold > 0) || movementSpeed !== 'all') && (
                <div className="px-3 py-2 bg-[var(--muted)]/50 rounded-lg">
                  <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                    Active Filters
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedManufacturerId && (
                      <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded">
                        {factories.find(f => f.id === selectedManufacturerId)?.name}
                      </span>
                    )}
                    {quantityThreshold !== '' && quantityThreshold > 0 && (
                      <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded">
                        Qty &le; {quantityThreshold}
                      </span>
                    )}
                    {movementSpeed !== 'all' && (
                      <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded capitalize">
                        {movementSpeed} Moving
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Number of Products
                </label>
                <input
                  type="number"
                  value={randomCount}
                  onChange={(e) => setRandomCount(parseInt(e.target.value) || 1)}
                  onFocus={(e) => e.target.select()}
                  min={1}
                  max={100}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  How many products to randomly select
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Days Since Last Cycle Count
                </label>
                <input
                  type="number"
                  value={daysSinceLastCount}
                  onChange={(e) => setDaysSinceLastCount(parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  min={0}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Exclude products counted within the last {daysSinceLastCount} days
                </p>
              </div>

              {/* Preview */}
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Up to <span className="font-medium">{randomCount} products</span> will be randomly selected from eligible items
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={() => setShowRandomModal(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRandomSelect}
                className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Select Products
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
