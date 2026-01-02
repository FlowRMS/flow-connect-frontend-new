/**
 * LineItemsTable Component
 * Main line items table with all columns, rows, and bulk actions
 * Supports editable cells with portal-based dropdowns like Orders page
 * Part # uses product search, auto-populates Cust Part # and Description
 */

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Order } from '@/lib/types/rms';
import type { ColumnKey, ViewMode, LineItemCredit, InvoiceLineItem, EditableInvoice } from '../../types';
import { BulkActionsBar } from './BulkActionsBar';
import { LineItemsTableHeader } from './LineItemsTableHeader';
import { formatCurrency } from '../../utils';
import { useProductSearch, useProductCpns, useProductUoms, getProductCpnByCustomer } from '@/components/orders/api';

type EditableColumnKey = 'partNumber' | 'custPartNumber' | 'description' | 'uom' | 'divisor' | 'quantity' | 'unitPrice' | 'commissionPercent';

interface LineItemsTableProps {
  invoice: EditableInvoice;
  selectedLineItems: Set<string>;
  onToggleLineItemSelection: (id: string) => void;
  onToggleAllLineItems: () => void;
  onClearSelection: () => void;
  visibleColumns: Set<ColumnKey>;
  viewMode: ViewMode;
  lineItemCredits: Record<string, LineItemCredit>;
  onConvertToWarehouse: () => void;
  onShowOrderTooltip: (x: number, y: number, orders: Order[]) => void;
  mockOrders: Order[];
  mockChecks: any[];
  // New props for editable functionality
  onAddLine?: () => void;
  onUpdateLineItem?: (lineItemId: string, updates: Partial<InvoiceLineItem>) => void;
  onDeleteLineItem?: (lineItemId: string) => void;
  onOpenAdditionalDetails?: (lineItem: InvoiceLineItem) => void;
  isEditable?: boolean;
  factoryId?: string;
}

export function LineItemsTable({
  invoice,
  selectedLineItems,
  onToggleLineItemSelection,
  onToggleAllLineItems,
  onClearSelection,
  visibleColumns,
  viewMode,
  lineItemCredits,
  onConvertToWarehouse,
  onShowOrderTooltip,
  mockOrders,
  mockChecks,
  onAddLine,
  onUpdateLineItem,
  onDeleteLineItem,
  onOpenAdditionalDetails,
  isEditable = true,
  factoryId,
}: LineItemsTableProps) {
  // Client-side check for portal
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Editable state - inline editing for non-dropdown columns
  const [editingCell, setEditingCell] = useState<{ itemId: string; column: EditableColumnKey } | null>(null);

  // Dropdown state for Part #, CPN, UOM
  const [dropdownOpen, setDropdownOpen] = useState<{
    itemId: string;
    column: EditableColumnKey;
    position: { top: number; left: number }
  } | null>(null);

  // Search state with debouncing
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search - 300ms delay
  useEffect(() => {
    if (searchQuery === '') {
      setDebouncedSearch('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Determine dropdown type
  const isProductDropdown = dropdownOpen && ['partNumber', 'description'].includes(dropdownOpen.column);
  const isCpnDropdown = dropdownOpen?.column === 'custPartNumber';
  const isUomDropdown = dropdownOpen?.column === 'uom';

  // Get current line item's productId for CPN search
  const currentLineItem = dropdownOpen ? invoice.lineItems.find(li => li.id === dropdownOpen.itemId) : null;
  const currentProductId = currentLineItem?.productId;

  // Product search - uses factoryId (manufacturerId) from invoice
  const { data: productResults = [], isLoading: productsLoading } = useProductSearch(
    debouncedSearch,
    factoryId,
    isProductDropdown ?? false
  );

  // CPN (Customer Part Number) search - requires a product to be selected first
  const { data: cpnResults = [], isLoading: cpnsLoading } = useProductCpns(
    currentProductId || '',
    isCpnDropdown && !!currentProductId
  );

  // UOM (Unit of Measure) - fetch all when UOM dropdown is open
  const { data: uomResults = [], isLoading: uomsLoading } = useProductUoms(
    undefined,
    isUomDropdown ?? false
  );

  // Update line item helper
  const updateLineItem = (id: string, updates: Partial<InvoiceLineItem>) => {
    if (onUpdateLineItem) {
      onUpdateLineItem(id, updates);
    }
  };

  // Handle cell click - open dropdown or start inline edit
  const handleCellClick = (itemId: string, column: EditableColumnKey, e: React.MouseEvent) => {
    if (!isEditable) return;

    // Read-only columns - custPartNumber and description are populated by product selection
    const readOnlyColumns: EditableColumnKey[] = ['custPartNumber', 'description'];
    if (readOnlyColumns.includes(column)) {
      return; // Do nothing for read-only columns
    }

    // Dropdown columns - partNumber and uom open portal dropdown
    const dropdownColumns: EditableColumnKey[] = ['partNumber', 'uom'];

    if (dropdownColumns.includes(column)) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownOpen({
        itemId,
        column,
        position: { top: rect.bottom + 4, left: rect.left },
      });
      setSearchQuery('');
    } else {
      // Inline edit for quantity, unitPrice, commissionPercent, divisor
      setEditingCell({ itemId, column });
    }
  };

  // Handle product selection - auto-fills Part#, Description, and fetches CPN
  // Also populates: unit price, qty (defaults to 1), commission %, sell total, commission $
  const handleProductSelect = async (itemId: string, product: any) => {
    const item = invoice.lineItems.find(li => li.id === itemId);
    if (!item) return;

    // Default quantity to 1 if not set (new line item scenario)
    const quantity = item.quantity > 0 ? item.quantity : 1;
    const divisor = product.defaultDivisor || item.divisor || 1;
    const unitPrice = product.unitPrice || 0;
    const commissionRate = product.defaultCommissionRate || 0.08;
    const extendedPrice = quantity * unitPrice / divisor;
    const commissionAmount = extendedPrice * commissionRate;

    // Close dropdown first
    setDropdownOpen(null);
    setSearchQuery('');

    // Fetch CPN for the sold-to customer
    let custPartNumber = '';
    const soldToCustomerId = invoice.customerId;
    if (soldToCustomerId && product.id) {
      try {
        const cpnResult = await getProductCpnByCustomer(product.id, soldToCustomerId);
        if (cpnResult?.customerPartNumber) {
          custPartNumber = cpnResult.customerPartNumber;
        }
      } catch (err) {
        // CPN not found is not an error - just leave it empty
      }
    }

    // Single atomic update with ALL product data including:
    // Part #, Description, CPN, Unit Price, Qty, Divisor, UOM,
    // Commission Rate, Sell Total, Commission Amount
    updateLineItem(itemId, {
      productId: product.id,
      partNumber: product.factoryPartNumber || '',
      description: product.description || '',
      custPartNumber: custPartNumber,
      // Pricing
      unitPrice: unitPrice,
      quantity: quantity,
      divisor: divisor,
      uom: product.defaultUom?.title || item.uom || null,
      uomId: product.defaultUom?.id || item.uomId || null,
      // Commission
      commissionRate: commissionRate,
      commissionPercent: commissionRate * 100, // For UI display (percentage format)
      // Calculated totals
      amount: extendedPrice, // Sell Total
      total: extendedPrice,  // Backup field
      commissionAmount: commissionAmount,
      commission: commissionAmount, // Backup field
    });
  };

  // Handle CPN selection from dropdown
  const handleCpnSelect = (itemId: string, cpn: any) => {
    updateLineItem(itemId, {
      custPartNumber: cpn.customerPartNumber,
    });
    setDropdownOpen(null);
    setSearchQuery('');
  };

  // Handle UOM selection
  const handleUomSelect = (itemId: string, uom: any) => {
    const item = invoice.lineItems.find(li => li.id === itemId);
    if (!item) return;

    const divisor = uom.divisionFactor || 1;
    const quantity = item.quantity || 1;
    const unitPrice = item.unitPrice || 0;
    const extendedPrice = quantity * unitPrice / divisor;
    const commissionRate = item.commissionRate ?? 0.08;

    updateLineItem(itemId, {
      uom: uom.title,
      divisor: divisor,
      amount: extendedPrice,
      commissionAmount: extendedPrice * commissionRate,
    });
    setDropdownOpen(null);
    setSearchQuery('');
  };

  // Handle adhoc part number entry (when product is not in database)
  const handleAdhocPartNumber = (itemId: string, partNumber: string) => {
    updateLineItem(itemId, {
      productId: undefined,
      partNumber: partNumber,
    });
    setDropdownOpen(null);
    setSearchQuery('');
  };

  // Handle cell value change for inline editing
  // Handle inline cell value change for quantity, unit price, commission %, divisor
  // Recalculates all dependent fields: sell total, commission amount, etc.
  const handleCellChange = (itemId: string, column: EditableColumnKey, value: string) => {
    const item = invoice.lineItems.find(li => li.id === itemId);
    if (!item) return;

    const updates: Partial<InvoiceLineItem> = {};

    switch (column) {
      case 'quantity': {
        const qty = parseInt(value) || 1;
        const divisor = item.divisor || 1;
        const extendedPrice = qty * item.unitPrice / divisor;
        const commissionAmount = extendedPrice * (item.commissionRate ?? 0.08);
        updates.quantity = qty;
        updates.amount = extendedPrice;
        updates.total = extendedPrice;
        updates.commissionAmount = commissionAmount;
        updates.commission = commissionAmount;
        break;
      }
      case 'unitPrice': {
        const price = parseFloat(value.replace(/[$,]/g, '')) || 0;
        const divisor = item.divisor || 1;
        const extendedPrice = item.quantity * price / divisor;
        const commissionAmount = extendedPrice * (item.commissionRate ?? 0.08);
        updates.unitPrice = price;
        updates.amount = extendedPrice;
        updates.total = extendedPrice;
        updates.commissionAmount = commissionAmount;
        updates.commission = commissionAmount;
        break;
      }
      case 'commissionPercent': {
        const pct = parseFloat(value) / 100 || 0;
        const commissionAmount = item.amount * pct;
        updates.commissionRate = pct;
        updates.commissionPercent = parseFloat(value) || 0;
        updates.commissionAmount = commissionAmount;
        updates.commission = commissionAmount;
        break;
      }
      case 'divisor': {
        const divisor = parseFloat(value) || 1;
        const extendedPrice = item.quantity * item.unitPrice / divisor;
        const commissionAmount = extendedPrice * (item.commissionRate ?? 0.08);
        updates.divisor = divisor;
        updates.amount = extendedPrice;
        updates.total = extendedPrice;
        updates.commissionAmount = commissionAmount;
        updates.commission = commissionAmount;
        break;
      }
    }

    updateLineItem(itemId, updates);
    setEditingCell(null);
  };

  // Render editable cell based on column type
  const renderEditableCell = (item: InvoiceLineItem, column: EditableColumnKey, align: 'left' | 'center' | 'right' = 'left') => {
    const isEditing = editingCell?.itemId === item.id && editingCell?.column === column;

    // Dropdown columns
    const dropdownColumns: EditableColumnKey[] = ['partNumber', 'uom'];
    const isDropdownColumn = dropdownColumns.includes(column);

    // Read-only display columns (populated when product is selected)
    const isReadOnlyDisplayColumn = ['custPartNumber', 'description'].includes(column);

    let displayValue = '';
    let editValue = '';

    switch (column) {
      case 'partNumber':
        displayValue = item.partNumber || 'Select...';
        break;
      case 'custPartNumber':
        displayValue = item.custPartNumber || '—';
        break;
      case 'description':
        displayValue = item.description || '—';
        break;
      case 'uom':
        displayValue = item.uom || '—';
        break;
      case 'divisor':
        displayValue = String(item.divisor || 1);
        editValue = String(item.divisor || 1);
        break;
      case 'quantity':
        displayValue = String(item.quantity || 0);
        editValue = String(item.quantity || 0);
        break;
      case 'unitPrice':
        displayValue = formatCurrency(item.unitPrice || 0);
        editValue = String(item.unitPrice || 0);
        break;
      case 'commissionPercent':
        displayValue = `${((item.commissionRate || 0) * 100).toFixed(1)}%`;
        editValue = ((item.commissionRate || 0) * 100).toFixed(1);
        break;
    }

    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

    // Read-only display columns (custPartNumber and description)
    if (isReadOnlyDisplayColumn) {
      return (
        <span className={`px-2 py-1 ${alignClass} ${!displayValue || displayValue === '—' ? 'text-gray-400' : ''}`}>
          {displayValue || '—'}
        </span>
      );
    }

    // Dropdown cells
    if (isDropdownColumn && isEditable) {
      const isEmpty = !item[column as keyof InvoiceLineItem] || item[column as keyof InvoiceLineItem] === 'Select...';
      return (
        <button
          onClick={(e) => handleCellClick(item.id, column, e)}
          className={`w-full ${alignClass} px-2 py-1 rounded hover:bg-gray-100 transition-colors flex items-center justify-between gap-1`}
        >
          <span className={`truncate ${isEmpty ? 'text-gray-400' : ''}`}>
            {displayValue}
          </span>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400 flex-shrink-0">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      );
    }

    // Editing state for inline editable fields
    if (isEditing && isEditable) {
      return (
        <input
          type="text"
          defaultValue={editValue}
          autoFocus
          onBlur={(e) => handleCellChange(item.id, column, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellChange(item.id, column, e.currentTarget.value);
            } else if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          className={`w-full px-2 py-1 ${alignClass} border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
      );
    }

    // Display state (clickable to edit for non-dropdown columns)
    if (isEditable && !isDropdownColumn && !isReadOnlyDisplayColumn) {
      return (
        <button
          onClick={(e) => handleCellClick(item.id, column, e)}
          className={`w-full px-2 py-1 ${alignClass} rounded hover:bg-gray-100 transition-colors ${
            column === 'commissionPercent' ? 'text-purple-600' : ''
          }`}
        >
          {displayValue}
        </button>
      );
    }

    // Non-editable display
    return (
      <span className={`px-2 py-1 ${alignClass} ${column === 'commissionPercent' ? 'text-purple-600' : ''}`}>
        {displayValue}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedLineItems.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedLineItems.size}
          onClearSelection={onClearSelection}
          onConvertToWarehouse={onConvertToWarehouse}
        />
      )}

      {/* Line Items Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <LineItemsTableHeader
            lineItems={invoice.lineItems}
            selectedLineItems={selectedLineItems}
            onToggleAllLineItems={onToggleAllLineItems}
            visibleColumns={visibleColumns}
            viewMode={viewMode}
          />

          <tbody>
            {/* Show "No line items" placeholder if invoice has no line items */}
            {invoice.lineItems.length === 0 ? (
              <tr className="border-b border-[var(--border)] bg-amber-50/50">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    disabled
                    className="accent-[var(--primary)] opacity-50"
                  />
                </td>
                <td colSpan={20} className="px-3 py-8 text-center">
                  <div className="text-amber-700">
                    <p className="font-medium mb-2">No line items</p>
                    <p className="text-sm">
                      {isEditable ? (
                        <>Click &quot;Add Line&quot; below or select an order to pre-populate line items</>
                      ) : (
                        <>This invoice has no line items</>
                      )}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              invoice.lineItems.map((item) => {
                const hasCredit = lineItemCredits[item.id];

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${
                      selectedLineItems.has(item.id) ? 'bg-[var(--primary)]/5' : ''
                    }`}
                  >
                    {/* Checkbox and indicators */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedLineItems.has(item.id)}
                          onChange={() => onToggleLineItemSelection(item.id)}
                          className="accent-[var(--primary)]"
                        />
                        {/* Document-specific product indicator */}
                        {item.isQuoteLevelProduct && (
                          <div className="relative group">
                            <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center cursor-help">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 18v-6M9 15l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[200px]">
                              <div className="font-semibold mb-1 text-purple-400">Document-Specific Product</div>
                              <p className="text-xs text-gray-400">Created specifically for this invoice</p>
                            </div>
                          </div>
                        )}
                        {/* Warehouse consignment indicator */}
                        {item.isWarehouseConsignment && (
                          <div className="relative group">
                            <div className="w-6 h-6 rounded bg-teal-500 flex items-center justify-center cursor-help">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
                                <path d="M3 21h18v-9l-9-7-9 7v9z" />
                                <path d="M9 21v-6h6v6" fill="rgb(20 184 166)" />
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
                        {/* Credit indicator */}
                        {hasCredit && (
                          <div className="relative group">
                            <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center cursor-help">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M8 12h8" />
                              </svg>
                            </div>
                            <div className="fixed transform -translate-y-full -mt-2 ml-8 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-[9999] pointer-events-none shadow-xl min-w-[220px]">
                              <div className="font-semibold mb-2 text-base text-red-400">Credit Applied</div>
                              <div className="space-y-1">
                                <div className="flex justify-between gap-4">
                                  <span className="text-gray-400">Type:</span>
                                  <span className="font-medium">{hasCredit.creditType}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-gray-400">Credit Qty:</span>
                                  <span className="font-medium text-red-400">-{hasCredit.creditQty}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Part Number - Dropdown */}
                    {visibleColumns.has('partNumber') && (
                      <td className="px-3 py-2 text-sm">
                        {renderEditableCell(item, 'partNumber', 'left')}
                      </td>
                    )}

                    {/* Customer Part Number - Read-only, populated by product selection */}
                    {visibleColumns.has('custPartNumber') && (
                      <td className="px-3 py-2 text-sm">
                        {renderEditableCell(item, 'custPartNumber', 'left')}
                      </td>
                    )}

                    {/* Description - Read-only, populated by product selection */}
                    {visibleColumns.has('description') && (
                      <td className="px-3 py-2 text-sm min-w-[250px] max-w-[400px]">
                        {renderEditableCell(item, 'description', 'left')}
                      </td>
                    )}

                    {/* UOM - Dropdown */}
                    {visibleColumns.has('uom') && (
                      <td className="px-3 py-2 text-sm">
                        {renderEditableCell(item, 'uom', 'center')}
                      </td>
                    )}

                    {/* Divisor - Inline Edit */}
                    {visibleColumns.has('divisor') && (
                      <td className="px-3 py-2 text-sm">
                        {renderEditableCell(item, 'divisor', 'center')}
                      </td>
                    )}

                    {/* Unit Price - Inline Edit */}
                    {visibleColumns.has('unitPrice') && (
                      <td className="px-3 py-2 text-sm">
                        {renderEditableCell(item, 'unitPrice', 'right')}
                      </td>
                    )}

                    {/* Quantity - Inline Edit */}
                    {visibleColumns.has('quantity') && (
                      <td className="px-3 py-2 text-sm">
                        {renderEditableCell(item, 'quantity', 'center')}
                      </td>
                    )}

                    {/* Sell Total */}
                    {visibleColumns.has('sellTotal') && (
                      <td className="px-3 py-2 text-sm text-right font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                    )}

                    {/* Commission % (simple view) - Inline Edit */}
                    {visibleColumns.has('commissionPercent') && viewMode === 'simple' && (
                      <td className="px-3 py-2 text-sm">
                        {renderEditableCell(item, 'commissionPercent', 'right')}
                      </td>
                    )}

                    {/* Commission */}
                    {visibleColumns.has('commission') && (
                      <td className="px-3 py-2 text-sm text-right text-purple-600">
                        {formatCurrency(item.commissionAmount || item.amount * (item.commissionRate ?? 0.08))}
                      </td>
                    )}

                    {/* Commission Total */}
                    {visibleColumns.has('commissionTotal') && (
                      <td className="px-3 py-2 text-sm text-right text-purple-600 font-medium">
                        {formatCurrency(item.commissionAmount || item.amount * (item.commissionRate ?? 0.08))}
                      </td>
                    )}

                    {/* % Over */}
                    {visibleColumns.has('percentOver') && (
                      <td className="px-3 py-2 text-sm text-right">15.0%</td>
                    )}

                    {/* Commission % (overage view) - Inline Edit */}
                    {visibleColumns.has('commissionPercent') && viewMode === 'overage' && (
                      <td className="px-3 py-2 text-sm">
                        {renderEditableCell(item, 'commissionPercent', 'right')}
                      </td>
                    )}

                    {/* Commission Amount */}
                    {visibleColumns.has('commissionAmount') && (
                      <td className="px-3 py-2 text-sm text-right text-purple-600">
                        {formatCurrency(item.commissionAmount || item.amount * (item.commissionRate ?? 0.08))}
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
                      <td className="px-3 py-2 text-sm text-right text-green-600">20.8%</td>
                    )}

                    {/* Earn $ */}
                    {visibleColumns.has('earnAmount') && (
                      <td className="px-3 py-2 text-sm text-right text-green-600 font-medium">
                        {formatCurrency(
                          (item.commissionAmount || item.amount * (item.commissionRate ?? 0.08)) +
                          item.unitPrice * 0.15 * item.quantity * 0.85
                        )}
                      </td>
                    )}

                    {/* Linked Order */}
                    {visibleColumns.has('linkedOrder') && (
                      <td className="px-3 py-2 text-sm text-left min-w-[120px]">
                        {item.orderLineItemId ? (
                          <button
                            onClick={() => {
                              // Find the linked order from the invoice
                              const linkedOrder = mockOrders.find(o =>
                                o.lineItems?.some(li => li.id === item.orderLineItemId)
                              );
                              if (linkedOrder) {
                                window.location.href = `/orders/${linkedOrder.id}`;
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer whitespace-nowrap"
                          >
                            View Order
                          </button>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">-</span>
                        )}
                      </td>
                    )}

                    {/* Linked Check */}
                    {visibleColumns.has('linkedCheck') && (
                      <td className="px-3 py-2 text-sm text-left min-w-[120px]">
                        <span className="text-[var(--muted-foreground)]">-</span>
                      </td>
                    )}

                    {/* Actions - 3 dots menu */}
                    <td className="px-2 py-2 w-10">
                      <button
                        onClick={() => onOpenAdditionalDetails?.(item)}
                        className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                        title="Additional Details"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Add Line Button */}
        {isEditable && (
          <div className="border-t border-[var(--border)]">
            <button
              onClick={onAddLine}
              className="w-full px-4 py-3 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 6v8M6 10h8" strokeLinecap="round" />
              </svg>
              Add Line
            </button>
          </div>
        )}
      </div>

      {/* Dropdown Portal for Search */}
      {isMounted && dropdownOpen &&
        createPortal(
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => { setDropdownOpen(null); setSearchQuery(''); }} />

            {/* Dropdown Container */}
            <div
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80"
              style={{
                // Check if dropdown would overflow bottom of screen, if so flip it above
                top: dropdownOpen.position.top + 250 > window.innerHeight
                  ? dropdownOpen.position.top - 258
                  : dropdownOpen.position.top,
                left: Math.min(dropdownOpen.position.left, window.innerWidth - 330),
              }}
            >
              {/* Search Input */}
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isProductDropdown ? "Type to search..." :
                    isCpnDropdown ? "Customer part numbers..." :
                    isUomDropdown ? "Search UOMs..." : "Search..."
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                {isProductDropdown && (
                  <div className="mt-1 text-xs text-gray-400">
                    Searches: Part #, Customer Part #, Description
                  </div>
                )}
              </div>

              {/* Results Container */}
              <div className="max-h-48 overflow-y-auto">
                {/* Product results */}
                {isProductDropdown && productsLoading && (
                  <div className="px-3 py-4 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" />
                  </div>
                )}
                {isProductDropdown && !productsLoading && productResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(dropdownOpen.itemId, product)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-mono text-sm font-medium">{product.factoryPartNumber}</div>
                    <div className="text-xs text-gray-500 truncate">{product.description}</div>
                  </button>
                ))}
                {isProductDropdown && !productsLoading && productResults.length === 0 && debouncedSearch && (
                  <div className="px-3 py-2 text-sm text-gray-500">No products found</div>
                )}
                {isProductDropdown && !productsLoading && productResults.length === 0 && !debouncedSearch && (
                  <div className="px-3 py-2 text-sm text-gray-400">Start typing to search products...</div>
                )}

                {/* CPN (Customer Part Number) results */}
                {isCpnDropdown && cpnsLoading && (
                  <div className="px-3 py-4 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" />
                  </div>
                )}
                {isCpnDropdown && !cpnsLoading && !currentProductId && (
                  <div className="px-3 py-2 text-sm text-amber-600">Select a product first to view CPNs</div>
                )}
                {isCpnDropdown && !cpnsLoading && currentProductId && cpnResults.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">No CPNs found for this product</div>
                )}
                {isCpnDropdown && !cpnsLoading && cpnResults.map((cpn) => (
                  <button
                    key={cpn.id}
                    onClick={() => handleCpnSelect(dropdownOpen.itemId, cpn)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    {cpn.customerPartNumber}
                  </button>
                ))}

                {/* UOM (Unit of Measure) results */}
                {isUomDropdown && uomsLoading && (
                  <div className="px-3 py-4 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" />
                  </div>
                )}
                {isUomDropdown && !uomsLoading && (
                  <>
                    {uomResults
                      .filter(uom =>
                        !searchQuery.trim() ||
                        (uom.title && uom.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (uom.description && uom.description.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((uom) => (
                        <button
                          key={uom.id}
                          onClick={() => handleUomSelect(dropdownOpen.itemId, uom)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <div className="text-sm font-medium">{uom.title}</div>
                          {uom.description && (
                            <div className="text-xs text-gray-500">{uom.description}</div>
                          )}
                          {uom.divisionFactor && uom.divisionFactor !== 1 && (
                            <div className="text-xs text-gray-400">Divisor: {uom.divisionFactor}</div>
                          )}
                        </button>
                      ))}
                    {uomResults.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No UOMs found</div>
                    )}
                  </>
                )}
              </div>

              {/* Adhoc option for product columns */}
              {isProductDropdown && searchQuery.trim() && (
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => handleAdhocPartNumber(dropdownOpen.itemId, searchQuery.trim())}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                      <path d="M10 5v10M5 10h10" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm text-indigo-600">Use &quot;{searchQuery.trim()}&quot;</span>
                  </button>
                </div>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
