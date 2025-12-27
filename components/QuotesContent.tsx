'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdvancedFilters from './AdvancedFilters';
import {
  mockSubmittals,
  submittalStatusLabels,
  submittalStatusColors,
  matchStatusLabels,
  matchStatusColors,
} from '../lib/data/submittals-mock';
import type { Submittal, SubmittalItem, SubmittalConfig, SubmittalStakeholder } from '../lib/types/submittals';
import { defaultSubmittalConfig } from '../lib/types/submittals';
import CreateSubmittalModal, { QuoteRecipient, QuoteLineItem } from './submittals/CreateSubmittalModal';
import PrintSubmittalDialog, { PrintSettings } from './submittals/PrintSubmittalDialog';
import SubmittalDetailPanel from './submittals/SubmittalDetailPanel';
import CreditModal from './CreditModal';
import ConvertQuoteToOrderModal from './orders/ConvertQuoteToOrderModal';
import type { Order } from '../lib/types/rms';
import { mockOrders } from '../lib/data/rms-mock';
import QuotePdfPreviewModal from './quotes/QuotePdfPreviewModal';
import CreateProductModal from './quotes/CreateProductModal';
import type { QuoteData } from '../lib/utils/generatePdfFromTemplate';

// Import types from quotes module
import type {
  Factory,
  Rep,
  EndUser,
  Quote,
  OutsideRepSplit,
  InsideRepSplit,
  LineItem,
  QuoteFile,
  Section,
  BuilderApproval,
  ApprovalRequest,
  Manufacturer,
  PriceCategory,
  DistributorMatrixEntry,
  DistributorQuote,
  Recipient,
  DistributorQuoteLine,
  CrossAuditLog,
  SavedView,
} from './quotes/types';

// Import mock data from quotes module
import {
  mockQuotes,
  mockSections,
  mockLineItems,
  mockBuilderApprovals,
  mockApprovalRequests,
  mockManufacturers,
  mockPriceCategories,
  mockDistributorMatrix,
  mockQuoteFiles,
  mockLinkedPreOpps,
  mockLinkedOrders,
  mockLinkedInvoices,
  mockLinkedCommissionStatements,
  mockLinkedContacts,
  mockLinkedCompanies,
  mockLinkedTags,
  mockDistributorQuotes,
  mockDistributorQuoteLines,
  mockCrossAuditLog,
  availableOutsideReps,
  availableInsideReps,
  availableEndUsers,
  availableManufacturers,
  initialProductCatalog,
} from './quotes/data';

// Import modal components from quotes module
import { SubmittalConfigModal } from './quotes/modals/SubmittalConfigModal';
import { RepSplitModal } from './quotes/modals/RepSplitModal';
import { CommissionSplitsModal } from './quotes/modals/CommissionSplitsModal';
import { SectionsSettingsModal } from './quotes/modals/SectionsSettingsModal';
import { GenericRepSplitsModal } from './quotes/modals/GenericRepSplitsModal';
import { DuplicateQuoteModal } from './quotes/modals/DuplicateQuoteModal';
import { MarkAsLostModal } from './quotes/modals/MarkAsLostModal';
import { SetOverageModal } from './quotes/modals/SetOverageModal';
import { SetMinOverageModal } from './quotes/modals/SetMinOverageModal';
import { AutoCalcOverageModal } from './quotes/modals/AutoCalcOverageModal';
import { SetEndUserModal } from './quotes/modals/SetEndUserModal';
import { CopyPriceModal } from './quotes/modals/CopyPriceModal';
import { PriceLookupModal } from './quotes/modals/PriceLookupModal';
import { SaveViewModal } from './quotes/modals/SaveViewModal';
import { CreateOrderFromQuoteModal } from './quotes/modals/CreateOrderFromQuoteModal';
import { ColumnsConfigModal } from './quotes/modals/ColumnsConfigModal';
import { PdfPreviewModal } from './quotes/modals/PdfPreviewModal';
import { EditTemplateModal } from './quotes/modals/EditTemplateModal';
import { SendEmailModal } from './quotes/modals/SendEmailModal';
import { MarkApprovalStatusModal } from './quotes/modals/MarkApprovalStatusModal';
import { RevertVersionModal } from './quotes/modals/RevertVersionModal';
import { GenerateDistributorQuotesModal } from './quotes/modals/GenerateDistributorQuotesModal';
import { DistributorQuoteDetailModal } from './quotes/modals/DistributorQuoteDetailModal';
import { RecipientQuoteDetailModal } from './quotes/modals/RecipientQuoteDetailModal';
import { LineItemDetailsModal } from './quotes/modals/LineItemDetailsModal';
import { ApprovalRequestModal } from './quotes/modals/ApprovalRequestModal';

// Import UI components from quotes module
import {
  Sparkline,
  WinProbabilityBadge,
  ApprovalStatusBadge,
  QuoteCard,
  SortableQuoteCard,
  LineApprovalIcon,
  QuotesListHeader,
  QuotesKanbanView,
  QuotesListView,
  QuoteDetailHeader,
  PricingSummaryBar,
  HeaderFieldsSection,
  QuoteDetailTabs,
  QuoteDetailModals,
} from './quotes/components';

// Import config from quotes module
import {
  priceLevelColors,
  defaultPriceLevels,
  lostReasonOptions,
  defaultSavedViews,
} from './quotes/config';

// Import utility functions from quotes module
import {
  getStageColor,
  isQuoteLinked,
  getQuoteLinkedReason,
} from './quotes/utils';

// Import hooks from quotes module
import {
  useQuotesListFilters,
  useKanbanDnD,
} from './quotes/hooks';
import type { QuoteSortKey, QuickDatePreset, QuickDateField, QuoteFilterValue } from './quotes/hooks';

// Import tab components from quotes module
import {
  NotesTab,
  TasksTab,
  ActivityTab,
  VersionsTab,
  LinkedObjectsTab,
  SubmittalsTab,
  SettingsTab,
  ApprovalsTab,
  RecipientsTab,
  LinesTab,
} from './quotes/tabs';

// ============================================
// MAIN COMPONENT
// ============================================

export default function QuotesContent() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Kanban drag-and-drop state (from hook)
  const {
    activeId,
    sensors,
    stages,
    getQuotesByStage,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    activeQuote,
    quotesByStage,
  } = useKanbanDnD(quotes, setQuotes);
  const [detailTab, setDetailTab] = useState<'lines' | 'approvals' | 'recipients' | 'distributors' | 'linkedObjects' | 'versions' | 'notes' | 'tasks' | 'activity' | 'settings' | 'submittals'>('lines');
  const [showApprovalRequestModal, setShowApprovalRequestModal] = useState(false);
  const [showCreateSubmittalModal, setShowCreateSubmittalModal] = useState(false);
  const [submittals, setSubmittals] = useState<Submittal[]>(mockSubmittals);
  const [editingSubmittalId, setEditingSubmittalId] = useState<string | null>(null);
  const [showSubmittalConfigModal, setShowSubmittalConfigModal] = useState(false);
  const [selectedSubmittalForDetail, setSelectedSubmittalForDetail] = useState<Submittal | null>(null);

  // PDF and email states for approval requests
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

  // Quote files state
  const [quoteFiles, setQuoteFiles] = useState<QuoteFile[]>(mockQuoteFiles);

  // Spec sheet selections (line item ID -> include in email)
  const [specSheetSelections, setSpecSheetSelections] = useState<Set<string>>(new Set());
  const [showMarkApprovalModal, setShowMarkApprovalModal] = useState(false);
  const [showDistributorModal, setShowDistributorModal] = useState(false);
  const [selectedDistributorQuote, setSelectedDistributorQuote] = useState<DistributorQuote | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showCreatePdfModal, setShowCreatePdfModal] = useState(false);
  const [printSubmittal, setPrintSubmittal] = useState<Submittal | null>(null);
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set());
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showViewsMenu, setShowViewsMenu] = useState(false);

  // Bulk actions for quotes list
  const [selectedQuotesForBulk, setSelectedQuotesForBulk] = useState<Set<string>>(new Set());
  const [showQuotesBulkActionsMenu, setShowQuotesBulkActionsMenu] = useState(false);
  const [showMarkAsLostModal, setShowMarkAsLostModal] = useState(false);

  // Quotes list filtering and sorting (from hook)
  const {
    sortedQuotes,
    quotesSortColumn,
    quotesSortDirection,
    handleQuotesSort,
    quickDatePreset,
    setQuickDatePreset,
    quickDateField,
    setQuickDateField,
    showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown,
    quoteColumnFilters,
    activeQuoteFilterColumn,
    setActiveQuoteFilterColumn,
    filterSearchText,
    setFilterSearchText,
    handleQuoteFilterChange,
    clearQuoteFilter,
    getUniqueValuesForColumn,
    getFilterType,
    hasActiveFilter,
  } = useQuotesListFilters(quotes);

  const [lostReason, setLostReason] = useState('');
  const [customLostReason, setCustomLostReason] = useState('');
  const [lostReasons, setLostReasons] = useState(lostReasonOptions);
  const [showAddReasonInput, setShowAddReasonInput] = useState(false);
  const [newReasonText, setNewReasonText] = useState('');

  // Quote settings - price level percentages (dynamic array, initial values from config)
  const [quotePriceLevels, setQuotePriceLevels] = useState(defaultPriceLevels);

  // Colors for price levels imported from ./quotes/config

  // Quote settings - show end user per line
  const [showEndUserPerLine, setShowEndUserPerLine] = useState(false);
  const [showSetEndUserModal, setShowSetEndUserModal] = useState(false);
  const [selectedEndUser, setSelectedEndUser] = useState('');

  // Header-level end user (used when not per-line)
  const [headerEndUser, setHeaderEndUser] = useState('');
  const [endUserSameAsCustomer, setEndUserSameAsCustomer] = useState(true);

  // Customer Part Number source - 'soldTo' or 'endUser'
  const [customerPartNumberSource, setCustomerPartNumberSource] = useState<'soldTo' | 'endUser'>('soldTo');

  // Quote view mode - 'overage' (full) or 'simple' (basic pricing only)
  const [quoteViewMode, setQuoteViewMode] = useState<'overage' | 'simple'>('simple');
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);

  // Sections visibility and settings
  const [showSections, setShowSections] = useState(false);
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [sectionDisplayMode, setSectionDisplayMode] = useState<'column' | 'lineShelf'>('column');

  // Commission splits settings
  const [showCommissionSplits, setShowCommissionSplits] = useState(false);
  const [showCommissionSplitsModal, setShowCommissionSplitsModal] = useState(false);
  const [commissionSplitsModalItem, setCommissionSplitsModalItem] = useState<LineItem | null>(null);
  const [applyToAllLines, setApplyToAllLines] = useState(false);

  // Quote-level outside rep commission splits
  const [quoteOutsideRep, setQuoteOutsideRep] = useState<string>('');
  const [splitCommission, setSplitCommission] = useState(false);
  const [showRepSplitsModal, setShowRepSplitsModal] = useState(false);
  const [repCommissionSplits, setRepCommissionSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  // Quote-level inside rep commission splits
  const [quoteInsideRep, setQuoteInsideRep] = useState<string>('');
  const [splitInsideCommission, setSplitInsideCommission] = useState(false);
  const [showInsideRepSplitsModal, setShowInsideRepSplitsModal] = useState(false);
  const [insideRepCommissionSplits, setInsideRepCommissionSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  // Line item outside rep splits
  const [lineItemRepDropdown, setLineItemRepDropdown] = useState<string | null>(null);
  const [lineItemRepSearch, setLineItemRepSearch] = useState('');
  const [showLineItemRepSplitsModal, setShowLineItemRepSplitsModal] = useState(false);
  const [lineItemRepSplitsTarget, setLineItemRepSplitsTarget] = useState<string | null>(null);
  const [lineItemRepSplits, setLineItemRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  // Inside rep commission splits settings
  const [showInsideRepSplits, setShowInsideRepSplits] = useState(false);

  // Line item inside rep splits
  const [lineItemInsideRepDropdown, setLineItemInsideRepDropdown] = useState<string | null>(null);
  const [lineItemInsideRepSearch, setLineItemInsideRepSearch] = useState('');
  const [showLineItemInsideRepSplitsModal, setShowLineItemInsideRepSplitsModal] = useState(false);
  const [lineItemInsideRepSplitsTarget, setLineItemInsideRepSplitsTarget] = useState<string | null>(null);
  const [lineItemInsideRepSplits, setLineItemInsideRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  // Line item details modal (for hidden columns in simple view)
  const [showLineDetailsModal, setShowLineDetailsModal] = useState(false);
  const [lineDetailsModalItem, setLineDetailsModalItem] = useState<LineItem | null>(null);

  // Admin setting for sales credit visibility (would come from admin settings in real app)
  const [adminShowSalesCredit, setAdminShowSalesCredit] = useState(false);

  // Dropdown states for stage and version
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);

  // Actions dropdown and modals
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showDuplicateQuoteModal, setShowDuplicateQuoteModal] = useState(false);
  const [showCreateOrderFromQuoteModal, setShowCreateOrderFromQuoteModal] = useState(false);

  // Duplicate quote modal state
  const [duplicateQuoteNumber, setDuplicateQuoteNumber] = useState('');
  const [duplicateCustomer, setDuplicateCustomer] = useState('');
  const [duplicatePercentIncrease, setDuplicatePercentIncrease] = useState(0);
  const [duplicateCopyNotes, setDuplicateCopyNotes] = useState(true);

  // Create order from quote modal state
  const [createOrderSelectAll, setCreateOrderSelectAll] = useState(true);
  const [createOrderSelectedItems, setCreateOrderSelectedItems] = useState<{id: string; selected: boolean; quantity: number}[]>([]);

  // Available end users imported from ./quotes/data

  // Product catalog for searchable part/description fields (initial data imported from ./quotes/data)
  const [productCatalog, setProductCatalog] = useState(initialProductCatalog);

  // Product search state for part number and description dropdowns
  const [productSearchOpen, setProductSearchOpen] = useState<string | null>(null); // lineItemId
  const [productSearchField, setProductSearchField] = useState<'partNumber' | 'customerPartNumber' | 'description' | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProductData, setNewProductData] = useState({ partNumber: '', description: '', manufacturer: '', basePrice: 0 });

  // Create Product Modal state (for creating official products)
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [createProductForLineItem, setCreateProductForLineItem] = useState<string | null>(null);
  const [createProductInitialData, setCreateProductInitialData] = useState({ partNumber: '', description: '' });

  // Product dropdown portal position state
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);

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

  // Column visibility state
  type ColumnKey = 'partNumber' | 'customerPartNumber' | 'description' | 'manufacturer' | 'quantity' | 'uom' | 'divisor' | 'unitPrice' | 'endUser' | 'sellTotal' | 'commissionPercent' | 'commission' | 'commissionTotal' | 'linkedOrder' | 'overage' | 'overageAmt' | 'commRate' | 'baseComm' | 'overageShare' | 'overageComm' | 'totalEarn' | 'effRate' | 'l1' | 'l2' | 'l3' | 'trend' | 'specSheet' | 'outsideReps' | 'commissionDiscountPercent' | 'commissionDiscountAmount' | 'lineDiscountPercent' | 'lineDiscountAmount' | 'leadTime';
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(['partNumber', 'customerPartNumber', 'description', 'manufacturer', 'quantity', 'uom', 'divisor', 'unitPrice', 'sellTotal', 'commissionPercent', 'commission', 'commissionTotal', 'overage', 'overageAmt', 'commRate', 'baseComm', 'overageShare', 'overageComm', 'totalEarn', 'effRate', 'outsideReps']));

  // Column order state for drag-and-drop reordering
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

  // Rep split modal state
  const [repSplitModalItem, setRepSplitModalItem] = useState<LineItem | null>(null);

  // Available reps now imported from ./quotes/data

  // Available manufacturers imported from ./quotes/data

  // Manufacturer search state
  const [manufacturerDropdown, setManufacturerDropdown] = useState<string | null>(null);
  const [manufacturerSearch, setManufacturerSearch] = useState('');

  // Saved views (initial values from config)
  const [savedViews, setSavedViews] = useState(defaultSavedViews);
  const [activeView, setActiveView] = useState('earnings');
  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');

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

  const toggleColumn = (col: ColumnKey) => {
    if (quoteViewMode === 'simple') {
      // In simple view, toggle simpleViewColumns
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
      // In overage view, toggle visibleColumns
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
  };

  // Drag and drop handlers for column reordering
  const handleColumnDragStart = (e: React.DragEvent, col: ColumnKey) => {
    setDraggingColumn(col);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e: React.DragEvent, targetCol: ColumnKey) => {
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
  };

  const handleColumnDragEnd = () => {
    setDraggingColumn(null);
    setActiveView('custom');
  };

  // Get ordered columns that are visible
  const getOrderedVisibleColumns = (): ColumnKey[] => {
    return columnOrder.filter(col => effectiveVisibleColumns.has(col));
  };

  // Get CSS order value for a column based on columnOrder
  const getColumnOrder = (colKey: ColumnKey): number => {
    const index = columnOrder.indexOf(colKey);
    return index === -1 ? 999 : index;
  };


  // Helper to select a product from catalog and update line item
  const selectProductForLineItem = (itemId: string, product: typeof productCatalog[0]) => {
    setQuoteLineItems(prev => prev.map(li =>
      li.id === itemId ? {
        ...li,
        productNumber: product.partNumber,
        description: product.description,
        basePrice: product.basePrice,
        sellPrice: product.basePrice, // Default sell to base
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

  // Helper to create a new product and add it to the catalog
  const createNewProduct = (itemId: string) => {
    if (!newProductData.partNumber.trim() || !newProductData.description.trim()) return;

    const newProduct = {
      id: `prod-${Date.now()}`,
      partNumber: newProductData.partNumber.trim(),
      description: newProductData.description.trim(),
      manufacturer: newProductData.manufacturer.trim() || 'Unknown',
      basePrice: newProductData.basePrice || 0,
    };

    // Add to catalog
    setProductCatalog(prev => [...prev, newProduct]);

    // Update line item
    selectProductForLineItem(itemId, newProduct);

    // Reset form
    setNewProductData({ partNumber: '', description: '', manufacturer: '', basePrice: 0 });
    setShowCreateProduct(false);
  };

  // Filter products based on search query
  const getFilteredProducts = () => {
    if (!productSearchQuery.trim()) return productCatalog;
    const query = productSearchQuery.toLowerCase();
    return productCatalog.filter(p =>
      p.partNumber.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.manufacturer.toLowerCase().includes(query)
    );
  };

  const applyView = (viewId: string) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      setVisibleColumns(new Set(view.columns));
      setActiveView(viewId);
    }
    setShowViewsMenu(false);
  };

  const saveCurrentView = () => {
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
  };

  // Columns for Simple View (basic pricing only - no overage/commission columns)
  const [simpleViewColumns, setSimpleViewColumns] = useState<Set<ColumnKey>>(new Set(['partNumber', 'customerPartNumber', 'description', 'manufacturer', 'quantity', 'uom', 'divisor', 'unitPrice', 'sellTotal', 'commissionPercent', 'commission', 'commissionTotal', 'linkedOrder']));

  // For backward compatibility
  const simpleQuoteColumns = simpleViewColumns;

  // Effective visible columns based on view mode
  const effectiveVisibleColumns = quoteViewMode === 'simple' ? simpleViewColumns : visibleColumns;

  const deleteView = (viewId: string) => {
    if (['default', 'compact', 'pricing', 'approval'].includes(viewId)) return; // Can't delete built-in views
    setSavedViews(prev => prev.filter(v => v.id !== viewId));
    if (activeView === viewId) {
      applyView('default');
    }
  };
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
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showConvertToOrderModal, setShowConvertToOrderModal] = useState(false);
  const [showQuotePdfPreview, setShowQuotePdfPreview] = useState(false);
  const [editingField, setEditingField] = useState<'billTo' | 'soldTo' | 'job' | null>(null);
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [recipientQuoteVersion, setRecipientQuoteVersion] = useState(1);
  const [showCompareView, setShowCompareView] = useState(false);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);

  // Recipients list for dropdown - always populate with mock data for demo
  const recipients: Recipient[] = [
    { id: 'rec-1', company: 'Graybar Electric', contact: 'John Smith', email: 'john@graybar.com', level: 'Sell' as const, price: 0, sent: 'Mar 15', opened: true, distributorQuote: null, version: 3 },
    { id: 'rec-2', company: 'HD Supply', contact: 'Sarah Lee', email: 'sarah@hdsupply.com', level: 'L1' as const, price: 0, sent: null, opened: false, distributorQuote: null, version: 2 },
    { id: 'rec-3', company: selectedQuote?.soldToCustomer || 'Turner Construction', contact: 'Mike Johnson', email: 'mike@turner.com', level: 'Sell' as const, price: 0, sent: 'Mar 15', opened: true, distributorQuote: null, version: 3 },
    { id: 'rec-4', company: 'Echo Electric', contact: 'Amy Wong', email: 'amy@echo.com', level: 'L1' as const, price: 0, sent: null, opened: false, distributorQuote: null, version: 1 },
  ];
  const [showSummaryBar, setShowSummaryBar] = useState(true);
  const [showHeaderFields, setShowHeaderFields] = useState(true);

  // Line items table state
  const [sortColumn, setSortColumn] = useState<ColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const [activeFilterColumn, setActiveFilterColumn] = useState<ColumnKey | null>(null);
  const [editingCell, setEditingCell] = useState<{ itemId: string; column: ColumnKey } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Editable columns in order for navigation
  const editableColumns: ColumnKey[] = ['unitPrice', 'overage', 'l1', 'l2'];

  const handleSort = (column: ColumnKey) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const startEditing = (itemId: string, column: ColumnKey, currentValue: string) => {
    setEditingCell({ itemId, column });
    setEditValue(currentValue);
    // Auto-select will happen via onFocus on the input
  };

  const getItemValue = (item: LineItem, column: ColumnKey): string => {
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
  };

  const saveEdit = (navigateTo?: { itemId: string; column: ColumnKey } | null) => {
    // TODO: Implement line item editing with proper state management
    // Currently quoteLineItems is derived from mockLineItems, so editing is not persisted
    // When backend is ready, this should update through a proper API call
    if (editingCell && editValue !== '') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const numValue = parseFloat(editValue);
      // Line item updates would go here when state management is implemented
    }

    if (navigateTo) {
      const item = quoteLineItems.find(li => li.id === navigateTo.itemId);
      if (item) {
        setEditingCell(navigateTo);
        setEditValue(getItemValue(item, navigateTo.column));
      }
    } else {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const navigateCell = (direction: 'up' | 'down' | 'left' | 'right' | 'tab' | 'shift-tab') => {
    if (!editingCell) return;

    // Get visible line items in current order
    const visibleItems = quoteLineItems.filter(item => {
      const section = quoteSections.find(s => s.id === item.sectionId);
      return section && !collapsedSections.has(section.id);
    });

    const currentItemIndex = visibleItems.findIndex(item => item.id === editingCell.itemId);
    const visibleEditableColumns = editableColumns.filter(col => effectiveVisibleColumns.has(col));
    const currentColIndex = visibleEditableColumns.indexOf(editingCell.column);

    if (currentItemIndex === -1 || currentColIndex === -1) return;

    let newItemIndex = currentItemIndex;
    let newColIndex = currentColIndex;

    switch (direction) {
      case 'up':
        newItemIndex = Math.max(0, currentItemIndex - 1);
        break;
      case 'down':
        newItemIndex = Math.min(visibleItems.length - 1, currentItemIndex + 1);
        break;
      case 'left':
        newColIndex = Math.max(0, currentColIndex - 1);
        break;
      case 'right':
      case 'tab':
        if (currentColIndex < visibleEditableColumns.length - 1) {
          newColIndex = currentColIndex + 1;
        } else if (currentItemIndex < visibleItems.length - 1) {
          newItemIndex = currentItemIndex + 1;
          newColIndex = 0;
        }
        break;
      case 'shift-tab':
        if (currentColIndex > 0) {
          newColIndex = currentColIndex - 1;
        } else if (currentItemIndex > 0) {
          newItemIndex = currentItemIndex - 1;
          newColIndex = visibleEditableColumns.length - 1;
        }
        break;
    }

    const newItem = visibleItems[newItemIndex];
    const newColumn = visibleEditableColumns[newColIndex];

    if (newItem && newColumn && (newItem.id !== editingCell.itemId || newColumn !== editingCell.column)) {
      saveEdit({ itemId: newItem.id, column: newColumn });
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        saveEdit();
        break;
      case 'Escape':
        e.preventDefault();
        cancelEdit();
        break;
      case 'Tab':
        e.preventDefault();
        navigateCell(e.shiftKey ? 'shift-tab' : 'tab');
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigateCell('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateCell('down');
        break;
      case 'ArrowLeft':
        // Only navigate if cursor is at start
        if (e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0) {
          e.preventDefault();
          navigateCell('left');
        }
        break;
      case 'ArrowRight':
        // Only navigate if cursor is at end
        if (e.currentTarget.selectionStart === e.currentTarget.value.length) {
          e.preventDefault();
          navigateCell('right');
        }
        break;
    }
  };

  // Mock data for dropdowns
  const distributorOptions = [
    'Ferguson Enterprises', 'Graybar Electric', 'HD Supply', 'Rexel', 'WESCO International',
    'Consolidated Electrical', 'Border States Electric', 'Sonepar', 'CED Greentech'
  ];
  const builderOptions = [
    'Skanska USA', 'Turner Construction', 'McCarthy Building', 'Hensel Phelps', 'DPR Construction',
    'Whiting-Turner', 'Clark Construction', 'Holder Construction', 'Brasfield & Gorrie'
  ];
  const jobOptions = [
    'University Lab Building', 'Downtown Medical Center', 'Tech Campus Phase 2', 'Airport Terminal B',
    'Convention Center Expansion', 'Corporate Headquarters', 'Research Facility', 'Hospital Wing Addition'
  ];

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const toggleLineItemSelection = (lineId: string) => {
    setSelectedLineItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineId)) {
        newSet.delete(lineId);
      } else {
        newSet.add(lineId);
      }
      return newSet;
    });
  };

  const selectAllLineItems = (items: LineItem[]) => {
    setSelectedLineItems(new Set(items.map(item => item.id)));
  };

  const clearLineItemSelection = () => {
    setSelectedLineItems(new Set());
  };


  // Memoize filter options to prevent re-renders
  const quoteFilterOptions = useMemo(() => [
    { id: 'quote-id', label: 'Quote Number', type: 'text' as const },
    { id: 'quote-name', label: 'Quote Name', type: 'text' as const },
    { id: 'status', label: 'Status', type: 'dropdown' as const },
    { id: 'stage', label: 'Stage', type: 'dropdown' as const },
    { id: 'value-min', label: 'Min Amount', type: 'number' as const },
    { id: 'value-max', label: 'Max Amount', type: 'number' as const },
    { id: 'entry-date-from', label: 'Entry Date From', type: 'date' as const },
    { id: 'entry-date-to', label: 'Entry Date To', type: 'date' as const },
    { id: 'quote-date-from', label: 'Quote Date From', type: 'date' as const },
    { id: 'quote-date-to', label: 'Quote Date To', type: 'date' as const },
    { id: 'exp-date-from', label: 'Exp. Date From', type: 'date' as const },
    { id: 'exp-date-to', label: 'Exp. Date To', type: 'date' as const },
    { id: 'factory', label: 'Factory', type: 'dropdown' as const },
    { id: 'customer', label: 'Customer', type: 'dropdown' as const },
    { id: 'job-name', label: 'Job Name', type: 'text' as const },
    { id: 'end-user', label: 'End User', type: 'dropdown' as const },
    { id: 'inside-rep', label: 'Inside Rep', type: 'dropdown' as const },
    { id: 'outside-rep', label: 'Outside Rep', type: 'dropdown' as const },
    { id: 'published', label: 'Published', type: 'dropdown' as const },
    { id: 'bill-to', label: 'Bill-To Customer', type: 'dropdown' as const },
    { id: 'sold-to', label: 'Sold-To Customer', type: 'dropdown' as const },
    { id: 'owner', label: 'Owner', type: 'dropdown' as const },
    { id: 'approval-status', label: 'Approval Status', type: 'dropdown' as const },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const },
  ], []);


  const handleQuoteSelect = useCallback((quote: Quote) => {
    setSelectedQuote(quote);
  }, []);

  // Get line items for selected quote - using state so they can be modified
  const [quoteLineItems, setQuoteLineItems] = useState<LineItem[]>([]);

  // Sections state - so they can be modified
  const [quoteSections, setQuoteSections] = useState<Section[]>(mockSections);

  // Sync line items when selected quote changes
  useEffect(() => {
    if (selectedQuote) {
      setQuoteLineItems(mockLineItems.filter(li => li.quoteId === selectedQuote.id));
    } else {
      setQuoteLineItems([]);
    }
  }, [selectedQuote?.id]);

  // Get sections that are used in the current quote's line items
  const currentQuoteSections = useMemo(() => {
    const sectionIds = new Set(quoteLineItems.map(li => li.sectionId));
    return quoteSections.filter(s => sectionIds.has(s.id));
  }, [quoteLineItems, quoteSections]);

  // State for section dropdown with "add new" feature
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [showNewSectionInput, setShowNewSectionInput] = useState(false);

  // Close section dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sectionDropdownOpen && !(e.target as Element).closest('.section-dropdown-container')) {
        setSectionDropdownOpen(null);
        setShowNewSectionInput(false);
        setNewSectionName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sectionDropdownOpen]);

  // Function to add a new section with a line item
  const addSection = () => {
    if (!selectedQuote) return;

    const newSectionId = `SEC-${Date.now()}`;
    const newSectionName = `New Section ${quoteSections.length + 1}`;
    const newOrder = Math.max(...quoteSections.map(s => s.order), 0) + 1;

    // Create the new section
    const newSection: Section = {
      id: newSectionId,
      name: newSectionName,
      order: newOrder,
    };

    // Add the section to state
    setQuoteSections(prev => [...prev, newSection]);

    // Add a new line item to the section
    const newItem: LineItem = {
      id: `li-${Date.now()}`,
      quoteId: selectedQuote.id,
      sectionId: newSectionId,
      sectionName: newSectionName,
      productNumber: '',
      description: 'New Line Item',
      endUser: '',
      quantity: 1,
      uom: 'EA',
      manufacturers: [{
        name: '',
        basePrice: 0,
        commissionRate: 0.08,
        overageShare: 0.85,
        approvalStatus: 'unknown',
        approvalDate: null,
        approvalNotes: null,
      }],
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
  };

  // Function to add a new line item
  const addLineItem = (sectionId?: string) => {
    if (!selectedQuote) return;

    const targetSectionId = sectionId || quoteSections[0]?.id || 'section-1';
    const targetSection = quoteSections.find(s => s.id === targetSectionId);

    const newItem: LineItem = {
      id: `li-${Date.now()}`,
      quoteId: selectedQuote.id,
      sectionId: targetSectionId,
      sectionName: targetSection?.name || 'General',
      productNumber: '',
      description: 'New Line Item',
      endUser: '',
      quantity: 1,
      uom: 'EA',
      manufacturers: [{
        name: '',
        basePrice: 0,
        commissionRate: 0.08,
        overageShare: 0.85,
        approvalStatus: 'unknown',
        approvalDate: null,
        approvalNotes: null,
      }],
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
  };

  // Function to create a new section and move a line item to it
  const createSectionAndMoveItem = (itemId: string, sectionName: string) => {
    if (!sectionName.trim()) return;

    const newSectionId = `SEC-${Date.now()}`;
    const newOrder = Math.max(...quoteSections.map(s => s.order), 0) + 1;

    // Create the new section
    const newSection: Section = {
      id: newSectionId,
      name: sectionName.trim(),
      order: newOrder,
    };

    // Add the section to state
    setQuoteSections(prev => [...prev, newSection]);

    // Move the line item to the new section
    setQuoteLineItems(prev => prev.map(li =>
      li.id === itemId ? { ...li, sectionId: newSectionId, sectionName: sectionName.trim() } : li
    ));

    // Reset the dropdown state
    setSectionDropdownOpen(null);
    setNewSectionName('');
    setShowNewSectionInput(false);
  };

  // Get distributor quotes for selected quote - memoized
  const quoteDistributorQuotes = useMemo(() =>
    selectedQuote
      ? mockDistributorQuotes.filter(dq => dq.baseQuoteId === selectedQuote.id)
      : [],
    [selectedQuote]
  );

  // Calculate quote totals - memoized
  const totals = useMemo(() => {
    const items = quoteLineItems;
    const baseTotal = items.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
    const sellTotal = items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    const l1Total = items.reduce((sum, item) => sum + (item.level1Price * item.quantity), 0);
    const l2Total = items.reduce((sum, item) => sum + (item.level2Price * item.quantity), 0);
    const l3Total = items.reduce((sum, item) => sum + (item.level3Price * item.quantity), 0);
    const overage = sellTotal - baseTotal;
    const commission = items.reduce((sum, item) => {
      if (!item.commissionable) return sum;
      const mfr = item.manufacturers[0];
      return sum + ((item.sellPrice - item.basePrice) * item.quantity * mfr.commissionRate);
    }, 0);

    return { baseTotal, sellTotal, l1Total, l2Total, l3Total, overage, commission };
  }, [quoteLineItems]);

  // Quote Detail View
  if (selectedQuote) {
    return (
      <main className="flex-1 overflow-auto bg-[var(--background)]">
        {/* Header */}
        <QuoteDetailHeader
          selectedQuote={selectedQuote}
          setSelectedQuote={setSelectedQuote}
          setQuotes={setQuotes}
          quoteLineItems={quoteLineItems}
          showActionsDropdown={showActionsDropdown}
          setShowActionsDropdown={setShowActionsDropdown}
          showStageDropdown={showStageDropdown}
          setShowStageDropdown={setShowStageDropdown}
          showVersionDropdown={showVersionDropdown}
          setShowVersionDropdown={setShowVersionDropdown}
          showViewModeDropdown={showViewModeDropdown}
          setShowViewModeDropdown={setShowViewModeDropdown}
          showSaveDropdown={showSaveDropdown}
          setShowSaveDropdown={setShowSaveDropdown}
          quoteViewMode={quoteViewMode}
          setQuoteViewMode={setQuoteViewMode}
          adminShowSalesCredit={adminShowSalesCredit}
          getStageColor={getStageColor}
          setShowMarkAsLostModal={setShowMarkAsLostModal}
          setSelectedQuotesForBulk={setSelectedQuotesForBulk}
          setShowCreditModal={setShowCreditModal}
          setShowQuotePdfPreview={setShowQuotePdfPreview}
          setShowConvertToOrderModal={setShowConvertToOrderModal}
          setShowCreateOrderFromQuoteModal={setShowCreateOrderFromQuoteModal}
          setCreateOrderSelectedItems={setCreateOrderSelectedItems}
          setCreateOrderSelectAll={setCreateOrderSelectAll}
          setShowDuplicateQuoteModal={setShowDuplicateQuoteModal}
          setDuplicateQuoteNumber={setDuplicateQuoteNumber}
          setDuplicateCustomer={setDuplicateCustomer}
          setDuplicatePercentIncrease={setDuplicatePercentIncrease}
          setDuplicateCopyNotes={setDuplicateCopyNotes}
        />

        {/* Pricing Summary Bar */}
        <PricingSummaryBar
          totals={totals}
          quoteViewMode={quoteViewMode}
          quotePriceLevels={quotePriceLevels}
          priceLevelColors={priceLevelColors}
        />

        {/* Collapsible Header Fields Section */}
        <HeaderFieldsSection
          selectedQuote={selectedQuote}
          setSelectedQuote={setSelectedQuote}
          setQuotes={setQuotes}
          showHeaderFields={showHeaderFields}
          setShowHeaderFields={setShowHeaderFields}
          showEndUserPerLine={showEndUserPerLine}
          showCommissionSplits={showCommissionSplits}
          showInsideRepSplits={showInsideRepSplits}
          endUserSameAsCustomer={endUserSameAsCustomer}
          setEndUserSameAsCustomer={setEndUserSameAsCustomer}
          headerEndUser={headerEndUser}
          setHeaderEndUser={setHeaderEndUser}
          quoteOutsideRep={quoteOutsideRep}
          setQuoteOutsideRep={setQuoteOutsideRep}
          quoteInsideRep={quoteInsideRep}
          setQuoteInsideRep={setQuoteInsideRep}
          splitCommission={splitCommission}
          setSplitCommission={setSplitCommission}
          splitInsideCommission={splitInsideCommission}
          setSplitInsideCommission={setSplitInsideCommission}
          repCommissionSplits={repCommissionSplits}
          setRepCommissionSplits={setRepCommissionSplits}
          insideRepCommissionSplits={insideRepCommissionSplits}
          setInsideRepCommissionSplits={setInsideRepCommissionSplits}
          availableOutsideReps={availableOutsideReps}
          availableInsideReps={availableInsideReps}
          setShowRepSplitsModal={setShowRepSplitsModal}
          setShowInsideRepSplitsModal={setShowInsideRepSplitsModal}
        />

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Main Content */}
          <div className="flex-1 flex flex-col p-6 min-w-0 overflow-hidden">
            {/* Tabs */}
            <QuoteDetailTabs
              selectedQuote={selectedQuote}
              quoteLineItemsCount={quoteLineItems.length}
              quoteViewMode={quoteViewMode}
              detailTab={detailTab}
              setDetailTab={setDetailTab}
              showViewsMenu={showViewsMenu}
              setShowViewsMenu={setShowViewsMenu}
              showColumnsMenu={showColumnsMenu}
              setShowColumnsMenu={setShowColumnsMenu}
              savedViews={savedViews}
              activeView={activeView}
              applyView={applyView}
              deleteView={deleteView}
              setShowSaveViewModal={setShowSaveViewModal}
              showSections={showSections}
              setShowSectionsModal={setShowSectionsModal}
              effectiveVisibleColumnsSize={effectiveVisibleColumns.size}
            />

            {/* Line Items Tab */}
            {detailTab === 'lines' && (
              <LinesTab
                selectedQuote={selectedQuote}
                quoteLineItems={quoteLineItems}
                setQuoteLineItems={setQuoteLineItems}
                quoteSections={quoteSections}
                setQuoteSections={setQuoteSections}
                totals={totals}
                quoteViewMode={quoteViewMode}
                setQuoteViewMode={setQuoteViewMode}
                showEndUserPerLine={showEndUserPerLine}
                showCommissionSplits={showCommissionSplits}
                showInsideRepSplits={showInsideRepSplits}
                showSections={showSections}
                setShowSections={setShowSections}
                sectionDisplayMode={sectionDisplayMode}
                recipients={recipients}
                selectedRecipient={selectedRecipient}
                setSelectedRecipient={setSelectedRecipient}
                recipientQuoteVersion={recipientQuoteVersion}
                setRecipientQuoteVersion={setRecipientQuoteVersion}
                productCatalog={productCatalog}
                setProductCatalog={setProductCatalog}
                quotePriceLevels={quotePriceLevels}
                specSheetSelections={specSheetSelections}
                setSpecSheetSelections={setSpecSheetSelections}
              />
            )}


            {detailTab === 'approvals' && (
              <ApprovalsTab
                selectedQuote={selectedQuote}
                quoteLineItems={quoteLineItems}
                approvalRequests={mockApprovalRequests}
                onSetGeneratedPdfData={setGeneratedPdfData}
                onShowPdfPreviewModal={() => setShowPdfPreviewModal(true)}
                onShowEditTemplateModal={() => setShowEditTemplateModal(true)}
                onShowSendEmailModal={() => setShowSendEmailModal(true)}
                onShowMarkApprovalModal={() => setShowMarkApprovalModal(true)}
                onShowApprovalRequestModal={() => setShowApprovalRequestModal(true)}
              />
            )}
            {/* Recipients Tab */}
            {detailTab === 'recipients' && (
              <RecipientsTab
                quoteLineItems={quoteLineItems}
                selectedQuote={selectedQuote}
                totals={totals}
                quoteDistributorQuotes={quoteDistributorQuotes}
                onShowDistributorModal={() => setShowDistributorModal(true)}
                onShowApprovalRequestModal={() => setShowApprovalRequestModal(true)}
                onSelectRecipient={(recipient, version) => { setSelectedRecipient(recipient); setRecipientQuoteVersion(version); setDetailTab('lines'); }}
                onSelectDistributorQuote={setSelectedDistributorQuote}
              />
            )}

            {/* Versions Tab */}
            {detailTab === 'versions' && <VersionsTab onShowRevertModal={() => setShowRevertModal(true)} />}


            {/* Linked Objects Tab */}
            {detailTab === 'linkedObjects' && <LinkedObjectsTab />}

            {/* Notes Tab */}
            {detailTab === 'notes' && <NotesTab />}

            {/* Tasks Tab */}
            {detailTab === 'tasks' && <TasksTab />}

            {/* Activity Tab */}
            {detailTab === 'activity' && <ActivityTab />}

            {/* Submittals Tab */}
            {detailTab === 'submittals' && (
              <SubmittalsTab
                submittals={submittals}
                selectedQuoteId={selectedQuote.id}
                onSetPrintSubmittal={setPrintSubmittal}
                onShowCreateSubmittalModal={() => setShowCreateSubmittalModal(true)}
                onEditSubmittal={(id) => { setEditingSubmittalId(id); setShowSubmittalConfigModal(true); }}
                onSelectSubmittalForDetail={setSelectedSubmittalForDetail}
              />
            )}
            {/* Settings Tab */}
            {detailTab === 'settings' && (
              <SettingsTab
                showEndUserPerLine={showEndUserPerLine}
                setShowEndUserPerLine={setShowEndUserPerLine}
                showCommissionSplits={showCommissionSplits}
                setShowCommissionSplits={setShowCommissionSplits}
                showInsideRepSplits={showInsideRepSplits}
                setShowInsideRepSplits={setShowInsideRepSplits}
                customerPartNumberSource={customerPartNumberSource}
                setCustomerPartNumberSource={setCustomerPartNumberSource}
                quotePriceLevels={quotePriceLevels}
                setQuotePriceLevels={setQuotePriceLevels}
              />
            )}
          </div>
        </div>

        <QuoteDetailModals
          selectedQuote={selectedQuote}
          quoteLineItems={quoteLineItems}
          setQuoteLineItems={setQuoteLineItems}
          quotes={quotes}
          setQuotes={setQuotes}
          setSelectedQuote={setSelectedQuote}
          totals={totals}
          showCommissionSplitsModal={showCommissionSplitsModal}
          setShowCommissionSplitsModal={setShowCommissionSplitsModal}
          commissionSplitsModalItem={commissionSplitsModalItem}
          setCommissionSplitsModalItem={setCommissionSplitsModalItem}
          applyToAllLines={applyToAllLines}
          setApplyToAllLines={setApplyToAllLines}
          availableOutsideReps={availableOutsideReps}
          availableInsideReps={availableInsideReps}
          showSectionsModal={showSectionsModal}
          setShowSectionsModal={setShowSectionsModal}
          showSections={showSections}
          setShowSections={setShowSections}
          sectionDisplayMode={sectionDisplayMode}
          setSectionDisplayMode={setSectionDisplayMode}
          showRepSplitsModal={showRepSplitsModal}
          setShowRepSplitsModal={setShowRepSplitsModal}
          repCommissionSplits={repCommissionSplits}
          setRepCommissionSplits={setRepCommissionSplits}
          splitCommission={splitCommission}
          setSplitCommission={setSplitCommission}
          showInsideRepSplitsModal={showInsideRepSplitsModal}
          setShowInsideRepSplitsModal={setShowInsideRepSplitsModal}
          insideRepCommissionSplits={insideRepCommissionSplits}
          setInsideRepCommissionSplits={setInsideRepCommissionSplits}
          splitInsideCommission={splitInsideCommission}
          setSplitInsideCommission={setSplitInsideCommission}
          showLineItemRepSplitsModal={showLineItemRepSplitsModal}
          setShowLineItemRepSplitsModal={setShowLineItemRepSplitsModal}
          lineItemRepSplitsTarget={lineItemRepSplitsTarget}
          setLineItemRepSplitsTarget={setLineItemRepSplitsTarget}
          lineItemRepSplits={lineItemRepSplits}
          setLineItemRepSplits={setLineItemRepSplits}
          showLineItemInsideRepSplitsModal={showLineItemInsideRepSplitsModal}
          setShowLineItemInsideRepSplitsModal={setShowLineItemInsideRepSplitsModal}
          lineItemInsideRepSplitsTarget={lineItemInsideRepSplitsTarget}
          setLineItemInsideRepSplitsTarget={setLineItemInsideRepSplitsTarget}
          lineItemInsideRepSplits={lineItemInsideRepSplits}
          setLineItemInsideRepSplits={setLineItemInsideRepSplits}
          showDuplicateQuoteModal={showDuplicateQuoteModal}
          setShowDuplicateQuoteModal={setShowDuplicateQuoteModal}
          duplicateQuoteNumber={duplicateQuoteNumber}
          setDuplicateQuoteNumber={setDuplicateQuoteNumber}
          duplicateCustomer={duplicateCustomer}
          setDuplicateCustomer={setDuplicateCustomer}
          duplicatePercentIncrease={duplicatePercentIncrease}
          setDuplicatePercentIncrease={setDuplicatePercentIncrease}
          duplicateCopyNotes={duplicateCopyNotes}
          setDuplicateCopyNotes={setDuplicateCopyNotes}
          availableEndUsers={availableEndUsers}
          showCreateOrderFromQuoteModal={showCreateOrderFromQuoteModal}
          setShowCreateOrderFromQuoteModal={setShowCreateOrderFromQuoteModal}
          createOrderSelectAll={createOrderSelectAll}
          setCreateOrderSelectAll={setCreateOrderSelectAll}
          createOrderSelectedItems={createOrderSelectedItems}
          setCreateOrderSelectedItems={setCreateOrderSelectedItems}
          showColumnsMenu={showColumnsMenu}
          setShowColumnsMenu={setShowColumnsMenu}
          columnOrder={columnOrder}
          columnDefinitions={columnDefinitions}
          visibleColumns={visibleColumns}
          simpleViewColumns={simpleViewColumns}
          quoteViewMode={quoteViewMode}
          toggleColumn={toggleColumn}
          showMarkAsLostModal={showMarkAsLostModal}
          setShowMarkAsLostModal={setShowMarkAsLostModal}
          lostReason={lostReason}
          setLostReason={setLostReason}
          customLostReason={customLostReason}
          setCustomLostReason={setCustomLostReason}
          showAddReasonInput={showAddReasonInput}
          setShowAddReasonInput={setShowAddReasonInput}
          newReasonText={newReasonText}
          setNewReasonText={setNewReasonText}
          lostReasons={lostReasons}
          setLostReasons={setLostReasons}
          selectedQuotesForBulk={selectedQuotesForBulk}
          setSelectedQuotesForBulk={setSelectedQuotesForBulk}
          showLineDetailsModal={showLineDetailsModal}
          setShowLineDetailsModal={setShowLineDetailsModal}
          lineDetailsModalItem={lineDetailsModalItem}
          setLineDetailsModalItem={setLineDetailsModalItem}
          effectiveVisibleColumns={effectiveVisibleColumns}
          showEndUserPerLine={showEndUserPerLine}
          showApprovalRequestModal={showApprovalRequestModal}
          setShowApprovalRequestModal={setShowApprovalRequestModal}
          manufacturers={mockManufacturers}
          showPdfPreviewModal={showPdfPreviewModal}
          setShowPdfPreviewModal={setShowPdfPreviewModal}
          generatedPdfData={generatedPdfData}
          setGeneratedPdfData={setGeneratedPdfData}
          pdfTemplate={pdfTemplate}
          setPdfTemplate={setPdfTemplate}
          showEditTemplateModal={showEditTemplateModal}
          setShowEditTemplateModal={setShowEditTemplateModal}
          showSendEmailModal={showSendEmailModal}
          setShowSendEmailModal={setShowSendEmailModal}
          selectedManufacturerForApproval={selectedManufacturerForApproval}
          setSelectedManufacturerForApproval={setSelectedManufacturerForApproval}
          showMarkApprovalModal={showMarkApprovalModal}
          setShowMarkApprovalModal={setShowMarkApprovalModal}
          showRevertModal={showRevertModal}
          setShowRevertModal={setShowRevertModal}
          showCreditModal={showCreditModal}
          setShowCreditModal={setShowCreditModal}
          showQuotePdfPreview={showQuotePdfPreview}
          setShowQuotePdfPreview={setShowQuotePdfPreview}
          showConvertToOrderModal={showConvertToOrderModal}
          setShowConvertToOrderModal={setShowConvertToOrderModal}
          showCreateProductModal={showCreateProductModal}
          setShowCreateProductModal={setShowCreateProductModal}
          createProductForLineItem={createProductForLineItem}
          setCreateProductForLineItem={setCreateProductForLineItem}
          createProductInitialData={createProductInitialData}
          setCreateProductInitialData={setCreateProductInitialData}
          productCatalog={productCatalog}
          setProductCatalog={setProductCatalog}
          availableManufacturers={availableManufacturers.map(m => ({ id: m.id, name: m.name }))}
          showDistributorModal={showDistributorModal}
          setShowDistributorModal={setShowDistributorModal}
          selectedDistributorQuote={selectedDistributorQuote}
          setSelectedDistributorQuote={setSelectedDistributorQuote}
          distributorQuoteLines={mockDistributorQuoteLines}
          crossAuditLog={mockCrossAuditLog}
          selectedRecipient={selectedRecipient}
          setSelectedRecipient={setSelectedRecipient}
          recipientQuoteVersion={recipientQuoteVersion}
          setRecipientQuoteVersion={setRecipientQuoteVersion}
          showCompareView={showCompareView}
          setShowCompareView={setShowCompareView}
          repSplitModalItem={repSplitModalItem}
          setRepSplitModalItem={setRepSplitModalItem}
          showCreateSubmittalModal={showCreateSubmittalModal}
          setShowCreateSubmittalModal={setShowCreateSubmittalModal}
          showSubmittalConfigModal={showSubmittalConfigModal}
          setShowSubmittalConfigModal={setShowSubmittalConfigModal}
          editingSubmittalId={editingSubmittalId}
          setEditingSubmittalId={setEditingSubmittalId}
          submittals={submittals}
          setSubmittals={setSubmittals}
          selectedSubmittalForDetail={selectedSubmittalForDetail}
          setSelectedSubmittalForDetail={setSelectedSubmittalForDetail}
          printSubmittal={printSubmittal}
          setPrintSubmittal={setPrintSubmittal}
          recipients={recipients}
        />

      </main>
    );
  }

  // Main Quote List View
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      <QuotesListHeader
        quotes={quotes}
        viewMode={viewMode}
        setViewMode={setViewMode}
        quoteFilterOptions={quoteFilterOptions}
        quickDatePreset={quickDatePreset}
        setQuickDatePreset={setQuickDatePreset}
        quickDateField={quickDateField}
        setQuickDateField={setQuickDateField}
        showQuickDateFieldDropdown={showQuickDateFieldDropdown}
        setShowQuickDateFieldDropdown={setShowQuickDateFieldDropdown}
      />

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <QuotesKanbanView
          stages={stages}
          quotesByStage={quotesByStage}
          sensors={sensors}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleDragCancel={handleDragCancel}
          handleQuoteSelect={handleQuoteSelect}
          activeQuote={activeQuote}
        />
      ) : (
        /* List View */
        <QuotesListView
          sortedQuotes={sortedQuotes}
          selectedQuotesForBulk={selectedQuotesForBulk}
          setSelectedQuotesForBulk={setSelectedQuotesForBulk}
          showQuotesBulkActionsMenu={showQuotesBulkActionsMenu}
          setShowQuotesBulkActionsMenu={setShowQuotesBulkActionsMenu}
          setQuotes={setQuotes}
          setShowMarkAsLostModal={setShowMarkAsLostModal}
          isQuoteLinked={isQuoteLinked}
          getQuoteLinkedReason={getQuoteLinkedReason}
          getStageColor={getStageColor}
          handleQuotesSort={handleQuotesSort}
          quotesSortColumn={quotesSortColumn}
          quotesSortDirection={quotesSortDirection}
          activeQuoteSortKey={activeQuoteFilterColumn}
          setActiveQuoteSortKey={setActiveQuoteFilterColumn}
          filterSearchText={filterSearchText}
          setFilterSearchText={setFilterSearchText}
          hasActiveFilter={hasActiveFilter}
          quoteColumnFilters={quoteColumnFilters}
          handleQuoteFilterChange={handleQuoteFilterChange}
          clearQuoteFilter={clearQuoteFilter}
          getUniqueValuesForColumn={getUniqueValuesForColumn}
          getFilterType={getFilterType}
          setSelectedQuote={setSelectedQuote}
        />
      )}
    </main>
  );
}
