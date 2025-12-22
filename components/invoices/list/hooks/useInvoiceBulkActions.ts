/**
 * useInvoiceBulkActions Hook
 * Manages bulk actions for selected invoices
 */

import { useState, useCallback } from 'react';
import type { Invoice, InvoiceStatus } from '@/lib/types/rms';

interface UseInvoiceBulkActionsProps {
  selectedInvoiceIds: Set<string>;
  clearSelection: () => void;
  setInvoices: (invoices: Invoice[] | ((prev: Invoice[]) => Invoice[])) => void;
}

export function useInvoiceBulkActions({
  selectedInvoiceIds,
  clearSelection,
  setInvoices,
}: UseInvoiceBulkActionsProps) {
  // Bulk actions menu state
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);

  // Bulk set status
  const bulkSetStatus = useCallback(
    (status: InvoiceStatus) => {
      setInvoices((prev) =>
        prev.map((i) => (selectedInvoiceIds.has(i.id) ? { ...i, status } : i))
      );
      clearSelection();
      setShowBulkActionsMenu(false);
    },
    [selectedInvoiceIds, clearSelection, setInvoices]
  );

  // Bulk delete
  const bulkDelete = useCallback(() => {
    if (
      confirm(
        `Are you sure you want to delete ${selectedInvoiceIds.size} invoice(s)? This action cannot be undone.`
      )
    ) {
      setInvoices((prev) => prev.filter((i) => !selectedInvoiceIds.has(i.id)));
      clearSelection();
      setShowBulkActionsMenu(false);
    }
  }, [selectedInvoiceIds, clearSelection, setInvoices]);

  return {
    // Bulk actions menu
    showBulkActionsMenu,
    setShowBulkActionsMenu,
    // Actions
    bulkSetStatus,
    bulkDelete,
  };
}

