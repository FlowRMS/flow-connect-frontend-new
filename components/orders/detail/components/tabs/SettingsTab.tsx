/**
 * SettingsTab Component
 * Displays settings for the order
 * Copy from original OrderDetailContent.tsx lines 3269-3400
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useOrderSettings } from '@/contexts/UserSettingsContext';
import type { OutsideRepSource, OrderSettingsValue } from '@/components/lib/graphql/settings';
import { showSuccessToast, showErrorToast } from '@/components/lib/toast';

interface SettingsTabProps {
  showEndUserPerLine: boolean;
  setShowEndUserPerLine: (value: boolean) => void;
  showOutsideRepPerLine: boolean;
  setShowOutsideRepPerLine: (value: boolean) => void;
  showInsideRepPerLine: boolean;
  setShowInsideRepPerLine: (value: boolean) => void;
  customerPartNumberSource: 'soldTo' | 'endUser';
  setCustomerPartNumberSource: (value: 'soldTo' | 'endUser') => void;
  hasFreightLine: boolean;
  onToggleFreightLine: () => void;
}

export function SettingsTab({
  showEndUserPerLine,
  setShowEndUserPerLine,
  showOutsideRepPerLine,
  setShowOutsideRepPerLine,
  showInsideRepPerLine,
  setShowInsideRepPerLine,
  customerPartNumberSource,
  setCustomerPartNumberSource,
  hasFreightLine,
  onToggleFreightLine,
}: SettingsTabProps) {
  const { settings: orderSettings, tenantSettings, saveSettings } = useOrderSettings();
  const [outsideRepSource, setOutsideRepSource] = useState<OutsideRepSource>('end_user');
  const [isSavingRepSource, setIsSavingRepSource] = useState(false);

  // Sync from tenant settings
  useEffect(() => {
    const tenantSource = (tenantSettings as any)?.outsideRepSource;
    if (tenantSource) {
      setOutsideRepSource(tenantSource);
    } else if (orderSettings?.outsideRepSource) {
      setOutsideRepSource(orderSettings.outsideRepSource);
    }
  }, [orderSettings, tenantSettings]);

  // Header field visibility state (synced from tenant settings)
  const [hideBillToCustomer, setHideBillToCustomer] = useState(false);
  const [hideShippingTerms, setHideShippingTerms] = useState(false);
  const [hideMarkNumber, setHideMarkNumber] = useState(false);
  const [hideProjectedShipDate, setHideProjectedShipDate] = useState(false);
  const [hideJob, setHideJob] = useState(false);
  const [hideManufacturerSoNumber, setHideManufacturerSoNumber] = useState(false);
  const [hideFreightTerms, setHideFreightTerms] = useState(false);
  const [isSavingVisibility, setIsSavingVisibility] = useState(false);

  // Sync header field visibility from tenant settings
  useEffect(() => {
    const ts = tenantSettings || orderSettings;
    if (ts) {
      setHideBillToCustomer(ts.hideBillToCustomer ?? false);
      setHideShippingTerms(ts.hideShippingTerms ?? false);
      setHideMarkNumber(ts.hideMarkNumber ?? false);
      setHideProjectedShipDate(ts.hideProjectedShipDate ?? false);
      setHideJob(ts.hideJob ?? false);
      setHideManufacturerSoNumber(ts.hideManufacturerSoNumber ?? false);
      setHideFreightTerms(ts.hideFreightTerms ?? false);
    }
  }, [orderSettings, tenantSettings]);

  // Save a header visibility toggle to tenant settings
  const handleVisibilityToggle = useCallback(async (key: keyof OrderSettingsValue, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    setIsSavingVisibility(true);
    try {
      const currentTenantSettings = tenantSettings || orderSettings || {};
      const success = await saveSettings(
        { ...currentTenantSettings, [key]: value } as any,
        'tenant'
      );
      if (success) {
        showSuccessToast('Field visibility saved');
      } else {
        showErrorToast('Failed to save field visibility');
      }
    } catch {
      showErrorToast('Failed to save field visibility');
    } finally {
      setIsSavingVisibility(false);
    }
  }, [tenantSettings, orderSettings, saveSettings]);

  // Save outsideRepSource directly to tenant settings
  const handleOutsideRepSourceChange = async (value: OutsideRepSource) => {
    setOutsideRepSource(value);
    setIsSavingRepSource(true);
    try {
      const currentTenantSettings = tenantSettings || orderSettings || {};
      const success = await saveSettings(
        { ...currentTenantSettings, outsideRepSource: value } as any,
        'tenant'
      );
      if (success) {
        showSuccessToast('Outside rep source saved');
      } else {
        showErrorToast('Failed to save outside rep source');
      }
    } catch {
      showErrorToast('Failed to save outside rep source');
    } finally {
      setIsSavingRepSource(false);
    }
  };

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
      <div className="space-y-5">
        {/* End User Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEndUserPerLine(!showEndUserPerLine)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
              showEndUserPerLine ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                showEndUserPerLine ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-[var(--foreground)]">Specify end user per line item</span>
        </div>

        {/* Outside Rep Commission Splits Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOutsideRepPerLine(!showOutsideRepPerLine)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
              showOutsideRepPerLine ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                showOutsideRepPerLine ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--foreground)]">Outside rep at line item level</span>
            <span className="text-xs text-[var(--muted-foreground)]">{showOutsideRepPerLine ? 'Set outside rep per line item' : 'Set outside rep in header'}</span>
          </div>
        </div>

        {/* Inside Rep Commission Splits Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInsideRepPerLine(!showInsideRepPerLine)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
              showInsideRepPerLine ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                showInsideRepPerLine ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--foreground)]">Inside rep at line item level</span>
            <span className="text-xs text-[var(--muted-foreground)]">{showInsideRepPerLine ? 'Set inside rep per line item' : 'Set inside rep in header'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border)]"></div>

        {/* Outside Rep Population Source - Tenant Wide */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Outside Rep Population Source</span>
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Tenant Wide</span>
            {isSavingRepSource && (
              <span className="text-xs text-[var(--muted-foreground)]">Saving...</span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">Choose which customer&apos;s outside reps auto-populate when selected</p>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="outsideRepSource"
                checked={outsideRepSource === 'end_user'}
                onChange={() => handleOutsideRepSourceChange('end_user')}
                disabled={isSavingRepSource}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--foreground)]">End User</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="outsideRepSource"
                checked={outsideRepSource === 'sold_to'}
                onChange={() => handleOutsideRepSourceChange('sold_to')}
                disabled={isSavingRepSource}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--foreground)]">Sold To Customer</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="outsideRepSource"
                checked={outsideRepSource === 'bill_to'}
                onChange={() => handleOutsideRepSourceChange('bill_to')}
                disabled={isSavingRepSource}
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--foreground)]">Bill To Customer</span>
            </label>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border)]"></div>

        {/* Header Field Visibility - Tenant Wide */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Header Field Visibility</span>
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Tenant Wide</span>
            {isSavingVisibility && (
              <span className="text-xs text-[var(--muted-foreground)]">Saving...</span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">Toggle fields on the order header. Changes apply to all users.</p>
          <div className="space-y-2">
            {([
              { key: 'hideBillToCustomer' as const, label: 'Hide bill to customer', value: hideBillToCustomer, setter: setHideBillToCustomer },
              { key: 'hideShippingTerms' as const, label: 'Hide shipping terms', value: hideShippingTerms, setter: setHideShippingTerms },
              { key: 'hideMarkNumber' as const, label: 'Hide mark #', value: hideMarkNumber, setter: setHideMarkNumber },
              { key: 'hideProjectedShipDate' as const, label: 'Hide projected ship date', value: hideProjectedShipDate, setter: setHideProjectedShipDate },
              { key: 'hideJob' as const, label: 'Hide job', value: hideJob, setter: setHideJob },
              { key: 'hideManufacturerSoNumber' as const, label: 'Hide manufacturer SO number', value: hideManufacturerSoNumber, setter: setHideManufacturerSoNumber },
              { key: 'hideFreightTerms' as const, label: 'Hide freight terms', value: hideFreightTerms, setter: setHideFreightTerms },
            ]).map(({ key, label, value, setter }) => (
              <div key={key} className="flex items-center gap-3">
                <button
                  onClick={() => handleVisibilityToggle(key, !value, setter)}
                  disabled={isSavingVisibility}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                    value ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                  } ${isSavingVisibility ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                      value ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className="text-sm text-[var(--foreground)]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border)]"></div>

        {/* Customer Part Number Source Radio - Coming Soon */}
        <div className="space-y-2 opacity-50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Customer Part Number Source</span>
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Soon</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-not-allowed">
              <input
                type="radio"
                name="customerPartNumberSource"
                checked={customerPartNumberSource === 'soldTo'}
                disabled
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--muted-foreground)]">Sold To Customer</span>
            </label>
            <label className="flex items-center gap-2 cursor-not-allowed">
              <input
                type="radio"
                name="customerPartNumberSource"
                checked={customerPartNumberSource === 'endUser'}
                disabled
                className="accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--muted-foreground)]">End User</span>
            </label>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border)]"></div>

        {/* Freight Line Toggle - Coming Soon */}
        <div className="flex items-center gap-3 opacity-50">
          <button
            disabled
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 bg-[var(--muted)] cursor-not-allowed"
          >
            <span
              className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform translate-x-0.5"
            />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">Freight line</span>
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">Soon</span>
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">Add a freight line item to this order</span>
          </div>
        </div>
      </div>
    </div>
  );
}
