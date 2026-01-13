import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { InventoryItem, Inventory } from '@/lib/types/warehouse';
import type { StatFilter, FlatInventoryItem, InventoryColumnFilters, InventorySortField, SortDirection, InventoryWithItems } from '../types';
import { useInventoryQuery, useInventoryStatsQuery } from '../api/useInventoryApi';

export function useInventoryState(warehouseId?: string) {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter') as StatFilter | null;
  const urlSearch = searchParams.get('search');

  // Queries
  const { data: invData, refetch: refetchInventory } = useInventoryQuery(warehouseId);
  const { data: statsData, refetch: refetchStats } = useInventoryStatsQuery(warehouseId);

  // UI State
  const [selectedFactory, setSelectedFactory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState(urlSearch || '');
  const [selectedInventory, setSelectedInventory] = useState<InventoryWithItems | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>(urlFilter || 'all');
  const [showProductProfileModal, setShowProductProfileModal] = useState(false);
  const [selectedProductInventory, setSelectedProductInventory] = useState<InventoryWithItems | null>(null);

  // Inventory sorting state
  const [sortField, setSortField] = useState<InventorySortField>('productName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Inventory column filters state
  const [columnFilters, setColumnFilters] = useState<InventoryColumnFilters>({
    factoryName: [],
    productName: '',
    partNumber: '',
    location: '',
    status: [],
    dateRange: { start: '', end: '' },
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // URL Sync
  useEffect(() => {
    if (urlFilter && ['all', 'available', 'reserved', 'low_stock'].includes(urlFilter)) {
      setActiveStatFilter(urlFilter);
    }
  }, [urlFilter]);

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  const handleSort = (field: InventorySortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Derived Data
  const inventory: InventoryWithItems[] = useMemo(() => {
    if (!invData?.inventories) return [];
    return invData.inventories.map((inv: any) => ({
      id: inv.id,
      warehouseId: inv.warehouseId,
      productId: inv.productId,

      productName: inv.product?.description || 'Unknown Product',
      partNumber: inv.product?.factoryPartNumber || 'N/A',
      factoryId: inv.factory?.id,
      factoryName: inv.factory?.title || 'Unknown Factory',
      totalQuantity: inv.totalQuantity,
      availableQuantity: inv.availableQuantity,
      reservedQuantity: inv.reservedQuantity,
      pickingQuantity: inv.pickingQuantity,
      reorderPoint: inv.reorderPoint,
      ownershipType: inv.ownershipType,
      abcClass: inv.abcClass,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      items: inv.items, // Keep items for details
      // Defaults
      pickedQuantity: 0,
      quarantineQuantity: 0,
      damagedQuantity: 0,
      expiredQuantity: 0,
      inTransitQuantity: 0,
      onHoldQuantity: 0,
      returnedQuantity: 0,
      isConsignment: inv.ownershipType === 'CONSIGNMENT',
    }));
  }, [invData]);

  const stats = useMemo(() => {
    if (statsData?.inventoryStats) {
      return {
        totalProducts: statsData.inventoryStats.totalProducts,
        totalQuantity: statsData.inventoryStats.totalQuantity ?? 0,
        availableQuantity: statsData.inventoryStats.availableQuantity,
        reservedQuantity: statsData.inventoryStats.reservedQuantity,
        lowStockCount: statsData.inventoryStats.lowStockCount,
        outOfStockCount: statsData.inventoryStats.outOfStockCount,
        totalValue: statsData.inventoryStats.totalValue
      };
    }
    return {
      totalProducts: 0,
      totalQuantity: 0,
      availableQuantity: 0,
      reservedQuantity: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalValue: 0
    };
  }, [statsData]);

  const flatInventoryItems: FlatInventoryItem[] = useMemo(() => {
    if (!inventory) return [];
    const items: FlatInventoryItem[] = [];

    inventory.forEach((inv) => {
      if (inv.items && inv.items.length > 0) {
        inv.items.forEach((item: any) => {
          items.push({
            id: item.id,
            inventoryId: inv.id,
            locationId: item.locationId || '',
            locationName: item.locationName || 'Unknown',
            quantity: item.quantity,
            status: item.status,
            receivedDate: item.receivedDate,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            productName: inv.productName || 'Unknown Product',
            partNumber: inv.partNumber || 'N/A',
            factoryName: inv.factoryName || 'Unknown Factory',
            factoryId: inv.factoryId,
            totalQuantity: inv.totalQuantity,
            availableQuantity: inv.availableQuantity,
            reservedQuantity: inv.reservedQuantity,
            inTransitQuantity: 0,
            reorderPoint: inv.reorderPoint || 0,
            lotNumber: item.lotNumber,
          });
        });
      } else {
        // Handle inventory with no items (empty/new inventory)
        items.push({
          id: inv.id, // Use inventory ID as item ID for key
          inventoryId: inv.id,
          locationId: '',
          locationName: 'No Location',
          quantity: 0,
          status: 'AVAILABLE' as any, // Default to available for header
          receivedDate: inv.createdAt,
          createdAt: inv.createdAt,
          updatedAt: inv.updatedAt,
          productName: inv.productName || 'Unknown Product',
          partNumber: inv.partNumber || 'N/A',
          factoryName: inv.factoryName || 'Unknown Factory',
          factoryId: inv.factoryId,
          totalQuantity: inv.totalQuantity,
          availableQuantity: inv.availableQuantity,
          reservedQuantity: inv.reservedQuantity,
          inTransitQuantity: 0,
          reorderPoint: inv.reorderPoint || 0,
          lotNumber: 'N/A',
        });
      }
    });
    return items;
  }, [inventory]);

    // Get unique values for inventory filters
  const uniqueFactories = useMemo(() => {
    return [...new Set(flatInventoryItems.map(item => item.factoryName))].sort();
  }, [flatInventoryItems]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(flatInventoryItems.map(item => item.status))];
  }, [flatInventoryItems]);

  const filteredItems = useMemo(() => {
    let result = flatInventoryItems;

    // Apply stat card filter
    if (activeStatFilter === 'available') {
      result = result.filter(item => item.status === 'AVAILABLE');
    } else if (activeStatFilter === 'reserved') {
      result = result.filter(item => item.status === 'RESERVED');
    } else if (activeStatFilter === 'low_stock') {
      result = result.filter(item => item.availableQuantity <= (item.reorderPoint || 0));
    }

    if (selectedFactory !== 'All') {
      result = result.filter(item => item.factoryId === selectedFactory);
    }

    if (selectedStatus !== 'All') {
      result = result.filter(item => item.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.productName.toLowerCase().includes(query) ||
        item.partNumber.toLowerCase().includes(query) ||
        item.factoryName.toLowerCase().includes(query) ||
        item.locationName.toLowerCase().includes(query) ||
        (item.lotNumber && item.lotNumber.toLowerCase().includes(query))
      );
    }

    // Apply column filters
    if (columnFilters.factoryName.length > 0) {
      result = result.filter(item => columnFilters.factoryName.includes(item.factoryName));
    }

    if (columnFilters.productName) {
      const query = columnFilters.productName.toLowerCase();
      result = result.filter(item => item.productName.toLowerCase().includes(query));
    }

    if (columnFilters.partNumber) {
      const query = columnFilters.partNumber.toLowerCase();
      result = result.filter(item => item.partNumber.toLowerCase().includes(query));
    }

    if (columnFilters.location) {
      const query = columnFilters.location.toLowerCase();
      result = result.filter(item => item.locationName.toLowerCase().includes(query));
    }

    if (columnFilters.status.length > 0) {
      result = result.filter(item => columnFilters.status.includes(item.status));
    }

    if (columnFilters.dateRange.start || columnFilters.dateRange.end) {
      result = result.filter(item => {
        if (!item.receivedDate) return true;
        const date = new Date(item.receivedDate);
        if (columnFilters.dateRange.start && date < new Date(columnFilters.dateRange.start)) {
          return false;
        }
        if (columnFilters.dateRange.end && date > new Date(columnFilters.dateRange.end)) {
          return false;
        }
        return true;
      });
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'factoryName':
          comparison = a.factoryName.localeCompare(b.factoryName);
          break;
        case 'productName':
          comparison = a.productName.localeCompare(b.productName);
          break;
        case 'partNumber':
          comparison = a.partNumber.localeCompare(b.partNumber);
          break;
        case 'locationName':
          comparison = a.locationName.localeCompare(b.locationName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'receivedDate':
          const aDate = a.receivedDate ? new Date(a.receivedDate).getTime() : 0;
          const bDate = b.receivedDate ? new Date(b.receivedDate).getTime() : 0;
          comparison = aDate - bDate;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [flatInventoryItems, selectedFactory, selectedStatus, searchQuery, activeStatFilter, columnFilters, sortField, sortDirection]);

  const factories = useMemo(() => {
    if (!inventory) return [];
    const map = new Map();
    inventory.forEach((i: any) => {
      if (i.factoryId && i.factoryName) {
        map.set(i.factoryId, { id: i.factoryId, name: i.factoryName });
      }
    });
    return Array.from(map.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [inventory]);

  const handleStatCardClick = (filter: StatFilter) => {
    setActiveStatFilter(prev => prev === filter ? 'all' : filter);
  };

  const handleAddItem = (inv: Inventory) => {
    setSelectedInventory(inv);
    setShowAddItemModal(true);
  };

  const handleProductClick = (inv: Inventory) => {
    setSelectedProductInventory(inv);
    setShowProductProfileModal(true);
  };

  return {
    inventory,
    stats,
    filteredItems,
    factories,
    uniqueFactories,
    uniqueStatuses,
    
    // UI State
    selectedFactory,
    setSelectedFactory,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    selectedInventory,
    setSelectedInventory,
    showAddItemModal,
    setShowAddItemModal,
    showImportModal,
    setShowImportModal,
    activeStatFilter,
    setActiveStatFilter,
    showProductProfileModal,
    setShowProductProfileModal,
    selectedProductInventory,
    setSelectedProductInventory,
    
    // Sort & Filter
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    handleSort,
    columnFilters,
    setColumnFilters,
    openFilter,
    setOpenFilter,
    
    // Actions
    handleStatCardClick,
    handleAddItem,
    handleProductClick,
    refetchInventory,
    refetchStats,
  };
}
