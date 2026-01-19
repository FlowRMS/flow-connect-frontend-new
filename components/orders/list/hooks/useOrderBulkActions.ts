/**
 * useOrderBulkActions Hook
 * Manages bulk actions for selected orders
 */

import { useState, useCallback } from 'react';
import type { Order, OrderStatus } from '@/lib/types/rms';
import type { CreditLineItem, AcknowledgementLineItem } from '../types';

interface UseOrderBulkActionsProps {
  selectedOrderIds: Set<string>;
  clearSelection: () => void;
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void;
}

export function useOrderBulkActions({
  selectedOrderIds,
  clearSelection,
  setOrders,
}: UseOrderBulkActionsProps) {
  // Bulk actions menu state
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);

  // Credit modal state
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditName, setCreditName] = useState('');
  const [creditDate, setCreditDate] = useState(
    new Date().toLocaleDateString('en-US')
  );
  const [creditLineItems, setCreditLineItems] = useState<CreditLineItem[]>([]);

  // Acknowledgement modal state
  const [showAcknowledgementModal, setShowAcknowledgementModal] =
    useState(false);
  const [ackNumber, setAckNumber] = useState('');
  const [ackDate, setAckDate] = useState('');
  const [ackLineItems, setAckLineItems] = useState<AcknowledgementLineItem[]>(
    []
  );

  // Bulk set status
  const bulkSetStatus = useCallback(
    (status: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) => (selectedOrderIds.has(o.id) ? { ...o, status } : o))
      );
      clearSelection();
      setShowBulkActionsMenu(false);
    },
    [selectedOrderIds, clearSelection, setOrders]
  );

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Open delete modal (replaces confirm dialog)
  const openDeleteModal = useCallback(() => {
    setShowDeleteModal(true);
    setShowBulkActionsMenu(false);
  }, []);

  // Close delete modal
  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // Get all selected IDs for bulk delete
  const getAllSelectedIds = useCallback(async () => {
    return Array.from(selectedOrderIds);
  }, [selectedOrderIds]);

  // Handle successful delete
  const handleDeleteSuccess = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Open credit modal
  const openCreditModal = useCallback(() => {
    setShowCreditModal(true);
    setShowBulkActionsMenu(false);
  }, []);

  // Close credit modal
  const closeCreditModal = useCallback(() => {
    setShowCreditModal(false);
    setCreditName('');
    setCreditDate(new Date().toLocaleDateString('en-US'));
    setCreditLineItems([]);
  }, []);

  // Save credit
  const saveCredit = useCallback(() => {
    // TODO: Implement credit save logic
    alert('Credit created successfully');
    closeCreditModal();
    clearSelection();
  }, [closeCreditModal, clearSelection]);

  // Open acknowledgement modal
  const openAcknowledgementModal = useCallback(() => {
    setShowAcknowledgementModal(true);
    setShowBulkActionsMenu(false);
  }, []);

  // Close acknowledgement modal
  const closeAcknowledgementModal = useCallback(() => {
    setShowAcknowledgementModal(false);
    setAckNumber('');
    setAckDate('');
    setAckLineItems([]);
  }, []);

  // Save acknowledgement
  const saveAcknowledgement = useCallback(() => {
    // TODO: Implement acknowledgement save logic
    alert('Acknowledgement added successfully');
    closeAcknowledgementModal();
    clearSelection();
  }, [closeAcknowledgementModal, clearSelection]);

  return {
    // Bulk actions menu
    showBulkActionsMenu,
    setShowBulkActionsMenu,
    // Actions
    bulkSetStatus,
    bulkDelete: openDeleteModal, // Opens modal instead of using confirm()
    // Delete modal
    showDeleteModal,
    closeDeleteModal,
    getAllSelectedIds,
    handleDeleteSuccess,
    selectedCount: selectedOrderIds.size,
    // Credit modal
    showCreditModal,
    openCreditModal,
    closeCreditModal,
    saveCredit,
    creditName,
    setCreditName,
    creditDate,
    setCreditDate,
    creditLineItems,
    setCreditLineItems,
    // Acknowledgement modal
    showAcknowledgementModal,
    openAcknowledgementModal,
    closeAcknowledgementModal,
    saveAcknowledgement,
    ackNumber,
    setAckNumber,
    ackDate,
    setAckDate,
    ackLineItems,
    setAckLineItems,
  };
}
