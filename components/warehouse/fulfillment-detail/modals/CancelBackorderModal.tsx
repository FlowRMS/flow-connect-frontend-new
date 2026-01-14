'use client';

import React, { useState } from 'react';
import { FulfillmentOrder, FulfillmentOrderLineItem } from '../../api/fulfillmentApi';

interface BackorderItem {
  lineItem: FulfillmentOrderLineItem;
  inventoryOnHand: number;
  manufacturerName: string;
  manufacturerId: string;
}

interface CancelAllocation {
  lineItemId: string;
  originalQty: number;
  newQty: number;
  cancelledQty: number;
}

interface CancelBackorderModalProps {
  isOpen: boolean;
  fulfillmentOrder: FulfillmentOrder;
  backorderItems: BackorderItem[];
  onClose: () => void;
  onConfirm: (allocations: CancelAllocation[], cancellationReason: string) => void;
}

export default function CancelBackorderModal({
  isOpen,
  fulfillmentOrder,
  backorderItems,
  onClose,
  onConfirm,
}: CancelBackorderModalProps) {
  const [cancellationReason, setCancellationReason] = useState('');

  // Initialize with suggested quantities (what's available on hand)
  const [allocations, setAllocations] = useState<Record<string, CancelAllocation>>(() => {
    const initial: Record<string, CancelAllocation> = {};
    backorderItems.forEach((item) => {
      const suggestedQty = Math.min(item.lineItem.orderedQty, item.inventoryOnHand);
      initial[item.lineItem.id] = {
        lineItemId: item.lineItem.id,
        originalQty: item.lineItem.orderedQty,
        newQty: suggestedQty,
        cancelledQty: item.lineItem.orderedQty - suggestedQty,
      };
    });
    return initial;
  });

  if (!isOpen) return null;

  const updateAllocation = (itemId: string, newQty: number) => {
    const item = backorderItems.find((i) => i.lineItem.id === itemId);
    if (!item) return;

    const maxQty = item.inventoryOnHand;
    const clampedQty = Math.max(0, Math.min(newQty, maxQty));

    setAllocations((prev) => ({
      ...prev,
      [itemId]: {
        lineItemId: itemId,
        originalQty: item.lineItem.orderedQty,
        newQty: clampedQty,
        cancelledQty: item.lineItem.orderedQty - clampedQty,
      },
    }));
  };

  const totalOriginalQty = Object.values(allocations).reduce(
    (sum, alloc) => sum + alloc.originalQty,
    0
  );
  const totalNewQty = Object.values(allocations).reduce(
    (sum, alloc) => sum + alloc.newQty,
    0
  );
  const totalCancelledQty = Object.values(allocations).reduce(
    (sum, alloc) => sum + alloc.cancelledQty,
    0
  );

  const handleConfirm = () => {
    onConfirm(Object.values(allocations), cancellationReason);
  };

  const canConfirm = totalCancelledQty > 0 && cancellationReason.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Cancel Backorder & Adjust Quantities
              </h2>
              <p className="text-sm text-gray-600">
                Order #{fulfillmentOrder.orderNumber} - {fulfillmentOrder.customerName}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  This action will update the original sales order
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  The cancelled quantities will be reflected on the source order (#{fulfillmentOrder.orderNumber}).
                  This may affect invoicing and customer communications.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Adjust the quantities below. The system suggests fulfilling with available inventory only.
            Cancelled quantities will be removed from both this fulfillment order and the original sales order.
          </p>

          {/* Allocation Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Originally Ordered
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    On Hand
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50">
                    New Qty
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-red-700 uppercase tracking-wider bg-red-50">
                    Cancelled
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {backorderItems.map((item) => {
                  const alloc = allocations[item.lineItem.id];
                  const maxQty = item.inventoryOnHand;

                  return (
                    <tr key={item.lineItem.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm text-gray-900">
                          {item.lineItem.productName}
                        </div>
                        <div className="text-xs text-gray-500">{item.lineItem.partNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                        {item.lineItem.orderedQty}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {item.inventoryOnHand}
                      </td>
                      <td className="px-4 py-3 bg-green-50/50">
                        <div className="flex items-center justify-center">
                          <div className="flex items-center border border-green-300 rounded-lg overflow-hidden bg-white">
                            <button
                              onClick={() =>
                                updateAllocation(item.lineItem.id, alloc.newQty - 1)
                              }
                              className="px-2 py-1 bg-green-50 hover:bg-green-100 transition-colors"
                            >
                              <svg
                                className="w-3 h-3 text-green-600"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                              </svg>
                            </button>
                            <input
                              type="number"
                              value={alloc.newQty}
                              onChange={(e) =>
                                updateAllocation(item.lineItem.id, parseInt(e.target.value) || 0)
                              }
                              className="w-14 text-center py-1 border-x border-green-300 focus:outline-none focus:ring-0 text-sm font-medium text-green-700"
                              min={0}
                              max={maxQty}
                            />
                            <button
                              onClick={() =>
                                updateAllocation(item.lineItem.id, alloc.newQty + 1)
                              }
                              className="px-2 py-1 bg-green-50 hover:bg-green-100 transition-colors"
                            >
                              <svg
                                className="w-3 h-3 text-green-600"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {alloc.newQty === maxQty && maxQty > 0 && (
                          <div className="text-xs text-green-600 text-center mt-1">Max available</div>
                        )}
                      </td>
                      <td className="px-4 py-3 bg-red-50/50 text-center">
                        {alloc.cancelledQty > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-semibold bg-red-100 text-red-800">
                            -{alloc.cancelledQty}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Original Total
              </h4>
              <div className="text-xl font-bold text-gray-700">{totalOriginalQty} units</div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
                New Total
              </h4>
              <div className="text-xl font-bold text-green-700">{totalNewQty} units</div>
              <p className="text-xs text-green-600 mt-1">Will be fulfilled</p>
            </div>

            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
                Cancelled
              </h4>
              <div className="text-xl font-bold text-red-700">{totalCancelledQty} units</div>
              <p className="text-xs text-red-600 mt-1">Removed from order</p>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g., Customer agreed to partial fulfillment, Inventory shortage, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-300 text-sm resize-none h-20"
            />
            <p className="text-xs text-gray-500 mt-1">
              This reason will be recorded on both the fulfillment order and the original sales order.
            </p>
          </div>

          {/* What happens next */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">What happens next:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">1.</span>
                <span>
                  The fulfillment order quantities will be updated to the new values
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">2.</span>
                <span>
                  The original sales order (#{fulfillmentOrder.orderNumber}) will be updated with cancelled quantities
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">3.</span>
                <span>
                  A cancellation note with your reason will be added to both orders
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">4.</span>
                <span>
                  You can proceed with picking/packing the adjusted quantities immediately
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-6 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Confirm Cancellation & Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
