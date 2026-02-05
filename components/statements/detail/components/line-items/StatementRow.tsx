/**
 * StatementRow Components
 * Memoized row, virtualized wrapper, table header, and shared types for LineItemsTable
 */

'use client';

import React, { memo, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { type RowComponentProps } from 'react-window';
import Link from 'next/link';
import type { LocalLineItem, ColumnKey, CommissionSplitRep } from '../../hooks/useStatementDetailState';

// ============================================================================
// Shared types & constants
// ============================================================================

export type EditableColumnKey = 'partNumber' | 'description' | 'soldTo' | 'endUser' | 'uom' | 'divisor' | 'quantity' | 'unitPrice' | 'commissionRate';

export interface PricingOptions {
  productPrice: number | null;
  cpnPrice: number | null;
  cpnCommissionRate: number | null;
  tiers: Array<{ quantityLow: number; quantityHigh: number; unitPrice: number | string }>;
}

export interface RowDataProps {
  lineItems: LocalLineItem[];
  selectedLineItems: Set<string>;
  visibleColumns: Set<ColumnKey>;
  editingCell: { tempId: string; column: EditableColumnKey } | null;
  pricingDropdownOpen: { tempId: string; position: { top: number; left: number } } | null;
  productPricingOptions: Record<string, PricingOptions>;
  lineItemPricingSource: Record<string, string>;
  onToggleSelection: (tempId: string) => void;
  onCellClick: (tempId: string, column: EditableColumnKey, e: React.MouseEvent) => void;
  onCellChange: (tempId: string, column: EditableColumnKey, value: string) => void;
  onSetEditingCell: (cell: { tempId: string; column: EditableColumnKey } | null) => void;
  onPricingDropdownToggle: (tempId: string, e: React.MouseEvent) => void;
  onPricingSourceSelect: (tempId: string, source: string, price: number, commissionRate?: number) => void;
  onRemoveLineItem: (tempId: string) => void;
  onOpenAdditionalDetails?: (item: LocalLineItem) => void;
}

export const ROW_HEIGHT = 44;
export const VIRTUALIZATION_THRESHOLD = 100;
export const PRICING_FETCH_BATCH_SIZE = 20;
export const PRICING_FETCH_DELAY = 50;

// Cached formatter
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});
export const formatCurrency = (value: number) => currencyFormatter.format(value);

// ============================================================================
// Shared column width definitions — used by both TableHeader and StatementRowInner
// ============================================================================
export const COL = {
  checkbox:       'w-10 flex-shrink-0',
  lineNumber:     'w-12 flex-shrink-0',
  partNumber:     'w-[120px] flex-shrink-0',
  custPartNumber: 'w-[80px] flex-shrink-0',
  description:    'flex-1 min-w-[140px]',
  soldTo:         'flex-1 min-w-[130px]',
  endUser:        'flex-1 min-w-[130px]',
  quantity:       'w-16 flex-shrink-0',
  uom:            'w-16 flex-shrink-0',
  divisor:        'w-16 flex-shrink-0',
  unitPrice:      'w-[150px] flex-shrink-0 overflow-hidden',
  extendedPrice:  'w-[100px] flex-shrink-0',
  commissionRate: 'w-[70px] flex-shrink-0',
  commission:     'w-[100px] flex-shrink-0',
  outsideRep:     'w-[110px] flex-shrink-0',
  order:          'w-[80px] flex-shrink-0',
  invoice:        'w-[80px] flex-shrink-0',
  note:           'w-[110px] flex-shrink-0',
  actions:        'w-16 flex-shrink-0',
} as const;

export const isNanString = (value: string | undefined | null): boolean => {
  if (!value) return true;
  const lower = value.trim().toLowerCase();
  return lower === 'nan' || lower === 'none' || lower === 'null';
};

// ============================================================================
// Memoized Row Component
// ============================================================================
export const StatementRowInner = memo(function StatementRowInner({
  item,
  isSelected,
  visibleColumns,
  editingCell,
  pricingDropdownOpen,
  productPricingOptions,
  lineItemPricingSource,
  onToggleSelection,
  onCellClick,
  onCellChange,
  onSetEditingCell,
  onPricingDropdownToggle,
  onPricingSourceSelect,
  onRemoveLineItem,
  onOpenAdditionalDetails,
  style,
}: {
  item: LocalLineItem;
  isSelected: boolean;
  visibleColumns: Set<ColumnKey>;
  editingCell: { tempId: string; column: EditableColumnKey } | null;
  pricingDropdownOpen: { tempId: string; position: { top: number; left: number } } | null;
  productPricingOptions: Record<string, PricingOptions>;
  lineItemPricingSource: Record<string, string>;
  onToggleSelection: (tempId: string) => void;
  onCellClick: (tempId: string, column: EditableColumnKey, e: React.MouseEvent) => void;
  onCellChange: (tempId: string, column: EditableColumnKey, value: string) => void;
  onSetEditingCell: (cell: { tempId: string; column: EditableColumnKey } | null) => void;
  onPricingDropdownToggle: (tempId: string, e: React.MouseEvent) => void;
  onPricingSourceSelect: (tempId: string, source: string, price: number, commissionRate?: number) => void;
  onRemoveLineItem: (tempId: string) => void;
  onOpenAdditionalDetails?: (item: LocalLineItem) => void;
  style?: React.CSSProperties;
}) {
  const renderCell = (column: EditableColumnKey, align: 'left' | 'center' | 'right' = 'left') => {
    const isEditing = editingCell?.tempId === item.tempId && editingCell?.column === column;
    const dropdownColumns: EditableColumnKey[] = ['partNumber', 'soldTo', 'endUser', 'uom'];
    const isDropdownColumn = dropdownColumns.includes(column);
    const isReadOnlyDisplay = column === 'description';

    let displayValue = '';
    let editValue = '';

    switch (column) {
      case 'partNumber':
        displayValue = isNanString(item.partNumber) ? 'Select...' : item.partNumber;
        break;
      case 'description':
        displayValue = isNanString(item.description) ? '—' : item.description;
        break;
      case 'soldTo':
        displayValue = item.soldToCustomerName || 'Select...';
        break;
      case 'endUser':
        displayValue = item.endUserName || 'Select...';
        break;
      case 'uom':
        displayValue = item.uom || 'Select...';
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
      case 'commissionRate':
        displayValue = `${(item.commissionRate || 0).toFixed(1)}%`;
        editValue = String(item.commissionRate || 0);
        break;
    }

    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

    if (isReadOnlyDisplay) {
      return (
        <span className={`px-2 py-1 ${alignClass} ${!displayValue || displayValue === '—' ? 'text-gray-400' : ''} truncate block`}>
          {displayValue}
        </span>
      );
    }

    if (isDropdownColumn) {
      const isEmpty = column === 'partNumber' ? isNanString(item.partNumber) :
                      column === 'soldTo' ? !item.soldToCustomerName :
                      column === 'endUser' ? !item.endUserName :
                      !item.uom;
      return (
        <button
          onClick={(e) => onCellClick(item.tempId, column, e)}
          className={`w-full ${alignClass} px-2 py-1 rounded hover:bg-gray-100 transition-colors flex items-center justify-between gap-1`}
        >
          <span className={`truncate ${isEmpty ? 'text-gray-400' : ''}`}>{displayValue}</span>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400 flex-shrink-0">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      );
    }

    if (isEditing) {
      return (
        <input
          type="text"
          defaultValue={editValue}
          autoFocus
          onBlur={(e) => onCellChange(item.tempId, column, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCellChange(item.tempId, column, e.currentTarget.value);
            else if (e.key === 'Escape') onSetEditingCell(null);
          }}
          className={`w-full px-2 py-1 ${alignClass} border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
      );
    }

    // Unit price with pricing source indicator
    if (column === 'unitPrice') {
      const options = item.productId ? productPricingOptions[item.productId] : null;
      const pricingSource = lineItemPricingSource[item.tempId] || item.pricingSource || 'product';

      let tagLabel = '';
      let tagColor = '';
      if (pricingSource === 'cpn') { tagLabel = 'CPN'; tagColor = 'bg-blue-100 text-blue-700'; }
      else if (pricingSource === 'manual') { tagLabel = 'Manual'; tagColor = 'bg-gray-100 text-gray-600'; }
      else if (pricingSource.startsWith('tier:')) { tagLabel = `Qty ${pricingSource.replace('tier:', '')}`; tagColor = 'bg-green-100 text-green-700'; }
      else { tagLabel = 'Product'; tagColor = 'bg-purple-100 text-purple-700'; }

      const isDropdownOpenForThis = pricingDropdownOpen?.tempId === item.tempId;

      return (
        <div className="relative overflow-hidden">
          <div className="flex items-center justify-end gap-1">
            <button onClick={(e) => onCellClick(item.tempId, column, e)} className="px-2 py-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0">{displayValue}</button>
            <button
              onClick={(e) => onPricingDropdownToggle(item.tempId, e)}
              className={`text-[10px] px-1 py-0.5 rounded font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-0.5 truncate max-w-[60px] flex-shrink ${tagColor}`}
              title={tagLabel}
            >
              <span className="truncate">{tagLabel}</span>
              <svg width="8" height="8" viewBox="0 0 20 20" fill="currentColor" className="flex-shrink-0">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          {isDropdownOpenForThis && createPortal(
            <div
              className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
              style={{ top: pricingDropdownOpen.position.top, left: pricingDropdownOpen.position.left }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {options && options.productPrice !== null && (
                <button onClick={() => onPricingSourceSelect(item.tempId, 'product', options.productPrice!, item.commissionRate)} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${pricingSource === 'product' ? 'bg-purple-50' : ''}`}>
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Product</span>
                  <span className="text-gray-500">${options.productPrice!.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                </button>
              )}
              {options && options.cpnPrice !== null && (
                <button onClick={() => onPricingSourceSelect(item.tempId, 'cpn', options.cpnPrice!, options.cpnCommissionRate ?? item.commissionRate)} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${pricingSource === 'cpn' ? 'bg-blue-50' : ''}`}>
                  <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>CPN</span>
                  <span className="text-gray-500">${options.cpnPrice!.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                </button>
              )}
              {options?.tiers && options.tiers.length > 0 && (
                <>
                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="px-3 py-1 text-xs text-gray-400 font-medium">Volume Pricing</div>
                  {options.tiers.map((tier) => {
                    const tierSource = `tier:${tier.quantityLow}-${tier.quantityHigh}`;
                    const tierPrice = typeof tier.unitPrice === 'string' ? parseFloat(tier.unitPrice) : tier.unitPrice;
                    return (
                      <button key={tierSource} onClick={() => onPricingSourceSelect(item.tempId, tierSource, tierPrice, item.commissionRate)} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${pricingSource === tierSource ? 'bg-green-50' : ''}`}>
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>Qty {tier.quantityLow}-{tier.quantityHigh}</span>
                        <span className="text-gray-500">${tierPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                      </button>
                    );
                  })}
                </>
              )}
              <div className="border-t border-gray-100 my-1"></div>
              <div className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between ${pricingSource === 'manual' ? 'bg-gray-50' : ''}`}>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400"></span>Manual</span>
                <span className="text-xs text-gray-400">Edit price above</span>
              </div>
            </div>,
            document.body
          )}
        </div>
      );
    }

    return (
      <button
        onClick={(e) => onCellClick(item.tempId, column, e)}
        className={`w-full px-2 py-1 ${alignClass} rounded hover:bg-gray-100 transition-colors ${column === 'commissionRate' ? 'text-purple-600' : ''}`}
      >
        {displayValue}
      </button>
    );
  };

  return (
    <div
      style={style}
      className={`flex items-center border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${isSelected ? 'bg-[var(--primary)]/5' : ''}`}
    >
      <div className={`${COL.checkbox} px-3 py-2`}>
        <input type="checkbox" checked={isSelected} onChange={() => onToggleSelection(item.tempId)} className="accent-[var(--primary)]" />
      </div>
      {visibleColumns.has('lineNumber') && <div className={`${COL.lineNumber} px-3 py-2 text-sm text-[var(--muted-foreground)]`}>{item.itemNumber}</div>}
      {visibleColumns.has('partNumber') && <div className={`${COL.partNumber} px-3 py-2 text-sm`}>{renderCell('partNumber', 'left')}</div>}
      {visibleColumns.has('custPartNumber') && (
        <div className={`${COL.custPartNumber} px-3 py-2 text-sm`}>
          <span className={`px-2 py-1 truncate block ${!item.custPartNumber ? 'text-gray-400' : ''}`}>{item.custPartNumber || '—'}</span>
        </div>
      )}
      {visibleColumns.has('description') && <div className={`${COL.description} px-3 py-2 text-sm overflow-hidden`}>{renderCell('description', 'left')}</div>}
      {visibleColumns.has('soldTo') && <div className={`${COL.soldTo} px-3 py-2 text-sm overflow-hidden`}>{renderCell('soldTo', 'left')}</div>}
      {visibleColumns.has('endUser') && <div className={`${COL.endUser} px-3 py-2 text-sm overflow-hidden`}>{renderCell('endUser', 'left')}</div>}
      {visibleColumns.has('quantity') && <div className={`${COL.quantity} px-3 py-2 text-sm`}>{renderCell('quantity', 'center')}</div>}
      {visibleColumns.has('uom') && <div className={`${COL.uom} px-3 py-2 text-sm`}>{renderCell('uom', 'center')}</div>}
      {visibleColumns.has('divisor') && <div className={`${COL.divisor} px-3 py-2 text-sm`}>{renderCell('divisor', 'center')}</div>}
      {visibleColumns.has('unitPrice') && <div className={`${COL.unitPrice} px-3 py-2 text-sm`}>{renderCell('unitPrice', 'right')}</div>}
      {visibleColumns.has('extendedPrice') && <div className={`${COL.extendedPrice} px-3 py-2 text-sm text-right font-medium`}>{formatCurrency(item.extendedPrice || 0)}</div>}
      {visibleColumns.has('commissionRate') && <div className={`${COL.commissionRate} px-3 py-2 text-sm`}>{renderCell('commissionRate', 'right')}</div>}
      {visibleColumns.has('commission') && <div className={`${COL.commission} px-3 py-2 text-sm text-right font-medium text-purple-600`}>{formatCurrency(item.commission || 0)}</div>}
      {visibleColumns.has('outsideRep') && (
        <div className={`${COL.outsideRep} px-3 py-2 text-sm overflow-hidden`}>
          {item.outsideSplitRates && item.outsideSplitRates.length > 0 ? (
            <span className="text-gray-700 truncate block">{item.outsideSplitRates.map((r: CommissionSplitRep) => r.userName).join(', ')}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )}
      {visibleColumns.has('order') && (
        <div className={`${COL.order} px-3 py-2 text-sm`}>
          {item.orderId ? (
            <Link href={`/orders/${item.orderId}`} className="text-blue-600 hover:text-blue-800 hover:underline truncate block" onClick={(e) => e.stopPropagation()}>
              {item.orderNumber || item.orderId.substring(0, 8)}
            </Link>
          ) : (<span className="text-gray-400">-</span>)}
        </div>
      )}
      {visibleColumns.has('invoice') && (
        <div className={`${COL.invoice} px-3 py-2 text-sm`}>
          {item.invoiceId ? (
            <Link href={`/invoices/${item.invoiceId}`} className="text-blue-600 hover:text-blue-800 hover:underline truncate block" onClick={(e) => e.stopPropagation()}>
              {item.invoiceNumber || item.invoiceId.substring(0, 8)}
            </Link>
          ) : (<span className="text-gray-400">-</span>)}
        </div>
      )}
      {visibleColumns.has('note') && (
        <div className={`${COL.note} px-3 py-2 text-sm overflow-hidden`}>
          {item.note ? (<span className="truncate block" title={item.note}>{item.note}</span>) : (<span className="text-gray-400">-</span>)}
        </div>
      )}
      <div className={`${COL.actions} px-2 py-2`}>
        <div className="flex items-center gap-1">
          <button onClick={() => onRemoveLineItem(item.tempId)} className="p-1 hover:bg-red-100 rounded transition-colors group" title="Remove line item">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 group-hover:text-red-500">
              <path d="M6 6l8 8M6 14l8-8" strokeLinecap="round" />
            </svg>
          </button>
          <button onClick={() => onOpenAdditionalDetails?.(item)} className="p-1 hover:bg-[var(--muted)] rounded transition-colors" title="More options">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Virtualized row wrapper for react-window v2
// ============================================================================
export function VirtualizedRowComponent({
  index, style, lineItems, selectedLineItems, visibleColumns,
  editingCell, pricingDropdownOpen, productPricingOptions, lineItemPricingSource,
  onToggleSelection, onCellClick, onCellChange, onSetEditingCell,
  onPricingDropdownToggle, onPricingSourceSelect, onRemoveLineItem, onOpenAdditionalDetails,
}: RowComponentProps<RowDataProps>): ReactElement {
  const item = lineItems[index];
  if (!item) return <div style={style} />;

  return (
    <StatementRowInner
      item={item}
      isSelected={selectedLineItems.has(item.tempId)}
      visibleColumns={visibleColumns}
      editingCell={editingCell}
      pricingDropdownOpen={pricingDropdownOpen}
      productPricingOptions={productPricingOptions}
      lineItemPricingSource={lineItemPricingSource}
      onToggleSelection={onToggleSelection}
      onCellClick={onCellClick}
      onCellChange={onCellChange}
      onSetEditingCell={onSetEditingCell}
      onPricingDropdownToggle={onPricingDropdownToggle}
      onPricingSourceSelect={onPricingSourceSelect}
      onRemoveLineItem={onRemoveLineItem}
      onOpenAdditionalDetails={onOpenAdditionalDetails}
      style={style}
    />
  );
}

// ============================================================================
// Table header
// ============================================================================
export const TableHeader = memo(function TableHeader({
  visibleColumns, selectedLineItems, lineItemCount, onToggleAllSelection,
}: {
  visibleColumns: Set<ColumnKey>;
  selectedLineItems: Set<string>;
  lineItemCount: number;
  onToggleAllSelection: () => void;
}) {
  return (
    <div className="flex items-center border-b border-[var(--border)] bg-[var(--muted)]/50">
      <div className={`${COL.checkbox} px-3 py-3`}>
        <input type="checkbox" checked={selectedLineItems.size === lineItemCount && lineItemCount > 0} onChange={onToggleAllSelection} className="accent-[var(--primary)]" />
      </div>
      {visibleColumns.has('lineNumber') && <div className={`${COL.lineNumber} px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>#</div>}
      {visibleColumns.has('partNumber') && <div className={`${COL.partNumber} px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Part #</div>}
      {visibleColumns.has('custPartNumber') && <div className={`${COL.custPartNumber} px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>CPN</div>}
      {visibleColumns.has('description') && <div className={`${COL.description} px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Description</div>}
      {visibleColumns.has('soldTo') && <div className={`${COL.soldTo} px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Sold To</div>}
      {visibleColumns.has('endUser') && <div className={`${COL.endUser} px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>End User</div>}
      {visibleColumns.has('quantity') && <div className={`${COL.quantity} px-3 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Qty</div>}
      {visibleColumns.has('uom') && <div className={`${COL.uom} px-3 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>UOM</div>}
      {visibleColumns.has('divisor') && <div className={`${COL.divisor} px-3 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Divisor</div>}
      {visibleColumns.has('unitPrice') && <div className={`${COL.unitPrice} px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Unit Price</div>}
      {visibleColumns.has('extendedPrice') && <div className={`${COL.extendedPrice} px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Ext. Price</div>}
      {visibleColumns.has('commissionRate') && <div className={`${COL.commissionRate} px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Comm %</div>}
      {visibleColumns.has('commission') && <div className={`${COL.commission} px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Commission</div>}
      {visibleColumns.has('outsideRep') && <div className={`${COL.outsideRep} px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Outside Rep</div>}
      {visibleColumns.has('order') && <div className={`${COL.order} px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Order</div>}
      {visibleColumns.has('invoice') && <div className={`${COL.invoice} px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Invoice</div>}
      {visibleColumns.has('note') && <div className={`${COL.note} px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider`}>Note</div>}
      <div className={`${COL.actions} px-2 py-3`}></div>
    </div>
  );
});
