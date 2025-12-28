/**
 * useOrderHeader Hook
 * Manages header state: badges, fields, commission splits, versions
 */

import { useState, useCallback, useEffect } from 'react';
import type { Order, OrderSplitRate } from '@/lib/types/rms';
import type { RepSplit, ViewMode, VersionInfo } from '../types';
import { searchUsers } from '@/components/quotes/api/quotesApi';

interface UseOrderHeaderProps {
  order: Order | undefined | null;
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void;
}

export function useOrderHeader({ order, setOrders }: UseOrderHeaderProps) {
  // Header display state
  const [showHeaderFields, setShowHeaderFields] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);

  // Version state
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<VersionInfo[]>([
    { version: 1, date: new Date().toLocaleDateString('en-US'), isLatest: true },
  ]);

  // Status dropdown
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Outside rep state
  const [orderOutsideRep, setOrderOutsideRep] = useState<string>('');
  const [splitOutsideCommission, setSplitOutsideCommission] = useState(false);
  const [showOutsideRepSplitsModal, setShowOutsideRepSplitsModal] = useState(false);
  const [outsideRepSplits, setOutsideRepSplits] = useState<RepSplit[]>([]);

  // Inside rep state
  const [orderInsideRep, setOrderInsideRep] = useState<string>('');
  const [splitInsideCommission, setSplitInsideCommission] = useState(false);
  const [showInsideRepSplitsModal, setShowInsideRepSplitsModal] = useState(false);
  const [insideRepSplits, setInsideRepSplits] = useState<RepSplit[]>([]);

  // Initialize inside rep states from order when order changes
  // Similar to quotes-v2: sync split commission state and fetch rep names
  useEffect(() => {
    const insideReps = (order as any)?.insideReps || [];
    const hasMultipleInsideReps = insideReps.length > 1;

    // Set split checkbox based on count
    setSplitInsideCommission(hasMultipleInsideReps);

    // Set primary inside rep
    if (order?.insideRepId) {
      setOrderInsideRep(order.insideRepId);
    }

    // Initialize insideRepSplits from order data with names
    if (insideReps.length > 0) {
      searchUsers({ searchTerm: '', isInside: true, enabled: true, limit: 100 })
        .then((users) => {
          const repsWithNames: RepSplit[] = insideReps.map((rep: any, idx: number) => {
            const matchingUser = users.find((u) => u.id === rep.userId);
            return {
              repId: rep.userId || '',
              repName: matchingUser?.fullName || `${matchingUser?.firstName || ''} ${matchingUser?.lastName || ''}`.trim() || '',
              percentage: parseFloat(rep.splitRate || '100'),
            };
          });
          setInsideRepSplits(repsWithNames);
        })
        .catch((err) => {
          console.error('Failed to fetch inside rep names:', err);
          // Still set reps without names
          setInsideRepSplits(
            insideReps.map((rep: any) => ({
              repId: rep.userId || '',
              repName: '',
              percentage: parseFloat(rep.splitRate || '100'),
            }))
          );
        });
    } else {
      setInsideRepSplits([]);
    }
  }, [order?.id, order?.insideRepId]);

  // Initialize outside rep states from order when order changes
  useEffect(() => {
    const outsideReps = (order as any)?.outsideReps || [];
    const hasMultipleOutsideReps = outsideReps.length > 1;

    // Set split checkbox based on count
    setSplitOutsideCommission(hasMultipleOutsideReps);

    // Set primary outside rep
    const outsideRepId = (order as any)?.outsideRepId;
    if (outsideRepId) {
      setOrderOutsideRep(outsideRepId);
    }

    // Initialize outsideRepSplits from order data with names
    if (outsideReps.length > 0) {
      searchUsers({ searchTerm: '', isOutside: true, enabled: true, limit: 100 })
        .then((users) => {
          const repsWithNames: RepSplit[] = outsideReps.map((rep: any, idx: number) => {
            const matchingUser = users.find((u) => u.id === rep.userId);
            return {
              repId: rep.userId || '',
              repName: matchingUser?.fullName || `${matchingUser?.firstName || ''} ${matchingUser?.lastName || ''}`.trim() || '',
              percentage: parseFloat(rep.splitRate || '100'),
            };
          });
          setOutsideRepSplits(repsWithNames);
        })
        .catch((err) => {
          console.error('Failed to fetch outside rep names:', err);
          // Still set reps without names
          setOutsideRepSplits(
            outsideReps.map((rep: any) => ({
              repId: rep.userId || '',
              repName: '',
              percentage: parseFloat(rep.splitRate || '100'),
            }))
          );
        });
    } else {
      setOutsideRepSplits([]);
    }
  }, [order?.id]);

  // Commission splits editing (from order splitRates)
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);

  // Toggle header fields visibility
  const toggleHeaderFields = useCallback(() => {
    setShowHeaderFields((prev) => !prev);
  }, []);

  // Start editing splits
  const startEditingSplits = useCallback(() => {
    setEditedSplits([...(order?.splitRates || [])]);
    setEditingSplits(true);
  }, [order?.splitRates]);

  // Cancel editing splits
  const cancelEditingSplits = useCallback(() => {
    setEditingSplits(false);
    setEditedSplits([]);
  }, []);

  // Save splits
  const saveSplits = useCallback(() => {
    if (!order) return;

    const totalPercentage = editedSplits.reduce(
      (sum, s) => sum + s.splitPercentage,
      0
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert('Split percentages must total 100%');
      return;
    }

    const updatedOrder = {
      ...order,
      splitRates: editedSplits,
    };

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? updatedOrder : o))
    );
    setEditingSplits(false);
    setEditedSplits([]);
  }, [editedSplits, order, setOrders]);

  // Update split percentage
  const updateSplitPercentage = useCallback(
    (index: number, newPercentage: number) => {
      const updated = [...editedSplits];
      updated[index] = { ...updated[index], splitPercentage: newPercentage };
      // Recalculate commission amount
      updated[index].commissionAmount =
        ((order?.totalCommission || 0) * newPercentage) / 100;
      setEditedSplits(updated);
    },
    [editedSplits, order?.totalCommission]
  );

  // Open/close outside rep modal
  const openOutsideRepModal = useCallback(() => {
    setShowOutsideRepSplitsModal(true);
  }, []);

  const closeOutsideRepModal = useCallback(() => {
    setShowOutsideRepSplitsModal(false);
  }, []);

  // Open/close inside rep modal
  const openInsideRepModal = useCallback(() => {
    setShowInsideRepSplitsModal(true);
  }, []);

  const closeInsideRepModal = useCallback(() => {
    setShowInsideRepSplitsModal(false);
  }, []);

  // Update order status
  const updateOrderStatus = useCallback(
    (status: Order['status']) => {
      if (!order) return;
      const updatedOrder = { ...order, status };
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? updatedOrder : o))
      );
      setShowStatusDropdown(false);
    },
    [order, setOrders]
  );

  const splitPercentageTotal = editedSplits.reduce(
    (sum, s) => sum + s.splitPercentage,
    0
  );

  return {
    // Display state
    showHeaderFields,
    setShowHeaderFields,
    toggleHeaderFields,
    viewMode,
    setViewMode,
    showViewModeDropdown,
    setShowViewModeDropdown,

    // Version state
    currentVersion,
    setCurrentVersion,
    showVersionDropdown,
    setShowVersionDropdown,
    availableVersions,
    setAvailableVersions,

    // Status
    showStatusDropdown,
    setShowStatusDropdown,
    updateOrderStatus,

    // Outside rep
    orderOutsideRep,
    setOrderOutsideRep,
    splitOutsideCommission,
    setSplitOutsideCommission,
    showOutsideRepSplitsModal,
    openOutsideRepModal,
    closeOutsideRepModal,
    outsideRepSplits,
    setOutsideRepSplits,

    // Inside rep
    orderInsideRep,
    setOrderInsideRep,
    splitInsideCommission,
    setSplitInsideCommission,
    showInsideRepSplitsModal,
    openInsideRepModal,
    closeInsideRepModal,
    insideRepSplits,
    setInsideRepSplits,

    // Commission splits editing
    editingSplits,
    editedSplits,
    startEditingSplits,
    cancelEditingSplits,
    saveSplits,
    updateSplitPercentage,
    splitPercentageTotal,
  };
}
