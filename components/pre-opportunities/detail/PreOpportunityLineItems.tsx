/**
 * Pre-Opportunity Line Items Component
 * Displays line items with optional edit mode for modifying quantities, prices, and end users
 */

'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { PreOpportunity, PreOpportunityDetail, PreOpportunityDetailInput, CustomerSearchResult, ProductSearchResult } from '../types';
import { formatCurrency } from '../utils';
import { useCRMCustomerSearch, useCRMProductSearch } from '../../hooks/useCRMApi';
import { useDebounce } from '../hooks/useDebounce';

interface EditableLineItem {
  id: string;
  itemNumber: number;
  productId: string;
  productCpnId?: string;
  factoryPartNumber: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  leadTime: string;
  endUserId: string;
  endUserName: string;
  isNew?: boolean;
}

interface PreOpportunityLineItemsProps {
  preOpp: PreOpportunity;
  isEditing?: boolean;
  onLineItemsChange?: (items: PreOpportunityDetailInput[]) => void;
}

export function PreOpportunityLineItems({ preOpp, isEditing = false, onLineItemsChange }: PreOpportunityLineItemsProps) {
  // Convert existing details to editable format
  const [editableItems, setEditableItems] = useState<EditableLineItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  
  // Search states
  const [productSearch, setProductSearch] = useState('');
  const [productSearchEnabled, setProductSearchEnabled] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchEnabled, setCustomerSearchEnabled] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [activeCustomerItemId, setActiveCustomerItemId] = useState<string | null>(null);
  
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);
  
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);
  
  const { data: products = [], isLoading: isLoadingProducts } = useCRMProductSearch(
    debouncedProductSearch,
    undefined,
    productSearchEnabled
  );
  const { data: customers = [], isLoading: isLoadingCustomers } = useCRMCustomerSearch(
    debouncedCustomerSearch,
    undefined,
    customerSearchEnabled
  );

  // Fetch all customers for name lookups (view mode)
  const { data: allCustomers = [] } = useCRMCustomerSearch('', undefined, !isEditing);

  // Create lookup map for customer names
  const customerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allCustomers.forEach(c => map.set(c.id, c.companyName));
    // Also include the customers from search results
    customers.forEach(c => map.set(c.id, c.companyName));
    return map;
  }, [allCustomers, customers]);

  // Helper function to get customer name
  const getCustomerName = (customerId: string): string => {
    return customerNameMap.get(customerId) || customerId;
  };

  // Initialize editable items when preOpp changes or edit mode starts
  useEffect(() => {
    if (isEditing) {
      setEditableItems(preOpp.details.map(d => ({
        id: d.id,
        itemNumber: d.itemNumber,
        productId: d.productId,
        productCpnId: d.productCpnId,
        factoryPartNumber: d.product.factoryPartNumber,
        description: d.product.description,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        discountRate: d.discountRate,
        leadTime: d.leadTime || '',
        endUserId: d.endUserId || '',
        endUserName: d.endUserId ? getCustomerName(d.endUserId) : '',
      })));
    }
  }, [isEditing, preOpp.details, customerNameMap]);

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

  // Notify parent of changes
  useEffect(() => {
    if (isEditing && onLineItemsChange) {
      const items: PreOpportunityDetailInput[] = editableItems.map(item => ({
        id: item.isNew ? undefined : item.id,
        itemNumber: item.itemNumber,
        productId: item.productId,
        productCpnId: item.productCpnId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountRate: item.discountRate,
        leadTime: item.leadTime || undefined,
        endUserId: item.endUserId || undefined,
      }));
      onLineItemsChange(items);
    }
  }, [editableItems, isEditing, onLineItemsChange]);

  const generateId = () => {
    idCounterRef.current += 1;
    return `new-${idCounterRef.current}`;
  };

  const handleAddProduct = (product: ProductSearchResult) => {
    const newItem: EditableLineItem = {
      id: generateId(),
      itemNumber: editableItems.length + 1,
      productId: product.id,
      factoryPartNumber: product.factoryPartNumber,
      description: undefined,
      quantity: 1,
      unitPrice: 0,
      discountRate: 0,
      leadTime: '',
      endUserId: preOpp.soldToCustomerId,
      endUserName: '',
      isNew: true,
    };
    setEditableItems([...editableItems, newItem]);
    setProductSearch('');
    setShowProductDropdown(false);
    setShowAddPanel(false);
    setEditingItemId(newItem.id);
  };

  const handleRemoveItem = (itemId: string) => {
    const updated = editableItems.filter(item => item.id !== itemId);
    updated.forEach((item, index) => {
      item.itemNumber = index + 1;
    });
    setEditableItems(updated);
    if (editingItemId === itemId) {
      setEditingItemId(null);
    }
  };

  const handleUpdateItem = (itemId: string, field: keyof EditableLineItem, value: number | string) => {
    setEditableItems(items => 
      items.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSelectEndUser = (itemId: string, customer: CustomerSearchResult) => {
    setEditableItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, endUserId: customer.id, endUserName: customer.companyName }
          : item
      )
    );
    setShowCustomerDropdown(false);
    setActiveCustomerItemId(null);
    setCustomerSearch('');
  };

  const handleProductFocus = () => {
    setProductSearch('');
    setProductSearchEnabled(true);
    setShowProductDropdown(true);
  };

  const handleCustomerFocus = (itemId: string) => {
    setActiveCustomerItemId(itemId);
    setCustomerSearch('');
    setCustomerSearchEnabled(true);
    setShowCustomerDropdown(true);
  };

  const calculateLineTotal = (item: EditableLineItem) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const discountRate = Number(item.discountRate) || 0;
    const subtotal = quantity * unitPrice;
    return subtotal * (1 - discountRate / 100);
  };

  // View mode calculations - ensure proper number handling to avoid NaN
  const totalSubtotal = preOpp.details.reduce((sum, detail) => sum + (Number(detail.subtotal) || 0), 0);
  const totalDiscount = preOpp.details.reduce((sum, detail) => sum + (Number(detail.discount) || 0), 0);
  const grandTotal = Number(preOpp.balance?.total) || (totalSubtotal - totalDiscount);

  // Edit mode calculations - ensure proper number handling
  const editTotalSubtotal = editableItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0);
  const editGrandTotal = editableItems.reduce((sum, item) => sum + (Number(calculateLineTotal(item)) || 0), 0);

  // Render edit mode
  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            <p className="text-sm text-gray-500">
              {editableItems.length === 0 
                ? 'Add products to your pre-opportunity'
                : `${editableItems.length} item${editableItems.length === 1 ? '' : 's'}`
              }
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddPanel(!showAddPanel)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>

        {/* Add Product Panel */}
        {showAddPanel && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900 text-sm">Add New Product</h4>
              <button
                type="button"
                onClick={() => setShowAddPanel(false)}
                className="text-blue-600 hover:text-blue-800 p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div ref={productDropdownRef} className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setProductSearchEnabled(true);
                  setShowProductDropdown(true);
                }}
                onFocus={handleProductFocus}
                placeholder="Click to see all products or type to search..."
                className="w-full px-3 py-2 bg-white text-gray-900 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-sm"
              />
              {isLoadingProducts && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
              {showProductDropdown && products.length > 0 && (
                <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 text-sm"
                    >
                      <div className="font-medium text-gray-900">{product.factoryPartNumber}</div>
                      {product.description && (
                        <div className="text-xs text-gray-500 truncate">{product.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editable Items List */}
        {editableItems.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-500 text-sm">No line items yet. Click &quot;Add Item&quot; to add products.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {editableItems.map((item) => {
              const isItemEditing = editingItemId === item.id;
              const lineTotal = calculateLineTotal(item);
              
              return (
                <div 
                  key={item.id} 
                  className={`border rounded-lg overflow-hidden ${
                    isItemEditing ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                        {item.itemNumber}
                      </span>
                      <span className="font-medium text-gray-900 text-sm">{item.factoryPartNumber}</span>
                      {item.isNew && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">New</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">${lineTotal.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => setEditingItemId(isItemEditing ? null : item.id)}
                        className={`p-1.5 rounded transition-colors ${
                          isItemEditing ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="px-4 py-3">
                    {isItemEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => {
                                const val = e.target.value.replace(/^0+(?=\d)/, '');
                                handleUpdateItem(item.id, 'quantity', val === '' ? 0 : parseInt(val) || 0);
                              }}
                              className="w-full px-2 py-1.5 bg-white text-gray-900 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price ($)</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.unitPrice === 0 ? '' : item.unitPrice}
                              onChange={(e) => {
                                const val = e.target.value.replace(/^0+(?=\d)/, '');
                                handleUpdateItem(item.id, 'unitPrice', val === '' ? 0 : parseFloat(val) || 0);
                              }}
                              className="w-full px-2 py-1.5 bg-white text-gray-900 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.discountRate === 0 ? '' : item.discountRate}
                              onChange={(e) => {
                                const val = e.target.value.replace(/^0+(?=\d)/, '');
                                handleUpdateItem(item.id, 'discountRate', val === '' ? 0 : parseFloat(val) || 0);
                              }}
                              className="w-full px-2 py-1.5 bg-white text-gray-900 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Lead Time</label>
                            <input
                              type="text"
                              value={item.leadTime}
                              onChange={(e) => handleUpdateItem(item.id, 'leadTime', e.target.value)}
                              placeholder="e.g., 2 weeks"
                              className="w-full px-2 py-1.5 bg-white text-gray-900 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        {/* End User Selection */}
                        <div ref={activeCustomerItemId === item.id ? customerDropdownRef : undefined} className="relative">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            End User (Customer)
                            {item.endUserName && <span className="ml-2 text-green-600">✓ {item.endUserName}</span>}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={activeCustomerItemId === item.id ? customerSearch : (item.endUserName || '')}
                              onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setCustomerSearchEnabled(true);
                                setShowCustomerDropdown(true);
                              }}
                              onFocus={() => handleCustomerFocus(item.id)}
                              placeholder="Click to search customers..."
                              className="flex-1 px-2 py-1.5 bg-white text-gray-900 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            />
                            {item.endUserId && (
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(item.id, 'endUserId', '')}
                                className="px-2 py-1.5 text-gray-500 hover:text-gray-700 border border-gray-300 rounded hover:bg-gray-50 text-xs"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          {showCustomerDropdown && activeCustomerItemId === item.id && customers.length > 0 && (
                            <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                              {customers.map((customer) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => handleSelectEndUser(item.id, customer)}
                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 text-sm"
                                >
                                  <div className="font-medium text-gray-900">{customer.companyName}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                        <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-4">
                          <span className="text-gray-500">Qty: <span className="text-gray-900 font-medium">{Math.round(item.quantity)}</span></span>
                          <span className="text-gray-500">Price: <span className="text-gray-900 font-medium">${Number(item.unitPrice).toFixed(2)}</span></span>
                          {item.discountRate > 0 && (
                            <span className="text-gray-500">Discount: <span className="text-red-600 font-medium">{Number(item.discountRate).toFixed(0)}%</span></span>
                          )}
                          {item.leadTime && (
                            <span className="text-gray-500">Lead: <span className="text-gray-900 font-medium">{item.leadTime}</span></span>
                          )}
                        </div>
                        {item.endUserName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {item.endUserName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Edit Mode Total */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
              <div className="text-right">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="ml-2 text-xl font-bold text-blue-600">${editGrandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View mode (original table view)
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
        <span className="text-sm text-gray-500">{preOpp.details.length} items</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {preOpp.details.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  No line items
                </td>
              </tr>
            ) : (
              preOpp.details.map((detail) => (
                <tr key={detail.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{detail.itemNumber}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{detail.product.factoryPartNumber}</div>
                    {detail.product.description && (
                      <div className="text-xs text-gray-500">{detail.product.description}</div>
                    )}
                    {detail.leadTime && (
                      <div className="text-xs text-blue-600">Lead Time: {detail.leadTime}</div>
                    )}
                    {detail.endUserId && (
                      <div className="text-xs text-green-600">End User: {getCustomerName(detail.endUserId)}</div>
                    )}
                    {detail.quote && (
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Quote: {detail.quote.quoteNumber}
                        {detail.quote.status && (
                          <span className="ml-1 px-1 py-0.5 bg-purple-200 rounded text-[10px] uppercase">
                            {detail.quote.status}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{Math.round(Number(detail.quantity) || 0)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(Number(detail.unitPrice) || 0)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(Number(detail.subtotal) || 0)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">
                    {(Number(detail.discount) || 0) > 0 ? (
                        <span className="text-red-600">
                        -{formatCurrency(Number(detail.discount) || 0)} ({Number(detail.discountRate || 0).toFixed(0)}%)
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(Number(detail.total) || 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {preOpp.details.length > 0 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={4}></td>
                <td className="px-4 py-3 text-sm font-medium text-right text-gray-700">Subtotal:</td>
                <td></td>
                <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">
                  {formatCurrency(totalSubtotal)}
                </td>
              </tr>
              {totalDiscount > 0 && (
                <tr>
                  <td colSpan={4}></td>
                  <td className="px-4 py-3 text-sm font-medium text-right text-gray-700">Total Discount:</td>
                  <td></td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-red-600">
                    -{formatCurrency(totalDiscount)}
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={4}></td>
                <td className="px-4 py-3 text-base font-bold text-right text-gray-900">Grand Total:</td>
                <td></td>
                <td className="px-4 py-3 text-lg font-bold text-right text-blue-600">
                  {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
