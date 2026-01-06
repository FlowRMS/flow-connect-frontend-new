'use client';

import React from 'react';
import { FulfillmentOrder, FulfillmentOrderLineItem } from '@/lib/types/warehouse';

// Format quantity to remove unnecessary decimal places (30.0000 -> 30, 30.5000 -> 30.5)
const formatQty = (qty: number | string | null | undefined): string => {
  if (qty === null || qty === undefined) return '0';
  const num = typeof qty === 'string' ? parseFloat(qty) : qty;
  if (isNaN(num)) return '0';
  if (Number.isInteger(num)) return num.toString();
  // Remove trailing zeros after decimal
  return parseFloat(num.toFixed(4)).toString();
};

interface BackorderItem {
  lineItem: FulfillmentOrderLineItem;
  inventoryOnHand: number;
  manufacturerName: string;
  manufacturerId: string;
}

interface BackorderNoticeProps {
  fulfillmentOrder: FulfillmentOrder;
  backorderItems: BackorderItem[];
  onManufacturerDirect: () => void;
  onRequestInventory: () => void;
  onSplitOrder: () => void;
  onCancelBackorder: () => void;
}

export default function BackorderNotice({
  fulfillmentOrder,
  backorderItems,
  onManufacturerDirect,
  onRequestInventory,
  onSplitOrder,
  onCancelBackorder,
}: BackorderNoticeProps) {
  if (backorderItems.length === 0) return null;

  const totalBackorderQty = backorderItems.reduce(
    (sum, item) => sum + (item.lineItem.orderedQty - item.lineItem.allocatedQty),
    0
  );

  // Group backorder items by manufacturer
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
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-amber-600"
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
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-amber-800">
            Backorder Alert - Insufficient Inventory
          </h3>
          <p className="text-sm text-amber-700 mt-0.5">
            {backorderItems.length} product{backorderItems.length > 1 ? 's' : ''} on this order
            {backorderItems.length > 1 ? ' have' : ' has'} insufficient warehouse inventory.
            Total backorder quantity: <span className="font-semibold">{formatQty(totalBackorderQty)} units</span>
          </p>
        </div>
      </div>

      {/* Products on Backorder */}
      <div className="bg-white border border-amber-200 rounded-lg mb-4 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-amber-50 border-b border-amber-200">
              <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Ordered
              </th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                On Hand
              </th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Short
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Manufacturer
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {backorderItems.map((item) => {
              const shortQty = item.lineItem.orderedQty - item.lineItem.allocatedQty;
              return (
                <tr key={item.lineItem.id} className="hover:bg-amber-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-gray-900">
                      {item.lineItem.productName}
                    </div>
                    <div className="text-xs text-gray-500">{item.lineItem.partNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900">
                    {formatQty(item.lineItem.orderedQty)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900">
                    {formatQty(item.inventoryOnHand)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                      -{formatQty(shortQty)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.manufacturerName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Options */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-3">
          Choose how to handle the backorder:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Option 1: Manufacturer Direct */}
          <button
            onClick={onManufacturerDirect}
            className="flex flex-col items-start p-4 bg-white border border-amber-200 rounded-lg hover:border-amber-400 hover:shadow-sm transition-all group text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <svg
                  className="w-4 h-4 text-indigo-600"
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
              <span className="text-sm font-semibold text-gray-900">Manufacturer Direct</span>
            </div>
            <p className="text-xs text-gray-600">
              Request the manufacturer to ship the backordered items directly to the customer.
            </p>
          </button>

          {/* Option 2: Request Inventory */}
          <button
            onClick={onRequestInventory}
            className="flex flex-col items-start p-4 bg-white border border-amber-200 rounded-lg hover:border-amber-400 hover:shadow-sm transition-all group text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                <svg
                  className="w-4 h-4 text-cyan-600"
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
              <span className="text-sm font-semibold text-gray-900">Request Inventory</span>
            </div>
            <p className="text-xs text-gray-600">
              Create a shipment request to get inventory from the manufacturer to fulfill this order.
            </p>
          </button>

          {/* Option 3: Split Order */}
          <button
            onClick={onSplitOrder}
            className="flex flex-col items-start p-4 bg-white border border-amber-200 rounded-lg hover:border-amber-400 hover:shadow-sm transition-all group text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg
                  className="w-4 h-4 text-purple-600"
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
              <span className="text-sm font-semibold text-gray-900">Split Order</span>
            </div>
            <p className="text-xs text-gray-600">
              Ship available items now from warehouse, send remaining to manufacturer for direct fulfillment.
            </p>
          </button>

          {/* Option 4: Cancel Backorder */}
          <button
            onClick={onCancelBackorder}
            className="flex flex-col items-start p-4 bg-white border border-amber-200 rounded-lg hover:border-amber-400 hover:shadow-sm transition-all group text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <svg
                  className="w-4 h-4 text-red-600"
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
              <span className="text-sm font-semibold text-gray-900">Cancel Backorder</span>
            </div>
            <p className="text-xs text-gray-600">
              Cancel the backordered quantity and proceed with what&apos;s available. Updates the original order.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
