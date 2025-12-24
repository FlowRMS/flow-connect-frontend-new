'use client';

import React, { useState, useMemo } from 'react';
import {
  mockWarehouses,
  getWarehouseFactories,
  mockInventory,
  mockSections,
  mockAisles,
  addCycleCount,
} from '@/lib/data/warehouse-mock';
import {
  CycleCount,
  CycleCountType,
  CycleCountPriority,
  cycleCountTypeLabels,
  cycleCountPriorityLabels,
} from '@/lib/types/warehouse';

interface CreateCycleCountModalProps {
  onClose: () => void;
  onSubmit: (cycleCount: CycleCount) => void;
}

export default function CreateCycleCountModal({ onClose, onSubmit }: CreateCycleCountModalProps) {
  const factories = useMemo(() => getWarehouseFactories(), []);
  const warehouses = useMemo(() => mockWarehouses, []);
  const sections = useMemo(() => mockSections, []);
  const aisles = useMemo(() => mockAisles, []);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CycleCountType>('PARTIAL');
  const [priority, setPriority] = useState<CycleCountPriority>('medium');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || '');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  // Scope state
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedAisles, setSelectedAisles] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedFactories, setSelectedFactories] = useState<string[]>([]);
  const [abcClass, setAbcClass] = useState<'A' | 'B' | 'C' | ''>('');

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const search = productSearch.toLowerCase();
    return mockInventory
      .filter(p =>
        p.productName.toLowerCase().includes(search) ||
        p.partNumber.toLowerCase().includes(search)
      )
      .slice(0, 10);
  }, [productSearch]);

  const handleAddProduct = (productId: string) => {
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts(prev => [...prev, productId]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(id => id !== productId));
  };

  const handleToggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleToggleAisle = (aisleId: string) => {
    setSelectedAisles(prev =>
      prev.includes(aisleId)
        ? prev.filter(id => id !== aisleId)
        : [...prev, aisleId]
    );
  };

  const handleToggleFactory = (factoryId: string) => {
    setSelectedFactories(prev =>
      prev.includes(factoryId)
        ? prev.filter(id => id !== factoryId)
        : [...prev, factoryId]
    );
  };

  const canSubmit = () => {
    return name.trim() && selectedWarehouseId && scheduledDate;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) return;

    const scope: CycleCount['scope'] = {};
    if (selectedSections.length > 0) scope.sections = selectedSections;
    if (selectedAisles.length > 0) scope.aisles = selectedAisles;
    if (selectedProducts.length > 0) scope.products = selectedProducts;
    if (selectedFactories.length > 0) scope.factories = selectedFactories;
    if (abcClass) scope.abcClass = abcClass;

    const newCycleCount = addCycleCount({
      name,
      description: description || undefined,
      type,
      priority,
      status: 'DRAFT',
      warehouseId: selectedWarehouseId,
      warehouseName: selectedWarehouse?.name || '',
      scope,
      scheduledDate: new Date(scheduledDate).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      assignedTo: assignedTo || undefined,
      assignedToName: assignedTo === 'user-003' ? 'Mike Johnson' : assignedTo === 'user-004' ? 'Lisa Anderson' : undefined,
      lineItems: [],
      totalItems: 0,
      countedItems: 0,
      itemsWithVariance: 0,
      notes: notes || undefined,
      createdBy: 'Current User',
    });

    onSubmit(newCycleCount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Cycle Count</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Monthly Full Count - December"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  required
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Count Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CycleCountType)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  {(Object.keys(cycleCountTypeLabels) as CycleCountType[]).map(t => (
                    <option key={t} value={t}>{cycleCountTypeLabels[t]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as CycleCountPriority)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  {(Object.keys(cycleCountPriorityLabels) as CycleCountPriority[]).map(p => (
                    <option key={p} value={p}>{cycleCountPriorityLabels[p]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Assign To
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Unassigned</option>
                  <option value="user-003">Mike Johnson</option>
                  <option value="user-004">Lisa Anderson</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  required
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
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
            </div>

            {/* Scope Section */}
            <div className="border-t border-[var(--border)] pt-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Count Scope
                <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">
                  (Leave empty for full warehouse count)
                </span>
              </h3>

              {/* Sections */}
              {type === 'PARTIAL' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                    Sections
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sections.map(section => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => handleToggleSection(section.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedSections.includes(section.id)
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
                        }`}
                      >
                        {section.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ABC Classification */}
              {type === 'ABC' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                    ABC Class
                  </label>
                  <div className="flex gap-2">
                    {(['A', 'B', 'C'] as const).map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setAbcClass(abcClass === cls ? '' : cls)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          abcClass === cls
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
                        }`}
                      >
                        Class {cls}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    A = High value, B = Medium value, C = Low value
                  </p>
                </div>
              )}

              {/* Products (for PRODUCT type) */}
              {type === 'PRODUCT' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                    Products
                  </label>
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      placeholder="Search products..."
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                    {showProductDropdown && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-auto">
                        {filteredProducts.map(product => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleAddProduct(product.productId)}
                            className="w-full px-3 py-2 text-left hover:bg-[var(--muted)] text-sm"
                          >
                            <div className="font-medium">{product.productName}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">{product.partNumber}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedProducts.map(productId => {
                        const product = mockInventory.find(p => p.productId === productId);
                        return (
                          <span
                            key={productId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--muted)] rounded text-sm"
                          >
                            {product?.partNumber || productId}
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(productId)}
                              className="hover:text-red-500"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                              </svg>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Factories */}
              {(type === 'PRODUCT' || type === 'BLIND') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                    Manufacturers
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {factories.map(factory => (
                      <button
                        key={factory.id}
                        type="button"
                        onClick={() => handleToggleFactory(factory.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedFactories.includes(factory.id)
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
                        }`}
                      >
                        {factory.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or instructions..."
                rows={2}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Cycle Count
          </button>
        </div>
      </div>
    </div>
  );
}
