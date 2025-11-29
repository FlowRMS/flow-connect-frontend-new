/**
 * Customer Selection Section for Create Pre-Opportunity Modal
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { CustomerSearchResult } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';

interface CustomerSelectionSectionProps {
  // Sold To Customer
  soldToCustomerId: string;
  soldToCustomerName: string;
  onSoldToCustomerSelect: (customer: CustomerSearchResult) => void;
  onSoldToCustomerClear: () => void;
  soldToCustomerError?: string;
  // Bill To Customer
  billToCustomerId: string;
  billToCustomerName: string;
  onBillToCustomerSelect: (customer: CustomerSearchResult) => void;
  onBillToCustomerClear: () => void;
  // Customer data
  customers: CustomerSearchResult[];
  isLoadingCustomers: boolean;
  onCustomerSearch: (term: string, allowEmpty: boolean) => void;
}

export function CustomerSelectionSection({
  soldToCustomerId,
  soldToCustomerName,
  onSoldToCustomerSelect,
  onSoldToCustomerClear,
  soldToCustomerError,
  billToCustomerId,
  billToCustomerName,
  onBillToCustomerSelect,
  onBillToCustomerClear,
  customers,
  isLoadingCustomers,
  onCustomerSearch,
}: CustomerSelectionSectionProps) {
  // Sold To Customer states
  const [soldToSearch, setSoldToSearch] = useState('');
  const [showSoldToDropdown, setShowSoldToDropdown] = useState(false);
  const soldToRef = useRef<HTMLDivElement>(null);
  
  // Bill To Customer states
  const [billToSearch, setBillToSearch] = useState('');
  const [showBillToDropdown, setShowBillToDropdown] = useState(false);
  const billToRef = useRef<HTMLDivElement>(null);
  
  // Track which field is active
  const [activeField, setActiveField] = useState<'soldTo' | 'billTo' | null>(null);

  const debouncedSearch = useDebounce(activeField === 'soldTo' ? soldToSearch : billToSearch, 300);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (soldToRef.current && !soldToRef.current.contains(event.target as Node)) {
        setShowSoldToDropdown(false);
        if (activeField === 'soldTo') setActiveField(null);
      }
      if (billToRef.current && !billToRef.current.contains(event.target as Node)) {
        setShowBillToDropdown(false);
        if (activeField === 'billTo') setActiveField(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeField]);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (activeField) {
      onCustomerSearch(debouncedSearch, true);
    }
  }, [debouncedSearch, activeField, onCustomerSearch]);

  const handleSoldToFocus = () => {
    setActiveField('soldTo');
    onCustomerSearch('', true);
    setShowSoldToDropdown(true);
  };

  const handleBillToFocus = () => {
    setActiveField('billTo');
    onCustomerSearch('', true);
    setShowBillToDropdown(true);
  };

  const handleSelectSoldTo = (customer: CustomerSearchResult) => {
    onSoldToCustomerSelect(customer);
    setSoldToSearch(customer.companyName);
    setShowSoldToDropdown(false);
    setActiveField(null);
  };

  const handleSelectBillTo = (customer: CustomerSearchResult) => {
    onBillToCustomerSelect(customer);
    setBillToSearch(customer.companyName);
    setShowBillToDropdown(false);
    setActiveField(null);
  };

  const handleClearSoldTo = () => {
    onSoldToCustomerClear();
    setSoldToSearch('');
  };

  const handleClearBillTo = () => {
    onBillToCustomerClear();
    setBillToSearch('');
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Customer Information
      </h3>
      
      <div className="space-y-4">
        {/* Sold To Customer */}
        <div ref={soldToRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sold To Customer <span className="text-red-500">*</span>
            {soldToCustomerId && (
              <span className="ml-2 text-green-600 font-normal">✓ {soldToCustomerName}</span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={soldToCustomerId ? soldToCustomerName : soldToSearch}
              onChange={(e) => {
                setSoldToSearch(e.target.value);
                setShowSoldToDropdown(true);
              }}
              onFocus={handleSoldToFocus}
              placeholder="Click to see all customers or type to search..."
              readOnly={!!soldToCustomerId}
              className={`flex-1 px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 ${
                soldToCustomerId ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'
              }`}
            />
            {isLoadingCustomers && activeField === 'soldTo' && !soldToCustomerId && (
              <div className="flex items-center px-3">
                <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            )}
            {soldToCustomerId && (
              <button
                type="button"
                onClick={handleClearSoldTo}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
          {soldToCustomerError && <p className="mt-1 text-sm text-red-600">{soldToCustomerError}</p>}
          
          {showSoldToDropdown && !soldToCustomerId && (
            <>
              {customers.length > 0 ? (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectSoldTo(customer)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{customer.companyName}</div>
                      <div className="text-xs text-gray-500">ID: {customer.id.slice(0, 8)}...</div>
                    </button>
                  ))}
                </div>
              ) : !isLoadingCustomers ? (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                  {soldToSearch ? `No customers found for "${soldToSearch}"` : 'No customers available'}
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Bill To Customer */}
        <div ref={billToRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bill To Customer (Optional)
            {billToCustomerId && (
              <span className="ml-2 text-green-600 font-normal">✓ {billToCustomerName}</span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={billToCustomerId ? billToCustomerName : billToSearch}
              onChange={(e) => {
                setBillToSearch(e.target.value);
                setShowBillToDropdown(true);
              }}
              onFocus={handleBillToFocus}
              placeholder="Click to see all customers or type to search..."
              readOnly={!!billToCustomerId}
              className={`flex-1 px-3 py-2 text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 ${
                billToCustomerId ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'
              }`}
            />
            {isLoadingCustomers && activeField === 'billTo' && !billToCustomerId && (
              <div className="flex items-center px-3">
                <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            )}
            {billToCustomerId && (
              <button
                type="button"
                onClick={handleClearBillTo}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>
          
          {showBillToDropdown && !billToCustomerId && (
            <>
              {customers.length > 0 ? (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectBillTo(customer)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{customer.companyName}</div>
                      <div className="text-xs text-gray-500">ID: {customer.id.slice(0, 8)}...</div>
                    </button>
                  ))}
                </div>
              ) : !isLoadingCustomers ? (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                  {billToSearch ? `No customers found for "${billToSearch}"` : 'No customers available'}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
