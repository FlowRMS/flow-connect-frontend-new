/**
 * Create Factory Modal
 * Modal for creating a new factory/manufacturer
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useCreateFactory } from '../api/useFactoriesApi';
import { toast } from 'sonner';
import {
  FactorySplitRatesInput,
  type FactorySplitRateEntry,
  entriesToFactorySplitRateInputs,
} from '../components/FactorySplitRatesInput';

interface CreateFactoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateFactoryModal({ isOpen, onClose, onSuccess }: CreateFactoryModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    accountNumber: '',
    email: '',
    phone: '',
    baseCommissionRate: '',
    commissionDiscountRate: '',
    overallDiscountRate: '',
    paymentTerms: '',
    leadTime: '',
    freightTerms: '',
    externalPaymentTerms: '',
    additionalInformation: '',
    published: true,
  });

  const [splitRateEntries, setSplitRateEntries] = useState<FactorySplitRateEntry[]>([]);

  const createFactory = useCreateFactory();

  // Calculate split rate total for validation
  const splitRateTotal = useMemo(() =>
    splitRateEntries.reduce((sum, e) => sum + (parseFloat(e.splitRate) || 0), 0),
    [splitRateEntries]
  );

  const hasAnyReps = splitRateEntries.length > 0;
  const isValidSplitRate = !hasAnyReps || splitRateTotal === 100;

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Manufacturer name is required');
      return;
    }

    if (!isValidSplitRate) {
      toast.error('Total split rate must equal exactly 100%');
      return;
    }

    // Convert split rate entries to API format (no id for create)
    const splitRatesInput = entriesToFactorySplitRateInputs(splitRateEntries);

    try {
      await createFactory.mutateAsync({
        title: formData.title,
        accountNumber: formData.accountNumber || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        baseCommissionRate: formData.baseCommissionRate || undefined,
        commissionDiscountRate: formData.commissionDiscountRate || undefined,
        overallDiscountRate: formData.overallDiscountRate || undefined,
        paymentTerms: formData.paymentTerms ? parseInt(formData.paymentTerms) : undefined,
        leadTime: formData.leadTime ? parseInt(formData.leadTime) : undefined,
        freightTerms: formData.freightTerms || undefined,
        externalPaymentTerms: formData.externalPaymentTerms || undefined,
        additionalInformation: formData.additionalInformation || undefined,
        published: formData.published,
        splitRates: splitRatesInput.length > 0 ? splitRatesInput : undefined,
      });

      // Reset form
      setFormData({
        title: '',
        accountNumber: '',
        email: '',
        phone: '',
        baseCommissionRate: '',
        commissionDiscountRate: '',
        overallDiscountRate: '',
        paymentTerms: '',
        leadTime: '',
        freightTerms: '',
        externalPaymentTerms: '',
        additionalInformation: '',
        published: true,
      });
      setSplitRateEntries([]);

      onSuccess();
    } catch (err) {
      console.error('Failed to create factory:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-[var(--card)] rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">New Manufacturer</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Add a new manufacturer profile</p>
              </div>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Manufacturer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Enter manufacturer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.accountNumber}
                      onChange={(e) => handleChange('accountNumber', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="e.g., ACC-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="contact@manufacturer.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Commission Rates */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Commission & Discounts</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Base Commission Rate</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.baseCommissionRate}
                        onChange={(e) => handleChange('baseCommissionRate', e.target.value)}
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
                        value={formData.commissionDiscountRate}
                        onChange={(e) => handleChange('commissionDiscountRate', e.target.value)}
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
                        value={formData.overallDiscountRate}
                        onChange={(e) => handleChange('overallDiscountRate', e.target.value)}
                        className="w-full px-3 py-2 pr-8 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        placeholder="15"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Payment & Shipping</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Payment Terms (days)</label>
                    <input
                      type="number"
                      value={formData.paymentTerms}
                      onChange={(e) => handleChange('paymentTerms', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="30"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Lead Time (days)</label>
                    <input
                      type="number"
                      value={formData.leadTime}
                      onChange={(e) => handleChange('leadTime', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="14"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Freight Terms</label>
                    <input
                      type="text"
                      value={formData.freightTerms}
                      onChange={(e) => handleChange('freightTerms', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="FOB Origin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">External Payment Terms</label>
                    <input
                      type="text"
                      value={formData.externalPaymentTerms}
                      onChange={(e) => handleChange('externalPaymentTerms', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Net 30"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Additional Information</label>
                <textarea
                  value={formData.additionalInformation}
                  onChange={(e) => handleChange('additionalInformation', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  placeholder="Any additional notes about this manufacturer..."
                />
              </div>

              {/* Split Rates */}
              <div>
                <FactorySplitRatesInput
                  entries={splitRateEntries}
                  onChange={setSplitRateEntries}
                  disabled={createFactory.isPending}
                />
              </div>

              {/* Published Toggle */}
              <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => handleChange('published', !formData.published)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.published ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      formData.published ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <div>
                  <span className="text-sm font-medium text-[var(--foreground)]">Published</span>
                  <p className="text-xs text-[var(--muted-foreground)]">Make this manufacturer visible in the system</p>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.title || createFactory.isPending || !isValidSplitRate}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createFactory.isPending && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              )}
              Create Manufacturer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
