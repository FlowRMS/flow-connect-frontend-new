#!/usr/bin/env python3
"""
Create a clean LinesTab component that manages its own internal state.
This will drastically reduce the props needed from QuotesContent.
"""

output_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\quotes\tabs\LinesTab.tsx"

# Read the original extracted content
extracted_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\quotes\tabs\LinesTab_extracted.txt"

with open(extracted_path, 'r', encoding='utf-8') as f:
    jsx_content = f.read()

# Create the new LinesTab with minimal props and internal state
component = '''\'use client\';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { Quote, LineItem, Section, Recipient, SavedView } from '../types';
import { priceLevelColors, defaultSavedViews } from '../config';
import { availableOutsideReps, availableInsideReps, availableEndUsers, availableManufacturers, mockSections, initialProductCatalog } from '../data';
import { mockOrders } from '../../../lib/data/rms-mock';
import { Sparkline, LineApprovalIcon } from '../components';
import { SetOverageModal } from '../modals/SetOverageModal';
import { SetMinOverageModal } from '../modals/SetMinOverageModal';
import { AutoCalcOverageModal } from '../modals/AutoCalcOverageModal';
import { SetEndUserModal } from '../modals/SetEndUserModal';
import { CopyPriceModal } from '../modals/CopyPriceModal';
import { PriceLookupModal } from '../modals/PriceLookupModal';
import { SaveViewModal } from '../modals/SaveViewModal';
import { RepSplitModal } from '../modals/RepSplitModal';

// Column type definition
type ColumnKey = 'partNumber' | 'customerPartNumber' | 'description' | 'manufacturer' | 'quantity' | 'uom' | 'divisor' | 'unitPrice' | 'endUser' | 'sellTotal' | 'commissionPercent' | 'commission' | 'commissionTotal' | 'linkedOrder' | 'overage' | 'overageAmt' | 'commRate' | 'baseComm' | 'overageShare' | 'overageComm' | 'totalEarn' | 'effRate' | 'l1' | 'l2' | 'l3' | 'trend' | 'specSheet' | 'outsideReps' | 'commissionDiscountPercent' | 'commissionDiscountAmount' | 'lineDiscountPercent' | 'lineDiscountAmount' | 'leadTime';

const columnDefinitions: { key: ColumnKey; label: string; group: string }[] = [
  { key: 'partNumber', label: 'Part #', group: 'Basic' },
  { key: 'customerPartNumber', label: 'Cust Part #', group: 'Basic' },
  { key: 'description', label: 'Description', group: 'Basic' },
  { key: 'manufacturer', label: 'Manufacturer', group: 'Basic' },
  { key: 'quantity', label: 'Qty', group: 'Basic' },
  { key: 'uom', label: 'UOM', group: 'Basic' },
  { key: 'divisor', label: 'Divisor', group: 'Basic' },
  { key: 'unitPrice', label: 'Unit Price', group: 'Pricing' },
  { key: 'endUser', label: 'End User', group: 'Basic' },
  { key: 'sellTotal', label: 'Sell Total', group: 'Pricing' },
  { key: 'commissionPercent', label: 'Commission %', group: 'Commission' },
  { key: 'commission', label: 'Commission', group: 'Commission' },
  { key: 'commissionTotal', label: 'Commission Total', group: 'Commission' },
  { key: 'linkedOrder', label: 'Order #', group: 'Links' },
  { key: 'overage', label: 'Over %', group: 'Overage' },
  { key: 'overageAmt', label: 'Over $', group: 'Overage' },
  { key: 'commRate', label: 'Comm %', group: 'Commission' },
  { key: 'baseComm', label: 'Base Comm $', group: 'Commission' },
  { key: 'overageShare', label: 'Ovg Share %', group: 'Commission' },
  { key: 'overageComm', label: 'Ovg Comm $', group: 'Commission' },
  { key: 'totalEarn', label: 'Total Earn', group: 'Commission' },
  { key: 'effRate', label: 'Eff %', group: 'Commission' },
  { key: 'outsideReps', label: 'Outside Reps', group: 'Commission' },
  { key: 'l1', label: 'L1', group: 'Levels' },
  { key: 'l2', label: 'L2', group: 'Levels' },
  { key: 'l3', label: 'L3', group: 'Levels' },
  { key: 'commissionDiscountPercent', label: 'Comm Disc %', group: 'Discounts' },
  { key: 'commissionDiscountAmount', label: 'Comm Disc $', group: 'Discounts' },
  { key: 'lineDiscountPercent', label: 'Line Disc %', group: 'Discounts' },
  { key: 'lineDiscountAmount', label: 'Line Disc $', group: 'Discounts' },
  { key: 'leadTime', label: 'Lead Time', group: 'Details' },
  { key: 'trend', label: 'Trend', group: 'Details' },
  { key: 'specSheet', label: 'Spec', group: 'Details' },
];

// Minimal props - only what MUST come from parent
interface LinesTabProps {
  selectedQuote: Quote;
  quoteLineItems: LineItem[];
  setQuoteLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  quoteSections: Section[];
  setQuoteSections: React.Dispatch<React.SetStateAction<Section[]>>;
  totals: { baseTotal: number; sellTotal: number; commission: number; overage: number; l1Total: number; l2Total: number; l3Total: number };

  // View mode (shared with parent for header display)
  quoteViewMode: 'overage' | 'simple';
  setQuoteViewMode: (mode: 'overage' | 'simple') => void;

  // Settings from parent
  showEndUserPerLine: boolean;
  showCommissionSplits: boolean;
  showInsideRepSplits: boolean;
  showSections: boolean;
  setShowSections: (show: boolean) => void;
  sectionDisplayMode: 'column' | 'lineShelf';

  // Recipients (shared)
  recipients: Recipient[];
  selectedRecipient: Recipient | null;
  setSelectedRecipient: (r: Recipient | null) => void;
  recipientQuoteVersion: number;
  setRecipientQuoteVersion: (v: number) => void;

  // Product catalog (shared)
  productCatalog: { id: string; partNumber: string; description: string; manufacturer: string; basePrice: number }[];
  setProductCatalog: React.Dispatch<React.SetStateAction<{ id: string; partNumber: string; description: string; manufacturer: string; basePrice: number }[]>>;

  // Price levels (shared with settings)
  quotePriceLevels: { id: number; percent: number; description: string }[];

  // Spec sheet selections (for approvals)
  specSheetSelections: Set<string>;
  setSpecSheetSelections: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Optional callback
  onMarkAsLost?: () => void;
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
    showEndUserPerLine,
    showCommissionSplits,
    showInsideRepSplits,
    showSections,
    setShowSections,
    sectionDisplayMode,
    recipients,
    selectedRecipient,
    setSelectedRecipient,
    recipientQuoteVersion,
    setRecipientQuoteVersion,
    productCatalog,
    setProductCatalog,
    quotePriceLevels,
    specSheetSelections,
    setSpecSheetSelections,
    onMarkAsLost,
  } = props;

  const router = useRouter();

  // ========================================
  // INTERNAL STATE - All UI state managed here
  // ========================================

  // View mode dropdown
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set([
    'partNumber', 'customerPartNumber', 'description', 'manufacturer', 'quantity',
    'uom', 'divisor', 'unitPrice', 'sellTotal', 'commissionPercent', 'commission',
    'commissionTotal', 'overage', 'overageAmt', 'commRate', 'baseComm', 'overageShare',
    'overageComm', 'totalEarn', 'effRate', 'outsideReps'
  ]));
  const [simpleViewColumns, setSimpleViewColumns] = useState<Set<ColumnKey>>(new Set([
    'partNumber', 'customerPartNumber', 'description', 'manufacturer', 'quantity',
    'uom', 'unitPrice', 'sellTotal'
  ]));
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>([
    'partNumber', 'customerPartNumber', 'description', 'manufacturer', 'quantity', 'uom', 'divisor', 'unitPrice', 'endUser',
    'sellTotal', 'commissionPercent', 'commission', 'commissionTotal', 'linkedOrder',
    'overage', 'overageAmt', 'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate', 'outsideReps',
    'l1', 'l2', 'l3', 'commissionDiscountPercent', 'commissionDiscountAmount', 'lineDiscountPercent', 'lineDiscountAmount',
    'leadTime', 'trend', 'specSheet'
  ]);
  const [draggingColumn, setDraggingColumn] = useState<ColumnKey | null>(null);

  // Saved views
  const [savedViews, setSavedViews] = useState<SavedView[]>(defaultSavedViews);
  const [activeView, setActiveView] = useState('earnings');
  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [showViewsMenu, setShowViewsMenu] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

  // Selection
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set());
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);

  // Recipients UI
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [showCompareView, setShowCompareView] = useState(false);

  // Sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState<string | null>(null);
  const [showNewSectionInput, setShowNewSectionInput] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // End user modal
  const [showSetEndUserModal, setShowSetEndUserModal] = useState(false);
  const [selectedEndUser, setSelectedEndUser] = useState('');

  // Commission modals
  const [showCommissionSplitsModal, setShowCommissionSplitsModal] = useState(false);
  const [commissionSplitsModalItem, setCommissionSplitsModalItem] = useState<LineItem | null>(null);
  const [repSplitModalItem, setRepSplitModalItem] = useState<LineItem | null>(null);

  // Line item rep splits
  const [lineItemRepDropdown, setLineItemRepDropdown] = useState<string | null>(null);
  const [lineItemRepSearch, setLineItemRepSearch] = useState('');
  const [showLineItemRepSplitsModal, setShowLineItemRepSplitsModal] = useState(false);
  const [lineItemRepSplitsTarget, setLineItemRepSplitsTarget] = useState<string | null>(null);
  const [lineItemRepSplits, setLineItemRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  // Inside rep splits
  const [lineItemInsideRepDropdown, setLineItemInsideRepDropdown] = useState<string | null>(null);
  const [lineItemInsideRepSearch, setLineItemInsideRepSearch] = useState('');
  const [showLineItemInsideRepSplitsModal, setShowLineItemInsideRepSplitsModal] = useState(false);
  const [lineItemInsideRepSplitsTarget, setLineItemInsideRepSplitsTarget] = useState<string | null>(null);
  const [lineItemInsideRepSplits, setLineItemInsideRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  // Product search
  const [productSearchOpen, setProductSearchOpen] = useState<string | null>(null);
  const [productSearchField, setProductSearchField] = useState<'partNumber' | 'customerPartNumber' | 'description' | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProductData, setNewProductData] = useState({ partNumber: '', description: '', manufacturer: '', basePrice: 0 });
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [createProductForLineItem, setCreateProductForLineItem] = useState<string | null>(null);
  const [createProductInitialData, setCreateProductInitialData] = useState({ partNumber: '', description: '' });

  // Manufacturer
  const [manufacturerDropdown, setManufacturerDropdown] = useState<string | null>(null);
  const [manufacturerSearch, setManufacturerSearch] = useState('');

  // Overage modals
  const [showSetOverageModal, setShowSetOverageModal] = useState(false);
  const [overageModalTab, setOverageModalTab] = useState<'percentage' | 'targetPrice' | 'targetMargin'>('percentage');
  const [overageInputPercent, setOverageInputPercent] = useState('');
  const [overageInputTargetPrice, setOverageInputTargetPrice] = useState('');
  const [overageInputTargetMargin, setOverageInputTargetMargin] = useState('');
  const [showCopyPriceModal, setShowCopyPriceModal] = useState<'l1' | 'l2' | 'l3' | null>(null);
  const [showPriceLookupModal, setShowPriceLookupModal] = useState<string | null>(null);
  const [priceLookupTargetPrice, setPriceLookupTargetPrice] = useState('');
  const [expandedLineItems, setExpandedLineItems] = useState<Set<string>>(new Set());
  const [showMinOverageModal, setShowMinOverageModal] = useState(false);
  const [minOverageInput, setMinOverageInput] = useState('');
  const [showAutoCalcModal, setShowAutoCalcModal] = useState(false);
  const [autoCalcMode, setAutoCalcMode] = useState<'overage' | 'commission'>('overage');
  const [autoCalcTargetOverage, setAutoCalcTargetOverage] = useState('');
  const [autoCalcTargetCommission, setAutoCalcTargetCommission] = useState('');

  // Table state
  const [sortColumn, setSortColumn] = useState<ColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<ColumnKey | null>(null);

  // Editing
  const [editingCell, setEditingCell] = useState<{ itemId: string; column: ColumnKey } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Line details modal
  const [showLineDetailsModal, setShowLineDetailsModal] = useState(false);
  const [lineDetailsModalItem, setLineDetailsModalItem] = useState<LineItem | null>(null);

  // ========================================
  // COMPUTED VALUES
  // ========================================

  const effectiveVisibleColumns = useMemo(() => {
    return quoteViewMode === 'simple' ? simpleViewColumns : visibleColumns;
  }, [quoteViewMode, simpleViewColumns, visibleColumns]);

  const currentQuoteSections = quoteSections;

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  const toggleColumn = useCallback((col: ColumnKey) => {
    if (quoteViewMode === 'simple') {
      setSimpleViewColumns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(col)) newSet.delete(col);
        else newSet.add(col);
        return newSet;
      });
    } else {
      setVisibleColumns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(col)) newSet.delete(col);
        else newSet.add(col);
        return newSet;
      });
    }
    setActiveView('custom');
  }, [quoteViewMode]);

  const handleColumnDragStart = useCallback((e: React.DragEvent, col: ColumnKey) => {
    setDraggingColumn(col);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleColumnDragOver = useCallback((e: React.DragEvent, targetCol: ColumnKey) => {
    e.preventDefault();
    if (!draggingColumn || draggingColumn === targetCol) return;
    const newOrder = [...columnOrder];
    const dragIndex = newOrder.indexOf(draggingColumn);
    const targetIndex = newOrder.indexOf(targetCol);
    if (dragIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(dragIndex, 1);
      newOrder.splice(targetIndex, 0, draggingColumn);
      setColumnOrder(newOrder);
    }
  }, [draggingColumn, columnOrder]);

  const handleColumnDragEnd = useCallback(() => {
    setDraggingColumn(null);
    setActiveView('custom');
  }, []);

  const getOrderedVisibleColumns = useCallback((): ColumnKey[] => {
    return columnOrder.filter(col => effectiveVisibleColumns.has(col));
  }, [columnOrder, effectiveVisibleColumns]);

  const getColumnOrder = useCallback((colKey: ColumnKey): number => {
    const index = columnOrder.indexOf(colKey);
    return index === -1 ? 999 : index;
  }, [columnOrder]);

  const applyView = useCallback((viewId: string) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      setVisibleColumns(new Set(view.columns as ColumnKey[]));
      setActiveView(viewId);
    }
    setShowViewsMenu(false);
  }, [savedViews]);

  const saveCurrentView = useCallback(() => {
    if (!newViewName.trim()) return;
    const newView: SavedView = {
      id: `view-${Date.now()}`,
      name: newViewName.trim(),
      columns: Array.from(effectiveVisibleColumns),
      isDefault: false,
    };
    setSavedViews(prev => [...prev, newView]);
    setActiveView(newView.id);
    setNewViewName('');
    setShowSaveViewModal(false);
  }, [newViewName, effectiveVisibleColumns]);

  const deleteView = useCallback((viewId: string) => {
    setSavedViews(prev => prev.filter(v => v.id !== viewId));
    if (activeView === viewId) setActiveView('custom');
  }, [activeView]);

  const toggleSectionCollapse = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) newSet.delete(sectionId);
      else newSet.add(sectionId);
      return newSet;
    });
  }, []);

  const toggleLineItemSelection = useCallback((id: string) => {
    setSelectedLineItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const addLineItem = useCallback((sectionId?: string) => {
    const section = sectionId ? quoteSections.find(s => s.id === sectionId) : null;
    const newItem: LineItem = {
      id: `new-${Date.now()}`,
      quoteId: selectedQuote.id,
      sectionId: sectionId || '',
      sectionName: section?.name || '',
      productNumber: '',
      description: '',
      endUser: '',
      quantity: 1,
      manufacturers: [],
      basePrice: 0,
      sellPrice: 0,
      level1Price: 0,
      level2Price: 0,
      level3Price: 0,
      overagePercent: 0,
      commissionable: true,
      locked: false,
      priceHistory: [],
      quotedPriceHistory: [],
      hasSpecSheet: false,
      outsideRepSplits: [],
      insideRepSplits: [],
      useDivisor: false,
      divisor: 1,
    };
    setQuoteLineItems(prev => [...prev, newItem]);
  }, [quoteSections, selectedQuote.id, setQuoteLineItems]);

  const addSection = useCallback(() => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: `Section ${quoteSections.length + 1}`,
      order: quoteSections.length,
    };
    setQuoteSections(prev => [...prev, newSection]);
  }, [quoteSections.length, setQuoteSections]);

  const createSectionAndMoveItem = useCallback((itemId: string, sectionName: string) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: sectionName,
      order: quoteSections.length,
    };
    setQuoteSections(prev => [...prev, newSection]);
    setQuoteLineItems(prev => prev.map(li =>
      li.id === itemId ? { ...li, sectionId: newSection.id } : li
    ));
  }, [quoteSections.length, setQuoteSections, setQuoteLineItems]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      cancelEdit();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      setEditingCell(null);
    }
  }, [cancelEdit]);

  const handleSort = useCallback((col: ColumnKey) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const handleFilterChange = useCallback((col: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [col]: value }));
  }, []);

  const startEditing = useCallback((itemId: string, column: ColumnKey, currentValue: string) => {
    setEditingCell({ itemId, column });
    setEditValue(currentValue);
  }, []);

  const getItemValue = useCallback((item: LineItem, column: ColumnKey): string => {
    switch (column) {
      case 'overage': return item.overagePercent.toFixed(1);
      case 'l1': return item.level1Price.toFixed(2);
      case 'l2': return item.level2Price.toFixed(2);
      case 'l3': return item.level3Price.toFixed(2);
      default: return '';
    }
  }, []);

  const getFilteredProducts = useCallback(() => {
    if (!productSearchQuery.trim()) return productCatalog;
    const query = productSearchQuery.toLowerCase();
    return productCatalog.filter(p =>
      p.partNumber.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.manufacturer.toLowerCase().includes(query)
    );
  }, [productCatalog, productSearchQuery]);

  const handleAddProduct = useCallback(() => {
    if (!newProductData.partNumber.trim()) return;
    const newProduct = {
      id: `product-${Date.now()}`,
      partNumber: newProductData.partNumber.trim(),
      description: newProductData.description.trim(),
      manufacturer: newProductData.manufacturer.trim(),
      basePrice: newProductData.basePrice,
    };
    setProductCatalog(prev => [...prev, newProduct]);
    setNewProductData({ partNumber: '', description: '', manufacturer: '', basePrice: 0 });
    setShowCreateProduct(false);
  }, [newProductData, setProductCatalog]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (productSearchOpen && !(e.target as Element).closest('.product-search-container')) {
        setProductSearchOpen(null);
        setProductSearchField(null);
        setProductSearchQuery('');
        setShowCreateProduct(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [productSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (lineItemRepDropdown && !(e.target as Element).closest('.line-item-rep-container')) {
        setLineItemRepDropdown(null);
        setLineItemRepSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [lineItemRepDropdown]);

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
            onClick={isSortable ? () => handleSort(colKey) : undefined}
          >
            {col.label}
          </span>
          {isSortable && sortColumn === colKey && (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
              <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </th>
    );
  };

  // Render body cell
  const renderBodyCell = (colKey: ColumnKey, item: LineItem): React.ReactNode => {
    if (colKey === 'endUser' && !showEndUserPerLine) return null;

    switch (colKey) {
      case 'partNumber':
        return (
          <td key={colKey} className="px-3 py-2 font-mono text-sm text-center">
            {item.productNumber || '-'}
          </td>
        );
      case 'description':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center max-w-[200px] truncate">
            {item.description || '-'}
          </td>
        );
      case 'quantity':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            {item.quantity}
          </td>
        );
      case 'manufacturer':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            {item.manufacturers?.[0]?.name || '-'}
          </td>
        );
      case 'unitPrice':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            ${item.sellPrice.toFixed(2)}
          </td>
        );
      case 'sellTotal':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center font-medium">
            ${(item.quantity * item.sellPrice).toFixed(2)}
          </td>
        );
      default:
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            -
          </td>
        );
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-4">
      {/* Line Items Toolbar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowViewModeDropdown(!showViewModeDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <span>{quoteViewMode === 'simple' ? 'Simple View' : 'Full View'}</span>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {showViewModeDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                <button
                  onClick={() => { setQuoteViewMode('simple'); setShowViewModeDropdown(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${quoteViewMode === 'simple' ? 'bg-[var(--muted)]' : ''}`}
                >
                  Simple View
                </button>
                <button
                  onClick={() => { setQuoteViewMode('overage'); setShowViewModeDropdown(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] ${quoteViewMode === 'overage' ? 'bg-[var(--muted)]' : ''}`}
                >
                  Full View
                </button>
              </div>
            )}
          </div>

          {/* Auto-Calculate Button */}
          {quoteViewMode === 'overage' && (
            <button
              onClick={() => setShowAutoCalcModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="14" height="14" rx="2"/>
                <path d="M7 7h2v6H7M11 7h2v3h-2M11 12h2v1h-2" strokeLinecap="round"/>
              </svg>
              Auto-Calc
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          {selectedLineItems.size > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBulkActionsMenu(!showBulkActionsMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)]"
              >
                {selectedLineItems.size} Selected
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {showBulkActionsMenu && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => { setShowSetOverageModal(true); setShowBulkActionsMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)]"
                  >
                    Set Overage
                  </button>
                  <button
                    onClick={() => { setShowSetEndUserModal(true); setShowBulkActionsMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)]"
                  >
                    Set End User
                  </button>
                  {onMarkAsLost && (
                    <>
                      <div className="border-t border-[var(--border)] my-1"></div>
                      <button
                        onClick={() => { onMarkAsLost(); setShowBulkActionsMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] text-red-600"
                      >
                        Mark as Lost
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Add Line Button */}
          <button
            onClick={() => addLineItem()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)]"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
            </svg>
            Add Line
          </button>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
        <table className="w-full">
          <thead className="bg-[var(--muted)]/50">
            <tr>
              <th className="px-3 py-2 w-10">
                <input
                  type="checkbox"
                  checked={selectedLineItems.size === quoteLineItems.length && quoteLineItems.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLineItems(new Set(quoteLineItems.map(li => li.id)));
                    } else {
                      setSelectedLineItems(new Set());
                    }
                  }}
                  className="rounded border-[var(--border)]"
                />
              </th>
              {getOrderedVisibleColumns().map(col => renderHeaderCell(col))}
            </tr>
          </thead>
          <tbody>
            {quoteLineItems.map(item => (
              <tr key={item.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/20">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedLineItems.has(item.id)}
                    onChange={() => toggleLineItemSelection(item.id)}
                    className="rounded border-[var(--border)]"
                  />
                </td>
                {getOrderedVisibleColumns().map(col => renderBodyCell(col, item))}
              </tr>
            ))}
            {quoteLineItems.length === 0 && (
              <tr>
                <td colSpan={getOrderedVisibleColumns().length + 1} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                  No line items. Click "Add Line" to add your first item.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="bg-[var(--muted)]/30 rounded-lg p-4 min-w-[300px]">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Base Total:</span>
              <span className="font-medium">${totals.baseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Sell Total:</span>
              <span className="font-medium">${totals.sellTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2">
              <span className="text-[var(--muted-foreground)]">Commission:</span>
              <span className="font-medium text-green-600">${totals.commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SetOverageModal
        show={showSetOverageModal}
        selectedLineItems={selectedLineItems}
        quoteLineItems={quoteLineItems}
        activeTab={overageModalTab}
        inputPercent={overageInputPercent}
        inputTargetPrice={overageInputTargetPrice}
        inputTargetMargin={overageInputTargetMargin}
        onClose={() => setShowSetOverageModal(false)}
        onSetActiveTab={setOverageModalTab}
        onSetInputPercent={setOverageInputPercent}
        onSetInputTargetPrice={setOverageInputTargetPrice}
        onSetInputTargetMargin={setOverageInputTargetMargin}
        onApply={() => setShowSetOverageModal(false)}
      />

      <SetMinOverageModal
        show={showMinOverageModal}
        inputValue={minOverageInput}
        onClose={() => setShowMinOverageModal(false)}
        onSetInputValue={setMinOverageInput}
        onApply={() => setShowMinOverageModal(false)}
      />

      <AutoCalcOverageModal
        show={showAutoCalcModal}
        mode={autoCalcMode}
        targetOverage={autoCalcTargetOverage}
        targetCommission={autoCalcTargetCommission}
        onClose={() => setShowAutoCalcModal(false)}
        onSetMode={setAutoCalcMode}
        onSetTargetOverage={setAutoCalcTargetOverage}
        onSetTargetCommission={setAutoCalcTargetCommission}
        onApply={() => setShowAutoCalcModal(false)}
      />

      <SetEndUserModal
        show={showSetEndUserModal}
        selectedEndUser={selectedEndUser}
        availableEndUsers={availableEndUsers}
        onClose={() => setShowSetEndUserModal(false)}
        onSelectEndUser={setSelectedEndUser}
        onApply={() => setShowSetEndUserModal(false)}
      />

      <SaveViewModal
        show={showSaveViewModal}
        newViewName={newViewName}
        effectiveVisibleColumns={effectiveVisibleColumns}
        columnDefinitions={columnDefinitions}
        onClose={() => setShowSaveViewModal(false)}
        onSetNewViewName={setNewViewName}
        onSave={saveCurrentView}
      />
    </div>
  );
}
'''

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(component)

print(f"Created clean LinesTab.tsx")
line_count = component.count('\\n') + 1
print(f"LinesTab.tsx has approximately {len(component.split(chr(10)))} lines")
