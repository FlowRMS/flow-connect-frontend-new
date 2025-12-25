/**
 * Manufacturer Profile Modal
 * Modal for editing factory/manufacturer settings
 * Integrated with Factory GraphQL endpoints
 *
 * NOTE: Some tabs (Customer X-Ref, Ship-To X-Ref, Freight Categories) are kept
 * for future endpoint integration - they currently use local state only.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFactory, useUpdateFactory, type Factory } from './api/useFactoriesApi';
import { toast } from 'sonner';
import {
  FactorySplitRatesInput,
  type FactorySplitRateEntry,
  entriesToFactorySplitRateInputsWithId,
} from './components/FactorySplitRatesInput';

interface ManufacturerProfileModalProps {
  factoryId: string;
  onClose: () => void;
  onSave: () => void;
}

type TabId = 'settings' | 'split-rates' | 'customer-xref' | 'shipto-xref' | 'freight';

export default function ManufacturerProfileModal({
  factoryId,
  onClose,
  onSave,
}: ManufacturerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('settings');
  const [formData, setFormData] = useState<Partial<Factory>>({});
  const [splitRateEntries, setSplitRateEntries] = useState<FactorySplitRateEntry[]>([]);

  // Fetch factory data
  const { data: factory, isLoading, error } = useFactory(factoryId);
  const updateFactory = useUpdateFactory();

  // Calculate split rate total for validation
  const splitRateTotal = useMemo(() =>
    splitRateEntries.reduce((sum, e) => sum + (parseFloat(e.splitRate) || 0), 0),
    [splitRateEntries]
  );

  const hasAnyReps = splitRateEntries.length > 0;
  const isValidSplitRate = !hasAnyReps || splitRateTotal === 100;

  // Initialize form data and split rate entries when factory loads
  useEffect(() => {
    if (factory) {
      setFormData({ ...factory });

      // Convert factory splitRates to editable entries
      if (factory.splitRates && factory.splitRates.length > 0) {
        const entries: FactorySplitRateEntry[] = factory.splitRates.map((rate, index) => ({
          tempId: `existing_${rate.id}_${index}`,
          id: rate.id, // Include id for update - API uses this to identify which split rate to update
          userId: rate.user?.id || '', // Get userId from user object
          user: rate.user ? {
            id: rate.user.id,
            email: rate.user.email || '',
            firstName: rate.user.firstName,
            lastName: rate.user.lastName,
            fullName: rate.user.fullName,
            inside: rate.user.inside,
            outside: rate.user.outside,
          } : undefined,
          splitRate: rate.splitRate,
          position: rate.position,
        }));
        setSplitRateEntries(entries);
      } else {
        setSplitRateEntries([]);
      }
    }
  }, [factory]);

  const handleFieldChange = (field: keyof Factory, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      toast.error('Manufacturer name is required');
      return;
    }

    if (!isValidSplitRate) {
      toast.error('Total split rate must equal exactly 100%');
      return;
    }

    // Convert split rate entries to API format (includes id for existing entries)
    const splitRatesInput = entriesToFactorySplitRateInputsWithId(splitRateEntries);

    try {
      await updateFactory.mutateAsync({
        id: factoryId,
        input: {
          title: formData.title,
          accountNumber: formData.accountNumber || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          baseCommissionRate: formData.baseCommissionRate || undefined,
          commissionDiscountRate: formData.commissionDiscountRate || undefined,
          overallDiscountRate: formData.overallDiscountRate || undefined,
          paymentTerms: formData.paymentTerms,
          leadTime: formData.leadTime,
          freightTerms: formData.freightTerms || undefined,
          externalPaymentTerms: formData.externalPaymentTerms || undefined,
          additionalInformation: formData.additionalInformation || undefined,
          published: formData.published,
          splitRates: splitRatesInput,
        },
      });
      onSave();
    } catch (err) {
      console.error('Failed to update factory:', err);
    }
  };

  const tabs = [
    { id: 'settings' as TabId, label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'split-rates' as TabId, label: 'Split Rates', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'customer-xref' as TabId, label: 'Customer X-Ref', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'shipto-xref' as TabId, label: 'Ship-To X-Ref', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'freight' as TabId, label: 'Freight Categories', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-[var(--card)] rounded-xl shadow-xl max-w-5xl w-full max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  {isLoading ? 'Loading...' : (formData.title || 'Manufacturer Profile')}
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">Edit manufacturer settings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Published Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted-foreground)]">Published</span>
                <button
                  onClick={() => handleFieldChange('published', !formData.published)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.published ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.published ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-[var(--border)] flex-shrink-0 overflow-x-auto">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <svg className="animate-spin h-10 w-10 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <p className="text-[var(--muted-foreground)]">Loading manufacturer...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <svg className="mx-auto mb-4 w-12 h-12 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Failed to load manufacturer</h3>
                <p className="text-sm text-red-600 dark:text-red-400">{error instanceof Error ? error.message : 'An error occurred'}</p>
              </div>
            )}

            {!isLoading && !error && (
              <>
                {activeTab === 'settings' && (
                  <SettingsTab formData={formData} onChange={handleFieldChange} />
                )}

                {activeTab === 'split-rates' && (
                  <SplitRatesTab
                    entries={splitRateEntries}
                    onChange={setSplitRateEntries}
                    disabled={updateFactory.isPending}
                  />
                )}

                {activeTab === 'customer-xref' && (
                  <CustomerXRefTab />
                )}

                {activeTab === 'shipto-xref' && (
                  <ShipToXRefTab />
                )}

                {activeTab === 'freight' && (
                  <FreightCategoryTab />
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateFactory.isPending || isLoading || !isValidSplitRate}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updateFactory.isPending && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Tab Component
function SettingsTab({
  formData,
  onChange,
}: {
  formData: Partial<Factory>;
  onChange: (field: keyof Factory, value: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Manufacturer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Account Number</label>
            <input
              type="text"
              value={formData.accountNumber || ''}
              onChange={(e) => onChange('accountNumber', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => onChange('email', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => onChange('phone', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        </div>
      </div>

      {/* Commission & Discounts */}
      <div className="pt-4 border-t border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Commission & Discounts</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Base Commission Rate</label>
            <div className="relative">
              <input
                type="text"
                value={formData.baseCommissionRate || ''}
                onChange={(e) => onChange('baseCommissionRate', e.target.value)}
                className="w-full px-3 py-2 pr-8 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Commission Discount</label>
            <div className="relative">
              <input
                type="text"
                value={formData.commissionDiscountRate || ''}
                onChange={(e) => onChange('commissionDiscountRate', e.target.value)}
                className="w-full px-3 py-2 pr-8 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Overall Discount</label>
            <div className="relative">
              <input
                type="text"
                value={formData.overallDiscountRate || ''}
                onChange={(e) => onChange('overallDiscountRate', e.target.value)}
                className="w-full px-3 py-2 pr-8 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="15"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment & Shipping */}
      <div className="pt-4 border-t border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Payment & Shipping</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Payment Terms (days)</label>
            <input
              type="number"
              value={formData.paymentTerms ?? ''}
              onChange={(e) => onChange('paymentTerms', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="30"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Lead Time (days)</label>
            <input
              type="number"
              value={formData.leadTime ?? ''}
              onChange={(e) => onChange('leadTime', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="14"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Freight Terms</label>
            <input
              type="text"
              value={formData.freightTerms || ''}
              onChange={(e) => onChange('freightTerms', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="FOB Origin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">External Payment Terms</label>
            <input
              type="text"
              value={formData.externalPaymentTerms || ''}
              onChange={(e) => onChange('externalPaymentTerms', e.target.value)}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Net 30"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="pt-4 border-t border-[var(--border)]">
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Additional Information</label>
        <textarea
          value={formData.additionalInformation || ''}
          onChange={(e) => onChange('additionalInformation', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
          placeholder="Any additional notes about this manufacturer..."
        />
      </div>
    </div>
  );
}

// Split Rates Tab Component
function SplitRatesTab({
  entries,
  onChange,
  disabled,
}: {
  entries: FactorySplitRateEntry[];
  onChange: (entries: FactorySplitRateEntry[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Commission Split Rates</h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          Configure how commissions are split between team members for this manufacturer
        </p>
      </div>

      <FactorySplitRatesInput
        entries={entries}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

// Customer X-Ref Tab Component (Placeholder for future endpoint)
function CustomerXRefTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Customer Cross-References</h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          Map your customers to this manufacturer's customer codes
        </p>
      </div>

      <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-lg bg-[var(--muted)]/30">
        <svg className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-sm font-medium text-[var(--foreground)] mb-1">Coming Soon</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Customer cross-reference management will be available in a future update
        </p>
      </div>
    </div>
  );
}

// Ship-To X-Ref Tab Component (Placeholder for future endpoint)
function ShipToXRefTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Ship-To Cross-References</h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          Map shipping addresses to this manufacturer's ship-to codes
        </p>
      </div>

      <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-lg bg-[var(--muted)]/30">
        <svg className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm font-medium text-[var(--foreground)] mb-1">Coming Soon</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Ship-to cross-reference management will be available in a future update
        </p>
      </div>
    </div>
  );
}

// Freight Category Tab Component (Placeholder for future endpoint)
function FreightCategoryTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Freight Categories</h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          Configure freight classes and categories for this manufacturer
        </p>
      </div>

      <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-lg bg-[var(--muted)]/30">
        <svg className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <p className="text-sm font-medium text-[var(--foreground)] mb-1">Coming Soon</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Freight category management will be available in a future update
        </p>
      </div>
    </div>
  );
}
