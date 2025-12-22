/**
 * useInvoicesListState Hook
 * Main state management hook for the invoices list
 * Integrates all sub-hooks and manages overall state
 */

import { useState } from 'react';
import type { Invoice, OrderSplitRate } from '@/lib/types/rms';
import { mockInvoices, mockSalesReps } from '@/lib/data/rms-mock';
import { useInvoiceFilters } from './useInvoiceFilters';
import { useInvoiceSelection } from './useInvoiceSelection';
import { useInvoiceBulkActions } from './useInvoiceBulkActions';

export function useInvoicesListState() {
  // Invoices data
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);

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

  return {
    // Invoices data
    invoices,
    setInvoices,
    // Selected invoice
    selectedInvoice,
    setSelectedInvoice,
    // Create modal
    showCreateModal,
    setShowCreateModal,
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

