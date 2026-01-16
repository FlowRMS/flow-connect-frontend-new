'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { calculateNextDate, formatDateOnly, getRecurrenceDescription, parseDateInput } from '../utils/recurrence';
import {
  RecurringShipment,
  RecurringShipmentStatus,
  recurringShipmentStatusLabels,
  recurringShipmentStatusColors,
  IncomingShipment,
} from '@/lib/types/warehouse';
import RecurringShipmentDetailModal from '../../modals/RecurringShipmentDetailModal';
import CreateRecurringShipmentModal from '../../modals/CreateRecurringShipmentModal';

type RecurringShipmentCreatePayload = Omit<RecurringShipment, 'id' | 'createdAt' | 'updatedAt'>;

interface RecurringShipmentsContentProps {
  recurringShipments: RecurringShipment[];
  deliveries: IncomingShipment[];
  onCreateRecurring?: (data: RecurringShipmentCreatePayload) => Promise<void> | void;
  onUpdateRecurring?: (id: string, updates: Partial<RecurringShipment>) => Promise<void> | void;
  onToggleStatus?: (recurring: RecurringShipment, status: RecurringShipmentStatus) => Promise<void> | void;
  onCancel?: (recurring: RecurringShipment) => Promise<void> | void;
}

export default function RecurringShipmentsContent({
  recurringShipments,
  deliveries,
  onCreateRecurring,
  onUpdateRecurring,
  onToggleStatus,
  onCancel,
}: RecurringShipmentsContentProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<RecurringShipmentStatus | 'ALL'>('ALL');
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringShipment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const filteredRecurringShipments = useMemo(() => {
    if (statusFilter === 'ALL') return recurringShipments;
    return recurringShipments.filter(rs => rs.status === statusFilter);
  }, [recurringShipments, statusFilter]);

  const lateShipments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredRecurringShipments.filter(rs => {
      if (rs.status !== 'ACTIVE' || !rs.nextExpectedDate) return false;
      const nextDate = new Date(rs.nextExpectedDate);
      nextDate.setHours(0, 0, 0, 0);
      return nextDate < today;
    });
  }, [filteredRecurringShipments]);

  const isLate = (rs: RecurringShipment) => {
    return lateShipments.some(late => late.id === rs.id);
  };

  const handleToggleStatus = (rs: RecurringShipment) => {
    const newStatus: RecurringShipmentStatus = rs.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    onToggleStatus?.(rs, newStatus);
    if (selectedRecurring?.id === rs.id) {
      setSelectedRecurring({ ...rs, status: newStatus });
    }
  };

  const handleCancel = (rs: RecurringShipment) => {
    if (confirm(`Are you sure you want to cancel "${rs.name}"? This cannot be undone.`)) {
      onCancel?.(rs);
      setShowModal(false);
      setSelectedRecurring(null);
    }
  };

  const handleSave = (updates: Partial<RecurringShipment>) => {
    if (!selectedRecurring) return;

    // Recalculate next expected date if pattern changed
    let nextExpectedDate = selectedRecurring.nextExpectedDate;
    if (updates.recurrencePattern || updates.startDate) {
      const pattern = updates.recurrencePattern || selectedRecurring.recurrencePattern;
      const startDate = updates.startDate || selectedRecurring.startDate;
      nextExpectedDate = formatDateOnly(calculateNextDate(pattern, parseDateInput(startDate)));
    }

    onUpdateRecurring?.(selectedRecurring.id, {
      ...updates,
      nextExpectedDate,
    });
    setShowModal(false);
    setSelectedRecurring(null);
  };

  const handleCreate = async (data: RecurringShipmentCreatePayload) => {
    if (isCreating) return;

    // Calculate the first expected date
    const nextExpectedDate = formatDateOnly(calculateNextDate(data.recurrencePattern, parseDateInput(data.startDate)));

    try {
      setIsCreating(true);
      await Promise.resolve(onCreateRecurring?.({
        ...data,
        nextExpectedDate,
        generatedShipmentIds: [],
      } as Omit<RecurringShipment, 'id' | 'createdAt' | 'updatedAt'>));
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create recurring shipment', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRowClick = (rs: RecurringShipment) => {
    setSelectedRecurring(rs);
    setShowModal(true);
  };

  const getLinkedShipments = (recurringId: string): IncomingShipment[] => {
    return deliveries.filter((shipment) => shipment.recurringShipmentId === recurringId);
  };

  // Find upcoming delivery for a recurring shipment
  const getUpcomingDelivery = (rs: RecurringShipment): IncomingShipment | undefined => {
    const shipments = getLinkedShipments(rs.id);
    return shipments.find(
      s => s.status === 'PENDING' || s.status === 'CONFIRMED'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted-foreground)]">Filter:</span>
          <div className="flex gap-2">
            {(['ALL', 'ACTIVE', 'PAUSED', 'CANCELLED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
                }`}
              >
                {status === 'ALL' ? 'All' : recurringShipmentStatusLabels[status]}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Create Recurring Delivery
        </button>
      </div>

      {/* Recurring Shipments Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        {filteredRecurringShipments.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M17 1l4 4-4 4"/>
                <path d="M3 11V9a4 4 0 014-4h14"/>
                <path d="M7 23l-4-4 4-4"/>
                <path d="M21 13v2a4 4 0 01-4 4H3"/>
              </svg>
            </div>
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-1">No Recurring Deliveries</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              Set up automatic delivery scheduling for regular shipments.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create Your First Recurring Delivery
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Next Delivery</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredRecurringShipments.map(rs => {
                const late = isLate(rs);
                const upcomingDelivery = getUpcomingDelivery(rs);

                return (
                  <tr
                    key={rs.id}
                    className={`hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${late ? 'bg-red-50/50' : ''}`}
                    onClick={() => handleRowClick(rs)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--foreground)]">{rs.name}</span>
                        {late && (
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700">
                            Late
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {rs.expectedItems.length} item{rs.expectedItems.length !== 1 ? 's' : ''} per delivery
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">{rs.vendorName}</td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                      {getRecurrenceDescription(rs.recurrencePattern)}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium ${late ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                        {rs.nextExpectedDate ? new Date(rs.nextExpectedDate).toLocaleDateString() : 'N/A'}
                      </div>
                      {upcomingDelivery && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/warehouse/deliveries/${upcomingDelivery.id}`);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          View expected delivery
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${recurringShipmentStatusColors[rs.status]}`}>
                        {recurringShipmentStatusLabels[rs.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {rs.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleToggleStatus(rs)}
                            className="px-2.5 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 rounded transition-colors"
                          >
                            Pause
                          </button>
                        )}
                        {rs.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancel(rs)}
                            className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedRecurring && (
        <RecurringShipmentDetailModal
          recurring={selectedRecurring}
          linkedShipments={getLinkedShipments(selectedRecurring.id)}
          onClose={() => {
            setShowModal(false);
            setSelectedRecurring(null);
          }}
          onPause={() => handleToggleStatus(selectedRecurring)}
          onCancel={() => handleCancel(selectedRecurring)}
          onSave={handleSave}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateRecurringShipmentModal
          onClose={() => {
            if (isCreating) return;
            setShowCreateModal(false);
          }}
          onSubmit={handleCreate}
          isSubmitting={isCreating}
        />
      )}
    </div>
  );
}
