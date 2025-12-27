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

  // Render a table header cell for a given column key
  const renderHeaderCell = (colKey: ColumnKey): React.ReactNode => {
    const col = columnDefinitions.find(c => c.key === colKey);
    if (!col) return null;

    // Map column keys to their sortable names
    const sortableColumns = ['partNumber', 'description', 'quantity', 'manufacturer', 'unitPrice', 'sellTotal', 'endUser'];
    const filterableColumns = ['partNumber', 'description', 'manufacturer', 'endUser'];
    const isSortable = sortableColumns.includes(colKey);
    const isFilterable = filterableColumns.includes(colKey);

    // Special case for endUser - only show if showEndUserPerLine is true
    if (colKey === 'endUser' && !showEndUserPerLine) return null;

    return (
      <th key={colKey} className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase relative whitespace-nowrap">
        <div className="flex items-center justify-center gap-1">
          <span
            className={isSortable ? "cursor-pointer hover:text-[var(--foreground)]" : ""}
            onClick={isSortable ? () => handleSort(colKey as 'partNumber' | 'description' | 'quantity' | 'manufacturer' | 'unitPrice' | 'sellTotal') : undefined}
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

  // Render a table body cell for a given column key and line item (for Simple View)
  const renderBodyCell = (colKey: ColumnKey, item: LineItem): React.ReactNode => {
    // Special case for endUser - only show if showEndUserPerLine is true
    if (colKey === 'endUser' && !showEndUserPerLine) return null;

    switch (colKey) {
      case 'partNumber':
        const filteredProducts = getFilteredProducts();
        const hasSearchQuery = productSearchQuery.trim().length > 0;
        const queryMatchesExact = hasSearchQuery && filteredProducts.some(p =>
          p.partNumber.toLowerCase() === productSearchQuery.toLowerCase().trim()
        );
        return (
          <td key={colKey} className="px-3 py-2 font-mono text-sm text-center relative">
            <div className="product-search-container" ref={productSearchOpen === item.id && productSearchField === 'partNumber' ? productDropdownRef : undefined}>
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownPosition({ top: rect.bottom + 4, left: rect.left });
                  setProductSearchOpen(productSearchOpen === item.id && productSearchField === 'partNumber' ? null : item.id);
                  setProductSearchField('partNumber');
                  setProductSearchQuery(item.productNumber || '');
                  setShowCreateProduct(false);
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
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="Search FPN, CPN, or description..."
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => selectProductForLineItem(item.id, product)}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors"
                      >
                        <div className="font-mono text-sm font-medium">{product.partNumber}</div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate">{product.description}</div>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && !hasSearchQuery && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No products found</div>
                    )}
                    {filteredProducts.length === 0 && hasSearchQuery && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No products found</div>
                    )}
                  </div>
                  {/* Option to use typed text as document-specific product */}
                  {hasSearchQuery && !queryMatchesExact && (
                    <div className="border-t border-[var(--border)]">
                      <button
                        onClick={() => {
                          // Use typed text as document-specific product (not added to catalog)
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? {
                              ...li,
                              productNumber: productSearchQuery.trim(),
                              isDocumentSpecific: true, // Mark as document-specific
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
                          <div className="text-xs text-[var(--muted-foreground)]">Use as document-specific product</div>
                        </div>
                      </button>
                    </div>
                  )}
                  {/* Button to open Create Product Modal */}
                  <div className="border-t border-[var(--border)] p-2">
                    <button
                      onClick={() => {
                        // Open the Create Product Modal
                        setCreateProductForLineItem(item.id);
                        setCreateProductInitialData({
                          partNumber: productSearchQuery.trim(),
                          description: ''
                        });
                        setShowCreateProductModal(true);
                        setProductSearchOpen(null);
                        setProductSearchField(null);
                        setProductSearchQuery('');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                      </svg>
                      Create Official Product
                    </button>
                  </div>
                </div>,
                document.body
              )}
            </div>
          </td>
        );
      case 'customerPartNumber':
        return (
          <td key={colKey} className="px-3 py-2 font-mono text-sm text-center relative">
            <div className="product-search-container">
              <button
                onClick={() => {
                  setProductSearchOpen(productSearchOpen === item.id && productSearchField === 'customerPartNumber' ? null : item.id);
                  setProductSearchField('customerPartNumber');
                  setProductSearchQuery((item as LineItem & { customerPartNumber?: string }).customerPartNumber || '');
                  setShowCreateProduct(false);
                }}
                className="w-full text-center px-2 py-1 rounded hover:bg-[var(--muted)] transition-colors flex items-center justify-center gap-1"
              >
                <span className="flex-1 truncate">{(item as LineItem & { customerPartNumber?: string }).customerPartNumber || 'Select...'}</span>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)] flex-shrink-0">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {productSearchOpen === item.id && productSearchField === 'customerPartNumber' && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                  <div className="p-2 border-b border-[var(--border)]">
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="Search or enter customer part #..."
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {getFilteredProducts().map(product => (
                      <button
                        key={product.id}
                        onClick={() => {
                          // For customer part number, just set the customer part number field, don't change the product
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? { ...li, customerPartNumber: product.partNumber } : li
                          ));
                          setProductSearchOpen(null);
                          setProductSearchField(null);
                          setProductSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors"
                      >
                        <div className="font-mono text-sm font-medium">{product.partNumber}</div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate">{product.description}</div>
                      </button>
                    ))}
                    {getFilteredProducts().length === 0 && productSearchQuery.trim() && (
                      <button
                        onClick={() => {
                          // Allow setting a custom customer part number that's not in the catalog
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? { ...li, customerPartNumber: productSearchQuery.trim() } : li
                          ));
                          setProductSearchOpen(null);
                          setProductSearchField(null);
                          setProductSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors"
                      >
                        <div className="text-sm text-[var(--primary)]">Use "{productSearchQuery.trim()}"</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Custom customer part number</div>
                      </button>
                    )}
                    {getFilteredProducts().length === 0 && !productSearchQuery.trim() && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">Type to search or enter custom part #</div>
                    )}
                  </div>
                  {productSearchQuery.trim() && getFilteredProducts().length > 0 && (
                    <div className="border-t border-[var(--border)] p-2">
                      <button
                        onClick={() => {
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? { ...li, customerPartNumber: productSearchQuery.trim() } : li
                          ));
                          setProductSearchOpen(null);
                          setProductSearchField(null);
                          setProductSearchQuery('');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                        </svg>
                        Use "{productSearchQuery.trim()}" as custom
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </td>
        );
      case 'description':
        const descFilteredProducts = getFilteredProducts();
        const descHasSearchQuery = productSearchQuery.trim().length > 0;
        const descQueryMatchesExact = descHasSearchQuery && descFilteredProducts.some(p =>
          p.description.toLowerCase() === productSearchQuery.toLowerCase().trim()
        );
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center max-w-[200px] relative">
            <div className="product-search-container">
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownPosition({ top: rect.bottom + 4, left: rect.left });
                  setProductSearchOpen(productSearchOpen === item.id && productSearchField === 'description' ? null : item.id);
                  setProductSearchField('description');
                  setProductSearchQuery(item.description || '');
                  setShowCreateProduct(false);
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
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="Search FPN, CPN, or description..."
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {descFilteredProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => selectProductForLineItem(item.id, product)}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors"
                      >
                        <div className="text-sm">{product.description}</div>
                        <div className="font-mono text-xs text-[var(--muted-foreground)]">{product.partNumber}</div>
                      </button>
                    ))}
                    {descFilteredProducts.length === 0 && !descHasSearchQuery && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No products found</div>
                    )}
                    {descFilteredProducts.length === 0 && descHasSearchQuery && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No products found</div>
                    )}
                  </div>
                  {/* Option to use typed text as document-specific description */}
                  {descHasSearchQuery && !descQueryMatchesExact && (
                    <div className="border-t border-[var(--border)]">
                      <button
                        onClick={() => {
                          // Use typed text as document-specific description (not added to catalog)
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? {
                              ...li,
                              description: productSearchQuery.trim(),
                              isDocumentSpecific: true, // Mark as document-specific
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
                          <div className="text-xs text-[var(--muted-foreground)]">Use as document-specific description</div>
                        </div>
                      </button>
                    </div>
                  )}
                  {/* Button to open Create Product Modal */}
                  <div className="border-t border-[var(--border)] p-2">
                    <button
                      onClick={() => {
                        // Open the Create Product Modal
                        setCreateProductForLineItem(item.id);
                        setCreateProductInitialData({
                          partNumber: '',
                          description: productSearchQuery.trim()
                        });
                        setShowCreateProductModal(true);
                        setProductSearchOpen(null);
                        setProductSearchField(null);
                        setProductSearchQuery('');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                      </svg>
                      Create Official Product
                    </button>
                  </div>
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
              placeholder="â€”"
              className="w-24 px-2 py-1 text-center border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] rounded bg-transparent focus:bg-white focus:outline-none text-sm"
            />
          </td>
        );
      case 'manufacturer':
        const currentMfr = item.manufacturers[0]?.name || '';
        const filteredMfrs = availableManufacturers.filter(mfr =>
          mfr.name.toLowerCase().includes(manufacturerSearch.toLowerCase())
        );
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center relative">
            <div className="manufacturer-dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setManufacturerDropdown(manufacturerDropdown === item.id ? null : item.id);
                  setManufacturerSearch('');
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
                      onChange={(e) => setManufacturerSearch(e.target.value)}
                      placeholder="Search manufacturers..."
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredMfrs.map(mfr => (
                      <button
                        key={mfr.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? {
                              ...li,
                              manufacturers: [{ ...li.manufacturers[0], name: mfr.name }]
                            } : li
                          ));
                          setManufacturerDropdown(null);
                          setManufacturerSearch('');
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors ${currentMfr === mfr.name ? 'bg-[var(--muted)]' : ''}`}
                      >
                        <div className="text-sm">{mfr.name}</div>
                      </button>
                    ))}
                    {filteredMfrs.length === 0 && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No manufacturers found</div>
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
        // Sell Total = qty * unit price / divisor
        const divisorVal = item.divisor || 1;
        const sellTotalCalc = (item.quantity * item.sellPrice) / divisorVal;
        return <td key={colKey} className="px-3 py-2 text-sm text-center font-medium">${sellTotalCalc.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>;
      case 'commissionPercent':
        // Commission % - editable, updates commission and commission total
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
        // Commission = Commission Total / Qty
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
                // Commission = Commission Total / Qty, so Commission Total = Commission * Qty
                // Commission Total = Commission % * Sell Total, so Commission % = Commission Total / Sell Total
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
        // Commission Total = Commission % * Sell Total
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
                // Commission Total = Commission % * Sell Total, so Commission % = Commission Total / Sell Total * 100
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
      case 'commissionDiscountPercent':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.commissionDiscountPercent ? `${item.commissionDiscountPercent}%` : 'â€”'}</td>;
      case 'commissionDiscountAmount':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.commissionDiscountAmount ? `$${item.commissionDiscountAmount}` : 'â€”'}</td>;
      case 'lineDiscountPercent':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.lineDiscountPercent ? `${item.lineDiscountPercent}%` : 'â€”'}</td>;
      case 'lineDiscountAmount':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.lineDiscountAmount ? `$${item.lineDiscountAmount}` : 'â€”'}</td>;
      case 'leadTime':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">{item.leadTime || 'â€”'}</td>;
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
      case 'trend':
        return <td key={colKey} className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">â€”</td>;
      case 'specSheet':
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center">
            {item.hasSpecSheet ? (
              <a href={item.specSheetUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">View</a>
            ) : 'â€”'}
          </td>
        );
      // Overage view columns (not typically shown in simple view but included for completeness)
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
        // Only show if commission splits is enabled
        if (!showCommissionSplits) return null;
        const currentRep = item.outsideRepSplits.length === 1 ? item.outsideRepSplits[0] : null;
        const hasMultiple = item.outsideRepSplits.length > 1;
        const displayText = hasMultiple ? 'Multiple' : (currentRep?.repName || 'Select...');
        const filteredReps = availableOutsideReps.filter(rep =>
          rep.name.toLowerCase().includes(lineItemRepSearch.toLowerCase())
        );
        return (
          <td key={colKey} className="px-3 py-2 text-sm text-center relative">
            <div className="line-item-rep-container">
              <button
                onClick={() => {
                  setLineItemRepDropdown(lineItemRepDropdown === item.id ? null : item.id);
                  setLineItemRepSearch('');
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
                      onChange={(e) => setLineItemRepSearch(e.target.value)}
                      placeholder="Search reps..."
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {/* Multiple option */}
                    <button
                      onClick={() => {
                        // Open the line item rep splits modal
                        setLineItemRepSplitsTarget(item.id);
                        setLineItemRepSplits(item.outsideRepSplits.length > 0
                          ? item.outsideRepSplits.map(s => ({ repId: s.repId, repName: s.repName, percentage: s.percentage }))
                          : [{ repId: availableOutsideReps[0]?.id || '', repName: availableOutsideReps[0]?.name || '', percentage: 100 }]
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
                    {filteredReps.map(rep => (
                      <button
                        key={rep.id}
                        onClick={() => {
                          // Set single rep at 100%
                          setQuoteLineItems(prev => prev.map(li =>
                            li.id === item.id ? {
                              ...li,
                              outsideRepSplits: [{ repId: rep.id, repName: rep.name, percentage: 100 }]
                            } : li
                          ));
                          setLineItemRepDropdown(null);
                          setLineItemRepSearch('');
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors ${currentRep?.repId === rep.id ? 'bg-[var(--muted)]' : ''}`}
                      >
                        <div className="text-sm">{rep.name}</div>
                      </button>
                    ))}
                    {filteredReps.length === 0 && (
                      <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No reps found</div>
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
              <span className="text-[var(--muted-foreground)]">â€”</span>
            )}
          </td>
        );
      default:
        return <td key={colKey} className="px-3 py-2 text-sm">â€”</td>;
    }
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
              <div className="space-y-4">
                {/* Line Items Toolbar */}
                <div className="flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Auto-Calculate Overage Button */}
                    {quoteViewMode === 'overage' && (
                      <button
                        onClick={() => setShowAutoCalcModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors ml-2"
                        title="Auto-calculate overage for all lines"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="14" height="14" rx="2"/>
                          <path d="M7 7h2v6H7M11 7h2v3h-2M11 12h2v1h-2" strokeLinecap="round"/>
                        </svg>
                        Auto-Calc
                      </button>
                    )}

                    {/* Recipient Dropdown */}
                    {quoteViewMode === 'overage' && <div className="relative ml-4">
                      <button
                        onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                          selectedRecipient
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                            : 'border-[var(--border)] hover:bg-[var(--muted)]'
                        }`}
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 7a4 4 0 01-8 0 4 4 0 018 0zM12 14H8a6 6 0 00-6 6h16a6 6 0 00-6-6z"/>
                        </svg>
                        {selectedRecipient ? (
                          <>
                            <span>{selectedRecipient.company}</span>
                            <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                              selectedRecipient.level === 'Sell' ? 'bg-green-100 text-green-700' :
                              selectedRecipient.level === 'L1' ? 'bg-blue-100 text-blue-700' :
                              selectedRecipient.level === 'L2' ? 'bg-purple-100 text-purple-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>{selectedRecipient.level}</span>
                          </>
                        ) : 'Original Quote (All Levels)'}
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {showRecipientDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-80 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                          <div className="p-2 border-b border-[var(--border)]">
                            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">View Quote As</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedRecipient(null);
                              setShowRecipientDropdown(false);
                              setShowCompareView(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--muted)] transition-colors flex items-center justify-between ${
                              !selectedRecipient ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Original Quote</span>
                              <span className="text-xs text-[var(--muted-foreground)]">(All price levels)</span>
                            </div>
                            {!selectedRecipient && (
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 5l-9 9-4-4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                          <div className="border-t border-[var(--border)] my-1"></div>
                          <div className="p-2">
                            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Recipients</span>
                          </div>
                          {recipients.map(recipient => (
                            <div
                              key={recipient.id}
                              className={`flex items-center justify-between px-4 py-2.5 hover:bg-[var(--muted)] transition-colors ${
                                selectedRecipient?.id === recipient.id ? 'bg-[var(--primary)]/10' : ''
                              }`}
                            >
                              <button
                                onClick={() => {
                                  setSelectedRecipient(recipient);
                                  setRecipientQuoteVersion(recipient.version);
                                  setShowRecipientDropdown(false);
                                }}
                                className="flex-1 text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${selectedRecipient?.id === recipient.id ? 'text-[var(--primary)]' : ''}`}>{recipient.company}</span>
                                  {selectedRecipient?.id === recipient.id && (
                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                                      <path d="M16 5l-9 9-4-4" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                                <div className="text-xs text-[var(--muted-foreground)]">{recipient.contact}</div>
                              </button>
                              <div className="relative">
                                <select
                                  value={recipient.level}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    // Update recipient level - in real app this would update state
                                    const newLevel = e.target.value as 'Sell' | 'L1' | 'L2' | 'L3';
                                    // If this is the selected recipient, update that too
                                    if (selectedRecipient?.id === recipient.id) {
                                      setSelectedRecipient({ ...selectedRecipient, level: newLevel });
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className={`px-2 py-1 text-xs font-semibold rounded border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                                    recipient.level === 'Sell' ? 'bg-green-100 text-green-700' :
                                    recipient.level === 'L1' ? 'bg-blue-100 text-blue-700' :
                                    recipient.level === 'L2' ? 'bg-purple-100 text-purple-700' :
                                    'bg-orange-100 text-orange-700'
                                  }`}
                                >
                                  <option value="Sell">Sell</option>
                                  <option value="L1">L1</option>
                                  <option value="L2">L2</option>
                                  <option value="L3">L3</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>}

                    {/* Compare to Original Button */}
                    {quoteViewMode === 'overage' && selectedRecipient && (
                      <button
                        onClick={() => setShowCompareView(!showCompareView)}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                          showCompareView
                            ? 'border-orange-300 bg-orange-100 text-orange-700'
                            : 'border-[var(--border)] hover:bg-[var(--muted)]'
                        }`}
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 5H5a2 2 0 00-2 2v8a2 2 0 002 2h4M11 5h4a2 2 0 012 2v8a2 2 0 01-2 2h-4M10 3v14" strokeLinecap="round"/>
                        </svg>
                        {showCompareView ? 'Hide Comparison' : 'Compare to Original'}
                      </button>
                    )}

                    {selectedLineItems.size > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setShowBulkActionsMenu(!showBulkActionsMenu)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                        >
                          Bulk Actions ({selectedLineItems.size})
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        {showBulkActionsMenu && (
                          <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-[var(--border)] rounded-lg shadow-xl z-50 py-1">
                            <button
                              onClick={() => { setShowSetOverageModal(true); setShowBulkActionsMenu(false); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Set Overage %
                            </button>
                            <button
                              onClick={() => {
                                setQuoteLineItems(prev => prev.map(item =>
                                  selectedLineItems.has(item.id) ? { ...item, locked: true } : item
                                ));
                                setShowBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Lock Overage
                            </button>
                            <button
                              onClick={() => {
                                setQuoteLineItems(prev => prev.map(item =>
                                  selectedLineItems.has(item.id) ? { ...item, locked: false } : item
                                ));
                                setShowBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Unlock Overage
                            </button>
                            <button
                              onClick={() => { setShowSetEndUserModal(true); setShowBulkActionsMenu(false); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Set End User
                            </button>
                            <button
                              onClick={() => { setShowBulkActionsMenu(false); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                            >
                              Set Outside Rep Splits
                            </button>
                            <div className="border-t border-[var(--border)] my-1"></div>
                            <button
                              onClick={() => {
                                if (selectedQuote) {
                                  setSelectedQuotesForBulk(new Set([selectedQuote.id]));
                                  setShowMarkAsLostModal(true);
                                }
                                setShowBulkActionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-red-600 flex items-center gap-2"
                            >
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="10" cy="10" r="8"/>
                                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                              </svg>
                              Mark as Lost
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sections with Line Items - Single Scrollable Table */}
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-x-auto">
                  <div>
                    {/* Simple View Table */}
                    {quoteViewMode === 'simple' && (
                    <table className="w-full min-w-[1400px]">
                      {/* Table Header - Dynamically rendered in columnOrder */}
                      <thead className="bg-[var(--card)] sticky top-0 z-20 shadow-sm">
                        <tr>
                          {/* Checkbox column - always first */}
                          <th className="w-10 px-3 py-2 text-left">
                            <input
                              type="checkbox"
                              checked={quoteLineItems.length > 0 && quoteLineItems.every(item => selectedLineItems.has(item.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLineItems(new Set(quoteLineItems.map(i => i.id)));
                                } else {
                                  setSelectedLineItems(new Set());
                                }
                              }}
                              className="accent-[var(--primary)]"
                            />
                          </th>
                          {/* Section column - only in simple view with sections enabled in column mode */}
                          {quoteViewMode === 'simple' && showSections && sectionDisplayMode === 'column' && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                              Section
                            </th>
                          )}
                          {/* Dynamic columns based on columnOrder */}
                          {getOrderedVisibleColumns().map(colKey => renderHeaderCell(colKey))}
                          {/* Outside Reps column - only when commission splits enabled */}
                          {showCommissionSplits && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Outside Reps</th>
                          )}
                          {/* Inside Reps column - only when inside rep splits enabled */}
                          {showInsideRepSplits && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Inside Reps</th>
                          )}
                          {/* Empty header for expand/more button column - always last */}
                          <th className="px-2 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Simple View - Shelf Mode: Group by sections with header rows */}
                        {showSections && sectionDisplayMode === 'lineShelf' && (
                          quoteSections.map(section => {
                            const sectionItems = quoteLineItems.filter(li => li.sectionId === section.id);
                            if (sectionItems.length === 0) return null;

                            const isCollapsed = collapsedSections.has(section.id);
                            const sectionTotals = sectionItems.reduce((acc, item) => ({
                              baseTotal: acc.baseTotal + (item.basePrice * item.quantity),
                              sellTotal: acc.sellTotal + (item.sellPrice * item.quantity),
                              commissionTotal: acc.commissionTotal + (item.sellPrice * item.quantity * (item.manufacturers[0]?.commissionRate || 0.08)),
                            }), { baseTotal: 0, sellTotal: 0, commissionTotal: 0 });

                            // Calculate total columns for colspan (in shelf mode, no section column)
                            const totalColumns = 1 + getOrderedVisibleColumns().length + 1;

                            // Filter and sort items
                            const filteredSortedItems = sectionItems
                              .filter(item => {
                                const partFilter = columnFilters['partNumber']?.toLowerCase() || '';
                                const descFilter = columnFilters['description']?.toLowerCase() || '';
                                const mfrFilter = columnFilters['manufacturer']?.toLowerCase() || '';
                                return (
                                  (!partFilter || item.productNumber.toLowerCase().includes(partFilter)) &&
                                  (!descFilter || item.description.toLowerCase().includes(descFilter)) &&
                                  (!mfrFilter || item.manufacturers[0].name.toLowerCase().includes(mfrFilter))
                                );
                              })
                              .sort((a, b) => {
                                if (!sortColumn) return 0;
                                let aVal: string | number = '';
                                let bVal: string | number = '';
                                switch (sortColumn) {
                                  case 'partNumber': aVal = a.productNumber; bVal = b.productNumber; break;
                                  case 'description': aVal = a.description; bVal = b.description; break;
                                  case 'quantity': aVal = a.quantity; bVal = b.quantity; break;
                                  case 'manufacturer': aVal = a.manufacturers[0].name; bVal = b.manufacturers[0].name; break;
                                  case 'unitPrice': aVal = a.sellPrice; bVal = b.sellPrice; break;
                                  case 'sellTotal': aVal = a.sellPrice * a.quantity; bVal = b.sellPrice * b.quantity; break;
                                }
                                if (typeof aVal === 'string') {
                                  return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
                                }
                                return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
                              });

                            return (
                              <React.Fragment key={section.id}>
                                {/* Section Header Row */}
                                <tr className="bg-[var(--muted)]/20 border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors">
                                  <td colSpan={totalColumns} className="px-4 py-2.5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="checkbox"
                                          checked={sectionItems.length > 0 && sectionItems.every(item => selectedLineItems.has(item.id))}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            const sectionItemIds = sectionItems.map(item => item.id);
                                            setSelectedLineItems(prev => {
                                              const newSet = new Set(prev);
                                              const allSelected = sectionItemIds.every(id => newSet.has(id));
                                              if (allSelected) {
                                                sectionItemIds.forEach(id => newSet.delete(id));
                                              } else {
                                                sectionItemIds.forEach(id => newSet.add(id));
                                              }
                                              return newSet;
                                            });
                                          }}
                                          className="accent-[var(--primary)]"
                                          title="Select all items in section"
                                        />
                                        <button
                                          onClick={() => toggleSectionCollapse(section.id)}
                                          className="flex items-center gap-2 hover:bg-[var(--muted)] rounded px-1 -ml-1 transition-colors"
                                        >
                                          <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                                          >
                                            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                          <span className="font-semibold text-[var(--foreground)]">{section.name}</span>
                                        </button>
                                        <span className="text-sm text-[var(--muted-foreground)]">({sectionItems.length} items)</span>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm">
                                        <span className="text-[var(--muted-foreground)]">
                                          Base Price: <span className="font-semibold text-[var(--foreground)]">${sectionTotals.baseTotal.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                                        </span>
                                        <span className="text-[var(--muted-foreground)]">|</span>
                                        <span className="text-[var(--muted-foreground)]">
                                          Sell Price: <span className="font-semibold text-[var(--foreground)]">${sectionTotals.sellTotal.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                                        </span>
                                        <span className="text-[var(--muted-foreground)]">|</span>
                                        <span className="text-[var(--muted-foreground)]">
                                          Commission: <span className="font-semibold text-purple-600">${sectionTotals.commissionTotal.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                                {/* Section Line Items */}
                                {!isCollapsed && filteredSortedItems.map(item => (
                                  <tr
                                    key={item.id}
                                    className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${
                                      selectedLineItems.has(item.id) ? 'bg-[var(--primary)]/5' : ''
                                    }`}
                                  >
                                    <td className="px-3 py-2">
                                      <input
                                        type="checkbox"
                                        checked={selectedLineItems.has(item.id)}
                                        onChange={() => toggleLineItemSelection(item.id)}
                                        className="accent-[var(--primary)]"
                                      />
                                    </td>
                                    {getOrderedVisibleColumns().map(colKey => renderBodyCell(colKey, item))}
                                    {/* Outside Reps Column - Only visible when showCommissionSplits is enabled */}
                                    {showCommissionSplits && (() => {
                                      const currentRep = item.outsideRepSplits.length === 1 ? item.outsideRepSplits[0] : null;
                                      const hasMultiple = item.outsideRepSplits.length > 1;
                                      const displayText = hasMultiple ? 'Multiple' : (currentRep?.repName || 'Select...');
                                      const filteredReps = availableOutsideReps.filter(rep =>
                                        rep.name.toLowerCase().includes(lineItemRepSearch.toLowerCase())
                                      );
                                      return (
                                        <td className="px-3 py-2 text-sm relative">
                                          <div className="line-item-rep-container">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setLineItemRepDropdown(lineItemRepDropdown === item.id ? null : item.id);
                                                setLineItemRepSearch('');
                                              }}
                                              className={`w-full text-left px-2 py-1 rounded hover:bg-[var(--muted)] transition-colors flex items-center gap-1 text-xs ${hasMultiple ? 'text-[var(--primary)] font-medium' : ''}`}
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
                                                    onChange={(e) => setLineItemRepSearch(e.target.value)}
                                                    placeholder="Search reps..."
                                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                  {/* Multiple option */}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setLineItemRepSplitsTarget(item.id);
                                                      setLineItemRepSplits(item.outsideRepSplits.length > 0
                                                        ? item.outsideRepSplits.map(s => ({ repId: s.repId, repName: s.repName, percentage: s.percentage }))
                                                        : [{ repId: availableOutsideReps[0]?.id || '', repName: availableOutsideReps[0]?.name || '', percentage: 100 }]
                                                      );
                                                      setShowLineItemRepSplitsModal(true);
                                                      setLineItemRepDropdown(null);
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)] flex items-center gap-2"
                                                  >
                                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                                                      <path d="M12 4.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 8.5a2 2 0 11-4 0 2 2 0 014 0zM5 8.5a2 2 0 11-4 0 2 2 0 014 0zM10 10v6M6 14h8" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    <span className="font-medium text-[var(--primary)] text-sm">Multiple (Split Commission)</span>
                                                  </button>
                                                  {filteredReps.map(rep => (
                                                    <button
                                                      key={rep.id}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setQuoteLineItems(prev => prev.map(li =>
                                                          li.id === item.id ? {
                                                            ...li,
                                                            outsideRepSplits: [{ repId: rep.id, repName: rep.name, percentage: 100 }]
                                                          } : li
                                                        ));
                                                        setLineItemRepDropdown(null);
                                                        setLineItemRepSearch('');
                                                      }}
                                                      className={`w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors ${currentRep?.repId === rep.id ? 'bg-[var(--muted)]' : ''}`}
                                                    >
                                                      <div className="text-sm">{rep.name}</div>
                                                    </button>
                                                  ))}
                                                  {filteredReps.length === 0 && (
                                                    <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No reps found</div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })()}
                                    {/* Inside Reps Column - Only visible when showInsideRepSplits is enabled */}
                                    {showInsideRepSplits && (() => {
                                      const currentRep = item.insideRepSplits.length === 1 ? item.insideRepSplits[0] : null;
                                      const hasMultiple = item.insideRepSplits.length > 1;
                                      const displayText = hasMultiple ? 'Multiple' : (currentRep?.repName || 'Select...');
                                      const filteredReps = availableInsideReps.filter(rep =>
                                        rep.name.toLowerCase().includes(lineItemInsideRepSearch.toLowerCase())
                                      );
                                      return (
                                        <td className="px-3 py-2 text-sm relative">
                                          <div className="line-item-inside-rep-container">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setLineItemInsideRepDropdown(lineItemInsideRepDropdown === item.id ? null : item.id);
                                                setLineItemInsideRepSearch('');
                                              }}
                                              className={`w-full text-left px-2 py-1 rounded hover:bg-[var(--muted)] transition-colors flex items-center gap-1 text-xs ${hasMultiple ? 'text-[var(--primary)] font-medium' : ''}`}
                                            >
                                              <span className="flex-1 truncate">{displayText}</span>
                                              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)] flex-shrink-0">
                                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                              </svg>
                                            </button>
                                            {lineItemInsideRepDropdown === item.id && (
                                              <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                                                <div className="p-2 border-b border-[var(--border)]">
                                                  <input
                                                    type="text"
                                                    value={lineItemInsideRepSearch}
                                                    onChange={(e) => setLineItemInsideRepSearch(e.target.value)}
                                                    placeholder="Search reps..."
                                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                  {/* Multiple option */}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setLineItemInsideRepSplitsTarget(item.id);
                                                      setLineItemInsideRepSplits(item.insideRepSplits.length > 0
                                                        ? item.insideRepSplits.map(s => ({ repId: s.repId, repName: s.repName, percentage: s.percentage }))
                                                        : [{ repId: availableInsideReps[0]?.id || '', repName: availableInsideReps[0]?.name || '', percentage: 100 }]
                                                      );
                                                      setShowLineItemInsideRepSplitsModal(true);
                                                      setLineItemInsideRepDropdown(null);
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)] flex items-center gap-2"
                                                  >
                                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                                                      <path d="M12 4.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 8.5a2 2 0 11-4 0 2 2 0 014 0zM5 8.5a2 2 0 11-4 0 2 2 0 014 0zM10 10v6M6 14h8" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    <span className="font-medium text-[var(--primary)] text-sm">Multiple (Split Commission)</span>
                                                  </button>
                                                  {filteredReps.map(rep => (
                                                    <button
                                                      key={rep.id}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setQuoteLineItems(prev => prev.map(li =>
                                                          li.id === item.id ? {
                                                            ...li,
                                                            insideRepSplits: [{ repId: rep.id, repName: rep.name, percentage: 100 }]
                                                          } : li
                                                        ));
                                                        setLineItemInsideRepDropdown(null);
                                                        setLineItemInsideRepSearch('');
                                                      }}
                                                      className={`w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors ${currentRep?.repId === rep.id ? 'bg-[var(--muted)]' : ''}`}
                                                    >
                                                      <div className="text-sm">{rep.name}</div>
                                                    </button>
                                                  ))}
                                                  {filteredReps.length === 0 && (
                                                    <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No reps found</div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })()}
                                    <td className="px-2 py-2 text-center">
                                      <button
                                        onClick={() => {
                                          setLineDetailsModalItem(item);
                                          setShowLineDetailsModal(true);
                                        }}
                                        className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                        title="More details"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                          <circle cx="10" cy="4" r="2"/>
                                          <circle cx="10" cy="10" r="2"/>
                                          <circle cx="10" cy="16" r="2"/>
                                        </svg>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                {/* Add Line Row for this section */}
                                {!isCollapsed && (
                                  <tr className="border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors">
                                    <td colSpan={totalColumns + (showCommissionSplits ? 1 : 0) + (showInsideRepSplits ? 1 : 0)} className="px-4 py-2">
                                      <button
                                        className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                                        onClick={() => addLineItem(section.id)}
                                      >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                                        </svg>
                                        Add Line
                                      </button>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                        {/* Add Section row at the very bottom in shelf mode */}
                        {showSections && sectionDisplayMode === 'lineShelf' && (
                          <tr className="hover:bg-[var(--muted)]/20 transition-colors">
                            <td colSpan={1 + getOrderedVisibleColumns().length + (showCommissionSplits ? 1 : 0) + (showInsideRepSplits ? 1 : 0) + 1} className="px-4 py-3 border-t border-[var(--border)]">
                              <button
                                className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                onClick={() => addSection()}
                              >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                                </svg>
                                Add Section
                              </button>
                            </td>
                          </tr>
                        )}
                        {!(showSections && sectionDisplayMode === 'lineShelf') && (
                          /* Simple View - Column Mode or No Sections: Flat list */
                          quoteLineItems
                            .filter(item => {
                              const partFilter = columnFilters['partNumber']?.toLowerCase() || '';
                              const descFilter = columnFilters['description']?.toLowerCase() || '';
                              const mfrFilter = columnFilters['manufacturer']?.toLowerCase() || '';
                              return (
                                (!partFilter || item.productNumber.toLowerCase().includes(partFilter)) &&
                                (!descFilter || item.description.toLowerCase().includes(descFilter)) &&
                                (!mfrFilter || item.manufacturers[0].name.toLowerCase().includes(mfrFilter))
                              );
                            })
                            .sort((a, b) => {
                              if (!sortColumn) return 0;
                              let aVal: string | number = '';
                              let bVal: string | number = '';
                              switch (sortColumn) {
                                case 'partNumber': aVal = a.productNumber; bVal = b.productNumber; break;
                                case 'description': aVal = a.description; bVal = b.description; break;
                                case 'quantity': aVal = a.quantity; bVal = b.quantity; break;
                                case 'manufacturer': aVal = a.manufacturers[0].name; bVal = b.manufacturers[0].name; break;
                                case 'unitPrice': aVal = a.sellPrice; bVal = b.sellPrice; break;
                                case 'sellTotal': aVal = a.sellPrice * a.quantity; bVal = b.sellPrice * b.quantity; break;
                              }
                              if (typeof aVal === 'string') {
                                return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
                              }
                              return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
                            })
                            .map(item => (
                              <tr
                                key={item.id}
                                className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${
                                  selectedLineItems.has(item.id) ? 'bg-[var(--primary)]/5' : ''
                                }`}
                              >
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedLineItems.has(item.id)}
                                    onChange={() => toggleLineItemSelection(item.id)}
                                    className="accent-[var(--primary)]"
                                  />
                                </td>
                                {/* Section selector - only in column mode */}
                                {showSections && sectionDisplayMode === 'column' && (
                                  <td className="px-3 py-2 text-sm text-[var(--muted-foreground)] relative section-dropdown-container">
                                    <button
                                      onClick={() => {
                                        setSectionDropdownOpen(sectionDropdownOpen === item.id ? null : item.id);
                                        setShowNewSectionInput(false);
                                        setNewSectionName('');
                                      }}
                                      className="flex items-center gap-1 text-sm text-[var(--foreground)] cursor-pointer hover:bg-[var(--muted)] rounded px-2 py-1 -ml-1"
                                    >
                                      {currentQuoteSections.find(s => s.id === item.sectionId)?.name || 'Select Section'}
                                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)]">
                                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                    {sectionDropdownOpen === item.id && (
                                      <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 min-w-[200px]">
                                        <div className="py-1 max-h-[200px] overflow-y-auto">
                                          {currentQuoteSections.map(s => (
                                            <button
                                              key={s.id}
                                              onClick={() => {
                                                setQuoteLineItems(prev => prev.map(li =>
                                                  li.id === item.id ? { ...li, sectionId: s.id, sectionName: s.name } : li
                                                ));
                                                setSectionDropdownOpen(null);
                                              }}
                                              className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2 ${
                                                item.sectionId === s.id ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'
                                              }`}
                                            >
                                              {item.sectionId === s.id && (
                                                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              )}
                                              {item.sectionId !== s.id && <span className="w-[14px]" />}
                                              {s.name}
                                            </button>
                                          ))}
                                        </div>
                                        <div className="border-t border-[var(--border)]">
                                          {!showNewSectionInput ? (
                                            <button
                                              onClick={() => setShowNewSectionInput(true)}
                                              className="w-full text-left px-3 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                                            >
                                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                                              </svg>
                                              Add New Section
                                            </button>
                                          ) : (
                                            <div className="p-2">
                                              <input
                                                type="text"
                                                value={newSectionName}
                                                onChange={(e) => setNewSectionName(e.target.value)}
                                                placeholder="Section name"
                                                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] mb-2"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    createSectionAndMoveItem(item.id, newSectionName);
                                                  } else if (e.key === 'Escape') {
                                                    setShowNewSectionInput(false);
                                                    setNewSectionName('');
                                                  }
                                                }}
                                              />
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={() => createSectionAndMoveItem(item.id, newSectionName)}
                                                  disabled={!newSectionName.trim()}
                                                  className="flex-1 px-2 py-1 text-xs bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                  Create
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setShowNewSectionInput(false);
                                                    setNewSectionName('');
                                                  }}
                                                  className="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded hover:bg-[var(--muted)]"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                )}
                                {getOrderedVisibleColumns().map(colKey => renderBodyCell(colKey, item))}
                                {/* Outside Reps Column - Only visible when showCommissionSplits is enabled */}
                                {showCommissionSplits && (() => {
                                  const currentRep = item.outsideRepSplits.length === 1 ? item.outsideRepSplits[0] : null;
                                  const hasMultiple = item.outsideRepSplits.length > 1;
                                  const displayText = hasMultiple ? 'Multiple' : (currentRep?.repName || 'Select...');
                                  const filteredReps = availableOutsideReps.filter(rep =>
                                    rep.name.toLowerCase().includes(lineItemRepSearch.toLowerCase())
                                  );
                                  return (
                                    <td className="px-3 py-2 text-sm relative">
                                      <div className="line-item-rep-container">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setLineItemRepDropdown(lineItemRepDropdown === item.id ? null : item.id);
                                            setLineItemRepSearch('');
                                          }}
                                          className={`w-full text-left px-2 py-1 rounded hover:bg-[var(--muted)] transition-colors flex items-center gap-1 text-xs ${hasMultiple ? 'text-[var(--primary)] font-medium' : ''}`}
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
                                                onChange={(e) => setLineItemRepSearch(e.target.value)}
                                                placeholder="Search reps..."
                                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                              {/* Multiple option */}
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setLineItemRepSplitsTarget(item.id);
                                                  setLineItemRepSplits(item.outsideRepSplits.length > 0
                                                    ? item.outsideRepSplits.map(s => ({ repId: s.repId, repName: s.repName, percentage: s.percentage }))
                                                    : [{ repId: availableOutsideReps[0]?.id || '', repName: availableOutsideReps[0]?.name || '', percentage: 100 }]
                                                  );
                                                  setShowLineItemRepSplitsModal(true);
                                                  setLineItemRepDropdown(null);
                                                }}
                                                className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)] flex items-center gap-2"
                                              >
                                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                                                  <path d="M12 4.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 8.5a2 2 0 11-4 0 2 2 0 014 0zM5 8.5a2 2 0 11-4 0 2 2 0 014 0zM10 10v6M6 14h8" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                <span className="font-medium text-[var(--primary)] text-sm">Multiple (Split Commission)</span>
                                              </button>
                                              {filteredReps.map(rep => (
                                                <button
                                                  key={rep.id}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setQuoteLineItems(prev => prev.map(li =>
                                                      li.id === item.id ? {
                                                        ...li,
                                                        outsideRepSplits: [{ repId: rep.id, repName: rep.name, percentage: 100 }]
                                                      } : li
                                                    ));
                                                    setLineItemRepDropdown(null);
                                                    setLineItemRepSearch('');
                                                  }}
                                                  className={`w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors ${currentRep?.repId === rep.id ? 'bg-[var(--muted)]' : ''}`}
                                                >
                                                  <div className="text-sm">{rep.name}</div>
                                                </button>
                                              ))}
                                              {filteredReps.length === 0 && (
                                                <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No reps found</div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })()}
                                {/* Inside Reps Column - Only visible when showInsideRepSplits is enabled */}
                                {showInsideRepSplits && (() => {
                                  const currentRep = item.insideRepSplits.length === 1 ? item.insideRepSplits[0] : null;
                                  const hasMultiple = item.insideRepSplits.length > 1;
                                  const displayText = hasMultiple ? 'Multiple' : (currentRep?.repName || 'Select...');
                                  const filteredReps = availableInsideReps.filter(rep =>
                                    rep.name.toLowerCase().includes(lineItemInsideRepSearch.toLowerCase())
                                  );
                                  return (
                                    <td className="px-3 py-2 text-sm relative">
                                      <div className="line-item-inside-rep-container">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setLineItemInsideRepDropdown(lineItemInsideRepDropdown === item.id ? null : item.id);
                                            setLineItemInsideRepSearch('');
                                          }}
                                          className={`w-full text-left px-2 py-1 rounded hover:bg-[var(--muted)] transition-colors flex items-center gap-1 text-xs ${hasMultiple ? 'text-[var(--primary)] font-medium' : ''}`}
                                        >
                                          <span className="flex-1 truncate">{displayText}</span>
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)] flex-shrink-0">
                                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                        {lineItemInsideRepDropdown === item.id && (
                                          <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                                            <div className="p-2 border-b border-[var(--border)]">
                                              <input
                                                type="text"
                                                value={lineItemInsideRepSearch}
                                                onChange={(e) => setLineItemInsideRepSearch(e.target.value)}
                                                placeholder="Search reps..."
                                                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                              {/* Multiple option */}
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setLineItemInsideRepSplitsTarget(item.id);
                                                  setLineItemInsideRepSplits(item.insideRepSplits.length > 0
                                                    ? item.insideRepSplits.map(s => ({ repId: s.repId, repName: s.repName, percentage: s.percentage }))
                                                    : [{ repId: availableInsideReps[0]?.id || '', repName: availableInsideReps[0]?.name || '', percentage: 100 }]
                                                  );
                                                  setShowLineItemInsideRepSplitsModal(true);
                                                  setLineItemInsideRepDropdown(null);
                                                }}
                                                className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)] flex items-center gap-2"
                                              >
                                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                                                  <path d="M12 4.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 8.5a2 2 0 11-4 0 2 2 0 014 0zM5 8.5a2 2 0 11-4 0 2 2 0 014 0zM10 10v6M6 14h8" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                <span className="font-medium text-[var(--primary)] text-sm">Multiple (Split Commission)</span>
                                              </button>
                                              {filteredReps.map(rep => (
                                                <button
                                                  key={rep.id}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setQuoteLineItems(prev => prev.map(li =>
                                                      li.id === item.id ? {
                                                        ...li,
                                                        insideRepSplits: [{ repId: rep.id, repName: rep.name, percentage: 100 }]
                                                      } : li
                                                    ));
                                                    setLineItemInsideRepDropdown(null);
                                                    setLineItemInsideRepSearch('');
                                                  }}
                                                  className={`w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors ${currentRep?.repId === rep.id ? 'bg-[var(--muted)]' : ''}`}
                                                >
                                                  <div className="text-sm">{rep.name}</div>
                                                </button>
                                              ))}
                                              {filteredReps.length === 0 && (
                                                <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No reps found</div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })()}
                                <td className="px-2 py-2 text-center">
                                  <button
                                    onClick={() => {
                                      setLineDetailsModalItem(item);
                                      setShowLineDetailsModal(true);
                                    }}
                                    className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                    title="More details"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                      <circle cx="10" cy="4" r="2"/>
                                      <circle cx="10" cy="10" r="2"/>
                                      <circle cx="10" cy="16" r="2"/>
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))
                        )}
                        {/* Add Line Row at the bottom (for column mode or no sections) */}
                        {!(showSections && sectionDisplayMode === 'lineShelf') && (
                          <tr className="hover:bg-[var(--muted)]/20 transition-colors">
                            <td colSpan={1 + (showSections && sectionDisplayMode === 'column' ? 1 : 0) + getOrderedVisibleColumns().length + (showCommissionSplits ? 1 : 0) + (showInsideRepSplits ? 1 : 0) + 1} className="px-4 py-2">
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
                        )}
                      </tbody>
                    </table>
                    )}
                    {/* Overage View Table */}
                    {quoteViewMode === 'overage' && (
                    <table className="w-full min-w-[1400px]">
                      {/* Table Header for Overage View */}
                      <thead className="bg-[var(--card)] sticky top-0 z-20 shadow-sm">
                        <tr>
                          <th className="w-10 px-3 py-2 text-left">
                            <input
                              type="checkbox"
                              checked={quoteLineItems.length > 0 && quoteLineItems.every(item => selectedLineItems.has(item.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLineItems(new Set(quoteLineItems.map(i => i.id)));
                                } else {
                                  setSelectedLineItems(new Set());
                                }
                              }}
                              className="accent-[var(--primary)]"
                            />
                          </th>
                          {effectiveVisibleColumns.has('partNumber') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase relative">
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('partNumber')}>Part #</span>
                                        {sortColumn === 'partNumber' && (
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setActiveFilterColumn(activeFilterColumn === 'partNumber' ? null : 'partNumber'); }}
                                          className={`p-0.5 rounded hover:bg-[var(--muted)] ${columnFilters['partNumber'] ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                                          </svg>
                                        </button>
                                      </div>
                                      {activeFilterColumn === 'partNumber' && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-20 min-w-[180px]">
                                          <input
                                            type="text"
                                            placeholder="Filter Part #..."
                                            value={columnFilters['partNumber'] || ''}
                                            onChange={(e) => handleFilterChange('partNumber', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          {columnFilters['partNumber'] && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleFilterChange('partNumber', ''); }}
                                              className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                            >
                                              Clear filter
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </th>
                                  )}
                                  {effectiveVisibleColumns.has('description') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase relative">
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('description')}>Description</span>
                                        {sortColumn === 'description' && (
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setActiveFilterColumn(activeFilterColumn === 'description' ? null : 'description'); }}
                                          className={`p-0.5 rounded hover:bg-[var(--muted)] ${columnFilters['description'] ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                                          </svg>
                                        </button>
                                      </div>
                                      {activeFilterColumn === 'description' && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-20 min-w-[180px]">
                                          <input
                                            type="text"
                                            placeholder="Filter Description..."
                                            value={columnFilters['description'] || ''}
                                            onChange={(e) => handleFilterChange('description', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          {columnFilters['description'] && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleFilterChange('description', ''); }}
                                              className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                            >
                                              Clear filter
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </th>
                                  )}
                                  {showEndUserPerLine && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase relative">
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('endUser')}>End User</span>
                                        {sortColumn === 'endUser' && (
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setActiveFilterColumn(activeFilterColumn === 'endUser' ? null : 'endUser'); }}
                                          className={`p-0.5 rounded hover:bg-[var(--muted)] ${columnFilters['endUser'] ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                                          </svg>
                                        </button>
                                      </div>
                                      {activeFilterColumn === 'endUser' && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-20 min-w-[180px]">
                                          <input
                                            type="text"
                                            placeholder="Filter End User..."
                                            value={columnFilters['endUser'] || ''}
                                            onChange={(e) => handleFilterChange('endUser', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          {columnFilters['endUser'] && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleFilterChange('endUser', ''); }}
                                              className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                            >
                                              Clear filter
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </th>
                                  )}
                                  {effectiveVisibleColumns.has('manufacturer') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase relative">
                                      <div className="flex items-center justify-center gap-1">
                                        <span className="cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('manufacturer')}>Mfr</span>
                                        {sortColumn === 'manufacturer' && (
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setActiveFilterColumn(activeFilterColumn === 'manufacturer' ? null : 'manufacturer'); }}
                                          className={`p-0.5 rounded hover:bg-[var(--muted)] ${columnFilters['manufacturer'] ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round"/>
                                          </svg>
                                        </button>
                                      </div>
                                      {activeFilterColumn === 'manufacturer' && (
                                        <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg p-2 z-20 min-w-[180px]">
                                          <input
                                            type="text"
                                            placeholder="Filter Manufacturer..."
                                            value={columnFilters['manufacturer'] || ''}
                                            onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          {columnFilters['manufacturer'] && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleFilterChange('manufacturer', ''); }}
                                              className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                            >
                                              Clear filter
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </th>
                                  )}
                                  {effectiveVisibleColumns.has('quantity') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('quantity')}>
                                      <div className="flex items-center justify-center gap-1">
                                        Qty
                                        {sortColumn === 'quantity' && (
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                      </div>
                                    </th>
                                  )}
                                  {effectiveVisibleColumns.has('uom') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                                      UOM
                                    </th>
                                  )}
                                  {effectiveVisibleColumns.has('unitPrice') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)] whitespace-nowrap" onClick={() => handleSort('unitPrice')}>
                                      <div className="flex items-center justify-center gap-1">
                                        Unit Price
                                        {sortColumn === 'unitPrice' && (
                                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                            <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        )}
                                      </div>
                                    </th>
                                  )}
                                  {/* Show single Price column when recipient selected, otherwise show all price columns */}
                                  {selectedRecipient ? (
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                                      <div className="flex items-center justify-end gap-2">
                                        <span>Price</span>
                                        <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                                          selectedRecipient.level === 'Sell' ? 'bg-green-100 text-green-700' :
                                          selectedRecipient.level === 'L1' ? 'bg-blue-100 text-blue-700' :
                                          selectedRecipient.level === 'L2' ? 'bg-purple-100 text-purple-700' :
                                          'bg-orange-100 text-orange-700'
                                        }`}>{selectedRecipient.level}</span>
                                      </div>
                                    </th>
                                  ) : (
                                    <>
                                      {effectiveVisibleColumns.has('overage') && (
                                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('overage')}>
                                          <div className="flex items-center justify-center gap-1">
                                            % Over
                                            {sortColumn === 'overage' && (
                                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                                <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            )}
                                          </div>
                                        </th>
                                      )}
                                      {effectiveVisibleColumns.has('sellTotal') && (
                                        <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)] whitespace-nowrap" onClick={() => handleSort('sellTotal')}>
                                          <div className="flex items-center justify-center gap-1">
                                            Sell $
                                            {sortColumn === 'sellTotal' && (
                                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                                <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            )}
                                          </div>
                                        </th>
                                      )}
                                      {effectiveVisibleColumns.has('l1') && (
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('l1')}>
                                          <div className="flex items-center justify-end gap-1">
                                            L1
                                            {sortColumn === 'l1' && (
                                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                                <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            )}
                                          </div>
                                        </th>
                                      )}
                                      {effectiveVisibleColumns.has('l2') && (
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase cursor-pointer hover:text-[var(--foreground)]" onClick={() => handleSort('l2')}>
                                          <div className="flex items-center justify-end gap-1">
                                            L2
                                            {sortColumn === 'l2' && (
                                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                                                <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            )}
                                          </div>
                                        </th>
                                      )}
                                      {effectiveVisibleColumns.has('l3') && (
                                        <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">L3</th>
                                      )}
                                    </>
                                  )}
                                  {effectiveVisibleColumns.has('commRate') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Com %</th>
                                  )}
                                  {effectiveVisibleColumns.has('baseComm') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Com $</th>
                                  )}
                                  {effectiveVisibleColumns.has('overageShare') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Ovg %</th>
                                  )}
                                  {effectiveVisibleColumns.has('overageComm') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Ovg $</th>
                                  )}
                                  {effectiveVisibleColumns.has('effRate') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Earn %</th>
                                  )}
                                  {effectiveVisibleColumns.has('totalEarn') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Earn $</th>
                                  )}
                                  {effectiveVisibleColumns.has('trend') && (
                                    <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Trend</th>
                                  )}
                          {effectiveVisibleColumns.has('specSheet') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Spec</th>
                          )}
                          {showCommissionSplits && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Outside Reps</th>
                          )}
                          {showInsideRepSplits && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Inside Reps</th>
                          )}
                          {effectiveVisibleColumns.has('commissionDiscountPercent') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Comm Disc %</th>
                          )}
                          {effectiveVisibleColumns.has('commissionDiscountAmount') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Comm Disc $</th>
                          )}
                          {effectiveVisibleColumns.has('lineDiscountPercent') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Line Disc %</th>
                          )}
                          {effectiveVisibleColumns.has('lineDiscountAmount') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Line Disc $</th>
                          )}
                          {effectiveVisibleColumns.has('leadTime') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Lead Time</th>
                          )}
                          {effectiveVisibleColumns.has('divisor') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Multiplier</th>
                          )}
                          {effectiveVisibleColumns.has('linkedOrder') && (
                            <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase whitespace-nowrap">Order #</th>
                          )}
                          {/* Empty header for expand/more button column */}
                          <th className="px-2 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Overage View - Sections with headers and totals */}
                        {quoteViewMode === 'overage' && quoteSections.map(section => {
                          const sectionItems = quoteLineItems.filter(li => li.sectionId === section.id);
                          if (sectionItems.length === 0) return null;

                          const isCollapsed = collapsedSections.has(section.id);
                          const sectionTotals = sectionItems.reduce((acc, item) => {
                            let sellPrice = item.sellPrice;
                            if (selectedRecipient) {
                              switch (selectedRecipient.level) {
                                case 'L1': sellPrice = item.level1Price; break;
                                case 'L2': sellPrice = item.level2Price; break;
                                case 'L3': sellPrice = item.level3Price; break;
                                default: sellPrice = item.sellPrice;
                              }
                            }
                            const mfr = item.manufacturers[0];
                            const overageAmt = (item.sellPrice - item.basePrice) * item.quantity;
                            const baseComm = item.basePrice * mfr.commissionRate * item.quantity;
                            const overageComm = (item.sellPrice - item.basePrice) * mfr.overageShare * item.quantity;
                            const totalComm = baseComm + overageComm;
                            return {
                              baseTotal: acc.baseTotal + (item.basePrice * item.quantity),
                              sellTotal: acc.sellTotal + (sellPrice * item.quantity),
                              overageTotal: acc.overageTotal + overageAmt,
                              commissionTotal: acc.commissionTotal + totalComm,
                              earnTotal: acc.earnTotal + totalComm
                            };
                          }, { baseTotal: 0, sellTotal: 0, overageTotal: 0, commissionTotal: 0, earnTotal: 0 });
                          // Keep backwards compatible names
                          const sectionTotal = sectionTotals.sellTotal;
                          const sectionEarnings = {
                            overageTotal: sectionTotals.overageTotal,
                            baseCommTotal: 0, // Not used anymore
                            overageCommTotal: 0, // Not used anymore
                            earnTotal: sectionTotals.earnTotal
                          };
                          const sectionNeedsApproval = sectionItems.some(item =>
                            item.manufacturers.some(m => m.approvalStatus === 'not_approved')
                          );

                          // Calculate total columns for colspan
                          const totalColumns = 1 + effectiveVisibleColumns.size; // checkbox + visible columns

                          // Filter and sort section items
                          const filteredSortedItems = sectionItems
                            .filter(item => {
                              const partFilter = columnFilters['partNumber']?.toLowerCase() || '';
                              const descFilter = columnFilters['description']?.toLowerCase() || '';
                              const mfrFilter = columnFilters['manufacturer']?.toLowerCase() || '';
                              return (
                                (!partFilter || item.productNumber.toLowerCase().includes(partFilter)) &&
                                (!descFilter || item.description.toLowerCase().includes(descFilter)) &&
                                (!mfrFilter || item.manufacturers[0].name.toLowerCase().includes(mfrFilter))
                              );
                            })
                            .sort((a, b) => {
                              if (!sortColumn) return 0;
                              let aVal: string | number = '';
                              let bVal: string | number = '';
                              switch (sortColumn) {
                                case 'partNumber': aVal = a.productNumber; bVal = b.productNumber; break;
                                case 'description': aVal = a.description; bVal = b.description; break;
                                case 'quantity': aVal = a.quantity; bVal = b.quantity; break;
                                case 'manufacturer': aVal = a.manufacturers[0].name; bVal = b.manufacturers[0].name; break;
                                case 'unitPrice': aVal = a.sellPrice; bVal = b.sellPrice; break;
                                case 'sellTotal': aVal = a.sellPrice * a.quantity; bVal = b.sellPrice * b.quantity; break;
                                case 'overage': aVal = a.overagePercent; bVal = b.overagePercent; break;
                                case 'l1': aVal = a.level1Price; bVal = b.level1Price; break;
                                case 'l2': aVal = a.level2Price; bVal = b.level2Price; break;
                              }
                              if (typeof aVal === 'string') {
                                return sortDirection === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
                              }
                              return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
                            });

                          return (
                            <React.Fragment key={section.id}>
                              {/* Section Header Row - Only show when sections enabled AND in shelf mode */}
                              {showSections && sectionDisplayMode === 'lineShelf' && (
                              <tr
                                className="bg-[var(--muted)]/20 border-b border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors"
                              >
                                <td colSpan={totalColumns} className="px-4 py-2.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={sectionItems.length > 0 && sectionItems.every(item => selectedLineItems.has(item.id))}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          const sectionItemIds = sectionItems.map(item => item.id);
                                          setSelectedLineItems(prev => {
                                            const newSet = new Set(prev);
                                            const allSelected = sectionItemIds.every(id => newSet.has(id));
                                            if (allSelected) {
                                              sectionItemIds.forEach(id => newSet.delete(id));
                                            } else {
                                              sectionItemIds.forEach(id => newSet.add(id));
                                            }
                                            return newSet;
                                          });
                                        }}
                                        className="accent-[var(--primary)]"
                                        title="Select all items in section"
                                      />
                                      <button
                                        onClick={() => toggleSectionCollapse(section.id)}
                                        className="flex items-center gap-2 hover:bg-[var(--muted)] rounded px-1 -ml-1 transition-colors"
                                      >
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 20 20"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                                        >
                                          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <span className="font-semibold text-[var(--foreground)]">{section.name}</span>
                                      </button>
                                      <span className="text-sm text-[var(--muted-foreground)]">({sectionItems.length} items)</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className="text-[var(--muted-foreground)]">
                                        Base Price: <span className="font-semibold text-[var(--foreground)]">${sectionTotals.baseTotal.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                                      </span>
                                      <span className="text-[var(--muted-foreground)]">|</span>
                                      <span className="text-[var(--muted-foreground)]">
                                        Sell Price: <span className="font-semibold text-[var(--foreground)]">${sectionTotals.sellTotal.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                                      </span>
                                      <span className="text-[var(--muted-foreground)]">|</span>
                                      <span className="text-[var(--muted-foreground)]">
                                        Commission: <span className="font-semibold text-purple-600">${sectionTotals.commissionTotal.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              )}
                              {/* Section Line Items - Only collapse when sections are enabled in shelf mode */}
                              {(!(showSections && sectionDisplayMode === 'lineShelf') || !isCollapsed) && filteredSortedItems.map(item => (
                                  <React.Fragment key={item.id}>
                                  <tr
                                    className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${
                                      selectedLineItems.has(item.id) ? 'bg-[var(--primary)]/5' : ''
                                    } ${item.locked ? 'opacity-75' : ''} ${expandedLineItems.has(item.id) ? 'border-b-0' : ''}`}
                                  >
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedLineItems(prev => {
                                              const newSet = new Set(prev);
                                              if (newSet.has(item.id)) {
                                                newSet.delete(item.id);
                                              } else {
                                                newSet.add(item.id);
                                              }
                                              return newSet;
                                            });
                                          }}
                                          className="p-0.5 hover:bg-[var(--muted)] rounded transition-colors"
                                          title={expandedLineItems.has(item.id) ? 'Collapse details' : 'Expand details'}
                                        >
                                          <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className={`text-[var(--muted-foreground)] transition-transform ${expandedLineItems.has(item.id) ? 'rotate-90' : ''}`}
                                          >
                                            <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                                          </svg>
                                        </button>
                                        <input
                                          type="checkbox"
                                          checked={selectedLineItems.has(item.id)}
                                          onChange={() => toggleLineItemSelection(item.id)}
                                          className="accent-[var(--primary)]"
                                        />
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setQuoteLineItems(prev => prev.map(li =>
                                              li.id === item.id ? { ...li, locked: !li.locked } : li
                                            ));
                                          }}
                                          className={`p-0.5 rounded transition-colors ${item.locked ? 'text-amber-600 hover:bg-amber-50' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] opacity-40 hover:opacity-100'}`}
                                          title={item.locked ? 'Unlock overage (allow bulk changes)' : 'Lock overage (prevent bulk changes)'}
                                        >
                                          {item.locked ? (
                                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                              <rect x="5" y="9" width="10" height="8" rx="1"/>
                                              <path d="M7 9V6a3 3 0 016 0v3"/>
                                            </svg>
                                          ) : (
                                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                              <rect x="5" y="9" width="10" height="8" rx="1"/>
                                              <path d="M13 9V6a3 3 0 00-6 0"/>
                                            </svg>
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                    {effectiveVisibleColumns.has('partNumber') && (
                                      <td className="px-3 py-2 font-mono text-sm text-[var(--foreground)]">
                                        {editingCell?.itemId === item.id && editingCell?.column === 'partNumber' ? (
                                          <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => saveEdit()}
                                            onKeyDown={(e) => e.key === 'Enter' ? saveEdit() : e.key === 'Escape' && cancelEdit()}
                                            className="w-full px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none"
                                            autoFocus
                                          />
                                        ) : (
                                          <span className="cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded" onClick={() => startEditing(item.id, 'partNumber', item.productNumber)}>
                                            {item.productNumber}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('description') && (
                                      <td className="px-3 py-2 text-sm text-[var(--foreground)] max-w-[300px]">
                                        {editingCell?.itemId === item.id && editingCell?.column === 'description' ? (
                                          <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => saveEdit()}
                                            onKeyDown={(e) => e.key === 'Enter' ? saveEdit() : e.key === 'Escape' && cancelEdit()}
                                            className="w-full px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none"
                                            autoFocus
                                          />
                                        ) : (
                                          <span className="cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded truncate block" title={item.description} onClick={() => startEditing(item.id, 'description', item.description)}>
                                            {item.description}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {showEndUserPerLine && (
                                      <td className="px-3 py-2">
                                        <select
                                          value={item.endUser}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            setQuoteLineItems(prev => prev.map(li =>
                                              li.id === item.id ? { ...li, endUser: e.target.value } : li
                                            ));
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-full max-w-[150px] px-2 py-1 text-xs border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)] truncate"
                                          title={item.endUser || 'Select end user'}
                                        >
                                          <option value="">{selectedQuote.soldToCustomer} (Default)</option>
                                          {availableEndUsers.map(user => (
                                            <option key={user} value={user}>{user}</option>
                                          ))}
                                        </select>
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('manufacturer') && (
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-1">
                                          <LineApprovalIcon status={item.manufacturers[0].approvalStatus} />
                                          <span className="text-xs text-[var(--foreground)] truncate" title={item.manufacturers[0].name}>
                                            {item.manufacturers[0].name}
                                          </span>
                                        </div>
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('quantity') && (
                                      <td className="px-3 py-2 text-right text-sm text-[var(--foreground)]">
                                        {editingCell?.itemId === item.id && editingCell?.column === 'quantity' ? (
                                          <input
                                            type="text"
                                            inputMode="numeric"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => saveEdit()}
                                            onKeyDown={(e) => e.key === 'Enter' ? saveEdit() : e.key === 'Escape' && cancelEdit()}
                                            className="w-20 px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none text-right"
                                            autoFocus
                                          />
                                        ) : (
                                          <span className="cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded" onClick={() => startEditing(item.id, 'quantity', String(item.quantity))}>
                                            {item.quantity}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('uom') && (
                                      <td className="px-3 py-2 text-center text-sm text-[var(--muted-foreground)]">
                                        {item.uom || 'EA'}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('unitPrice') && (
                                      <td className="px-3 py-2 text-center text-sm font-medium text-[var(--foreground)]">
                                        ${item.sellPrice.toFixed(2)}
                                      </td>
                                    )}
                                    {/* Show single Price column when recipient selected, otherwise show all price columns */}
                                    {selectedRecipient ? (
                                      <td className="px-3 py-2 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <span className="text-sm font-medium text-[var(--foreground)]">
                                            ${(() => {
                                              switch (selectedRecipient.level) {
                                                case 'Sell': return item.sellPrice.toFixed(2);
                                                case 'L1': return item.level1Price.toFixed(2);
                                                case 'L2': return item.level2Price.toFixed(2);
                                                case 'L3': return item.level3Price.toFixed(2);
                                                default: return item.sellPrice.toFixed(2);
                                              }
                                            })()}
                                          </span>
                                          <select
                                            value={selectedRecipient.level}
                                            onChange={(e) => {
                                              // Per-line item level change - in real app would track per-item overrides
                                              e.stopPropagation();
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`px-1.5 py-0.5 text-xs font-semibold rounded border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--primary)] ${
                                              selectedRecipient.level === 'Sell' ? 'bg-green-100 text-green-700' :
                                              selectedRecipient.level === 'L1' ? 'bg-blue-100 text-blue-700' :
                                              selectedRecipient.level === 'L2' ? 'bg-purple-100 text-purple-700' :
                                              'bg-orange-100 text-orange-700'
                                            }`}
                                            title="Change price level for this line"
                                          >
                                            <option value="Sell">Sell</option>
                                            <option value="L1">L1</option>
                                            <option value="L2">L2</option>
                                            <option value="L3">L3</option>
                                          </select>
                                        </div>
                                      </td>
                                    ) : (
                                      <>
                                        {effectiveVisibleColumns.has('overage') && (
                                          <td className="px-3 py-2 text-right">
                                            {editingCell?.itemId === item.id && editingCell?.column === 'overage' ? (
                                              <input
                                                type="text"
                                                inputMode="decimal"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => saveEdit()}
                                                onKeyDown={handleEditKeyDown}
                                                onFocus={(e) => e.target.select()}
                                                className="w-16 px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none text-right bg-white"
                                                autoFocus
                                              />
                                            ) : (
                                              <span
                                                className="text-sm font-medium cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded text-[var(--foreground)]"
                                                onClick={() => startEditing(item.id, 'overage', item.overagePercent.toFixed(1))}
                                                title="Click to edit"
                                              >
                                                {item.overagePercent.toFixed(1)}%
                                              </span>
                                            )}
                                          </td>
                                        )}
                                        {effectiveVisibleColumns.has('sellTotal') && (
                                          <td className="px-3 py-2 text-right text-sm font-medium text-[var(--foreground)]">
                                            ${(item.sellPrice * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                          </td>
                                        )}
                                        {effectiveVisibleColumns.has('l1') && (
                                          <td className="px-3 py-2 text-right text-sm text-[var(--muted-foreground)]">
                                            {editingCell?.itemId === item.id && editingCell?.column === 'l1' ? (
                                              <input
                                                type="text"
                                                inputMode="decimal"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => saveEdit()}
                                                onKeyDown={handleEditKeyDown}
                                                onFocus={(e) => e.target.select()}
                                                className="w-24 px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none text-right bg-white"
                                                autoFocus
                                              />
                                            ) : (
                                              <span className="cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded" onClick={() => startEditing(item.id, 'l1', item.level1Price.toFixed(2))}>
                                                ${item.level1Price.toFixed(2)}
                                              </span>
                                            )}
                                          </td>
                                        )}
                                        {effectiveVisibleColumns.has('l2') && (
                                          <td className="px-3 py-2 text-right text-sm text-[var(--muted-foreground)]">
                                            {editingCell?.itemId === item.id && editingCell?.column === 'l2' ? (
                                              <input
                                                type="text"
                                                inputMode="decimal"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => saveEdit()}
                                                onKeyDown={handleEditKeyDown}
                                                onFocus={(e) => e.target.select()}
                                                className="w-24 px-2 py-1 text-sm border border-[var(--primary)] rounded focus:outline-none text-right bg-white"
                                                autoFocus
                                              />
                                            ) : (
                                              <span className="cursor-pointer hover:bg-[var(--muted)]/50 px-1 rounded" onClick={() => startEditing(item.id, 'l2', item.level2Price.toFixed(2))}>
                                                ${item.level2Price.toFixed(2)}
                                              </span>
                                            )}
                                          </td>
                                        )}
                                        {effectiveVisibleColumns.has('l3') && (
                                          <td className="px-3 py-2 text-right text-sm text-[var(--muted-foreground)]">
                                            ${item.level3Price.toFixed(2)}
                                          </td>
                                        )}
                                      </>
                                    )}
                                    {/* Commission & Earnings columns with calculated values */}
                                    {(() => {
                                      const mfr = item.manufacturers[0];
                                      const unitOverageAmt = item.sellPrice - item.basePrice;
                                      const unitBaseComm = item.basePrice * mfr.commissionRate;
                                      const unitOverageComm = unitOverageAmt * mfr.overageShare;
                                      const unitTotalEarn = unitBaseComm + unitOverageComm;
                                      const effRate = item.basePrice > 0 ? (unitTotalEarn / item.basePrice) * 100 : 0;

                                      // Line totals (unit Ã— quantity)
                                      const lineOverageAmt = unitOverageAmt * item.quantity;
                                      const lineBaseComm = unitBaseComm * item.quantity;
                                      const lineOverageComm = unitOverageComm * item.quantity;
                                      const lineTotalEarn = unitTotalEarn * item.quantity;

                                      return (
                                        <>
                                          {effectiveVisibleColumns.has('commRate') && (
                                            <td className="px-3 py-2 text-right text-sm text-purple-600 font-medium">
                                              {(mfr.commissionRate * 100).toFixed(0)}%
                                            </td>
                                          )}
                                          {effectiveVisibleColumns.has('baseComm') && (
                                            <td className="px-3 py-2 text-right text-sm text-purple-600 font-medium">
                                              ${lineBaseComm.toFixed(2)}
                                            </td>
                                          )}
                                          {effectiveVisibleColumns.has('overageShare') && (
                                            <td className="px-3 py-2 text-right text-sm text-orange-600 font-medium">
                                              {(mfr.overageShare * 100).toFixed(0)}%
                                            </td>
                                          )}
                                          {effectiveVisibleColumns.has('overageComm') && (
                                            <td className="px-3 py-2 text-right text-sm text-orange-600 font-medium">
                                              ${lineOverageComm.toFixed(2)}
                                            </td>
                                          )}
                                          {effectiveVisibleColumns.has('effRate') && (
                                            <td className="px-3 py-2 text-right text-sm font-medium text-green-600">
                                              {effRate.toFixed(1)}%
                                            </td>
                                          )}
                                          {effectiveVisibleColumns.has('totalEarn') && (
                                            <td className="px-3 py-2 text-right text-sm text-green-600 font-bold">
                                              ${lineTotalEarn.toFixed(2)}
                                            </td>
                                          )}
                                        </>
                                      );
                                    })()}
                                    {effectiveVisibleColumns.has('trend') && (
                                      <td className="px-3 py-2">
                                        <div className="flex items-center justify-center gap-1">
                                          <Sparkline manufacturerPriceHistory={item.priceHistory} quotedPriceHistory={item.quotedPriceHistory} productNumber={item.productNumber} />
                                          <button
                                            onClick={() => setShowPriceLookupModal(item.productNumber)}
                                            className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                                            title="Price Lookup"
                                          >
                                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                                              <circle cx="9" cy="9" r="5"/>
                                              <path d="M14 14l3 3" strokeLinecap="round"/>
                                            </svg>
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('specSheet') && (
                                      <td className="px-3 py-2 text-center">
                                        {item.hasSpecSheet ? (
                                          <button
                                            onClick={() => {
                                              setSpecSheetSelections(prev => {
                                                const newSet = new Set(prev);
                                                if (newSet.has(item.id)) {
                                                  newSet.delete(item.id);
                                                } else {
                                                  newSet.add(item.id);
                                                }
                                                return newSet;
                                              });
                                            }}
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                              specSheetSelections.has(item.id)
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                            title={specSheetSelections.has(item.id) ? 'Spec sheet will be included in email' : 'Click to include spec sheet in email'}
                                          >
                                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/>
                                              <path d="M8 10h4M8 14h4"/>
                                            </svg>
                                            {specSheetSelections.has(item.id) ? (
                                              <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M16 5l-9 9-4-4" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                            ) : null}
                                          </button>
                                        ) : (
                                          <span className="text-xs text-[var(--muted-foreground)]">â€”</span>
                                        )}
                                      </td>
                                    )}
                                    {/* Outside Reps Column - Only visible when showCommissionSplits is enabled */}
                                    {showCommissionSplits && (() => {
                                      const currentRep = item.outsideRepSplits.length === 1 ? item.outsideRepSplits[0] : null;
                                      const hasMultiple = item.outsideRepSplits.length > 1;
                                      const displayText = hasMultiple ? 'Multiple' : (currentRep?.repName || 'Select...');
                                      const filteredReps = availableOutsideReps.filter(rep =>
                                        rep.name.toLowerCase().includes(lineItemRepSearch.toLowerCase())
                                      );
                                      return (
                                        <td className="px-3 py-2 text-sm relative">
                                          <div className="line-item-rep-container">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setLineItemRepDropdown(lineItemRepDropdown === item.id ? null : item.id);
                                                setLineItemRepSearch('');
                                              }}
                                              className={`w-full text-left px-2 py-1 rounded hover:bg-[var(--muted)] transition-colors flex items-center gap-1 text-xs ${hasMultiple ? 'text-[var(--primary)] font-medium' : ''}`}
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
                                                    onChange={(e) => setLineItemRepSearch(e.target.value)}
                                                    placeholder="Search reps..."
                                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                  {/* Multiple option */}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setLineItemRepSplitsTarget(item.id);
                                                      setLineItemRepSplits(item.outsideRepSplits.length > 0
                                                        ? item.outsideRepSplits.map(s => ({ repId: s.repId, repName: s.repName, percentage: s.percentage }))
                                                        : [{ repId: availableOutsideReps[0]?.id || '', repName: availableOutsideReps[0]?.name || '', percentage: 100 }]
                                                      );
                                                      setShowLineItemRepSplitsModal(true);
                                                      setLineItemRepDropdown(null);
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)] flex items-center gap-2"
                                                  >
                                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                                                      <path d="M12 4.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 8.5a2 2 0 11-4 0 2 2 0 014 0zM5 8.5a2 2 0 11-4 0 2 2 0 014 0zM10 10v6M6 14h8" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    <span className="font-medium text-[var(--primary)] text-sm">Multiple (Split Commission)</span>
                                                  </button>
                                                  {filteredReps.map(rep => (
                                                    <button
                                                      key={rep.id}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setQuoteLineItems(prev => prev.map(li =>
                                                          li.id === item.id ? {
                                                            ...li,
                                                            outsideRepSplits: [{ repId: rep.id, repName: rep.name, percentage: 100 }]
                                                          } : li
                                                        ));
                                                        setLineItemRepDropdown(null);
                                                        setLineItemRepSearch('');
                                                      }}
                                                      className={`w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors ${currentRep?.repId === rep.id ? 'bg-[var(--muted)]' : ''}`}
                                                    >
                                                      <div className="text-sm">{rep.name}</div>
                                                    </button>
                                                  ))}
                                                  {filteredReps.length === 0 && (
                                                    <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No reps found</div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })()}
                                    {/* Inside Reps Column - Only visible when showInsideRepSplits is enabled */}
                                    {showInsideRepSplits && (() => {
                                      const currentRep = item.insideRepSplits.length === 1 ? item.insideRepSplits[0] : null;
                                      const hasMultiple = item.insideRepSplits.length > 1;
                                      const displayText = hasMultiple ? 'Multiple' : (currentRep?.repName || 'Select...');
                                      const filteredReps = availableInsideReps.filter(rep =>
                                        rep.name.toLowerCase().includes(lineItemInsideRepSearch.toLowerCase())
                                      );
                                      return (
                                        <td className="px-3 py-2 text-sm relative">
                                          <div className="line-item-inside-rep-container">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setLineItemInsideRepDropdown(lineItemInsideRepDropdown === item.id ? null : item.id);
                                                setLineItemInsideRepSearch('');
                                              }}
                                              className={`w-full text-left px-2 py-1 rounded hover:bg-[var(--muted)] transition-colors flex items-center gap-1 text-xs ${hasMultiple ? 'text-[var(--primary)] font-medium' : ''}`}
                                            >
                                              <span className="flex-1 truncate">{displayText}</span>
                                              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)] flex-shrink-0">
                                                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                              </svg>
                                            </button>
                                            {lineItemInsideRepDropdown === item.id && (
                                              <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50">
                                                <div className="p-2 border-b border-[var(--border)]">
                                                  <input
                                                    type="text"
                                                    value={lineItemInsideRepSearch}
                                                    onChange={(e) => setLineItemInsideRepSearch(e.target.value)}
                                                    placeholder="Search reps..."
                                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                  />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                  {/* Multiple option */}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setLineItemInsideRepSplitsTarget(item.id);
                                                      setLineItemInsideRepSplits(item.insideRepSplits.length > 0
                                                        ? item.insideRepSplits.map(s => ({ repId: s.repId, repName: s.repName, percentage: s.percentage }))
                                                        : [{ repId: availableInsideReps[0]?.id || '', repName: availableInsideReps[0]?.name || '', percentage: 100 }]
                                                      );
                                                      setShowLineItemInsideRepSplitsModal(true);
                                                      setLineItemInsideRepDropdown(null);
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)] flex items-center gap-2"
                                                  >
                                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                                                      <path d="M12 4.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 8.5a2 2 0 11-4 0 2 2 0 014 0zM5 8.5a2 2 0 11-4 0 2 2 0 014 0zM10 10v6M6 14h8" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                    <span className="font-medium text-[var(--primary)] text-sm">Multiple (Split Commission)</span>
                                                  </button>
                                                  {filteredReps.map(rep => (
                                                    <button
                                                      key={rep.id}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setQuoteLineItems(prev => prev.map(li =>
                                                          li.id === item.id ? {
                                                            ...li,
                                                            insideRepSplits: [{ repId: rep.id, repName: rep.name, percentage: 100 }]
                                                          } : li
                                                        ));
                                                        setLineItemInsideRepDropdown(null);
                                                        setLineItemInsideRepSearch('');
                                                      }}
                                                      className={`w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors ${currentRep?.repId === rep.id ? 'bg-[var(--muted)]' : ''}`}
                                                    >
                                                      <div className="text-sm">{rep.name}</div>
                                                    </button>
                                                  ))}
                                                  {filteredReps.length === 0 && (
                                                    <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No reps found</div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })()}
                                    {/* Discount columns */}
                                    {effectiveVisibleColumns.has('commissionDiscountPercent') && (
                                      <td className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">
                                        {item.commissionDiscountPercent ? `${item.commissionDiscountPercent}%` : 'â€”'}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('commissionDiscountAmount') && (
                                      <td className="px-3 py-2 text-sm text-right text-[var(--muted-foreground)]">
                                        {item.commissionDiscountAmount ? `$${item.commissionDiscountAmount.toFixed(2)}` : 'â€”'}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('lineDiscountPercent') && (
                                      <td className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">
                                        {item.lineDiscountPercent ? `${item.lineDiscountPercent}%` : 'â€”'}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('lineDiscountAmount') && (
                                      <td className="px-3 py-2 text-sm text-right text-[var(--muted-foreground)]">
                                        {item.lineDiscountAmount ? `$${item.lineDiscountAmount.toFixed(2)}` : 'â€”'}
                                      </td>
                                    )}
                                    {effectiveVisibleColumns.has('leadTime') && (
                                      <td className="px-3 py-2 text-sm text-center text-[var(--muted-foreground)]">
                                        {item.leadTime || 'â€”'}
                                      </td>
                                    )}
                                    {/* Multiplier/Divisor Column */}
                                    {effectiveVisibleColumns.has('divisor') && (
                                      <td className="px-3 py-2 text-center text-sm text-[var(--muted-foreground)]">
                                        {item.useDivisor ? `Ã·${item.divisor}` : 'â€”'}
                                      </td>
                                    )}
                                    {/* Linked Order Column */}
                                    {effectiveVisibleColumns.has('linkedOrder') && (() => {
                                      const linkedOrders = mockOrders.filter(order => order.quoteId === selectedQuote?.id);
                                      return (
                                        <td className="px-3 py-2 text-center text-sm">
                                          {linkedOrders.length > 0 ? (
                                            <button
                                              onClick={() => router.push(`/orders/${linkedOrders[0].id}`)}
                                              className="text-[var(--primary)] hover:underline"
                                            >
                                              {linkedOrders[0].orderNumber}
                                              {linkedOrders.length > 1 && ` +${linkedOrders.length - 1}`}
                                            </button>
                                          ) : (
                                            <span className="text-[var(--muted-foreground)]">â€”</span>
                                          )}
                                        </td>
                                      );
                                    })()}
                                    {/* Expand/More Actions Button */}
                                    <td className="px-2 py-2 text-center">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLineDetailsModalItem(item);
                                          setShowLineDetailsModal(true);
                                        }}
                                        className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                                        title="More details"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-[var(--muted-foreground)]">
                                          <circle cx="4" cy="10" r="2"/>
                                          <circle cx="10" cy="10" r="2"/>
                                          <circle cx="16" cy="10" r="2"/>
                                        </svg>
                                      </button>
                                    </td>
                                  </tr>
                                  {/* Expanded Product Details Row */}
                                  {expandedLineItems.has(item.id) && (
                                    <tr className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                                      <td colSpan={effectiveVisibleColumns.size + 1} className="px-0 py-0">
                                        <div className="px-8 py-3">
                                          {/* Product & Manufacturer Info Grid */}
                                          <div className="grid grid-cols-3 gap-4 max-w-6xl">
                                            {/* Left Column - Product Info */}
                                            <div className="space-y-3">
                                              <div>
                                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Product Information</div>
                                                <div className="bg-[var(--card)] rounded border border-[var(--border)] p-3 space-y-2">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Product Category</span>
                                                    <span className="text-sm font-medium text-[var(--foreground)]">{quoteSections.find(s => s.id === item.sectionId)?.name || 'General Lighting'}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Category Base Commission</span>
                                                    <span className="text-sm font-medium text-[var(--foreground)]">8.0%</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Product Commission</span>
                                                    <span className="text-sm font-medium text-[var(--foreground)]">{(item.manufacturers[0].commissionRate * 100).toFixed(1)}%</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Base Price</span>
                                                    <span className="text-sm font-medium text-[var(--foreground)]">${item.basePrice.toFixed(2)}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Customer Part Number</span>
                                                    <span className="text-sm font-medium text-[var(--foreground)]">N/A</span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Manufacturer Info */}
                                              <div>
                                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-3">Manufacturer: {item.manufacturers[0].name}</div>
                                                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 space-y-3">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Approval Status</span>
                                                    <div className="flex items-center gap-2">
                                                      <LineApprovalIcon status={item.manufacturers[0].approvalStatus} />
                                                      <span className={`text-sm font-medium ${
                                                        item.manufacturers[0].approvalStatus === 'approved' ? 'text-green-600' :
                                                        item.manufacturers[0].approvalStatus === 'conditional' ? 'text-yellow-600' :
                                                        item.manufacturers[0].approvalStatus === 'not_approved' ? 'text-red-600' : 'text-gray-500'
                                                      }`}>
                                                        {item.manufacturers[0].approvalStatus === 'approved' ? 'Approved' :
                                                         item.manufacturers[0].approvalStatus === 'conditional' ? 'Conditional' :
                                                         item.manufacturers[0].approvalStatus === 'not_approved' ? 'Not Approved' : 'Unknown'}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Manufacturer Base Commission</span>
                                                    <span className="text-sm font-medium text-[var(--foreground)]">{(item.manufacturers[0].commissionRate * 100).toFixed(1)}%</span>
                                                  </div>
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-sm text-[var(--muted-foreground)]">Overage Share %</span>
                                                    <span className="text-sm font-medium text-blue-600">{(item.manufacturers[0].overageShare * 100).toFixed(1)}%</span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Sales Representatives */}
                                              <div>
                                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-3">Sales Representatives</div>
                                                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                                                  <div className="flex items-center gap-3">
                                                    <div className="flex-1">
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Outside Rep*</div>
                                                      <select className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]">
                                                        <option>Select Rep...</option>
                                                        <option>Sarah Chen</option>
                                                        <option>Mike Torres</option>
                                                        <option>John Smith</option>
                                                      </select>
                                                    </div>
                                                    <button className="mt-4 w-7 h-7 rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] flex items-center justify-center hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex-shrink-0">
                                                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                        <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
                                                      </svg>
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Discounts */}
                                              <div>
                                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-3">Discounts</div>
                                                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                                                  <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Commission Discount %</div>
                                                      <div className="relative">
                                                        <input
                                                          type="text"
                                                          defaultValue="0"
                                                          className="w-full px-3 py-1.5 pr-7 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">%</span>
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Commission Discount $</div>
                                                      <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">$</span>
                                                        <input
                                                          type="text"
                                                          defaultValue="0"
                                                          className="w-full px-3 py-1.5 pl-5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                                                        />
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Line Discount %</div>
                                                      <div className="relative">
                                                        <input
                                                          type="text"
                                                          defaultValue="0"
                                                          className="w-full px-3 py-1.5 pr-7 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">%</span>
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Line Discount $</div>
                                                      <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">$</span>
                                                        <input
                                                          type="text"
                                                          defaultValue="0"
                                                          className="w-full px-3 py-1.5 pl-5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Right Column - Pricing Bands */}
                                            <div>
                                              <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-3">Pricing Bands</div>
                                              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                                                <table className="w-full text-sm">
                                                  <thead className="bg-[var(--muted)]/50">
                                                    <tr>
                                                      <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">Band</th>
                                                      <th className="text-right px-4 py-2 font-medium text-[var(--muted-foreground)]">Price</th>
                                                      <th className="text-right px-4 py-2 font-medium text-[var(--muted-foreground)]">Band Comm.</th>
                                                      <th className="text-right px-4 py-2 font-medium text-[var(--muted-foreground)]">Comm. $</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    <tr className="border-t border-[var(--border)]">
                                                      <td className="px-4 py-3">
                                                        <span className="font-medium text-[var(--foreground)]">Sell</span>
                                                        <span className="ml-2 text-xs text-[var(--muted-foreground)]">(Full Price)</span>
                                                      </td>
                                                      <td className="text-right px-4 py-3 font-medium text-[var(--foreground)]">${item.sellPrice.toFixed(2)}</td>
                                                      <td className="text-right px-4 py-3 text-[var(--foreground)]">{(item.manufacturers[0].commissionRate * 100).toFixed(1)}%</td>
                                                      <td className="text-right px-4 py-3 font-medium text-green-600">${(item.sellPrice * item.manufacturers[0].commissionRate).toFixed(2)}</td>
                                                    </tr>
                                                    <tr className="border-t border-[var(--border)]">
                                                      <td className="px-4 py-3">
                                                        <span className="font-medium text-[var(--foreground)]">Band 1</span>
                                                      </td>
                                                      <td className="text-right px-4 py-3 font-medium text-[var(--foreground)]">${(item.sellPrice * 0.95).toFixed(2)}</td>
                                                      <td className="text-right px-4 py-3 text-[var(--foreground)]">{((item.manufacturers[0].commissionRate * 100) - 1).toFixed(1)}%</td>
                                                      <td className="text-right px-4 py-3 font-medium text-green-600">${(item.sellPrice * 0.95 * (item.manufacturers[0].commissionRate - 0.01)).toFixed(2)}</td>
                                                    </tr>
                                                    <tr className="border-t border-[var(--border)]">
                                                      <td className="px-4 py-3">
                                                        <span className="font-medium text-[var(--foreground)]">Band 2</span>
                                                      </td>
                                                      <td className="text-right px-4 py-3 font-medium text-[var(--foreground)]">${(item.sellPrice * 0.90).toFixed(2)}</td>
                                                      <td className="text-right px-4 py-3 text-[var(--foreground)]">{((item.manufacturers[0].commissionRate * 100) - 2).toFixed(1)}%</td>
                                                      <td className="text-right px-4 py-3 font-medium text-green-600">${(item.sellPrice * 0.90 * (item.manufacturers[0].commissionRate - 0.02)).toFixed(2)}</td>
                                                    </tr>
                                                    <tr className="border-t border-[var(--border)]">
                                                      <td className="px-4 py-3">
                                                        <span className="font-medium text-[var(--foreground)]">Band 3</span>
                                                      </td>
                                                      <td className="text-right px-4 py-3 font-medium text-[var(--foreground)]">${(item.sellPrice * 0.85).toFixed(2)}</td>
                                                      <td className="text-right px-4 py-3 text-[var(--foreground)]">{((item.manufacturers[0].commissionRate * 100) - 3).toFixed(1)}%</td>
                                                      <td className="text-right px-4 py-3 font-medium text-green-600">${(item.sellPrice * 0.85 * (item.manufacturers[0].commissionRate - 0.03)).toFixed(2)}</td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </div>

                                              {/* Commission Summary */}
                                              <div className="mt-4 bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase px-4 py-2 bg-[var(--muted)]/30">Commission Summary</div>
                                                <table className="w-full text-sm">
                                                  <tbody>
                                                    <tr className="border-b border-[var(--border)]">
                                                      <td className="px-4 py-2 text-[var(--muted-foreground)]">Base Commission</td>
                                                      <td className="px-4 py-2 text-right text-[var(--muted-foreground)]">{(item.manufacturers[0].commissionRate * 100).toFixed(1)}%</td>
                                                      <td className="px-4 py-2 text-right font-medium text-[var(--foreground)]">${(item.basePrice * item.manufacturers[0].commissionRate).toFixed(2)}</td>
                                                    </tr>
                                                    <tr className="border-b border-[var(--border)]">
                                                      <td className="px-4 py-2 text-[var(--muted-foreground)]">Overage Share</td>
                                                      <td className="px-4 py-2 text-right">
                                                        {item.manufacturers[0].overageShare > 0 ? (
                                                          <span className="text-[var(--muted-foreground)]">{(item.manufacturers[0].overageShare * 100).toFixed(0)}%</span>
                                                        ) : (
                                                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">Ineligible</span>
                                                        )}
                                                      </td>
                                                      <td className="px-4 py-2 text-right font-medium">
                                                        {item.manufacturers[0].overageShare > 0 ? (
                                                          <span className="text-blue-600">${((item.sellPrice - item.basePrice) * item.manufacturers[0].overageShare).toFixed(2)}</span>
                                                        ) : (
                                                          <span className="text-gray-400">$0.00</span>
                                                        )}
                                                      </td>
                                                    </tr>
                                                    <tr className="bg-[var(--muted)]/20">
                                                      <td className="px-4 py-2 font-medium text-[var(--foreground)]">Total Commission</td>
                                                      <td className="px-4 py-2 text-right text-[var(--muted-foreground)]">
                                                        {(((item.basePrice * item.manufacturers[0].commissionRate) + ((item.sellPrice - item.basePrice) * item.manufacturers[0].overageShare)) / item.sellPrice * 100).toFixed(1)}% eff.
                                                      </td>
                                                      <td className="px-4 py-2 text-right font-semibold text-green-600">
                                                        ${((item.basePrice * item.manufacturers[0].commissionRate) + ((item.sellPrice - item.basePrice) * item.manufacturers[0].overageShare)).toFixed(2)}
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </div>

                                              {/* Lead Time & Multiplier */}
                                              <div className="mt-4">
                                                <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-3">Lead Time & Multiplier</div>
                                                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                                                  <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Lead Time</div>
                                                      <input
                                                        type="text"
                                                        placeholder="e.g., 2-3 weeks"
                                                        className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)]"
                                                      />
                                                    </div>
                                                    <div>
                                                      <div className="text-xs text-[var(--muted-foreground)] mb-1">Multiplier</div>
                                                      <div className="flex items-center gap-3 mt-1">
                                                        <button
                                                          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors bg-[var(--muted)]"
                                                        >
                                                          <span className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform translate-x-0.5" />
                                                        </button>
                                                        <span className="text-sm text-[var(--muted-foreground)]">Disabled</span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                              {/* Add Line Row for this section */}
                              {showSections && sectionDisplayMode === 'lineShelf' && !collapsedSections.has(section.id) && (
                                <tr className="border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors">
                                  <td colSpan={totalColumns} className="px-4 py-2">
                                    <button
                                      className="flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                                      onClick={() => {
                                        addLineItem(section.id);
                                      }}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                                      </svg>
                                      Add Line
                                    </button>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {/* Add Section row at the very bottom in shelf mode */}
                        {showSections && sectionDisplayMode === 'lineShelf' && (
                          <tr className="hover:bg-[var(--muted)]/20 transition-colors">
                            <td colSpan={1 + effectiveVisibleColumns.size + (showCommissionSplits ? 1 : 0) + (showInsideRepSplits ? 1 : 0) + 1} className="px-4 py-3 border-t border-[var(--border)]">
                              <button
                                className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                                onClick={() => addSection()}
                              >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                                </svg>
                                Add Section
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    )}
                  </div>
                </div>

                {/* Set Overage Modal - Enhanced with Tabs */}
                <SetOverageModal
                  show={showSetOverageModal}
                  quoteLineItems={quoteLineItems}
                  selectedLineItems={selectedLineItems}
                  overageModalTab={overageModalTab}
                  overageInputPercent={overageInputPercent}
                  overageInputTargetPrice={overageInputTargetPrice}
                  overageInputTargetMargin={overageInputTargetMargin}
                  onClose={() => setShowSetOverageModal(false)}
                  onSetOverageModalTab={setOverageModalTab}
                  onSetOverageInputPercent={setOverageInputPercent}
                  onSetOverageInputTargetPrice={setOverageInputTargetPrice}
                  onSetOverageInputTargetMargin={setOverageInputTargetMargin}
                  onApply={(newOveragePercent) => {
                    // Apply the overage changes to selected items (skip locked)
                    setQuoteLineItems(prev => prev.map(item => {
                      if (!selectedLineItems.has(item.id) || item.locked) return item;
                      return {
                        ...item,
                        sellPrice: item.basePrice * (1 + newOveragePercent / 100),
                        overagePercent: newOveragePercent
                      };
                    }));
                  }}
                />

                {/* Set Minimum Overage Modal */}
                <SetMinOverageModal
                  show={showMinOverageModal}
                  quoteLineItems={quoteLineItems}
                  selectedLineItems={selectedLineItems}
                  minOverageInput={minOverageInput}
                  onClose={() => setShowMinOverageModal(false)}
                  onSetMinOverageInput={setMinOverageInput}
                  onApply={(minPercent) => {
                    setQuoteLineItems(prev => prev.map(item => {
                      if (!selectedLineItems.has(item.id) || item.locked) return item;
                      if (item.overagePercent >= minPercent) return item;
                      return {
                        ...item,
                        sellPrice: item.basePrice * (1 + minPercent / 100),
                        overagePercent: minPercent
                      };
                    }));
                  }}
                />

                {/* Auto-Calculate Overage Modal */}
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
                  onApply={(targetOveragePercent) => {
                    setQuoteLineItems(prev => prev.map(item => {
                      if (item.locked || item.manufacturers[0].overageShare === 0) return item;
                      const newSellPrice = item.basePrice * (1 + targetOveragePercent / 100);
                      return {
                        ...item,
                        sellPrice: newSellPrice,
                        overagePercent: targetOveragePercent
                      };
                    }));
                  }}
                />

                {/* Set End User Modal */}
                <SetEndUserModal
                  show={showSetEndUserModal}
                  selectedQuote={selectedQuote}
                  selectedLineItems={selectedLineItems}
                  selectedEndUser={selectedEndUser}
                  availableEndUsers={availableEndUsers}
                  onClose={() => setShowSetEndUserModal(false)}
                  onSetSelectedEndUser={setSelectedEndUser}
                  onApply={(endUser) => {
                    setQuoteLineItems(prev => prev.map(item =>
                      selectedLineItems.has(item.id) ? { ...item, endUser } : item
                    ));
                  }}
                />

                {/* Copy Price Modal */}
                <CopyPriceModal
                  show={showCopyPriceModal}
                  selectedLineItems={selectedLineItems}
                  totals={totals}
                  onClose={() => setShowCopyPriceModal(null)}
                  onApply={() => setShowCopyPriceModal(null)}
                />

                {/* Price Lookup Modal */}
                <PriceLookupModal
                  show={showPriceLookupModal}
                  quoteLineItems={quoteLineItems}
                  priceLookupTargetPrice={priceLookupTargetPrice}
                  onClose={() => setShowPriceLookupModal(null)}
                  onSetPriceLookupTargetPrice={setPriceLookupTargetPrice}
                  onApply={(price) => {
                    // Apply price logic here if needed
                  }}
                />

                {/* Save View Modal */}
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
            )}
            {/* Approvals Tab */}
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
