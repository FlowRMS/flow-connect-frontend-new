import { useState, useCallback } from 'react';
import type { RecurringShipment } from '@/lib/types/warehouse';

export function useRecurringShipmentModal() {
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedRecurringForModal, setSelectedRecurringForModal] =
    useState<RecurringShipment | null>(null);

  const openRecurringModal = useCallback((shipment: RecurringShipment) => {
    setSelectedRecurringForModal(shipment);
    setShowRecurringModal(true);
  }, []);

  const closeRecurringModal = useCallback(() => {
    setShowRecurringModal(false);
    setSelectedRecurringForModal(null);
  }, []);

  return {
    showRecurringModal,
    selectedRecurringForModal,
    openRecurringModal,
    closeRecurringModal,
    setShowRecurringModal,
    setSelectedRecurringForModal,
  };
}
