import React from 'react';
import Link from 'next/link';
import { BackorderItem } from './types';

interface BackordersTableProps {
    backorders: BackorderItem[];
    searchQuery: string;
    onRemoveBackorder: (backorderId: string) => void;
}

export default function BackordersTable({
    backorders,
    searchQuery,
    onRemoveBackorder,
}: BackordersTableProps) {
    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const filteredBackorders = backorders.filter(item =>
        !searchQuery ||
        item.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 pt-0">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
                <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">
                        Logged Backorders
                        <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">
                            ({filteredBackorders.length})
                        </span>
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Part Number</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Order #</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Qty</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Logged At</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filteredBackorders.map((backorder) => (
                                <tr key={backorder.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-[var(--foreground)]">{backorder.partNumber}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-[var(--foreground)]">{backorder.productName}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-[var(--primary)]">{backorder.orderNumber}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-[var(--foreground)]">{backorder.customerName}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm font-medium">
                                            {backorder.backorderQty}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-[var(--muted-foreground)]">
                                            {formatDate(backorder.loggedAt)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href="/warehouse/inventory/request/new"
                                                className="px-2 py-1 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
                                                title="Request Inventory"
                                            >
                                                Request
                                            </Link>
                                            <button
                                                onClick={() => onRemoveBackorder(backorder.id)}
                                                className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Remove from list"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredBackorders.length === 0 && (
                    <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                        <svg className="w-12 h-12 mx-auto mb-4 text-[var(--muted-foreground)]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <p>No logged backorders</p>
                        <p className="text-sm mt-1">Backorders logged from alerts will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
