/**
 * useInvoiceSelection Hook
 * Manages invoice selection for bulk actions
 */

import { useState, useCallback } from 'react';
import type { Invoice } from '@/lib/types/rms';
import { isInvoiceLinked, getInvoiceLinkedReason } from '../utils';

export function useInvoiceSelection() {
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(
    new Set()
  );

  // Toggle individual invoice selection
  const toggleInvoiceSelection = useCallback((invoiceId: string) => {
    setSelectedInvoiceIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  }, []);

  // Select all eligible invoices (not linked)
  const selectAllInvoices = useCallback((invoices: Invoice[]) => {
    const eligibleInvoiceIds = invoices
      .filter((i) => !isInvoiceLinked(i))
      .map((i) => i.id);
    setSelectedInvoiceIds(new Set(eligibleInvoiceIds));
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedInvoiceIds(new Set());
  }, []);

  // Check if invoice is selected
  const isInvoiceSelected = useCallback(
    (invoiceId: string) => {
      return selectedInvoiceIds.has(invoiceId);
    },
    [selectedInvoiceIds]
  );

  // Check if all eligible invoices are selected
  const areAllEligibleSelected = useCallback(
    (invoices: Invoice[]) => {
      const eligibleInvoices = invoices.filter((i) => !isInvoiceLinked(i));
      if (eligibleInvoices.length === 0) return false;
      return eligibleInvoices.every((i) => selectedInvoiceIds.has(i.id));
    },
    [selectedInvoiceIds]
  );

  return {
    selectedInvoiceIds,
    toggleInvoiceSelection,
    selectAllInvoices,
    clearSelection,
    isInvoiceSelected,
    areAllEligibleSelected,
    // Utility functions re-exported for convenience
    isInvoiceLinked,
    getInvoiceLinkedReason,
  };
}

