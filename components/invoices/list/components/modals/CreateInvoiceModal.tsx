/**
 * CreateInvoiceModal Component
 * Modal for creating new invoices from orders
 * Uses real API search for orders and navigates to invoice detail page for creation
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderSearch } from '@/components/orders/api';
import { SearchableDropdownV2 } from '@/components/quotes-v2/components/SearchableDropdownV2';

interface CreateInvoiceModalProps {
  onClose: () => void;
  onSave: (invoice: any) => void;
  preselectedOrderId?: string;
}

export function CreateInvoiceModal({
  onClose,
  preselectedOrderId,
}: CreateInvoiceModalProps) {
  const router = useRouter();
  const [selectedOrderId, setSelectedOrderId] = useState(preselectedOrderId || '');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');

  // Use the order search API with empty search enabled to pre-populate dropdown
  const { data: orderResults, isLoading: isOrderSearchLoading } = useOrderSearch(orderSearchTerm, 20, true);

  // Transform search results to dropdown options
  const orderOptions = useMemo(() => {
    return (orderResults || []).map(o => ({
      id: o.id,
      label: o.orderNumber,
      sublabel: [
        o.jobName,
        o.status,
        o.entityDate ? new Date(o.entityDate).toLocaleDateString() : null,
      ].filter(Boolean).join(' - '),
    }));
  }, [orderResults]);

  const handleOrderSelect = (id: string, label: string) => {
    setSelectedOrderId(id);
    setSelectedOrderNumber(label);
  };

  const handleContinue = () => {
    if (!selectedOrderId) return;

    // Navigate to the new invoice page with the orderId query parameter
    // The invoice detail page will handle loading the order and populating line items
    router.push(`/invoices/new?orderId=${selectedOrderId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Create Invoice
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Select an order to create an invoice
            </p>
          </div>
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
          {/* Order Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Select Order <span className="text-red-500">*</span>
            </label>
            <SearchableDropdownV2
              value={selectedOrderId}
              displayValue={selectedOrderNumber}
              onChange={handleOrderSelect}
              options={orderOptions}
              placeholder="Search order by number..."
              isLoading={isOrderSearchLoading}
              onSearch={(query) => setOrderSearchTerm(query)}
            />
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
              Search for an order by number, customer name, or factory
            </p>
          </div>

          {/* Selected Order Info */}
          {selectedOrderId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-green-600">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-800">
                  Order Selected: {selectedOrderNumber}
                </span>
              </div>
              <p className="text-xs text-green-700">
                Line items from this order will be imported into the new invoice.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 bg-[var(--muted)]/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedOrderId}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
