import React from 'react';
import type { ShippingCarrier } from '../types';
import { SERVICE_TYPE_OPTIONS } from '../constants';

interface CarrierServiceConfigProps {
  carrier: ShippingCarrier;
  onUpdate: (updates: Partial<ShippingCarrier>) => void;
}

export default function CarrierServiceConfig({ carrier, onUpdate }: CarrierServiceConfigProps) {
  const handleRemoveService = (service: string) => {
    const newServices = carrier.serviceTypes?.filter((s) => s !== service) || [];
    onUpdate({
      serviceTypes: newServices,
      defaultServiceType:
        carrier.defaultServiceType === service ? '' : carrier.defaultServiceType,
    });
  };

  const handleAddService = (service: string) => {
    if (service && !carrier.serviceTypes?.includes(service)) {
      onUpdate({
        serviceTypes: [...(carrier.serviceTypes || []), service],
      });
    }
  };

  // Get all available services not yet added
  const availableServices = Object.entries(SERVICE_TYPE_OPTIONS).flatMap(([category, services]) =>
    services
      .filter((s) => !carrier.serviceTypes?.includes(s))
      .map((s) => ({ category, service: s }))
  );

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        Service Configuration
      </h3>
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 space-y-3">
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Service Types</label>
          {/* Selected service tags */}
          <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
            {carrier.serviceTypes?.map((service) => (
              <span
                key={service}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]"
              >
                {service}
                <button
                  type="button"
                  onClick={() => handleRemoveService(service)}
                  className="hover:text-[var(--primary-hover)]"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          {/* Add service dropdown */}
          <div className="relative">
            <select
              value=""
              onChange={(e) => handleAddService(e.target.value)}
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="">+ Add service type...</option>
              {Object.entries(SERVICE_TYPE_OPTIONS).map(([category, services]) => (
                <optgroup key={category} label={`${category} Services`}>
                  {services
                    .filter((s) => !carrier.serviceTypes?.includes(s))
                    .map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">
            Default Service Type
          </label>
          <select
            value={carrier.defaultServiceType || ''}
            onChange={(e) => onUpdate({ defaultServiceType: e.target.value })}
            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="">Select default service</option>
            {carrier.serviceTypes?.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
