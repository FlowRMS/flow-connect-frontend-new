/**
 * Create Pre-Opportunity Modal
 * Modal for creating new pre-opportunities with customer/product/factory search and validation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useCreateCRMPreOpportunity, useCRMCustomerSearch, useCRMProductSearch, useCRMFactorySearch } from '../../hooks/useCRMApi';
import type { CreatePreOpportunityInput, PreOpportunityDetailInput, PreOpportunityStatus, ProductSearchResult, FactorySearchResult, CustomerSearchResult } from '../types';

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface CreatePreOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialStatus?: PreOpportunityStatus;
}

interface SelectedProductInfo extends PreOpportunityDetailInput {
  factoryPartNumber?: string;
  factoryName?: string;
}

export function CreatePreOpportunityModal({ isOpen, onClose, onSuccess, initialStatus }: CreatePreOpportunityModalProps) {
  const createMutation = useCreateCRMPreOpportunity();

  // Form state
  const [entityNumber, setEntityNumber] = useState('');
  const [entityDate, setEntityDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<PreOpportunityStatus>(initialStatus || 'DRAFT');
  const [expDate, setExpDate] = useState('');
  const [customerRef, setCustomerRef] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [freightTerms, setFreightTerms] = useState('');

  // Customer search states
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerValidated, setCustomerValidated] = useState(false);
  const [customerValidationError, setCustomerValidationError] = useState('');

  // Factory search states
  const [factorySearch, setFactorySearch] = useState('');
  const [selectedFactoryId, setSelectedFactoryId] = useState('');
  const [selectedFactoryName, setSelectedFactoryName] = useState('');
  const [showFactoryDropdown, setShowFactoryDropdown] = useState(false);
  const [factoryValidated, setFactoryValidated] = useState(false);
  const [factoryValidationError, setFactoryValidationError] = useState('');
  
  // Product search states
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductInfo[]>([]);

  // Debounced search values for auto-search (300ms delay)
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);
  const debouncedFactorySearch = useDebounce(factorySearch, 300);
  const debouncedProductSearch = useDebounce(productSearch, 300);

  // Search queries - use debounced values for automatic search
  const { data: customers = [], isLoading: isLoadingCustomers } = useCRMCustomerSearch(
    customerValidated ? '' : debouncedCustomerSearch
  );
  const { data: factories = [], isLoading: isLoadingFactories } = useCRMFactorySearch(
    factoryValidated ? '' : debouncedFactorySearch
  );
  const { data: products = [], isLoading: isLoadingProducts } = useCRMProductSearch(
    debouncedProductSearch, 
    selectedFactoryId || undefined
  );

  // Auto-show dropdown when debounced search has results
  useEffect(() => {
    if (debouncedCustomerSearch.length >= 2 && !customerValidated) {
      setShowCustomerDropdown(true);
    }
  }, [debouncedCustomerSearch, customerValidated]);

  useEffect(() => {
    if (debouncedFactorySearch.length >= 2 && !factoryValidated) {
      setShowFactoryDropdown(true);
    }
  }, [debouncedFactorySearch, factoryValidated]);

  useEffect(() => {
    if (debouncedProductSearch.length >= 2) {
      setShowProductDropdown(true);
    }
  }, [debouncedProductSearch]);

  const handleSelectCustomer = (customer: CustomerSearchResult) => {
    setSelectedCustomerId(customer.id);
    setSelectedCustomerName(customer.companyName);
    setCustomerSearch(customer.companyName);
    setCustomerValidated(true);
    setCustomerValidationError('');
    setShowCustomerDropdown(false);
  };

  const handleSelectFactory = (factory: FactorySearchResult) => {
    setSelectedFactoryId(factory.id);
    setSelectedFactoryName(factory.title);
    setFactorySearch(factory.title);
    setFactoryValidated(true);
    setFactoryValidationError('');
    setShowFactoryDropdown(false);
  };

  const handleAddProduct = (product: ProductSearchResult) => {
    const newDetail: SelectedProductInfo = {
      itemNumber: selectedProducts.length + 1,
      productId: product.id,
      quantity: 1,
      unitPrice: 0,
      discountRate: 0,
      factoryPartNumber: product.factoryPartNumber,
      factoryName: selectedFactoryName,
    };
    setSelectedProducts([...selectedProducts, newDetail]);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const handleRemoveProduct = (index: number) => {
    const updated = selectedProducts.filter((_, i) => i !== index);
    // Re-number the items
    updated.forEach((p, i) => { p.itemNumber = i + 1; });
    setSelectedProducts(updated);
  };

  const handleUpdateProduct = (index: number, field: keyof SelectedProductInfo, value: number | string) => {
    const updated = [...selectedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedProducts(updated);
  };

  const clearCustomer = () => {
    setSelectedCustomerId('');
    setSelectedCustomerName('');
    setCustomerSearch('');
    setCustomerValidated(false);
  };

  const clearFactory = () => {
    setSelectedFactoryId('');
    setSelectedFactoryName('');
    setFactorySearch('');
    setFactoryValidated(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId || !customerValidated) {
      setCustomerValidationError('Please search and select a valid customer');
      return;
    }

    if (selectedProducts.length === 0) {
      alert('Please add at least one product');
      return;
    }

    // Map to API input format (remove display-only fields)
    // Use selectedCustomerId as endUserId if not explicitly set
    const details: PreOpportunityDetailInput[] = selectedProducts.map(p => ({
      itemNumber: p.itemNumber,
      productId: p.productId,
      productCpnId: p.productCpnId,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      discountRate: p.discountRate,
      leadTime: p.leadTime,
      endUserId: p.endUserId || selectedCustomerId,
    }));

    const input: CreatePreOpportunityInput = {
      entityNumber,
      entityDate,
      status,
      soldToCustomerId: selectedCustomerId,
      expDate: expDate || undefined,
      customerRef: customerRef || undefined,
      paymentTerms: paymentTerms || undefined,
      freightTerms: freightTerms || undefined,
      details,
    };

    try {
      await createMutation.mutateAsync(input);
      onSuccess();
    } catch (error) {
      console.error('Failed to create pre-opportunity:', error);
      alert(error instanceof Error ? error.message : 'Failed to create pre-opportunity');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">Create Pre-Opportunity</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entity Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={entityNumber}
                  onChange={(e) => setEntityNumber(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="PO-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entity Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={entityDate}
                  onChange={(e) => setEntityDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PreOpportunityStatus)}
                  required
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CONVERTED">Converted</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Customer Selection with Search Button */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Customer</h3>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Customer <span className="text-red-500">*</span>
                {customerValidated && selectedCustomerName && (
                  <span className="ml-2 text-green-600 font-normal">✓ {selectedCustomerName}</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setCustomerValidated(false);
                    setCustomerValidationError('');
                    // Don't immediately show dropdown, let debounce handle it
                    if (e.target.value.length < 2) {
                      setShowCustomerDropdown(false);
                    }
                  }}
                  placeholder="Enter customer name to search..."
                  className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
                {isLoadingCustomers && customerSearch.length >= 2 && !customerValidated && (
                  <div className="flex items-center px-3">
                    <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                )}
                {customerValidated && (
                  <button
                    type="button"
                    onClick={clearCustomer}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
              {customerValidationError && (
                <p className="mt-1 text-sm text-red-600">{customerValidationError}</p>
              )}
              {showCustomerDropdown && customers.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{customer.companyName}</div>
                      <div className="text-xs text-gray-500">ID: {customer.id.slice(0, 8)}...</div>
                    </button>
                  ))}
                </div>
              )}
              {showCustomerDropdown && !isLoadingCustomers && customers.length === 0 && customerSearch.length >= 2 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                  No customers found matching "{customerSearch}"
                </div>
              )}
            </div>
          </div>

          {/* Additional Fields */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Additional Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Reference
                </label>
                <input
                  type="text"
                  value={customerRef}
                  onChange={(e) => setCustomerRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Optional reference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="Net 30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Freight Terms
                </label>
                <input
                  type="text"
                  value={freightTerms}
                  onChange={(e) => setFreightTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  placeholder="FOB"
                />
              </div>
            </div>
          </div>

          {/* Factory Selection with Search Button */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Factory & Products</h3>
            <div className="relative mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Factory (Optional - filters product search)
                {factoryValidated && selectedFactoryName && (
                  <span className="ml-2 text-green-600 font-normal">✓ {selectedFactoryName}</span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={factorySearch}
                  onChange={(e) => {
                    setFactorySearch(e.target.value);
                    setFactoryValidated(false);
                    setFactoryValidationError('');
                    // Don't immediately show dropdown, let debounce handle it
                    if (e.target.value.length < 2) {
                      setShowFactoryDropdown(false);
                    }
                  }}
                  placeholder="Enter factory name to search..."
                  className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
                {isLoadingFactories && factorySearch.length >= 2 && !factoryValidated && (
                  <div className="flex items-center px-3">
                    <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                )}
                {factoryValidated && (
                  <button
                    type="button"
                    onClick={clearFactory}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
              {factoryValidationError && (
                <p className="mt-1 text-sm text-red-600">{factoryValidationError}</p>
              )}
              {showFactoryDropdown && factories.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {factories.map((factory) => (
                    <button
                      key={factory.id}
                      type="button"
                      onClick={() => handleSelectFactory(factory)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{factory.title}</div>
                      <div className="text-xs text-gray-500">ID: {factory.id.slice(0, 8)}...</div>
                    </button>
                  ))}
                </div>
              )}
              {showFactoryDropdown && !isLoadingFactories && factories.length === 0 && factorySearch.length >= 2 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                  No factories found matching "{factorySearch}"
                </div>
              )}
            </div>

            {/* Product Selection with Search Button */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Products <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    // Don't immediately show dropdown, let debounce handle it
                    if (e.target.value.length < 2) {
                      setShowProductDropdown(false);
                    }
                  }}
                  placeholder="Enter product/part number to search..."
                  className="flex-1 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
                {isLoadingProducts && productSearch.length >= 2 && (
                  <div className="flex items-center px-3">
                    <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                )}
              </div>
              {selectedFactoryName && (
                <p className="mt-1 text-xs text-blue-600">Filtering products by factory: {selectedFactoryName}</p>
              )}
              {showProductDropdown && products.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
              )}
              {showProductDropdown && !isLoadingProducts && products.length === 0 && productSearch.length >= 2 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                  No products found matching "{productSearch}"
                </div>
              )}
            </div>
          </div>

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Selected Products ({selectedProducts.length})
              </h3>
              <div className="space-y-3">
                {selectedProducts.map((product, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          #{product.itemNumber} - {product.factoryPartNumber || 'Product'}
                        </span>
                        {product.factoryName && (
                          <span className="ml-2 text-xs text-gray-500">({product.factoryName})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => handleUpdateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                          min="1"
                          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price ($)</label>
                        <input
                          type="number"
                          value={product.unitPrice}
                          onChange={(e) => handleUpdateProduct(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
                        <input
                          type="number"
                          value={product.discountRate || 0}
                          onChange={(e) => handleUpdateProduct(index, 'discountRate', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    {/* Line total preview */}
                    <div className="mt-2 text-right text-sm text-gray-600">
                      Line Total: <span className="font-semibold text-gray-900">
                        ${((product.quantity * product.unitPrice) * (1 - (product.discountRate || 0) / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !customerValidated || selectedProducts.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Pre-Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
