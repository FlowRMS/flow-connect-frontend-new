'use client';

import React, { useState } from 'react';
import { FulfillmentOrder, FulfillmentOrderLineItem, ShipmentRequest } from '@/lib/types/warehouse';

interface BackorderItem {
  lineItem: FulfillmentOrderLineItem;
  inventoryOnHand: number;
  manufacturerName: string;
  manufacturerId: string;
}

interface RequestInventoryModalProps {
  isOpen: boolean;
  fulfillmentOrder: FulfillmentOrder;
  backorderItems: BackorderItem[];
  existingShipmentRequests: ShipmentRequest[]; // Draft/Pending requests for same manufacturer
  onClose: () => void;
  onCreateNew: (items: { lineItem: FulfillmentOrderLineItem; requestedQty: number }[]) => void;
  onAddToExisting: (requestId: string, items: { lineItem: FulfillmentOrderLineItem; requestedQty: number }[]) => void;
}

export default function RequestInventoryModal({
  isOpen,
  fulfillmentOrder,
  backorderItems,
  existingShipmentRequests,
  onClose,
  onCreateNew,
  onAddToExisting,
}: RequestInventoryModalProps) {
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingRequest, setSelectedExistingRequest] = useState<string | null>(
    existingShipmentRequests.length > 0 ? existingShipmentRequests[0].id : null
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    backorderItems.forEach((item) => {
      initial[item.lineItem.id] = item.lineItem.orderedQty - item.lineItem.allocatedQty;
    });
    return initial;
  });

  if (!isOpen) return null;

  const updateQuantity = (itemId: string, qty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(0, qty),
    }));
  };

  const totalRequestedQty = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  const handleConfirm = () => {
    const itemsWithQty = backorderItems
      .filter((item) => quantities[item.lineItem.id] > 0)
      .map((item) => ({
        lineItem: item.lineItem,
        requestedQty: quantities[item.lineItem.id],
      }));

    if (mode === 'new') {
      onCreateNew(itemsWithQty);
    } else if (selectedExistingRequest) {
      onAddToExisting(selectedExistingRequest, itemsWithQty);
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-cyan-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-cyan-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Request Inventory from Manufacturer
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
            Create a shipment request to get inventory from the manufacturer. The order will be
            put on hold until the shipment arrives.
          </p>

          {/* Mode Selection */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setMode('new')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                mode === 'new'
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    mode === 'new' ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Create New Request</div>
                  <div className="text-xs text-gray-500">Start a new shipment request</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('existing')}
              disabled={existingShipmentRequests.length === 0}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                mode === 'existing'
                  ? 'border-cyan-500 bg-cyan-50'
                  : existingShipmentRequests.length === 0
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    mode === 'existing' ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Add to Existing</div>
                  <div className="text-xs text-gray-500">
                    {existingShipmentRequests.length > 0
                      ? `${existingShipmentRequests.length} pending request${existingShipmentRequests.length > 1 ? 's' : ''}`
                      : 'No pending requests'}
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Existing Request Selection */}
          {mode === 'existing' && existingShipmentRequests.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Shipment Request
              </label>
              <select
                value={selectedExistingRequest || ''}
                onChange={(e) => setSelectedExistingRequest(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                {existingShipmentRequests.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.requestNumber} - {req.vendorName} ({req.items.length} item
                    {req.items.length !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity Selection */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700">Products to Request</h4>

            {Object.entries(byManufacturer).map(([mfrId, { name, items }]) => (
              <div key={mfrId} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-800">{name}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const shortQty = item.lineItem.orderedQty - item.lineItem.allocatedQty;
                    const currentQty = quantities[item.lineItem.id] || 0;

                    return (
                      <div
                        key={item.lineItem.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {item.lineItem.productName}
                          </div>
                          <div className="text-xs text-gray-500">{item.lineItem.partNumber}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Ordered: {item.lineItem.orderedQty} | On Hand: {item.inventoryOnHand} |{' '}
                            <span className="text-red-600 font-medium">Short: {shortQty}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500">Request Qty:</label>
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.lineItem.id, currentQty - 1)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 text-gray-600"
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
                              value={currentQty}
                              onChange={(e) =>
                                updateQuantity(item.lineItem.id, parseInt(e.target.value) || 0)
                              }
                              className="w-16 text-center py-1 border-x border-gray-300 focus:outline-none focus:ring-0"
                              min={0}
                            />
                            <button
                              onClick={() => updateQuantity(item.lineItem.id, currentQty + 1)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 text-gray-600"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {totalRequestedQty > 0 && (
            <div className="mt-4 p-4 bg-cyan-50 rounded-lg">
              <h4 className="text-sm font-semibold text-cyan-900 mb-2">What happens next:</h4>
              <ul className="text-xs text-cyan-800 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">1.</span>
                  <span>
                    {mode === 'new'
                      ? `A new shipment request will be created for ${totalRequestedQty} units`
                      : `${totalRequestedQty} units will be added to the selected shipment request`}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">2.</span>
                  <span>
                    This fulfillment order will be placed on hold pending the shipment
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">3.</span>
                  <span>
                    A link to the shipment request will appear at the top of this order
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">4.</span>
                  <span>
                    Once inventory arrives, you can proceed with fulfillment
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
            disabled={totalRequestedQty === 0}
            className="px-6 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {mode === 'new' ? 'Create Request' : 'Add to Request'} ({totalRequestedQty} units)
          </button>
        </div>
      </div>
    </div>
  );
}
