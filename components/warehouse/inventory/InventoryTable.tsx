import React from 'react';
import { FlatInventoryItem } from './types';
import { Inventory, inventoryStatusColors, inventoryStatusLabels } from '@/lib/types/warehouse';

interface InventoryTableProps {
    items: FlatInventoryItem[];
    inventory: Inventory[];
    onAddItem: (inv: Inventory) => void;
}

export default function InventoryTable({ items, inventory, onAddItem }: InventoryTableProps) {
    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatLocation = (item: FlatInventoryItem) => {
        // Parse the binLocation which is typically in format "Shelf 1A, Bin A"
        // For now, show the full location path if available, otherwise show binLocation
        if (item.fullLocationPath) {
            return item.fullLocationPath;
        }
        return item.binLocation;
    };

    return (
        <div className="flex-1 overflow-auto p-6 pt-0">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Factory</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Part Number</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Location</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Qty</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Available</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Reserved</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Lot #</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Received</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                                    No inventory items found
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const isLowStock = item.availableQuantity <= (item.reorderPoint || 0);
                                const inv = inventory.find(i => i.id === item.inventoryId);

                                return (
                                    <tr key={item.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-medium">
                                                {item.factoryName.split(' ')[0]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-[var(--foreground)] line-clamp-1">{item.productName}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                                                {item.partNumber}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="font-medium text-[var(--foreground)]">{formatLocation(item)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${inventoryStatusColors[item.status]}`}>
                                                {inventoryStatusLabels[item.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-semibold text-[var(--foreground)]">{item.quantity}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-sm font-semibold ${item.status === 'AVAILABLE' ? 'text-green-600' : 'text-[var(--muted-foreground)]'}`}>
                                                {item.status === 'AVAILABLE' ? item.quantity : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`text-sm font-semibold ${item.status === 'RESERVED' ? 'text-blue-600' : 'text-[var(--muted-foreground)]'}`}>
                                                {item.status === 'RESERVED' ? item.quantity : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-[var(--foreground)]">{item.lotNumber || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-[var(--muted-foreground)]">{formatDate(item.receivedDate)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {inv && (
                                                    <button
                                                        onClick={() => onAddItem(inv)}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-[var(--primary)] text-white rounded text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors"
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M12 5v14M5 12h14" />
                                                        </svg>
                                                        Add
                                                    </button>
                                                )}
                                                <button className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors text-[var(--muted-foreground)]">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="1" />
                                                        <circle cx="12" cy="5" r="1" />
                                                        <circle cx="12" cy="19" r="1" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
