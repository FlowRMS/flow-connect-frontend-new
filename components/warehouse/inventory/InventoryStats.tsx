import React from 'react';
import { StatFilter } from './types';

interface InventoryStatsProps {
    stats: {
        totalProducts: number;
        totalQuantity: number;
        availableQuantity: number;
        reservedQuantity: number;
        lowStockCount: number;
    };
    activeStatFilter: StatFilter;
    onStatCardClick: (filter: StatFilter) => void;
}

import { formatQuantity } from './utils';

export default function InventoryStats({
    stats,
    activeStatFilter,
    onStatCardClick,
}: InventoryStatsProps) {
    const getStatCardClass = (filter: StatFilter) => {
        const baseClass = "bg-[var(--card)] rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md";
        if (activeStatFilter === filter) {
            return `${baseClass} border-[var(--primary)] ring-2 ring-[var(--primary)]/20`;
        }
        return `${baseClass} border-[var(--border)] hover:border-[var(--primary)]/50`;
    };

    return (
        <div className="grid grid-cols-5 gap-4 mb-6">
            <div
                className={getStatCardClass('all')}
                onClick={() => onStatCardClick('all')}
            >
                <div className="text-sm text-[var(--muted-foreground)]">Total Products</div>
                <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.totalProducts}</div>
                {activeStatFilter === 'all' && (
                    <div className="text-xs text-[var(--primary)] mt-1">Showing all</div>
                )}
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                <div className="text-sm text-[var(--muted-foreground)]">Total Quantity</div>
                <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{formatQuantity(stats.totalQuantity)}</div>
            </div>
            <div
                className={getStatCardClass('available')}
                onClick={() => onStatCardClick('available')}
            >
                <div className="text-sm text-[var(--muted-foreground)]">Available</div>
                <div className="text-2xl font-semibold text-green-600 mt-1">{formatQuantity(stats.availableQuantity)}</div>
                {activeStatFilter === 'available' && (
                    <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
                )}
            </div>
            <div
                className={getStatCardClass('reserved')}
                onClick={() => onStatCardClick('reserved')}
            >
                <div className="text-sm text-[var(--muted-foreground)]">Reserved</div>
                <div className="text-2xl font-semibold text-blue-600 mt-1">{formatQuantity(stats.reservedQuantity)}</div>
                {activeStatFilter === 'reserved' && (
                    <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
                )}
            </div>
            <div
                className={getStatCardClass('low_stock')}
                onClick={() => onStatCardClick('low_stock')}
            >
                <div className="text-sm text-[var(--muted-foreground)]">Low Stock</div>
                <div className="text-2xl font-semibold text-red-600 mt-1">{stats.lowStockCount}</div>
                {activeStatFilter === 'low_stock' && (
                    <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
                )}
            </div>
        </div>
    );
}
