import React from 'react';
import type { WarehouseWorker } from '../types';

interface WorkerRowProps {
  worker: WarehouseWorker;
  role: 'worker' | 'manager';
  onRoleChange: (role: 'worker' | 'manager') => void;
  onRemove: () => void;
}

export default function WorkerRow({ worker, role, onRoleChange, onRemove }: WorkerRowProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--accent)]/50 group">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
          {worker.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--foreground)]">{worker.name}</div>
          <div className="text-xs text-[var(--muted-foreground)]">{worker.email}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value as 'worker' | 'manager')}
          className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="worker">Worker</option>
          <option value="manager">Manager</option>
        </select>
        <button
          onClick={onRemove}
          className="p-1 text-[var(--muted-foreground)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
