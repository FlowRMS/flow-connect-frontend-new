'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { getWarehouseFactories, mockInventory, mockWarehouses, getManufacturerContacts, getDefaultContact, setDefaultContact, addShipmentRequest } from '@/lib/data/warehouse-mock';
import { ManufacturerContact, ShipmentRequestMethod, ShipmentRequest, shipmentRequestMethodLabels } from '@/lib/types/warehouse';

interface RequestShipmentLineItem {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  requestedQuantity: number;
  currentStock: number;
  reorderPoint?: number;
}

interface RequestShipmentModalProps {
  onClose: () => void;
  onSubmit: (request: ShipmentRequest) => void;
}

export default function RequestShipmentModal({ onClose, onSubmit }: RequestShipmentModalProps) {
  const factories = useMemo(() => getWarehouseFactories(), []);

  // Form state
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(mockWarehouses[0]?.id || '');
  const [requestedDate, setRequestedDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<'standard' | 'expedited' | 'urgent'>('standard');
  const [requestMethod, setRequestMethod] = useState<ShipmentRequestMethod>('EMAIL');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<RequestShipmentLineItem[]>([]);

  // Email-specific state
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [contacts, setContacts] = useState<ManufacturerContact[]>([]);

  // Call/System confirmation state
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmationNotes, setConfirmationNotes] = useState('');

  // Product search state
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const selectedVendor = factories.find(f => f.id === selectedVendorId);
  const selectedWarehouse = mockWarehouses.find(w => w.id === selectedWarehouseId);
  const selectedContact = contacts.find(c => c.id === selectedContactId);

  // Load contacts when vendor changes
  useEffect(() => {
    if (selectedVendorId) {
      const vendorContacts = getManufacturerContacts(selectedVendorId);
      setContacts(vendorContacts);

      // Auto-select default contact
      const defaultContact = getDefaultContact(selectedVendorId);
      if (defaultContact) {
        setSelectedContactId(defaultContact.id);
      } else if (vendorContacts.length > 0) {
        setSelectedContactId(vendorContacts[0].id);
      } else {
        setSelectedContactId('');
      }
    } else {
      setContacts([]);
      setSelectedContactId('');
    }
  }, [selectedVendorId]);

  // Get products available from selected vendor
  const vendorProducts = useMemo(() => {
    if (!selectedVendorId) return [];
    return mockInventory.filter(inv => inv.factoryId === selectedVendorId);
  }, [selectedVendorId]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return vendorProducts;
    const search = productSearch.toLowerCase();
    return vendorProducts.filter(p =>
      p.productName.toLowerCase().includes(search) ||
      p.partNumber.toLowerCase().includes(search)
    );
  }, [vendorProducts, productSearch]);

  const handleAddProduct = (product: typeof mockInventory[0]) => {
    if (lineItems.some(item => item.productId === product.productId)) {
      return;
    }
    const suggestedQty = Math.max(1, (product.reorderPoint || 50) - product.availableQuantity);
    setLineItems(prev => [...prev, {
      id: `line-${Date.now()}`,
      productId: product.productId,
      productName: product.productName,
      partNumber: product.partNumber,
      requestedQuantity: suggestedQty > 0 ? suggestedQty : 10,
      currentStock: product.availableQuantity,
      reorderPoint: product.reorderPoint,
    }]);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const handleRemoveProduct = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, requestedQuantity: Math.max(1, quantity) } : item
    ));
  };

  const handleSetDefaultContact = (contactId: string) => {
    if (selectedVendorId) {
      setDefaultContact(selectedVendorId, contactId);
      // Refresh contacts to reflect the change
      setContacts([...getManufacturerContacts(selectedVendorId)]);
    }
  };

  const canSubmit = () => {
    if (!selectedVendorId || !selectedWarehouseId || lineItems.length === 0) return false;

    if (requestMethod === 'EMAIL' && !selectedContactId) return false;
    if ((requestMethod === 'CALL' || requestMethod === 'MANUFACTURER_SYSTEM') && !isConfirmed) return false;

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) return;

    const newRequest = addShipmentRequest({
      vendorId: selectedVendorId,
      vendorName: selectedVendor?.name || '',
      warehouseId: selectedWarehouseId,
      warehouseName: selectedWarehouse?.name || '',
      requestMethod,
      status: requestMethod === 'EMAIL' ? 'SENT' : 'SENT',
      priority,
      requestedDeliveryDate: new Date(requestedDate).toISOString(),
      items: lineItems,
      totalQuantity: lineItems.reduce((sum, item) => sum + item.requestedQuantity, 0),

      // Email fields
      ...(requestMethod === 'EMAIL' && selectedContact ? {
        contactId: selectedContact.id,
        contactName: selectedContact.name,
        contactEmail: selectedContact.email,
        emailSentAt: new Date().toISOString(),
      } : {}),

      // Call/System confirmation fields
      ...((requestMethod === 'CALL' || requestMethod === 'MANUFACTURER_SYSTEM') ? {
        confirmedAt: new Date().toISOString(),
        confirmedBy: 'Current User', // In real app, get from auth
        confirmationNotes: confirmationNotes || undefined,
      } : {}),

      notes: notes || undefined,
      createdBy: 'Current User',
    });

    onSubmit(newRequest);
  };

  const totalItems = lineItems.reduce((sum, item) => sum + item.requestedQuantity, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Request Shipment</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Request inventory from a vendor/manufacturer
            </p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Vendor and Warehouse Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Vendor/Manufacturer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedVendorId}
                onChange={(e) => {
                  setSelectedVendorId(e.target.value);
                  setLineItems([]);
                  setProductSearch('');
                }}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                required
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
                {mockWarehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Requested Delivery Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'standard' | 'expedited' | 'urgent')}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              >
                <option value="standard">Standard</option>
                <option value="expedited">Expedited</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Product Selection with Search */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Products to Request <span className="text-red-500">*</span>
            </label>

            {selectedVendorId ? (
              <div className="relative mb-3">
                <div className="relative">
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
                    placeholder="Search products by name or part number..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>

                {/* Product Dropdown */}
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {filteredProducts.map((product) => {
                      const isAdded = lineItems.some(item => item.productId === product.productId);
                      const isLowStock = product.availableQuantity <= (product.reorderPoint || 0);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleAddProduct(product)}
                          disabled={isAdded}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-[var(--muted)]/50 transition-colors border-b border-[var(--border)] last:border-b-0 ${
                            isAdded ? 'opacity-50 cursor-not-allowed bg-[var(--muted)]/30' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-[var(--foreground)] truncate">{product.productName}</div>
                            <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{product.partNumber}</div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <div className="text-right">
                              <div className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                                {product.availableQuantity}
                              </div>
                              <div className="text-xs text-[var(--muted-foreground)]">in stock</div>
                            </div>
                            {isAdded ? (
                              <span className="text-xs text-green-600 whitespace-nowrap">Added</span>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {showProductDropdown && productSearch && filteredProducts.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-4 text-center text-[var(--muted-foreground)]">
                    No products found matching "{productSearch}"
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
                Select a vendor to add products
              </div>
            )}

            {/* Selected Products List */}
            {lineItems.length > 0 && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Current Stock</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Request Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {lineItems.map((item) => {
                      const isLowStock = item.currentStock <= (item.reorderPoint || 0);
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm text-[var(--foreground)]">{item.productName}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">{item.partNumber}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                              {item.currentStock}
                            </span>
                            {item.reorderPoint && (
                              <div className="text-xs text-[var(--muted-foreground)]">
                                Reorder: {item.reorderPoint}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, item.requestedQuantity - 10)}
                                className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.requestedQuantity}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                className="w-20 px-2 py-1 border border-[var(--border)] rounded bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.id, item.requestedQuantity + 10)}
                                className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="12" y1="5" x2="12" y2="19"/>
                                  <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(item.id)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Request Method */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Request Method <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['EMAIL', 'CALL', 'MANUFACTURER_SYSTEM'] as ShipmentRequestMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setRequestMethod(method);
                    setIsConfirmed(false);
                    setConfirmationNotes('');
                  }}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    requestMethod === method
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]/20'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {method === 'EMAIL' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    )}
                    {method === 'CALL' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                      </svg>
                    )}
                    {method === 'MANUFACTURER_SYSTEM' && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    )}
                    <span className="font-medium text-sm">{shipmentRequestMethodLabels[method]}</span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {method === 'EMAIL' && 'Send request via email'}
                    {method === 'CALL' && 'Request by phone call'}
                    {method === 'MANUFACTURER_SYSTEM' && 'Submit via vendor portal'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Email Contact Selection */}
          {requestMethod === 'EMAIL' && selectedVendorId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Select Contact <span className="text-red-500">*</span>
              </label>
              {contacts.length > 0 ? (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <label
                      key={contact.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedContactId === contact.id
                          ? 'border-blue-500 bg-white'
                          : 'border-blue-200 hover:border-blue-300 bg-white/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="contact"
                        value={contact.id}
                        checked={selectedContactId === contact.id}
                        onChange={(e) => setSelectedContactId(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-[var(--foreground)]">{contact.name}</span>
                          {contact.isDefaultForOrders && (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Default</span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">{contact.role}</div>
                        <div className="text-xs text-blue-600 mt-0.5">{contact.email}</div>
                      </div>
                      {!contact.isDefaultForOrders && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleSetDefaultContact(contact.id);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Set as default
                        </button>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-blue-700">No contacts available for this vendor.</p>
              )}
            </div>
          )}

          {/* Call/System Confirmation */}
          {(requestMethod === 'CALL' || requestMethod === 'MANUFACTURER_SYSTEM') && (
            <div className={`border rounded-lg p-4 ${
              requestMethod === 'CALL' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="confirmed"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className={`mt-1 rounded ${
                    requestMethod === 'CALL' ? 'text-green-600 focus:ring-green-500' : 'text-purple-600 focus:ring-purple-500'
                  }`}
                />
                <div className="flex-1">
                  <label htmlFor="confirmed" className={`block text-sm font-medium cursor-pointer ${
                    requestMethod === 'CALL' ? 'text-green-800' : 'text-purple-800'
                  }`}>
                    {requestMethod === 'CALL'
                      ? 'I confirm I have called and requested this inventory'
                      : 'I confirm I have submitted this request in the manufacturer system'
                    }
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <p className={`text-xs mt-1 ${
                    requestMethod === 'CALL' ? 'text-green-700' : 'text-purple-700'
                  }`}>
                    {requestMethod === 'CALL'
                      ? 'Check this box after completing your phone call with the vendor.'
                      : 'Check this box after submitting the order in the manufacturer\'s portal.'
                    }
                  </p>
                </div>
              </div>

              {isConfirmed && (
                <div className="mt-3">
                  <label className={`block text-sm font-medium mb-1 ${
                    requestMethod === 'CALL' ? 'text-green-800' : 'text-purple-800'
                  }`}>
                    Confirmation Notes
                  </label>
                  <textarea
                    value={confirmationNotes}
                    onChange={(e) => setConfirmationNotes(e.target.value)}
                    rows={2}
                    placeholder={requestMethod === 'CALL'
                      ? 'Who did you speak with? What was confirmed?'
                      : 'Confirmation number or any relevant details...'
                    }
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
              placeholder="Additional notes or special instructions..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-[var(--muted-foreground)]">
            {lineItems.length > 0 && (
              <span>{lineItems.length} product{lineItems.length !== 1 ? 's' : ''}, {totalItems} total units</span>
            )}
          </div>
          <div className="flex items-center gap-3">
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
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requestMethod === 'EMAIL' ? 'Send Request' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
