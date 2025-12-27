'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { mockSubmittals } from '../lib/data/submittals-mock';
import type { Submittal } from '../lib/types/submittals';

// Import types from quotes module
import type {
  Quote,
  LineItem,
  Section,
  DistributorQuote,
  Recipient,
  SavedView,
} from './quotes/types';

// Import mock data from quotes module (some still used for detail view until fully integrated)
import {
  // mockQuotes - no longer needed, using real API data
  mockSections,
  mockLineItems,
  mockApprovalRequests,
  mockManufacturers,
  mockDistributorQuotes,
  mockDistributorQuoteLines,
  mockCrossAuditLog,
  availableOutsideReps,
  availableInsideReps,
  availableEndUsers,
  availableManufacturers,
  initialProductCatalog,
} from './quotes/data';

// Import UI components from quotes module
import {
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
  useKanbanDnD,
  useQuotesState,
} from './quotes/hooks';
import type { QuoteSortKey, QuickDatePreset, QuickDateField, QuoteFilterValue } from './quotes/hooks';

// Import Next.js router for navigation
import { useRouter } from 'next/navigation';

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

// Import API hooks for fetching single quote
import {
  useQuote,
  createQuote,
  updateQuote,
  type Quote as ApiQuote,
  type QuoteStatus as ApiQuoteStatus,
  type QuotePipelineStage,
  type CreateQuoteInput,
  type QuoteDetailInput,
  type QuoteSplitRateInput,
} from './quotes/api';

// ============================================
// Helper function to map API Quote to UI Quote
// ============================================
function mapPipelineStageToUIStage(stage?: QuotePipelineStage): Quote['stage'] {
  if (!stage) return 'Draft';
  switch (stage) {
    case 'DISCOVERY': return 'Draft';
    case 'PROSPECT': return 'Review';
    case 'QUALIFICATION': return 'Review';
    case 'PROPOSAL': return 'Sent';
    case 'NEGOTIATION': return 'Negotiating';
    case 'CLOSED_WON': return 'Won';
    case 'CLOSED_LOST': return 'Lost';
    default: return 'Draft';
  }
}

function mapApiStatusToUIStatus(status?: ApiQuoteStatus): Quote['status'] {
  if (!status) return 'Open';
  switch (status) {
    case 'OPEN': return 'Open';
    case 'ORDERED': return 'Closed';
    case 'EXPIRED': return 'Expired';
    case 'LOST': return 'Closed';
    default: return 'Open';
  }
}

// Helper to map API quote details to UI LineItems
function mapApiDetailsToLineItems(apiQuote: ApiQuote): LineItem[] {
  if (!apiQuote.details || apiQuote.details.length === 0) {
    return [];
  }

  return apiQuote.details.map((detail, index) => {
    const unitPrice = typeof detail.unitPrice === 'string'
      ? parseFloat(detail.unitPrice)
      : (detail.unitPrice || 0);
    const quantity = detail.quantity || 1;

    return {
      id: detail.id,
      quoteId: apiQuote.id,
      sectionId: 'default',
      sectionName: 'Default',
      // Use adhoc names if provided, otherwise use product data
      productNumber: detail.productNameAdhoc || detail.product?.factoryPartNumber || '',
      description: detail.productDescriptionAdhoc || detail.product?.description || '',
      endUser: '', // Will be populated by customer lookup if needed
      endUserId: detail.endUserId,
      quantity: quantity,
      uom: detail.uom?.title || 'EA',
      manufacturers: detail.product ? [{
        name: '', // Factory/manufacturer name from factory lookup
        basePrice: detail.product.unitPrice || 0,
        commissionRate: parseFloat(detail.commissionRate || detail.product.defaultCommissionRate?.toString() || '0.03'),
        overageShare: 0,
        approvalStatus: detail.product.approvalNeeded ? 'unknown' : 'approved',
        approvalDate: detail.product.approvalDate || null,
        approvalNotes: detail.product.approvalComments || null,
      }] : [],
      basePrice: detail.product?.unitPrice || unitPrice,
      sellPrice: unitPrice,
      level1Price: unitPrice,
      level2Price: unitPrice,
      level3Price: unitPrice,
      overagePercent: 0,
      commissionable: true,
      locked: false,
      priceHistory: [],
      quotedPriceHistory: [],
      hasSpecSheet: false,
      outsideRepSplits: [],
      insideRepSplits: [],
      useDivisor: detail.uom?.divisionFactor ? detail.uom.divisionFactor !== 1 : false,
      divisor: detail.uom?.divisionFactor || 1,
      commissionDiscountPercent: detail.commissionDiscountRate ? parseFloat(detail.commissionDiscountRate) * 100 : undefined,
      lineDiscountPercent: detail.discountRate ? parseFloat(detail.discountRate) * 100 : undefined,
      leadTime: detail.leadTime || detail.product?.leadTime || undefined,
      // API-specific fields
      itemNumber: detail.itemNumber || index + 1,
      status: (detail.status as LineItem['status']) || 'OPEN',
      productId: detail.productId,
      productNameAdhoc: detail.productNameAdhoc || undefined,
      productDescriptionAdhoc: detail.productDescriptionAdhoc || undefined,
      factoryId: detail.factoryId || undefined,
      note: detail.note || undefined,
      splitRates: detail.splitRates?.map(sr => ({
        id: sr.id,
        userId: sr.userId || '',
        splitRate: sr.splitRate || '0',
        position: sr.position,
      })) || [],
      commissionRate: detail.commissionRate || undefined,
      discountRate: detail.discountRate || undefined,
    };
  });
}

function mapFullApiQuoteToUIQuote(apiQuote: ApiQuote): Quote {
  return {
    id: apiQuote.quoteNumber || apiQuote.id,
    uuid: apiQuote.id,
    name: apiQuote.quoteNumber || 'New Quote',
    billToCustomer: apiQuote.billToCustomer?.companyName || '',
    billToCustomerId: apiQuote.billToCustomerId,
    soldToCustomer: apiQuote.soldToCustomer?.companyName || '',
    soldToCustomerId: apiQuote.soldToCustomerId,
    jobId: '',
    jobName: '',
    stage: mapPipelineStageToUIStage(apiQuote.pipelineStage),
    status: mapApiStatusToUIStatus(apiQuote.status),
    quoteType: 'NORMAL',
    blanket: apiQuote.blanket ?? false,
    customerRef: apiQuote.customerRef || '',
    value: apiQuote.balance?.total ? `$${apiQuote.balance.total.toLocaleString()}` : '$0',
    valueNumber: apiQuote.balance?.total || 0,
    winProbability: 50,
    entryDate: apiQuote.createdAt || '',
    quoteDate: apiQuote.entityDate || '',
    expirationDate: apiQuote.expDate || '',
    revisedDate: apiQuote.reviseDate || '',
    acceptDate: apiQuote.acceptDate || '',
    paymentTerms: apiQuote.paymentTerms || '',
    freightTerms: apiQuote.freightTerms || '',
    owner: apiQuote.createdBy?.fullName || apiQuote.createdBy?.firstName || '',
    version: 1,
    lastUpdated: apiQuote.createdAt || '',
    tags: [],
    approvalStatus: 'clear',
    pendingApprovals: 0,
    factories: [],
    endUsers: [],
    insideReps: apiQuote.insideReps?.map(rep => ({
      id: rep.userId || rep.id,
      name: '',
    })) || [],
    outsideReps: [],
    published: apiQuote.published ?? true,
    lostReason: undefined,
  };
}

// Helper to create empty quote for "new" mode
function createEmptyQuote(): Quote {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  return {
    id: '',
    uuid: 'new',
    name: 'New Quote',
    billToCustomer: '',
    billToCustomerId: undefined,
    soldToCustomer: '',
    soldToCustomerId: undefined,
    jobId: '',
    jobName: '',
    stage: 'Draft',
    status: 'Open',
    quoteType: 'NORMAL',
    blanket: false,
    customerRef: '',
    value: '$0',
    valueNumber: 0,
    winProbability: 50,
    entryDate: today,
    quoteDate: today,
    expirationDate: '',
    revisedDate: '',
    acceptDate: '',
    paymentTerms: '',
    freightTerms: '',
    owner: '',
    version: 1,
    lastUpdated: today,
    tags: [],
    approvalStatus: 'clear',
    pendingApprovals: 0,
    factories: [],
    endUsers: [],
    insideReps: [],
    outsideReps: [],
    published: false,
    lostReason: undefined,
  };
}

// ============================================
// MAIN COMPONENT PROPS
// ============================================
interface QuotesContentProps {
  initialQuoteId?: string; // If provided, load this quote directly (or 'new' for empty quote)
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function QuotesContent({ initialQuoteId }: QuotesContentProps = {}) {
  const router = useRouter();

  // Use the real API-connected quotes state hook
  const {
    quotes,
    setQuotes,
    viewMode,
    setViewMode,
    selectedQuote,
    setSelectedQuote,
    isLoading,
    error,
    refetch,
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
  } = useQuotesState();

  // ============================================
  // INITIAL QUOTE LOADING (for /quotes/[id] route)
  // ============================================
  const isNewQuote = initialQuoteId === 'new';
  const shouldFetchQuote = !!initialQuoteId && !isNewQuote;

  // Fetch the specific quote if initialQuoteId is provided
  const {
    data: fetchedApiQuote,
    isLoading: isLoadingInitialQuote,
    error: initialQuoteError
  } = useQuote(shouldFetchQuote ? initialQuoteId : '');

  // Set the selected quote when navigating directly to /quotes/[id]
  useEffect(() => {
    if (isNewQuote) {
      // Create a new empty quote
      setSelectedQuote(createEmptyQuote());
    } else if (fetchedApiQuote && !selectedQuote) {
      // Set the fetched quote as selected
      setSelectedQuote(mapFullApiQuoteToUIQuote(fetchedApiQuote));
    }
  }, [isNewQuote, fetchedApiQuote, selectedQuote, setSelectedQuote]);

  // Handle back navigation - go to /quotes list
  const handleBackToList = useCallback(() => {
    if (initialQuoteId) {
      // If we came from a direct URL, navigate back to list
      router.push('/quotes');
    } else {
      // If we're in the same page, just clear selection
      setSelectedQuote(null);
    }
  }, [initialQuoteId, router, setSelectedQuote]);

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

  // Handler for navigating to quote detail page
  const handleQuoteSelect = useCallback((quote: Quote) => {
    // Navigate to the quote detail page using the UUID
    router.push(`/quotes/${quote.uuid}`);
  }, [router]);
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

  // Spec sheet selections (line item ID -> include in email)
  const [specSheetSelections, setSpecSheetSelections] = useState<Set<string>>(new Set());
  const [showMarkApprovalModal, setShowMarkApprovalModal] = useState(false);
  const [showDistributorModal, setShowDistributorModal] = useState(false);
  const [selectedDistributorQuote, setSelectedDistributorQuote] = useState<DistributorQuote | null>(null);
  const [printSubmittal, setPrintSubmittal] = useState<Submittal | null>(null);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showViewsMenu, setShowViewsMenu] = useState(false);

  // Bulk actions for quotes list
  const [selectedQuotesForBulk, setSelectedQuotesForBulk] = useState<Set<string>>(new Set());
  const [showQuotesBulkActionsMenu, setShowQuotesBulkActionsMenu] = useState(false);
  const [showMarkAsLostModal, setShowMarkAsLostModal] = useState(false);

  // NOTE: Quotes list filtering and sorting now comes from useQuotesState hook above

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
  const [showLineItemRepSplitsModal, setShowLineItemRepSplitsModal] = useState(false);
  const [lineItemRepSplitsTarget, setLineItemRepSplitsTarget] = useState<string | null>(null);
  const [lineItemRepSplits, setLineItemRepSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);

  // Inside rep commission splits settings
  const [showInsideRepSplits, setShowInsideRepSplits] = useState(false);

  // Line item inside rep splits
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

  // Create Product Modal state (for creating official products)
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [createProductForLineItem, setCreateProductForLineItem] = useState<string | null>(null);
  const [createProductInitialData, setCreateProductInitialData] = useState({ partNumber: '', description: '' });

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
  const [isSaving, setIsSaving] = useState(false);
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
  const [showHeaderFields, setShowHeaderFields] = useState(true);

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


  // NOTE: handleQuoteSelect is defined above in the useQuotesState section - navigates to /quotes/[id]

  // Get line items for selected quote - using state so they can be modified
  const [quoteLineItems, setQuoteLineItems] = useState<LineItem[]>([]);

  // Sections state - so they can be modified
  const [quoteSections, setQuoteSections] = useState<Section[]>(mockSections);

  // Sync line items when selected quote changes - use API data if available
  useEffect(() => {
    if (selectedQuote) {
      // If we have fetched API quote data with details, use that
      if (fetchedApiQuote && fetchedApiQuote.details && fetchedApiQuote.details.length > 0) {
        const mappedLineItems = mapApiDetailsToLineItems(fetchedApiQuote);
        setQuoteLineItems(mappedLineItems);
      } else if (selectedQuote.uuid === 'new') {
        // New quote - start with empty line items
        setQuoteLineItems([]);
      } else {
        // Fallback to empty if no API data
        setQuoteLineItems([]);
      }
    } else {
      setQuoteLineItems([]);
    }
  }, [selectedQuote?.id, fetchedApiQuote]);

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
      const mfr = item.manufacturers?.[0];
      if (!mfr?.commissionRate) return sum;
      return sum + ((item.sellPrice - item.basePrice) * item.quantity * mfr.commissionRate);
    }, 0);

    return { baseTotal, sellTotal, l1Total, l2Total, l3Total, overage, commission };
  }, [quoteLineItems]);

  // Loading state for initial quote fetch (when navigating to /quotes/[id])
  // Also show loading when creating new quote and selectedQuote not yet set
  if ((shouldFetchQuote && isLoadingInitialQuote) || (isNewQuote && !selectedQuote)) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-4 text-[var(--muted-foreground)]">{isNewQuote ? 'Creating new quote...' : 'Loading quote...'}</p>
        </div>
      </main>
    );
  }

  // Error state for initial quote fetch
  if (shouldFetchQuote && initialQuoteError) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[var(--background)]">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Error Loading Quote</h2>
          <p className="text-[var(--muted-foreground)] mb-4">{initialQuoteError.message}</p>
          <button
            onClick={handleBackToList}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Quotes
          </button>
        </div>
      </main>
    );
  }

  // Helper to map UI stage to API pipeline stage
  const mapUIStageToApiStage = (stage: Quote['stage']): QuotePipelineStage => {
    switch (stage) {
      case 'Draft': return 'DISCOVERY';
      case 'Review': return 'PROSPECT';
      case 'Sent': return 'PROPOSAL';
      case 'Negotiating': return 'NEGOTIATION';
      case 'Won': return 'CLOSED_WON';
      case 'Lost': return 'CLOSED_LOST';
      case 'Dormant': return 'DISCOVERY';
      default: return 'DISCOVERY';
    }
  };

  // Helper to map UI status to API status
  const mapUIStatusToApiStatus = (status: Quote['status']): ApiQuoteStatus => {
    switch (status) {
      case 'Open': return 'OPEN';
      case 'Closed': return 'ORDERED';
      case 'Expired': return 'EXPIRED';
      case 'Pending': return 'OPEN';
      default: return 'OPEN';
    }
  };

  // Handle save quote - creates new or updates existing
  const handleSaveQuote = useCallback(async () => {
    if (!selectedQuote) return;

    // Validate required fields
    if (!selectedQuote.name || selectedQuote.name === 'New Quote') {
      alert('Please enter a quote number');
      return;
    }
    if (!selectedQuote.soldToCustomerId) {
      alert('Please select a Sold To Customer');
      return;
    }
    if (!selectedQuote.quoteDate) {
      alert('Please enter a Quote Date');
      return;
    }
    if (!selectedQuote.expirationDate) {
      alert('Please enter an Expiration Date');
      return;
    }

    setIsSaving(true);

    try {
      // Build line item details for API
      const details: QuoteDetailInput[] = quoteLineItems.map((item, index) => ({
        id: item.id.startsWith('new-') ? undefined : item.id, // Only include ID for existing items
        quantity: item.quantity,
        unitPrice: item.sellPrice.toString(),
        commissionDiscountRate: item.commissionDiscountPercent ? (item.commissionDiscountPercent / 100).toString() : undefined,
        commissionRate: item.commissionRate || (item.manufacturers[0]?.commissionRate?.toString()),
        discountRate: item.discountRate || (item.lineDiscountPercent ? (item.lineDiscountPercent / 100).toString() : undefined),
        endUserId: item.endUserId,
        factoryId: item.factoryId,
        itemNumber: index + 1,
        leadTime: item.leadTime,
        note: item.note,
        productDescriptionAdhoc: item.productDescriptionAdhoc || (item.description !== '' ? item.description : undefined),
        productNameAdhoc: item.productNameAdhoc || (item.productNumber !== '' ? item.productNumber : undefined),
        productId: item.productId,
        splitRates: item.splitRates?.map(sr => ({
          id: sr.id,
          userId: sr.userId,
          splitRate: sr.splitRate,
          position: sr.position,
        })) as QuoteSplitRateInput[],
        status: item.status || 'OPEN',
      }));

      // Build inside reps for API
      const insideReps: QuoteSplitRateInput[] = insideRepCommissionSplits.map((split, index) => ({
        userId: split.repId,
        splitRate: (split.percentage / 100).toString(), // Convert percentage to decimal
        position: index,
      }));

      // Build quote input
      const quoteInput: CreateQuoteInput = {
        id: selectedQuote.uuid !== 'new' ? selectedQuote.uuid : undefined,
        quoteNumber: selectedQuote.name,
        entityDate: selectedQuote.quoteDate,
        soldToCustomerId: selectedQuote.soldToCustomerId!,
        billToCustomerId: selectedQuote.billToCustomerId,
        status: mapUIStatusToApiStatus(selectedQuote.status),
        pipelineStage: mapUIStageToApiStage(selectedQuote.stage),
        blanket: selectedQuote.blanket,
        customerRef: selectedQuote.customerRef,
        expDate: selectedQuote.expirationDate,
        freightTerms: selectedQuote.freightTerms,
        paymentTerms: selectedQuote.paymentTerms,
        reviseDate: selectedQuote.revisedDate || undefined,
        acceptDate: selectedQuote.acceptDate || undefined,
        published: selectedQuote.published,
        details: details.length > 0 ? details : undefined,
        insideReps: insideReps.length > 0 ? insideReps : undefined,
      };

      let savedQuote: ApiQuote;

      if (selectedQuote.uuid === 'new') {
        // Create new quote
        savedQuote = await createQuote(quoteInput);
        // Navigate to the new quote's page
        router.push(`/quotes/${savedQuote.id}`);
      } else {
        // Update existing quote
        savedQuote = await updateQuote(quoteInput);
      }

      // Update local state with saved data
      const updatedUIQuote = mapFullApiQuoteToUIQuote(savedQuote);
      setSelectedQuote(updatedUIQuote);

      // Update the line items from saved response
      if (savedQuote.details) {
        const mappedLineItems = mapApiDetailsToLineItems(savedQuote);
        setQuoteLineItems(mappedLineItems);
      }

      // Refetch quotes list to include the new/updated quote
      refetch();

      alert('Quote saved successfully!');
    } catch (error) {
      console.error('Error saving quote:', error);
      alert(`Failed to save quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }, [selectedQuote, quoteLineItems, insideRepCommissionSplits, router, refetch, setSelectedQuote, setQuoteLineItems]);

  // Quote Detail View
  if (selectedQuote) {
    return (
      <main className="flex-1 overflow-auto bg-[var(--background)]">
        {/* Header */}
        <QuoteDetailHeader
          selectedQuote={selectedQuote}
          setSelectedQuote={setSelectedQuote}
          onBack={handleBackToList}
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
          onSaveQuote={handleSaveQuote}
          isSaving={isSaving}
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
        onNewQuote={() => router.push('/quotes/create')}
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
