import { useState } from 'react';
import type { ShippingCarrier } from '../types';
import { mockShippingCarriers } from '../mockData';

export function useShippingCarriers() {
  // State
  const [shippingCarriers, setShippingCarriers] = useState<ShippingCarrier[]>(mockShippingCarriers);
  const [expandedCarrierId, setExpandedCarrierId] = useState<string | null>(null);
  const [newCarrierName, setNewCarrierName] = useState('');
  const [newCarrierAccount, setNewCarrierAccount] = useState('');
  const [newCarrierRemarks, setNewCarrierRemarks] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Handlers
  const toggleCarrierExpansion = (carrierId: string) => {
    setExpandedCarrierId((prev) => (prev === carrierId ? null : carrierId));
  };

  const handleAddCarrier = () => {
    if (newCarrierName.trim()) {
      const newCarrier: ShippingCarrier = {
        id: `SC${Date.now()}`,
        name: newCarrierName.trim(),
        isActive: true,
        accountNumber: newCarrierAccount.trim() || undefined,
        remarks: newCarrierRemarks.trim() || undefined,
      };
      setShippingCarriers([...shippingCarriers, newCarrier]);
      setNewCarrierName('');
      setNewCarrierAccount('');
      setNewCarrierRemarks('');
      setHasChanges(true);
      // Expand the newly added carrier
      setExpandedCarrierId(newCarrier.id);
    }
  };

  const handleDeleteCarrier = (id: string) => {
    setShippingCarriers(shippingCarriers.filter((c) => c.id !== id));
    setHasChanges(true);
  };

  const handleUpdateCarrier = (id: string, updates: Partial<ShippingCarrier>) => {
    setShippingCarriers(
      shippingCarriers.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    setHasChanges(true);
  };

  const markChanged = () => setHasChanges(true);

  const resetChanges = () => setHasChanges(false);

  return {
    // State
    shippingCarriers,
    expandedCarrierId,
    newCarrierName,
    newCarrierAccount,
    newCarrierRemarks,
    hasChanges,

    // Setters
    setExpandedCarrierId,
    setNewCarrierName,
    setNewCarrierAccount,
    setNewCarrierRemarks,
    setShippingCarriers,

    // Handlers
    toggleCarrierExpansion,
    handleAddCarrier,
    handleUpdateCarrier,
    handleDeleteCarrier,
    markChanged,
    resetChanges,
  };
}
