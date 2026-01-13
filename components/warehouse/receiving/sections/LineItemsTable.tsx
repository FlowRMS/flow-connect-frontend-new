import React from 'react';
import type { LineItemReceive } from '../types';

interface LineItemsTableProps {
  lineItems: LineItemReceive[];
  totalExpected: number;
  isEditingDetails: boolean;
  hasVendorSelected: boolean;
  onAddProductClick: () => void;
  onUpdateExpectedQty: (lineItemId: string, quantity: number) => void;
  onRemoveExpectedItem: (lineItemId: string) => void;
  getItemAdjustedReceived: (item: LineItemReceive) => number;
  getItemDamagedTotal: (item: LineItemReceive) => number;
}

export default function LineItemsTable({
  lineItems,
  totalExpected,
  isEditingDetails,
  hasVendorSelected,
  onAddProductClick,
  onUpdateExpectedQty,
  onRemoveExpectedItem,
  getItemAdjustedReceived,
  getItemDamagedTotal,
}: LineItemsTableProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Expected Items</h3>
          <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded">
            {lineItems.length} line items
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted-foreground)]">{totalExpected} units expected</span>
          {isEditingDetails && hasVendorSelected && (
            <button
              onClick={onAddProductClick}
              className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Product
            </button>
          )}
        </div>
      </div>
      {lineItems.length === 0 ? (
        <div className="p-8 text-center">
          {!hasVendorSelected ? (
            <p className="text-[var(--muted-foreground)]">Select a vendor/manufacturer above to add products</p>
          ) : (
            <>
              <p className="text-[var(--muted-foreground)] mb-3">No expected items yet</p>
              {isEditingDetails && (
                <button
                  onClick={onAddProductClick}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Add Expected Products
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
              <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Part #</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Expected</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Received</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Variance</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Status</th>
              {isEditingDetails && (
                <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {lineItems.map((lineItem) => {
              const adjustedReceived = getItemAdjustedReceived(lineItem);
              const damagedTotal = getItemDamagedTotal(lineItem);
              const variance = adjustedReceived + damagedTotal - lineItem.expectedQty;
              const totalReceived = adjustedReceived + damagedTotal;
              const statusLabel = lineItem.putAway
                ? 'Put Away'
                : totalReceived === 0
                  ? 'Pending'
                  : totalReceived < lineItem.expectedQty
                    ? 'Partial'
                    : 'Received';
              const statusClass = lineItem.putAway
                ? 'bg-blue-100 text-blue-700'
                : statusLabel === 'Pending'
                  ? 'bg-gray-100 text-gray-700'
                  : statusLabel === 'Partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-700';
              return (
                <tr key={lineItem.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                  <td className="px-4 py-2 text-sm font-medium text-[var(--foreground)]">{lineItem.partNumber}</td>
                  <td className="px-4 py-2 text-sm text-[var(--foreground)]">{lineItem.productName}</td>
                  <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">
                    {isEditingDetails ? (
                      <input
                        type="number"
                        min="0"
                        value={lineItem.expectedQty}
                        onChange={(e) => onUpdateExpectedQty(lineItem.id, parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-right border border-[var(--border)] rounded bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    ) : (
                      lineItem.expectedQty
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{adjustedReceived}</td>
                  <td className="px-4 py-2 text-sm text-right">
                    <span className={variance === 0 ? 'text-green-600' : variance > 0 ? 'text-blue-600' : 'text-red-600'}>
                      {variance > 0 ? '+' : ''}{variance}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </td>
                  {isEditingDetails && (
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => onRemoveExpectedItem(lineItem.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove item"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
