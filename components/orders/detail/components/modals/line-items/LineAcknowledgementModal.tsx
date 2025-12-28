/**
 * LineAcknowledgementModal Component
 * Modal for adding acknowledgements to order line items
 */

'use client';

import React, { useState } from 'react';
import type { Order } from '@/lib/types/rms';

interface AckLineItem {
  lineId: string;
  partNumber: string;
  orderedQty: number;
  acknowledgedQty: number;
  shipDate: string;
}

interface LineAcknowledgementModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSubmit: () => void;
}

export function LineAcknowledgementModal({
  isOpen,
  onClose,
  order,
  onSubmit,
}: LineAcknowledgementModalProps) {
  const [ackNumber, setAckNumber] = useState('');
  const [ackDate, setAckDate] = useState('');
  const [ackLineItems, setAckLineItems] = useState<AckLineItem[]>([]);

  if (!isOpen) return null;

  const canSubmit = ackNumber && ackDate;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-xl w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Add Acknowledgements for {order.orderNumber}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              The below acknowledgment number and ship date will be applied to all selected detail lines.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Acknowledgement Number<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ackNumber}
              onChange={(e) => setAckNumber(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              placeholder="Enter acknowledgement number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Order Ack. Date<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={ackDate}
                onChange={(e) => setAckDate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>

          {/* Line Item Quantities */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Acknowledged Quantity per Line Item
            </label>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">
              The acknowledged quantity may be less than the full ordered quantity for partial acknowledgements.
            </p>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_80px_120px_40px] gap-2 px-3 py-2 bg-[var(--muted)]/30 text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                <div>Part Number</div>
                <div>Ordered Qty</div>
                <div>Ack. Qty</div>
                <div>Ship Date</div>
                <div></div>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {ackLineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-[1fr_80px_80px_120px_40px] gap-2 px-3 py-2 items-center">
                    <select
                      value={item.lineId}
                      onChange={(e) => {
                        const newItems = [...ackLineItems];
                        const selectedLineItem = (order.lineItems || []).find(li => li.id === e.target.value);
                        if (selectedLineItem) {
                          newItems[index].lineId = selectedLineItem.id;
                          newItems[index].partNumber = selectedLineItem.partNumber || '';
                          newItems[index].orderedQty = selectedLineItem.quantity;
                          newItems[index].acknowledgedQty = selectedLineItem.quantity;
                        }
                        setAckLineItems(newItems);
                      }}
                      className="px-2 py-1 border border-[var(--border)] rounded text-sm bg-[var(--background)] w-full"
                    >
                      <option value="">Select line item...</option>
                      {(order.lineItems || []).filter(li => li.partNumber !== 'FREIGHT').map(li => (
                        <option key={li.id} value={li.id}>
                          {li.partNumber}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-[var(--muted-foreground)]">{item.orderedQty}</span>
                    <input
                      type="number"
                      value={item.acknowledgedQty}
                      onChange={(e) => {
                        const newItems = [...ackLineItems];
                        const newQty = parseInt(e.target.value) || 0;
                        newItems[index].acknowledgedQty = Math.min(newQty, item.orderedQty);
                        setAckLineItems(newItems);
                      }}
                      max={item.orderedQty}
                      min={0}
                      className="px-2 py-1 border border-[var(--border)] rounded text-sm bg-[var(--background)] w-full"
                    />
                    <input
                      type="date"
                      value={item.shipDate}
                      onChange={(e) => {
                        const newItems = [...ackLineItems];
                        newItems[index].shipDate = e.target.value;
                        setAckLineItems(newItems);
                      }}
                      className="px-2 py-1 border border-[var(--border)] rounded text-sm bg-[var(--background)] w-full"
                    />
                    <button
                      onClick={() => {
                        setAckLineItems(ackLineItems.filter((_, i) => i !== index));
                      }}
                      className="p-1 hover:bg-red-100 rounded transition-colors text-red-500"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
                {ackLineItems.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-[var(--muted-foreground)] mb-2">No lines added.</p>
                    <button
                      onClick={() => {
                        setAckLineItems([...ackLineItems, {
                          lineId: '',
                          partNumber: '',
                          orderedQty: 0,
                          acknowledgedQty: 0,
                          shipDate: '',
                        }]);
                      }}
                      className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors font-medium"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                      </svg>
                      Add Line
                    </button>
                  </div>
                )}
              </div>
            </div>
            {ackLineItems.length > 0 && (
              <button
                onClick={() => {
                  setAckLineItems([...ackLineItems, {
                    lineId: '',
                    partNumber: '',
                    orderedQty: 0,
                    acknowledgedQty: 0,
                    shipDate: '',
                  }]);
                }}
                className="mt-2 flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                </svg>
                Add Line
              </button>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
