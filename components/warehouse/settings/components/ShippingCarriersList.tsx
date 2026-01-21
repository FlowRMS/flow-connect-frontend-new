'use client';

import { useState, useCallback } from 'react';
import type { ShippingCarrier } from '../types';
import ShippingCarrierAccordionItem from './ShippingCarrierAccordionItem';
import { DeleteConfirmModal } from '@/components/quotes-v2/modals/DeleteConfirmModal';

interface ShippingCarriersListProps {
  shippingCarriers: ShippingCarrier[];
  expandedCarrierId: string | null;
  newCarrierName: string;
  newCarrierAccount: string;
  newCarrierRemarks: string;
  toggleCarrierExpansion: (carrierId: string) => void;
  handleUpdateCarrier: (id: string, updates: Partial<ShippingCarrier>) => void;
  handleDeleteCarrier: (id: string) => void;
  handleAddCarrier: () => void;
  setNewCarrierName: (name: string) => void;
  setNewCarrierAccount: (account: string) => void;
  setNewCarrierRemarks: (remarks: string) => void;
  saveCarrier?: (id: string) => Promise<void>;
  deleteCarrierImmediately?: (id: string) => Promise<void>;
  hasCarrierChanges?: (id: string) => boolean;
  isLoadingDetails?: boolean;
}

export default function ShippingCarriersList({
  shippingCarriers,
  expandedCarrierId,
  newCarrierName,
  toggleCarrierExpansion,
  handleUpdateCarrier,
  handleDeleteCarrier,
  handleAddCarrier,
  setNewCarrierName,
  saveCarrier,
  deleteCarrierImmediately,
  hasCarrierChanges,
  isLoadingDetails = false,
}: ShippingCarriersListProps) {
  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = useCallback((carrierId: string) => {
    setDeleteConfirmId(carrierId);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmId) return;

    setIsDeleting(true);
    try {
      if (deleteCarrierImmediately) {
        await deleteCarrierImmediately(deleteConfirmId);
      } else {
        handleDeleteCarrier(deleteConfirmId);
      }
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete carrier:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmId, deleteCarrierImmediately, handleDeleteCarrier]);

  const carrierToDelete = deleteConfirmId
    ? shippingCarriers.find(c => c.id === deleteConfirmId)
    : null;

  return (
    <div className="space-y-4">
      {/* Carriers List - Accordion Style */}
      {shippingCarriers.map((carrier) => {
        const isExpanded = expandedCarrierId === carrier.id;
        const hasChanges = hasCarrierChanges ? hasCarrierChanges(carrier.id) : false;

        return (
          <ShippingCarrierAccordionItem
            key={carrier.id}
            carrier={carrier}
            isExpanded={isExpanded}
            hasChanges={hasChanges}
            isLoadingDetails={isExpanded && isLoadingDetails}
            onToggleExpansion={() => toggleCarrierExpansion(carrier.id)}
            onUpdateCarrier={(updates) => handleUpdateCarrier(carrier.id, updates)}
            onDeleteCarrier={() => handleDeleteClick(carrier.id)}
            onSaveCarrier={saveCarrier ? () => saveCarrier(carrier.id) : undefined}
          />
        );
      })}

      {/* Empty State */}
      {shippingCarriers.length === 0 && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-[var(--muted-foreground)] opacity-50 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            No Shipping Carriers Configured
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Get started by adding your first shipping carrier.
          </p>
        </div>
      )}

      {/* Add New Carrier Button */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] border-dashed p-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newCarrierName}
            onChange={(e) => setNewCarrierName(e.target.value)}
            placeholder="Enter carrier name to add..."
            className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newCarrierName.trim()) {
                handleAddCarrier();
              }
            }}
          />
          <button
            onClick={handleAddCarrier}
            disabled={!newCarrierName.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              newCarrierName.trim()
                ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Carrier
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Shipping Carrier"
        message="Are you sure you want to delete this shipping carrier"
        itemName={carrierToDelete?.name}
        isPending={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
