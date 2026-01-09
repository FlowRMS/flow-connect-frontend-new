/**
 * Duplicate Order Modal Component
 * Modal for entering the new order number and selecting a new sold-to customer when duplicating an order
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useCustomerSearch, type CustomerSearchResult } from '@/components/orders/api/useOrdersApi';

interface DuplicateOrderModalProps {
  isOpen: boolean;
  orderNumber: string;
  currentCustomerId?: string;
  currentCustomerName?: string;
  isPending: boolean;
  onClose: () => void;
  onDuplicate: (newOrderNumber: string, newSoldToCustomerId: string) => void;
}

export function DuplicateOrderModal({
  isOpen,
  orderNumber,
  currentCustomerId,
  currentCustomerName,
  isPending,
  onClose,
  onDuplicate,
}: DuplicateOrderModalProps) {
  const [newOrderNumber, setNewOrderNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Customer selection state
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Fetch customers based on search term
  const { data: customers = [], isLoading: customersLoading } = useCustomerSearch(
    customerSearchTerm,
    isOpen
  );

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewOrderNumber(`${orderNumber}-COPY`);
      setError(null);
      setCustomerSearchTerm('');
      // Pre-select current customer if available
      if (currentCustomerId && currentCustomerName) {
        setSelectedCustomer({
          id: currentCustomerId,
          companyName: currentCustomerName,
          isParent: false,
          published: true,
        });
      } else {
        setSelectedCustomer(null);
      }
      setIsCustomerDropdownOpen(false);
    }
  }, [isOpen, orderNumber, currentCustomerId, currentCustomerName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.customer-dropdown-container')) {
        setIsCustomerDropdownOpen(false);
      }
    };

    if (isCustomerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCustomerDropdownOpen]);

  const handleSelectCustomer = useCallback((customer: CustomerSearchResult) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm('');
    setIsCustomerDropdownOpen(false);
    setError(null);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!newOrderNumber.trim()) {
      setError('Order number is required');
      return;
    }
    if (!selectedCustomer) {
      setError('Please select a sold-to customer');
      return;
    }
    setError(null);
    onDuplicate(newOrderNumber.trim(), selectedCustomer.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isPending && !isCustomerDropdownOpen) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      if (isCustomerDropdownOpen) {
        setIsCustomerDropdownOpen(false);
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Duplicate Order</h3>
              <p className="text-sm text-gray-500">From {orderNumber}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* New Order Number Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Order Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newOrderNumber}
              onChange={(e) => {
                setNewOrderNumber(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter new order number..."
              className={`w-full px-4 py-3 border rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 ${
                error && !newOrderNumber.trim() ? 'border-red-300' : 'border-gray-200'
              }`}
              autoFocus
              disabled={isPending}
            />
          </div>

          {/* Customer Selection Dropdown */}
          <div className="customer-dropdown-container relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sold-To Customer <span className="text-red-500">*</span>
            </label>

            {/* Selected Customer Display / Search Input */}
            <div className="relative">
              {selectedCustomer && !isCustomerDropdownOpen ? (
                <div
                  onClick={() => !isPending && setIsCustomerDropdownOpen(true)}
                  className={`w-full px-4 py-3 border rounded-xl text-sm bg-white text-gray-900 cursor-pointer flex items-center justify-between hover:border-blue-300 transition-colors ${
                    error && !selectedCustomer ? 'border-red-300' : 'border-gray-200'
                  } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>{selectedCustomer.companyName}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search customers..."
                    className={`w-full px-4 py-3 border rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 ${
                      error && !selectedCustomer ? 'border-red-300' : 'border-gray-200'
                    }`}
                    disabled={isPending}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {customersLoading ? (
                      <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                </div>
              )}

              {/* Dropdown Menu */}
              {isCustomerDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {customers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      {customersLoading ? 'Loading...' : customerSearchTerm ? 'No customers found' : 'Type to search customers'}
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className={`px-4 py-3 text-sm cursor-pointer hover:bg-blue-50 transition-colors ${
                          selectedCustomer?.id === customer.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                        }`}
                      >
                        <div className="font-medium">{customer.companyName}</div>
                        {customer.isParent && (
                          <span className="text-xs text-gray-500 ml-2">(Parent)</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
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
            A copy of the order will be created with all line items and details for the selected customer.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !newOrderNumber.trim() || !selectedCustomer}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Duplicating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
