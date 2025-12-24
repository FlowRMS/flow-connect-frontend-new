import React from 'react';
import type { WarehouseWithSettings, WarehouseWorker } from '../types';
import WorkerRow from './WorkerRow';

interface TeamMembersSectionProps {
  warehouse: WarehouseWithSettings;
  onUpdateWorkerRole: (workerId: string, role: 'worker' | 'manager') => void;
  onRemoveWorker: (workerId: string) => void;
  onShowAddWorker: () => void;
  getWorkerById: (workerId: string) => WarehouseWorker | undefined;
}

export default function TeamMembersSection({
  warehouse,
  onUpdateWorkerRole,
  onRemoveWorker,
  onShowAddWorker,
  getWorkerById,
}: TeamMembersSectionProps) {
  const managers = warehouse.settings.workers.filter((w) => w.role === 'manager');
  const workers = warehouse.settings.workers.filter((w) => w.role === 'worker');

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[var(--foreground)]">Team Members</h3>
        <button
          onClick={onShowAddWorker}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Member
        </button>
      </div>

      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
        {/* Managers Section */}
        {managers.length > 0 && (
          <div className="p-3">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Managers ({managers.length})
            </div>
            <div className="space-y-1.5">
              {managers.map((assignment) => {
                const worker = getWorkerById(assignment.workerId);
                if (!worker) return null;
                return (
                  <WorkerRow
                    key={worker.id}
                    worker={worker}
                    role={assignment.role}
                    onRoleChange={(role) => onUpdateWorkerRole(worker.id, role)}
                    onRemove={() => onRemoveWorker(worker.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Workers Section */}
        {workers.length > 0 && (
          <div className="p-3">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Workers ({workers.length})
            </div>
            <div className="space-y-1.5">
              {workers.map((assignment) => {
                const worker = getWorkerById(assignment.workerId);
                if (!worker) return null;
                return (
                  <WorkerRow
                    key={worker.id}
                    worker={worker}
                    role={assignment.role}
                    onRoleChange={(role) => onUpdateWorkerRole(worker.id, role)}
                    onRemove={() => onRemoveWorker(worker.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {warehouse.settings.workers.length === 0 && (
          <div className="p-6 text-center">
            <svg
              className="w-8 h-8 mx-auto text-[var(--muted-foreground)] opacity-50 mb-2"
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
            <p className="text-sm text-[var(--muted-foreground)]">No team members assigned</p>
            <button
              onClick={onShowAddWorker}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Add team members
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
