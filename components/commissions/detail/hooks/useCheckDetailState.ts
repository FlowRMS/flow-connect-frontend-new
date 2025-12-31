/**
 * useCheckDetailState Hook
 * Main state management hook for check detail
 * Manages overall state and integrates all sub-hooks
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { CommissionCheck } from '@/lib/types/rms';
import type {
  TabType,
  CheckStatus,
  ColumnKey,
  LineItem,
  Adjustment,
  RepSplit,
  VersionInfo,
  CheckWithUnpostedLines,
  AllocationMethod,
} from '../types';
import {
  type Check as ApiCheck,
  type CreateCheckInput,
  type CheckDetailInput,
  useCheck,
  useCreateCheck,
  useUpdateCheck,
  useDeleteCheck,
} from '@/components/orders/api/checksApi';
import type { AdjustmentLandingPage } from '@/components/orders/api/adjustmentsApi';
import { DEFAULT_ACTIVE_TAB } from '../config/tabsConfig';
import { DEFAULT_VISIBLE_COLUMNS } from '../constants';
import {
  calculateLineItemsSummary,
  calculateTotalAdjustments,
  toggleAllLineItems,
} from '../utils';

interface UseCheckDetailStateProps {
  checkId: string;
}

export function useCheckDetailState({ checkId }: UseCheckDetailStateProps) {
  const router = useRouter();
  const isCreateMode = checkId === 'new';

  // Fetch check from API (skip if creating new)
  const {
    data: apiCheck,
    isLoading: isLoadingCheck,
    error: checkError,
    refetch: refetchCheck,
  } = useCheck(isCreateMode ? null : checkId);

  // Mutations
  const createCheckMutation = useCreateCheck();
  const updateCheckMutation = useUpdateCheck();
  const deleteCheckMutation = useDeleteCheck();

  // Convert API check to CommissionCheck format for compatibility
  const check: CommissionCheck | undefined = useMemo(() => {
    const now = new Date().toISOString();
    if (isCreateMode) {
      // Return a default check object for create mode
      return {
        id: 'new',
        checkNumber: '',
        salesRepId: '',
        salesRepName: '',
        manufacturerId: '',
        manufacturerName: '',
        commissionMonth: '',
        status: 'draft' as const,
        postDate: '',
        checkDate: '',
        entryDate: now,
        createdDate: now,
        details: [],
        invoicePayments: 0,
        expenseAdjustments: 0,
        creditDeductions: 0,
        netAmount: 0,
        checkBalance: 0,
        createdBy: '',
      };
    }
    if (!apiCheck) return undefined;
    return {
      id: apiCheck.id,
      checkNumber: apiCheck.checkNumber || '',
      salesRepId: '',
      salesRepName: '',
      manufacturerId: apiCheck.factoryId || '',
      manufacturerName: apiCheck.factory?.title || '',
      commissionMonth: apiCheck.commissionMonth || '',
      status: apiCheck.status === 'POSTED' ? 'posted' as const : 'draft' as const,
      postDate: apiCheck.postDate || '',
      checkDate: apiCheck.entityDate || '',
      entryDate: apiCheck.createdAt || now,
      createdDate: apiCheck.createdAt || now,
      details: [],
      invoicePayments: 0,
      expenseAdjustments: 0,
      creditDeductions: 0,
      netAmount: parseFloat(apiCheck.enteredCommissionAmount || '0'),
      checkBalance: 0,
      createdBy: apiCheck.createdById || '',
    };
  }, [apiCheck, isCreateMode]);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>(DEFAULT_ACTIVE_TAB);

  // Header fields state
  const [showHeaderFields, setShowHeaderFields] = useState(true);

  // Line items selection
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(
    new Set()
  );

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(DEFAULT_VISIBLE_COLUMNS)
  );
  const [showColumnsModal, setShowColumnsModal] = useState(false);

  // Header dropdowns
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Views state
  const [showViewsMenu, setShowViewsMenu] = useState(false);
  const [activeView, setActiveView] = useState('default');

  // Sections state
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [showSections, setShowSections] = useState(false);

  // Settings state
  const [commissionSource, setCommissionSource] = useState<'invoice' | 'order'>(
    'invoice'
  );

  // Lines to Reconcile state
  const [selectedCheckNumbers, setSelectedCheckNumbers] = useState<string[]>([
    checkId,
  ]);
  const [showCheckNumbersDropdown, setShowCheckNumbersDropdown] =
    useState(false);
  const [checkNumberSearch, setCheckNumberSearch] = useState('');
  const [unpaidInvoicesAfterDate, setUnpaidInvoicesAfterDate] = useState('');
  const [includeAllUnpaid, setIncludeAllUnpaid] = useState(false);
  const [ordersWithoutInvoicesAfterDate, setOrdersWithoutInvoicesAfterDate] =
    useState('');
  const [includeAllOrdersWithoutInvoices, setIncludeAllOrdersWithoutInvoices] =
    useState(false);

  // Posted Statement Modal
  const [showPostedStatementModal, setShowPostedStatementModal] =
    useState(false);
  const [showPostedStatementDropdown, setShowPostedStatementDropdown] =
    useState(false);

  // Version state
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<VersionInfo[]>([
    { version: 1, date: '12/14/2024', isLatest: true },
  ]);

  // Form state for editable fields
  const [factory, setFactory] = useState(check?.manufacturerName || '');
  const [commissionMonth, setCommissionMonth] = useState(
    check?.commissionMonth || ''
  );
  const [checkNumber, setCheckNumber] = useState(
    check?.checkNumber || ''
  );
  const [commissionAmount, setCommissionAmount] = useState(
    check?.netAmount || 0
  );
  const [checkDate, setCheckDate] = useState(check?.checkDate || '');
  const [status, setStatus] = useState<CheckStatus>(
    check?.status === 'posted' ? 'posted' : 'unposted'
  );
  const [postedDate, setPostedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isTotalStatedCommission, setIsTotalStatedCommission] = useState(false);
  const [isTiedToCommissionUpload, setIsTiedToCommissionUpload] = useState(true);

  // Helper to convert YYYY-MM-DD to YYYY-MM format
  const parseCommissionMonth = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    // If already YYYY-MM format, return as is
    if (/^\d{4}-\d{2}$/.test(dateStr)) return dateStr;
    // If YYYY-MM-DD format, extract YYYY-MM
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr.substring(0, 7);
    return dateStr;
  };

  // Update form fields when check changes
  useEffect(() => {
    if (check) {
      setFactory(check.manufacturerName || '');
      setCommissionMonth(parseCommissionMonth(check.commissionMonth));
      setCheckNumber(check.checkNumber || '');
      setCommissionAmount(check.netAmount || 0);
      setCheckDate(check.checkDate || '');
      setStatus(check.status === 'posted' ? 'posted' : 'unposted');
    }
  }, [check]);

  // Adjustments state (legacy format for backward compatibility)
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  // Adjustments in AdjustmentLandingPage format for the new DeductionsTab (AdjustmentsTab from orders)
  const [deductionAdjustments, setDeductionAdjustments] = useState<AdjustmentLandingPage[]>([]);

  // Rep splits modal state
  const [showRepSplitsModal, setShowRepSplitsModal] = useState(false);
  const [editingAdjustmentId, setEditingAdjustmentId] = useState<string | null>(
    null
  );
  const [tempRepSplits, setTempRepSplits] = useState<RepSplit[]>([]);

  // Mock checks with unposted lines for dropdown
  const checksWithUnpostedLines = useMemo<CheckWithUnpostedLines[]>(() => {
    return [
      {
        id: checkId,
        checkNumber: check?.checkNumber || checkId,
        hasUnpostedLines: true,
      },
      { id: 'CHK-001', checkNumber: 'CHK-001', hasUnpostedLines: true },
      { id: 'CHK-002', checkNumber: 'CHK-002', hasUnpostedLines: true },
      { id: 'CHK-003', checkNumber: 'CHK-003', hasUnpostedLines: true },
    ];
  }, [checkId, check?.checkNumber]);

  const filteredChecks = useMemo(
    () =>
      checksWithUnpostedLines.filter((c) =>
        c.checkNumber.toLowerCase().includes(checkNumberSearch.toLowerCase())
      ),
    [checksWithUnpostedLines, checkNumberSearch]
  );

  // Mock reps for dropdown
  const availableReps = useMemo(
    () => [
      'Chris Martin',
      'John Smith',
      'Jane Doe',
      'Mike Johnson',
      'Sarah Wilson',
    ],
    []
  );

  // Line items state - initialized from API data
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Convert API check details to LineItem format and sync with state
  useEffect(() => {
    if (apiCheck?.details && apiCheck.details.length > 0) {
      const convertedLineItems: LineItem[] = [];
      const convertedAdjustments: Adjustment[] = [];
      const convertedDeductionAdjustments: AdjustmentLandingPage[] = [];

      apiCheck.details.forEach((detail) => {
        const isInvoice = !!detail.invoiceId;
        const isCredit = !!detail.creditId;
        const isAdjustment = !!detail.adjustmentId;
        const appliedAmount = parseFloat(detail.appliedAmount || '0');

        // Handle invoices
        if (isInvoice && detail.invoice) {
          convertedLineItems.push({
            id: detail.id,
            type: 'invoice' as const,
            number: detail.invoice.invoiceNumber || '',
            orderId: detail.invoice.orderId || '',
            orderNumber: detail.invoice.order?.orderNumber || '',
            customer: '-',
            salesRep: '-',
            commissionRateExpected: 0,
            commissionRateActual: 0,
            expectedCommission: appliedAmount,
            paidCommission: appliedAmount,
            balance: 0,
            paid: detail.invoice.status === 'PAID',
            invoiceId: detail.invoiceId,
            entityDate: detail.invoice.entityDate,
            dueDate: detail.invoice.dueDate,
            status: detail.invoice.status,
            createdAt: detail.invoice.createdAt,
            url: detail.invoice.url,
          });
        }

        // Handle credits
        if (isCredit && detail.credit) {
          convertedLineItems.push({
            id: detail.id,
            type: 'credit' as const,
            number: detail.credit.creditNumber || '',
            orderId: detail.credit.orderId || '',
            orderNumber: detail.credit.order?.orderNumber || '',
            customer: '-',
            salesRep: '-',
            commissionRateExpected: 0,
            commissionRateActual: 0,
            expectedCommission: -appliedAmount,
            paidCommission: -appliedAmount,
            balance: 0,
            paid: detail.credit.status === 'PAID',
            creditId: detail.creditId,
            entityDate: detail.credit.entityDate,
            status: detail.credit.status,
            createdAt: detail.credit.createdAt,
            url: detail.credit.url,
            creditType: detail.credit.creditType,
            reason: detail.credit.reason,
          });
        }

        // Handle adjustments - now added to line items table
        if (isAdjustment && detail.adjustment) {
          const adjustmentAmount = parseFloat(detail.adjustment.amount || '0');
          convertedLineItems.push({
            id: detail.id,
            type: 'adjustment' as const,
            number: detail.adjustment.adjustmentNumber || '',
            orderId: '', // Adjustments don't have orderId
            customer: detail.adjustment.customer?.companyName || '-',
            customerName: detail.adjustment.customer?.companyName || '',
            salesRep: '-',
            commissionRateExpected: 0,
            commissionRateActual: 0,
            expectedCommission: adjustmentAmount,
            paidCommission: appliedAmount,
            balance: adjustmentAmount - appliedAmount,
            paid: detail.adjustment.status === 'POSTED',
            adjustmentId: detail.adjustmentId,
            entityDate: detail.adjustment.entityDate,
            status: detail.adjustment.status,
            createdAt: detail.adjustment.createdAt,
            reason: detail.adjustment.reason,
            amount: adjustmentAmount,
            factoryId: detail.adjustment.factoryId,
            factoryName: detail.adjustment.factory?.title || '',
            locked: detail.adjustment.locked,
          });

          // Also add to adjustments for the Deductions tab (for backward compatibility)
          convertedAdjustments.push({
            id: detail.id,
            factory: apiCheck.factory?.title || '',
            amount: adjustmentAmount,
            reason: detail.adjustment.reason || '',
            source: 'manual' as const,
            createdAt: new Date(detail.adjustment.createdAt || Date.now()),
            allocationMethod: 'rep-split' as AllocationMethod,
            allocationTarget: '',
            repSplits: [],
            adjustmentId: detail.adjustmentId,
          });

          // Add to deductionAdjustments in AdjustmentLandingPage format for new UI
          convertedDeductionAdjustments.push({
            id: detail.adjustment.id || detail.id,
            adjustmentNumber: detail.adjustment.adjustmentNumber,
            amount: detail.adjustment.amount,
            createdAt: detail.adjustment.createdAt,
            entityDate: detail.adjustment.entityDate,
            locked: detail.adjustment.locked,
            reason: detail.adjustment.reason,
            status: detail.adjustment.status as 'PENDING' | 'POSTED' | 'VOID' | undefined,
          });
        }
      });

      setLineItems(convertedLineItems);
      if (convertedAdjustments.length > 0) {
        setAdjustments(convertedAdjustments);
      }
      setDeductionAdjustments(convertedDeductionAdjustments);
    } else if (isCreateMode) {
      // Start with empty line items for new checks
      setLineItems([]);
      setAdjustments([]);
      setDeductionAdjustments([]);
    }
  }, [apiCheck?.details, apiCheck?.factory?.title, isCreateMode]);

  // Adjustment functions
  const addAdjustment = () => {
    const newId = `adj-${Date.now()}`;
    setAdjustments((prev) => [
      ...prev,
      {
        id: newId,
        factory: check?.manufacturerName || '',
        amount: 0,
        reason: '',
        source: 'manual',
        createdAt: new Date(),
        allocationMethod: 'rep-split',
        allocationTarget: '',
        repSplits: [],
      },
    ]);
  };

  const deleteAdjustment = (id: string) => {
    setAdjustments((prev) => prev.filter((adj) => adj.id !== id));
  };

  const updateAdjustment = (
    id: string,
    field: keyof Adjustment,
    value: string | number | RepSplit[] | AllocationMethod | Date
  ) => {
    setAdjustments((prev) =>
      prev.map((adj) => (adj.id === id ? { ...adj, [field]: value } : adj))
    );
  };

  // Rep splits modal functions
  const openRepSplitsModal = (adjustmentId: string) => {
    const adj = adjustments.find((a) => a.id === adjustmentId);
    setEditingAdjustmentId(adjustmentId);
    setTempRepSplits(
      adj?.repSplits.length
        ? [...adj.repSplits]
        : [{ repName: '', percentage: 100 }]
    );
    setShowRepSplitsModal(true);
  };

  const addRepToSplit = () => {
    setTempRepSplits((prev) => [...prev, { repName: '', percentage: 0 }]);
  };

  const removeRepFromSplit = (index: number) => {
    setTempRepSplits((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRepSplit = (
    index: number,
    field: keyof RepSplit,
    value: string | number
  ) => {
    setTempRepSplits((prev) =>
      prev.map((split, i) => (i === index ? { ...split, [field]: value } : split))
    );
  };

  const saveRepSplits = () => {
    if (editingAdjustmentId) {
      updateAdjustment(editingAdjustmentId, 'repSplits', tempRepSplits);
    }
    setShowRepSplitsModal(false);
    setEditingAdjustmentId(null);
  };

  const totalSplitPercentage = useMemo(() => {
    return tempRepSplits.reduce((sum, split) => sum + (split.percentage || 0), 0);
  }, [tempRepSplits]);

  // Line item functions
  const toggleLineItemSelection = (id: string) => {
    setSelectedLineItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllLineItems = () => {
    const newSelection = toggleAllLineItems(lineItems, selectedLineItems);
    setSelectedLineItems(newSelection);
  };

  const clearLineItemSelection = () => {
    setSelectedLineItems(new Set());
  };

  // Line item modal states
  const [showAddLineItemModal, setShowAddLineItemModal] = useState(false);
  const [showLineItemDetailModal, setShowLineItemDetailModal] = useState(false);
  const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null);

  // Open add line item modal
  const addNewLine = () => {
    setShowAddLineItemModal(true);
  };

  // Add a new line item from modal
  const handleAddLineItem = (item: Omit<LineItem, 'id'>) => {
    const newId = `li-${Date.now()}`;
    setLineItems((prev) => [
      ...prev,
      {
        ...item,
        id: newId,
      },
    ]);
    setShowAddLineItemModal(false);
  };

  // Open line item detail modal
  const openLineItemDetail = (item: LineItem) => {
    setSelectedLineItem(item);
    setShowLineItemDetailModal(true);
  };

  // Close line item detail modal
  const closeLineItemDetail = () => {
    setShowLineItemDetailModal(false);
    setSelectedLineItem(null);
  };

  // Update line item amount
  const updateLineItemAmount = (id: string, amount: number) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              paidCommission: item.type === 'credit' ? -Math.abs(amount) : amount,
              expectedCommission: item.type === 'credit' ? -Math.abs(amount) : amount,
            }
          : item
      )
    );
  };

  const deleteLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
    closeLineItemDetail();
  };

  const togglePaid = (id: string) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, paid: !item.paid } : item))
    );
  };

  // Summary calculations
  const summary = useMemo(() => {
    return calculateLineItemsSummary(lineItems);
  }, [lineItems]);

  const totalAdjustments = useMemo(() => {
    return calculateTotalAdjustments(adjustments);
  }, [adjustments]);

  // Factory ID state (needed for API)
  const [factoryId, setFactoryId] = useState<string>(apiCheck?.factoryId || '');

  // Update factoryId when apiCheck changes
  useEffect(() => {
    if (apiCheck?.factoryId) {
      setFactoryId(apiCheck.factoryId);
    }
  }, [apiCheck?.factoryId]);

  // Helper to extract error message
  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message: string }).message;
      if (message.includes('Cannot modify a posted check')) {
        return 'Cannot modify a posted check.';
      }
      if (message.includes('Cannot delete a posted check')) {
        return 'Cannot delete a posted check.';
      }
      return message;
    }
    return 'An unexpected error occurred';
  };

  // Save check (create or update)
  const handleSave = useCallback(async () => {
    if (!factoryId) {
      toast.error('Factory is required');
      return;
    }
    if (!commissionAmount) {
      toast.error('Commission amount is required');
      return;
    }

    // Convert line items back to CheckDetailInput format for API
    const details: CheckDetailInput[] = [];

    // Track adjustment IDs from line items to avoid duplicates with adjustments state
    const adjustmentIdsFromLineItems = new Set<string>();

    // Add line items (invoices, credits, and adjustments)
    lineItems.forEach((item) => {
      const detailInput: CheckDetailInput = {
        appliedAmount: String(Math.abs(item.paidCommission)),
      };

      // If editing an existing detail, include the id
      if (!item.id.startsWith('li-')) {
        detailInput.id = item.id;
      }

      // Set the appropriate reference based on type
      if (item.type === 'invoice' && item.invoiceId) {
        detailInput.invoiceId = item.invoiceId;
        details.push(detailInput);
      } else if (item.type === 'credit' && item.creditId) {
        detailInput.creditId = item.creditId;
        details.push(detailInput);
      } else if (item.type === 'adjustment' && item.adjustmentId) {
        detailInput.adjustmentId = item.adjustmentId;
        details.push(detailInput);
        adjustmentIdsFromLineItems.add(item.adjustmentId);
      } else if (detailInput.id) {
        // For existing details without separate invoice/credit/adjustment IDs, just update by id
        details.push(detailInput);
      }
    });

    // Add adjustments from deductions tab (only if not already added from line items)
    adjustments.forEach((adj) => {
      // Skip if this adjustment was already added from line items
      if (adj.adjustmentId && adjustmentIdsFromLineItems.has(adj.adjustmentId)) {
        return;
      }

      const detailInput: CheckDetailInput = {
        appliedAmount: String(adj.amount),
      };

      // If editing an existing adjustment detail, include the id
      if (!adj.id.startsWith('adj-')) {
        detailInput.id = adj.id;
      }

      // Set the adjustment reference
      if (adj.adjustmentId) {
        detailInput.adjustmentId = adj.adjustmentId;
        details.push(detailInput);
      } else if (detailInput.id) {
        // For existing details, just update by id
        details.push(detailInput);
      }
    });

    // Convert commissionMonth from YYYY-MM to YYYY-MM-01 (full date format required by API)
    const formattedCommissionMonth = commissionMonth ? `${commissionMonth}-01` : undefined;

    const input: CreateCheckInput = {
      checkNumber: checkNumber || undefined,
      entityDate: checkDate || new Date().toISOString().split('T')[0],
      postDate: postedDate || undefined,
      commissionMonth: formattedCommissionMonth,
      enteredCommissionAmount: String(commissionAmount),
      factoryId,
      status: status === 'posted' ? 'POSTED' : 'OPEN',
      creationType: 'MANUAL',
      details: details.length > 0 ? details : undefined,
    };

    try {
      if (isCreateMode) {
        const newCheck = await createCheckMutation.mutateAsync(input);
        toast.success('Check created successfully');
        router.push(`/commissions/${newCheck.id}`);
      } else {
        await updateCheckMutation.mutateAsync({
          ...input,
          id: checkId,
        });
        toast.success('Check updated successfully');
        refetchCheck();
      }
    } catch (error) {
      console.error('Error saving check:', error);
      toast.error(getErrorMessage(error));
    }
  }, [
    isCreateMode,
    checkId,
    checkNumber,
    checkDate,
    postedDate,
    commissionMonth,
    commissionAmount,
    factoryId,
    status,
    lineItems,
    adjustments,
    createCheckMutation,
    updateCheckMutation,
    router,
    refetchCheck,
  ]);

  // Save and close
  const handleSaveAndClose = useCallback(async () => {
    await handleSave();
    router.push('/commissions');
  }, [handleSave, router]);

  // Delete check
  const handleDelete = useCallback(async () => {
    if (isCreateMode) return;

    try {
      await deleteCheckMutation.mutateAsync(checkId);
      toast.success('Check deleted successfully');
      router.push('/commissions');
    } catch (error) {
      console.error('Error deleting check:', error);
      toast.error(getErrorMessage(error));
    }
  }, [isCreateMode, checkId, deleteCheckMutation, router]);

  // Loading state - show loading for existing checks that haven't loaded yet
  if (!isCreateMode && isLoadingCheck) {
    return {
      isLoading: true,
      check: null,
    };
  }

  if (!check && !isCreateMode) {
    return null;
  }

  return {
    // Check data
    check,
    isCreateMode,
    isLoading: false,
    isLoadingCheck,
    checkError,

    // Save/Delete actions
    handleSave,
    handleSaveAndClose,
    handleDelete,
    isSaving: createCheckMutation.isPending || updateCheckMutation.isPending,
    isDeleting: deleteCheckMutation.isPending,

    // Factory ID (for API)
    factoryId,
    setFactoryId,

    // Tab state
    activeTab,
    setActiveTab,

    // Header fields
    showHeaderFields,
    setShowHeaderFields,

    // Line items selection
    selectedLineItems,
    toggleLineItemSelection,
    selectAllLineItems,
    clearLineItemSelection,

    // Column visibility
    visibleColumns,
    setVisibleColumns,
    showColumnsModal,
    setShowColumnsModal,

    // Header dropdowns
    showActionsDropdown,
    setShowActionsDropdown,
    showStatusDropdown,
    setShowStatusDropdown,
    showSaveDropdown,
    setShowSaveDropdown,

    // Views state
    showViewsMenu,
    setShowViewsMenu,
    activeView,
    setActiveView,

    // Sections state
    showSectionsModal,
    setShowSectionsModal,
    showSections,
    setShowSections,

    // Settings state
    commissionSource,
    setCommissionSource,

    // Lines to Reconcile state
    selectedCheckNumbers,
    setSelectedCheckNumbers,
    showCheckNumbersDropdown,
    setShowCheckNumbersDropdown,
    checkNumberSearch,
    setCheckNumberSearch,
    unpaidInvoicesAfterDate,
    setUnpaidInvoicesAfterDate,
    includeAllUnpaid,
    setIncludeAllUnpaid,
    ordersWithoutInvoicesAfterDate,
    setOrdersWithoutInvoicesAfterDate,
    includeAllOrdersWithoutInvoices,
    setIncludeAllOrdersWithoutInvoices,

    // Posted Statement Modal
    showPostedStatementModal,
    setShowPostedStatementModal,
    showPostedStatementDropdown,
    setShowPostedStatementDropdown,

    // Version state
    currentVersion,
    setCurrentVersion,
    showVersionDropdown,
    setShowVersionDropdown,
    availableVersions,
    setAvailableVersions,

    // Form fields
    factory,
    setFactory,
    commissionMonth,
    setCommissionMonth,
    checkNumber,
    setCheckNumber,
    commissionAmount,
    setCommissionAmount,
    checkDate,
    setCheckDate,
    status,
    setStatus,
    postedDate,
    setPostedDate,
    isTotalStatedCommission,
    setIsTotalStatedCommission,
    isTiedToCommissionUpload,
    setIsTiedToCommissionUpload,

    // Adjustments (legacy)
    adjustments,
    setAdjustments,
    addAdjustment,
    deleteAdjustment,
    updateAdjustment,
    // Deduction adjustments (AdjustmentLandingPage format for new DeductionsTab)
    deductionAdjustments,
    setDeductionAdjustments,

    // Rep splits modal
    showRepSplitsModal,
    setShowRepSplitsModal,
    editingAdjustmentId,
    setEditingAdjustmentId,
    tempRepSplits,
    setTempRepSplits,
    openRepSplitsModal,
    addRepToSplit,
    removeRepFromSplit,
    updateRepSplit,
    saveRepSplits,
    totalSplitPercentage,
    availableReps,

    // Line items
    lineItems,
    setLineItems,
    addNewLine,
    deleteLineItem,
    togglePaid,

    // Line item modals
    showAddLineItemModal,
    setShowAddLineItemModal,
    showLineItemDetailModal,
    setShowLineItemDetailModal,
    selectedLineItem,
    handleAddLineItem,
    openLineItemDetail,
    closeLineItemDetail,
    updateLineItemAmount,

    // Computed values
    summary,
    totalAdjustments,
    filteredChecks,
  };
}

