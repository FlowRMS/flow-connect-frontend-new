/**
 * AddLineItemModal Component
 * Modal for adding new invoices, credits, or adjustments to a check
 * Uses searchable dropdowns with API integration
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { LineItem } from '../../types';
import { searchInvoices, type InvoiceSearchResult } from '@/components/lib/api/search';
import { searchCredits, type CreditSearchResult } from '@/components/orders/api/creditsApi';
import { searchAdjustments, type AdjustmentSearchResult } from '@/components/orders/api/adjustmentsApi';
import { fetchInvoiceById, type Invoice } from '@/components/lib/graphql/invoices';

interface AddLineItemModalProps {
  onClose: () => void;
  onAdd: (item: Omit<LineItem, 'id'>) => void;
  factoryId: string;
}

export function AddLineItemModal({
  onClose,
  onAdd,
  factoryId,
}: AddLineItemModalProps) {
  const [type, setType] = useState<'invoice' | 'credit' | 'adjustment'>('invoice');
  const [appliedAmount, setAppliedAmount] = useState<number>(0);

  // Invoice search state
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoices, setInvoices] = useState<InvoiceSearchResult[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSearchResult | null>(null);
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  const [isSearchingInvoices, setIsSearchingInvoices] = useState(false);

  // Full invoice details (fetched after selection)
  const [invoiceDetails, setInvoiceDetails] = useState<Invoice | null>(null);
  const [isLoadingInvoiceDetails, setIsLoadingInvoiceDetails] = useState(false);

  // Credit search state
  const [creditSearch, setCreditSearch] = useState('');
  const [credits, setCredits] = useState<CreditSearchResult[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<CreditSearchResult | null>(null);
  const [showCreditDropdown, setShowCreditDropdown] = useState(false);
  const [isSearchingCredits, setIsSearchingCredits] = useState(false);

  // Adjustment search state
  const [adjustmentSearch, setAdjustmentSearch] = useState('');
  const [adjustments, setAdjustments] = useState<AdjustmentSearchResult[]>([]);
  const [selectedAdjustment, setSelectedAdjustment] = useState<AdjustmentSearchResult | null>(null);
  const [showAdjustmentDropdown, setShowAdjustmentDropdown] = useState(false);
  const [isSearchingAdjustments, setIsSearchingAdjustments] = useState(false);

  const invoiceDropdownRef = useRef<HTMLDivElement>(null);
  const creditDropdownRef = useRef<HTMLDivElement>(null);
  const adjustmentDropdownRef = useRef<HTMLDivElement>(null);

  // Load initial data (empty search) when modal opens
  useEffect(() => {
    if (type === 'invoice') {
      handleInvoiceSearch('');
    } else if (type === 'credit') {
      handleCreditSearch('');
    } else {
      handleAdjustmentSearch('');
    }
  }, [type]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (invoiceDropdownRef.current && !invoiceDropdownRef.current.contains(event.target as Node)) {
        setShowInvoiceDropdown(false);
      }
      if (creditDropdownRef.current && !creditDropdownRef.current.contains(event.target as Node)) {
        setShowCreditDropdown(false);
      }
      if (adjustmentDropdownRef.current && !adjustmentDropdownRef.current.contains(event.target as Node)) {
        setShowAdjustmentDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search invoices - with openOnly and unlockedOnly for checks
  const handleInvoiceSearch = async (term: string) => {
    setInvoiceSearch(term);
    setIsSearchingInvoices(true);
    try {
      const results = await searchInvoices(term, 20, { openOnly: true, unlockedOnly: true });
      setInvoices(results);
    } catch (error) {
      console.error('Error searching invoices:', error);
      setInvoices([]);
    } finally {
      setIsSearchingInvoices(false);
    }
  };

  // Search credits - with openOnly and unlockedOnly for checks
  const handleCreditSearch = async (term: string) => {
    setCreditSearch(term);
    setIsSearchingCredits(true);
    try {
      const results = await searchCredits(term, 20, { openOnly: true, unlockedOnly: true });
      setCredits(results);
    } catch (error) {
      console.error('Error searching credits:', error);
      setCredits([]);
    } finally {
      setIsSearchingCredits(false);
    }
  };

  // Search adjustments - with openOnly and unlockedOnly for checks
  const handleAdjustmentSearch = async (term: string) => {
    setAdjustmentSearch(term);
    setIsSearchingAdjustments(true);
    try {
      const results = await searchAdjustments(term, 20, { openOnly: true, unlockedOnly: true });
      setAdjustments(results);
    } catch (error) {
      console.error('Error searching adjustments:', error);
      setAdjustments([]);
    } finally {
      setIsSearchingAdjustments(false);
    }
  };

  // Handle invoice selection
  const handleSelectInvoice = async (invoice: InvoiceSearchResult) => {
    setSelectedInvoice(invoice);
    setInvoiceSearch(invoice.invoiceNumber);
    setShowInvoiceDropdown(false);

    // Fetch full invoice details
    setIsLoadingInvoiceDetails(true);
    try {
      const details = await fetchInvoiceById(invoice.id);
      setInvoiceDetails(details);
      // Pre-fill applied amount with the invoice's commission if available
      if (details?.balance?.commission) {
        setAppliedAmount(details.balance.commission);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setIsLoadingInvoiceDetails(false);
    }
  };

  // Handle credit selection
  const handleSelectCredit = (credit: CreditSearchResult) => {
    setSelectedCredit(credit);
    setCreditSearch(credit.creditNumber || '');
    setShowCreditDropdown(false);
  };

  // Handle adjustment selection
  const handleSelectAdjustment = (adjustment: AdjustmentSearchResult) => {
    setSelectedAdjustment(adjustment);
    setAdjustmentSearch(adjustment.adjustmentNumber || '');
    setShowAdjustmentDropdown(false);
    // Pre-fill the amount from the adjustment
    if (adjustment.amount) {
      setAppliedAmount(Math.abs(parseFloat(adjustment.amount)));
    }
  };

  // Clear invoice selection
  const handleClearInvoice = () => {
    setSelectedInvoice(null);
    setInvoiceDetails(null);
    setInvoiceSearch('');
    setAppliedAmount(0);
  };

  // Clear credit selection
  const handleClearCredit = () => {
    setSelectedCredit(null);
    setCreditSearch('');
    setAppliedAmount(0);
  };

  // Clear adjustment selection
  const handleClearAdjustment = () => {
    setSelectedAdjustment(null);
    setAdjustmentSearch('');
    setAppliedAmount(0);
  };

  // Handle adding the line item
  const handleAdd = () => {
    if (type === 'invoice' && selectedInvoice) {
      onAdd({
        type: 'invoice',
        number: selectedInvoice.invoiceNumber,
        orderId: selectedInvoice.orderId || '',
        customer: '-',
        salesRep: '-',
        commissionRateExpected: 0,
        commissionRateActual: 0,
        expectedCommission: appliedAmount,
        paidCommission: appliedAmount,
        balance: 0,
        paid: false,
        invoiceId: selectedInvoice.id,
        entityDate: selectedInvoice.entityDate,
        dueDate: selectedInvoice.dueDate,
        status: selectedInvoice.status,
      });
      onClose();
    } else if (type === 'credit' && selectedCredit) {
      onAdd({
        type: 'credit',
        number: selectedCredit.creditNumber || '',
        orderId: selectedCredit.orderId || '',
        customer: '-',
        salesRep: '-',
        commissionRateExpected: 0,
        commissionRateActual: 0,
        expectedCommission: -Math.abs(appliedAmount),
        paidCommission: -Math.abs(appliedAmount),
        balance: 0,
        paid: false,
        creditId: selectedCredit.id,
        entityDate: selectedCredit.entityDate,
        status: selectedCredit.status,
        creditType: selectedCredit.creditType,
        reason: selectedCredit.reason,
      });
      onClose();
    } else if (type === 'adjustment' && selectedAdjustment) {
      const adjustmentAmount = parseFloat(selectedAdjustment.amount || '0');
      onAdd({
        type: 'adjustment',
        number: selectedAdjustment.adjustmentNumber || '',
        orderId: '', // Adjustments don't have orderId
        customer: '-',
        salesRep: '-',
        commissionRateExpected: 0,
        commissionRateActual: 0,
        expectedCommission: adjustmentAmount,
        paidCommission: appliedAmount || adjustmentAmount,
        balance: 0,
        paid: false,
        adjustmentId: selectedAdjustment.id,
        entityDate: selectedAdjustment.entityDate,
        status: selectedAdjustment.status,
        reason: selectedAdjustment.reason,
        amount: adjustmentAmount,
        factoryId: selectedAdjustment.factoryId,
        locked: selectedAdjustment.locked,
      });
      onClose();
    }
  };

  const canAdd =
    (type === 'invoice' && selectedInvoice && appliedAmount > 0) ||
    (type === 'credit' && selectedCredit && appliedAmount > 0) ||
    (type === 'adjustment' && selectedAdjustment);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--card)] rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Add Line Item
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setType('invoice');
                  setSelectedCredit(null);
                  setCreditSearch('');
                  setSelectedAdjustment(null);
                  setAdjustmentSearch('');
                  setAppliedAmount(0);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  type === 'invoice'
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--muted)]/80'
                }`}
              >
                Invoice
              </button>
              <button
                onClick={() => {
                  setType('credit');
                  setSelectedInvoice(null);
                  setInvoiceDetails(null);
                  setInvoiceSearch('');
                  setSelectedAdjustment(null);
                  setAdjustmentSearch('');
                  setAppliedAmount(0);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  type === 'credit'
                    ? 'bg-orange-100 text-orange-700 border-orange-300'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--muted)]/80'
                }`}
              >
                Credit
              </button>
              <button
                onClick={() => {
                  setType('adjustment');
                  setSelectedInvoice(null);
                  setInvoiceDetails(null);
                  setInvoiceSearch('');
                  setSelectedCredit(null);
                  setCreditSearch('');
                  setAppliedAmount(0);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  type === 'adjustment'
                    ? 'bg-purple-100 text-purple-700 border-purple-300'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--muted)]/80'
                }`}
              >
                Adjustment
              </button>
            </div>
          </div>

          {/* Invoice Search Dropdown */}
          {type === 'invoice' && (
            <div ref={invoiceDropdownRef} className="relative">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Select Invoice <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={invoiceSearch}
                    onChange={(e) => {
                      handleInvoiceSearch(e.target.value);
                      setShowInvoiceDropdown(true);
                      if (selectedInvoice && e.target.value !== selectedInvoice.invoiceNumber) {
                        setSelectedInvoice(null);
                      }
                    }}
                    onFocus={() => {
                      setShowInvoiceDropdown(true);
                      if (!invoices.length) handleInvoiceSearch('');
                    }}
                    placeholder="Search by invoice number..."
                    className="w-full px-4 py-2 pl-10 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="9" cy="9" r="6" />
                    <path d="M13.5 13.5L17 17" strokeLinecap="round" />
                  </svg>
                  {isSearchingInvoices && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]" />
                    </div>
                  )}
                </div>
                {selectedInvoice && (
                  <button
                    onClick={handleClearInvoice}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]"
                  >
                    Clear
                  </button>
                )}
              </div>
              {selectedInvoice && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Selected: {selectedInvoice.invoiceNumber}
                </p>
              )}

              {/* Invoice Dropdown */}
              {showInvoiceDropdown && !selectedInvoice && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <button
                        key={invoice.id}
                        type="button"
                        onClick={() => handleSelectInvoice(invoice)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-gray-500">
                          {invoice.entityDate ? `Date: ${invoice.entityDate}` : ''}
                          {invoice.status ? ` • Status: ${invoice.status}` : ''}
                        </div>
                      </button>
                    ))
                  ) : !isSearchingInvoices ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {invoiceSearch ? `No invoices found for "${invoiceSearch}"` : 'No invoices available'}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Credit Search Dropdown */}
          {type === 'credit' && (
            <div ref={creditDropdownRef} className="relative">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Select Credit <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={creditSearch}
                    onChange={(e) => {
                      handleCreditSearch(e.target.value);
                      setShowCreditDropdown(true);
                      if (selectedCredit && e.target.value !== selectedCredit.creditNumber) {
                        setSelectedCredit(null);
                      }
                    }}
                    onFocus={() => {
                      setShowCreditDropdown(true);
                      if (!credits.length) handleCreditSearch('');
                    }}
                    placeholder="Search by credit number..."
                    className="w-full px-4 py-2 pl-10 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="9" cy="9" r="6" />
                    <path d="M13.5 13.5L17 17" strokeLinecap="round" />
                  </svg>
                  {isSearchingCredits && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]" />
                    </div>
                  )}
                </div>
                {selectedCredit && (
                  <button
                    onClick={handleClearCredit}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]"
                  >
                    Clear
                  </button>
                )}
              </div>
              {selectedCredit && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Selected: {selectedCredit.creditNumber}
                </p>
              )}

              {/* Credit Dropdown */}
              {showCreditDropdown && !selectedCredit && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {credits.length > 0 ? (
                    credits.map((credit) => (
                      <button
                        key={credit.id}
                        type="button"
                        onClick={() => handleSelectCredit(credit)}
                        className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{credit.creditNumber || credit.id}</div>
                        <div className="text-xs text-gray-500">
                          {credit.creditType ? `Type: ${credit.creditType}` : ''}
                          {credit.entityDate ? ` • Date: ${credit.entityDate}` : ''}
                          {credit.status ? ` • Status: ${credit.status}` : ''}
                        </div>
                      </button>
                    ))
                  ) : !isSearchingCredits ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {creditSearch ? `No credits found for "${creditSearch}"` : 'No credits available'}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Adjustment Search Dropdown */}
          {type === 'adjustment' && (
            <div ref={adjustmentDropdownRef} className="relative">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Select Adjustment <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={adjustmentSearch}
                    onChange={(e) => {
                      handleAdjustmentSearch(e.target.value);
                      setShowAdjustmentDropdown(true);
                      if (selectedAdjustment && e.target.value !== selectedAdjustment.adjustmentNumber) {
                        setSelectedAdjustment(null);
                      }
                    }}
                    onFocus={() => {
                      setShowAdjustmentDropdown(true);
                      if (!adjustments.length) handleAdjustmentSearch('');
                    }}
                    placeholder="Search by adjustment number..."
                    className="w-full px-4 py-2 pl-10 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="9" cy="9" r="6" />
                    <path d="M13.5 13.5L17 17" strokeLinecap="round" />
                  </svg>
                  {isSearchingAdjustments && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]" />
                    </div>
                  )}
                </div>
                {selectedAdjustment && (
                  <button
                    onClick={handleClearAdjustment}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]"
                  >
                    Clear
                  </button>
                )}
              </div>
              {selectedAdjustment && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Selected: {selectedAdjustment.adjustmentNumber}
                </p>
              )}

              {/* Adjustment Dropdown */}
              {showAdjustmentDropdown && !selectedAdjustment && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {adjustments.length > 0 ? (
                    adjustments.map((adjustment) => (
                      <button
                        key={adjustment.id}
                        type="button"
                        onClick={() => handleSelectAdjustment(adjustment)}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{adjustment.adjustmentNumber || adjustment.id}</div>
                        <div className="text-xs text-gray-500">
                          {adjustment.amount ? `Amount: $${parseFloat(adjustment.amount).toFixed(2)}` : ''}
                          {adjustment.entityDate ? ` • Date: ${adjustment.entityDate}` : ''}
                          {adjustment.status ? ` • Status: ${adjustment.status}` : ''}
                        </div>
                        {adjustment.reason && (
                          <div className="text-xs text-gray-400 mt-1 truncate">
                            Reason: {adjustment.reason}
                          </div>
                        )}
                      </button>
                    ))
                  ) : !isSearchingAdjustments ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {adjustmentSearch ? `No adjustments found for "${adjustmentSearch}"` : 'No adjustments available'}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Applied Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Applied Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                $
              </span>
              <input
                type="number"
                value={appliedAmount || ''}
                onChange={(e) => setAppliedAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                className="w-full px-4 py-2 pl-7 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            {type === 'credit' && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Amount will be applied as a negative value
              </p>
            )}
          </div>

          {/* Selected Item Preview */}
          {(selectedInvoice || selectedCredit || selectedAdjustment) && (
            <div className="mt-4 p-4 bg-[var(--muted)] rounded-lg">
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                Selected {type === 'invoice' ? 'Invoice' : type === 'credit' ? 'Credit' : 'Adjustment'} Details
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {type === 'invoice' && selectedInvoice && (
                  <>
                    {isLoadingInvoiceDetails ? (
                      <div className="col-span-2 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]" />
                        <span className="text-[var(--muted-foreground)]">Loading details...</span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Number:</span>{' '}
                          <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Date:</span>{' '}
                          <span className="font-medium">{selectedInvoice.entityDate || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Due Date:</span>{' '}
                          <span className="font-medium">{selectedInvoice.dueDate || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[var(--muted-foreground)]">Status:</span>{' '}
                          <span className="font-medium">{selectedInvoice.status || '-'}</span>
                        </div>
                        {invoiceDetails && (
                          <>
                            <div>
                              <span className="text-[var(--muted-foreground)]">Total:</span>{' '}
                              <span className="font-medium">
                                ${invoiceDetails.balance?.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--muted-foreground)]">Commission Rate:</span>{' '}
                              <span className="font-medium">
                                {invoiceDetails.balance?.commissionRate != null
                                  ? `${Number(invoiceDetails.balance.commissionRate).toFixed(2)}%`
                                  : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--muted-foreground)]">Commission:</span>{' '}
                              <span className="font-medium text-green-600">
                                ${invoiceDetails.balance?.commission?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--muted-foreground)]">Order #:</span>{' '}
                              <span className="font-medium">{invoiceDetails.order?.orderNumber || '-'}</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
                {type === 'credit' && selectedCredit && (
                  <>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Number:</span>{' '}
                      <span className="font-medium">{selectedCredit.creditNumber || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Type:</span>{' '}
                      <span className="font-medium">{selectedCredit.creditType || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Date:</span>{' '}
                      <span className="font-medium">{selectedCredit.entityDate || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Status:</span>{' '}
                      <span className="font-medium">{selectedCredit.status || '-'}</span>
                    </div>
                    {selectedCredit.reason && (
                      <div className="col-span-2">
                        <span className="text-[var(--muted-foreground)]">Reason:</span>{' '}
                        <span className="font-medium">{selectedCredit.reason}</span>
                      </div>
                    )}
                  </>
                )}
                {type === 'adjustment' && selectedAdjustment && (
                  <>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Number:</span>{' '}
                      <span className="font-medium">{selectedAdjustment.adjustmentNumber || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Amount:</span>{' '}
                      <span className="font-medium">${selectedAdjustment.amount ? parseFloat(selectedAdjustment.amount).toFixed(2) : '0.00'}</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Date:</span>{' '}
                      <span className="font-medium">{selectedAdjustment.entityDate || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Status:</span>{' '}
                      <span className="font-medium">{selectedAdjustment.status || '-'}</span>
                    </div>
                    {selectedAdjustment.reason && (
                      <div className="col-span-2">
                        <span className="text-[var(--muted-foreground)]">Reason:</span>{' '}
                        <span className="font-medium">{selectedAdjustment.reason}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)] bg-[var(--muted)]/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add {type === 'invoice' ? 'Invoice' : type === 'credit' ? 'Credit' : 'Adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
}
