'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  mockFulfillmentOrders,
  mockWaves,
  getFulfillmentOrderStats,
  getWarehouseCustomers,
} from '@/lib/data/warehouse-mock';
import {
  FulfillmentOrder,
  Wave,
} from '@/lib/types/warehouse';
import { useWarehouse } from './WarehouseContext';
import FulfillmentHeader from './fulfillment/FulfillmentHeader';
import FulfillmentStatsCards from './fulfillment/FulfillmentStatsCards';
import FulfillmentTabs from './fulfillment/FulfillmentTabs';
import FulfillmentOrdersTable from './fulfillment/FulfillmentOrdersTable';
import PickingWavesTable from './fulfillment/PickingWavesTable';

// Filter types for stat card clicks
type StatFilter = 'all' | 'pending' | 'in_progress' | 'completed';

export default function WarehouseFulfillmentContent() {
  const { selectedWarehouse } = useWarehouse();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlFilter = searchParams.get('filter') as StatFilter | null;

  const [fulfillmentOrders] = useState<FulfillmentOrder[]>(mockFulfillmentOrders);
  const [waves] = useState<Wave[]>(mockWaves);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'waves'>('orders');
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>(urlFilter || 'all');

  // Update filter when URL changes
  useEffect(() => {
    if (urlFilter && ['all', 'pending', 'in_progress', 'completed'].includes(urlFilter)) {
      setActiveStatFilter(urlFilter);
    }
  }, [urlFilter]);

  const stats = useMemo(() => getFulfillmentOrderStats(), []);
  const customers = useMemo(() => getWarehouseCustomers(), []);

  const handleStatCardClick = (filter: StatFilter) => {
    setActiveStatFilter(prev => prev === filter ? 'all' : filter);
  };

  const handleCreateWave = () => {
    // TODO: Implement create wave functionality
    console.log('Create wave clicked');
  };

  const filteredFulfillmentOrders = useMemo(() => {
    let result = fulfillmentOrders;

    // Apply stat card filter
    if (activeStatFilter === 'pending') {
      result = result.filter(fo => fo.status === 'PENDING' || fo.status === 'RELEASED');
    } else if (activeStatFilter === 'in_progress') {
      result = result.filter(fo => fo.status === 'PICKING' || fo.status === 'PACKING' || fo.status === 'SHIPPING');
    } else if (activeStatFilter === 'completed') {
      result = result.filter(fo => fo.status === 'SHIPPED' || fo.status === 'PARTIAL_SHIPPED' || fo.status === 'DELIVERED');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(fo =>
        fo.orderNumber.toLowerCase().includes(query) ||
        fo.fulfillmentOrderNumber.toLowerCase().includes(query) ||
        fo.customerName.toLowerCase().includes(query) ||
        fo.lineItems.some(li => li.productName.toLowerCase().includes(query) || li.partNumber.toLowerCase().includes(query))
      );
    }

    return result;
  }, [fulfillmentOrders, searchQuery, activeStatFilter]);

  const handleRowClick = (fo: FulfillmentOrder) => {
    router.push(`/warehouse/fulfillment/${fo.id}`);
  };

  // Calculate pending/in progress stats from our filtered data
  const pendingCount = fulfillmentOrders.filter(fo => fo.status === 'PENDING' || fo.status === 'RELEASED').length;
  const inProgressCount = fulfillmentOrders.filter(fo => fo.status === 'PICKING' || fo.status === 'PACKING' || fo.status === 'SHIPPING').length;
  const completedCount = fulfillmentOrders.filter(fo => fo.status === 'SHIPPED' || fo.status === 'PARTIAL_SHIPPED' || fo.status === 'DELIVERED').length;

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      <div className="p-6 pb-0">
        <FulfillmentHeader onCreateWave={handleCreateWave} />

        <FulfillmentStatsCards
          totalCount={fulfillmentOrders.length}
          pendingCount={pendingCount}
          inProgressCount={inProgressCount}
          completedCount={completedCount}
          activeStatFilter={activeStatFilter}
          onStatCardClick={handleStatCardClick}
        />

        <FulfillmentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <div className="flex-1 overflow-auto p-6 pt-0">
        {activeTab === 'orders' ? (
          <FulfillmentOrdersTable
            orders={filteredFulfillmentOrders}
            onRowClick={handleRowClick}
          />
        ) : (
          <PickingWavesTable waves={waves} />
        )}
      </div>
    </main>
  );
}
