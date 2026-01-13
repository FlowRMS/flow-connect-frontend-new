import { useState, useMemo, useCallback } from 'react';
import type { BackorderItem, TabType } from '../types';
import { useBackordersQuery } from '../api/useInventoryApi';
import { toast } from 'sonner';

export function useBackordersState(setActiveTab: (tab: TabType) => void) {
  const { data: backordersData } = useBackordersQuery();
  const [dismissedBackorders, setDismissedBackorders] = useState<Set<string>>(new Set());
  const [loggedBackorders, setLoggedBackorders] = useState<BackorderItem[]>([]);

  const allBackorderItems: BackorderItem[] = useMemo(() => {
    if (!backordersData?.backorders) return [];
    return backordersData.backorders.map((bo: any) => ({
      id: bo.id,
      productId: bo.productId,
      productName: bo.product?.description || 'Unknown',
      partNumber: bo.product?.factoryPartNumber || 'N/A',
      factoryId: bo.factory?.id,
      factoryName: bo.factory?.title || 'Unknown Factory',
      backorderQty: bo.backorderedQuantity,
      orderNumber: bo.orderNumber,
      customerName: bo.customer?.companyName || 'Unknown',
    }));
  }, [backordersData]);

  const backorderItems = useMemo(() => {
    return allBackorderItems.filter((item: any) => !dismissedBackorders.has(item.id));
  }, [allBackorderItems, dismissedBackorders]);

  const totalBackorderQty = useMemo(() =>
    backorderItems.reduce((sum: any, item: any) => sum + item.backorderQty, 0),
    [backorderItems]
  );

  const handleDismissBackorder = useCallback((backorderId: string) => {
    setDismissedBackorders(prev => new Set(prev).add(backorderId));
  }, []);

  const handleDismissAllBackorders = useCallback(() => {
    setDismissedBackorders(prev => {
      const newSet = new Set(prev);
      backorderItems.forEach(item => newSet.add(item.id));
      return newSet;
    });
  }, [backorderItems]);

  const handleLogBackorder = useCallback((backorder: BackorderItem) => {
    setLoggedBackorders(prev => {
      // Don't add if already logged
      if (prev.some(b => b.id === backorder.id)) return prev;
      return [...prev, { ...backorder, loggedAt: new Date().toISOString() }];
    });
    setDismissedBackorders(prev => new Set(prev).add(backorder.id));
  }, []);

  const handleLogAllBackorders = useCallback(() => {
    const now = new Date().toISOString();
    setLoggedBackorders(prev => {
      const existingIds = new Set(prev.map(b => b.id));
      const newItems = backorderItems
        .filter(item => !existingIds.has(item.id))
        .map(item => ({ ...item, loggedAt: now }));
      return [...prev, ...newItems];
    });
    handleDismissAllBackorders();
    setActiveTab('backorders');
  }, [backorderItems, handleDismissAllBackorders, setActiveTab]);

  const handleRemoveLoggedBackorder = useCallback((backorderId: string) => {
    setLoggedBackorders(prev => prev.filter(b => b.id !== backorderId));
  }, []);

  return {
    backorderItems,
    loggedBackorders,
    totalBackorderQty,
    handleDismissBackorder,
    handleDismissAllBackorders,
    handleLogBackorder,
    handleLogAllBackorders,
    handleRemoveLoggedBackorder,
  };
}
