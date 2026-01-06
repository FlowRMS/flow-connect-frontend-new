'use client';

import React, { useState } from 'react';
import { FulfillmentOrder, FulfillmentOrderLineItem } from '@/lib/types/warehouse';

interface BackorderItem {
  lineItem: FulfillmentOrderLineItem;
  inventoryOnHand: number;
  manufacturerName: string;
  manufacturerId: string;
}

interface ManufacturerDirectModalProps {
  isOpen: boolean;
  fulfillmentOrder: FulfillmentOrder;
  backorderItems: BackorderItem[];
  onClose: () => void;
  onConfirm: (selectedItems: BackorderItem[]) => void;
}

export default function ManufacturerDirectModal({
  isOpen,
  fulfillmentOrder,
  backorderItems,
  onClose,
  onConfirm,
}: ManufacturerDirectModalProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(backorderItems.map((item) => item.lineItem.id))
  );

  if (!isOpen) return null;

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleAll = () => {
    if (selectedItems.size === backorderItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(backorderItems.map((item) => item.lineItem.id)));
    }
  };

  const handleConfirm = () => {
    const itemsToSend = backorderItems.filter((item) =>
      selectedItems.has(item.lineItem.id)
    );
    onConfirm(itemsToSend);
  };

  // Group by manufacturer
  const byManufacturer = backorderItems.reduce((acc, item) => {
    if (!acc[item.manufacturerId]) {
      acc[item.manufacturerId] = {
        name: item.manufacturerName,
        items: [],
      };
    }
    acc[item.manufacturerId].items.push(item);
    return acc;
  }, {} as Record<string, { name: string; items: BackorderItem[] }>);

  const totalSelectedQty = backorderItems
    .filter((item) => selectedItems.has(item.lineItem.id))
    .reduce((sum, item) => sum + (item.lineItem.orderedQty - item.lineItem.allocatedQty), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-indigo-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Request Manufacturer Direct Shipment
              </h2>
              <p className="text-sm text-gray-600">
                Order #{fulfillmentOrder.orderNumber} - {fulfillmentOrder.customerName}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-gray-600 mb-4">
            Select the items you want the manufacturer to ship directly to the customer.
            These items will be marked as &quot;Fulfilled by Manufacturer&quot; on this order.
          </p>

          {/* Ship To Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Ship To Address
            </h4>
            <div className="text-sm text-gray-900">
              {fulfillmentOrder.shipTo ? (
                <>
                  <div className="font-medium">{fulfillmentOrder.shipTo.name || 'N/A'}</div>
                  <div>{fulfillmentOrder.shipTo.addressLine1 || fulfillmentOrder.shipTo.street || ''}</div>
                  {fulfillmentOrder.shipTo.addressLine2 && (
                    <div>{fulfillmentOrder.shipTo.addressLine2}</div>
                  )}
                  <div>
                    {fulfillmentOrder.shipTo.city || ''}, {fulfillmentOrder.shipTo.state || ''}{' '}
                    {fulfillmentOrder.shipTo.postalCode || ''}
                  </div>
                </>
              ) : (
                <div className="text-gray-500 italic">No shipping address provided</div>
              )}
            </div>
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedItems.size === backorderItems.length}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">Select All Items</span>
            </label>
            <span className="text-xs text-gray-500">
              {selectedItems.size} of {backorderItems.length} selected
            </span>
          </div>

          {/* Items grouped by manufacturer */}
          <div className="space-y-4">
            {Object.entries(byManufacturer).map(([mfrId, { name, items }]) => (
              <div key={mfrId} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-800">{name}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const shortQty = item.lineItem.orderedQty - item.lineItem.allocatedQty;
                    const isSelected = selectedItems.has(item.lineItem.id);

                    return (
                      <label
                        key={item.lineItem.id}
                        className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                          isSelected ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item.lineItem.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {item.lineItem.productName}
                          </div>
                          <div className="text-xs text-gray-500">{item.lineItem.partNumber}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            Qty: {shortQty}
                          </div>
                          <div className="text-xs text-gray-500">
                            of {item.lineItem.orderedQty} ordered
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {selectedItems.size > 0 && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2">
                What happens next:
              </h4>
              <ul className="text-xs text-indigo-800 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">1.</span>
                  <span>
                    Selected items ({totalSelectedQty} units) will be marked as
                    &quot;Fulfilled by Manufacturer&quot;
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">2.</span>
                  <span>
                    The fulfillment status for this order will change to &quot;Manufacturer Order&quot;
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">3.</span>
                  <span>
                    A link to the original sales order will be added for reference
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">4.</span>
                  <span>
                    Warehouse products for these items will be grayed out
                  </span>
                </li>
              </ul>
            </div>
          )}
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
            disabled={selectedItems.size === 0}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Manufacturer Direct ({selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''})
          </button>
        </div>
      </div>
    </div>
  );
}
