import React from 'react';
import { ShipmentRequest, shipmentRequestMethodLabels, shipmentRequestStatusColors, shipmentRequestStatusLabels } from '@/lib/types/warehouse';

interface ShipmentRequestsTableProps {
    requests: ShipmentRequest[];
    onViewDetails: (request: ShipmentRequest) => void;
    onConfirm: (requestId: string) => void;
    onCancel: (requestId: string) => void;
    onShowRequestModal: () => void;
}

export default function ShipmentRequestsTable({
    requests,
    onViewDetails,
    onConfirm,
    onCancel,
    onShowRequestModal,
}: ShipmentRequestsTableProps) {
    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="flex-1 overflow-auto p-6 pt-0">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
                <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">
                        Shipment Requests
                        <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">
                            ({requests.length})
                        </span>
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Request #</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Vendor</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Total Qty</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Requested Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Priority</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {requests.map((request) => (
                                <tr
                                    key={request.id}
                                    className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                                    onClick={() => onViewDetails(request)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-[var(--foreground)]">{request.requestNumber}</div>
                                        <div className="text-xs text-[var(--muted-foreground)]">
                                            {formatDate(request.createdAt)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-[var(--foreground)]">{request.vendorName}</div>
                                        {request.contactName && (
                                            <div className="text-xs text-[var(--muted-foreground)]">{request.contactName}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${request.requestMethod === 'EMAIL' ? 'bg-blue-100 text-blue-700' :
                                                request.requestMethod === 'CALL' ? 'bg-green-100 text-green-700' :
                                                    'bg-purple-100 text-purple-700'
                                            }`}>
                                            {request.requestMethod === 'EMAIL' && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                    <polyline points="22,6 12,13 2,6" />
                                                </svg>
                                            )}
                                            {request.requestMethod === 'CALL' && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
                                                </svg>
                                            )}
                                            {request.requestMethod === 'MANUFACTURER_SYSTEM' && (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                                    <line x1="8" y1="21" x2="16" y2="21" />
                                                    <line x1="12" y1="17" x2="12" y2="21" />
                                                </svg>
                                            )}
                                            {shipmentRequestMethodLabels[request.requestMethod]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">{request.items.length}</td>
                                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">{request.totalQuantity}</td>
                                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">{formatDate(request.requestedDeliveryDate)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${request.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                request.priority === 'expedited' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {request.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${shipmentRequestStatusColors[request.status]}`}>
                                            {shipmentRequestStatusLabels[request.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            {(request.status === 'PENDING' || request.status === 'SENT') && (
                                                <>
                                                    <button
                                                        onClick={() => onConfirm(request.id)}
                                                        className="px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 rounded transition-colors"
                                                        title="Mark as Confirmed"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => onCancel(request.id)}
                                                        className="px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 rounded transition-colors"
                                                        title="Cancel Request"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => onViewDetails(request)}
                                                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {requests.length === 0 && (
                    <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                        <p>No shipment requests found</p>
                        <button
                            onClick={onShowRequestModal}
                            className="mt-2 text-sm text-[var(--primary)] hover:underline"
                        >
                            Create your first request
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
