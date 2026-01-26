'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCreateFactory } from '../../../../../components/warehouse/api/useFactoriesApi';
import {
  FactorySplitRatesInput,
  type FactorySplitRateEntry,
  entriesToFactorySplitRateInputs,
} from '../../../../../components/warehouse/components/FactorySplitRatesInput';

// ============================================================================
// Component
// ============================================================================

export default function CreateManufacturerPage() {
  const router = useRouter();

  // Form state
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createFactory = useCreateFactory();

  // Calculate split rate total for validation
  const splitRateTotal = useMemo(() =>
    splitRateEntries.reduce((sum, e) => sum + (parseFloat(e.splitRate) || 0), 0),
    [splitRateEntries]
  );

  const hasAnyReps = splitRateEntries.length > 0;
  const isValidSplitRate = !hasAnyReps || Math.abs(splitRateTotal - 100) < 0.1;

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Manufacturer name is required';
    }

    if (!isValidSplitRate) {
      newErrors.splitRates = 'Total split rate must equal exactly 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Convert split rate entries to API format
    const splitRatesInput = entriesToFactorySplitRateInputs(splitRateEntries);

    try {
      const newFactory = await createFactory.mutateAsync({
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

      toast.success('Manufacturer created successfully');
      // Navigate to the edit page for the new manufacturer
      router.push(`/warehouse/manufacturer-profiles/${newFactory.id}/edit`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create manufacturer');
      console.error('Create error:', err);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/warehouse/settings?tab=manufacturer-profiles')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Create New Manufacturer</h1>
              <p className="text-sm text-gray-500">Add a new manufacturer profile to the system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Basic Information
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className={labelClass}>
                    Manufacturer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className={`${inputClass} ${errors.title ? 'border-red-500' : ''}`}
                    placeholder="Enter manufacturer name"
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-500">{errors.title}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                    className={inputClass}
                    placeholder="e.g., ACC-001"
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={inputClass}
                    placeholder="contact@manufacturer.com"
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={inputClass}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Commission & Discounts */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Commission & Discounts
              </h2>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Base Commission Rate</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.baseCommissionRate}
                      onChange={(e) => handleChange('baseCommissionRate', e.target.value)}
                      className={`${inputClass} pr-8`}
                      placeholder="10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Commission Discount</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.commissionDiscountRate}
                      onChange={(e) => handleChange('commissionDiscountRate', e.target.value)}
                      className={`${inputClass} pr-8`}
                      placeholder="5"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Overall Discount</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.overallDiscountRate}
                      onChange={(e) => handleChange('overallDiscountRate', e.target.value)}
                      className={`${inputClass} pr-8`}
                      placeholder="15"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Shipping */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Payment & Shipping
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Payment Terms (days)</label>
                  <input
                    type="number"
                    value={formData.paymentTerms}
                    onChange={(e) => handleChange('paymentTerms', e.target.value)}
                    className={inputClass}
                    placeholder="30"
                    min="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>Lead Time (days)</label>
                  <input
                    type="number"
                    value={formData.leadTime}
                    onChange={(e) => handleChange('leadTime', e.target.value)}
                    className={inputClass}
                    placeholder="14"
                    min="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>Freight Terms</label>
                  <input
                    type="text"
                    value={formData.freightTerms}
                    onChange={(e) => handleChange('freightTerms', e.target.value)}
                    className={inputClass}
                    placeholder="FOB Origin"
                  />
                </div>
                <div>
                  <label className={labelClass}>External Payment Terms</label>
                  <input
                    type="text"
                    value={formData.externalPaymentTerms}
                    onChange={(e) => handleChange('externalPaymentTerms', e.target.value)}
                    className={inputClass}
                    placeholder="Net 30"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Additional Information</h2>
              <textarea
                value={formData.additionalInformation}
                onChange={(e) => handleChange('additionalInformation', e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-y"
                placeholder="Any additional notes about this manufacturer..."
              />
            </div>

            {/* Commission Split Rates */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <FactorySplitRatesInput
                entries={splitRateEntries}
                onChange={setSplitRateEntries}
                disabled={createFactory.isPending}
              />

              {errors.splitRates && (
                <p className="mt-2 text-xs text-red-500">{errors.splitRates}</p>
              )}
            </div>

            {/* Status Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Status</h2>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Published
                  </label>
                  <p className="text-xs text-gray-500">Make manufacturer visible in the system</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('published', !formData.published)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    formData.published ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                      formData.published ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 pb-8">
              <div className="text-sm text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/warehouse/settings?tab=manufacturer-profiles')}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createFactory.isPending || !isValidSplitRate}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {createFactory.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Manufacturer
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
