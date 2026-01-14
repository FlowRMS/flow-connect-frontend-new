/**
 * AcknowledgementModal Component
 * Modal for creating and editing order acknowledgements
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Order } from '@/lib/types/rms';
import type { OrderAcknowledgement, CreateAcknowledgementInput } from '../../../../api/acknowledgementsApi';
import { SearchableDropdownV2 } from '@/components/quotes-v2/components/SearchableDropdownV2';
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
  const [selectedLineItemId, setSelectedLineItemId] = useState<string | null>(null);
  const [selectedLineItemLabel, setSelectedLineItemLabel] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Build line item dropdown options
  const lineItemOptions = useMemo(() => {
    const items = (order.lineItems || [])
      .filter(li => li.partNumber !== 'FREIGHT')
      .map(li => ({
        id: li.id,
        label: `#${li.lineNumber} - ${li.partNumber}`,
        sublabel: `${li.description?.substring(0, 40) || ''} | Qty: ${li.quantity}`,
      }));
    return items;
  }, [order.lineItems]);

  // Get selected line item details
  const selectedLineItem = useMemo(() => {
    if (!selectedLineItemId) return null;
    return (order.lineItems || []).find(li => li.id === selectedLineItemId);
  }, [order.lineItems, selectedLineItemId]);

  // Initialize form when modal opens or acknowledgement changes
  useEffect(() => {
    if (isOpen) {
      if (acknowledgement) {
        // Edit mode - populate from existing acknowledgement
        setAckNumber(acknowledgement.orderAcknowledgementNumber || '');
        setAckDate(parseDateString(acknowledgement.entityDate) || new Date());
        setShipDate(parseDateString(acknowledgement.shipDate) || null);
        setQuantity(acknowledgement.quantity || '');
        setSelectedLineItemId(acknowledgement.orderDetailId || null);

        // Find the line item label
        if (acknowledgement.orderDetailId) {
          const lineItem = (order.lineItems || []).find(li => li.id === acknowledgement.orderDetailId);
          if (lineItem) {
            setSelectedLineItemLabel(`#${lineItem.lineNumber} - ${lineItem.partNumber}`);
          }
        }
      } else {
        // Create mode - reset form
        setAckNumber('');
        setAckDate(new Date());
        setShipDate(null);
        setQuantity('');
        setSelectedLineItemId(null);
        setSelectedLineItemLabel('');
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

    if (selectedLineItem && parseFloat(quantity) > selectedLineItem.quantity) {
      newErrors.quantity = `Quantity cannot exceed ordered quantity (${selectedLineItem.quantity})`;
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

    const input: CreateAcknowledgementInput = {
      ...(acknowledgement?.id ? { id: acknowledgement.id } : {}),
      orderId: order.id,
      orderDetailId: selectedLineItemId || undefined,
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

              {/* Line Item Selection */}
              <div className="bg-[var(--muted)]/20 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h12M4 10h12M4 14h8" strokeLinecap="round"/>
                  </svg>
                  Line Item (Optional)
                </h3>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Link to Order Line Item
                  </label>
                  <SearchableDropdownV2
                    value={selectedLineItemId || ''}
                    displayValue={selectedLineItemLabel}
                    onChange={(id, label) => {
                      setSelectedLineItemId(id || null);
                      setSelectedLineItemLabel(label);
                    }}
                    options={lineItemOptions}
                    placeholder="Select a line item (optional)..."
                  />
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Leave empty for order-level acknowledgement
                  </p>
                </div>

                {/* Selected Line Item Details */}
                {selectedLineItem && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
                    <h4 className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="10" cy="10" r="8"/>
                        <path d="M10 6v4M10 14v.01"/>
                      </svg>
                      Line Item Details
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600/70 text-xs block mb-0.5">Part Number</span>
                        <div className="font-semibold text-blue-900">{selectedLineItem.partNumber}</div>
                      </div>
                      <div>
                        <span className="text-blue-600/70 text-xs block mb-0.5">Description</span>
                        <div className="font-medium text-blue-900 truncate" title={selectedLineItem.description}>
                          {selectedLineItem.description || '-'}
                        </div>
                      </div>
                      <div>
                        <span className="text-blue-600/70 text-xs block mb-0.5">Qty Ordered</span>
                        <div className="font-semibold text-blue-900">{selectedLineItem.quantity}</div>
                      </div>
                      <div>
                        <span className="text-blue-600/70 text-xs block mb-0.5">Qty Shipped</span>
                        <div className="font-semibold text-blue-900">{selectedLineItem.quantityShipped || 0}</div>
                      </div>
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
                      max={selectedLineItem?.quantity}
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        setTouched(prev => ({ ...prev, quantity: true }));
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, quantity: true }))}
                      placeholder={selectedLineItem ? `Max: ${selectedLineItem.quantity}` : 'Enter quantity'}
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
