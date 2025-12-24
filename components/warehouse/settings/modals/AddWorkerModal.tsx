import React, { useState } from 'react';
import type { WarehouseWorker } from '../types';

interface AddWorkerModalProps {
  warehouseId: string;
  existingWorkerIds: string[];
  availableWorkers: WarehouseWorker[];
  onAdd: (warehouseId: string, workerId: string, role: 'worker' | 'manager') => void;
  onClose: () => void;
}

export default function AddWorkerModal({
  warehouseId,
  existingWorkerIds,
  availableWorkers,
  onAdd,
  onClose,
}: AddWorkerModalProps) {
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'worker' | 'manager'>('worker');

  const unassignedWorkers = availableWorkers.filter((w) => !existingWorkerIds.includes(w.id));

  const handleAdd = () => {
    if (selectedWorker) {
      onAdd(warehouseId, selectedWorker, selectedRole);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Add Team Member</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--accent)] rounded transition-colors">
            <svg
              className="w-5 h-5 text-[var(--muted-foreground)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          {unassignedWorkers.length > 0 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Select Person
                </label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a person...</option>
                  {unassignedWorkers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} ({worker.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'worker' | 'manager')}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="worker">Worker</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <svg
                className="w-10 h-10 mx-auto text-[var(--muted-foreground)] opacity-50 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-sm text-[var(--muted-foreground)]">
                All available workers are already assigned to this warehouse.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedWorker}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedWorker
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
            }`}
          >
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}
