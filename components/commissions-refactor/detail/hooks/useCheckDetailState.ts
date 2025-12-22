/**
 * useCheckDetailState Hook
 * Main state management hook for check detail
 * Manages overall state and integrates all sub-hooks
 */

import { useState, useMemo, useEffect } from 'react';
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
import { mockChecks } from '@/lib/data/rms-mock';
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
  // Checks data
  const [checks, setChecks] = useState<CommissionCheck[]>(mockChecks);

  // Get current check
  const check = useMemo(
    () => checks.find((c) => c.id === checkId),
    [checks, checkId]
  );

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

  // Update form fields when check changes
  useEffect(() => {
    if (check) {
      setFactory(check.manufacturerName || '');
      setCommissionMonth(check.commissionMonth || '');
      setCheckNumber(check.checkNumber || '');
      setCommissionAmount(check.netAmount || 0);
      setCheckDate(check.checkDate || '');
      setStatus(check.status === 'posted' ? 'posted' : 'unposted');
    }
  }, [check]);

  // Adjustments state
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

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

  // Mock line items - in real app, this would come from the check or API
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: 'li-1',
      type: 'invoice',
      number: '124827047283',
      orderNumber: 'APC66579-0926',
      customer: '-',
      salesRep: 'Outside Rep',
      commissionRateExpected: 1.44,
      commissionRateActual: 1.44,
      expectedCommission: 663.55,
      paidCommission: 663.55,
      balance: 0,
      paid: true,
    },
    {
      id: 'li-2',
      type: 'invoice',
      number: '124827053754',
      orderNumber: '4500926810',
      customer: '-',
      salesRep: 'Outside Rep',
      commissionRateExpected: 1.44,
      commissionRateActual: 1.44,
      expectedCommission: 604.68,
      paidCommission: 604.68,
      balance: 0,
      paid: true,
    },
    {
      id: 'li-3',
      type: 'invoice',
      number: '124827055807',
      orderNumber: '4500988293',
      customer: '-',
      salesRep: 'Billy Ingram',
      commissionRateExpected: 1.44,
      commissionRateActual: 1.44,
      expectedCommission: 725.05,
      paidCommission: 725.05,
      balance: 0,
      paid: true,
    },
    {
      id: 'li-4',
      type: 'invoice',
      number: '124827056113',
      orderNumber: '4500975453',
      customer: '-',
      salesRep: 'Billy Ingram',
      commissionRateExpected: 1.44,
      commissionRateActual: 1.44,
      expectedCommission: 534.43,
      paidCommission: 534.43,
      balance: 0,
      paid: true,
    },
    {
      id: 'li-5',
      type: 'invoice',
      number: '124827056124',
      orderNumber: '4500988293',
      customer: '-',
      salesRep: 'Billy Ingram',
      commissionRateExpected: 1.44,
      commissionRateActual: 1.44,
      expectedCommission: 252.79,
      paidCommission: 252.79,
      balance: 0,
      paid: true,
    },
    {
      id: 'li-6',
      type: 'invoice',
      number: '124827056355',
      orderNumber: '01225542 R-00529/000',
      customer: '-',
      salesRep: 'David Carnaggio',
      commissionRateExpected: 1.44,
      commissionRateActual: 1.44,
      expectedCommission: 55.53,
      paidCommission: 55.53,
      balance: 0,
      paid: true,
    },
  ]);

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

  const addNewLine = () => {
    const newId = `li-${Date.now()}`;
    setLineItems((prev) => [
      ...prev,
      {
        id: newId,
        type: 'invoice',
        number: '',
        orderNumber: '',
        customer: '-',
        salesRep: '',
        commissionRateExpected: 0,
        commissionRateActual: 0,
        expectedCommission: 0,
        paidCommission: 0,
        balance: 0,
        paid: false,
      },
    ]);
  };

  const deleteLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
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

  if (!check) {
    return null;
  }

  return {
    // Check data
    check,
    checks,
    setChecks,

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

    // Adjustments
    adjustments,
    setAdjustments,
    addAdjustment,
    deleteAdjustment,
    updateAdjustment,

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

    // Computed values
    summary,
    totalAdjustments,
    checksWithUnpostedLines,
    filteredChecks,
  };
}

