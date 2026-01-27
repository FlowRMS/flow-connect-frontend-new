import { useState, useCallback } from 'react';
import type { IncomingShipment, ShipmentStatus } from '@/lib/types/warehouse';

export function useDeliveryModals() {
  // Selected shipment for operations
  const [selectedShipment, setSelectedShipment] = useState<IncomingShipment | null>(null);

  // Modal visibility states
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showTypeSelectionModal, setShowTypeSelectionModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

  // Quick actions menu (stores shipment ID)
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);

  // Initial status for create record modal
  const [createRecordInitialStatus, setCreateRecordInitialStatus] = useState<
    ShipmentStatus | undefined
  >(undefined);

  // Actions - Open modals
  const openReceiveModal = useCallback((shipment: IncomingShipment) => {
    setSelectedShipment(shipment);
    setShowReceiveModal(true);
  }, []);

  const openDetailModal = useCallback((shipment: IncomingShipment) => {
    setSelectedShipment(shipment);
    setShowDetailModal(true);
  }, []);

  const openCreateRecordModal = useCallback((initialStatus?: ShipmentStatus) => {
    setCreateRecordInitialStatus(initialStatus);
    setShowCreateRecordModal(true);
    setShowTypeSelectionModal(false);
  }, []);

  const openTypeSelectionModal = useCallback(() => {
    setShowTypeSelectionModal(true);
  }, []);

  // Actions - Close modals
  const closeReceiveModal = useCallback(() => {
    setShowReceiveModal(false);
    setSelectedShipment(null);
  }, []);

  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedShipment(null);
  }, []);

  const closeCreateRecordModal = useCallback(() => {
    setShowCreateRecordModal(false);
    setCreateRecordInitialStatus(undefined);
  }, []);

  const closeTypeSelectionModal = useCallback(() => {
    setShowTypeSelectionModal(false);
  }, []);

  const closeCreateDropdown = useCallback(() => {
    setShowCreateDropdown(false);
  }, []);

  const toggleQuickActions = useCallback((shipmentId: string | null) => {
    setShowQuickActions((prev) => (prev === shipmentId ? null : shipmentId));
  }, []);

  const closeQuickActions = useCallback(() => {
    setShowQuickActions(null);
  }, []);

  return {
    // State
    selectedShipment,
    showReceiveModal,
    showTypeSelectionModal,
    showDetailModal,
    showCreateRecordModal,
    showCreateDropdown,
    showQuickActions,
    createRecordInitialStatus,

    // Setters
    setSelectedShipment,
    setShowReceiveModal,
    setShowTypeSelectionModal,
    setShowDetailModal,
    setShowCreateRecordModal,
    setShowCreateDropdown,
    setShowQuickActions,
    setCreateRecordInitialStatus,

    // Actions
    openReceiveModal,
    openDetailModal,
    openCreateRecordModal,
    openTypeSelectionModal,
    closeReceiveModal,
    closeDetailModal,
    closeCreateRecordModal,
    closeTypeSelectionModal,
    closeCreateDropdown,
    toggleQuickActions,
    closeQuickActions,
  };
}
