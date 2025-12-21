/**
 * LineItemsTableRow Component
 * Single table row for a line item with all 28 columns
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { OrderLineItem, Order } from '@/lib/types/rms';
import type { ColumnKey, ViewMode, InvoiceTooltipState } from '../../types';
import { formatCurrency, formatDate } from '../../utils';

interface LineItemsTableRowProps {
  item: OrderLineItem;
  order: Order;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  visibleColumns: Set<ColumnKey>;
  viewMode: ViewMode;
  isPinned: (column: ColumnKey) => boolean;
  getPinnedColumnStyle: (column: ColumnKey) => React.CSSProperties;
  lineItemAcknowledgements: Record<string, any>;
  lineItemCredits: Record<string, any>;
  getLinkedInvoicesForLineItem: (item: OrderLineItem, orderId: string, invoices: any[]) => any[];
  getLinkedChecksForInvoice: (invoiceId: string, checks: any[]) => any[];
  getLineShipStatus: (item: OrderLineItem, invoices: any[]) => { label: string; color: string };
  mockInvoices: any[];
  mockChecks: any[];
  setInvoiceTooltip: React.Dispatch<React.SetStateAction<any>>;
}

export function LineItemsTableRow({
  item,
  order,
  isSelected,
  onToggleSelection,
  visibleColumns,
  viewMode,
  isPinned,
  getPinnedColumnStyle,
  lineItemAcknowledgements,
  lineItemCredits,
  getLinkedInvoicesForLineItem,
  getLinkedChecksForInvoice,
  getLineShipStatus,
  mockInvoices,
  mockChecks,
  setInvoiceTooltip,
}: LineItemsTableRowProps) {
  const router = useRouter();

  return (
    <tr
      className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${
        isSelected ? 'bg-[var(--primary)]/5' : ''
      } ${item.isCredit ? 'bg-red-50' : ''}`}
    >
      {/* Checkbox */}
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(item.id)}
          className="accent-[var(--primary)]"
        />
      </td>

      {/* Icon columns */}
      {(visibleColumns.has('iconAcknowledgement') || visibleColumns.has('iconDocumentSpecific') || visibleColumns.has('iconWarehouse') || visibleColumns.has('iconCredit')) && (
        <td className="px-1 py-2">
          <div className="flex items-center gap-1">
            {/* Acknowledgement icon */}
            {visibleColumns.has('iconAcknowledgement') && (
              <div className="w-7 flex justify-center">
                {lineItemAcknowledgements[item.id] && (() => {
                  const ack = lineItemAcknowledgements[item.id];
                  const isPartial = ack.acknowledgedQty < item.quantity;
                  return (
                    <div className="relative group">
                      <div className={`w-6 h-6 rounded flex items-center justify-center cursor-help ${isPartial ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                        {isPartial ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                            <path d="M9 12l2 2 4-4"/>
                            <rect x="3" y="4" width="18" height="16" rx="2"/>
                            <path d="M3 12h4" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                            <path d="M9 12l2 2 4-4"/>
                            <rect x="3" y="4" width="18" height="16" rx="2"/>
                          </svg>
                        )}
                      </div>
                      <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[220px]">
                        <div className={`font-semibold mb-2 text-base ${isPartial ? 'text-yellow-400' : 'text-blue-400'}`}>
                          {isPartial ? 'Partial Acknowledgement' : 'Fully Acknowledged'}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Ship Date:</span>
                            <span className="font-medium">{ack.shipDate}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Ack #:</span>
                            <span className="font-medium">{ack.ackNumber}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Acknowledged:</span>
                            <span className="font-medium">{ack.acknowledgedQty} of {item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Document-specific icon */}
            {visibleColumns.has('iconDocumentSpecific') && (
              <div className="w-7 flex justify-center">
                {item.isDocumentSpecific && (
                  <div className="relative group">
                    <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center cursor-help">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 18v-6M9 15l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[200px]">
                      <div className="font-semibold mb-1 text-purple-400">Document-Specific Product</div>
                      <p className="text-xs text-gray-400">Created specifically for this order</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Warehouse icon */}
            {visibleColumns.has('iconWarehouse') && (
              <div className="w-7 flex justify-center">
                {item.isWarehouseConsignment && (
                  <div className="relative group">
                    <div className="w-6 h-6 rounded bg-teal-500 flex items-center justify-center cursor-help">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
                        <path d="M3 21h18v-9l-9-7-9 7v9z"/>
                        <path d="M9 21v-6h6v6" fill="rgb(20 184 166)"/>
                      </svg>
                    </div>
                    <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[200px]">
                      <div className="font-semibold mb-2 text-teal-400">Warehouse Product</div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-400">Inventory on Hand:</span>
                          <span className="font-medium">{item.inventoryOnHand ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Credit icon */}
            {visibleColumns.has('iconCredit') && (
              <div className="w-7 flex justify-center">
                {lineItemCredits[item.id] && (() => {
                  const credit = lineItemCredits[item.id];
                  return (
                    <div className="relative group">
                      <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center cursor-help">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M8 12h8"/>
                        </svg>
                      </div>
                      <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[220px]">
                        <div className="font-semibold mb-2 text-base text-red-400">Credit Applied</div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Type:</span>
                            <span className="font-medium">{credit.creditType}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Credit Qty:</span>
                            <span className="font-medium text-red-400">-{credit.creditQty}</span>
                          </div>
                        </div>
                        <div className="border-t border-gray-700 mt-2 pt-2">
                          <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Original Values</div>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-400">Qty:</span>
                              <span className="font-medium">{credit.originalQty}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-400">Total:</span>
                              <span className="font-medium">{formatCurrency(credit.originalTotal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </td>
      )}

      {/* Part Number */}
      {visibleColumns.has('partNumber') && (
        <td
          className={`px-3 py-2 text-sm ${isPinned('partNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
          style={getPinnedColumnStyle('partNumber')}
        >
          {item.isCredit ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8"/>
              </svg>
              {item.creditType === 'return' ? 'RETURN' :
               item.creditType === 'short_ship' ? 'SHORT SHIP' :
               item.creditType === 'cancel' ? 'CANCEL' :
               item.creditType === 'damage' ? 'DAMAGE' : 'CREDIT'}
            </span>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={item.partNumber || ''}
                className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded"
                readOnly
              />
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50">
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </td>
      )}

      {/* Customer Part Number */}
      {visibleColumns.has('custPartNumber') && (
        <td
          className={`px-3 py-2 text-sm ${isPinned('custPartNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
          style={getPinnedColumnStyle('custPartNumber')}
        >
          <div className="relative">
            <select className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded appearance-none cursor-pointer">
              <option value="">Select...</option>
            </select>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]/50">
              <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </td>
      )}

      {/* Description */}
      {visibleColumns.has('description') && (
        <td
          className={`px-3 py-2 text-sm min-w-[300px] max-w-[400px] ${isPinned('description') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
          style={getPinnedColumnStyle('description')}
        >
          <div className="relative">
            <input
              type="text"
              value={item.description}
              className="w-full px-2 py-1 bg-transparent border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] rounded truncate"
              readOnly
              title={item.description}
            />
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-1 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/50">
              <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
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
        <td className="px-3 py-2 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
      )}

      {/* Quantity */}
      {visibleColumns.has('quantity') && (
        <td className={`px-3 py-2 text-sm text-center ${item.isCredit ? 'text-red-600 font-medium' : ''}`}>
          {item.quantity}
        </td>
      )}

      {/* Shipped Qty */}
      {visibleColumns.has('shippedQty') && (
        <td className="px-3 py-2 text-sm text-center">
          {item.partNumber === 'FREIGHT' ? '' : item.quantityShipped}
        </td>
      )}

      {/* Line Status */}
      {visibleColumns.has('lineStatus') && (
        <td className="px-3 py-2 text-sm text-center">
          {item.partNumber !== 'FREIGHT' && !item.isCredit && (() => {
            const linkedInvoices = getLinkedInvoicesForLineItem(item, order.id, mockInvoices);
            const status = getLineShipStatus(item, linkedInvoices);
            return (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            );
          })()}
        </td>
      )}

      {/* Sell Total */}
      {visibleColumns.has('sellTotal') && (
        <td className={`px-3 py-2 text-sm text-right font-medium ${item.isCredit ? 'text-red-600' : ''}`}>
          {formatCurrency(item.extendedPrice)}
        </td>
      )}

      {/* Commission % (simple view) */}
      {visibleColumns.has('commissionPercent') && viewMode === 'simple' && (
        <td className="px-3 py-2 text-sm text-right text-purple-600">
          {item.partNumber === 'FREIGHT' ? '' : `${((item.commissionRate || 0.08) * 100).toFixed(0)}%`}
        </td>
      )}

      {/* Commission */}
      {visibleColumns.has('commission') && (
        <td className={`px-3 py-2 text-sm text-right ${item.isCredit ? 'text-red-600' : 'text-purple-600'}`}>
          {item.partNumber === 'FREIGHT' && !item.isCredit ? '' : formatCurrency(item.extendedPrice * (item.commissionRate || 0.08))}
        </td>
      )}

      {/* Commission Total */}
      {visibleColumns.has('commissionTotal') && (
        <td className={`px-3 py-2 text-sm text-right font-medium ${item.isCredit ? 'text-red-600' : 'text-purple-600'}`}>
          {item.partNumber === 'FREIGHT' && !item.isCredit ? '' : formatCurrency(item.extendedPrice * (item.commissionRate || 0.08))}
        </td>
      )}

      {/* Linked Quote */}
      {visibleColumns.has('linkedQuote') && (
        <td className="px-3 py-2 text-sm text-left min-w-[120px]">
          {item.partNumber !== 'FREIGHT' && !item.isCredit && order?.quoteId ? (
            <button
              onClick={() => router.push(`/quotes/${order.quoteId}`)}
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap"
            >
              {order.quoteNumber}
            </button>
          ) : (
            <span className="text-[var(--muted-foreground)]">-</span>
          )}
        </td>
      )}

      {/* Linked Invoice */}
      {visibleColumns.has('linkedInvoice') && (
        <td className="px-3 py-2 text-sm text-left min-w-[120px]">
          {item.partNumber !== 'FREIGHT' && !item.isCredit && (() => {
            const linkedInvoices = getLinkedInvoicesForLineItem(item, order.id, mockInvoices);
            if (linkedInvoices.length === 0) {
              return <span className="text-[var(--muted-foreground)]">-</span>;
            }
            return (
              <button
                onClick={() => router.push(`/invoices/${linkedInvoices[0].id}`)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setInvoiceTooltip({
                    visible: true,
                    x: rect.left,
                    y: rect.top,
                    invoices: linkedInvoices,
                  });
                }}
                onMouseLeave={() => setInvoiceTooltip((prev: InvoiceTooltipState) => ({ ...prev, visible: false }))}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap"
              >
                {linkedInvoices[0].invoiceNumber}
                {linkedInvoices.length > 1 && (
                  <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                    +{linkedInvoices.length - 1}
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
          {item.partNumber !== 'FREIGHT' && !item.isCredit && (() => {
            const linkedInvoices = getLinkedInvoicesForLineItem(item, order.id, mockInvoices);
            const linkedChecks = linkedInvoices.flatMap(inv =>
              getLinkedChecksForInvoice(inv.id, mockChecks)
            );
            const uniqueChecks = linkedChecks.filter((check, index, self) =>
              index === self.findIndex(c => c.id === check.id)
            );
            if (uniqueChecks.length === 0) {
              return <span className="text-[var(--muted-foreground)]">-</span>;
            }
            return (
              <button
                onClick={() => router.push(`/commissions/${uniqueChecks[0].id}`)}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap"
              >
                {uniqueChecks[0].checkNumber}
                {uniqueChecks.length > 1 && (
                  <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                    +{uniqueChecks.length - 1}
                  </span>
                )}
              </button>
            );
          })()}
        </td>
      )}

      {/* Linked Fulfillment */}
      {visibleColumns.has('linkedFulfillment') && (
        <td className="px-3 py-2 text-sm text-left min-w-[120px]">
          {item.fulfillmentRequestNumber ? (
            <div className="relative group">
              <button className="text-orange-600 hover:text-orange-800 hover:underline cursor-pointer whitespace-nowrap">
                {item.fulfillmentRequestNumber}
              </button>
              <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[200px]">
                <div className="font-semibold mb-2 text-orange-400">Fulfillment Request</div>
                <div className="space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-400">Request #:</span>
                    <span className="font-medium">{item.fulfillmentRequestNumber}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-medium capitalize ${
                      item.fulfillmentRequestStatus === 'pending' ? 'text-yellow-400' :
                      item.fulfillmentRequestStatus === 'processing' ? 'text-blue-400' :
                      item.fulfillmentRequestStatus === 'shipped' ? 'text-purple-400' :
                      item.fulfillmentRequestStatus === 'delivered' ? 'text-green-400' :
                      item.fulfillmentRequestStatus === 'cancelled' ? 'text-red-400' : ''
                    }`}>
                      {item.fulfillmentRequestStatus || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-400">Quantity:</span>
                    <span className="font-medium">{item.quantity}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <span className="text-[var(--muted-foreground)]">-</span>
          )}
        </td>
      )}

      {/* Invoiced */}
      {visibleColumns.has('invoiced') && (
        <td className="px-3 py-2 text-sm text-center">{item.quantityInvoiced}</td>
      )}

      {/* Percent Over */}
      {visibleColumns.has('percentOver') && (
        <td className="px-3 py-2 text-sm text-right">
          {item.partNumber === 'FREIGHT' ? '' : '15.0%'}
        </td>
      )}

      {/* Commission % (overage view) */}
      {visibleColumns.has('commissionPercent') && viewMode === 'overage' && (
        <td className="px-3 py-2 text-sm text-right text-purple-600">
          {item.partNumber === 'FREIGHT' ? '' : `${((item.commissionRate || 0.08) * 100).toFixed(0)}%`}
        </td>
      )}

      {/* Commission Amount */}
      {visibleColumns.has('commissionAmount') && (
        <td className="px-3 py-2 text-sm text-right text-purple-600">
          {item.partNumber === 'FREIGHT' ? '' : formatCurrency(item.extendedPrice * (item.commissionRate || 0.08))}
        </td>
      )}

      {/* Ovg % */}
      {visibleColumns.has('ovgPercent') && (
        <td className="px-3 py-2 text-sm text-right text-orange-500">
          {item.partNumber === 'FREIGHT' ? '' : '85%'}
        </td>
      )}

      {/* Ovg $ */}
      {visibleColumns.has('ovgAmount') && (
        <td className="px-3 py-2 text-sm text-right text-orange-500">
          {item.partNumber === 'FREIGHT' ? '' : formatCurrency(item.unitPrice * 0.15 * item.quantity * 0.85)}
        </td>
      )}

      {/* Earn % */}
      {visibleColumns.has('earnPercent') && (
        <td className="px-3 py-2 text-sm text-right text-green-600">
          {item.partNumber === 'FREIGHT' ? '' : '20.8%'}
        </td>
      )}

      {/* Earn $ */}
      {visibleColumns.has('earnAmount') && (
        <td className="px-3 py-2 text-sm text-right text-green-600 font-medium">
          {item.partNumber === 'FREIGHT' ? '' : formatCurrency((item.extendedPrice * (item.commissionRate || 0.08)) + (item.unitPrice * 0.15 * item.quantity * 0.85))}
        </td>
      )}

      {/* Actions column */}
      <td className="px-2 py-2">
        <button className="p-1 hover:bg-[var(--muted)] rounded transition-colors">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="5" r="1"/>
            <circle cx="10" cy="10" r="1"/>
            <circle cx="10" cy="15" r="1"/>
          </svg>
        </button>
      </td>
    </tr>
  );
}
