/**
 * useInvoicesListState Hook
 * Main state management hook for the invoices list
 * Integrates all sub-hooks and manages overall state
 * Uses real API data with infinite scroll and search
 */

import { useState, useMemo, useCallback } from 'react';
import type { Invoice, OrderSplitRate, InvoiceStatus } from '@/lib/types/rms';
import { mockSalesReps } from '@/lib/data/rms-mock';
import { useInvoicesInfinite, useInvoiceSearch, type InvoiceLandingPage } from '../../api';
import { useInvoiceFilters } from './useInvoiceFilters';
import { useInvoiceSelection } from './useInvoiceSelection';
import { useInvoiceBulkActions } from './useInvoiceBulkActions';

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
    totalCommission: 0,
    splitRates: [],
    // Pass through new field directly
    factoryName: landing.factoryName,
  } as Invoice;
}

export function useInvoicesListState() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch invoices from API with infinite scroll
  const {
    data: invoicesData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInvoicesInfinite();

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

  // Integrate filter hook
  const filterState = useInvoiceFilters(invoices);

  // Integrate selection hook
  const selectionState = useInvoiceSelection();

  // Integrate bulk actions hook
  const bulkActionsState = useInvoiceBulkActions({
    selectedInvoiceIds: selectionState.selectedInvoiceIds,
    clearSelection: selectionState.clearSelection,
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
    // Filter state and actions
    ...filterState,
    // Selection state and actions
    ...selectionState,
    // Bulk actions state and actions
    ...bulkActionsState,
  };
}
