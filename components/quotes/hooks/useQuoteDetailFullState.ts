'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { LineItem, Section, Recipient, DistributorQuote, SavedView, QuoteFile } from '../types';
import type { Submittal } from '../../../lib/types/submittals';
import { mockLineItems, mockSections, mockQuoteFiles, initialProductCatalog, availableOutsideReps, availableInsideReps } from '../data';
import { defaultPriceLevels, lostReasonOptions, defaultSavedViews, priceLevelColors } from '../config';
import { mockSubmittals } from '../../../lib/data/submittals-mock';

export type ColumnKey = 'partNumber' | 'customerPartNumber' | 'description' | 'manufacturer' | 'quantity' | 'uom' | 'divisor' | 'unitPrice' | 'endUser' | 'sellTotal' | 'commissionPercent' | 'commission' | 'commissionTotal' | 'linkedOrder' | 'overage' | 'overageAmt' | 'commRate' | 'baseComm' | 'overageShare' | 'overageComm' | 'totalEarn' | 'effRate' | 'l1' | 'l2' | 'l3' | 'trend' | 'specSheet' | 'outsideReps' | 'commissionDiscountPercent' | 'commissionDiscountAmount' | 'lineDiscountPercent' | 'lineDiscountAmount' | 'leadTime';

export const columnDefinitions: { key: ColumnKey; label: string; group: string }[] = [
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

export function useQuoteDetailFullState(selectedQuoteId: string | null) {
  // Tab state
  const [detailTab, setDetailTab] = useState<'lines' | 'approvals' | 'recipients' | 'distributors' | 'linkedObjects' | 'versions' | 'notes' | 'tasks' | 'activity' | 'settings' | 'submittals'>('lines');

  // Submittal states
  const [showApprovalRequestModal, setShowApprovalRequestModal] = useState(false);
  const [showCreateSubmittalModal, setShowCreateSubmittalModal] = useState(false);
  const [submittals, setSubmittals] = useState<Submittal[]>(mockSubmittals);
  const [editingSubmittalId, setEditingSubmittalId] = useState<string | null>(null);
  const [showSubmittalConfigModal, setShowSubmittalConfigModal] = useState(false);
  const [selectedSubmittalForDetail, setSelectedSubmittalForDetail] = useState<Submittal | null>(null);
  const [printSubmittal, setPrintSubmittal] = useState<Submittal | null>(null);

  // PDF and email states
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [selectedManufacturerForApproval, setSelectedManufacturerForApproval] = useState<string | null>(null);
  const [pdfTemplate, setPdfTemplate] = useState({
    companyLogo: true,
    companyName: 'FlowConnect Lighting',
    companyAddress: '123 Main Street, Suite 400\nAnytown, ST 12345',
    includeProjectDetails: true,
    includeProductList: true,
    includeSpecSheets: true,
    includeJustification: true,
    headerText: 'Manufacturer Approval Request',
    footerText: 'Thank you for your consideration. Please respond within 5 business days.',
    customMessage: '',
  });
  const [generatedPdfData, setGeneratedPdfData] = useState<{
    manufacturer: string;
    builder: string;
    project: string;
    products: { sku: string; description: string; qty: number; value: number }[];
    justification: string;
    totalValue: number;
  } | null>(null);

  // Quote files
  const [quoteFiles, setQuoteFiles] = useState<QuoteFile[]>(mockQuoteFiles);
  const [specSheetSelections, setSpecSheetSelections] = useState<Set<string>>(new Set());

  // Distributor states
  const [showMarkApprovalModal, setShowMarkApprovalModal] = useState(false);
  const [showDistributorModal, setShowDistributorModal] = useState(false);
  const [selectedDistributorQuote, setSelectedDistributorQuote] = useState<DistributorQuote | null>(null);

  // Section states
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showCreatePdfModal, setShowCreatePdfModal] = useState(false);

  // Line item selection
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set());
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showViewsMenu, setShowViewsMenu] = useState(false);

  // Lost reason states
  const [lostReason, setLostReason] = useState('');
  const [customLostReason, setCustomLostReason] = useState('');
  const [lostReasons, setLostReasons] = useState(lostReasonOptions);
  const [showAddReasonInput, setShowAddReasonInput] = useState(false);
  const [newReasonText, setNewReasonText] = useState('');

  // Price levels
  const [quotePriceLevels, setQuotePriceLevels] = useState(defaultPriceLevels);

  // End user settings
  const [showEndUserPerLine, setShowEndUserPerLine] = useState(false);
  const [showSetEndUserModal, setShowSetEndUserModal] = useState(false);
  const [selectedEndUser, setSelectedEndUser] = useState('');
  const [headerEndUser, setHeaderEndUser] = useState('');
  const [endUserSameAsCustomer, setEndUserSameAsCustomer] = useState(true);

  // Customer part number source
  const [customerPartNumberSource, setCustomerPartNumberSource] = useState<'soldTo' | 'endUser'>('soldTo');

  // View mode
  const [quoteViewMode, setQuoteViewMode] = useState<'overage' | 'simple'>('simple');
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);

  // Sections
  const [showSections, setShowSections] = useState(false);
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [sectionDisplayMode, setSectionDisplayMode] = useState<'column' | 'lineShelf'>('column');

  // Commission splits
  const [showCommissionSplits, setShowCommissionSplits] = useState(false);
  const [showCommissionSplitsModal, setShowCommissionSplitsModal] = useState(false);
  const [commissionSplitsModalItem, setCommissionSplitsModalItem] = useState<LineItem | null>(null);
  const [applyToAllLines, setApplyToAllLines] = useState(false);

  // Quote-level rep splits
  const [quoteOutsideRep, setQuoteOutsideRep] = useState<string>('');
  const [splitCommission, setSplitCommission] = useState(false);
  const [showRepSplitsModal, setShowRepSplitsModal] = useState(false);
  const [repCommissionSplits, setRepCommissionSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);
  const [quoteInsideRep, setQuoteInsideRep] = useState<string>('');
  const [splitInsideCommission, setSplitInsideCommission] = useState(false);
  const [showInsideRepSplitsModal, setShowInsideRepSplitsModal] = useState(false);
  const [insideRepCommissionSplits, setInsideRepCommissionSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  // Line item rep splits
  const [lineItemRepDropdown, setLineItemRepDropdown] = useState<string | null>(null);
  const [lineItemRepSearch, setLineItemRepSearch] = useState('');
  const [showLineItemRepSplitsModal, setShowLineItemRepSplitsModal] = useState(false);
  const [lineItemRepSplitsTarget, setLineItemRepSplitsTarget] = useState<string | null>(null);
  const [lineItemRepSplits, setLineItemRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);
  const [showInsideRepSplits, setShowInsideRepSplits] = useState(false);
  const [lineItemInsideRepDropdown, setLineItemInsideRepDropdown] = useState<string | null>(null);
  const [lineItemInsideRepSearch, setLineItemInsideRepSearch] = useState('');
  const [showLineItemInsideRepSplitsModal, setShowLineItemInsideRepSplitsModal] = useState(false);
  const [lineItemInsideRepSplitsTarget, setLineItemInsideRepSplitsTarget] = useState<string | null>(null);
  const [lineItemInsideRepSplits, setLineItemInsideRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  // Line details modal
  const [showLineDetailsModal, setShowLineDetailsModal] = useState(false);
  const [lineDetailsModalItem, setLineDetailsModalItem] = useState<LineItem | null>(null);

  // Admin settings
  const [adminShowSalesCredit, setAdminShowSalesCredit] = useState(false);

  // Header dropdowns
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // Modal states
  const [showDuplicateQuoteModal, setShowDuplicateQuoteModal] = useState(false);
  const [showCreateOrderFromQuoteModal, setShowCreateOrderFromQuoteModal] = useState(false);
  const [duplicateQuoteNumber, setDuplicateQuoteNumber] = useState('');
  const [duplicateCustomer, setDuplicateCustomer] = useState('');
  const [duplicatePercentIncrease, setDuplicatePercentIncrease] = useState(0);
  const [duplicateCopyNotes, setDuplicateCopyNotes] = useState(true);
  const [createOrderSelectAll, setCreateOrderSelectAll] = useState(true);
  const [createOrderSelectedItems, setCreateOrderSelectedItems] = useState<{id: string; selected: boolean; quantity: number}[]>([]);

  // Product catalog
  const [productCatalog, setProductCatalog] = useState(initialProductCatalog);
  const [productSearchOpen, setProductSearchOpen] = useState<string | null>(null);
  const [productSearchField, setProductSearchField] = useState<'partNumber' | 'customerPartNumber' | 'description' | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProductData, setNewProductData] = useState({ partNumber: '', description: '', manufacturer: '', basePrice: 0 });
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [createProductForLineItem, setCreateProductForLineItem] = useState<string | null>(null);
  const [createProductInitialData, setCreateProductInitialData] = useState({ partNumber: '', description: '' });
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(['partNumber', 'customerPartNumber', 'description', 'manufacturer', 'quantity', 'uom', 'divisor', 'unitPrice', 'sellTotal', 'commissionPercent', 'commission', 'commissionTotal', 'overage', 'overageAmt', 'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate', 'outsideReps']));
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>([
    'partNumber', 'customerPartNumber', 'description', 'manufacturer', 'quantity', 'uom', 'divisor', 'unitPrice', 'endUser',
    'sellTotal', 'commissionPercent', 'commission', 'commissionTotal', 'linkedOrder',
    'overage', 'overageAmt',
    'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate', 'outsideReps',
    'l1', 'l2', 'l3',
    'commissionDiscountPercent', 'commissionDiscountAmount', 'lineDiscountPercent', 'lineDiscountAmount',
    'leadTime', 'trend', 'specSheet'
  ]);
  const [draggingColumn, setDraggingColumn] = useState<ColumnKey | null>(null);
  const [repSplitModalItem, setRepSplitModalItem] = useState<LineItem | null>(null);

  // Manufacturer search
  const [manufacturerDropdown, setManufacturerDropdown] = useState<string | null>(null);
  const [manufacturerSearch, setManufacturerSearch] = useState('');

  // Saved views
  const [savedViews, setSavedViews] = useState<SavedView[]>(defaultSavedViews);
  const [activeView, setActiveView] = useState('earnings');
  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // Simple view columns
  const [simpleViewColumns, setSimpleViewColumns] = useState<Set<ColumnKey>>(new Set(['partNumber', 'customerPartNumber', 'description', 'manufacturer', 'quantity', 'uom', 'divisor', 'unitPrice', 'sellTotal', 'commissionPercent', 'commission', 'commissionTotal', 'linkedOrder']));
  const effectiveVisibleColumns = quoteViewMode === 'simple' ? simpleViewColumns : visibleColumns;

  // Overage modals
  const [showSetOverageModal, setShowSetOverageModal] = useState(false);
  const [overageModalTab, setOverageModalTab] = useState<'percentage' | 'targetPrice' | 'targetMargin'>('percentage');
  const [overageInputPercent, setOverageInputPercent] = useState('10');
  const [overageInputTargetPrice, setOverageInputTargetPrice] = useState('');
  const [overageInputTargetMargin, setOverageInputTargetMargin] = useState('');
  const [showCopyPriceModal, setShowCopyPriceModal] = useState<'l1' | 'l2' | 'l3' | null>(null);
  const [showPriceLookupModal, setShowPriceLookupModal] = useState<string | null>(null);
  const [priceLookupTargetPrice, setPriceLookupTargetPrice] = useState('');
  const [expandedLineItems, setExpandedLineItems] = useState<Set<string>>(new Set());
  const [showOverageCalculator, setShowOverageCalculator] = useState(false);
  const [sidebarTargetSell, setSidebarTargetSell] = useState('');
  const [sidebarTargetOveragePercent, setSidebarTargetOveragePercent] = useState('');
  const [sidebarTargetOverageAmount, setSidebarTargetOverageAmount] = useState('');
  const [showMinOverageModal, setShowMinOverageModal] = useState(false);
  const [minOverageInput, setMinOverageInput] = useState('');
  const [showAutoCalcModal, setShowAutoCalcModal] = useState(false);
  const [autoCalcMode, setAutoCalcMode] = useState<'overage' | 'commission'>('overage');
  const [autoCalcTargetOverage, setAutoCalcTargetOverage] = useState('');
  const [autoCalcTargetCommission, setAutoCalcTargetCommission] = useState('');

  // Save/revert
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showConvertToOrderModal, setShowConvertToOrderModal] = useState(false);
  const [showQuotePdfPreview, setShowQuotePdfPreview] = useState(false);

  // Field editing
  const [editingField, setEditingField] = useState<'billTo' | 'soldTo' | 'job' | null>(null);
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');

  // Recipient
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [recipientQuoteVersion, setRecipientQuoteVersion] = useState(1);
  const [showCompareView, setShowCompareView] = useState(false);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  // Summary and header
  const [showSummaryBar, setShowSummaryBar] = useState(true);
  const [showHeaderFields, setShowHeaderFields] = useState(true);

  // Line items table
  const [sortColumn, setSortColumn] = useState<ColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<ColumnKey | null>(null);
  const [editingCell, setEditingCell] = useState<{ itemId: string; column: ColumnKey } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Line items and sections
  const [quoteLineItems, setQuoteLineItems] = useState<LineItem[]>([]);
  const [quoteSections, setQuoteSections] = useState<Section[]>(mockSections);

  // Sync line items when quote changes
  useEffect(() => {
    if (selectedQuoteId) {
      setQuoteLineItems(mockLineItems.filter(li => li.quoteId === selectedQuoteId));
    } else {
      setQuoteLineItems([]);
    }
  }, [selectedQuoteId]);

  // Close product search dropdown when clicking outside
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

  // Close line item rep dropdown when clicking outside
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

  // Toggle column
  const toggleColumn = useCallback((col: ColumnKey) => {
    if (quoteViewMode === 'simple') {
      setSimpleViewColumns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(col)) {
          newSet.delete(col);
        } else {
          newSet.add(col);
        }
        return newSet;
      });
    } else {
      setVisibleColumns(prev => {
        const newSet = new Set(prev);
        if (newSet.has(col)) {
          newSet.delete(col);
        } else {
          newSet.add(col);
        }
        return newSet;
      });
    }
    setActiveView('custom');
  }, [quoteViewMode]);

  // Column drag handlers
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

  // View functions
  const applyView = useCallback((viewId: string) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      setVisibleColumns(new Set(view.columns as ColumnKey[]));
      setActiveView(viewId);
    }
    setShowViewsMenu(false);
  }, [savedViews]);

  const saveCurrentView = useCallback(() => {
    if (newViewName.trim()) {
      const newView: SavedView = {
        id: `custom-${Date.now()}`,
        name: newViewName.trim(),
        columns: Array.from(visibleColumns) as ColumnKey[],
      };
      setSavedViews(prev => [...prev, newView]);
      setActiveView(newView.id);
      setNewViewName('');
      setShowSaveViewModal(false);
    }
  }, [newViewName, visibleColumns]);

  const deleteView = useCallback((viewId: string) => {
    if (['default', 'compact', 'pricing', 'approval'].includes(viewId)) return;
    setSavedViews(prev => prev.filter(v => v.id !== viewId));
    if (activeView === viewId) {
      applyView('default');
    }
  }, [activeView, applyView]);

  // Product functions
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
    if (newProductData.partNumber && newProductData.description) {
      const newProduct = {
        id: `prod-${Date.now()}`,
        ...newProductData
      };
      setProductCatalog(prev => [...prev, newProduct]);
      setNewProductData({ partNumber: '', description: '', manufacturer: '', basePrice: 0 });
      setShowCreateProduct(false);
    }
  }, [newProductData]);

  // Sort and filter
  const handleSort = useCallback((column: ColumnKey) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const handleFilterChange = useCallback((column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  }, []);

  // Editing functions
  const startEditing = useCallback((itemId: string, column: ColumnKey, currentValue: string) => {
    setEditingCell({ itemId, column });
    setEditValue(currentValue);
  }, []);

  const getItemValue = useCallback((item: LineItem, column: ColumnKey): string => {
    switch (column) {
      case 'unitPrice': return item.sellPrice.toFixed(2);
      case 'overage': return item.overagePercent.toFixed(1);
      case 'l1': return item.level1Price.toFixed(2);
      case 'l2': return item.level2Price.toFixed(2);
      case 'quantity': return String(item.quantity);
      case 'partNumber': return item.productNumber;
      case 'description': return item.description;
      default: return '';
    }
  }, []);

  // Totals calculation
  const totals = useMemo(() => {
    const baseTotal = quoteLineItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
    const sellTotal = quoteLineItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    const l1Total = quoteLineItems.reduce((sum, item) => sum + (item.level1Price * item.quantity), 0);
    const l2Total = quoteLineItems.reduce((sum, item) => sum + (item.level2Price * item.quantity), 0);
    const l3Total = quoteLineItems.reduce((sum, item) => sum + (item.level3Price * item.quantity), 0);
    const overage = sellTotal - baseTotal;
    // Calculate commission from manufacturer commission rates
    const commission = quoteLineItems.reduce((sum, item) => {
      const commRate = item.manufacturers?.[0]?.commissionRate || 0;
      return sum + (item.sellPrice * item.quantity * commRate / 100);
    }, 0);
    return { baseTotal, sellTotal, l1Total, l2Total, l3Total, overage, commission };
  }, [quoteLineItems]);

  return {
    // Tab
    detailTab, setDetailTab,

    // Submittals
    showApprovalRequestModal, setShowApprovalRequestModal,
    showCreateSubmittalModal, setShowCreateSubmittalModal,
    submittals, setSubmittals,
    editingSubmittalId, setEditingSubmittalId,
    showSubmittalConfigModal, setShowSubmittalConfigModal,
    selectedSubmittalForDetail, setSelectedSubmittalForDetail,
    printSubmittal, setPrintSubmittal,

    // PDF/Email
    showPdfPreviewModal, setShowPdfPreviewModal,
    showEditTemplateModal, setShowEditTemplateModal,
    showSendEmailModal, setShowSendEmailModal,
    selectedManufacturerForApproval, setSelectedManufacturerForApproval,
    pdfTemplate, setPdfTemplate,
    generatedPdfData, setGeneratedPdfData,

    // Files
    quoteFiles, setQuoteFiles,
    specSheetSelections, setSpecSheetSelections,

    // Distributor
    showMarkApprovalModal, setShowMarkApprovalModal,
    showDistributorModal, setShowDistributorModal,
    selectedDistributorQuote, setSelectedDistributorQuote,

    // Sections
    collapsedSections, setCollapsedSections,
    showCreatePdfModal, setShowCreatePdfModal,

    // Line item selection
    selectedLineItems, setSelectedLineItems,
    showBulkActionsMenu, setShowBulkActionsMenu,
    showColumnsMenu, setShowColumnsMenu,
    showViewsMenu, setShowViewsMenu,

    // Lost reason
    lostReason, setLostReason,
    customLostReason, setCustomLostReason,
    lostReasons, setLostReasons,
    showAddReasonInput, setShowAddReasonInput,
    newReasonText, setNewReasonText,

    // Price levels
    quotePriceLevels, setQuotePriceLevels,
    priceLevelColors,

    // End user
    showEndUserPerLine, setShowEndUserPerLine,
    showSetEndUserModal, setShowSetEndUserModal,
    selectedEndUser, setSelectedEndUser,
    headerEndUser, setHeaderEndUser,
    endUserSameAsCustomer, setEndUserSameAsCustomer,

    // CPN source
    customerPartNumberSource, setCustomerPartNumberSource,

    // View mode
    quoteViewMode, setQuoteViewMode,
    showViewModeDropdown, setShowViewModeDropdown,

    // Sections settings
    showSections, setShowSections,
    showSectionsModal, setShowSectionsModal,
    sectionDisplayMode, setSectionDisplayMode,

    // Commission splits
    showCommissionSplits, setShowCommissionSplits,
    showCommissionSplitsModal, setShowCommissionSplitsModal,
    commissionSplitsModalItem, setCommissionSplitsModalItem,
    applyToAllLines, setApplyToAllLines,

    // Rep splits
    quoteOutsideRep, setQuoteOutsideRep,
    splitCommission, setSplitCommission,
    showRepSplitsModal, setShowRepSplitsModal,
    repCommissionSplits, setRepCommissionSplits,
    quoteInsideRep, setQuoteInsideRep,
    splitInsideCommission, setSplitInsideCommission,
    showInsideRepSplitsModal, setShowInsideRepSplitsModal,
    insideRepCommissionSplits, setInsideRepCommissionSplits,

    // Line item reps
    lineItemRepDropdown, setLineItemRepDropdown,
    lineItemRepSearch, setLineItemRepSearch,
    showLineItemRepSplitsModal, setShowLineItemRepSplitsModal,
    lineItemRepSplitsTarget, setLineItemRepSplitsTarget,
    lineItemRepSplits, setLineItemRepSplits,
    showInsideRepSplits, setShowInsideRepSplits,
    lineItemInsideRepDropdown, setLineItemInsideRepDropdown,
    lineItemInsideRepSearch, setLineItemInsideRepSearch,
    showLineItemInsideRepSplitsModal, setShowLineItemInsideRepSplitsModal,
    lineItemInsideRepSplitsTarget, setLineItemInsideRepSplitsTarget,
    lineItemInsideRepSplits, setLineItemInsideRepSplits,

    // Line details
    showLineDetailsModal, setShowLineDetailsModal,
    lineDetailsModalItem, setLineDetailsModalItem,

    // Admin
    adminShowSalesCredit, setAdminShowSalesCredit,

    // Header dropdowns
    showStageDropdown, setShowStageDropdown,
    showTypeDropdown, setShowTypeDropdown,
    showVersionDropdown, setShowVersionDropdown,
    showActionsDropdown, setShowActionsDropdown,

    // Modals
    showDuplicateQuoteModal, setShowDuplicateQuoteModal,
    showCreateOrderFromQuoteModal, setShowCreateOrderFromQuoteModal,
    duplicateQuoteNumber, setDuplicateQuoteNumber,
    duplicateCustomer, setDuplicateCustomer,
    duplicatePercentIncrease, setDuplicatePercentIncrease,
    duplicateCopyNotes, setDuplicateCopyNotes,
    createOrderSelectAll, setCreateOrderSelectAll,
    createOrderSelectedItems, setCreateOrderSelectedItems,

    // Products
    productCatalog, setProductCatalog,
    productSearchOpen, setProductSearchOpen,
    productSearchField, setProductSearchField,
    productSearchQuery, setProductSearchQuery,
    showCreateProduct, setShowCreateProduct,
    newProductData, setNewProductData,
    showCreateProductModal, setShowCreateProductModal,
    createProductForLineItem, setCreateProductForLineItem,
    createProductInitialData, setCreateProductInitialData,
    dropdownPosition, setDropdownPosition,
    productDropdownRef,
    getFilteredProducts,
    handleAddProduct,

    // Columns
    visibleColumns, setVisibleColumns,
    columnOrder, setColumnOrder,
    draggingColumn, setDraggingColumn,
    repSplitModalItem, setRepSplitModalItem,
    simpleViewColumns, setSimpleViewColumns,
    effectiveVisibleColumns,
    toggleColumn,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragEnd,
    getOrderedVisibleColumns,
    getColumnOrder,

    // Manufacturer
    manufacturerDropdown, setManufacturerDropdown,
    manufacturerSearch, setManufacturerSearch,

    // Views
    savedViews, setSavedViews,
    activeView, setActiveView,
    showSaveViewModal, setShowSaveViewModal,
    newViewName, setNewViewName,
    applyView,
    saveCurrentView,
    deleteView,

    // Overage
    showSetOverageModal, setShowSetOverageModal,
    overageModalTab, setOverageModalTab,
    overageInputPercent, setOverageInputPercent,
    overageInputTargetPrice, setOverageInputTargetPrice,
    overageInputTargetMargin, setOverageInputTargetMargin,
    showCopyPriceModal, setShowCopyPriceModal,
    showPriceLookupModal, setShowPriceLookupModal,
    priceLookupTargetPrice, setPriceLookupTargetPrice,
    expandedLineItems, setExpandedLineItems,
    showOverageCalculator, setShowOverageCalculator,
    sidebarTargetSell, setSidebarTargetSell,
    sidebarTargetOveragePercent, setSidebarTargetOveragePercent,
    sidebarTargetOverageAmount, setSidebarTargetOverageAmount,
    showMinOverageModal, setShowMinOverageModal,
    minOverageInput, setMinOverageInput,
    showAutoCalcModal, setShowAutoCalcModal,
    autoCalcMode, setAutoCalcMode,
    autoCalcTargetOverage, setAutoCalcTargetOverage,
    autoCalcTargetCommission, setAutoCalcTargetCommission,

    // Save/revert
    showSaveDropdown, setShowSaveDropdown,
    showRevertModal, setShowRevertModal,
    showCreditModal, setShowCreditModal,
    showConvertToOrderModal, setShowConvertToOrderModal,
    showQuotePdfPreview, setShowQuotePdfPreview,

    // Field editing
    editingField, setEditingField,
    fieldSearchQuery, setFieldSearchQuery,

    // Recipient
    selectedRecipient, setSelectedRecipient,
    recipientQuoteVersion, setRecipientQuoteVersion,
    showCompareView, setShowCompareView,
    showRecipientDropdown, setShowRecipientDropdown,

    // Summary/header
    showSummaryBar, setShowSummaryBar,
    showHeaderFields, setShowHeaderFields,

    // Table state
    sortColumn, setSortColumn,
    sortDirection, setSortDirection,
    columnFilters, setColumnFilters,
    activeFilterColumn, setActiveFilterColumn,
    editingCell, setEditingCell,
    editValue, setEditValue,
    editInputRef,
    handleSort,
    handleFilterChange,
    startEditing,
    getItemValue,

    // Line items
    quoteLineItems, setQuoteLineItems,
    quoteSections, setQuoteSections,
    totals,

    // Available data
    availableOutsideReps,
    availableInsideReps,
  };
}
