'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useFlowChat } from '@/contexts/FlowChatContext';
import {
  useCustomer,
  useUpdateCustomer,
  useCustomerChildren,
  useCustomerBuyingGroupMembers,
  type CustomerLiteResponse,
  type CustomerSearchResult,
} from '../../../../../components/customers/api/useCustomersApi';
import { useCRMCustomerSearch } from '../../../../../components/hooks/useCRMApi';
import {
  SplitRatesInput,
  type SplitRateEntry,
} from '../../../../../components/customers/components/SplitRatesInput';
import {
  GoogleMapsAddressModal,
  type Address,
} from '../../../../../components/shared/google-maps-address';
import {
  useAddressesBySource,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '../../../../../components/hooks/useAddressApi';
import { ConnectedEntitiesSection } from '../../../../../components/shared/ConnectedEntitiesSection';
import { EntityAliasesSection } from '../../../../../components/shared/EntityAliasesSection';
import { useUnsavedChangesGuard } from '../../../../../components/shared/hooks/useUnsavedChangesGuard';
import { useUnsavedChangesContext } from '../../../../../contexts/UnsavedChangesContext';

// ============================================================================
// Types
// ============================================================================

type TabId = 'overview' | 'addresses' | 'aliases' | 'connected-entities' | 'child-customers' | 'buying-group-members' | 'inside-reps' | 'outside-reps' | 'settings';

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
  const { setFullEntityContext } = useFlowChat();

  // Set full entity context for global chatbot (type, id, and customer name)
  useEffect(() => {
    if (customer?.companyName && customerId) {
      setFullEntityContext('customer', customerId, customer.companyName);
    }
    return () => {
      setFullEntityContext(null, null, null);
    };
  }, [customer?.companyName, customerId, setFullEntityContext]);

  // State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [companyName, setCompanyName] = useState('');
  const [isParent, setIsParent] = useState(false);
  const [published, setPublished] = useState(true);
  const [insideRepEntries, setInsideRepEntries] = useState<SplitRateEntry[]>([]);
  const [outsideRepEntries, setOutsideRepEntries] = useState<SplitRateEntry[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Parent Customer / Buying Group selection state
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentName, setParentName] = useState('');
  const [buyingGroupId, setBuyingGroupId] = useState<string | null>(null);
  const [buyingGroupName, setBuyingGroupName] = useState('');

  // Customer search state for parent/buying group selection
  const [parentSearch, setParentSearch] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [parentSearchEnabled, setParentSearchEnabled] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const [buyingGroupSearch, setBuyingGroupSearch] = useState('');
  const [showBuyingGroupDropdown, setShowBuyingGroupDropdown] = useState(false);
  const [buyingGroupSearchEnabled, setBuyingGroupSearchEnabled] = useState(false);
  const buyingGroupRef = useRef<HTMLDivElement>(null);

  // Customer search hooks using React Query
  const { data: parentSearchResults = [], isLoading: isSearchingParent } = useCRMCustomerSearch(
    parentSearch,
    true, // published only
    parentSearchEnabled
  );
  const { data: buyingGroupSearchResultsRaw = [], isLoading: isSearchingBuyingGroup } = useCRMCustomerSearch(
    buyingGroupSearch,
    true, // published only
    buyingGroupSearchEnabled
  );

  // Filter parent search results - show only parent customers (isParent=true), exclude current customer
  const filteredParentResults = useMemo(() =>
    parentSearchResults.filter(c => c.id !== customerId && c.isParent === true),
    [parentSearchResults, customerId]
  );

  // Filter buying group results - show only buying groups (isParent=true and no parentId/buyingGroupId), exclude current customer
  const filteredBuyingGroupResults = useMemo(() =>
    buyingGroupSearchResultsRaw.filter(c =>
      c.id !== customerId &&
      c.isParent === true &&
      !c.parentId &&
      !c.buyingGroupId
    ),
    [buyingGroupSearchResultsRaw, customerId]
  );

  // Address hooks
  const { data: addresses = [], isLoading: addressesLoading } = useAddressesBySource(customerId, 'CUSTOMER');
  const createAddress = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Hierarchy hooks - fetch child customers if this is a parent, or buying group members if this is a buying group
  // A buying group is determined by having no parentId and no buyingGroupId (it's at the top of the hierarchy)
  const isBuyingGroup = customer ? (customer.isParent && !customer.parentId && !customer.buyingGroupId) : false;
  const { data: childCustomers = [], isLoading: childCustomersLoading } = useCustomerChildren(
    customer?.isParent ? customerId : undefined
  );
  const { data: buyingGroupMembers = [], isLoading: buyingGroupMembersLoading } = useCustomerBuyingGroupMembers(
    isBuyingGroup ? customerId : undefined
  );

  // Fetch parent customer details to get the name (when parentId exists)
  const { data: parentCustomer } = useCustomer(customer?.parentId || undefined);
  // Fetch buying group details to get the name (when buyingGroupId exists)
  const { data: buyingGroupCustomer } = useCustomer(customer?.buyingGroupId || undefined);

  // Section refs for scroll-to functionality
  const sectionRefs = useRef<Record<TabId, HTMLDivElement | null>>({
    'overview': null,
    'addresses': null,
    'aliases': null,
    'connected-entities': null,
    'child-customers': null,
    'buying-group-members': null,
    'inside-reps': null,
    'outside-reps': null,
    'settings': null,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Flag to disable scroll spy during programmatic scrolling
  const isScrollingRef = useRef(false);

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

      // Initialize parent customer and buying group IDs
      setParentId(customer.parentId || null);
      setBuyingGroupId(customer.buyingGroupId || null);

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

  // Set parent customer name when fetched
  useEffect(() => {
    if (parentCustomer && parentCustomer.companyName) {
      setParentName(parentCustomer.companyName);
    }
  }, [parentCustomer]);

  // Set buying group name when fetched
  useEffect(() => {
    if (buyingGroupCustomer && buyingGroupCustomer.companyName) {
      setBuyingGroupName(buyingGroupCustomer.companyName);
    }
  }, [buyingGroupCustomer]);

  // Scroll spy effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const tabIds: TabId[] = ['overview', 'addresses', 'aliases', 'child-customers', 'buying-group-members', 'inside-reps', 'outside-reps', 'settings', 'connected-entities'];

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

  // Parent Customer search handler
  const handleParentSearch = useCallback((term: string) => {
    setParentSearch(term);
    setParentSearchEnabled(true);
  }, []);

  // Buying Group search handler
  const handleBuyingGroupSearch = useCallback((term: string) => {
    setBuyingGroupSearch(term);
    setBuyingGroupSearchEnabled(true);
  }, []);

  // Handle parent customer selection
  const handleSelectParent = (customer: CustomerSearchResult) => {
    setParentId(customer.id);
    setParentName(customer.companyName);
    setShowParentDropdown(false);
    setParentSearch('');
    setParentSearchEnabled(false);
    handleFieldChange();
  };

  // Handle clear parent customer
  const handleClearParent = () => {
    setParentId(null);
    setParentName('');
    setParentSearch('');
    setParentSearchEnabled(false);
    handleFieldChange();
  };

  // Handle buying group selection
  const handleSelectBuyingGroup = (customer: CustomerSearchResult) => {
    setBuyingGroupId(customer.id);
    setBuyingGroupName(customer.companyName);
    setShowBuyingGroupDropdown(false);
    setBuyingGroupSearch('');
    setBuyingGroupSearchEnabled(false);
    handleFieldChange();
  };

  // Handle clear buying group
  const handleClearBuyingGroup = () => {
    setBuyingGroupId(null);
    setBuyingGroupName('');
    setBuyingGroupSearch('');
    setBuyingGroupSearchEnabled(false);
    handleFieldChange();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (parentRef.current && !parentRef.current.contains(event.target as Node)) {
        setShowParentDropdown(false);
        setParentSearchEnabled(false);
      }
      if (buyingGroupRef.current && !buyingGroupRef.current.contains(event.target as Node)) {
        setShowBuyingGroupDropdown(false);
        setBuyingGroupSearchEnabled(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async (): Promise<boolean> => {
    if (!companyName.trim()) {
      toast.error('Company name is required');
      return false;
    }

    if (!isValidSplitRate) {
      if (!isInsideValid && !isOutsideValid) {
        toast.error('Both Inside Reps and Outside Reps must each total exactly 100%');
      } else if (!isInsideValid) {
        toast.error('Inside Reps split rate must total exactly 100%');
      } else {
        toast.error('Outside Reps split rate must total exactly 100%');
      }
      return false;
    }

    // Convert entries to the format expected by the API
    // The API expects insideSplitRates and outsideSplitRates as arrays
    const insideSplitRates = insideRepEntries
      .filter(entry => entry.userId && entry.splitRate)
      .map((entry, index) => ({
        userId: entry.userId,
        splitRate: entry.splitRate,
        position: index + 1,
        ...(entry.id && !entry.id.startsWith('temp_') ? { id: entry.id } : {}),
      }));

    const outsideSplitRates = outsideRepEntries
      .filter(entry => entry.userId && entry.splitRate)
      .map((entry, index) => ({
        userId: entry.userId,
        splitRate: entry.splitRate,
        position: index + 1,
        ...(entry.id && !entry.id.startsWith('temp_') ? { id: entry.id } : {}),
      }));

    try {
      await updateCustomer.mutateAsync({
        id: customerId,
        input: {
          companyName: companyName.trim(),
          isParent,
          published,
          parentId: parentId || undefined,
          buyingGroupId: buyingGroupId || undefined,
          insideSplitRates: insideSplitRates.length > 0 ? insideSplitRates : undefined,
          outsideSplitRates: outsideSplitRates.length > 0 ? outsideSplitRates : undefined,
        },
      });
      toast.success('Customer updated successfully');
      setHasChanges(false);
      return true;
    } catch (err) {
      toast.error('Failed to update customer');
      console.error('Update error:', err);
      return false;
    }
  };

  // Unsaved changes guard - tracks customer editing and blocks navigation
  useUnsavedChangesGuard({
    entityType: 'Customer',
    entityId: customerId,
    entityName: customer?.companyName || null,
    hasChanges,
    onSave: handleSave,
  });

  // Get unsaved changes context for back button navigation check
  const { requestNavigation, hasUnsavedChanges } = useUnsavedChangesContext();

  // Handle back navigation with unsaved changes check
  const handleBack = () => {
    if (hasUnsavedChanges) {
      const canNavigate = requestNavigation('/customers', 'back');
      if (!canNavigate) {
        return; // Navigation blocked, modal will be shown
      }
    }
    router.push('/customers');
  };

  // Handle address save (create or update)
  const handleAddressSave = async (addressData: Omit<Address, 'id' | 'createdAt'>) => {
    try {
      if (editingAddress) {
        // Update existing address
        await updateAddressMutation.mutateAsync({
          id: editingAddress.id,
          input: {
            sourceId: customerId,
            sourceType: 'CUSTOMER',
            addressTypes: addressData.addressTypes || [addressData.addressType],
            line1: addressData.line1,
            line2: addressData.line2,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            country: addressData.country,
            notes: addressData.notes,
            isPrimary: addressData.isPrimary,
          },
        });
        toast.success('Address updated successfully');
        setEditingAddress(null);
      } else {
        // Create new address
        await createAddress.mutateAsync({
          sourceId: customerId,
          sourceType: 'CUSTOMER',
          addressTypes: addressData.addressTypes || [addressData.addressType],
          line1: addressData.line1,
          line2: addressData.line2,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode,
          country: addressData.country,
          notes: addressData.notes,
          isPrimary: addressData.isPrimary,
        });
        toast.success('Address added successfully');
      }
    } catch (err) {
      toast.error(editingAddress ? 'Failed to update address' : 'Failed to add address');
      throw err;
    }
  };

  // Handle edit address click
  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  // Handle modal close
  const handleAddressModalClose = () => {
    setIsAddressModalOpen(false);
    setEditingAddress(null);
  };

  // Handle address delete
  const handleAddressDelete = async (address: Address) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await deleteAddress.mutateAsync({
        id: address.id,
        sourceId: customerId,
        sourceType: 'CUSTOMER',
      });
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview' },
    { id: 'addresses' as TabId, label: 'Addresses', count: addresses.length || null },
    { id: 'aliases' as TabId, label: 'Aliases' },
    // Show Child Customers tab only for parent customers
    ...(isParent ? [{ id: 'child-customers' as TabId, label: 'Child Customers', count: childCustomers.length || null }] : []),
    // Show Buying Group Members tab only for buying groups (parent customers at the top of hierarchy)
    ...(isBuyingGroup ? [{ id: 'buying-group-members' as TabId, label: 'Parent Customers', count: buyingGroupMembers.length || null }] : []),
    { id: 'inside-reps' as TabId, label: 'Inside Reps', count: insideRepEntries.length || null },
    { id: 'outside-reps' as TabId, label: 'Outside Reps', count: outsideRepEntries.length || null },
    { id: 'settings' as TabId, label: 'Settings' },
    { id: 'connected-entities' as TabId, label: 'Connected Entities' },
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
              onClick={handleBack}
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
                  {isBuyingGroup ? 'Buying Group' : isParent ? 'Parent Customer' : 'Customer'} Profile
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
            {isBuyingGroup && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                Buying Group
              </span>
            )}
            {isParent && !isBuyingGroup && (
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

              {/* Parent Customer Selector - only show for non-parent customers */}
              {!isParent && (
                <div ref={parentRef} className="relative">
                  <label className={labelClass}>
                    Parent Customer
                    {parentId && (
                      <span className="ml-2 text-green-600 font-normal text-xs">
                        Selected: {parentName || parentId.slice(0, 8) + '...'}
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={parentId ? (parentName || parentId.slice(0, 8) + '...') : parentSearch}
                      onChange={(e) => {
                        if (!parentId) {
                          handleParentSearch(e.target.value);
                          setShowParentDropdown(true);
                        }
                      }}
                      onFocus={() => {
                        if (!parentId) {
                          handleParentSearch('');
                          setShowParentDropdown(true);
                        }
                      }}
                      placeholder="Search for a parent customer..."
                      readOnly={!!parentId}
                      className={`flex-1 ${inputClass} ${parentId ? 'bg-green-50 border-green-300' : ''}`}
                    />
                    {isSearchingParent && !parentId && (
                      <div className="flex items-center px-3">
                        <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                      </div>
                    )}
                    {parentId && (
                      <button
                        type="button"
                        onClick={handleClearParent}
                        className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Assign this customer as a child of a parent customer.
                  </p>

                  {showParentDropdown && !parentId && (
                    <>
                      {isSearchingParent ? (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                          Searching...
                        </div>
                      ) : filteredParentResults.length > 0 ? (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredParentResults.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleSelectParent(customer)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{customer.companyName}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                  Parent Customer
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : parentSearchEnabled ? (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                          {parentSearch ? `No parent customers found for "${parentSearch}"` : 'No parent customers available'}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              )}

              {/* Buying Group Selector - only show for parent customers */}
              {isParent && (
                <div ref={buyingGroupRef} className="relative">
                  <label className={labelClass}>
                    Buying Group
                    {buyingGroupId && (
                      <span className="ml-2 text-green-600 font-normal text-xs">
                        Selected: {buyingGroupName || buyingGroupId.slice(0, 8) + '...'}
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={buyingGroupId ? (buyingGroupName || buyingGroupId.slice(0, 8) + '...') : buyingGroupSearch}
                      onChange={(e) => {
                        if (!buyingGroupId) {
                          handleBuyingGroupSearch(e.target.value);
                          setShowBuyingGroupDropdown(true);
                        }
                      }}
                      onFocus={() => {
                        if (!buyingGroupId) {
                          handleBuyingGroupSearch('');
                          setShowBuyingGroupDropdown(true);
                        }
                      }}
                      placeholder="Search for a buying group..."
                      readOnly={!!buyingGroupId}
                      className={`flex-1 ${inputClass} ${buyingGroupId ? 'bg-green-50 border-green-300' : ''}`}
                    />
                    {isSearchingBuyingGroup && !buyingGroupId && (
                      <div className="flex items-center px-3">
                        <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                      </div>
                    )}
                    {buyingGroupId && (
                      <button
                        type="button"
                        onClick={handleClearBuyingGroup}
                        className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Assign this parent customer to a buying group.
                  </p>

                  {showBuyingGroupDropdown && !buyingGroupId && (
                    <>
                      {isSearchingBuyingGroup ? (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                          Searching...
                        </div>
                      ) : filteredBuyingGroupResults.length > 0 ? (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredBuyingGroupResults.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleSelectBuyingGroup(customer)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{customer.companyName}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                  Buying Group
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : buyingGroupSearchEnabled ? (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                          {buyingGroupSearch ? `No buying groups found for "${buyingGroupSearch}"` : 'No buying groups available'}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============ ADDRESSES SECTION ============ */}
        <div ref={el => { sectionRefs.current['addresses'] = el; }} id="section-addresses">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Addresses
            </h2>
            <button
              onClick={() => setIsAddressModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Address
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {addressesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Add billing, shipping, or mailing addresses for this customer using Google Maps search.
                </p>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add First Address
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="relative flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors group"
                  >
                    {/* Address Type Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      address.addressType === 'BILLING' ? 'bg-blue-100' :
                      address.addressType === 'SHIPPING' ? 'bg-green-100' :
                      address.addressType === 'MAILING' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {address.addressType === 'BILLING' && (
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      )}
                      {address.addressType === 'SHIPPING' && (
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12l-4 9H8l-4-9h4m0 0V4m0 3v10m4-10v10m-4 0h4" />
                        </svg>
                      )}
                      {address.addressType === 'MAILING' && (
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {address.addressType === 'OTHER' && (
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>

                    {/* Address Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          address.addressType === 'BILLING' ? 'bg-blue-100 text-blue-700' :
                          address.addressType === 'SHIPPING' ? 'bg-green-100 text-green-700' :
                          address.addressType === 'MAILING' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {address.addressType.charAt(0) + address.addressType.slice(1).toLowerCase()}
                        </span>
                        {address.isPrimary && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{address.line1}</p>
                      {address.line2 && <p className="text-sm text-gray-600">{address.line2}</p>}
                      <p className="text-sm text-gray-600">
                        {[address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-sm text-gray-500">{address.country}</p>
                      {address.notes && (
                        <p className="text-xs text-gray-400 mt-1 italic">{address.notes}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit address"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={() => handleAddressDelete(address)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete address"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============ ALIASES SECTION ============ */}
        <div ref={el => { sectionRefs.current['aliases'] = el; }} id="section-aliases">
          <EntityAliasesSection
            entityId={customerId}
            entityType="CUSTOMER"
            entityName={companyName || 'Untitled Customer'}
            title="Customer Aliases"
            subTypes={['END_USER', 'SOLD_TO', 'BILL_TO']}
            infoText="Add alternative company names that should match to this customer during commission statement processing. Different alias types are used for matching different fields in commission statements."
          />
        </div>

        {/* ============ CHILD CUSTOMERS SECTION (only for parent customers) ============ */}
        {isParent && (
          <div ref={el => { sectionRefs.current['child-customers'] = el; }} id="section-child-customers">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Child Customers
              </h2>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {childCustomersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                </div>
              ) : childCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No child customers yet</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Child customers can be assigned to this parent customer by editing the child customer and selecting this customer as their parent.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {childCustomers.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-amber-300 transition-colors cursor-pointer"
                      onClick={() => router.push(`/customers/${child.id}/edit`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-amber-600">
                            {child.companyName?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{child.companyName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              child.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {child.published ? 'Published' : 'Draft'}
                            </span>
                            {child.isParent && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                Parent
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ BUYING GROUP MEMBERS SECTION (only for buying groups) ============ */}
        {isBuyingGroup && (
          <div ref={el => { sectionRefs.current['buying-group-members'] = el; }} id="section-buying-group-members">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Parent Customers in Buying Group
              </h2>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-3 mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-indigo-900 font-medium">Buying Group Hierarchy</p>
                  <p className="text-sm text-indigo-700 mt-1">
                    This is a buying group. Parent customers below can be associated with this buying group, and each parent customer can have their own child customers.
                  </p>
                </div>
              </div>

              {buyingGroupMembersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : buyingGroupMembers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No parent customers in this buying group</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Parent customers can be added to this buying group by editing the parent customer and selecting this customer as their buying group.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {buyingGroupMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer"
                      onClick={() => router.push(`/customers/${member.id}/edit`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-indigo-600">
                            {member.companyName?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.companyName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              member.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {member.published ? 'Published' : 'Draft'}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              Parent Customer
                            </span>
                          </div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ INSIDE REPS SECTION ============ */}
        <div ref={el => { sectionRefs.current['inside-reps'] = el; }} id="section-inside-reps">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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

        {/* ============ CONNECTED ENTITIES SECTION ============ */}
        <div ref={el => { sectionRefs.current['connected-entities'] = el; }} id="section-connected-entities">
          <ConnectedEntitiesSection
            entityId={customerId}
            sourceEntityType="CUSTOMER"
            title="Connected Entities"
            showAddLinkButton={true}
            enabledCategories={['contacts', 'companies', 'jobs', 'pre-opportunities', 'tasks', 'notes', 'quotes', 'orders', 'invoices', 'checks', 'files']}
            readOnlyCategories={['quotes', 'orders', 'invoices', 'checks']}
          />
        </div>

        {/* Required Fields Note */}
        <div className="flex items-center justify-center pt-4 pb-8">
          <div className="text-sm text-gray-500">
            <span className="text-red-500">*</span> Required fields
          </div>
        </div>
      </div>

      {/* Google Maps Address Modal */}
      <GoogleMapsAddressModal
        isOpen={isAddressModalOpen}
        onClose={handleAddressModalClose}
        onSave={handleAddressSave}
        sourceId={customerId}
        sourceType="CUSTOMER"
        defaultAddressType={editingAddress?.addressType || "BILLING"}
        initialAddress={editingAddress || undefined}
        mode={editingAddress ? 'edit' : 'create'}
      />
    </main>
  );
}
