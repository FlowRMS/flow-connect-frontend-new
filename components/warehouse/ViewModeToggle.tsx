'use client';

import React from 'react';
import { useWarehouse, WarehouseViewMode } from './WarehouseContext';

export default function ViewModeToggle() {
  const { viewMode, setViewMode } = useWarehouse();

  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-lg">
      <button
        onClick={() => setViewMode('manager')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          viewMode === 'manager'
            ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
        title="Manager View - Full access to all features"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Manager
      </button>
      <button
        onClick={() => setViewMode('worker')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          viewMode === 'worker'
            ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
        title="Worker View - Limited access for warehouse workers"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Worker
      </button>
    </div>
  );
}
