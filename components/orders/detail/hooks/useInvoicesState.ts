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
import { useDeleteInvoice } from '@/components/invoices/api/useInvoicesApi';
import { invoiceToasts } from '@/components/lib/toast';

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

  // Delete modal states
  const [showDeleteInvoiceModal, setShowDeleteInvoiceModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<OrderInvoice | null>(null);
  const [isDeletingInvoice, setIsDeletingInvoice] = useState(false);
  const deleteInvoiceMutation = useDeleteInvoice();

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

  // Open delete confirmation modal
  const openDeleteInvoiceModal = useCallback((invoice: OrderInvoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteInvoiceModal(true);
  }, []);

  // Close delete confirmation modal
  const closeDeleteInvoiceModal = useCallback(() => {
    setShowDeleteInvoiceModal(false);
    setInvoiceToDelete(null);
  }, []);

  // Handle invoice deletion
  const handleConfirmDeleteInvoice = useCallback(async () => {
    if (!invoiceToDelete?.id) return;

    setIsDeletingInvoice(true);
    try {
      await deleteInvoiceMutation.mutateAsync(invoiceToDelete.id);
      invoiceToasts.deleteSuccess(invoiceToDelete.invoiceNumber || 'Invoice');
      closeDeleteInvoiceModal();
      refetchInvoices();
    } catch (error) {
      invoiceToasts.deleteError(error instanceof Error ? error.message : 'Failed to delete invoice');
    } finally {
      setIsDeletingInvoice(false);
    }
  }, [invoiceToDelete, deleteInvoiceMutation, closeDeleteInvoiceModal, refetchInvoices]);

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

    // Delete modal states
    showDeleteInvoiceModal,
    invoiceToDelete,
    isDeletingInvoice,

    // Modal actions
    openInvoiceDetailModal,
    closeInvoiceDetailModal,
    viewInvoice,

    // Delete actions
    openDeleteInvoiceModal,
    closeDeleteInvoiceModal,
    handleConfirmDeleteInvoice,
  };
}
