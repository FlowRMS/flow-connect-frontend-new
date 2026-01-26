import React from 'react';
import type { IncomingShipment } from '@/lib/types/warehouse';

interface DeliveryTableRowProps {
  shipment: IncomingShipment;
  onRowClick: (shipment: IncomingShipment) => void;
  onQuickActionsToggle: (id: string) => void;
  showQuickActions: boolean;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
}

/**
 * Memoized table row component for better performance
 * Only re-renders when props actually change
 */
const DeliveryTableRow = React.memo<DeliveryTableRowProps>(
  ({ shipment, onRowClick, onQuickActionsToggle, showQuickActions, statusColors, statusLabels }) => {
    const eta = new Date(shipment.eta);
    const isOverdue = eta < new Date() && shipment.status !== 'RECEIVED';

    return (
      <tr
        onClick={() => onRowClick(shipment)}
        className="hover:bg-[var(--muted)]/20 cursor-pointer transition-colors border-b border-[var(--border)]"
      >
        <td className="px-4 py-3">
          <div className="font-medium text-[var(--foreground)]">{shipment.poNumber}</div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-[var(--foreground)]">{shipment.vendorName}</div>
        </td>
        <td className="px-4 py-3">
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: statusColors[shipment.status] || '#gray',
              color: 'white',
            }}
          >
            {statusLabels[shipment.status] || shipment.status}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-[var(--muted-foreground)]'}`}>
            {eta.toLocaleDateString()}
            {isOverdue && ' (Overdue)'}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-[var(--muted-foreground)]">
            {shipment.trackingNumber || '—'}
          </div>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickActionsToggle(shipment.id);
            }}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </td>
      </tr>
    );
  },
  // Custom comparison function for better memoization
  (prevProps, nextProps) => {
    return (
      prevProps.shipment.id === nextProps.shipment.id &&
      prevProps.shipment.status === nextProps.shipment.status &&
      prevProps.shipment.poNumber === nextProps.shipment.poNumber &&
      prevProps.shipment.vendorName === nextProps.shipment.vendorName &&
      prevProps.shipment.eta === nextProps.shipment.eta &&
      prevProps.shipment.trackingNumber === nextProps.shipment.trackingNumber &&
      prevProps.showQuickActions === nextProps.showQuickActions
    );
  }
);

DeliveryTableRow.displayName = 'DeliveryTableRow';

export default DeliveryTableRow;
