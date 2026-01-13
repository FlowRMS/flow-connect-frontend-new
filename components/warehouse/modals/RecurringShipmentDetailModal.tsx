'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  RecurringShipment,
  recurringShipmentStatusColors,
  recurringShipmentStatusLabels,
  IncomingShipment,
  RecurrenceFrequency,
  RecurrencePattern,
  DayOfWeek,
  WeekOfMonth,
  ExpectedItem,
  recurrenceFrequencyLabels,
  dayOfWeekLabels,
  weekOfMonthLabels,
} from '@/lib/types/warehouse';
import { getRecurrenceDescription } from '../utils/recurrence';
import { fetchFactories, fetchProducts, fetchWarehouses } from '../api/warehouseDeliveriesApi';

const carriers = ['UPS', 'FedEx', 'USPS', 'DHL', 'Freight', 'Other'];

interface RecurringShipmentDetailModalProps {
  recurring: RecurringShipment;
  linkedShipments: IncomingShipment[];
  onClose: () => void;
  onPause?: () => void;
  onCancel?: () => void;
  onSave?: (updates: Partial<RecurringShipment>) => void;
}

export default function RecurringShipmentDetailModal({
  recurring,
  linkedShipments,
  onClose,
  onPause,
  onCancel,
  onSave,
}: RecurringShipmentDetailModalProps) {
  const router = useRouter();
  const [factories, setFactories] = useState<Array<{ id: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; title: string; factoryPartNumber?: string | null }>>([]);

  // Editable state
  const [name, setName] = useState(recurring.name);
  const [vendorId, setVendorId] = useState(recurring.vendorId);
  const [vendorName, setVendorName] = useState(recurring.vendorName);
  const [warehouseId, setWarehouseId] = useState(recurring.warehouseId);
  const [warehouseName, setWarehouseName] = useState(recurring.warehouseName);
  const [carrier, setCarrier] = useState(recurring.carrier || '');
  const [notes, setNotes] = useState(recurring.notes || '');
  const [startDate, setStartDate] = useState(recurring.startDate);
  const [endDate, setEndDate] = useState(recurring.endDate || '');
  const [hasEndDate, setHasEndDate] = useState(!!recurring.endDate);
  const [expectedItems, setExpectedItems] = useState<ExpectedItem[]>(recurring.expectedItems || []);
  const normalizePattern = (pattern?: RecurrencePattern | null): RecurrencePattern => ({
    frequency: pattern?.frequency || 'MONTHLY',
    interval: pattern?.interval || 1,
    dayOfWeek: pattern?.dayOfWeek || 'MONDAY',
    weekOfMonth: pattern?.weekOfMonth || 'FIRST',
    dayOfMonth: pattern?.dayOfMonth || 1,
  });
  const fallbackPattern = normalizePattern(recurring.recurrencePattern);

  // Recurrence pattern state
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(fallbackPattern.frequency);
  const [interval, setInterval] = useState(fallbackPattern.interval);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(fallbackPattern.dayOfWeek || 'MONDAY');
  const [weekOfMonth, setWeekOfMonth] = useState<WeekOfMonth>(fallbackPattern.weekOfMonth || 'FIRST');
  const [dayOfMonth, setDayOfMonth] = useState(fallbackPattern.dayOfMonth || 1);

  // Product selector state
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadLookups = async () => {
      try {
        const [warehouseData, factoryData] = await Promise.all([
          fetchWarehouses(),
          fetchFactories('', true, 100),
        ]);
        if (!isActive) return;
        setWarehouses(warehouseData.map((wh) => ({ id: wh.id, name: wh.name })));
        setFactories(factoryData.map((factory) => ({ id: factory.id, name: factory.title })));
      } catch (error) {
        console.error('Failed to load recurring shipment lookups', error);
      }
    };

    void loadLookups();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadProducts = async () => {
      if (!vendorId) {
        setProducts([]);
        return;
      }
      try {
        const items = await fetchProducts(productSearch || '', vendorId, 200);
        if (!isActive) return;
        setProducts(items.map((item) => ({
          id: item.id,
          title: item.description || item.factoryPartNumber,
          factoryPartNumber: item.factoryPartNumber,
        })));
      } catch (error) {
        console.error('Failed to load products', error);
      }
    };

    void loadProducts();

    return () => {
      isActive = false;
    };
  }, [vendorId, productSearch]);

  const currentPattern: RecurrencePattern = {
    frequency,
    interval,
    dayOfWeek: ['WEEKLY', 'BIWEEKLY', 'MONTHLY_WEEK'].includes(frequency) ? dayOfWeek : undefined,
    weekOfMonth: frequency === 'MONTHLY_WEEK' ? weekOfMonth : undefined,
    dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined,
  };

  // Check if there are changes
  const hasChanges = useMemo(() => {
    const patternChanged =
      frequency !== fallbackPattern.frequency ||
      interval !== fallbackPattern.interval ||
      dayOfWeek !== (fallbackPattern.dayOfWeek || 'MONDAY') ||
      weekOfMonth !== (fallbackPattern.weekOfMonth || 'FIRST') ||
      dayOfMonth !== (fallbackPattern.dayOfMonth || 1);

    const itemsChanged =
      expectedItems.length !== (recurring.expectedItems || []).length ||
      expectedItems.some((item, i) => {
        const orig = recurring.expectedItems?.[i];
        return !orig || item.productId !== orig.productId || item.expectedQuantity !== orig.expectedQuantity;
      });

    return (
      name !== recurring.name ||
      vendorId !== recurring.vendorId ||
      warehouseId !== recurring.warehouseId ||
      carrier !== (recurring.carrier || '') ||
      notes !== (recurring.notes || '') ||
      startDate !== recurring.startDate ||
      (hasEndDate ? endDate : '') !== (recurring.endDate || '') ||
      patternChanged ||
      itemsChanged
    );
  }, [name, vendorId, warehouseId, carrier, notes, startDate, endDate, hasEndDate, frequency, interval, dayOfWeek, weekOfMonth, dayOfMonth, expectedItems, recurring]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isLate = () => {
    if (recurring.status !== 'ACTIVE' || !recurring.nextExpectedDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(recurring.nextExpectedDate);
    nextDate.setHours(0, 0, 0, 0);
    return nextDate < today;
  };

  const upcomingDelivery = linkedShipments.find(
    s => s.status === 'PENDING' || s.status === 'CONFIRMED'
  );

  const canPause = recurring.status === 'ACTIVE';
  const canCancel = recurring.status !== 'CANCELLED';

  const handleVendorChange = (factoryId: string) => {
    const factory = factories.find(f => f.id === factoryId);
    if (factory) {
      setVendorId(factory.id);
      setVendorName(factory.name);
    }
  };

  const handleWarehouseChange = (whId: string) => {
    const wh = warehouses.find(w => w.id === whId);
    if (wh) {
      setWarehouseId(wh.id);
      setWarehouseName(wh.name);
    }
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    setExpectedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], expectedQuantity: Math.max(1, quantity) };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setExpectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = (product: { id: string; title: string; factoryPartNumber?: string | null }) => {
    // Check if already exists
    if (expectedItems.some(item => item.productId === product.id)) {
      setShowProductSelector(false);
      setProductSearch('');
      return;
    }

    const newItem: ExpectedItem = {
      id: `EI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: product.id,
      productName: product.title,
      partNumber: product.factoryPartNumber || '',
      expectedQuantity: 1,
      receivedQuantity: 0,
      status: 'pending',
    };
    setExpectedItems(prev => [...prev, newItem]);
    setShowProductSelector(false);
    setProductSearch('');
  };

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 10);
    const search = productSearch.toLowerCase();
    return products
      .filter(p => p.title.toLowerCase().includes(search) || (p.factoryPartNumber || '').toLowerCase().includes(search))
      .slice(0, 10);
  }, [products, productSearch]);

  const handleReset = () => {
    setName(recurring.name);
    setVendorId(recurring.vendorId);
    setVendorName(recurring.vendorName);
    setWarehouseId(recurring.warehouseId);
    setWarehouseName(recurring.warehouseName);
    setCarrier(recurring.carrier || '');
    setNotes(recurring.notes || '');
    setStartDate(recurring.startDate);
    setEndDate(recurring.endDate || '');
    setHasEndDate(!!recurring.endDate);
    setExpectedItems(recurring.expectedItems || []);
    setFrequency(fallbackPattern.frequency);
    setInterval(fallbackPattern.interval);
    setDayOfWeek(fallbackPattern.dayOfWeek || 'MONDAY');
    setWeekOfMonth(fallbackPattern.weekOfMonth || 'FIRST');
    setDayOfMonth(fallbackPattern.dayOfMonth || 1);
  };

  const handleSave = () => {
    if (!onSave) return;
    onSave({
      name,
      vendorId,
      vendorName,
      warehouseId,
      warehouseName,
      carrier: carrier || undefined,
      notes: notes || undefined,
      startDate,
      endDate: hasEndDate ? endDate : undefined,
      recurrencePattern: currentPattern,
      expectedItems,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit Recurring Delivery</h2>
              <span className={`px-2 py-1 rounded text-xs font-medium ${recurringShipmentStatusColors[recurring.status]}`}>
                {recurringShipmentStatusLabels[recurring.status]}
              </span>
              {isLate() && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                  Late
                </span>
              )}
            </div>
            {hasChanges && (
              <p className="text-xs text-amber-600 mt-1">Unsaved changes</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upcoming Delivery Link */}
          {upcomingDelivery && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" rx="2" ry="2"/>
                  <path d="M16 8h4a2 2 0 012 2v6a2 2 0 01-2 2h-4"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                Upcoming Delivery
              </h3>
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-700">
                  <span className="font-mono font-medium">{upcomingDelivery.poNumber}</span>
                  <span className="mx-2">·</span>
                  <span>ETA: {formatDate(upcomingDelivery.eta)}</span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    router.push(`/warehouse/deliveries/${upcomingDelivery.id}`);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  View Delivery
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Basic Info Section */}
          <div className="bg-[var(--muted)]/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Schedule Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Vendor</label>
                <select
                  value={vendorId}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  {factories.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Warehouse</label>
                <select
                  value={warehouseId}
                  onChange={(e) => handleWarehouseChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="">Select carrier...</option>
                  {carriers.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
          </div>

          {/* Schedule Settings Section */}
          <div className="bg-[var(--muted)]/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-4">Schedule Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  {Object.entries(recurrenceFrequencyLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {['WEEKLY', 'BIWEEKLY', 'MONTHLY_WEEK'].includes(frequency) && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  >
                    {Object.entries(dayOfWeekLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              {frequency === 'MONTHLY_WEEK' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Week of Month</label>
                  <select
                    value={weekOfMonth}
                    onChange={(e) => setWeekOfMonth(e.target.value as WeekOfMonth)}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  >
                    {Object.entries(weekOfMonthLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              {frequency === 'MONTHLY' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Day of Month</label>
                  <select
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              {frequency !== 'BIWEEKLY' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Repeat Every</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={interval}
                      onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {frequency === 'DAILY' ? 'day(s)' :
                       frequency === 'WEEKLY' ? 'week(s)' :
                       (frequency || '').includes('MONTHLY') ? 'month(s)' : ''}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    id="hasEndDate"
                    checked={hasEndDate}
                    onChange={(e) => setHasEndDate(e.target.checked)}
                    className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <label htmlFor="hasEndDate" className="text-xs font-medium text-[var(--muted-foreground)]">
                    Set End Date
                  </label>
                </div>
                {hasEndDate && (
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                )}
              </div>
            </div>

            {/* Schedule Preview */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <span className="text-xs font-medium text-blue-800">Schedule Preview</span>
              </div>
              <p className="text-sm text-blue-700">{getRecurrenceDescription(currentPattern)}</p>
            </div>
          </div>

          {/* Expected Items Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-[var(--foreground)]">Expected Items per Delivery</h3>
              <button
                onClick={() => setShowProductSelector(true)}
                className="px-3 py-1.5 text-xs font-medium text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 rounded-lg transition-colors flex items-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add Product
              </button>
            </div>

            {/* Product Selector Dropdown */}
            {showProductSelector && (
              <div className="mb-4 border border-[var(--border)] rounded-lg bg-[var(--card)] shadow-lg">
                <div className="p-3 border-b border-[var(--border)]">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)]/50 flex items-center justify-between"
                    >
                      <span className="font-medium">{product.title}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{product.factoryPartNumber || 'No part number'}</span>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="px-3 py-4 text-sm text-[var(--muted-foreground)] text-center">
                      No products found
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-[var(--border)]">
                  <button
                    onClick={() => {
                      setShowProductSelector(false);
                      setProductSearch('');
                    }}
                    className="w-full px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {expectedItems.length === 0 ? (
              <div className="border border-dashed border-[var(--border)] rounded-lg p-8 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">No products added yet. Click &quot;Add Product&quot; to get started.</p>
              </div>
            ) : (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Part Number</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase w-32">Quantity</th>
                      <th className="px-4 py-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {expectedItems.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-[var(--foreground)]">{item.productName}</td>
                        <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{item.partNumber}</td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="1"
                            value={item.expectedQuantity}
                            onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-20 px-2 py-1 text-sm text-right border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[var(--muted)]/30">
                      <td colSpan={2} className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">Total</td>
                      <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)] text-right">
                        {expectedItems.reduce((sum, item) => sum + item.expectedQuantity, 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Recent Deliveries */}
          {linkedShipments.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Recent Deliveries</h3>
              <div className="space-y-2">
                {linkedShipments.slice(0, 5).map((shipment) => (
                  <div
                    key={shipment.id}
                    className="flex items-center justify-between bg-[var(--muted)]/20 rounded-lg px-3 py-2 cursor-pointer hover:bg-[var(--muted)]/40 transition-colors"
                    onClick={() => {
                      onClose();
                      router.push(`/warehouse/deliveries/${shipment.id}`);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[var(--foreground)]">{shipment.poNumber}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        shipment.status === 'RECEIVED' ? 'bg-green-100 text-green-700' :
                        shipment.status === 'ARRIVED' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {shipment.status === 'RECEIVED' ? 'Received' :
                         shipment.status === 'ARRIVED' ? 'Arrived' :
                         'Expected'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <span>ETA: {formatDate(shipment.eta)}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  </div>
                ))}
                {linkedShipments.length > 5 && (
                  <p className="text-xs text-[var(--muted-foreground)] text-center">
                    + {linkedShipments.length - 5} more deliveries
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            {canCancel && onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
              >
                Cancel Schedule
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </>
            )}
            {canPause && onPause && !hasChanges && (
              <button
                onClick={onPause}
                className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
              >
                Pause
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
