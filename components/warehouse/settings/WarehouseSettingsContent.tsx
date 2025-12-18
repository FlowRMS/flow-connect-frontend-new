'use client';

import React, { useState } from 'react';
import WarehouseLayoutModal from '../layout/WarehouseLayoutModal';
import WarehouseQRCodesModal from '../qr-codes/WarehouseQRCodesModal';
import { useWarehouseSettings, useShippingCarriers, useContainerTypes } from './hooks';
import { WarehouseSettingsHeader, WarehousesList, ShippingCarriersList, ContainerTypesList } from './components';
import { NewWarehouseModal, AddWorkerModal } from './modals';
import { mockAvailableWorkers } from './mockData';
import type { SettingsTab } from './types';

export default function WarehouseSettingsContent() {
  // Tab state
  const [activeTab, setActiveTab] = useState<SettingsTab>('warehouses');
  const [isSaving, setIsSaving] = useState(false);

  // Hooks
  const warehouseSettings = useWarehouseSettings();
  const carrierSettings = useShippingCarriers();
  const containerSettings = useContainerTypes();

  // Combined change tracking
  const hasChanges = warehouseSettings.hasChanges || carrierSettings.hasChanges || containerSettings.hasChanges;

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    warehouseSettings.resetChanges();
    carrierSettings.resetChanges();
    containerSettings.resetChanges();
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header with breadcrumbs, title, and actions */}
      <WarehouseSettingsHeader
        activeTab={activeTab}
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onAddWarehouse={() => warehouseSettings.setShowNewWarehouseModal(true)}
        onTabChange={setActiveTab}
      />

      {/* Warehouses Tab Content */}
      {activeTab === 'warehouses' && (
        <WarehousesList
          warehouses={warehouseSettings.warehouses}
          expandedWarehouse={warehouseSettings.expandedWarehouse}
          toggleWarehouseExpansion={warehouseSettings.toggleWarehouseExpansion}
          updateWarehouseField={warehouseSettings.updateWarehouseField}
          toggleLevel={warehouseSettings.toggleLevel}
          updateWorkerRole={warehouseSettings.updateWorkerRole}
          removeWorker={warehouseSettings.removeWorker}
          setShowAddWorkerModal={warehouseSettings.setShowAddWorkerModal}
          setShowLayoutModal={warehouseSettings.setShowLayoutModal}
          setShowQRCodesModal={warehouseSettings.setShowQRCodesModal}
          getWorkerById={warehouseSettings.getWorkerById}
        />
      )}

      {/* Shipping Carriers Tab Content */}
      {activeTab === 'shipping-carriers' && (
        <ShippingCarriersList
          shippingCarriers={carrierSettings.shippingCarriers}
          expandedCarrierId={carrierSettings.expandedCarrierId}
          newCarrierName={carrierSettings.newCarrierName}
          newCarrierAccount={carrierSettings.newCarrierAccount}
          newCarrierRemarks={carrierSettings.newCarrierRemarks}
          toggleCarrierExpansion={carrierSettings.toggleCarrierExpansion}
          handleUpdateCarrier={carrierSettings.handleUpdateCarrier}
          handleDeleteCarrier={carrierSettings.handleDeleteCarrier}
          handleAddCarrier={carrierSettings.handleAddCarrier}
          setNewCarrierName={carrierSettings.setNewCarrierName}
          setNewCarrierAccount={carrierSettings.setNewCarrierAccount}
          setNewCarrierRemarks={carrierSettings.setNewCarrierRemarks}
        />
      )}

      {/* Containers Tab Content */}
      {activeTab === 'containers' && (
        <ContainerTypesList
          containers={containerSettings.containerTypes}
          editingContainerId={containerSettings.editingContainerId}
          draggedContainerId={containerSettings.draggedContainerId}
          onAdd={containerSettings.addContainer}
          onUpdate={containerSettings.updateContainer}
          onDelete={containerSettings.deleteContainer}
          onStartEdit={containerSettings.setEditingContainerId}
          onDragStart={containerSettings.startDrag}
          onDragOver={containerSettings.handleDragOver}
          onDragEnd={containerSettings.endDrag}
        />
      )}

      {/* Modals */}
      {warehouseSettings.showNewWarehouseModal && (
        <NewWarehouseModal
          isOpen={warehouseSettings.showNewWarehouseModal}
          onClose={() => warehouseSettings.setShowNewWarehouseModal(false)}
        />
      )}

      {warehouseSettings.showAddWorkerModal && (
        <AddWorkerModal
          warehouseId={warehouseSettings.showAddWorkerModal}
          existingWorkerIds={
            warehouseSettings.warehouses
              .find((w) => w.id === warehouseSettings.showAddWorkerModal)
              ?.settings.workers.map((w) => w.workerId) || []
          }
          availableWorkers={mockAvailableWorkers}
          onAdd={warehouseSettings.addWorker}
          onClose={() => warehouseSettings.setShowAddWorkerModal(null)}
        />
      )}

      {warehouseSettings.showLayoutModal && (
        <WarehouseLayoutModal
          isOpen={true}
          onClose={() => warehouseSettings.setShowLayoutModal(null)}
          locationLevels={
            warehouseSettings.warehouses.find(
              (w) => w.id === warehouseSettings.showLayoutModal
            )?.settings.locationLevels || []
          }
          onSave={(levels) =>
            warehouseSettings.updateLocationLevels(warehouseSettings.showLayoutModal!, levels)
          }
          warehouseName={
            warehouseSettings.warehouses.find(
              (w) => w.id === warehouseSettings.showLayoutModal
            )?.name || ''
          }
          warehouseId={warehouseSettings.showLayoutModal}
        />
      )}

      {warehouseSettings.showQRCodesModal && (
        <WarehouseQRCodesModal
          isOpen={true}
          warehouseId={warehouseSettings.showQRCodesModal}
          warehouseName={
            warehouseSettings.warehouses.find(
              (w) => w.id === warehouseSettings.showQRCodesModal
            )?.name || ''
          }
          locationLevels={
            warehouseSettings.warehouses.find(
              (w) => w.id === warehouseSettings.showQRCodesModal
            )?.settings.locationLevels || []
          }
          onClose={() => warehouseSettings.setShowQRCodesModal(null)}
        />
      )}
    </main>
  );
}
