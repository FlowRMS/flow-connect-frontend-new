'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useCustomer,
  useUpdateCustomer,
} from '../../../../../components/customers/api/useCustomersApi';
import {
  SplitRatesInput,
  type SplitRateEntry,
} from '../../../../../components/customers/components/SplitRatesInput';

// ============================================================================
// Types
// ============================================================================

type TabId = 'overview' | 'inside-reps' | 'outside-reps' | 'settings';

// Generate unique temp ID
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// Component
// ============================================================================

export default function CustomerEditPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  // API Hooks
  const { data: customer, isLoading, error } = useCustomer(customerId);
  const updateCustomer = useUpdateCustomer();

  // State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [companyName, setCompanyName] = useState('');
  const [isParent, setIsParent] = useState(false);
  const [published, setPublished] = useState(true);
  const [insideRepEntries, setInsideRepEntries] = useState<SplitRateEntry[]>([]);
  const [outsideRepEntries, setOutsideRepEntries] = useState<SplitRateEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Section refs for scroll-to functionality
  const sectionRefs = useRef<Record<TabId, HTMLDivElement | null>>({
    'overview': null,
    'inside-reps': null,
    'outside-reps': null,
    'settings': null,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate totals for validation (each rep type independently totals 100%)
  const insideTotal = useMemo(() =>
    insideRepEntries.reduce((sum, e) => sum + (parseFloat(e.splitRate) || 0), 0),
    [insideRepEntries]
  );

  const outsideTotal = useMemo(() =>
    outsideRepEntries.reduce((sum, e) => sum + (parseFloat(e.splitRate) || 0), 0),
    [outsideRepEntries]
  );

  const hasInsideReps = insideRepEntries.length > 0;
  const hasOutsideReps = outsideRepEntries.length > 0;
  const isInsideValid = !hasInsideReps || Math.abs(insideTotal - 100) < 0.1;
  const isOutsideValid = !hasOutsideReps || Math.abs(outsideTotal - 100) < 0.1;
  const isValidSplitRate = isInsideValid && isOutsideValid;

  // Initialize form data when customer loads
  useEffect(() => {
    if (customer && !initialized) {
      setCompanyName(customer.companyName || '');
      setIsParent(customer.isParent ?? false);
      setPublished(customer.published ?? true);

      // Convert inside reps to entries
      const insideEntries: SplitRateEntry[] = (customer.insideReps || []).map((rep) => ({
        tempId: rep.id || generateTempId(),
        userId: rep.userId || rep.user?.id || '',
        user: rep.user,
        splitRate: rep.splitRate || '',
        position: rep.position || 1,
      }));

      // Convert outside reps to entries
      const outsideEntries: SplitRateEntry[] = (customer.outsideReps || []).map((rep) => ({
        tempId: rep.id || generateTempId(),
        userId: rep.userId || rep.user?.id || '',
        user: rep.user,
        splitRate: rep.splitRate || '',
        position: rep.position || 1,
      }));

      setInsideRepEntries(insideEntries);
      setOutsideRepEntries(outsideEntries);
      setInitialized(true);
      setHasChanges(false);
    }
  }, [customer, initialized]);

  // Scroll spy effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const tabIds: TabId[] = ['overview', 'inside-reps', 'outside-reps', 'settings'];

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      let currentSection: TabId = 'overview';

      for (const tabId of tabIds) {
        const section = sectionRefs.current[tabId];
        if (section) {
          const sectionTop = section.offsetTop;
          if (scrollTop >= sectionTop - 100) {
            currentSection = tabId;
          }
        }
      }
      setActiveTab(currentSection);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  const scrollToSection = useCallback((tabId: TabId) => {
    const section = sectionRefs.current[tabId];
    const container = scrollContainerRef.current;
    if (section && container) {
      const headerOffset = 20;
      const sectionTop = section.offsetTop - headerOffset;
      container.scrollTo({ top: sectionTop, behavior: 'smooth' });
    }
    setActiveTab(tabId);
  }, []);

  const handleFieldChange = () => {
    setHasChanges(true);
  };

  const handleInsideRepChange = (entries: SplitRateEntry[]) => {
    setInsideRepEntries(entries);
    setHasChanges(true);
  };

  const handleOutsideRepChange = (entries: SplitRateEntry[]) => {
    setOutsideRepEntries(entries);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    if (!isValidSplitRate) {
      if (!isInsideValid && !isOutsideValid) {
        toast.error('Both Inside Reps and Outside Reps must each total exactly 100%');
      } else if (!isInsideValid) {
        toast.error('Inside Reps split rate must total exactly 100%');
      } else {
        toast.error('Outside Reps split rate must total exactly 100%');
      }
      return;
    }

    // Convert entries to the format expected by the API
    const insideSplitRate = insideRepEntries.length > 0 ? {
      userId: insideRepEntries[0].userId,
      splitRate: insideRepEntries[0].splitRate,
      position: 1,
      id: insideRepEntries[0].id,
    } : undefined;

    const outsideSplitRate = outsideRepEntries.length > 0 ? {
      userId: outsideRepEntries[0].userId,
      splitRate: outsideRepEntries[0].splitRate,
      position: 1,
      id: outsideRepEntries[0].id,
    } : undefined;

    try {
      await updateCustomer.mutateAsync({
        id: customerId,
        input: {
          companyName: companyName.trim(),
          isParent,
          published,
          insideSplitRates: insideSplitRate,
          outsideSplitRates: outsideSplitRate,
        },
      });
      toast.success('Customer updated successfully');
      setHasChanges(false);
    } catch (err) {
      toast.error('Failed to update customer');
      console.error('Update error:', err);
    }
  };

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview' },
    { id: 'inside-reps' as TabId, label: 'Inside Reps', count: insideRepEntries.length || null },
    { id: 'outside-reps' as TabId, label: 'Outside Reps', count: outsideRepEntries.length || null },
    { id: 'settings' as TabId, label: 'Settings' },
  ];

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  // ============================================================================
  // Loading / Error States
  // ============================================================================

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading customer...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
          <p className="text-gray-500 mb-4">The customer you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <button
            onClick={() => router.push('/customers')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Customers
          </button>
        </div>
      </main>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <main className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/customers')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {companyName || 'Untitled Customer'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isParent ? 'Parent Customer' : 'Customer'} Profile
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Badges */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              published
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {published ? 'Published' : 'Draft'}
            </span>
            {isParent && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Parent
              </span>
            )}
            {hasChanges && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                Unsaved Changes
              </span>
            )}

            <button
              onClick={() => router.push('/customers')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateCustomer.isPending || !hasChanges || !isValidSplitRate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {updateCustomer.isPending ? (
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

          {/* Status Toggles */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Published Toggle */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Published</span>
                  <div className="relative group">
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50">
                      Published customers are visible and active in the system.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPublished(!published);
                    handleFieldChange();
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    published ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    published ? 'translate-x-6' : 'translate-x-1'
                  }`}/>
                </button>
              </div>

              {/* Parent Customer Toggle */}
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Parent Customer</span>
                  <div className="relative group">
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50">
                      Mark as a parent customer that can have child customer accounts.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsParent(!isParent);
                    handleFieldChange();
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isParent ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isParent ? 'translate-x-6' : 'translate-x-1'
                  }`}/>
                </button>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Customer Details
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelClass}>
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    handleFieldChange();
                  }}
                  className={inputClass}
                  placeholder="Enter company name"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============ INSIDE REPS SECTION ============ */}
        <div ref={el => { sectionRefs.current['inside-reps'] = el; }} id="section-inside-reps">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Inside Representatives
            </h2>
            {hasInsideReps && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                isInsideValid
                  ? 'bg-green-100 text-green-700'
                  : insideTotal > 100
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isInsideValid ? "M5 13l4 4L19 7" : "M12 9v2m0 4h.01"} />
                </svg>
                Total: {insideTotal.toFixed(1)}%
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-blue-900 font-medium">Commission Split Rules</p>
                <p className="text-sm text-blue-700 mt-1">
                  Inside representatives handle internal sales operations. Split rates must total 100%.
                </p>
              </div>
            </div>

            <SplitRatesInput
              repType="INSIDE"
              entries={insideRepEntries}
              onChange={handleInsideRepChange}
              disabled={updateCustomer.isPending}
            />
          </div>
        </div>

        {/* ============ OUTSIDE REPS SECTION ============ */}
        <div ref={el => { sectionRefs.current['outside-reps'] = el; }} id="section-outside-reps">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              Outside Representatives
            </h2>
            {hasOutsideReps && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                isOutsideValid
                  ? 'bg-green-100 text-green-700'
                  : outsideTotal > 100
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOutsideValid ? "M5 13l4 4L19 7" : "M12 9v2m0 4h.01"} />
                </svg>
                Total: {outsideTotal.toFixed(1)}%
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
              <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-purple-900 font-medium">Commission Split Rules</p>
                <p className="text-sm text-purple-700 mt-1">
                  Outside representatives handle field sales and client relationships. Split rates must total 100%.
                </p>
              </div>
            </div>

            <SplitRatesInput
              repType="OUTSIDE"
              entries={outsideRepEntries}
              onChange={handleOutsideRepChange}
              disabled={updateCustomer.isPending}
            />
          </div>
        </div>

        {/* ============ SETTINGS SECTION ============ */}
        <div ref={el => { sectionRefs.current['settings'] = el; }} id="section-settings">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              {/* Additional settings info */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-900 font-medium">Customer Settings</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure published status and parent customer designation using the toggles in the Overview section above.
                  </p>
                </div>
              </div>

              {/* Customer ID info */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer ID</label>
                  <p className="text-xs text-gray-500 mt-0.5">Unique identifier for this customer</p>
                </div>
                <code className="px-3 py-1.5 bg-gray-200 rounded-lg text-xs font-mono text-gray-700">
                  {customerId}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Required Fields Note */}
        <div className="flex items-center justify-center pt-4 pb-8">
          <div className="text-sm text-gray-500">
            <span className="text-red-500">*</span> Required fields
          </div>
        </div>
      </div>
    </main>
  );
}
