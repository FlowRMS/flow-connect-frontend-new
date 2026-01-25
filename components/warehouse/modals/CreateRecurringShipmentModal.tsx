'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  RecurrenceFrequency,
  RecurrencePattern,
  DayOfWeek,
  WeekOfMonth,
  ExpectedItem,
  recurrenceFrequencyLabels,
  dayOfWeekLabels,
  weekOfMonthLabels,
  RecurringShipment,
} from '@/lib/types/warehouse';
import { getRecurrenceDescription, parseDateInput } from '../deliveries/utils/recurrence';
import { useWarehouseLookups, useWarehouseProducts } from '../api/useWarehouseDeliveriesApi';

interface CreateRecurringShipmentModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<RecurringShipment, 'id' | 'createdAt' | 'updatedAt' | 'generatedShipmentIds' | 'lastGeneratedDate' | 'nextExpectedDate'>) => void;
  isSubmitting?: boolean;
}

export default function CreateRecurringShipmentModal({
  onClose,
  onSubmit,
  isSubmitting = false,
}: CreateRecurringShipmentModalProps) {
  const { carriersQuery, vendorsQuery, warehousesQuery } = useWarehouseLookups();

  // Basic info state
  const [name, setName] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [carrier, setCarrier] = useState('');
  const [notes, setNotes] = useState('');

  // Schedule state
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('WEEKLY');
  const [interval, setInterval] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY');
  const [weekOfMonth, setWeekOfMonth] = useState<WeekOfMonth>('FIRST');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [hasEndDate, setHasEndDate] = useState(false);

  // Expected items state
  const [expectedItems, setExpectedItems] = useState<ExpectedItem[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    const vendors = vendorsQuery.data || [];
    const warehouses = warehousesQuery.data || [];
    if (!vendorId && vendors.length > 0) {
      setVendorId(vendors[0]?.id || '');
      setVendorName(vendors[0]?.title || '');
    }
    if (!warehouseId && warehouses.length > 0) {
      setWarehouseId(warehouses[0]?.id || '');
      setWarehouseName(warehouses[0]?.name || '');
    }
  }, [vendorId, warehouseId, vendorsQuery.data, warehousesQuery.data]);

  const productsVendorId = showProductSelector ? vendorId : null;
  const { data: productsData = [] } = useWarehouseProducts(productSearch || '', productsVendorId, 200);
  const factories = useMemo(
    () => (vendorsQuery.data || []).map((vendor) => ({ id: vendor.id, name: vendor.title })),
    [vendorsQuery.data]
  );
  const warehouses = useMemo(
    () => (warehousesQuery.data || []).map((wh) => ({ id: wh.id, name: wh.name })),
    [warehousesQuery.data]
  );
  const carrierOptions = useMemo(
    () => (carriersQuery.data || []).map((carrier) => carrier.name),
    [carriersQuery.data]
  );

  const currentPattern: RecurrencePattern = {
    frequency,
    interval,
    dayOfWeek: ['WEEKLY', 'BIWEEKLY', 'MONTHLY_WEEK'].includes(frequency) ? dayOfWeek : undefined,
    weekOfMonth: frequency === 'MONTHLY_WEEK' ? weekOfMonth : undefined,
    dayOfMonth: frequency === 'MONTHLY' ? dayOfMonth : undefined,
  };

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
    const products = productsData.map((item) => ({
      id: item.id,
      title: item.description || item.factoryPartNumber,
      factoryPartNumber: item.factoryPartNumber,
    }));
    if (!productSearch.trim()) return products.slice(0, 10);
    const search = productSearch.toLowerCase();
    return products
      .filter(p => p.title.toLowerCase().includes(search) || (p.factoryPartNumber || '').toLowerCase().includes(search))
      .slice(0, 10);
  }, [productsData, productSearch]);

  const canSubmit = name.trim() && vendorId && warehouseId && expectedItems.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    onSubmit({
      name,
      vendorId,
      vendorName,
      warehouseId,
      warehouseName,
      carrier: carrier || undefined,
      notes: notes || undefined,
      recurrencePattern: currentPattern,
      startDate,
      endDate: hasEndDate ? endDate : undefined,
      status: 'ACTIVE',
      expectedItems,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Recurring Delivery</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Set up automatic delivery scheduling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info Section */}
            <div className="bg-[var(--muted)]/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Schedule Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Weekly Legrand Restock"
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Vendor <span className="text-red-500">*</span>
                  </label>
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
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Warehouse <span className="text-red-500">*</span>
                  </label>
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
                      {carrierOptions.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
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
                         frequency.includes('MONTHLY') ? 'month(s)' : ''}
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
                    required
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
                <p className="text-xs text-blue-600 mt-1">
                  Starting {parseDateInput(startDate).toLocaleDateString()}
                  {hasEndDate && endDate && ` until ${parseDateInput(endDate).toLocaleDateString()}`}
                </p>
              </div>
            </div>

            {/* Expected Items Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[var(--foreground)]">
                  Expected Items per Delivery <span className="text-red-500">*</span>
                </h3>
                <button
                  type="button"
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
                        type="button"
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
                      type="button"
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
                              type="button"
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
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] hover:bg-[var(--muted)]/80 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Create Recurring Delivery
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
