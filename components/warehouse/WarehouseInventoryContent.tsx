'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import RequestShipmentModal from './modals/RequestShipmentModal';
import AddInventoryItemModal from './modals/AddInventoryItemModal';
import ImportInventoryModal from './modals/ImportInventoryModal';
import ShipmentRequestDetailModal from './modals/ShipmentRequestDetailModal';
import ProductProfileModal from './modals/ProductProfileModal';
import { useWarehouse } from './WarehouseContext';
import { TabType, BackorderItem } from './inventory/types';
import InventoryStats from './inventory/InventoryStats';
import BackorderAlert from './inventory/BackorderAlert';
import InventoryHeader from './inventory/InventoryHeader';
import InventoryFilters from './inventory/InventoryFilters';
import InventoryTable from './inventory/InventoryTable';
import ShipmentRequestsTable from './inventory/ShipmentRequestsTable';
import BackordersTable from './inventory/BackordersTable';
import { useInventoryState } from './inventory/hooks/useInventoryState';
import { useShipmentRequestsState } from './inventory/hooks/useShipmentRequestsState';
import { useBackordersState } from './inventory/hooks/useBackordersState';
import { useInventoryStatusesQuery } from './inventory/api/useInventoryApi';
import { useShipmentRequestStatusesQuery } from './inventory/api/useShipmentRequestsApi';
import { useInventoryPersistence } from './inventory/hooks/useInventoryPersistence';
import { ShipmentRequestStatus } from '@/lib/types/warehouse';

export default function WarehouseInventoryContent() {
  const { selectedWarehouse, isWorkerView, isManagerView } = useWarehouse();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize Hooks
  const inventoryState = useInventoryState(selectedWarehouse?.id);
  const shipmentRequestsState = useShipmentRequestsState(
    selectedWarehouse?.id,
    inventoryState.inventory,
    inventoryState.searchQuery,
    inventoryState.selectedFactory
  );
  const backordersState = useBackordersState(setActiveTab);

  // Additional Queries
  const { data: statusOptionsData } = useShipmentRequestStatusesQuery();
  const { data: inventoryStatusOptionsData } = useInventoryStatusesQuery();

  // Persistence Hook
  const { saveProductProfile } = useInventoryPersistence();

  // Refresh data when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      inventoryState.refetchInventory();
      inventoryState.refetchStats();
      shipmentRequestsState.refetchRequests();
    }
  }, [refreshKey]);

  // Force refresh handler
  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Backorder Request Handler
  const handleRequestBackorder = useCallback((item?: BackorderItem) => {
    if (item) {
      if (!item.factoryId) {
        toast.error("This product doesn't have an associated manufacturer.");
        return;
      }
      shipmentRequestsState.setRequestInitialData({
        vendorId: item.factoryId,
        items: [{
          productId: item.productId,
          quantity: item.backorderQty
        }]
      });
    } else {
      if (backordersState.backorderItems.length === 0) {
        shipmentRequestsState.setRequestInitialData(undefined);
      } else {
        const firstFactoryId = backordersState.backorderItems.find(i => i.factoryId)?.factoryId;
        if (!firstFactoryId) {
          toast.error("No manufacturer found for backorder items.");
          shipmentRequestsState.setRequestInitialData(undefined);
        } else {
          const itemsForFactory = backordersState.backorderItems
            .filter(i => i.factoryId === firstFactoryId)
            .map(i => ({
              productId: i.productId,
              quantity: i.backorderQty
            }));
          shipmentRequestsState.setRequestInitialData({
            vendorId: firstFactoryId,
            items: itemsForFactory
          });
        }
      }
    }
    shipmentRequestsState.setShowRequestModal(true);
  }, [backordersState.backorderItems, shipmentRequestsState]);

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      <InventoryHeader
        onRequestClick={() => shipmentRequestsState.setShowRequestModal(true)}
        onRefresh={triggerRefresh}
      />

      <div className="p-6 pb-0">
        <InventoryStats
          stats={inventoryState.stats}
          activeStatFilter={inventoryState.activeStatFilter}
          onStatCardClick={inventoryState.handleStatCardClick}
        />

        {isManagerView && (
          <BackorderAlert
            backorderItems={backordersState.backorderItems}
            totalBackorderQty={backordersState.totalBackorderQty}
            onLogBackorder={backordersState.handleLogBackorder}
            onRequestInventory={() => handleRequestBackorder()}
          />
        )}

        <div className="mb-4">
          <div className="border-b border-[var(--border)]">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab('inventory')}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inventory'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
              >
                Inventory
                <span className="ml-2 px-2 py-0.5 bg-[var(--muted)] rounded-full text-xs">
                  {inventoryState.filteredItems.length}
                </span>
              </button>
              {isManagerView && (
                <>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requests'
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                  >
                    Shipment Requests
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${shipmentRequestsState.pendingRequestsCount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-[var(--muted)]'
                      }`}>
                      {shipmentRequestsState.shipmentRequests.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('backorders')}
                    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'backorders'
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                  >
                    Backorders
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${backordersState.loggedBackorders.length > 0 ? 'bg-orange-100 text-orange-700' : 'bg-[var(--muted)]'
                      }`}>
                      {backordersState.loggedBackorders.length}
                    </span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>

        <InventoryFilters
          activeTab={activeTab}
          searchQuery={inventoryState.searchQuery}
          onSearchChange={inventoryState.setSearchQuery}
          selectedFactory={inventoryState.selectedFactory}
          onFactoryChange={inventoryState.setSelectedFactory}
          selectedStatus={inventoryState.selectedStatus}
          onStatusChange={inventoryState.setSelectedStatus}
          requestStatusFilter={shipmentRequestsState.requestStatusFilter}
          onRequestStatusFilterChange={shipmentRequestsState.setRequestStatusFilter}
          factories={inventoryState.factories}
          statusOptions={statusOptionsData?.shipmentRequestStatuses || []}
          inventoryStatusOptions={inventoryStatusOptionsData?.inventoryStatuses || []}
        />

        <div className="text-sm text-[var(--muted-foreground)] mb-4">
          {isWorkerView
            ? `Showing ${inventoryState.filteredItems.length} inventory items`
            : activeTab === 'inventory'
              ? `Showing ${inventoryState.filteredItems.length} inventory items`
              : activeTab === 'requests'
                ? `Showing ${shipmentRequestsState.filteredRequests.length} shipment requests`
                : `Showing ${backordersState.loggedBackorders.length} logged backorders`
          }
        </div>
      </div>

      {activeTab === 'inventory' && (
        <InventoryTable
          items={inventoryState.filteredItems}
          inventory={inventoryState.inventory}
          sortField={inventoryState.sortField}
          sortDirection={inventoryState.sortDirection}
          onSort={inventoryState.handleSort}
          columnFilters={inventoryState.columnFilters}
          setColumnFilters={inventoryState.setColumnFilters}
          openFilter={inventoryState.openFilter}
          setOpenFilter={inventoryState.setOpenFilter}
          uniqueFactories={inventoryState.uniqueFactories}
          uniqueStatuses={inventoryState.uniqueStatuses}
          onProductClick={inventoryState.handleProductClick}
          onAddItem={inventoryState.handleAddItem}
        />
      )}

      {activeTab === 'requests' && isManagerView && (
        <ShipmentRequestsTable
          requests={shipmentRequestsState.filteredRequests}
          onViewDetails={shipmentRequestsState.handleViewRequestDetails}
          onEdit={shipmentRequestsState.handleEditRequest}
          onConfirm={shipmentRequestsState.handleConfirmRequest}
          onCancel={shipmentRequestsState.handleCancelRequest}
          onRequestClick={() => shipmentRequestsState.setShowRequestModal(true)}
        />
      )}

      {activeTab === 'backorders' && isManagerView && (
        <BackordersTable
          backorders={backordersState.loggedBackorders}
          searchQuery={inventoryState.searchQuery}
          onRemoveBackorder={backordersState.handleRemoveLoggedBackorder}
          onRequestInventory={handleRequestBackorder}
        />
      )}

      {inventoryState.showAddItemModal && inventoryState.selectedInventory && (
        <AddInventoryItemModal
          onClose={() => inventoryState.setShowAddItemModal(false)}
          inventory={inventoryState.selectedInventory}
          onSuccess={() => {
            triggerRefresh(); // Refresh parent queries
            inventoryState.setShowAddItemModal(false);
          }}
        />
      )}

      {shipmentRequestsState.showRequestModal && (
        <RequestShipmentModal
          onClose={() => {
            shipmentRequestsState.setShowRequestModal(false);
            shipmentRequestsState.setRequestInitialData(undefined);
          }}
          onSubmit={(input) => {
            shipmentRequestsState.handleCreateShipmentRequest(input);
          }}
          onUpdate={(requestId, input) => {
            shipmentRequestsState.handleUpdateShipmentRequest(requestId, input);
          }}
          editingRequestId={shipmentRequestsState.requestInitialData?.requestId}
          initialVendorId={shipmentRequestsState.requestInitialData?.vendorId}
          initialItems={shipmentRequestsState.requestInitialData?.items}
          currentWarehouseId={selectedWarehouse?.id}
          currentWarehouseName={selectedWarehouse?.name}
        />
      )}

      {inventoryState.showImportModal && selectedWarehouse && (
        <ImportInventoryModal
          warehouseId={selectedWarehouse.id}
          onClose={() => inventoryState.setShowImportModal(false)}
          onSuccess={() => {
            toast.success('Inventory imported successfully');
            triggerRefresh();
            inventoryState.setShowImportModal(false);
          }}
        />
      )}

      {shipmentRequestsState.selectedRequest && (
        <ShipmentRequestDetailModal
          onClose={() => {
            shipmentRequestsState.setShowRequestDetailModal(false);
            shipmentRequestsState.setSelectedRequest(null);
          }}
          request={shipmentRequestsState.selectedRequest}
          onConfirm={() => {
            shipmentRequestsState.handleConfirmRequest(shipmentRequestsState.selectedRequest!.id);
            shipmentRequestsState.setShowRequestDetailModal(false);
          }}
          onCancel={() => {
            shipmentRequestsState.handleCancelRequest(shipmentRequestsState.selectedRequest!.id);
            shipmentRequestsState.setShowRequestDetailModal(false);
          }}
          onUpdateStatus={(status: ShipmentRequestStatus) => {
            // Mock update for now or add to hook if real mutation exists
            shipmentRequestsState.refetchRequests();
            shipmentRequestsState.setShowRequestDetailModal(false);
          }}
        />
      )}

      {inventoryState.showProductProfileModal && inventoryState.selectedProductInventory && (
        <ProductProfileModal
          onClose={() => inventoryState.setShowProductProfileModal(false)}
          inventory={inventoryState.selectedProductInventory}
          onSave={async ({ binLocations, settings }) => {
            if (inventoryState.selectedProductInventory) {
              await saveProductProfile(
                inventoryState.selectedProductInventory,
                binLocations,
                settings
              );
              triggerRefresh();
              inventoryState.setShowProductProfileModal(false);
            }
          }}
        />
      )}
    </main>
  );
}
