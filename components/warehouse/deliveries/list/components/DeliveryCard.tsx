import React from 'react';
import type { IncomingShipment } from '@/lib/types/warehouse';

interface DeliveryCardProps {
  shipment: IncomingShipment;
  onCardClick: (shipment: IncomingShipment) => void;
  onQuickActionsToggle: (id: string) => void;
  showQuickActions: boolean;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
}

/**
 * Memoized card component for better performance
 * Only re-renders when props actually change
 */
const DeliveryCard = React.memo<DeliveryCardProps>(
  ({ shipment, onCardClick, onQuickActionsToggle, showQuickActions, statusColors, statusLabels }) => {
    const eta = new Date(shipment.eta);
    const isOverdue = eta < new Date() && shipment.status !== 'RECEIVED';

    return (
      <div
        onClick={() => onCardClick(shipment)}
        className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">{shipment.poNumber}</h3>
            <p className="text-sm text-[var(--muted-foreground)]">{shipment.vendorName}</p>
          </div>
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
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">Status:</span>
            <span
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: statusColors[shipment.status] || '#gray',
                color: 'white',
              }}
            >
              {statusLabels[shipment.status] || shipment.status}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--muted-foreground)]">ETA:</span>
            <span className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
              {eta.toLocaleDateString()}
              {isOverdue && ' (Overdue)'}
            </span>
          </div>

          {shipment.trackingNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Tracking:</span>
              <span className="text-sm font-mono">{shipment.trackingNumber}</span>
            </div>
          )}
        </div>
      </div>
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

DeliveryCard.displayName = 'DeliveryCard';

export default DeliveryCard;
