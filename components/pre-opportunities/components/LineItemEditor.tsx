/**
 * Line Item Editor Component
 * Allows easy adding, editing, and removing of line items
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { ProductSearchResult, CustomerSearchResult } from '../types';

interface LineItem {
  id: string;
  itemNumber: number;
  productId: string;
  factoryPartNumber?: string;
  factoryName?: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  leadTime?: string;
  endUserId?: string;
  endUserName?: string;
}

interface LineItemEditorProps {
  items: LineItem[];
  onItemsChange: (items: LineItem[]) => void;
  products: ProductSearchResult[];
  isLoadingProducts: boolean;
  onProductSearch: (term: string) => void;
  onProductFocus: () => void;
  customers: CustomerSearchResult[];
  isLoadingCustomers: boolean;
  onCustomerSearch: (term: string) => void;
  onCustomerFocus: () => void;
  defaultEndUserId?: string;
  defaultEndUserName?: string;
  factoryName?: string;
}

export function LineItemEditor({
  items,
  onItemsChange,
  products,
  isLoadingProducts,
  onProductSearch,
  onProductFocus,
  customers,
  isLoadingCustomers,
  onCustomerSearch,
  onCustomerFocus,
  defaultEndUserId,
  defaultEndUserName,
  factoryName,
}: LineItemEditorProps) {
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [customerSearchValue, setCustomerSearchValue] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [activeCustomerItemId, setActiveCustomerItemId] = useState<string | null>(null);
  
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
        setActiveCustomerItemId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateId = () => {
    idCounterRef.current += 1;
    return `temp-${idCounterRef.current}`;
  };

  const handleAddProduct = (product: ProductSearchResult) => {
    const newItem: LineItem = {
      id: generateId(),
      itemNumber: items.length + 1,
      productId: product.id,
      factoryPartNumber: product.factoryPartNumber,
      factoryName: factoryName,
      quantity: 1,
      unitPrice: 0,
      discountRate: 0,
      endUserId: defaultEndUserId,
      endUserName: defaultEndUserName,
    };
    onItemsChange([...items, newItem]);
    setProductSearchValue('');
    setShowProductDropdown(false);
    setShowAddPanel(false);
    setEditingItemId(newItem.id);
  };

  const handleRemoveItem = (itemId: string) => {
    const updated = items.filter(item => item.id !== itemId);
    // Re-number items
    updated.forEach((item, index) => {
      item.itemNumber = index + 1;
    });
    onItemsChange(updated);
    if (editingItemId === itemId) {
      setEditingItemId(null);
    }
  };

  const handleUpdateItem = (itemId: string, field: keyof LineItem, value: number | string) => {
    const updated = items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    onItemsChange(updated);
  };

  const handleSelectEndUser = (itemId: string, customer: CustomerSearchResult) => {
    const updated = items.map(item => 
      item.id === itemId 
        ? { ...item, endUserId: customer.id, endUserName: customer.companyName }
        : item
    );
    onItemsChange(updated);
    setShowCustomerDropdown(false);
    setActiveCustomerItemId(null);
    setCustomerSearchValue('');
  };

  const calculateLineTotal = (item: LineItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const discount = subtotal * (item.discountRate / 100);
    return subtotal - discount;
  };

  const handleProductFocus = () => {
    onProductFocus();
    setShowProductDropdown(true);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setProductSearchValue(term);
    onProductSearch(term);
    setShowProductDropdown(true);
  };

  const handleCustomerFocus = (itemId: string) => {
    setActiveCustomerItemId(itemId);
    onCustomerFocus();
    setShowCustomerDropdown(true);
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setCustomerSearchValue(term);
    onCustomerSearch(term);
    setShowCustomerDropdown(true);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
          <p className="text-sm text-gray-500 mt-1">
            {items.length === 0 
              ? 'Add products to your pre-opportunity'
              : `${items.length} item${items.length === 1 ? '' : 's'} added`
            }
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddPanel(!showAddPanel)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Line Item
        </button>
      </div>

      {/* Add Product Panel */}
      {showAddPanel && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-900">Search & Add Product</h4>
            <button
              type="button"
              onClick={() => setShowAddPanel(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div ref={productDropdownRef} className="relative">
            <input
              type="text"
              value={productSearchValue}
              onChange={handleProductChange}
              onFocus={handleProductFocus}
              placeholder="Click to see all products or type to search..."
              className="w-full px-4 py-3 bg-white text-gray-900 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
            {isLoadingProducts && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            )}
            {showProductDropdown && (
              <>
                {products.length > 0 ? (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleAddProduct(product)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{product.factoryPartNumber}</div>
                        <div className="text-xs text-gray-500">Factory ID: {product.factoryId}</div>
                      </button>
                    ))}
                  </div>
                ) : !isLoadingProducts ? (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    {productSearchValue ? `No products found for "${productSearchValue}"` : 'No products available'}
                  </div>
                ) : null}
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-blue-700">
            💡 Tip: Click the field to see all available products, or start typing to filter
          </p>
        </div>
      )}

      {/* Line Items List */}
      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Line Items Yet</h4>
          <p className="text-gray-500 mb-4">Click "Add Line Item" button above to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isEditing = editingItemId === item.id;
            const lineTotal = calculateLineTotal(item);
            
            return (
              <div 
                key={item.id} 
                className={`border rounded-lg overflow-hidden transition-all ${
                  isEditing ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-white'
                }`}
              >
                {/* Item Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
                      {item.itemNumber}
                    </span>
                    <div>
                      <span className="font-medium text-gray-900">{item.factoryPartNumber || 'Product'}</span>
                      {item.factoryName && (
                        <span className="ml-2 text-xs text-gray-500">({item.factoryName})</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      ${lineTotal.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingItemId(isEditing ? null : item.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isEditing 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Item Details - Always shown in compact form, expanded when editing */}
                <div className="px-4 py-3">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*$/.test(val)) {
                                handleUpdateItem(item.id, 'quantity', val === '' ? 0 : parseInt(val, 10));
                              }
                            }}
                            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price ($)</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.unitPrice || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                handleUpdateItem(item.id, 'unitPrice', val === '' ? 0 : parseFloat(val));
                              }
                            }}
                            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.discountRate || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                const numVal = val === '' ? 0 : parseFloat(val);
                                if (numVal <= 100) {
                                  handleUpdateItem(item.id, 'discountRate', numVal);
                                }
                              }
                            }}
                            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Lead Time</label>
                          <input
                            type="text"
                            value={item.leadTime || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'leadTime', e.target.value)}
                            placeholder="e.g., 2 weeks"
                            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      {/* End User Selection */}
                      <div ref={activeCustomerItemId === item.id ? customerDropdownRef : undefined} className="relative">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          End User (Customer)
                          {item.endUserName && (
                            <span className="ml-2 text-green-600">✓ {item.endUserName}</span>
                          )}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={activeCustomerItemId === item.id ? customerSearchValue : (item.endUserName || '')}
                            onChange={handleCustomerChange}
                            onFocus={() => handleCustomerFocus(item.id)}
                            placeholder="Click to see all customers or type to search..."
                            className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                          />
                          {item.endUserId && (
                            <button
                              type="button"
                              onClick={() => handleUpdateItem(item.id, 'endUserId', '')}
                              className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        {showCustomerDropdown && activeCustomerItemId === item.id && (
                          <>
                            {customers.length > 0 ? (
                              <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                {customers.map((customer) => (
                                  <button
                                    key={customer.id}
                                    type="button"
                                    onClick={() => handleSelectEndUser(item.id, customer)}
                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-gray-900">{customer.companyName}</div>
                                    <div className="text-xs text-gray-500">ID: {customer.id.slice(0, 8)}...</div>
                                  </button>
                                ))}
                              </div>
                            ) : !isLoadingCustomers ? (
                              <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                                {customerSearchValue ? `No customers found for "${customerSearchValue}"` : 'No customers available'}
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingItemId(null)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Done Editing
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex gap-6">
                        <span className="text-gray-500">Qty: <span className="text-gray-900 font-medium">{Math.round(item.quantity)}</span></span>
                        <span className="text-gray-500">Price: <span className="text-gray-900 font-medium">${Number(item.unitPrice).toFixed(2)}</span></span>
                        {item.discountRate > 0 && (
                          <span className="text-gray-500">Discount: <span className="text-red-600 font-medium">{Number(item.discountRate).toFixed(0)}%</span></span>
                        )}
                        {item.leadTime && (
                          <span className="text-gray-500">Lead: <span className="text-gray-900 font-medium">{item.leadTime}</span></span>
                        )}
                      </div>
                      <div>
                        {item.endUserName ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {item.endUserName}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No end user assigned</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Total Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
            <div className="text-right">
              <span className="text-sm text-gray-500">Total:</span>
              <span className="ml-3 text-2xl font-bold text-blue-600">
                ${items.reduce((sum, item) => sum + calculateLineTotal(item), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
