/**
 * Factory-Grouped Line Items Component
 * Modern, sleek UI for managing line items grouped by factory
 * Users select a factory first, then add products from that factory
 */

'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type {
  FactoryGroup,
  FactoryLineItem,
  FactorySearchResult,
  ProductSearchResult,
  CustomerSearchResult
} from '../types';
import { useCRMFactorySearch, useCRMProductSearch, useCRMCustomerSearch } from '../../hooks/useCRMApi';
import { useDebounce } from '../hooks/useDebounce';

interface FactoryGroupedLineItemsProps {
  groups: FactoryGroup[];
  onGroupsChange: (groups: FactoryGroup[]) => void;
  defaultEndUserId?: string;
  defaultEndUserName?: string;
}

export function FactoryGroupedLineItems({
  groups,
  onGroupsChange,
  defaultEndUserId,
  defaultEndUserName,
}: FactoryGroupedLineItemsProps) {
  // Factory search state
  const [showAddFactory, setShowAddFactory] = useState(false);
  const [factorySearch, setFactorySearch] = useState('');
  const [factorySearchEnabled, setFactorySearchEnabled] = useState(false);
  const [showFactoryDropdown, setShowFactoryDropdown] = useState(false);

  // Product search state (per group)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productSearchEnabled, setProductSearchEnabled] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [activeFactoryIdForProducts, setActiveFactoryIdForProducts] = useState<string | undefined>(undefined);

  // Customer search state (for end user)
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchEnabled, setCustomerSearchEnabled] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [activeItemForCustomer, setActiveItemForCustomer] = useState<{groupId: string; itemId: string} | null>(null);

  // Editing state
  const [editingItem, setEditingItem] = useState<{groupId: string; itemId: string} | null>(null);

  // Refs
  const factoryDropdownRef = useRef<HTMLDivElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);

  // Debounced searches
  const debouncedFactorySearch = useDebounce(factorySearch, 300);
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);

  // API hooks
  const { data: factories = [], isLoading: isLoadingFactories } = useCRMFactorySearch(
    debouncedFactorySearch,
    undefined,
    factorySearchEnabled
  );
  const { data: products = [], isLoading: isLoadingProducts } = useCRMProductSearch(
    debouncedProductSearch,
    activeFactoryIdForProducts,
    productSearchEnabled
  );
  const { data: customers = [], isLoading: isLoadingCustomers } = useCRMCustomerSearch(
    debouncedCustomerSearch,
    undefined,
    customerSearchEnabled
  );

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (factoryDropdownRef.current && !factoryDropdownRef.current.contains(event.target as Node)) {
        setShowFactoryDropdown(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
        setActiveItemForCustomer(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateId = () => {
    idCounterRef.current += 1;
    return `new-${Date.now()}-${idCounterRef.current}`;
  };

  // Factory handlers
  const handleFactoryFocus = () => {
    setFactorySearch('');
    setFactorySearchEnabled(true);
    setShowFactoryDropdown(true);
  };

  const handleAddFactory = (factory: FactorySearchResult) => {
    // Check if factory already exists
    const exists = groups.some(g => g.factoryId === factory.id);
    if (exists) {
      // Just expand that group
      const updated = groups.map(g =>
        g.factoryId === factory.id ? { ...g, isExpanded: true } : g
      );
      onGroupsChange(updated);
    } else {
      const newGroup: FactoryGroup = {
        id: generateId(),
        factoryId: factory.id,
        factoryName: factory.title,
        isExpanded: true,
        lineItems: [],
      };
      onGroupsChange([...groups, newGroup]);
    }
    setFactorySearch('');
    setShowFactoryDropdown(false);
    setShowAddFactory(false);
  };

  const handleRemoveFactory = (groupId: string) => {
    onGroupsChange(groups.filter(g => g.id !== groupId));
  };

  const handleToggleExpand = (groupId: string) => {
    onGroupsChange(groups.map(g =>
      g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g
    ));
  };

  // Product handlers
  const handleProductFocus = (groupId: string, factoryId: string) => {
    setActiveGroupId(groupId);
    setActiveFactoryIdForProducts(factoryId);
    setProductSearch('');
    setProductSearchEnabled(true);
    setShowProductDropdown(true);
  };

  const handleAddProduct = (groupId: string, product: ProductSearchResult) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const newItem: FactoryLineItem = {
      id: generateId(),
      itemNumber: group.lineItems.length + 1,
      productId: product.id,
      factoryId: group.factoryId,
      factoryPartNumber: product.factoryPartNumber,
      description: product.description,
      quantity: 1,
      unitPrice: product.unitPrice || 0,
      discountRate: 0,
      leadTime: product.leadTime || '',
      endUserId: defaultEndUserId || '',
      endUserName: defaultEndUserName || '',
      isNew: true,
    };

    const updated = groups.map(g =>
      g.id === groupId
        ? { ...g, lineItems: [...g.lineItems, newItem] }
        : g
    );
    onGroupsChange(updated);
    setProductSearch('');
    setShowProductDropdown(false);
    setEditingItem({ groupId, itemId: newItem.id });
  };

  const handleRemoveItem = (groupId: string, itemId: string) => {
    const updated = groups.map(g => {
      if (g.id !== groupId) return g;
      const filteredItems = g.lineItems.filter(item => item.id !== itemId);
      // Renumber items
      filteredItems.forEach((item, idx) => {
        item.itemNumber = idx + 1;
      });
      return { ...g, lineItems: filteredItems };
    });
    onGroupsChange(updated);
    if (editingItem?.itemId === itemId) {
      setEditingItem(null);
    }
  };

  const handleUpdateItem = (groupId: string, itemId: string, field: keyof FactoryLineItem, value: string | number) => {
    const updated = groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        lineItems: g.lineItems.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        ),
      };
    });
    onGroupsChange(updated);
  };

  // Customer handlers
  const handleCustomerFocus = (groupId: string, itemId: string) => {
    setActiveItemForCustomer({ groupId, itemId });
    setCustomerSearch('');
    setCustomerSearchEnabled(true);
    setShowCustomerDropdown(true);
  };

  const handleSelectEndUser = (customer: CustomerSearchResult) => {
    if (!activeItemForCustomer) return;
    const { groupId, itemId } = activeItemForCustomer;

    const updated = groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        lineItems: g.lineItems.map(item =>
          item.id === itemId
            ? { ...item, endUserId: customer.id, endUserName: customer.companyName }
            : item
        ),
      };
    });
    onGroupsChange(updated);
    setShowCustomerDropdown(false);
    setActiveItemForCustomer(null);
    setCustomerSearch('');
  };

  // Calculate totals
  const calculateLineTotal = (item: FactoryLineItem) => {
    const subtotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    return subtotal * (1 - (Number(item.discountRate) || 0) / 100);
  };

  const calculateGroupTotal = (group: FactoryGroup) => {
    return group.lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  };

  const grandTotal = groups.reduce((sum, group) => sum + calculateGroupTotal(group), 0);
  const totalItems = groups.reduce((sum, group) => sum + group.lineItems.length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Factories & Products
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {groups.length === 0
              ? 'Add a factory to start adding products'
              : `${groups.length} factor${groups.length === 1 ? 'y' : 'ies'}, ${totalItems} product${totalItems === 1 ? '' : 's'}`
            }
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddFactory(!showAddFactory)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Factory
        </button>
      </div>

      {/* Add Factory Panel */}
      {showAddFactory && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="font-medium text-blue-900">Search Factory</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddFactory(false)}
              className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div ref={factoryDropdownRef} className="relative">
            <input
              type="text"
              value={factorySearch}
              onChange={(e) => {
                setFactorySearch(e.target.value);
                setFactorySearchEnabled(true);
                setShowFactoryDropdown(true);
              }}
              onFocus={handleFactoryFocus}
              placeholder="Click to see all factories or type to search..."
              className="w-full px-4 py-3 bg-white text-gray-900 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-sm"
            />
            {isLoadingFactories && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
            )}
            {showFactoryDropdown && factories.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                {factories.map((factory) => {
                  const isAdded = groups.some(g => g.factoryId === factory.id);
                  return (
                    <button
                      key={factory.id}
                      type="button"
                      onClick={() => handleAddFactory(factory)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                          <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <span className="font-medium text-gray-900">{factory.title}</span>
                      </div>
                      {isAdded && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Added</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Factory Groups */}
      {groups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Factories Added</h4>
          <p className="text-gray-500 text-sm mb-4">Click "Add Factory" to select a factory and start adding products</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm"
            >
              {/* Factory Header */}
              <div
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  group.isExpanded ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleToggleExpand(group.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    group.isExpanded ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{group.factoryName}</h4>
                    <p className="text-sm text-gray-500">
                      {group.lineItems.length} product{group.lineItems.length === 1 ? '' : 's'}
                      {group.lineItems.length > 0 && (
                        <span className="ml-2 text-blue-600 font-medium">
                          ${calculateGroupTotal(group).toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFactory(group.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove factory"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className={`p-2 rounded-lg transition-transform ${group.isExpanded ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Factory Content (Expanded) */}
              {group.isExpanded && (
                <div className="p-4 overflow-visible">
                  {/* Add Product Section */}
                  <div ref={activeGroupId === group.id ? productDropdownRef : undefined} className="relative mb-4">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={activeGroupId === group.id ? productSearch : ''}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setProductSearchEnabled(true);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => handleProductFocus(group.id, group.factoryId)}
                          placeholder={`Search products from ${group.factoryName}...`}
                          className="w-full px-4 py-2.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white placeholder-gray-400 text-sm transition-colors"
                        />
                        {isLoadingProducts && activeGroupId === group.id && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleProductFocus(group.id, group.factoryId)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Product
                      </button>
                    </div>
                    {showProductDropdown && activeGroupId === group.id && products.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                        {products.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleAddProduct(group.id, product)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-gray-900">{product.factoryPartNumber}</span>
                                {product.description && (
                                  <p className="text-xs text-gray-500 truncate mt-0.5">{product.description}</p>
                                )}
                              </div>
                              {product.unitPrice != null && Number(product.unitPrice) > 0 && (
                                <span className="text-sm font-medium text-gray-600">${Number(product.unitPrice).toFixed(2)}</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Line Items */}
                  {group.lineItems.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-sm text-gray-500">No products added yet</p>
                      <p className="text-xs text-gray-400 mt-1">Search above to add products from this factory</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {group.lineItems.map((item) => {
                        const isEditing = editingItem?.groupId === group.id && editingItem?.itemId === item.id;
                        const lineTotal = calculateLineTotal(item);

                        return (
                          <div
                            key={item.id}
                            className={`border rounded-lg transition-all ${
                              isEditing ? 'border-blue-300 bg-blue-50/50 shadow-sm' : 'border-gray-200 bg-white'
                            }`}
                          >
                            {/* Item Header */}
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                                  {item.itemNumber}
                                </span>
                                <span className="font-medium text-gray-900 text-sm">{item.factoryPartNumber}</span>
                                {item.isNew && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-medium">NEW</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-900 text-sm">${lineTotal.toFixed(2)}</span>
                                <button
                                  type="button"
                                  onClick={() => setEditingItem(isEditing ? null : { groupId: group.id, itemId: item.id })}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isEditing ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(group.id, item.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Item Details */}
                            <div className="px-3 py-2">
                              {isEditing ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Qty</label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={item.quantity === 0 ? '' : item.quantity}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/^0+(?=\d)/, '');
                                          handleUpdateItem(group.id, item.id, 'quantity', val === '' ? 0 : parseInt(val) || 0);
                                        }}
                                        className="w-full px-2 py-1.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Unit Price</label>
                                      <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          value={item.unitPrice === 0 ? '' : item.unitPrice}
                                          onChange={(e) => {
                                            const val = e.target.value.replace(/^0+(?=\d)/, '');
                                            handleUpdateItem(group.id, item.id, 'unitPrice', val === '' ? 0 : parseFloat(val) || 0);
                                          }}
                                          className="w-full pl-5 pr-2 py-1.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Discount</label>
                                      <div className="relative">
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          value={item.discountRate === 0 ? '' : item.discountRate}
                                          onChange={(e) => {
                                            const val = e.target.value.replace(/^0+(?=\d)/, '');
                                            handleUpdateItem(group.id, item.id, 'discountRate', val === '' ? 0 : parseFloat(val) || 0);
                                          }}
                                          className="w-full pl-2 pr-5 py-1.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Lead Time</label>
                                      <input
                                        type="text"
                                        value={item.leadTime}
                                        onChange={(e) => handleUpdateItem(group.id, item.id, 'leadTime', e.target.value)}
                                        placeholder="e.g., 2 weeks"
                                        className="w-full px-2 py-1.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                                      />
                                    </div>
                                  </div>

                                  {/* End User */}
                                  <div ref={activeItemForCustomer?.groupId === group.id && activeItemForCustomer?.itemId === item.id ? customerDropdownRef : undefined} className="relative">
                                    <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">
                                      End User
                                      {item.endUserName && <span className="ml-2 text-green-600 normal-case">({item.endUserName})</span>}
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={activeItemForCustomer?.groupId === group.id && activeItemForCustomer?.itemId === item.id
                                          ? customerSearch
                                          : (item.endUserName || '')}
                                        onChange={(e) => {
                                          setCustomerSearch(e.target.value);
                                          setCustomerSearchEnabled(true);
                                          setShowCustomerDropdown(true);
                                        }}
                                        onFocus={() => handleCustomerFocus(group.id, item.id)}
                                        placeholder="Search customer..."
                                        className="flex-1 px-2 py-1.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                                      />
                                      {item.endUserId && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateItem(group.id, item.id, 'endUserId', '');
                                            handleUpdateItem(group.id, item.id, 'endUserName', '');
                                          }}
                                          className="px-2 py-1.5 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs"
                                        >
                                          Clear
                                        </button>
                                      )}
                                    </div>
                                    {showCustomerDropdown && activeItemForCustomer?.groupId === group.id && activeItemForCustomer?.itemId === item.id && customers.length > 0 && (
                                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                                        {customers.map((customer) => (
                                          <button
                                            key={customer.id}
                                            type="button"
                                            onClick={() => handleSelectEndUser(customer)}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 text-sm"
                                          >
                                            <span className="font-medium text-gray-900">{customer.companyName}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex justify-end pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingItem(null)}
                                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                                    >
                                      Done
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    <span className="text-gray-500">Qty: <span className="text-gray-900 font-medium">{Math.round(item.quantity)}</span></span>
                                    <span className="text-gray-500">Price: <span className="text-gray-900 font-medium">${Number(item.unitPrice).toFixed(2)}</span></span>
                                    {item.discountRate > 0 && (
                                      <span className="text-gray-500">Disc: <span className="text-red-600 font-medium">{Number(item.discountRate).toFixed(0)}%</span></span>
                                    )}
                                    {item.leadTime && (
                                      <span className="text-gray-500">Lead: <span className="text-gray-900 font-medium">{item.leadTime}</span></span>
                                    )}
                                  </div>
                                  {item.endUserName && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-[10px]">
                                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
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
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Grand Total */}
          {totalItems > 0 && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{groups.length}</span> factor{groups.length === 1 ? 'y' : 'ies'},
                  <span className="font-medium ml-1">{totalItems}</span> product{totalItems === 1 ? '' : 's'}
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Grand Total:</span>
                  <span className="ml-2 text-2xl font-bold text-blue-600">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
