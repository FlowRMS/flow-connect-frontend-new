'use client';

import React from 'react';

interface FulfillmentTabsProps {
  activeTab: 'orders' | 'waves';
  onTabChange: (tab: 'orders' | 'waves') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function FulfillmentTabs({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: FulfillmentTabsProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-lg">
        <button
          onClick={() => onTabChange('orders')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'orders'
              ? 'bg-white text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Orders Awaiting Fulfillment
        </button>
        <button
          onClick={() => onTabChange('waves')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'waves'
              ? 'bg-white text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Picking Waves
        </button>
      </div>

      <div className="flex-1" />

      <div className="relative max-w-xs">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
      </div>
    </div>
  );
}

