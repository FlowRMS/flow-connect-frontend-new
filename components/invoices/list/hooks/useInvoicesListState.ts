/**
 * useInvoicesListState Hook
 * Main state management hook for the invoices list
 * Integrates all sub-hooks and manages overall state
 * Uses real API data with infinite scroll and search
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import type { Invoice, OrderSplitRate, InvoiceStatus } from '@/lib/types/rms';
import { mockSalesReps } from '@/lib/data/rms-mock';
import { useInvoicesInfinite, useInvoiceSearch, type InvoiceLandingPage, type InvoiceLandingPageFilter, fetchAllInvoiceIds } from '../../api';
import { useInvoiceFilters } from './useInvoiceFilters';
import { useInvoiceBulkActions } from './useInvoiceBulkActions';
import { useBulkSelection } from '../../../shared';
import { isInvoiceLinked } from '../utils';
import type { QuickDatePreset, QuickDateField } from '../types';
import { getQuickDateRange } from '../utils';
import { formatDateToISO, formatDateToBackend } from '../../../advancedFilters/utils';
import type { ActiveFilter } from '../../../advancedFilters/types';

/**
 * Map API status to RMS InvoiceStatus type
 * RMS uses: 'open' | 'paid' | 'partial_paid' | 'void' | 'dormant'
 */
function mapApiStatusToInvoiceStatus(status?: string): InvoiceStatus {
  const s = status?.toLowerCase();
  switch (s) {
    case 'open':
      return 'open';
    case 'paid':
      return 'paid';
    case 'partial_paid':
    case 'partial':
      return 'partial_paid';
    case 'void':
      return 'void';
    case 'dormant':
      return 'dormant';
    default:
      return 'open';
  }
}

/**
 * Transform InvoiceLandingPage from API to UI Invoice type
 * Maps API fields to the existing UI structure
 */
function transformLandingPageToInvoice(landing: InvoiceLandingPage): Invoice {
  return {
    id: landing.id,
    invoiceNumber: landing.invoiceNumber || '',
    orderId: landing.orderId || '',
    orderNumber: landing.orderNumber || '',
    // Use factoryName from API if available
    customerId: '',
    customerName: '-',
    manufacturerId: '',
    manufacturerName: landing.factoryName || '-',
    status: mapApiStatusToInvoiceStatus(landing.status),
    isLocked: landing.locked || false,
    invoiceDate: landing.entityDate || '',
    entryDate: landing.entityDate || '',
    dueDate: landing.dueDate || '',
    createdAt: landing.createdAt || '',
    createdBy: typeof landing.createdBy === 'string' ? landing.createdBy : '',
    updatedAt: landing.createdAt || '',
    lineItems: [],
    subtotal: landing.total || 0,
    freight: 0,
    total: landing.total || 0,
    amountPaid: 0,
    amountCredited: 0,
    balance: landing.total || 0,
    totalCommission: landing.commission || 0,
    splitRates: [],
    // Pass through new field directly
    factoryName: landing.factoryName,
  } as Invoice;
}

export function useInvoicesListState() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Quick date filter state - defined BEFORE API hook
  const [quickDatePreset, setQuickDatePreset] = useState<QuickDatePreset>('all');
  const [quickDateField, setQuickDateField] = useState<QuickDateField>('entryDate');
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] = useState(false);

  // Server-side filters - defined BEFORE API hook so they can be passed to the query
  const [serverFilters, setServerFilters] = useState<InvoiceLandingPageFilter[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  // Handler for server-side filter changes (from AdvancedFilters)
  const handleServerFiltersChange = useCallback((filters: ActiveFilter[]) => {
    setActiveFilters(filters);
    
    // Convert ActiveFilter to InvoiceLandingPageFilter
    // Only include value OR values, not both - check which one exists
    const apiFilters: InvoiceLandingPageFilter[] = filters.map(f => {
      if (f.values && f.values.length > 0) {
        return {
          operator: f.operator,
          columnName: f.columnName,
          values: f.values,
        };
      }
      return {
        operator: f.operator,
        columnName: f.columnName,
        value: f.value,
      };
    });
    setServerFilters(apiFilters);
  }, []);

  // Build quick filters based on quick date filter selection
  const quickFilters = useMemo<InvoiceLandingPageFilter[]>(() => {
    const result: InvoiceLandingPageFilter[] = [];

    if (quickDatePreset !== 'all') {
      const { start, end } = getQuickDateRange(quickDatePreset);
      if (start && end) {
        // Use quickDateField to determine which column to filter
        // Map UI field names to API field names:
        // - entryDate (UI) -> createdAt (API)
        // - invoiceDate (UI) -> entityDate (API)
        const columnName = quickDateField === 'entryDate' ? 'createdAt' : 'entityDate';
        
        // Format date based on column type:
        // - entityDate (Invoice Date): YYYY-MM-DD format (date only)
        // - createdAt: Backend format '%Y-%m-%d %H:%M:%S' (datetime with time)
        const formatDate = (date: Date): string => {
          if (columnName === 'entityDate') {
            return formatDateToISO(date); // Returns YYYY-MM-DD
          }
          return formatDateToBackend(date); // Returns 'YYYY-MM-DD HH:MM:SS'
        };
        
        result.push({
          columnName,
          operator: 'GTE',
          value: formatDate(start),
        });

        result.push({
          columnName,
          operator: 'LTE',
          value: formatDate(end),
        });
      }
    }

    return result;
  }, [quickDatePreset, quickDateField]);

  // Combine quick filters with advanced filters
  const filters = useMemo<InvoiceLandingPageFilter[]>(() => {
    return [...quickFilters, ...serverFilters];
  }, [quickFilters, serverFilters]);

  // Fetch invoices from API with infinite scroll
  const {
    data: invoicesData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInvoicesInfinite(filters);

  // Search invoices
  const { data: searchResults, isLoading: isSearching } = useInvoiceSearch(searchQuery, searchQuery.length >= 2);

  // Flatten paginated data
  const allInvoicesData = useMemo(() => {
    if (!invoicesData?.pages) return [];
    return invoicesData.pages.flatMap(page => page.records);
  }, [invoicesData]);

  // Get total count
  const totalCount = useMemo(() => {
    if (!invoicesData?.pages || invoicesData.pages.length === 0) return 0;
    return invoicesData.pages[0].total;
  }, [invoicesData]);

  // Transform API data to UI format, using search results when searching
  const invoices: Invoice[] = useMemo(() => {
    // If searching and we have results, transform search results
    if (searchQuery.length >= 2 && searchResults) {
      return searchResults.map((result: any): Invoice => ({
        id: result.id,
        invoiceNumber: result.invoiceNumber || '',
        orderId: result.orderId || '',
        orderNumber: '',
        customerId: '',
        customerName: '',
        manufacturerId: '',
        manufacturerName: '',
        status: mapApiStatusToInvoiceStatus(result.status),
        isLocked: result.locked || false,
        invoiceDate: result.entityDate || '',
        entryDate: result.entityDate || '',
        dueDate: result.dueDate || '',
        createdAt: result.createdAt || '',
        createdBy: '',
        updatedAt: result.createdAt || '',
        lineItems: [],
        subtotal: 0,
        freight: 0,
        total: 0,
        amountPaid: 0,
        amountCredited: 0,
        balance: 0,
        totalCommission: 0,
        splitRates: [],
      }));
    }

    if (!allInvoicesData.length) return [];
    return allInvoicesData.map(transformLandingPageToInvoice);
  }, [allInvoicesData, searchQuery, searchResults]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    // Load more when within 200px of bottom
    if (scrollHeight - scrollTop - clientHeight < 200) {
      if (hasNextPage && !isFetchingNextPage && !searchQuery) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, searchQuery]);

  // Local invoices state for optimistic updates (bulk actions, etc.)
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>([]);

  // Setter that updates local invoices
  const setInvoices = (updater: Invoice[] | ((prev: Invoice[]) => Invoice[])) => {
    if (typeof updater === 'function') {
      setLocalInvoices(prev => updater(prev.length > 0 ? prev : invoices));
    } else {
      setLocalInvoices(updater);
    }
  };

  // Selected invoice for detail panel
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Create invoice modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Record payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Commission splits editing state
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);

  // Integrate filter hook (for client-side filtering and other filter state)
  // Note: quickDatePreset, quickDateField are now managed at this level for server-side
  const filterState = useInvoiceFilters(invoices);
  
  // Extract filter state, excluding quick date filters (we manage those at this level)
  const {
    quickDatePreset: _quickDatePreset,
    setQuickDatePreset: _setQuickDatePreset,
    quickDateField: _quickDateField,
    setQuickDateField: _setQuickDateField,
    showQuickDateFieldDropdown: _showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown: _setShowQuickDateFieldDropdown,
    ...otherFilterState
  } = filterState;

  // Integrate shared bulk selection hook
  // Note: Not using isItemEligible - individual row checkboxes handle disabled state
  const bulkSelection = useBulkSelection({
    items: invoices,
    totalCount,
    fetchAllIds: fetchAllInvoiceIds,
  });

  // Bulk delete modal state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Handle successful bulk delete
  const handleBulkDeleteSuccess = useCallback(() => {
    bulkSelection.clearSelection();
    setShowBulkDeleteModal(false);
    refetch();
  }, [bulkSelection, refetch]);

  // Compatibility layer for existing selection API
  const selectedInvoiceIds = bulkSelection.selectedIds;
  const toggleInvoiceSelection = useCallback((invoiceId: string) => {
    bulkSelection.handleSelectOne(invoiceId, !bulkSelection.isItemSelected(invoiceId));
  }, [bulkSelection]);
  const selectAllInvoices = useCallback(() => {
    bulkSelection.handleSelectAll(true);
  }, [bulkSelection]);
  const clearSelection = bulkSelection.clearSelection;
  const areAllEligibleSelected = bulkSelection.isAllSelected;

  // Integrate bulk actions hook
  const bulkActionsState = useInvoiceBulkActions({
    selectedInvoiceIds: bulkSelection.selectedIds,
    clearSelection: bulkSelection.clearSelection,
    setInvoices,
  });

  // Commission split editing functions
  const startEditingSplits = () => {
    if (selectedInvoice) {
      setEditedSplits([...selectedInvoice.splitRates]);
      setEditingSplits(true);
    }
  };

  const cancelEditingSplits = () => {
    setEditingSplits(false);
    setEditedSplits([]);
  };

  const updateSplitPercentage = (index: number, newPercentage: number) => {
    const updated = [...editedSplits];
    updated[index] = { ...updated[index], splitPercentage: newPercentage };
    // Recalculate commission amount based on new percentage
    if (selectedInvoice) {
      updated[index].commissionAmount =
        (selectedInvoice.totalCommission * newPercentage) / 100;
    }
    setEditedSplits(updated);
  };

  const addNewSplit = () => {
    const newSplit: OrderSplitRate = {
      salesRepId: '',
      salesRepName: '',
      splitPercentage: 0,
      commissionAmount: 0,
    };
    setEditedSplits([...editedSplits, newSplit]);
  };

  const removeSplit = (index: number) => {
    setEditedSplits(editedSplits.filter((_, i) => i !== index));
  };

  const updateSplitRep = (index: number, repId: string) => {
    const rep = mockSalesReps.find((r) => r.id === repId);
    if (rep) {
      const updated = [...editedSplits];
      updated[index] = {
        ...updated[index],
        salesRepId: repId,
        salesRepName: rep.name,
      };
      setEditedSplits(updated);
    }
  };

  const saveSplits = () => {
    if (selectedInvoice) {
      const totalPercentage = editedSplits.reduce(
        (sum, s) => sum + s.splitPercentage,
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Split percentages must total 100%');
        return;
      }

      const updatedInvoice = {
        ...selectedInvoice,
        splitRates: editedSplits,
      };
      setInvoices(
        invoices.map((i) => (i.id === selectedInvoice.id ? updatedInvoice : i))
      );
      setSelectedInvoice(updatedInvoice);
      setEditingSplits(false);
      setEditedSplits([]);
    }
  };

  const splitPercentageTotal = editedSplits.reduce(
    (sum, s) => sum + s.splitPercentage,
    0
  );

  // Handle create invoice
  const handleCreateInvoice = (newInvoice: Invoice) => {
    setInvoices([newInvoice, ...invoices]);
    setShowCreateModal(false);
    // Refetch to get fresh data from API
    refetch();
  };

  return {
    // Invoices data
    invoices,
    setInvoices,
    // Loading and error state
    isLoading,
    isSearching,
    error,
    refetch,
    // Pagination
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleScroll,
    // Search
    searchQuery,
    setSearchQuery,
    // Selected invoice
    selectedInvoice,
    setSelectedInvoice,
    // Create modal
    showCreateModal,
    setShowCreateModal,
    handleCreateInvoice,
    // Payment modal
    showPaymentModal,
    setShowPaymentModal,
    // Commission splits editing
    editingSplits,
    setEditingSplits,
    editedSplits,
    setEditedSplits,
    startEditingSplits,
    cancelEditingSplits,
    updateSplitPercentage,
    addNewSplit,
    removeSplit,
    updateSplitRep,
    saveSplits,
    splitPercentageTotal,
    // Quick date filters (managed at this level for server-side)
    quickDatePreset,
    setQuickDatePreset,
    quickDateField,
    setQuickDateField,
    showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown,
    // Advanced filters
    activeFilters,
    handleServerFiltersChange,
    serverFilters,
    // Filter state and actions (excluding quick date filters managed above)
    ...otherFilterState,
    // Selection state and actions (using shared bulk selection)
    selectedInvoiceIds,
    toggleInvoiceSelection,
    selectAllInvoices,
    clearSelection,
    areAllEligibleSelected,
    // New bulk selection values for proper "select all" functionality
    isItemSelected: bulkSelection.isItemSelected,
    isAllSelected: bulkSelection.isAllSelected,
    isPartiallySelected: bulkSelection.isPartiallySelected,
    handleSelectAll: bulkSelection.handleSelectAll,
    handleSelectOne: bulkSelection.handleSelectOne,
    selectAllMode: bulkSelection.selectAllMode,
    selectedCount: bulkSelection.selectedCount,
    getAllSelectedIds: bulkSelection.getAllSelectedIds,
    // Bulk delete modal
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    handleBulkDeleteSuccess,
    // Bulk actions state and actions
    ...bulkActionsState,
  };
}
