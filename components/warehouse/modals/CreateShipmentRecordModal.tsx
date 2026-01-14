'use client';

import React, { useState, useEffect } from 'react';
import { fetchFactories, fetchProducts, fetchWarehouses } from '../api/warehouseDeliveriesApi';
import { readCachedLookups } from '../deliveries/receiving/cache';
import { ShipmentStatus } from '@/lib/types/warehouse';

interface ShipmentLineItem {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  expectedQuantity: number;
}

interface CreateShipmentRecordModalProps {
  onClose: () => void;
  onSubmit: (record: ShipmentRecord) => void;
  initialStatus?: ShipmentStatus;
  isSubmitting?: boolean;
  carriers: Array<{ id: string; name: string }>;
}

export interface ShipmentRecord {
  poNumber: string;
  vendorId: string;
  vendorName: string;
  warehouseId: string;
  warehouseName: string;
  eta: string;
  status: ShipmentStatus;
  trackingNumber?: string;
  carrier?: string;
  items: ShipmentLineItem[];
  notes?: string;
}

export default function CreateShipmentRecordModal({
  onClose,
  onSubmit,
  initialStatus,
  isSubmitting = false,
  carriers,
}: CreateShipmentRecordModalProps) {
  const [factories, setFactories] = useState<Array<{ id: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [vendorProducts, setVendorProducts] = useState<Array<{ id: string; factoryPartNumber: string; description?: string | null }>>([]);
  const isArrivingNow = initialStatus === 'ARRIVED';
  const [poNumber, setPoNumber] = useState<string>(`PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [eta, setEta] = useState<string>(
    isArrivingNow
      ? new Date().toISOString().split('T')[0]
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<ShipmentStatus>(initialStatus || 'PENDING');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<ShipmentLineItem[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);

  const selectedVendor = factories.find(f => f.id === selectedVendorId);
  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  useEffect(() => {
    let isActive = true;

    const loadLookups = async () => {
      try {
        const cached = readCachedLookups();
        if (cached.warehouses) {
          setWarehouses(cached.warehouses);
          setSelectedWarehouseId((current) => current || cached.warehouses?.[0]?.id || '');
        }
        if (cached.vendors) {
          setFactories(cached.vendors.map((vendor) => ({ id: vendor.id, name: vendor.title })));
        }

        const [warehouseData, factoryData] = await Promise.all([
          fetchWarehouses(),
          fetchFactories('', true, 100),
        ]);
        if (!isActive) return;
        const warehouseOptions = warehouseData.map((wh) => ({ id: wh.id, name: wh.name }));
        setWarehouses(warehouseOptions);
        setFactories(factoryData.map((factory) => ({ id: factory.id, name: factory.title })));
        setSelectedWarehouseId((current) => current || warehouseData[0]?.id || '');
        try {
          sessionStorage.setItem(
            'warehouseLookupCache',
            JSON.stringify({ warehouses: warehouseOptions })
          );
        } catch {
          // Ignore cache write failures (private mode / quota).
        }
        try {
          sessionStorage.setItem('warehouseVendorsCache', JSON.stringify({ vendors: factoryData }));
        } catch {
          // Ignore cache write failures (private mode / quota).
        }
      } catch (error) {
        console.error('Failed to load warehouse lookups', error);
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
      if (!selectedVendorId) {
        setVendorProducts([]);
        return;
      }
      try {
        const products = await fetchProducts('', selectedVendorId, 200);
        if (!isActive) return;
        setVendorProducts(products);
      } catch (error) {
        console.error('Failed to load vendor products', error);
      }
    };

    void loadProducts();

    return () => {
      isActive = false;
    };
  }, [selectedVendorId]);

  const handleAddProduct = (product: { id: string; factoryPartNumber: string; description?: string | null }) => {
    if (lineItems.some(item => item.productId === product.id)) {
      return;
    }
    setLineItems(prev => [...prev, {
      id: `line-${Date.now()}`,
      productId: product.id,
      productName: product.description || product.factoryPartNumber,
      partNumber: product.factoryPartNumber,
      expectedQuantity: 1,
    }]);
    setShowProductSelector(false);
  };

  const handleRemoveProduct = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, expectedQuantity: Math.max(1, quantity) } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    // For arriving now, line items are optional
    const lineItemsRequired = !isArrivingNow;
    if (!selectedWarehouseId || !poNumber) return;
    if (lineItemsRequired && (lineItems.length === 0 || !selectedVendorId)) return;

    onSubmit({
      poNumber,
      vendorId: selectedVendorId,
      vendorName: selectedVendor?.name || '',
      warehouseId: selectedWarehouseId,
      warehouseName: selectedWarehouse?.name || '',
      eta: new Date(eta).toISOString(),
      status,
      trackingNumber: trackingNumber || undefined,
      carrier: carrier || undefined,
      items: lineItems,
      notes: notes || undefined,
    });
  };

  const totalItems = lineItems.reduce((sum, item) => sum + item.expectedQuantity, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {isArrivingNow ? 'Record Arriving Delivery' : 'Create Delivery Record'}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {isArrivingNow
                ? 'Record a delivery that has arrived - items can be added during receiving'
                : 'Record an expected incoming delivery'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* PO Number and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                PO Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Status
              </label>
              {isArrivingNow ? (
                <div className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--muted)]/50 text-sm text-[var(--foreground)]">
                  Arrived
                </div>
              ) : (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="ARRIVED">Arrived</option>
                </select>
              )}
            </div>
          </div>

          {/* Vendor and Warehouse Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Vendor/Manufacturer {!isArrivingNow && <span className="text-red-500">*</span>}
              </label>
              <select
                value={selectedVendorId}
                onChange={(e) => {
                  setSelectedVendorId(e.target.value);
                  setLineItems([]);
                }}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                required={!isArrivingNow}
              >
                <option value="">Select vendor</option>
                {factories.map((factory) => (
                  <option key={factory.id} value={factory.id}>
                    {factory.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Destination Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                required
              >
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ETA and Carrier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                {isArrivingNow ? 'Arrival Date' : 'Expected Arrival Date'} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Carrier
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              >
                <option value="">Select carrier</option>
                {carriers.map((carrierOption) => (
                  <option key={carrierOption.id} value={carrierOption.name}>{carrierOption.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tracking Number */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Tracking Number
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              placeholder="Enter tracking number if available"
            />
          </div>

          {/* Line Items - Only show for expected shipments or if user wants to add items */}
          {!isArrivingNow ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Expected Items <span className="text-red-500">*</span>
                </label>
                {selectedVendorId && (
                  <button
                    type="button"
                    onClick={() => setShowProductSelector(true)}
                    className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Product
                  </button>
                )}
              </div>

              {!selectedVendorId ? (
                <div className="border border-dashed border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
                  Select a vendor to add products
                </div>
              ) : lineItems.length === 0 ? (
                <div className="border border-dashed border-[var(--border)] rounded-lg p-8 text-center">
                  <p className="text-[var(--muted-foreground)] mb-2">No products added yet</p>
                  <button
                    type="button"
                    onClick={() => setShowProductSelector(true)}
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    Add expected products
                  </button>
                </div>
              ) : (
                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Expected Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm text-[var(--foreground)]">{item.productName}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">{item.partNumber}</div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={item.expectedQuantity}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                              className="w-24 px-2 py-1 border border-[var(--border)] rounded bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(item.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-dashed border-green-300 rounded-lg p-6 bg-green-50/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-[var(--foreground)]">Items will be added during receiving</h4>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Once created, you&apos;ll be taken to the receiving screen where you can scan or add items as they are counted.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
              placeholder="Additional notes..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
          <div className="text-sm text-[var(--muted-foreground)]">
            {lineItems.length > 0 && (
              <span>{lineItems.length} product{lineItems.length !== 1 ? 's' : ''}, {totalItems} total units expected</span>
            )}
            {isArrivingNow && lineItems.length === 0 && (
              <span>No expected items - will be added during receiving</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !selectedWarehouseId ||
                !poNumber ||
                (!isArrivingNow && (lineItems.length === 0 || !selectedVendorId))
              }
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center gap-2">
                {isSubmitting && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                {isSubmitting
                  ? 'Creating...'
                  : isArrivingNow
                    ? 'Create & Start Receiving'
                    : 'Create Record'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Selector Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-lg max-h-[70vh] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-medium text-[var(--foreground)]">Select Product</h3>
              <button
                onClick={() => setShowProductSelector(false)}
                className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {vendorProducts.length === 0 ? (
                <p className="text-center text-[var(--muted-foreground)] py-8">
                  No products found from this vendor
                </p>
              ) : (
                <div className="space-y-2">
                  {vendorProducts.map((product) => {
                    const isAdded = lineItems.some(item => item.productId === product.id);
                    return (
                      <button
                        key={product.id}
                        onClick={() => handleAddProduct(product)}
                        disabled={isAdded}
                        className={`w-full p-3 border rounded-lg text-left transition-colors ${
                          isAdded
                            ? 'border-[var(--border)] bg-[var(--muted)]/50 opacity-50 cursor-not-allowed'
                            : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]/30'
                        }`}
                      >
                        <div className="font-medium text-sm text-[var(--foreground)]">{product.factoryPartNumber}</div>
                        <div className="text-xs text-[var(--muted-foreground)] mt-1">
                          {product.description || '-'}
                        </div>
                        {isAdded && (
                          <span className="text-xs text-green-600 mt-1">Already added</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
