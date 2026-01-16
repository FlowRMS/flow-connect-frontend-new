import React from 'react';
import type { ShippingCarrier } from '../types';
import { PAYMENT_TERMS_OPTIONS } from '../constants';

interface CarrierAccountBillingProps {
  carrier: ShippingCarrier;
  onUpdate: (updates: Partial<ShippingCarrier>) => void;
}

export default function CarrierAccountBilling({ carrier, onUpdate }: CarrierAccountBillingProps) {
  // Helper to update billing address fields
  const updateBillingAddress = (field: string, value: string) => {
    const currentAddress = carrier.billingAddressData || {
      line1: '',
      city: '',
      country: 'USA',
    };
    onUpdate({
      billingAddressData: {
        ...currentAddress,
        [field]: value,
      },
    });
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        Account & Billing
      </h3>
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 space-y-3">
        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Account Number</label>
          <input
            type="text"
            value={carrier.accountNumber || ''}
            onChange={(e) => onUpdate({ accountNumber: e.target.value })}
            placeholder="Your carrier account number"
            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Billing Address Fields */}
        <div className="space-y-2">
          <label className="block text-xs text-[var(--muted-foreground)]">Billing Address</label>
          <input
            type="text"
            value={carrier.billingAddressData?.line1 || ''}
            onChange={(e) => updateBillingAddress('line1', e.target.value)}
            placeholder="Address Line 1"
            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={carrier.billingAddressData?.line2 || ''}
            onChange={(e) => updateBillingAddress('line2', e.target.value)}
            placeholder="Address Line 2 (optional)"
            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={carrier.billingAddressData?.city || ''}
              onChange={(e) => updateBillingAddress('city', e.target.value)}
              placeholder="City"
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={carrier.billingAddressData?.state || ''}
              onChange={(e) => updateBillingAddress('state', e.target.value)}
              placeholder="State"
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={carrier.billingAddressData?.zipCode || ''}
              onChange={(e) => updateBillingAddress('zipCode', e.target.value)}
              placeholder="ZIP Code"
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={carrier.billingAddressData?.country || ''}
              onChange={(e) => updateBillingAddress('country', e.target.value)}
              placeholder="Country"
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Payment Terms</label>
          <select
            value={carrier.paymentTerms || ''}
            onChange={(e) => onUpdate({ paymentTerms: e.target.value })}
            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select payment terms</option>
            {PAYMENT_TERMS_OPTIONS.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
