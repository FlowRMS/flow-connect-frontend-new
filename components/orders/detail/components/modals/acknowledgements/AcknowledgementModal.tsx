/**
 * AcknowledgementModal Component
 * Modal for creating and editing order acknowledgements
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Order } from '@/lib/types/rms';
import type { OrderAcknowledgement, CreateAcknowledgementInput } from '../../../../api/acknowledgementsApi';
import { StyledDatePicker, parseDateString, formatDateToString } from '@/components/shared/StyledDatePicker';

interface AcknowledgementModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  acknowledgement?: OrderAcknowledgement | null;
  onSubmit: (input: CreateAcknowledgementInput) => Promise<void>;
  isLoading?: boolean;
  isLoadingDetails?: boolean;
}

export function AcknowledgementModal({
  isOpen,
  onClose,
  order,
  acknowledgement,
  onSubmit,
  isLoading = false,
  isLoadingDetails = false,
}: AcknowledgementModalProps) {
  const isEditMode = !!acknowledgement;

  // Form state
  const [ackNumber, setAckNumber] = useState('');
  const [ackDate, setAckDate] = useState<Date | null>(new Date());
  const [shipDate, setShipDate] = useState<Date | null>(null);
  const [quantity, setQuantity] = useState('');
  const [selectedLineItemIds, setSelectedLineItemIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Build line item list for multi-select
  const lineItems = useMemo(() => {
    return (order.lineItems || [])
      .filter(li => li.partNumber !== 'FREIGHT')
      .map(li => ({
        id: li.id,
        lineNumber: li.lineNumber,
        partNumber: li.partNumber,
        description: li.description || '',
        quantity: li.quantity,
        quantityShipped: li.quantityShipped || 0,
      }));
  }, [order.lineItems]);

  // Get selected line items details
  const selectedLineItems = useMemo(() => {
    return lineItems.filter(li => selectedLineItemIds.includes(li.id));
  }, [lineItems, selectedLineItemIds]);

  // Toggle line item selection
  const toggleLineItemSelection = (id: string) => {
    setSelectedLineItemIds(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  // Select all line items
  const selectAllLineItems = () => {
    setSelectedLineItemIds(lineItems.map(li => li.id));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedLineItemIds([]);
  };

  // Initialize form when modal opens or acknowledgement changes
  useEffect(() => {
    if (isOpen) {
      if (acknowledgement) {
        // Edit mode - populate from existing acknowledgement
        setAckNumber(acknowledgement.orderAcknowledgementNumber || '');
        setAckDate(parseDateString(acknowledgement.entityDate) || new Date());
        setShipDate(parseDateString(acknowledgement.shipDate) || null);
        setQuantity(acknowledgement.quantity || '');

        // Populate selected line items from details array
        if (acknowledgement.details && acknowledgement.details.length > 0) {
          const detailIds = acknowledgement.details.map(d => d.orderDetailId);
          setSelectedLineItemIds(detailIds);
        } else {
          setSelectedLineItemIds([]);
        }
      } else {
        // Create mode - reset form
        setAckNumber('');
        setAckDate(new Date());
        setShipDate(null);
        setQuantity('');
        setSelectedLineItemIds([]);
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, acknowledgement, order.lineItems]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!ackNumber || ackNumber.trim() === '') {
      newErrors.ackNumber = 'Acknowledgement number is required';
    }

    if (!ackDate) {
      newErrors.ackDate = 'Acknowledgement date is required';
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    // If single line item selected, validate quantity against it
    if (selectedLineItems.length === 1) {
      const singleItem = selectedLineItems[0];
      if (parseFloat(quantity) > singleItem.quantity) {
        newErrors.quantity = `Quantity cannot exceed ordered quantity (${singleItem.quantity})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    setTouched({
      ackNumber: true,
      ackDate: true,
      quantity: true,
    });

    if (!validate()) return;

    // Build details array from selected line items
    const details = selectedLineItemIds.length > 0
      ? selectedLineItemIds.map(orderDetailId => ({ orderDetailId }))
      : undefined;

    const input: CreateAcknowledgementInput = {
      ...(acknowledgement?.id ? { id: acknowledgement.id } : {}),
      orderId: order.id,
      details,
      orderAcknowledgementNumber: ackNumber.trim(),
      entityDate: formatDateToString(ackDate) || new Date().toISOString().split('T')[0],
      quantity: quantity,
      creationType: 'MANUAL',
    };

    await onSubmit(input);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-4 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {isEditMode ? 'Edit Acknowledgement' : 'Create Acknowledgement'}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              Order #{order.orderNumber} - Track factory acknowledgements
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading state when fetching acknowledgement details for edit */}
          {isLoadingDetails && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="text-sm text-[var(--muted-foreground)]">Loading acknowledgement details...</span>
              </div>
            </div>
          )}

          {!isLoadingDetails && (
            <>
              {/* Acknowledgement Info Section */}
              <div className="bg-[var(--muted)]/20 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="14" height="14" rx="2"/>
                    <path d="M3 8h14"/>
                    <path d="M7 2v4"/>
                    <path d="M13 2v4"/>
                  </svg>
                  Acknowledgement Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Acknowledgement Number */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                      Acknowledgement # <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ackNumber}
                      onChange={(e) => {
                        setAckNumber(e.target.value);
                        setTouched(prev => ({ ...prev, ackNumber: true }));
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, ackNumber: true }))}
                      placeholder="Enter acknowledgement number"
                      className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                        touched.ackNumber && errors.ackNumber
                          ? 'border-red-500'
                          : 'border-[var(--border)]'
                      }`}
                    />
                    {touched.ackNumber && errors.ackNumber && (
                      <p className="text-xs text-red-500 mt-1">{errors.ackNumber}</p>
                    )}
                  </div>

                  {/* Acknowledgement Date */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                      Acknowledgement Date <span className="text-red-500">*</span>
                    </label>
                    <StyledDatePicker
                      selected={ackDate}
                      onChange={(date) => {
                        setAckDate(date);
                        setTouched(prev => ({ ...prev, ackDate: true }));
                      }}
                      placeholder="Select date..."
                    />
                    {touched.ackDate && errors.ackDate && (
                      <p className="text-xs text-red-500 mt-1">{errors.ackDate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Item Selection - Multi-select */}
              <div className="bg-[var(--muted)]/20 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6h12M4 10h12M4 14h8" strokeLinecap="round"/>
                    </svg>
                    Line Items (Optional)
                    {selectedLineItemIds.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {selectedLineItemIds.length} selected
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllLineItems}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Select All
                    </button>
                    {selectedLineItemIds.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllSelections}
                        className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[var(--muted-foreground)]">
                  Select one or more line items to link to this acknowledgement. Leave empty for order-level acknowledgement.
                </p>

                {/* Line Items List */}
                <div className="max-h-[200px] overflow-y-auto border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
                  {lineItems.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                      No line items available
                    </div>
                  ) : (
                    lineItems.map((li) => {
                      const isSelected = selectedLineItemIds.includes(li.id);
                      return (
                        <div
                          key={li.id}
                          onClick={() => toggleLineItemSelection(li.id)}
                          className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 hover:bg-blue-100'
                              : 'bg-[var(--background)] hover:bg-[var(--muted)]/50'
                          }`}
                        >
                          {/* Checkbox */}
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-[var(--border)] bg-[var(--background)]'
                            }`}
                          >
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
                                <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>

                          {/* Line Item Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-[var(--foreground)]">
                                #{li.lineNumber} - {li.partNumber}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--muted-foreground)] truncate">
                              {li.description || 'No description'}
                            </p>
                          </div>

                          {/* Quantity Info */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-medium text-[var(--foreground)]">
                              Qty: {li.quantity}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              Shipped: {li.quantityShipped}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected Items Summary */}
                {selectedLineItems.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-2">
                      Selected Line Items ({selectedLineItems.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLineItems.map((li) => (
                        <span
                          key={li.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          #{li.lineNumber} - {li.partNumber}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLineItemSelection(li.id);
                            }}
                            className="hover:text-blue-900"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      Total Ordered Qty: {selectedLineItems.reduce((sum, li) => sum + li.quantity, 0)}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity & Ship Date */}
              <div className="bg-[var(--muted)]/20 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h14v14H3z"/>
                    <path d="M7 7h6M7 11h6"/>
                  </svg>
                  Acknowledgement Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                      Acknowledged Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedLineItems.length === 1 ? selectedLineItems[0].quantity : undefined}
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        setTouched(prev => ({ ...prev, quantity: true }));
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, quantity: true }))}
                      placeholder={selectedLineItems.length === 1 ? `Max: ${selectedLineItems[0].quantity}` : 'Enter quantity'}
                      className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                        touched.quantity && errors.quantity
                          ? 'border-red-500'
                          : 'border-[var(--border)]'
                      }`}
                    />
                    {touched.quantity && errors.quantity && (
                      <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
                    )}
                  </div>

                  {/* Ship Date */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                      Expected Ship Date
                    </label>
                    <StyledDatePicker
                      selected={shipDate}
                      onChange={(date) => setShipDate(date)}
                      placeholder="Select ship date..."
                    />
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      When the factory expects to ship
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || isLoadingDetails}
              className="px-5 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              )}
              {isEditMode ? 'Save Changes' : 'Create Acknowledgement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
