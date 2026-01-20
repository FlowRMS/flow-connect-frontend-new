'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useFactory,
  useUpdateFactory,
  type Factory,
} from '@/components/warehouse/api/useFactoriesApi';
import {
  FactorySplitRatesInput,
  type FactorySplitRateEntry,
  entriesToFactorySplitRateInputsWithId,
} from '@/components/warehouse/components/FactorySplitRatesInput';
import { ConnectedEntitiesSection } from '@/components/shared/ConnectedEntitiesSection';
import { GoogleMapsAddressModal } from '@/components/shared/google-maps-address/GoogleMapsAddressModal';
import {
  useAddressesBySource,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  type Address,
} from '@/components/hooks/useAddressApi';
import { useUnsavedChangesGuard } from '@/components/shared/hooks/useUnsavedChangesGuard';
import { useUnsavedChangesContext } from '@/contexts/UnsavedChangesContext';

type TabId = 'overview' | 'addresses' | 'split-rates' | 'connected-entities' | 'customer-xref' | 'shipto-xref' | 'freight';

export default function ManufacturerEditPage() {
  const params = useParams();
  const router = useRouter();
  const factoryId = params.id as string;

  // API Hooks
  const { data: factory, isLoading, error } = useFactory(factoryId);
  const updateFactory = useUpdateFactory();

  // State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [formData, setFormData] = useState<Partial<Factory>>({});
  const [splitRateEntries, setSplitRateEntries] = useState<FactorySplitRateEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Section refs for scroll-to functionality
  const sectionRefs = useRef<Record<TabId, HTMLDivElement | null>>({
    'overview': null,
    'addresses': null,
    'split-rates': null,
    'connected-entities': null,
    'customer-xref': null,
    'shipto-xref': null,
    'freight': null,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Flag to disable scroll spy during programmatic scrolling
  const isScrollingRef = useRef(false);

  // Address state and hooks
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const { data: addresses = [], isLoading: addressesLoading } = useAddressesBySource(factoryId, 'FACTORY');
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();

  // Calculate split rate total for validation
  const splitRateTotal = useMemo(() =>
    splitRateEntries.reduce((sum, e) => sum + (parseFloat(e.splitRate) || 0), 0),
    [splitRateEntries]
  );

  const hasAnyReps = splitRateEntries.length > 0;
  const isValidSplitRate = !hasAnyReps || Math.abs(splitRateTotal - 100) < 0.1;

  // Initialize form data when factory loads
  useEffect(() => {
    if (factory) {
      setFormData({ ...factory });

      // Convert factory splitRates to editable entries
      if (factory.splitRates && factory.splitRates.length > 0) {
        const entries: FactorySplitRateEntry[] = factory.splitRates.map((rate, index) => ({
          tempId: `existing_${rate.id}_${index}`,
          id: rate.id,
          userId: rate.user?.id || '',
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
      setHasChanges(false);
    }
  }, [factory]);

  // Scroll spy effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const tabIds: TabId[] = ['overview', 'addresses', 'split-rates', 'connected-entities', 'customer-xref', 'shipto-xref', 'freight'];

    const handleScroll = () => {
      // Skip scroll spy updates during programmatic scrolling
      if (isScrollingRef.current) return;

      const containerRect = container.getBoundingClientRect();
      let currentSection: TabId = 'overview';

      for (const tabId of tabIds) {
        const section = sectionRefs.current[tabId];
        if (section) {
          const sectionRect = section.getBoundingClientRect();
          // Check if section top is at or above the container top + offset
          if (sectionRect.top <= containerRect.top + 100) {
            currentSection = tabId;
          }
        }
      }
      setActiveTab(currentSection);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = useCallback((tabId: TabId) => {
    const section = sectionRefs.current[tabId];
    const container = scrollContainerRef.current;
    if (section && container) {
      // Disable scroll spy during programmatic scroll
      isScrollingRef.current = true;
      setActiveTab(tabId);

      // Calculate the section's position relative to the scroll container
      const containerRect = container.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const headerOffset = 20;

      // Calculate the target scroll position
      const sectionTop = sectionRect.top - containerRect.top + scrollTop - headerOffset;

      container.scrollTo({ top: sectionTop, behavior: 'smooth' });

      // Re-enable scroll spy after scroll animation completes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
  }, []);

  const handleFieldChange = (field: keyof Factory, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSplitRateChange = (entries: FactorySplitRateEntry[]) => {
    setSplitRateEntries(entries);
    setHasChanges(true);
  };

  const handleSave = async (): Promise<boolean> => {
    if (!formData.title?.trim()) {
      toast.error('Manufacturer name is required');
      return false;
    }

    if (!isValidSplitRate) {
      toast.error('Total split rate must equal exactly 100%');
      return false;
    }

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
      toast.success('Manufacturer updated successfully');
      setHasChanges(false);
      return true;
    } catch (err) {
      toast.error('Failed to update manufacturer');
      console.error('Update error:', err);
      return false;
    }
  };

  // Unsaved changes guard - tracks manufacturer editing and blocks navigation
  useUnsavedChangesGuard({
    entityType: 'Manufacturer',
    entityId: factoryId,
    entityName: factory?.title || null,
    hasChanges,
    onSave: handleSave,
  });

  // Get unsaved changes context for back button navigation check
  const { requestNavigation, hasUnsavedChanges } = useUnsavedChangesContext();

  // Handle back navigation with unsaved changes check
  const handleBack = () => {
    if (hasUnsavedChanges) {
      const canNavigate = requestNavigation('/manufacturers', 'back');
      if (!canNavigate) {
        return; // Navigation blocked, modal will be shown
      }
    }
    router.push('/manufacturers');
  };

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview' },
    { id: 'addresses' as TabId, label: 'Addresses', count: addresses.length || null },
    { id: 'split-rates' as TabId, label: 'Split Rates', count: splitRateEntries.length || null },
    { id: 'connected-entities' as TabId, label: 'Connected Entities' },
    { id: 'customer-xref' as TabId, label: 'Customer X-Ref' },
    { id: 'shipto-xref' as TabId, label: 'Ship-To X-Ref' },
    { id: 'freight' as TabId, label: 'Freight Categories' },
  ];

  // Address handlers
  const handleSaveAddress = async (addressData: Omit<Address, 'id' | 'createdAt'>) => {
    try {
      // Strip out latitude/longitude as they're not part of the GraphQL AddressInput schema
      const { latitude, longitude, formattedAddress, ...apiAddressData } = addressData as Omit<Address, 'id' | 'createdAt'> & { latitude?: number; longitude?: number; formattedAddress?: string };

      if (editingAddress) {
        // Update existing address
        await updateAddressMutation.mutateAsync({
          id: editingAddress.id,
          input: {
            ...apiAddressData,
            sourceId: factoryId,
            sourceType: 'FACTORY',
          },
        });
        toast.success('Address updated successfully');
      } else {
        // Create new address
        await createAddressMutation.mutateAsync({
          ...apiAddressData,
          sourceId: factoryId,
          sourceType: 'FACTORY',
        });
        toast.success('Address added successfully');
      }
      setShowAddAddressModal(false);
      setEditingAddress(null);
    } catch (err) {
      toast.error(editingAddress ? 'Failed to update address' : 'Failed to add address');
      console.error('Save address error:', err);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowAddAddressModal(true);
  };

  const handleCloseAddressModal = () => {
    setShowAddAddressModal(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddressMutation.mutateAsync({
        id: addressId,
        sourceId: factoryId,
        sourceType: 'FACTORY',
      });
      toast.success('Address deleted successfully');
    } catch (err) {
      toast.error('Failed to delete address');
      console.error('Delete address error:', err);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading manufacturer...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error || !factory) {
    return (
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Manufacturer not found</h3>
          <p className="text-gray-500 mb-4">The manufacturer you're looking for doesn't exist or has been deleted.</p>
          <button
            onClick={() => router.push('/manufacturers')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Manufacturers
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {formData.title || 'Untitled Manufacturer'}
                </h1>
                <p className="text-sm text-gray-500">
                  {formData.accountNumber ? `Account: ${formData.accountNumber}` : 'Edit manufacturer profile'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Badges */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              formData.published
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {formData.published ? 'Published' : 'Draft'}
            </span>

            <button
              onClick={() => router.push('/manufacturers')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateFactory.isPending || !hasChanges || !isValidSplitRate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {updateFactory.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0 sticky top-0 z-10">
        <div className="flex gap-1 overflow-x-auto py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.count && (
                <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full min-w-[20px] text-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* ============ OVERVIEW SECTION ============ */}
        <div ref={el => { sectionRefs.current['overview'] = el; }} id="section-overview">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>

          {/* Status Toggle */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Published</span>
                <div className="relative group">
                  <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50">
                    Published manufacturers are visible and searchable in the system.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleFieldChange('published', !formData.published)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.published ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.published ? 'translate-x-6' : 'translate-x-1'
                }`}/>
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="col-span-2 sm:col-span-1">
                <label className={labelClass}>
                  Manufacturer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className={inputClass}
                  placeholder="Enter manufacturer name"
                />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                  className={inputClass}
                  placeholder="e.g., ACC-001"
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className={inputClass}
                  placeholder="contact@manufacturer.com"
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className={inputClass}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Commission & Discounts */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Commission & Discounts
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Base Commission Rate</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.baseCommissionRate || ''}
                      onChange={(e) => handleFieldChange('baseCommissionRate', e.target.value)}
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
                      value={formData.commissionDiscountRate || ''}
                      onChange={(e) => handleFieldChange('commissionDiscountRate', e.target.value)}
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
                      value={formData.overallDiscountRate || ''}
                      onChange={(e) => handleFieldChange('overallDiscountRate', e.target.value)}
                      className={`${inputClass} pr-8`}
                      placeholder="15"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Shipping */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Payment & Shipping
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Payment Terms (days)</label>
                  <input
                    type="number"
                    value={formData.paymentTerms ?? ''}
                    onChange={(e) => handleFieldChange('paymentTerms', e.target.value ? parseInt(e.target.value) : undefined)}
                    className={inputClass}
                    placeholder="30"
                    min="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>Lead Time (days)</label>
                  <input
                    type="number"
                    value={formData.leadTime ?? ''}
                    onChange={(e) => handleFieldChange('leadTime', e.target.value ? parseInt(e.target.value) : undefined)}
                    className={inputClass}
                    placeholder="14"
                    min="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>Freight Terms</label>
                  <input
                    type="text"
                    value={formData.freightTerms || ''}
                    onChange={(e) => handleFieldChange('freightTerms', e.target.value)}
                    className={inputClass}
                    placeholder="FOB Origin"
                  />
                </div>
                <div>
                  <label className={labelClass}>External Payment Terms</label>
                  <input
                    type="text"
                    value={formData.externalPaymentTerms || ''}
                    onChange={(e) => handleFieldChange('externalPaymentTerms', e.target.value)}
                    className={inputClass}
                    placeholder="Net 30"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <label className={labelClass}>Additional Information</label>
              <textarea
                value={formData.additionalInformation || ''}
                onChange={(e) => handleFieldChange('additionalInformation', e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-y"
                placeholder="Any additional notes about this manufacturer..."
              />
            </div>
          </div>
        </div>

        {/* ============ ADDRESSES SECTION ============ */}
        <div ref={el => { sectionRefs.current['addresses'] = el; }} id="section-addresses">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Addresses</h2>
            <button
              onClick={() => setShowAddAddressModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
              </svg>
              Add Address
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {addressesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Loading addresses...</span>
                </div>
              </div>
            ) : addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="relative bg-gray-50 rounded-xl p-5 border border-gray-200"
                  >
                    {/* Address Type Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        address.addressType === 'BILLING' ? 'bg-purple-100 text-purple-700' :
                        address.addressType === 'SHIPPING' ? 'bg-blue-100 text-blue-700' :
                        address.addressType === 'MAILING' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {address.addressType}
                      </span>
                      <div className="flex items-center gap-2">
                        {address.isPrimary && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Primary
                          </span>
                        )}
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Edit address"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          disabled={deleteAddressMutation.isPending}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete address"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Address Details */}
                    <div className="space-y-1 text-sm text-gray-700">
                      <p className="font-medium">{address.line1}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p className="text-gray-500">{address.country}</p>
                    </div>

                    {/* Notes */}
                    {address.notes && (
                      <p className="mt-3 text-xs text-gray-500 italic border-t border-gray-200 pt-2">
                        {address.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-500 mb-3">No addresses added yet</p>
                <button
                  onClick={() => setShowAddAddressModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add your first address
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============ SPLIT RATES SECTION ============ */}
        <div ref={el => { sectionRefs.current['split-rates'] = el; }} id="section-split-rates">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <FactorySplitRatesInput
              entries={splitRateEntries}
              onChange={handleSplitRateChange}
              disabled={updateFactory.isPending}
            />
          </div>
        </div>

        {/* ============ CONNECTED ENTITIES SECTION ============ */}
        <div ref={el => { sectionRefs.current['connected-entities'] = el; }} id="section-connected-entities">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Entities</h2>
          <ConnectedEntitiesSection
            entityId={factoryId}
            sourceEntityType="FACTORY"
            enabledCategories={['contacts', 'companies', 'jobs', 'pre-opportunities', 'quotes', 'orders', 'invoices', 'checks', 'tasks', 'notes', 'files']}
            title="Connected Entities"
            showAddLinkButton={true}
          />
        </div>

        {/* ============ CUSTOMER X-REF SECTION ============ */}
        <div ref={el => { sectionRefs.current['customer-xref'] = el; }} id="section-customer-xref">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Cross-References</h2>

          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-sm text-gray-500">
              Customer cross-reference management will be available in a future update.
              <br />Map your customers to this manufacturer's customer codes.
            </p>
          </div>
        </div>

        {/* ============ SHIP-TO X-REF SECTION ============ */}
        <div ref={el => { sectionRefs.current['shipto-xref'] = el; }} id="section-shipto-xref">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ship-To Cross-References</h2>

          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-sm text-gray-500">
              Ship-to cross-reference management will be available in a future update.
              <br />Map shipping addresses to this manufacturer's ship-to codes.
            </p>
          </div>
        </div>

        {/* ============ FREIGHT CATEGORIES SECTION ============ */}
        <div ref={el => { sectionRefs.current['freight'] = el; }} id="section-freight">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Freight Categories</h2>

          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-sm text-gray-500">
              Freight category management will be available in a future update.
              <br />Configure freight classes and categories for this manufacturer.
            </p>
          </div>
        </div>

      </div>

      {/* Address Modal */}
      <GoogleMapsAddressModal
        isOpen={showAddAddressModal}
        onClose={handleCloseAddressModal}
        onSave={handleSaveAddress}
        sourceId={factoryId}
        sourceType="FACTORY"
        mode={editingAddress ? 'edit' : 'create'}
        initialAddress={editingAddress || undefined}
      />
    </main>
  );
}
