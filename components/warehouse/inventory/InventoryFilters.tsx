import React from 'react';
import { TabType } from './types';
import { ShipmentRequestStatus } from '@/lib/types/warehouse';

interface InventoryFiltersProps {
    activeTab: TabType;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    selectedFactory: string;
    onFactoryChange: (value: string) => void;
    selectedStatus: string;
    onStatusChange: (value: string) => void;
    requestStatusFilter: ShipmentRequestStatus | 'all';
    onRequestStatusFilterChange: (value: ShipmentRequestStatus | 'all') => void;
    factories: Array<{ id: string; name: string }>;
    statusOptions: Array<{ label: string; value: string }>;
    inventoryStatusOptions: Array<{ label: string; value: string }>;
}

export default function InventoryFilters({
    activeTab,
    searchQuery,
    onSearchChange,
    selectedFactory,
    onFactoryChange,
    selectedStatus,
    onStatusChange,
    requestStatusFilter,
    onRequestStatusFilterChange,
    factories,
    statusOptions,
    inventoryStatusOptions,
}: InventoryFiltersProps) {
    return (
        <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    placeholder={
                        activeTab === 'inventory'
                            ? "Search by product, part number, location..."
                            : activeTab === 'requests'
                                ? "Search by request number or vendor..."
                                : "Search by product, customer..."
                    }
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
            </div>
            <select
                value={selectedFactory}
                onChange={(e) => onFactoryChange(e.target.value)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
                <option value="All">All Factories</option>
                {factories.map((factory) => (
                    <option key={factory.id} value={factory.id}>{factory.name}</option>
                ))}
            </select>
            {activeTab === 'inventory' ? (
                <select
                    value={selectedStatus}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                    <option value="All">All Statuses</option>
                    {inventoryStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            ) : activeTab === 'requests' ? (
                <select
                    value={requestStatusFilter}
                    onChange={(e) => onRequestStatusFilterChange(e.target.value as ShipmentRequestStatus | 'all')}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                    <option value="all">All Statuses</option>
                    {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            ) : null}
        </div>
    );
}
