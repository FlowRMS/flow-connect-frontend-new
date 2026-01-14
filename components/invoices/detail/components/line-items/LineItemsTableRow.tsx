/**
 * LineItemsTableRow Component
 * Single table row for an invoice line item with all columns
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Order } from '@/lib/types/rms';
import type { ColumnKey, ViewMode, LineItemCredit, InvoiceLineItem, EditableInvoice } from '../../types';
import { formatCurrency } from '../../utils';
import { getLinkedOrdersForInvoiceLine, getLinkedChecksForInvoice } from '../../utils';

export interface LineItemsTableRowProps {
  item: InvoiceLineItem;
  invoice: EditableInvoice;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  visibleColumns: Set<ColumnKey>;
  viewMode: ViewMode;
  lineItemCredits: Record<string, LineItemCredit>;
  onShowOrderTooltip: (x: number, y: number, orders: Order[]) => void;
  mockOrders: Order[];
  mockChecks: any[];
  // Editing props
  editingCell?: { rowId: string; column: ColumnKey } | null;
  editValue?: string;
  onStartEdit?: (rowId: string, column: ColumnKey, currentValue: string) => void;
  onEditValueChange?: (value: string) => void;
  onFinishEdit?: (save?: boolean) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  isEditable?: boolean;
  // Product search props
  productSearchTerm?: string;
  setProductSearchTerm?: (term: string) => void;
  setProductSearchEnabled?: (enabled: boolean) => void;
  productOptions?: { id: string; label: string; sublabel?: string; data: any }[];
  isProductSearchLoading?: boolean;
  onProductSelect?: (lineItemId: string, productId: string, product: any) => void;
  // Actions
  onOpenAdditionalDetails?: (lineItem: InvoiceLineItem) => void;
  onDeleteLineItem?: (lineItemId: string) => void;
}

export function LineItemsTableRow({
  item,
  invoice,
  isSelected,
  onToggleSelection,
  visibleColumns,
  viewMode,
  lineItemCredits,
  onShowOrderTooltip,
  mockOrders,
  mockChecks,
  // Editing props (optional)
  editingCell,
  editValue,
  onStartEdit,
  onEditValueChange,
  onFinishEdit,
  onKeyDown,
  isEditable,
  // Product search props (optional)
  productSearchTerm,
  setProductSearchTerm,
  setProductSearchEnabled,
  productOptions,
  isProductSearchLoading,
  onProductSelect,
  // Actions (optional)
  onOpenAdditionalDetails,
  onDeleteLineItem,
}: LineItemsTableRowProps) {
  const router = useRouter();

  return (
    <tr
      className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${
        isSelected ? 'bg-[var(--primary)]/5' : ''
      }`}
    >
      {/* Checkbox and indicators */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(item.id)}
            className="accent-[var(--primary)]"
          />
          {/* Document-specific product indicator */}
          {item.isQuoteLevelProduct && (
            <div className="relative group">
              <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center cursor-help">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                >
                  <path
                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 2v6h6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 18v-6M9 15l3-3 3 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[200px]">
                <div className="font-semibold mb-1 text-purple-400">
                  Document-Specific Product
                </div>
                <p className="text-xs text-gray-400">
                  Created specifically for this invoice
                </p>
              </div>
            </div>
          )}
          {/* Warehouse consignment indicator */}
          {item.isWarehouseConsignment && (
            <div className="relative group">
              <div className="w-6 h-6 rounded bg-teal-500 flex items-center justify-center cursor-help">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="white"
                  stroke="white"
                  strokeWidth="1"
                >
                  <path d="M3 21h18v-9l-9-7-9 7v9z" />
                  <path d="M9 21v-6h6v6" fill="rgb(20 184 166)" />
                </svg>
              </div>
              <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[200px]">
                <div className="font-semibold mb-2 text-teal-400">
                  Warehouse Product
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-400">Inventory on Hand:</span>
                    <span className="font-medium">
                      {item.inventoryOnHand ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Credit indicator */}
          {lineItemCredits[item.id] && (() => {
            const credit = lineItemCredits[item.id];
            return (
              <div className="relative group">
                <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center cursor-help">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-red-600"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8" />
                  </svg>
                </div>
                <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[220px]">
                  <div className="font-semibold mb-2 text-base text-red-400">
                    Credit Applied
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Type:</span>
                      <span className="font-medium">{credit.creditType}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-400">Credit Qty:</span>
                      <span className="font-medium text-red-400">
                        -{credit.creditQty}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-700 mt-2 pt-2">
                    <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Original Values
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Qty:</span>
                        <span className="font-medium">{credit.originalQty}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Total:</span>
                        <span className="font-medium">
                          {formatCurrency(credit.originalTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </td>

      {/* Part Number */}
      {visibleColumns.has('partNumber') && (
        <td className="px-3 py-2 text-sm">
          <div className="relative">
            <input
              type="text"
              value={item.partNumber}
              className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded"
              readOnly
            />
            <svg
              width="12"
              height="12"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50"
            >
              <path
                d="M6 8l4 4 4-4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </td>
      )}

      {/* Customer Part Number */}
      {visibleColumns.has('custPartNumber') && (
        <td className="px-3 py-2 text-sm">
          <div className="relative">
            <select className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded appearance-none cursor-pointer">
              <option value="">Select...</option>
            </select>
            <svg
              width="12"
              height="12"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]/50"
            >
              <path
                d="M6 8l4 4 4-4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </td>
      )}

      {/* Description */}
      {visibleColumns.has('description') && (
        <td className="px-3 py-2 text-sm max-w-[200px]">
          <div className="relative">
            <input
              type="text"
              value={item.description}
              className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded truncate"
              readOnly
              title={item.description}
            />
            <svg
              width="12"
              height="12"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50"
            >
              <path
                d="M6 8l4 4 4-4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </td>
      )}

      {/* UOM */}
      {visibleColumns.has('uom') && (
        <td className="px-3 py-2 text-sm text-center">EA</td>
      )}

      {/* Divisor */}
      {visibleColumns.has('divisor') && (
        <td className="px-3 py-2 text-sm text-center">1</td>
      )}

      {/* Unit Price */}
      {visibleColumns.has('unitPrice') && (
        <td className="px-3 py-2 text-sm text-right">
          {formatCurrency(item.unitPrice)}
        </td>
      )}

      {/* Quantity */}
      {visibleColumns.has('quantity') && (
        <td className="px-3 py-2 text-sm text-center">{item.quantity}</td>
      )}

      {/* Sell Total */}
      {visibleColumns.has('sellTotal') && (
        <td className="px-3 py-2 text-sm text-right font-medium">
          {formatCurrency(item.amount)}
        </td>
      )}

      {/* Commission % (simple view) */}
      {visibleColumns.has('commissionPercent') && viewMode === 'simple' && (
        <td className="px-3 py-2 text-sm text-right text-purple-600">
          {`${((item.commissionRate ?? 0.08) * 100).toFixed(0)}%`}
        </td>
      )}

      {/* Commission */}
      {visibleColumns.has('commission') && (
        <td className="px-3 py-2 text-sm text-right text-purple-600">
          {formatCurrency(item.amount * (item.commissionRate ?? 0.08))}
        </td>
      )}

      {/* Commission Total */}
      {visibleColumns.has('commissionTotal') && (
        <td className="px-3 py-2 text-sm text-right text-purple-600 font-medium">
          {formatCurrency(item.amount * (item.commissionRate ?? 0.08))}
        </td>
      )}

      {/* % Over */}
      {visibleColumns.has('percentOver') && (
        <td className="px-3 py-2 text-sm text-right">15.0%</td>
      )}

      {/* Commission % (overage view) */}
      {visibleColumns.has('commissionPercent') && viewMode === 'overage' && (
        <td className="px-3 py-2 text-sm text-right text-purple-600">
          {`${((item.commissionRate ?? 0.08) * 100).toFixed(0)}%`}
        </td>
      )}

      {/* Commission Amount */}
      {visibleColumns.has('commissionAmount') && (
        <td className="px-3 py-2 text-sm text-right text-purple-600">
          {formatCurrency(item.amount * (item.commissionRate ?? 0.08))}
        </td>
      )}

      {/* Ovg % */}
      {visibleColumns.has('ovgPercent') && (
        <td className="px-3 py-2 text-sm text-right text-orange-500">85%</td>
      )}

      {/* Ovg $ */}
      {visibleColumns.has('ovgAmount') && (
        <td className="px-3 py-2 text-sm text-right text-orange-500">
          {formatCurrency(item.unitPrice * 0.15 * item.quantity * 0.85)}
        </td>
      )}

      {/* Earn % */}
      {visibleColumns.has('earnPercent') && (
        <td className="px-3 py-2 text-sm text-right text-green-600">
          20.8%
        </td>
      )}

      {/* Earn $ */}
      {visibleColumns.has('earnAmount') && (
        <td className="px-3 py-2 text-sm text-right text-green-600 font-medium">
          {formatCurrency(
            item.amount * (item.commissionRate ?? 0.08) +
              item.unitPrice * 0.15 * item.quantity * 0.85
          )}
        </td>
      )}

      {/* Linked Order */}
      {visibleColumns.has('linkedOrder') && (
        <td className="px-3 py-2 text-sm text-left min-w-[120px]">
          {(() => {
            const linkedOrders = getLinkedOrdersForInvoiceLine(
              item,
              invoice,
              mockOrders
            );
            if (linkedOrders.length === 0) {
              return (
                <span className="text-[var(--muted-foreground)]">-</span>
              );
            }
            return (
              <button
                onClick={() => router.push(`/orders/${linkedOrders[0].id}`)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onShowOrderTooltip(rect.left, rect.top, linkedOrders);
                }}
                onMouseLeave={() => onShowOrderTooltip(0, 0, [])}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap"
              >
                {linkedOrders[0].orderNumber}
                {linkedOrders.length > 1 && (
                  <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                    +{linkedOrders.length - 1}
                  </span>
                )}
              </button>
            );
          })()}
        </td>
      )}

      {/* Linked Check */}
      {visibleColumns.has('linkedCheck') && (
        <td className="px-3 py-2 text-sm text-left min-w-[120px]">
          {(() => {
            const linkedChecks = getLinkedChecksForInvoice(
              invoice.id,
              mockChecks
            );
            if (linkedChecks.length === 0) {
              return (
                <span className="text-[var(--muted-foreground)]">-</span>
              );
            }
            return (
              <button
                onClick={() =>
                  router.push(`/commissions/${linkedChecks[0].id}`)
                }
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap"
              >
                {linkedChecks[0].checkNumber}
                {linkedChecks.length > 1 && (
                  <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                    +{linkedChecks.length - 1}
                  </span>
                )}
              </button>
            );
          })()}
        </td>
      )}

      {/* Actions */}
      <td className="px-2 py-2">
        <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="10" cy="5" r="1" />
            <circle cx="10" cy="10" r="1" />
            <circle cx="10" cy="15" r="1" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

