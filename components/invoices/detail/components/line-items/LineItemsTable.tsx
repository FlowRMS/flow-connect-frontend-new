/**
 * LineItemsTable Component
 * Main line items table with all columns, rows, and bulk actions
 * Supports editable cells, add line functionality, and additional details modal
 */

'use client';

import React, { useState, useMemo } from 'react';
import type { Order } from '@/lib/types/rms';
import type { ColumnKey, ViewMode, LineItemCredit, InvoiceLineItem, EditableInvoice } from '../../types';
import { BulkActionsBar } from './BulkActionsBar';
import { LineItemsTableHeader } from './LineItemsTableHeader';
import { LineItemsTableRow } from './LineItemsTableRow';
import { formatCurrency } from '../../utils';
import { SearchableDropdownV2 } from '@/components/quotes-v2/components/SearchableDropdownV2';
import { useProductSearch } from '@/components/orders/api';

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
  // Editing state for inline editing
  const [editingCell, setEditingCell] = useState<{ rowId: string; column: ColumnKey } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Product search state
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSearchEnabled, setProductSearchEnabled] = useState(false);
  const { data: productResults, isLoading: isProductSearchLoading } = useProductSearch(
    productSearchTerm,
    factoryId || undefined,
    productSearchEnabled
  );

  const productOptions = useMemo(() => {
    return (productResults || []).map(p => ({
      id: p.id,
      label: p.factoryPartNumber || p.description || 'Unknown',
      sublabel: p.description,
      data: p,
    }));
  }, [productResults]);

  // Handle start editing
  const handleStartEdit = (rowId: string, column: ColumnKey, currentValue: string) => {
    if (!isEditable) return;
    setEditingCell({ rowId, column });
    setEditValue(currentValue);
  };

  // Handle finish editing
  const handleFinishEdit = (save: boolean = true) => {
    if (!editingCell) return;

    if (save && onUpdateLineItem) {
      const { rowId, column } = editingCell;
      let updates: Partial<InvoiceLineItem> = {};

      switch (column) {
        case 'partNumber':
          updates.partNumber = editValue;
          break;
        case 'description':
          updates.description = editValue;
          break;
        case 'quantity':
          updates.quantity = parseFloat(editValue) || 0;
          break;
        case 'unitPrice':
          updates.unitPrice = parseFloat(editValue) || 0;
          break;
        case 'commissionPercent':
          updates.commissionPercent = parseFloat(editValue) || 0;
          break;
        case 'divisor':
          updates.divisor = parseFloat(editValue) || 1;
          break;
      }

      onUpdateLineItem(rowId, updates);
    }

    setEditingCell(null);
    setEditValue('');
  };

  // Handle key down in edit mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit(true);
    } else if (e.key === 'Escape') {
      handleFinishEdit(false);
    }
  };

  // Handle product selection
  const handleProductSelect = (lineItemId: string, productId: string, product: any) => {
    if (onUpdateLineItem) {
      onUpdateLineItem(lineItemId, {
        productId,
        partNumber: product.factoryPartNumber || '',
        description: product.description || '',
        unitPrice: product.unitPrice || 0,
        commissionPercent: product.defaultCommissionRate || 0,
        divisor: product.defaultDivisor || 1,
      });
    }
    setProductSearchEnabled(false);
  };

  // Calculate line totals
  const calculateLineTotal = (quantity: number, unitPrice: number, divisor: number = 1): number => {
    return quantity * unitPrice / (divisor || 1);
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
                        <>Click "Add Line" below or select an order to pre-populate line items</>
                      ) : (
                        <>This invoice has no line items</>
                      )}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              invoice.lineItems.map((item, index) => (
                <LineItemsTableRow
                  key={item.id}
                  item={item}
                  invoice={invoice}
                  isSelected={selectedLineItems.has(item.id)}
                  onToggleSelection={onToggleLineItemSelection}
                  visibleColumns={visibleColumns}
                  viewMode={viewMode}
                  lineItemCredits={lineItemCredits}
                  onShowOrderTooltip={onShowOrderTooltip}
                  mockOrders={mockOrders}
                  mockChecks={mockChecks}
                  // Editing props
                  editingCell={editingCell}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onEditValueChange={setEditValue}
                  onFinishEdit={handleFinishEdit}
                  onKeyDown={handleKeyDown}
                  isEditable={isEditable}
                  // Product search props
                  productSearchTerm={productSearchTerm}
                  setProductSearchTerm={setProductSearchTerm}
                  setProductSearchEnabled={setProductSearchEnabled}
                  productOptions={productOptions}
                  isProductSearchLoading={isProductSearchLoading}
                  onProductSelect={handleProductSelect}
                  // Actions
                  onOpenAdditionalDetails={onOpenAdditionalDetails}
                  onDeleteLineItem={onDeleteLineItem}
                />
              ))
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
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 6v8M6 10h8" strokeLinecap="round" />
              </svg>
              Add Line
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
