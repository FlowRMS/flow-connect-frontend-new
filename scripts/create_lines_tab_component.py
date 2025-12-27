#!/usr/bin/env python3
"""Create LinesTab component from extracted content"""

# Read the extracted content
extracted_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\quotes\tabs\LinesTab_extracted.txt"
with open(extracted_path, 'r', encoding='utf-8') as f:
    extracted_content = f.read()

# The extracted content starts with "{detailTab === 'lines' && ("
# We need to get the inner content (everything inside the conditional)
lines = extracted_content.split('\n')

# Skip the first line "{detailTab === 'lines' && (" and the last line ")}"
# and unindent the content
inner_lines = []
for line in lines[1:-1]:  # Skip first and last
    # Remove 14 spaces of indentation (the original indentation level)
    if line.startswith('              '):
        inner_lines.append(line[14:])
    elif line.startswith('            '):
        inner_lines.append(line[12:])
    else:
        inner_lines.append(line)

inner_content = '\n'.join(inner_lines)

# Create the component wrapper
component_header = '''\'use client\';

import React from 'react';
import { createPortal } from 'react-dom';
import type { Quote, LineItem, Section, Recipient, SavedView } from '../types';
import type { ColumnKey } from '../hooks';
import { columnDefinitions } from '../hooks';
import { priceLevelColors } from '../config';
import { availableOutsideReps, availableInsideReps, availableEndUsers, availableManufacturers } from '../data';
import { Sparkline, LineApprovalIcon } from '../components';
import { SetOverageModal } from '../modals/SetOverageModal';
import { SetMinOverageModal } from '../modals/SetMinOverageModal';
import { AutoCalcOverageModal } from '../modals/AutoCalcOverageModal';
import { SetEndUserModal } from '../modals/SetEndUserModal';
import { CopyPriceModal } from '../modals/CopyPriceModal';
import { PriceLookupModal } from '../modals/PriceLookupModal';
import { SaveViewModal } from '../modals/SaveViewModal';
import { RepSplitModal } from '../modals/RepSplitModal';

interface LinesTabProps {
  selectedQuote: Quote;
  quoteLineItems: LineItem[];
  setQuoteLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  quoteSections: Section[];
  setQuoteSections: React.Dispatch<React.SetStateAction<Section[]>>;
  totals: { baseTotal: number; sellTotal: number; commission: number; overage: number; l1Total: number; l2Total: number; l3Total: number };

  // View mode
  quoteViewMode: 'overage' | 'simple';
  setQuoteViewMode: (mode: 'overage' | 'simple') => void;
  showViewModeDropdown: boolean;
  setShowViewModeDropdown: (show: boolean) => void;

  // Columns
  visibleColumns: Set<ColumnKey>;
  setVisibleColumns: React.Dispatch<React.SetStateAction<Set<ColumnKey>>>;
  simpleViewColumns: Set<ColumnKey>;
  setSimpleViewColumns: React.Dispatch<React.SetStateAction<Set<ColumnKey>>>;
  effectiveVisibleColumns: Set<ColumnKey>;
  columnOrder: ColumnKey[];
  setColumnOrder: React.Dispatch<React.SetStateAction<ColumnKey[]>>;
  draggingColumn: ColumnKey | null;
  setDraggingColumn: React.Dispatch<React.SetStateAction<ColumnKey | null>>;
  toggleColumn: (col: ColumnKey) => void;
  handleColumnDragStart: (e: React.DragEvent, col: ColumnKey) => void;
  handleColumnDragOver: (e: React.DragEvent, targetCol: ColumnKey) => void;
  handleColumnDragEnd: () => void;
  getOrderedVisibleColumns: () => ColumnKey[];
  getColumnOrder: (colKey: ColumnKey) => number;

  // Views
  savedViews: SavedView[];
  setSavedViews: React.Dispatch<React.SetStateAction<SavedView[]>>;
  activeView: string;
  setActiveView: (view: string) => void;
  showSaveViewModal: boolean;
  setShowSaveViewModal: (show: boolean) => void;
  newViewName: string;
  setNewViewName: (name: string) => void;
  applyView: (viewId: string) => void;
  saveCurrentView: () => void;
  deleteView: (viewId: string) => void;
  showViewsMenu: boolean;
  setShowViewsMenu: (show: boolean) => void;
  showColumnsMenu: boolean;
  setShowColumnsMenu: (show: boolean) => void;

  // Selection
  selectedLineItems: Set<string>;
  setSelectedLineItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  showBulkActionsMenu: boolean;
  setShowBulkActionsMenu: (show: boolean) => void;

  // Recipients
  recipients: Recipient[];
  selectedRecipient: Recipient | null;
  setSelectedRecipient: (r: Recipient | null) => void;
  recipientQuoteVersion: number;
  setRecipientQuoteVersion: (v: number) => void;
  showCompareView: boolean;
  setShowCompareView: (show: boolean) => void;
  showRecipientDropdown: boolean;
  setShowRecipientDropdown: (show: boolean) => void;

  // Sections
  showSections: boolean;
  setShowSections: (show: boolean) => void;
  collapsedSections: Set<string>;
  setCollapsedSections: React.Dispatch<React.SetStateAction<Set<string>>>;
  sectionDisplayMode: 'column' | 'lineShelf';

  // End user
  showEndUserPerLine: boolean;
  setShowEndUserPerLine: (show: boolean) => void;
  showSetEndUserModal: boolean;
  setShowSetEndUserModal: (show: boolean) => void;
  selectedEndUser: string;
  setSelectedEndUser: (e: string) => void;

  // Commission
  showCommissionSplits: boolean;
  setShowCommissionSplits: (show: boolean) => void;
  showCommissionSplitsModal: boolean;
  setShowCommissionSplitsModal: (show: boolean) => void;
  commissionSplitsModalItem: LineItem | null;
  setCommissionSplitsModalItem: (item: LineItem | null) => void;

  // Rep splits
  repSplitModalItem: LineItem | null;
  setRepSplitModalItem: (item: LineItem | null) => void;
  lineItemRepDropdown: string | null;
  setLineItemRepDropdown: (id: string | null) => void;
  lineItemRepSearch: string;
  setLineItemRepSearch: (s: string) => void;
  showLineItemRepSplitsModal: boolean;
  setShowLineItemRepSplitsModal: (show: boolean) => void;
  lineItemRepSplitsTarget: string | null;
  setLineItemRepSplitsTarget: (id: string | null) => void;
  lineItemRepSplits: {repId: string; repName: string; percentage: number}[];
  setLineItemRepSplits: React.Dispatch<React.SetStateAction<{repId: string; repName: string; percentage: number}[]>>;
  showInsideRepSplits: boolean;
  lineItemInsideRepDropdown: string | null;
  setLineItemInsideRepDropdown: (id: string | null) => void;
  lineItemInsideRepSearch: string;
  setLineItemInsideRepSearch: (s: string) => void;
  showLineItemInsideRepSplitsModal: boolean;
  setShowLineItemInsideRepSplitsModal: (show: boolean) => void;
  lineItemInsideRepSplitsTarget: string | null;
  setLineItemInsideRepSplitsTarget: (id: string | null) => void;
  lineItemInsideRepSplits: {repId: string; repName: string; percentage: number}[];
  setLineItemInsideRepSplits: React.Dispatch<React.SetStateAction<{repId: string; repName: string; percentage: number}[]>>;

  // Product search
  productCatalog: { id: string; partNumber: string; description: string; manufacturer: string; basePrice: number }[];
  setProductCatalog: React.Dispatch<React.SetStateAction<{ id: string; partNumber: string; description: string; manufacturer: string; basePrice: number }[]>>;
  productSearchOpen: string | null;
  setProductSearchOpen: (id: string | null) => void;
  productSearchField: 'partNumber' | 'customerPartNumber' | 'description' | null;
  setProductSearchField: (f: 'partNumber' | 'customerPartNumber' | 'description' | null) => void;
  productSearchQuery: string;
  setProductSearchQuery: (q: string) => void;
  showCreateProduct: boolean;
  setShowCreateProduct: (show: boolean) => void;
  newProductData: { partNumber: string; description: string; manufacturer: string; basePrice: number };
  setNewProductData: React.Dispatch<React.SetStateAction<{ partNumber: string; description: string; manufacturer: string; basePrice: number }>>;
  getFilteredProducts: () => { id: string; partNumber: string; description: string; manufacturer: string; basePrice: number }[];
  handleAddProduct: () => void;
  dropdownPosition: { top: number; left: number } | null;
  setDropdownPosition: (pos: { top: number; left: number } | null) => void;
  productDropdownRef: React.RefObject<HTMLDivElement>;
  showCreateProductModal: boolean;
  setShowCreateProductModal: (show: boolean) => void;
  createProductForLineItem: string | null;
  setCreateProductForLineItem: (id: string | null) => void;
  createProductInitialData: { partNumber: string; description: string };
  setCreateProductInitialData: React.Dispatch<React.SetStateAction<{ partNumber: string; description: string }>>;

  // Manufacturer
  manufacturerDropdown: string | null;
  setManufacturerDropdown: (id: string | null) => void;
  manufacturerSearch: string;
  setManufacturerSearch: (s: string) => void;

  // Overage
  showSetOverageModal: boolean;
  setShowSetOverageModal: (show: boolean) => void;
  overageModalTab: 'percentage' | 'targetPrice' | 'targetMargin';
  setOverageModalTab: (tab: 'percentage' | 'targetPrice' | 'targetMargin') => void;
  overageInputPercent: string;
  setOverageInputPercent: (p: string) => void;
  overageInputTargetPrice: string;
  setOverageInputTargetPrice: (p: string) => void;
  overageInputTargetMargin: string;
  setOverageInputTargetMargin: (m: string) => void;
  showCopyPriceModal: 'l1' | 'l2' | 'l3' | null;
  setShowCopyPriceModal: (l: 'l1' | 'l2' | 'l3' | null) => void;
  showPriceLookupModal: string | null;
  setShowPriceLookupModal: (id: string | null) => void;
  priceLookupTargetPrice: string;
  setPriceLookupTargetPrice: (p: string) => void;
  expandedLineItems: Set<string>;
  setExpandedLineItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  showMinOverageModal: boolean;
  setShowMinOverageModal: (show: boolean) => void;
  minOverageInput: string;
  setMinOverageInput: (m: string) => void;
  showAutoCalcModal: boolean;
  setShowAutoCalcModal: (show: boolean) => void;
  autoCalcMode: 'overage' | 'commission';
  setAutoCalcMode: (mode: 'overage' | 'commission') => void;
  autoCalcTargetOverage: string;
  setAutoCalcTargetOverage: (t: string) => void;
  autoCalcTargetCommission: string;
  setAutoCalcTargetCommission: (t: string) => void;

  // Price levels
  quotePriceLevels: { level: string; percentage: number }[];
  setQuotePriceLevels: React.Dispatch<React.SetStateAction<{ level: string; percentage: number }[]>>;

  // Table state
  sortColumn: ColumnKey | null;
  setSortColumn: React.Dispatch<React.SetStateAction<ColumnKey | null>>;
  sortDirection: 'asc' | 'desc';
  setSortDirection: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  columnFilters: Record<string, string>;
  setColumnFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeFilterColumn: ColumnKey | null;
  setActiveFilterColumn: (col: ColumnKey | null) => void;
  handleSort: (col: ColumnKey) => void;
  handleFilterChange: (col: string, value: string) => void;

  // Editing
  editingCell: { itemId: string; column: ColumnKey } | null;
  setEditingCell: React.Dispatch<React.SetStateAction<{ itemId: string; column: ColumnKey } | null>>;
  editValue: string;
  setEditValue: (v: string) => void;
  editInputRef: React.RefObject<HTMLInputElement>;
  startEditing: (itemId: string, column: ColumnKey, currentValue: string) => void;
  getItemValue: (item: LineItem, column: ColumnKey) => string;

  // Line details modal
  showLineDetailsModal: boolean;
  setShowLineDetailsModal: (show: boolean) => void;
  lineDetailsModalItem: LineItem | null;
  setLineDetailsModalItem: React.Dispatch<React.SetStateAction<LineItem | null>>;
}

export function LinesTab(props: LinesTabProps) {
  const {
    selectedQuote,
    quoteLineItems,
    setQuoteLineItems,
    quoteSections,
    setQuoteSections,
    totals,
    quoteViewMode,
    setQuoteViewMode,
    showViewModeDropdown,
    setShowViewModeDropdown,
    visibleColumns,
    setVisibleColumns,
    simpleViewColumns,
    setSimpleViewColumns,
    effectiveVisibleColumns,
    columnOrder,
    setColumnOrder,
    draggingColumn,
    setDraggingColumn,
    toggleColumn,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragEnd,
    getOrderedVisibleColumns,
    getColumnOrder,
    savedViews,
    setSavedViews,
    activeView,
    setActiveView,
    showSaveViewModal,
    setShowSaveViewModal,
    newViewName,
    setNewViewName,
    applyView,
    saveCurrentView,
    deleteView,
    showViewsMenu,
    setShowViewsMenu,
    showColumnsMenu,
    setShowColumnsMenu,
    selectedLineItems,
    setSelectedLineItems,
    showBulkActionsMenu,
    setShowBulkActionsMenu,
    recipients,
    selectedRecipient,
    setSelectedRecipient,
    recipientQuoteVersion,
    setRecipientQuoteVersion,
    showCompareView,
    setShowCompareView,
    showRecipientDropdown,
    setShowRecipientDropdown,
    showSections,
    setShowSections,
    collapsedSections,
    setCollapsedSections,
    sectionDisplayMode,
    showEndUserPerLine,
    setShowEndUserPerLine,
    showSetEndUserModal,
    setShowSetEndUserModal,
    selectedEndUser,
    setSelectedEndUser,
    showCommissionSplits,
    setShowCommissionSplits,
    showCommissionSplitsModal,
    setShowCommissionSplitsModal,
    commissionSplitsModalItem,
    setCommissionSplitsModalItem,
    repSplitModalItem,
    setRepSplitModalItem,
    lineItemRepDropdown,
    setLineItemRepDropdown,
    lineItemRepSearch,
    setLineItemRepSearch,
    showLineItemRepSplitsModal,
    setShowLineItemRepSplitsModal,
    lineItemRepSplitsTarget,
    setLineItemRepSplitsTarget,
    lineItemRepSplits,
    setLineItemRepSplits,
    showInsideRepSplits,
    lineItemInsideRepDropdown,
    setLineItemInsideRepDropdown,
    lineItemInsideRepSearch,
    setLineItemInsideRepSearch,
    showLineItemInsideRepSplitsModal,
    setShowLineItemInsideRepSplitsModal,
    lineItemInsideRepSplitsTarget,
    setLineItemInsideRepSplitsTarget,
    lineItemInsideRepSplits,
    setLineItemInsideRepSplits,
    productCatalog,
    setProductCatalog,
    productSearchOpen,
    setProductSearchOpen,
    productSearchField,
    setProductSearchField,
    productSearchQuery,
    setProductSearchQuery,
    showCreateProduct,
    setShowCreateProduct,
    newProductData,
    setNewProductData,
    getFilteredProducts,
    handleAddProduct,
    dropdownPosition,
    setDropdownPosition,
    productDropdownRef,
    showCreateProductModal,
    setShowCreateProductModal,
    createProductForLineItem,
    setCreateProductForLineItem,
    createProductInitialData,
    setCreateProductInitialData,
    manufacturerDropdown,
    setManufacturerDropdown,
    manufacturerSearch,
    setManufacturerSearch,
    showSetOverageModal,
    setShowSetOverageModal,
    overageModalTab,
    setOverageModalTab,
    overageInputPercent,
    setOverageInputPercent,
    overageInputTargetPrice,
    setOverageInputTargetPrice,
    overageInputTargetMargin,
    setOverageInputTargetMargin,
    showCopyPriceModal,
    setShowCopyPriceModal,
    showPriceLookupModal,
    setShowPriceLookupModal,
    priceLookupTargetPrice,
    setPriceLookupTargetPrice,
    expandedLineItems,
    setExpandedLineItems,
    showMinOverageModal,
    setShowMinOverageModal,
    minOverageInput,
    setMinOverageInput,
    showAutoCalcModal,
    setShowAutoCalcModal,
    autoCalcMode,
    setAutoCalcMode,
    autoCalcTargetOverage,
    setAutoCalcTargetOverage,
    autoCalcTargetCommission,
    setAutoCalcTargetCommission,
    quotePriceLevels,
    setQuotePriceLevels,
    sortColumn,
    setSortColumn,
    sortDirection,
    setSortDirection,
    columnFilters,
    setColumnFilters,
    activeFilterColumn,
    setActiveFilterColumn,
    handleSort,
    handleFilterChange,
    editingCell,
    setEditingCell,
    editValue,
    setEditValue,
    editInputRef,
    startEditing,
    getItemValue,
    showLineDetailsModal,
    setShowLineDetailsModal,
    lineDetailsModalItem,
    setLineDetailsModalItem,
  } = props;

  // Editable columns
  const editableColumns: ColumnKey[] = ['unitPrice', 'overage', 'l1', 'l2'];

  // Helper to save edit and navigate
  const saveEdit = (navigateTo?: { itemId: string; column: ColumnKey } | null) => {
    if (editingCell && editValue !== '') {
      const numValue = parseFloat(editValue);
      // Line item updates would go here
    }
    if (navigateTo) {
      const item = quoteLineItems.find(li => li.id === navigateTo.itemId);
      if (item) {
        setEditingCell(navigateTo);
        setEditValue(getItemValue(item, navigateTo.column));
      }
    } else {
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: LineItem, column: ColumnKey) => {
    // Handle Tab/Enter/Arrow navigation
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const currentColIdx = editableColumns.indexOf(column);
      const currentItemIdx = quoteLineItems.findIndex(li => li.id === item.id);

      if (e.shiftKey) {
        if (currentColIdx > 0) {
          saveEdit({ itemId: item.id, column: editableColumns[currentColIdx - 1] });
        } else if (currentItemIdx > 0) {
          saveEdit({ itemId: quoteLineItems[currentItemIdx - 1].id, column: editableColumns[editableColumns.length - 1] });
        } else {
          saveEdit(null);
        }
      } else {
        if (currentColIdx < editableColumns.length - 1) {
          saveEdit({ itemId: item.id, column: editableColumns[currentColIdx + 1] });
        } else if (currentItemIdx < quoteLineItems.length - 1) {
          saveEdit({ itemId: quoteLineItems[currentItemIdx + 1].id, column: editableColumns[0] });
        } else {
          saveEdit(null);
        }
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentItemIdx = quoteLineItems.findIndex(li => li.id === item.id);
      if (currentItemIdx > 0) {
        saveEdit({ itemId: quoteLineItems[currentItemIdx - 1].id, column });
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentItemIdx = quoteLineItems.findIndex(li => li.id === item.id);
      if (currentItemIdx < quoteLineItems.length - 1) {
        saveEdit({ itemId: quoteLineItems[currentItemIdx + 1].id, column });
      }
    }
  };

  // Render header cell
  const renderHeaderCell = (colKey: ColumnKey): React.ReactNode => {
    const col = columnDefinitions.find(c => c.key === colKey);
    if (!col) return null;
    const sortableColumns = ['partNumber', 'description', 'quantity', 'manufacturer', 'unitPrice', 'sellTotal', 'endUser'];
    const filterableColumns = ['partNumber', 'description', 'manufacturer', 'endUser'];
    const isSortable = sortableColumns.includes(colKey);
    const isFilterable = filterableColumns.includes(colKey);
    if (colKey === 'endUser' && !showEndUserPerLine) return null;

    return (
      <th key={colKey} className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase relative whitespace-nowrap">
        <div className="flex items-center justify-center gap-1">
          <span
            className={isSortable ? "cursor-pointer hover:text-[var(--foreground)]" : ""}
            onClick={isSortable ? () => handleSort(colKey as any) : undefined}
          >
            {col.label}
          </span>
          {isSortable && sortColumn === colKey && (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
              <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {isFilterable && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveFilterColumn(activeFilterColumn === colKey ? null : colKey); }}
              className={`p-0.5 rounded hover:bg-[var(--muted)] ${columnFilters[colKey] ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        {isFilterable && activeFilterColumn === colKey && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-20 min-w-[180px]">
            <input
              type="text"
              placeholder={`Filter ${col.label}...`}
              value={columnFilters[colKey] || ''}
              onChange={(e) => handleFilterChange(colKey, e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            {columnFilters[colKey] && (
              <button
                onClick={(e) => { e.stopPropagation(); handleFilterChange(colKey, ''); }}
                className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </th>
    );
  };

  return (
'''

component_footer = '''
  );
}
'''

# Write the component file
output_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\quotes\tabs\LinesTab.tsx"

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(component_header)
    f.write(inner_content)
    f.write(component_footer)

print(f"Created LinesTab component at {output_path}")

# Count lines
with open(output_path, 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')
    print(f"Total lines: {len(lines)}")
