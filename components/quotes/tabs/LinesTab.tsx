'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import type { Quote, LineItem, Section, Recipient, SavedView } from '../types';
import { priceLevelColors, defaultSavedViews } from '../config';
import { availableEndUsers } from '../data';
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
import {
  useProductSearchDropdown,
  useFactorySearchDropdown,
  useRepSearchDropdown,
} from '../hooks';

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

  // API search hooks - called at top level of component
  const productSearch = useProductSearchDropdown();
  const factorySearch = useFactorySearchDropdown();
  const outsideRepSearch = useRepSearchDropdown(false);

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
    'uom', 'divisor', 'unitPrice', 'sellTotal', 'commissionPercent', 'commission',
    'commissionTotal', 'linkedOrder'
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
    // Calculate next item number
    const nextItemNumber = quoteLineItems.length + 1;
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
      // New API-aligned fields
      itemNumber: nextItemNumber,
      status: 'OPEN',
      productId: undefined,
      productNameAdhoc: undefined,
      productDescriptionAdhoc: undefined,
      factoryId: undefined,
      note: undefined,
      splitRates: [],
      commissionRate: undefined,
      discountRate: undefined,
    };
    setQuoteLineItems(prev => [...prev, newItem]);
  }, [quoteSections, selectedQuote.id, quoteLineItems.length, setQuoteLineItems]);

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

  // Helper to select a product from catalog and update line item
  const selectProductForLineItem = (itemId: string, product: typeof productCatalog[0]) => {
    setQuoteLineItems(prev => prev.map(li =>
      li.id === itemId ? {
        ...li,
        productNumber: product.partNumber,
        description: product.description,
        basePrice: product.basePrice,
        sellPrice: product.basePrice,
        manufacturers: [{
          ...li.manufacturers[0],
          name: product.manufacturer,
        }]
      } : li
    ));
    setProductSearchOpen(null);
    setProductSearchField(null);
    setProductSearchQuery('');
  };

  // Render body cell - FULL IMPLEMENTATION with all dropdowns and editing
  const renderBodyCell = (colKey: ColumnKey, item: LineItem): React.ReactNode => {
    if (colKey === 'endUser' && !showEndUserPerLine) return null;

    switch (colKey) {
      case 'partNumber':
        const hasSearchQuery = productSearchQuery.trim().length > 0;
        return (
          <td key={colKey} className="px-3 py-2 font-mono text-sm text-center relative">
            <div className="product-search-container" ref={productSearchOpen === item.id && productSearchField === 'partNumber' ? productDropdownRef : undefined}>
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownPosition({ top: rect.bottom + 4, left: rect.left });
                  const isOpen = productSearchOpen === item.id && productSearchField === 'partNumber';
                  setProductSearchOpen(isOpen ? null : item.id);
                  setProductSearchField(isOpen ? null : 'partNumber');
                  setProductSearchQuery(item.productNumber || '');
                  setShowCreateProduct(false);
                  if (!isOpen) {
                    productSearch.onSearch(item.productNumber || '');
                  }
                }}
                className="w-full text-center px-2 py-1 rounded hover:bg-[var(--muted)] transition-colors flex items-center justify-center gap-1"
              >
                <span className="flex-1 truncate">{item.productNumber || 'Select...'}</span>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)] flex-shrink-0">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {productSearchOpen === item.id && productSearchField === 'partNumber' && dropdownPosition && createPortal(
                <div
                  className="product-search-container fixed w-80 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-[9999]"
                  style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                >
                  <div className="p-2 border-b border-[var(--border)]">
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        productSearch.onSearch(e.target.value);
                      }}
                      placeholder="Search FPN, CPN, or description..."
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {productSearch.isLoading && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">Loading...</div>
                    )}
                    {!productSearch.isLoading && productSearch.options.map(product => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? {
                              ...li,
                              productId: product.id,
                              productNumber: product.label,
                              description: product.sublabel || '',
                              productNameAdhoc: undefined, // Clear adhoc since selecting real product
                            } : li
                          ));
                          setProductSearchOpen(null);
                          setProductSearchField(null);
                          setProductSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors"
                      >
                        <div className="font-mono text-sm font-medium">{product.label}</div>
                        {product.sublabel && <div className="text-xs text-[var(--muted-foreground)] truncate">{product.sublabel}</div>}
                      </button>
                    ))}
                    {!productSearch.isLoading && productSearch.options.length === 0 && !hasSearchQuery && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">Type to search products...</div>
                    )}
                    {!productSearch.isLoading && productSearch.options.length === 0 && hasSearchQuery && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No products found</div>
                    )}
                  </div>
                  {/* Adhoc option - use custom part number */}
                  {hasSearchQuery && (
                    <div className="border-t border-[var(--border)]">
                      <button
                        onClick={() => {
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? {
                              ...li,
                              productNumber: productSearchQuery.trim(),
                              productNameAdhoc: productSearchQuery.trim(),
                              productId: undefined, // Clear product ID for adhoc
                            } : li
                          ));
                          setProductSearchOpen(null);
                          setProductSearchField(null);
                          setProductSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)] flex-shrink-0">
                          <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                        </svg>
                        <div>
                          <div className="font-mono text-sm font-medium text-[var(--primary)]">{productSearchQuery.trim()}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">Use as adhoc product (document-specific)</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>,
                document.body
              )}
            </div>
          </td>
        );

      case 'customerPartNumber':
        const cpnHasSearchQuery = productSearchQuery.trim().length > 0;
        return (
          <td key={colKey} className="px-3 py-2 font-mono text-sm text-center relative">
            <div className="product-search-container">
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownPosition({ top: rect.bottom + 4, left: rect.left });
                  const isOpen = productSearchOpen === item.id && productSearchField === 'customerPartNumber';
                  setProductSearchOpen(isOpen ? null : item.id);
                  setProductSearchField(isOpen ? null : 'customerPartNumber');
                  setProductSearchQuery((item as LineItem & { customerPartNumber?: string }).customerPartNumber || '');
                  setShowCreateProduct(false);
                  if (!isOpen) {
                    productSearch.onSearch((item as LineItem & { customerPartNumber?: string }).customerPartNumber || '');
                  }
                }}
                className="w-full text-center px-2 py-1 rounded hover:bg-[var(--muted)] transition-colors flex items-center justify-center gap-1"
              >
                <span className="flex-1 truncate">{(item as LineItem & { customerPartNumber?: string }).customerPartNumber || 'Select...'}</span>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)] flex-shrink-0">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {productSearchOpen === item.id && productSearchField === 'customerPartNumber' && dropdownPosition && createPortal(
                <div
                  className="product-search-container fixed w-80 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-[9999]"
                  style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                >
                  <div className="p-2 border-b border-[var(--border)]">
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        productSearch.onSearch(e.target.value);
                      }}
                      placeholder="Search or enter customer part #..."
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {productSearch.isLoading && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">Loading...</div>
                    )}
                    {!productSearch.isLoading && productSearch.options.map(product => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? { ...li, customerPartNumber: product.label } : li
                          ));
                          setProductSearchOpen(null);
                          setProductSearchField(null);
                          setProductSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors"
                      >
                        <div className="font-mono text-sm font-medium">{product.label}</div>
                        {product.sublabel && <div className="text-xs text-[var(--muted-foreground)] truncate">{product.sublabel}</div>}
                      </button>
                    ))}
                    {!productSearch.isLoading && productSearch.options.length === 0 && !cpnHasSearchQuery && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">Type to search...</div>
                    )}
                    {!productSearch.isLoading && productSearch.options.length === 0 && cpnHasSearchQuery && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No products found</div>
                    )}
                  </div>
                  {/* Custom customer part number */}
                  {cpnHasSearchQuery && (
                    <div className="border-t border-[var(--border)]">
                      <button
                        onClick={() => {
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? { ...li, customerPartNumber: productSearchQuery.trim() } : li
                          ));
                          setProductSearchOpen(null);
                          setProductSearchField(null);
                          setProductSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)] flex-shrink-0">
                          <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                        </svg>
                        <div>
                          <div className="text-sm text-[var(--primary)]">Use "{productSearchQuery.trim()}"</div>
                          <div className="text-xs text-[var(--muted-foreground)]">Custom customer part number</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>,
                document.body
              )}
            </div>
          </td>
        );

      case 'description':
        const descHasSearchQuery = productSearchQuery.trim().length > 0;
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center max-w-[200px] relative">
            <div className="product-search-container">
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownPosition({ top: rect.bottom + 4, left: rect.left });
                  const isOpen = productSearchOpen === item.id && productSearchField === 'description';
                  setProductSearchOpen(isOpen ? null : item.id);
                  setProductSearchField(isOpen ? null : 'description');
                  setProductSearchQuery(item.description || '');
                  setShowCreateProduct(false);
                  if (!isOpen) {
                    productSearch.onSearch(item.description || '');
                  }
                }}
                className="w-full text-center px-2 py-1 rounded hover:bg-[var(--muted)] transition-colors flex items-center justify-center gap-1"
              >
                <span className="flex-1 truncate">{item.description || 'Select...'}</span>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)] flex-shrink-0">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {productSearchOpen === item.id && productSearchField === 'description' && dropdownPosition && createPortal(
                <div
                  className="product-search-container fixed w-80 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-[9999]"
                  style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                >
                  <div className="p-2 border-b border-[var(--border)]">
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        productSearch.onSearch(e.target.value);
                      }}
                      placeholder="Search FPN, CPN, or description..."
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {productSearch.isLoading && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">Loading...</div>
                    )}
                    {!productSearch.isLoading && productSearch.options.map(product => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? {
                              ...li,
                              productId: product.id,
                              productNumber: product.label,
                              description: product.sublabel || '',
                              productDescriptionAdhoc: undefined,
                            } : li
                          ));
                          setProductSearchOpen(null);
                          setProductSearchField(null);
                          setProductSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors"
                      >
                        <div className="text-sm">{product.sublabel || product.label}</div>
                        <div className="font-mono text-xs text-[var(--muted-foreground)]">{product.label}</div>
                      </button>
                    ))}
                    {!productSearch.isLoading && productSearch.options.length === 0 && !descHasSearchQuery && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">Type to search...</div>
                    )}
                    {!productSearch.isLoading && productSearch.options.length === 0 && descHasSearchQuery && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No products found</div>
                    )}
                  </div>
                  {/* Adhoc description option */}
                  {descHasSearchQuery && (
                    <div className="border-t border-[var(--border)]">
                      <button
                        onClick={() => {
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? {
                              ...li,
                              description: productSearchQuery.trim(),
                              productDescriptionAdhoc: productSearchQuery.trim(),
                            } : li
                          ));
                          setProductSearchOpen(null);
                          setProductSearchField(null);
                          setProductSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)] flex-shrink-0">
                          <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-[var(--primary)]">{productSearchQuery.trim()}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">Use as adhoc description (document-specific)</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>,
                document.body
              )}
            </div>
          </td>
        );

      case 'quantity':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            <input
              type="text"
              value={item.quantity}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                setQuoteLineItems(prev => prev.map(li =>
                  li.id === item.id ? { ...li, quantity: parseInt(e.target.value) || 1 } : li
                ));
              }}
              className="w-16 px-2 py-1 text-center border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] rounded bg-transparent focus:bg-white focus:outline-none"
            />
          </td>
        );

      case 'uom':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            <input
              type="text"
              value={item.uom || 'EA'}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                setQuoteLineItems(prev => prev.map(li =>
                  li.id === item.id ? { ...li, uom: e.target.value } : li
                ));
              }}
              className="w-14 px-2 py-1 text-center border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] rounded bg-transparent focus:bg-white focus:outline-none text-sm"
            />
          </td>
        );

      case 'endUser':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            <input
              type="text"
              value={item.endUser || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                setQuoteLineItems(prev => prev.map(li =>
                  li.id === item.id ? { ...li, endUser: e.target.value } : li
                ));
              }}
              placeholder="—"
              className="w-24 px-2 py-1 text-center border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] rounded bg-transparent focus:bg-white focus:outline-none text-sm"
            />
          </td>
        );

      case 'manufacturer':
        const currentMfr = item.manufacturers[0]?.name || '';
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center relative">
            <div className="manufacturer-dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const isOpen = manufacturerDropdown === item.id;
                  setManufacturerDropdown(isOpen ? null : item.id);
                  setManufacturerSearch('');
                  if (!isOpen) {
                    factorySearch.onSearch('');
                  }
                }}
                className="w-full text-center px-2 py-1 rounded hover:bg-[var(--muted)] transition-colors flex items-center justify-center gap-1"
              >
                <span className="flex-1 truncate">{currentMfr || 'Select...'}</span>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)] flex-shrink-0">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {manufacturerDropdown === item.id && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  <div className="p-2 border-b border-[var(--border)]">
                    <input
                      type="text"
                      value={manufacturerSearch}
                      onChange={(e) => {
                        setManufacturerSearch(e.target.value);
                        factorySearch.onSearch(e.target.value);
                      }}
                      placeholder="Search manufacturers..."
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {factorySearch.isLoading && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">Loading...</div>
                    )}
                    {!factorySearch.isLoading && factorySearch.options.map(mfr => (
                      <button
                        key={mfr.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? {
                              ...li,
                              factoryId: mfr.id,
                              manufacturers: [{ ...li.manufacturers[0], name: mfr.label }]
                            } : li
                          ));
                          setManufacturerDropdown(null);
                          setManufacturerSearch('');
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors ${currentMfr === mfr.label ? 'bg-[var(--muted)]' : ''}`}
                      >
                        <div className="text-sm">{mfr.label}</div>
                        {mfr.sublabel && <div className="text-xs text-[var(--muted-foreground)]">{mfr.sublabel}</div>}
                      </button>
                    ))}
                    {!factorySearch.isLoading && factorySearch.options.length === 0 && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                        {manufacturerSearch ? 'No manufacturers found' : 'Type to search...'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </td>
        );

      case 'unitPrice':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            <input
              type="text"
              value={`$${item.sellPrice.toLocaleString()}`}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = parseFloat(e.target.value.replace(/[$,]/g, '')) || 0;
                setQuoteLineItems(prev => prev.map(li =>
                  li.id === item.id ? { ...li, sellPrice: val } : li
                ));
              }}
              className="w-24 px-2 py-1 text-center border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] rounded bg-transparent focus:bg-white focus:outline-none"
            />
          </td>
        );

      case 'sellTotal':
        const divisorVal = item.divisor || 1;
        const sellTotalCalc = (item.quantity * item.sellPrice) / divisorVal;
        return <td key={colKey} className="px-3 py-2 text-sm text-center font-medium">${sellTotalCalc.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>;

      case 'divisor':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            <input
              type="text"
              value={item.divisor || 1}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 1;
                setQuoteLineItems(prev => prev.map(li =>
                  li.id === item.id ? { ...li, divisor: val, useDivisor: true } : li
                ));
              }}
              className="w-16 px-2 py-1 text-center border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] rounded bg-transparent focus:bg-white focus:outline-none text-sm"
            />
          </td>
        );

      case 'commissionPercent':
        const commPctVal = item.manufacturers[0]?.commissionRate || 8;
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            <input
              type="text"
              value={commPctVal}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setQuoteLineItems(prev => prev.map(li =>
                  li.id === item.id ? {
                    ...li,
                    manufacturers: [{ ...li.manufacturers[0], commissionRate: val }]
                  } : li
                ));
              }}
              className="w-16 px-2 py-1 text-center border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] rounded bg-transparent focus:bg-white focus:outline-none text-sm text-purple-600"
            />
          </td>
        );

      case 'commission':
        const commDivisor = item.divisor || 1;
        const commSellTotal = (item.quantity * item.sellPrice) / commDivisor;
        const commPctForCalc = (item.manufacturers[0]?.commissionRate || 8) / 100;
        const commTotal = commSellTotal * commPctForCalc;
        const commPerUnit = item.quantity > 0 ? commTotal / item.quantity : 0;
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            <input
              type="text"
              value={`$${commPerUnit.toFixed(2)}`}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = parseFloat(e.target.value.replace(/[$,]/g, '')) || 0;
                const newCommTotal = val * item.quantity;
                const divVal = item.divisor || 1;
                const sellTot = (item.quantity * item.sellPrice) / divVal;
                const newCommPct = sellTot > 0 ? (newCommTotal / sellTot) * 100 : 0;
                setQuoteLineItems(prev => prev.map(li =>
                  li.id === item.id ? {
                    ...li,
                    manufacturers: [{ ...li.manufacturers[0], commissionRate: newCommPct }]
                  } : li
                ));
              }}
              className="w-20 px-2 py-1 text-center border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] rounded bg-transparent focus:bg-white focus:outline-none text-sm text-purple-600"
            />
          </td>
        );

      case 'commissionTotal':
        const ctDivisor = item.divisor || 1;
        const ctSellTotal = (item.quantity * item.sellPrice) / ctDivisor;
        const ctCommPct = (item.manufacturers[0]?.commissionRate || 8) / 100;
        const ctCommTotal = ctSellTotal * ctCommPct;
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            <input
              type="text"
              value={`$${ctCommTotal.toFixed(2)}`}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = parseFloat(e.target.value.replace(/[$,]/g, '')) || 0;
                const divVal = item.divisor || 1;
                const sellTot = (item.quantity * item.sellPrice) / divVal;
                const newCommPct = sellTot > 0 ? (val / sellTot) * 100 : 0;
                setQuoteLineItems(prev => prev.map(li =>
                  li.id === item.id ? {
                    ...li,
                    manufacturers: [{ ...li.manufacturers[0], commissionRate: newCommPct }]
                  } : li
                ));
              }}
              className="w-24 px-2 py-1 text-center border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] rounded bg-transparent focus:bg-white focus:outline-none text-sm font-medium text-purple-600"
            />
          </td>
        );

      case 'overage':
        return <td key={colKey} className="px-3 py-2 text-sm text-center">{item.overagePercent}%</td>;
      case 'overageAmt':
        return <td key={colKey} className="px-3 py-2 text-sm text-center">${((item.sellPrice - item.basePrice) * item.quantity).toLocaleString()}</td>;
      case 'commRate':
        return <td key={colKey} className="px-3 py-2 text-sm text-center">{item.manufacturers[0]?.commissionRate || 0}%</td>;
      case 'baseComm':
        return <td key={colKey} className="px-3 py-2 text-sm text-center">${(item.basePrice * item.quantity * (item.manufacturers[0]?.commissionRate || 0) / 100).toLocaleString()}</td>;
      case 'overageShare':
        return <td key={colKey} className="px-3 py-2 text-sm text-center">{item.manufacturers[0]?.overageShare || 0}%</td>;
      case 'overageComm':
        return <td key={colKey} className="px-3 py-2 text-sm text-center">${(((item.sellPrice - item.basePrice) * item.quantity) * (item.manufacturers[0]?.overageShare || 0) / 100).toLocaleString()}</td>;
      case 'totalEarn':
        const baseCommVal = item.basePrice * item.quantity * (item.manufacturers[0]?.commissionRate || 0) / 100;
        const overageCommVal = ((item.sellPrice - item.basePrice) * item.quantity) * (item.manufacturers[0]?.overageShare || 0) / 100;
        return <td key={colKey} className="px-3 py-2 text-sm text-center font-medium">${(baseCommVal + overageCommVal).toLocaleString()}</td>;
      case 'effRate':
        const totalEarnVal = (item.basePrice * item.quantity * (item.manufacturers[0]?.commissionRate || 0) / 100) + (((item.sellPrice - item.basePrice) * item.quantity) * (item.manufacturers[0]?.overageShare || 0) / 100);
        const sellTotalVal = item.sellPrice * item.quantity;
        return <td key={colKey} className="px-3 py-2 text-sm text-center">{sellTotalVal > 0 ? ((totalEarnVal / sellTotalVal) * 100).toFixed(1) : 0}%</td>;
      case 'l1':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">${item.level1Price.toLocaleString()}</td>;
      case 'l2':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">${item.level2Price.toLocaleString()}</td>;
      case 'l3':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">${item.level3Price.toLocaleString()}</td>;

      case 'outsideReps':
        if (!showCommissionSplits) return null;
        const currentRep = item.outsideRepSplits.length === 1 ? item.outsideRepSplits[0] : null;
        const hasMultiple = item.outsideRepSplits.length > 1;
        const displayText = hasMultiple ? 'Multiple' : (currentRep?.repName || 'Select...');
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center relative">
            <div className="line-item-rep-container">
              <button
                onClick={() => {
                  const isOpen = lineItemRepDropdown === item.id;
                  setLineItemRepDropdown(isOpen ? null : item.id);
                  setLineItemRepSearch('');
                  if (!isOpen) {
                    outsideRepSearch.onSearch('');
                  }
                }}
                className={`w-full text-center px-2 py-1 rounded hover:bg-[var(--muted)] transition-colors flex items-center justify-center gap-1 ${hasMultiple ? 'text-[var(--primary)] font-medium' : ''}`}
              >
                <span className="flex-1 truncate">{displayText}</span>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)] flex-shrink-0">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {lineItemRepDropdown === item.id && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  <div className="p-2 border-b border-[var(--border)]">
                    <input
                      type="text"
                      value={lineItemRepSearch}
                      onChange={(e) => {
                        setLineItemRepSearch(e.target.value);
                        outsideRepSearch.onSearch(e.target.value);
                      }}
                      placeholder="Search reps..."
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      onClick={() => {
                        setLineItemRepSplitsTarget(item.id);
                        const firstRep = outsideRepSearch.options[0];
                        setLineItemRepSplits(item.outsideRepSplits.length > 0
                          ? item.outsideRepSplits.map(s => ({ repId: s.repId, repName: s.repName, percentage: s.percentage }))
                          : firstRep ? [{ repId: firstRep.id, repName: firstRep.label, percentage: 100 }] : []
                        );
                        setShowLineItemRepSplitsModal(true);
                        setLineItemRepDropdown(null);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)] flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                        <path d="M12 4.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 8.5a2 2 0 11-4 0 2 2 0 014 0zM5 8.5a2 2 0 11-4 0 2 2 0 014 0zM10 10v6M6 14h8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-[var(--primary)]">Multiple (Split Commission)</span>
                    </button>
                    {outsideRepSearch.isLoading && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">Loading...</div>
                    )}
                    {!outsideRepSearch.isLoading && outsideRepSearch.options.map(rep => (
                      <button
                        key={rep.id}
                        onClick={() => {
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? {
                              ...li,
                              outsideRepSplits: [{ repId: rep.id, repName: rep.label, percentage: 100 }]
                            } : li
                          ));
                          setLineItemRepDropdown(null);
                          setLineItemRepSearch('');
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors ${currentRep?.repId === rep.id ? 'bg-[var(--muted)]' : ''}`}
                      >
                        <div className="text-sm">{rep.label}</div>
                        {rep.sublabel && <div className="text-xs text-[var(--muted-foreground)]">{rep.sublabel}</div>}
                      </button>
                    ))}
                    {!outsideRepSearch.isLoading && outsideRepSearch.options.length === 0 && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                        {lineItemRepSearch ? 'No reps found' : 'Type to search...'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </td>
        );

      case 'linkedOrder':
        const linkedOrders = mockOrders.filter(order => order.quoteId === selectedQuote?.id);
        return (
          <td key={colKey} className="px-3 py-2 text-sm">
            {linkedOrders.length > 0 ? (
              <button
                onClick={() => router.push(`/orders/${linkedOrders[0].id}`)}
                className="text-[var(--primary)] hover:underline"
              >
                {linkedOrders[0].orderNumber}
                {linkedOrders.length > 1 && ` +${linkedOrders.length - 1}`}
              </button>
            ) : (
              <span className="text-[var(--muted-foreground)]">—</span>
            )}
          </td>
        );

      case 'trend':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">—</td>;
      case 'specSheet':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            {item.hasSpecSheet ? (
              <a href={item.specSheetUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">View</a>
            ) : '—'}
          </td>
        );
      case 'commissionDiscountPercent':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.commissionDiscountPercent ? `${item.commissionDiscountPercent}%` : '—'}</td>;
      case 'commissionDiscountAmount':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.commissionDiscountAmount ? `$${item.commissionDiscountAmount}` : '—'}</td>;
      case 'lineDiscountPercent':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.lineDiscountPercent ? `${item.lineDiscountPercent}%` : '—'}</td>;
      case 'lineDiscountAmount':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.lineDiscountAmount ? `$${item.lineDiscountAmount}` : '—'}</td>;
      case 'leadTime':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.leadTime || '—'}</td>;

      default:
        return <td key={colKey} className="px-3 py-2 text-sm text-center">—</td>;
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
            {/* Add Line Row at the bottom */}
            <tr className="hover:bg-[var(--muted)]/20 transition-colors">
              <td colSpan={getOrderedVisibleColumns().length + 1} className="px-4 py-2">
                <button
                  className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                  onClick={() => addLineItem()}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Line
                </button>
              </td>
            </tr>
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
        overageModalTab={overageModalTab}
        overageInputPercent={overageInputPercent}
        overageInputTargetPrice={overageInputTargetPrice}
        overageInputTargetMargin={overageInputTargetMargin}
        onClose={() => setShowSetOverageModal(false)}
        onSetOverageModalTab={setOverageModalTab}
        onSetOverageInputPercent={setOverageInputPercent}
        onSetOverageInputTargetPrice={setOverageInputTargetPrice}
        onSetOverageInputTargetMargin={setOverageInputTargetMargin}
        onApply={() => setShowSetOverageModal(false)}
      />

      <SetMinOverageModal
        show={showMinOverageModal}
        quoteLineItems={quoteLineItems}
        selectedLineItems={selectedLineItems}
        minOverageInput={minOverageInput}
        onClose={() => setShowMinOverageModal(false)}
        onSetMinOverageInput={setMinOverageInput}
        onApply={() => setShowMinOverageModal(false)}
      />

      <AutoCalcOverageModal
        show={showAutoCalcModal}
        quoteLineItems={quoteLineItems}
        autoCalcMode={autoCalcMode}
        autoCalcTargetOverage={autoCalcTargetOverage}
        autoCalcTargetCommission={autoCalcTargetCommission}
        onClose={() => setShowAutoCalcModal(false)}
        onSetAutoCalcMode={setAutoCalcMode}
        onSetAutoCalcTargetOverage={setAutoCalcTargetOverage}
        onSetAutoCalcTargetCommission={setAutoCalcTargetCommission}
        onApply={() => setShowAutoCalcModal(false)}
      />

      <SetEndUserModal
        show={showSetEndUserModal}
        selectedQuote={selectedQuote}
        selectedLineItems={selectedLineItems}
        selectedEndUser={selectedEndUser}
        availableEndUsers={availableEndUsers}
        onClose={() => setShowSetEndUserModal(false)}
        onSetSelectedEndUser={setSelectedEndUser}
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
