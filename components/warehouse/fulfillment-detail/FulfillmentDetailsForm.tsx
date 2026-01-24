'use client';

import React, { useMemo } from 'react';
import { FulfillmentOrder } from '../api/fulfillmentApi';
import { shipStatusColors, shipStatusLabels } from '@/lib/types/warehouse';
import { mockWarehouses } from '@/lib/data/warehouse-mock';
import { useShippingCarriersByType, type ShippingCarrier } from '../settings/api/useShippingCarriersApi';
import type { Warehouse } from '../settings/api/warehousesApi';

interface FulfillmentDetailsFormProps {
  fulfillmentOrder: FulfillmentOrder;
  warehouseId: string;
  needByDate: string;
  shipToName: string;
  shipToAddressLine1: string;
  shipToAddressLine2: string;
  shipToCity: string;
  shipToState: string;
  shipToPostalCode: string;
  shipToPhone: string;
  carrier: string;
  carrierType: 'parcel' | 'freight';
  serviceType: string;
  trackingNumbers: string;
  freightClass: string;
  shipToDifferentFromPO: boolean;
  isReleased: boolean;
  // Delivery method configuration (pre-release)
  deliveryMethod: 'SHIP' | 'WILL_CALL';
  warehouses?: Warehouse[];
  isLoadingWarehouses?: boolean;
  shippingCarriers?: ShippingCarrier[];
  isLoadingCarriers?: boolean;
  onDeliveryMethodChange: (method: 'SHIP' | 'WILL_CALL') => void;
  onWarehouseIdChange: (id: string) => void;
  onNeedByDateChange: (date: string) => void;
  onShipToNameChange: (name: string) => void;
  onShipToAddressLine1Change: (address: string) => void;
  onShipToAddressLine2Change: (address: string) => void;
  onShipToCityChange: (city: string) => void;
  onShipToStateChange: (state: string) => void;
  onShipToPostalCodeChange: (code: string) => void;
  onShipToPhoneChange: (phone: string) => void;
  onCarrierChange: (carrier: string) => void;
  onCarrierTypeChange: (type: 'parcel' | 'freight') => void;
  onServiceTypeChange: (serviceType: string) => void;
  onTrackingNumbersChange: (tracking: string) => void;
  onFreightClassChange: (freightClass: string) => void;
  onShipToDifferentFromPOChange: (different: boolean) => void;
}

export default function FulfillmentDetailsForm({
  fulfillmentOrder,
  warehouseId,
  needByDate,
  shipToName,
  shipToAddressLine1,
  shipToAddressLine2,
  shipToCity,
  shipToState,
  shipToPostalCode,
  shipToPhone,
  carrier,
  carrierType,
  serviceType,
  trackingNumbers,
  freightClass,
  shipToDifferentFromPO,
  isReleased,
  deliveryMethod,
  warehouses = [],
  isLoadingWarehouses = false,
  shippingCarriers = [],
  isLoadingCarriers = false,
  onDeliveryMethodChange,
  onWarehouseIdChange,
  onNeedByDateChange,
  onShipToNameChange,
  onShipToAddressLine1Change,
  onShipToAddressLine2Change,
  onShipToCityChange,
  onShipToStateChange,
  onShipToPostalCodeChange,
  onShipToPhoneChange,
  onCarrierChange,
  onCarrierTypeChange,
  onServiceTypeChange,
  onTrackingNumbersChange,
  onFreightClassChange,
  onShipToDifferentFromPOChange,
}: FulfillmentDetailsFormProps) {
  // Fetch carriers from database based on selected type
  const carrierTypeForQuery = carrierType === 'parcel' ? 'PARCEL' : 'FREIGHT';
  const { data: carriers = [], isLoading: carriersLoading } = useShippingCarriersByType(
    carrierTypeForQuery,
    true // active only
  );

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Sort carriers alphabetically for display
  const sortedCarriers = useMemo(() => {
    return [...shippingCarriers].sort((a, b) => a.name.localeCompare(b.name));
  }, [shippingCarriers]);

  // Get service types from the selected carrier
  const selectedCarrierData = useMemo(() => {
    if (!carrier) return null;
    return shippingCarriers?.find(c => c.id === carrier) || null;
  }, [carrier, shippingCarriers]);

  const availableServiceTypes = useMemo(() => {
    const types = selectedCarrierData?.serviceTypes;
    if (!types) return [];
    // serviceTypes can be:
    // - an array of strings: ["Ground", "2nd Day"]
    // - an object like {"Ground": true, "2nd Day": true}
    // - a JSON string that needs parsing
    if (Array.isArray(types)) {
      return types;
    }
    if (typeof types === 'string') {
      try {
        const parsed = JSON.parse(types);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return Object.keys(parsed);
      } catch {
        return [];
      }
    }
    // If it's an object, get the keys (service type names)
    if (typeof types === 'object') {
      return Object.keys(types);
    }
    return [];
  }, [selectedCarrierData]);

  return (
    <div className="space-y-4">
      {/* Warehouse & Need By Date Row */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => onWarehouseIdChange(e.target.value)}
              disabled={isReleased || isLoadingWarehouses}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingWarehouses ? (
                <option value="">Loading warehouses...</option>
              ) : warehouses.length > 0 ? (
                warehouses.filter(wh => wh.isActive !== false).map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))
              ) : (
                <option value="">No warehouses available</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Need By Date</label>
            <input
              type="date"
              value={needByDate}
              onChange={(e) => onNeedByDateChange(e.target.value)}
              disabled={isReleased}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Ship To - Component Fields */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase">Ship To</label>
          {!isReleased && !shipToDifferentFromPO && (
            <button
              onClick={() => onShipToDifferentFromPOChange(true)}
              className="text-xs text-[var(--primary)] hover:underline font-medium"
            >
              Different than what's on the PO
            </button>
          )}
          {shipToDifferentFromPO && (
            <span className="flex items-center gap-2">
              <span className="text-xs text-amber-600 font-medium">Modified from PO</span>
              {!isReleased && (
                <button
                  onClick={() => onShipToDifferentFromPOChange(false)}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Reset
                </button>
              )}
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Name</label>
            <input
              type="text"
              value={shipToName}
              onChange={(e) => onShipToNameChange(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Phone</label>
            <input
              type="text"
              value={shipToPhone}
              onChange={(e) => onShipToPhoneChange(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Address Line 1</label>
            <input
              type="text"
              value={shipToAddressLine1}
              onChange={(e) => onShipToAddressLine1Change(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Address Line 2</label>
            <input
              type="text"
              value={shipToAddressLine2}
              onChange={(e) => onShipToAddressLine2Change(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              placeholder="Apt, Suite, etc."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">City</label>
            <input
              type="text"
              value={shipToCity}
              onChange={(e) => onShipToCityChange(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">State</label>
            <input
              type="text"
              value={shipToState}
              onChange={(e) => onShipToStateChange(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Postal Code</label>
            <input
              type="text"
              value={shipToPostalCode}
              onChange={(e) => onShipToPostalCodeChange(e.target.value)}
              disabled={isReleased || !shipToDifferentFromPO}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Country</label>
            <input
              type="text"
              value="USA"
              disabled
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--muted)]/30 text-sm opacity-50 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Shipping Configuration - Editable in PENDING, read-only after release */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
        <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-3">Shipping Configuration</label>

        {/* Delivery Method Selection */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => onDeliveryMethodChange('SHIP')}
            disabled={isReleased}
            className={`p-3 border-2 rounded-xl text-left transition-all ${
              deliveryMethod === 'SHIP'
                ? 'border-purple-500 bg-purple-50'
                : 'border-[var(--border)] hover:border-purple-300'
            } ${isReleased ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                deliveryMethod === 'SHIP' ? 'bg-purple-500 text-white' : 'bg-[var(--muted)]'
              }`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-sm">Ship</div>
                <div className="text-xs text-[var(--muted-foreground)]">Carrier delivery</div>
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onDeliveryMethodChange('WILL_CALL')}
            disabled={isReleased}
            className={`p-3 border-2 rounded-xl text-left transition-all ${
              deliveryMethod === 'WILL_CALL'
                ? 'border-purple-500 bg-purple-50'
                : 'border-[var(--border)] hover:border-purple-300'
            } ${isReleased ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                deliveryMethod === 'WILL_CALL' ? 'bg-purple-500 text-white' : 'bg-[var(--muted)]'
              }`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-sm">Will Call</div>
                <div className="text-xs text-[var(--muted-foreground)]">Customer pickup</div>
              </div>
            </div>
          </button>
        </div>

        {/* Carrier Type Selection - only show if Ship method */}
        {deliveryMethod === 'SHIP' && (
          <div className="mb-4">
            <label className="block text-xs text-[var(--muted-foreground)] mb-2">Carrier Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onCarrierTypeChange('parcel')}
                disabled={isReleased}
                className={`p-3 border-2 rounded-xl text-left transition-all ${
                  carrierType === 'parcel'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-[var(--border)] hover:border-purple-300'
                } ${isReleased ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    carrierType === 'parcel' ? 'bg-purple-500 text-white' : 'bg-[var(--muted)]'
                  }`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Parcel</div>
                    <div className="text-xs text-[var(--muted-foreground)]">UPS, FedEx, USPS</div>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onCarrierTypeChange('freight')}
                disabled={isReleased}
                className={`p-3 border-2 rounded-xl text-left transition-all ${
                  carrierType === 'freight'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-[var(--border)] hover:border-purple-300'
                } ${isReleased ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    carrierType === 'freight' ? 'bg-purple-500 text-white' : 'bg-[var(--muted)]'
                  }`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="6" width="22" height="12" rx="2"/>
                      <path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2"/>
                      <line x1="12" y1="10" x2="12" y2="14"/>
                      <line x1="8" y1="10" x2="8" y2="14"/>
                      <line x1="16" y1="10" x2="16" y2="14"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Freight / LTL</div>
                    <div className="text-xs text-[var(--muted-foreground)]">Pallets, heavy items</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Carrier Selection - only show if Ship method */}
        {deliveryMethod === 'SHIP' && (
          <div className="mb-4">
            <label className="block text-xs text-[var(--muted-foreground)] mb-2">
              Carrier
            </label>
            {isLoadingCarriers ? (
              <div className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
                Loading carriers...
              </div>
            ) : (
              <select
                value={carrier}
                onChange={(e) => onCarrierChange(e.target.value)}
                disabled={isReleased}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select carrier...</option>
                {shippingCarriers
                  ?.filter(c => {
                    // Filter by carrier type - match frontend lowercase with backend uppercase
                    if (!c.carrierType) return true; // Show carriers without type for backwards compatibility
                    return c.carrierType.toLowerCase() === carrierType;
                  })
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))
                }
              </select>
            )}
          </div>
        )}

        {/* Service Type Selection - show if Ship method and carrier has service types */}
        {deliveryMethod === 'SHIP' && carrier && availableServiceTypes.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs text-[var(--muted-foreground)] mb-2">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => onServiceTypeChange(e.target.value)}
              disabled={isReleased}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select service type...</option>
              {availableServiceTypes.map(st => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Freight Class Selection - only show if Ship method and Freight type */}
        {deliveryMethod === 'SHIP' && carrierType === 'freight' && (
          <div className="mb-4">
            <label className="block text-xs text-[var(--muted-foreground)] mb-2">Freight Class</label>
            <select
              value={freightClass}
              onChange={(e) => onFreightClassChange(e.target.value)}
              disabled={isReleased}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select class...</option>
              <option value="50">Class 50</option>
              <option value="55">Class 55</option>
              <option value="60">Class 60</option>
              <option value="65">Class 65</option>
              <option value="70">Class 70</option>
              <option value="77.5">Class 77.5</option>
              <option value="85">Class 85</option>
              <option value="92.5">Class 92.5</option>
              <option value="100">Class 100</option>
              <option value="110">Class 110</option>
              <option value="125">Class 125</option>
              <option value="150">Class 150</option>
              <option value="175">Class 175</option>
              <option value="200">Class 200</option>
              <option value="250">Class 250</option>
              <option value="300">Class 300</option>
              <option value="400">Class 400</option>
              <option value="500">Class 500</option>
            </select>
          </div>
        )}

        {/* Ship Status & Tracking - only show after release */}
        {isReleased && (
          <div className="pt-4 border-t border-[var(--border)]">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Ship Status</label>
                <span className={`inline-flex items-center px-2 py-1.5 rounded text-xs font-medium ${shipStatusColors[fulfillmentOrder.shipConfirmedAt ? 'SHIPPED' : 'NOT_SHIPPED']}`}>
                  {shipStatusLabels[fulfillmentOrder.shipConfirmedAt ? 'SHIPPED' : 'NOT_SHIPPED']}
                </span>
                {fulfillmentOrder.shipConfirmedAt && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{formatDateTime(fulfillmentOrder.shipConfirmedAt)}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Tracking #</label>
                <input
                  type="text"
                  value={trackingNumbers}
                  onChange={(e) => onTrackingNumbersChange(e.target.value)}
                  placeholder="Entered in Shipping Mode"
                  disabled
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--muted)]/30 text-sm opacity-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

