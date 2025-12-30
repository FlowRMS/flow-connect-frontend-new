'use client';

import React, { useMemo } from 'react';
import { FulfillmentOrder, manufacturerFulfillmentStatusLabels } from '@/lib/types/warehouse';
import { mockInventory } from '@/lib/data/warehouse-mock';

interface LineItemsTableProps {
  fulfillmentOrder: FulfillmentOrder;
}

export default function LineItemsTable({ fulfillmentOrder }: LineItemsTableProps) {
  // Separate warehouse items and manufacturer-fulfilled items
  const warehouseItems = fulfillmentOrder.lineItems.filter(li => !li.fulfilledByManufacturer);
  const manufacturerItems = fulfillmentOrder.lineItems.filter(li => li.fulfilledByManufacturer);

  // Get inventory on hand for a product
  const getInventoryOnHand = useMemo(() => {
    return (productId: string) => {
      const inv = mockInventory.find(i => i.productId === productId);
      return inv?.availableQuantity || 0;
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Warehouse Line Items */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Warehouse Products</h3>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-200" title="These order lines are locked to this FO">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              FO Locked
            </span>
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">{warehouseItems.length} items</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
              <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Part #</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">UOM</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Ordered</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">On Hand</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Reserved</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Picked</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Shipped</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Backorder</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Pick Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {warehouseItems.length > 0 ? (
              warehouseItems.map((lineItem) => {
                const onHand = getInventoryOnHand(lineItem.productId);
                const isShort = lineItem.orderedQty > onHand;
                const backorderQty = isShort ? lineItem.orderedQty - onHand : 0;
                return (
                  <tr key={lineItem.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                    <td className="px-4 py-2 text-sm font-medium text-[var(--foreground)]">{lineItem.partNumber}</td>
                    <td className="px-4 py-2 text-sm text-[var(--foreground)]">{lineItem.productName}</td>
                    <td className="px-4 py-2 text-sm text-[var(--muted-foreground)] text-center">{lineItem.uom}</td>
                    <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.orderedQty}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <span className={isShort ? 'text-amber-600 font-medium' : 'text-[var(--foreground)]'}>
                        {onHand}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.allocatedQty}</td>
                    <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">0</td>
                    <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.shippedQty}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      {backorderQty > 0 ? (
                        <span className="text-red-600 font-medium">{backorderQty}</span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {lineItem.pickLocation || '-'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
                  All items on this order are being fulfilled by the manufacturer
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manufacturer-Fulfilled Line Items */}
      {manufacturerItems.length > 0 && (
        <div className="bg-[var(--card)] rounded-lg border border-indigo-200 overflow-hidden opacity-75">
          <div className="px-4 py-3 border-b border-indigo-200 bg-indigo-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-indigo-900">Fulfilled by Manufacturer</h3>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                Direct Ship
              </span>
            </div>
            <span className="text-xs text-indigo-600">{manufacturerItems.length} items</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-indigo-100 bg-indigo-50/50">
                <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Part #</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Product</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-indigo-700 uppercase">UOM</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-indigo-700 uppercase">Qty</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Manufacturer</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100">
              {manufacturerItems.map((lineItem) => (
                <tr key={lineItem.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-2 text-sm font-medium text-gray-500">{lineItem.partNumber}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{lineItem.productName}</td>
                  <td className="px-4 py-2 text-sm text-gray-400 text-center">{lineItem.uom}</td>
                  <td className="px-4 py-2 text-sm text-gray-500 text-right">{lineItem.orderedQty}</td>
                  <td className="px-4 py-2 text-sm text-indigo-600">{lineItem.manufacturerName || '-'}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                      {lineItem.manufacturerFulfillmentStatus
                        ? manufacturerFulfillmentStatusLabels[lineItem.manufacturerFulfillmentStatus]
                        : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

