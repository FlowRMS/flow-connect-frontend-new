/**
 * Create Quote from Takeoff Modal Component
 * Creates a quote from crossed items in a takeoff
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createQuote, searchCustomers } from '../../quotes/api/quotesApi';
import type { Quote, CreateQuoteInput, QuoteDetailInput, CustomerSearchResult } from '../../quotes/api/quotesApi';
import type { ParsedItem } from '../types';

interface CreateQuoteFromTakeoffModalProps {
  isOpen: boolean;
  takeoffId: string;
  takeoffName: string;
  clientName?: string;
  crossedItems: ParsedItem[];
  onClose: () => void;
  onSuccess?: (quote: Quote) => void;
}

type ModalStep = 'select-items' | 'input' | 'success';

export function CreateQuoteFromTakeoffModal({
  isOpen,
  takeoffId,
  takeoffName,
  clientName,
  crossedItems,
  onClose,
  onSuccess,
}: CreateQuoteFromTakeoffModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<ModalStep>(crossedItems.length > 0 ? 'select-items' : 'input');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [createdQuote, setCreatedQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set(crossedItems.map(item => item.id)));

  // Customer search state
  const [customerSearchTerm, setCustomerSearchTerm] = useState(clientName || '');
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Calculate totals for selected items
  const selectedItems = useMemo(() => {
    return crossedItems.filter(item => selectedItemIds.has(item.id));
  }, [crossedItems, selectedItemIds]);

  const allSelected = selectedItemIds.size === crossedItems.length && crossedItems.length > 0;
  const noneSelected = selectedItemIds.size === 0;

  // Search customers
  const handleCustomerSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setCustomers([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchCustomers(term, true);
      setCustomers(results);
      setShowCustomerDropdown(true);
    } catch (err) {
      console.error('Failed to search customers:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  const handleCustomerInputChange = useCallback((value: string) => {
    setCustomerSearchTerm(value);
    setSelectedCustomer(null);

    // Simple debounce
    const timeoutId = setTimeout(() => {
      handleCustomerSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [handleCustomerSearch]);

  const handleSelectCustomer = (customer: CustomerSearchResult) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.companyName);
    setShowCustomerDropdown(false);
    setError(null);
  };

  if (!isOpen) return null;

  const handleToggleItem = (itemId: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(crossedItems.map(item => item.id)));
    }
  };

  const handleProceedToInput = () => {
    if (noneSelected) {
      setError('Please select at least one item');
      return;
    }
    setError(null);
    setStep('input');
  };

  const handleCreate = async () => {
    if (!quoteNumber.trim()) {
      setError('Quote number is required');
      return;
    }

    if (!selectedCustomer) {
      setError('Please select a customer');
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      // Convert crossed items to quote detail inputs
      const details: QuoteDetailInput[] = selectedItems.map((item, index) => ({
        itemNumber: index + 1,
        quantity: item.quantity || 1,
        unitPrice: '0', // Price to be set later
        productNameAdhoc: item.crossedManufacturer || item.manufacturer,
        productDescriptionAdhoc: item.crossedDescription || item.description,
        note: `Original: ${item.manufacturer} - ${item.partNumber}`,
        discountRate: '0',
        commissionRate: '0',
        commissionDiscountRate: '0',
      }));

      const input: CreateQuoteInput = {
        quoteNumber: quoteNumber.trim(),
        entityDate: new Date().toISOString().split('T')[0],
        soldToCustomerId: selectedCustomer.id,
        status: 'OPEN',
        pipelineStage: 'PROSPECT',
        creationType: 'API',
        details,
        insidePerLineItem: true,
        outsidePerLineItem: true,
        endUserPerLineItem: false,
        factoryPerLineItem: false,
      };

      const quote = await createQuote(input);

      setCreatedQuote(quote);
      setStep('success');
      onSuccess?.(quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quote');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRedirectToQuote = () => {
    if (createdQuote) {
      router.push(`/quotes/${createdQuote.id}/edit`);
    }
    handleCloseAndReset();
  };

  const handleStayHere = () => {
    handleCloseAndReset();
  };

  const handleCloseAndReset = () => {
    setStep(crossedItems.length > 0 ? 'select-items' : 'input');
    setQuoteNumber('');
    setCreatedQuote(null);
    setError(null);
    setSelectedItemIds(new Set(crossedItems.map(item => item.id)));
    setSelectedCustomer(null);
    setCustomerSearchTerm(clientName || '');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {step === 'select-items' ? (
          <>
            {/* Header - Select Items */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Select Items for Quote</h3>
                  <p className="text-sm text-gray-500">Choose which crossed items to include</p>
                </div>
              </div>
            </div>

            {/* Body - Line Items Selection */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4">
                {/* Select All Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <button
                    onClick={handleToggleAll}
                    className="flex items-center gap-3 group"
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      allSelected
                        ? 'bg-green-600 border-green-600'
                        : 'border-gray-300 group-hover:border-green-400'
                    }`}>
                      {allSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {!allSelected && selectedItemIds.size > 0 && (
                        <div className="w-2 h-0.5 bg-gray-400 rounded"></div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {allSelected ? 'Deselect All' : 'Select All'} ({crossedItems.length} items)
                    </span>
                  </button>
                  <div className="text-sm text-gray-500">
                    <span className="font-semibold text-green-600">{selectedItemIds.size}</span> selected
                  </div>
                </div>

                {/* Line Items List */}
                <div className="space-y-2">
                  {crossedItems.map((item, index) => {
                    const isSelected = selectedItemIds.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50/50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected ? 'bg-green-600 border-green-600' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>

                          {/* Item Number Badge */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isSelected ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 truncate">
                                {item.crossedPartNumber || item.partNumber || 'Unknown Product'}
                              </span>
                              <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs font-medium">
                                {item.crossedManufacturer || 'Our Company'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mb-1">
                              {item.crossedDescription || item.description}
                            </p>
                            <div className="text-xs text-gray-400">
                              Original: {item.manufacturer} - {item.partNumber}
                            </div>
                          </div>

                          {/* Quantity */}
                          <div className="text-right flex-shrink-0">
                            <span className={`text-sm font-bold ${isSelected ? 'text-green-600' : 'text-gray-900'}`}>
                              Qty: {item.quantity || 1}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {error && (
                  <p className="mt-4 text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedItemIds.size} items selected
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCloseAndReset}
                    className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToInput}
                    disabled={noneSelected}
                    className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Continue
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : step === 'input' ? (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-teal-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Quote</h3>
                  <p className="text-sm text-gray-500">From Takeoff: {takeoffName}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex-shrink-0 space-y-4">
              {/* Selected items summary */}
              <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">{selectedItemIds.size} crossed items selected</span>
                  </div>
                  <button
                    onClick={() => setStep('select-items')}
                    className="text-sm text-green-600 hover:text-green-800 font-medium"
                  >
                    Edit Selection
                  </button>
                </div>
              </div>

              {/* Customer Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => handleCustomerInputChange(e.target.value)}
                  onFocus={() => customers.length > 0 && setShowCustomerDropdown(true)}
                  placeholder="Search for a customer..."
                  className={`w-full px-4 py-3 border rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-400 ${
                    error && !selectedCustomer ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {isSearching && (
                  <div className="absolute right-3 top-10">
                    <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </div>
                )}
                {selectedCustomer && (
                  <div className="absolute right-3 top-10">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Customer Dropdown */}
                {showCustomerDropdown && customers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm text-gray-900 border-b border-gray-100 last:border-b-0"
                      >
                        {customer.companyName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quote Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quote Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quoteNumber}
                  onChange={(e) => {
                    setQuoteNumber(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isCreating) {
                      handleCreate();
                    }
                  }}
                  placeholder="Enter quote number..."
                  className={`w-full px-4 py-3 border rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-400 ${
                    error && !quoteNumber.trim() ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              )}

              <p className="text-xs text-gray-500">
                A new quote will be created with {selectedItemIds.size} line items from the crossed products.
                Prices can be adjusted after creation.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between flex-shrink-0">
              <button
                onClick={() => setStep('select-items')}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseAndReset}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !quoteNumber.trim() || !selectedCustomer}
                  className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Quote
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Success Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Quote Created!</h3>
                  <p className="text-sm text-gray-500">Quote #{createdQuote?.quoteNumber}</p>
                </div>
              </div>
            </div>

            {/* Success Body */}
            <div className="px-6 py-6 flex-shrink-0">
              <p className="text-sm text-gray-600 mb-4">
                Your quote has been successfully created from the takeoff. Would you like to view and edit the new quote now?
              </p>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{createdQuote?.quoteNumber}</p>
                    <p className="text-xs text-gray-500">
                      Status: {createdQuote?.status} • {createdQuote?.details?.length || 0} line items
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={handleStayHere}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Stay Here
              </button>
              <button
                onClick={handleRedirectToQuote}
                className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-teal-700 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                View Quote
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
