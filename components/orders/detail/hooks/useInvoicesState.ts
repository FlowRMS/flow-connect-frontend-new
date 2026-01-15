/**
 * useInvoicesState Hook
 * Manages invoices state for the order detail page
 */

import { useState, useCallback } from 'react';
import {
  type OrderInvoice,
  type Invoice,
  useOrderInvoices,
  fetchInvoiceById,
} from '../../api/invoicesApi';

interface UseInvoicesStateProps {
  orderId: string | null;
}

export function useInvoicesState({ orderId }: UseInvoicesStateProps) {
  // Fetch invoices from API
  const {
    data: invoices = [],
    isLoading: isLoadingInvoices,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useOrderInvoices(orderId);

  // Modal states
  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<OrderInvoice | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<Invoice | null>(null);
  const [isLoadingInvoiceDetails, setIsLoadingInvoiceDetails] = useState(false);

  // Open invoice detail modal - fetches full invoice data
  const openInvoiceDetailModal = useCallback(async (invoice: OrderInvoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetailModal(true);
    setIsLoadingInvoiceDetails(true);

    try {
      // Fetch full invoice data including line item details
      const fullInvoice = await fetchInvoiceById(invoice.id);
      if (fullInvoice) {
        setInvoiceDetails(fullInvoice);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      // Keep modal open but show error state
    } finally {
      setIsLoadingInvoiceDetails(false);
    }
  }, []);

  // Close invoice detail modal
  const closeInvoiceDetailModal = useCallback(() => {
    setShowInvoiceDetailModal(false);
    setSelectedInvoice(null);
    setInvoiceDetails(null);
  }, []);

  // View invoice details
  const viewInvoice = useCallback((invoice: OrderInvoice) => {
    openInvoiceDetailModal(invoice);
  }, [openInvoiceDetailModal]);

  return {
    // Data
    invoices,
    isLoadingInvoices,
    invoicesError,
    refetchInvoices,

    // Modal states
    showInvoiceDetailModal,
    selectedInvoice,
    invoiceDetails,
    isLoadingInvoiceDetails,

    // Modal actions
    openInvoiceDetailModal,
    closeInvoiceDetailModal,
    viewInvoice,
  };
}
