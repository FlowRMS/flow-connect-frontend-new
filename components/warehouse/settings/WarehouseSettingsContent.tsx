'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WarehouseLayoutModal from '../layout/WarehouseLayoutModal';
import WarehouseQRCodesModal from '../qr-codes/WarehouseQRCodesModal';
import { useWarehouseSettings, useShippingCarriers, useContainerTypes } from './hooks';
import { WarehouseSettingsHeader, WarehousesList, ShippingCarriersList, ContainerTypesList, SavingOverlay } from './components';
import ManufacturerProfilesContent from '../ManufacturerProfilesContent';
import { NewWarehouseModal, AddWorkerModal } from './modals';
import type { SettingsTab } from './types';

const ALL_TAB_IDS: SettingsTab[] = ['warehouses', 'shipping-carriers', 'containers', 'manufacturer-profiles'];

export default function WarehouseSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTab | null;
  
  // Tab state - initialize from URL parameter if valid
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    tabParam && ALL_TAB_IDS.includes(tabParam) ? tabParam : 'warehouses'
  );
  const [isSaving, setIsSaving] = useState(false);

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam && ALL_TAB_IDS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Handle tab change - update both state and URL
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    router.replace(`/warehouse/settings?tab=${tab}`, { scroll: false });
  };

  // Hooks
  const warehouseSettings = useWarehouseSettings();
  const carrierSettings = useShippingCarriers();
  const containerSettings = useContainerTypes();

  // Combined change tracking
  const hasChanges = warehouseSettings.hasChanges || carrierSettings.hasChanges || containerSettings.hasChanges;

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save warehouse changes to backend
      if (warehouseSettings.hasChanges) {
        await warehouseSettings.saveChanges();
      }
      // Save shipping carrier changes to backend
      if (carrierSettings.hasChanges) {
        await carrierSettings.saveChanges();
      }
      // Save container type changes to backend
      if (containerSettings.hasChanges) {
        await containerSettings.saveChanges();
      }
    } catch (err) {
      console.error('Failed to save changes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Track creating state for warehouse modal
  const [isCreatingWarehouse, setIsCreatingWarehouse] = useState(false);

  const handleCreateWarehouse = async (name: string, description?: string) => {
    setIsCreatingWarehouse(true);
    try {
      await warehouseSettings.handleCreateWarehouse(name, description);
    } finally {
      setIsCreatingWarehouse(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6 relative">
      {/* Saving Overlay */}
      <SavingOverlay isVisible={isSaving} message="Saving warehouse settings..." />

      {/* Header with breadcrumbs, title, and actions */}
      <WarehouseSettingsHeader
        activeTab={activeTab}
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onAddWarehouse={() => warehouseSettings.setShowNewWarehouseModal(true)}
        onTabChange={handleTabChange}
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
          hasChanges={hasChanges}
          isSaving={isSaving}
          onSave={handleSave}
          isLoadingDetails={warehouseSettings.isLoadingAddresses}
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
          saveCarrier={carrierSettings.saveCarrier}
          deleteCarrierImmediately={carrierSettings.deleteCarrierImmediately}
          hasCarrierChanges={carrierSettings.hasCarrierChanges}
          isLoadingDetails={carrierSettings.isLoadingDetails}
        />
      )}

      {/* Containers Tab Content */}
      {activeTab === 'containers' && (
        <ContainerTypesList
          containers={containerSettings.containerTypes}
          editingContainerId={containerSettings.editingContainerId}
          draggedContainerId={containerSettings.draggedContainerId}
          hasChanges={containerSettings.hasChanges}
          onAdd={containerSettings.addContainer}
          onUpdate={containerSettings.updateContainer}
          onDelete={containerSettings.deleteContainer}
          onSave={containerSettings.saveChanges}
          onStartEdit={containerSettings.setEditingContainerId}
          onDragStart={containerSettings.startDrag}
          onDragOver={containerSettings.handleDragOver}
          onDragEnd={containerSettings.endDrag}
        />
      )}

      {/* Manufacturer Profiles Tab Content */}
      {activeTab === 'manufacturer-profiles' && (
        <ManufacturerProfilesContent />
      )}

      {/* Modals */}
      {warehouseSettings.showNewWarehouseModal && (
        <NewWarehouseModal
          isOpen={warehouseSettings.showNewWarehouseModal}
          onClose={() => warehouseSettings.setShowNewWarehouseModal(false)}
          onCreate={handleCreateWarehouse}
          isCreating={isCreatingWarehouse}
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
