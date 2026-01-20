'use client';

import React, { useState } from 'react';
import { FulfillmentOrder, FulfillmentOrderLineItem } from '../../api/fulfillmentApi';

interface BackorderItem {
  lineItem: FulfillmentOrderLineItem;
  inventoryOnHand: number;
  manufacturerName: string;
  manufacturerId: string;
}

interface SplitAllocation {
  lineItemId: string;
  warehouseQty: number;
  manufacturerQty: number;
}

interface SplitOrderModalProps {
  isOpen: boolean;
  fulfillmentOrder: FulfillmentOrder;
  backorderItems: BackorderItem[];
  onClose: () => void;
  onConfirm: (allocations: SplitAllocation[]) => void;
}

export default function SplitOrderModal({
  isOpen,
  fulfillmentOrder,
  backorderItems,
  onClose,
  onConfirm,
}: SplitOrderModalProps) {
  // Initialize with all available inventory going to warehouse, rest to manufacturer
  const [allocations, setAllocations] = useState<Record<string, SplitAllocation>>(() => {
    const initial: Record<string, SplitAllocation> = {};
    backorderItems.forEach((item) => {
      const availableQty = Math.min(item.lineItem.allocatedQty, item.inventoryOnHand);
      initial[item.lineItem.id] = {
        lineItemId: item.lineItem.id,
        warehouseQty: availableQty,
        manufacturerQty: item.lineItem.orderedQty - availableQty,
      };
    });
    return initial;
  });

  if (!isOpen) return null;

  const updateAllocation = (
    itemId: string,
    field: 'warehouseQty' | 'manufacturerQty',
    value: number
  ) => {
    const item = backorderItems.find((i) => i.lineItem.id === itemId);
    if (!item) return;

    const totalOrdered = item.lineItem.orderedQty;
    const maxWarehouse = Math.min(totalOrdered, item.inventoryOnHand);

    setAllocations((prev) => {
      const current = prev[itemId];
      let warehouseQty = current.warehouseQty;
      let manufacturerQty = current.manufacturerQty;

      if (field === 'warehouseQty') {
        warehouseQty = Math.max(0, Math.min(value, maxWarehouse));
        manufacturerQty = totalOrdered - warehouseQty;
      } else {
        manufacturerQty = Math.max(0, Math.min(value, totalOrdered));
        warehouseQty = Math.min(totalOrdered - manufacturerQty, maxWarehouse);
        // Recalculate manufacturer qty if warehouse can't fulfill the remainder
        manufacturerQty = totalOrdered - warehouseQty;
      }

      return {
        ...prev,
        [itemId]: {
          lineItemId: itemId,
          warehouseQty,
          manufacturerQty,
        },
      };
    });
  };

  const totalWarehouseQty = Object.values(allocations).reduce(
    (sum, alloc) => sum + alloc.warehouseQty,
    0
  );
  const totalManufacturerQty = Object.values(allocations).reduce(
    (sum, alloc) => sum + alloc.manufacturerQty,
    0
  );

  const handleConfirm = () => {
    onConfirm(Object.values(allocations));
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
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Split Order Between Warehouse & Manufacturer
              </h2>
              <p className="text-sm text-gray-600">
                Order #{fulfillmentOrder.order?.orderNumber || '-'} - {fulfillmentOrder.customer?.companyName || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-gray-600 mb-4">
            Specify how many units to fulfill from warehouse now vs. send to the manufacturer for
            direct fulfillment. Items sent to manufacturer will create new line items marked as
            &quot;Fulfilled by Manufacturer&quot;.
          </p>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
              <span className="text-xs text-gray-600">Ship from Warehouse</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-100 border border-indigo-300 rounded" />
              <span className="text-xs text-gray-600">Send to Manufacturer</span>
            </div>
          </div>

          {/* Allocation Table */}
          <div className="space-y-4">
            {Object.entries(byManufacturer).map(([mfrId, { name, items }]) => (
              <div key={mfrId} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <span className="text-sm font-semibold text-gray-800">{name}</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Ordered
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        On Hand
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-green-700 uppercase tracking-wider bg-green-50">
                        Warehouse
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-indigo-700 uppercase tracking-wider bg-indigo-50">
                        Manufacturer
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => {
                      const alloc = allocations[item.lineItem.id];
                      const maxWarehouse = Math.min(
                        item.lineItem.orderedQty,
                        item.inventoryOnHand
                      );

                      return (
                        <tr key={item.lineItem.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm text-gray-900">
                              {item.lineItem.product?.description || item.lineItem.product?.factoryPartNumber || '-'}
                            </div>
                            <div className="text-xs text-gray-500">{item.lineItem.product?.factoryPartNumber || '-'}</div>
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
                                    updateAllocation(
                                      item.lineItem.id,
                                      'warehouseQty',
                                      alloc.warehouseQty - 1
                                    )
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
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M20 12H4"
                                    />
                                  </svg>
                                </button>
                                <input
                                  type="number"
                                  value={alloc.warehouseQty}
                                  onChange={(e) =>
                                    updateAllocation(
                                      item.lineItem.id,
                                      'warehouseQty',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-14 text-center py-1 border-x border-green-300 focus:outline-none focus:ring-0 text-sm font-medium text-green-700"
                                  min={0}
                                  max={maxWarehouse}
                                />
                                <button
                                  onClick={() =>
                                    updateAllocation(
                                      item.lineItem.id,
                                      'warehouseQty',
                                      alloc.warehouseQty + 1
                                    )
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
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 4v16m8-8H4"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            {alloc.warehouseQty === maxWarehouse && maxWarehouse > 0 && (
                              <div className="text-xs text-green-600 text-center mt-1">Max</div>
                            )}
                          </td>
                          <td className="px-4 py-3 bg-indigo-50/50">
                            <div className="flex items-center justify-center">
                              <div className="flex items-center border border-indigo-300 rounded-lg overflow-hidden bg-white">
                                <button
                                  onClick={() =>
                                    updateAllocation(
                                      item.lineItem.id,
                                      'manufacturerQty',
                                      alloc.manufacturerQty - 1
                                    )
                                  }
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                >
                                  <svg
                                    className="w-3 h-3 text-indigo-600"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M20 12H4"
                                    />
                                  </svg>
                                </button>
                                <input
                                  type="number"
                                  value={alloc.manufacturerQty}
                                  onChange={(e) =>
                                    updateAllocation(
                                      item.lineItem.id,
                                      'manufacturerQty',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-14 text-center py-1 border-x border-indigo-300 focus:outline-none focus:ring-0 text-sm font-medium text-indigo-700"
                                  min={0}
                                  max={item.lineItem.orderedQty}
                                />
                                <button
                                  onClick={() =>
                                    updateAllocation(
                                      item.lineItem.id,
                                      'manufacturerQty',
                                      alloc.manufacturerQty + 1
                                    )
                                  }
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                                >
                                  <svg
                                    className="w-3 h-3 text-indigo-600"
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Ship from Warehouse Now
              </h4>
              <div className="text-2xl font-bold text-green-700">{totalWarehouseQty} units</div>
              <p className="text-xs text-green-600 mt-1">
                Will be fulfilled immediately from warehouse inventory
              </p>
            </div>

            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Send to Manufacturer
              </h4>
              <div className="text-2xl font-bold text-indigo-700">{totalManufacturerQty} units</div>
              <p className="text-xs text-indigo-600 mt-1">
                New line items marked &quot;Fulfilled by Manufacturer&quot;
              </p>
            </div>
          </div>

          {/* What happens next */}
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">What happens next:</h4>
            <ul className="text-xs text-purple-800 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">1.</span>
                <span>
                  Warehouse quantities will be updated on the existing line items
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">2.</span>
                <span>
                  New line items will be created for manufacturer-fulfilled quantities with
                  &quot;Fulfilled by Manufacturer&quot; indicator
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">3.</span>
                <span>
                  You can proceed with picking/packing the warehouse portion immediately
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">4.</span>
                <span>
                  The original sales order will show both fulfillment sources
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
            disabled={totalWarehouseQty === 0 && totalManufacturerQty === 0}
            className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Split Order
          </button>
        </div>
      </div>
    </div>
  );
}
