/**
 * Main Contacts Content Component (Refactored)
 */

'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';
import { useFlowChat } from '@/contexts/FlowChatContext';
import AdvancedFilters from '../advancedFilters/AdvancedFilters';
import SortButton from '../SortButton';
import ContactDetailView from './detail/ContactDetailView';
import ListView from './views/ListView';
import GridView from './views/GridView';
import CreateContactModal from './modals/CreateContactModal';
import { useContactsState } from './hooks/useContactsState';
import { useCRMContact } from '../hooks/useCRMApi';
import { getContactFilterOptions, getContactSortOptions } from './config/filterConfig';
import { CONTACT_TYPES } from './constants';
import { mapAPIContactToUIContact } from './types';
import type { DuplicateGroup } from './types';
import type { RelatedEntityCompany, RelatedEntityJob } from '../lib/crm-graphql';
import { useUnsavedChangesGuard } from '../shared/hooks/useUnsavedChangesGuard';
import { useUnsavedChangesContext } from '@/contexts/UnsavedChangesContext';

export default function ContactsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = useContactsState();
  const { setFullEntityContext } = useFlowChat();
  const { requestNavigation } = useUnsavedChangesContext();

  // Navigation morph hooks
  const { registerHeaderTarget, floatingIcon } = useNavigationMorph();
  const headerIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerIconRef.current) {
      registerHeaderTarget(headerIconRef.current);
    }
    return () => {
      registerHeaderTarget(null);
    };
  }, [registerHeaderTarget]);

  const isReceivingAnimation = floatingIcon?.itemId === 'contacts';

  // Set full entity context for global chatbot (type, id, and contact name)
  useEffect(() => {
    if (state.selectedContact?.name && state.selectedContact?.id) {
      setFullEntityContext('contact', state.selectedContact.id, state.selectedContact.name);
    } else {
      setFullEntityContext(null, null, null);
    }
    return () => {
      setFullEntityContext(null, null, null);
    };
  }, [state.selectedContact?.name, state.selectedContact?.id, setFullEntityContext]);


  // Get contact ID from URL - this is the source of truth for navigation
  const contactIdFromUrl = searchParams.get('id');

  // Track intentional clear to prevent re-selecting after back navigation
  const isIntentionalClearRef = useRef(false);

  // Fetch full contact details when navigating via URL
  // This fetches directly by ID, regardless of whether contact is in local paginated data
  const targetContactId = (!isIntentionalClearRef.current && contactIdFromUrl) ? contactIdFromUrl : (state.selectedContact?.id || '');
  const { data: fullContactData, isLoading: contactDetailLoading } = useCRMContact(targetContactId);

  // When we get contact data from API (navigating via URL), set it as selected
  useEffect(() => {
    if (fullContactData && contactIdFromUrl && !isIntentionalClearRef.current) {
      const mappedContact = mapAPIContactToUIContact(fullContactData);
      // Only update if the selected contact is different or not set
      if (!state.selectedContact || state.selectedContact.id !== mappedContact.id) {
        state.setSelectedContact(mappedContact);
      }
    }
  }, [fullContactData, contactIdFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset the intentional clear flag when URL has no ID
  useEffect(() => {
    if (!contactIdFromUrl) {
      isIntentionalClearRef.current = false;
    }
  }, [contactIdFromUrl]);

  // Update URL when a contact is selected (not when cleared - that's handled by handleBack)
  useEffect(() => {
    if (!state.isMounted) return;
    if (state.selectedContact?.id) {
      const currentId = searchParams.get('id');
      if (currentId !== state.selectedContact.id) {
        router.replace(`/contacts?id=${state.selectedContact.id}`, { scroll: false });
      }
    }
  }, [state.selectedContact?.id, state.isMounted, router, searchParams]);

  // Clear editing state when contact is deselected (e.g., after discarding changes and navigating back)
  useEffect(() => {
    if (!state.selectedContact) {
      state.setIsEditing(false);
      state.setHasLocalEdits(false);
    }
  }, [state.selectedContact, state.setIsEditing, state.setHasLocalEdits]);

  // Handle back navigation
  const handleBack = () => {
    // Check for unsaved changes before allowing navigation
    if (state.hasLocalEdits) {
      const canNavigate = requestNavigation('/contacts', 'back');
      if (!canNavigate) {
        return; // Navigation blocked, modal will be shown
      }
    }
    isIntentionalClearRef.current = true;
    state.setSelectedContact(null);
    state.setIsEditing(false);
    state.setHasLocalEdits(false);
    router.replace('/contacts', { scroll: false });
  };

  // Navigation handlers for related entities
  const handleJobClick = (job: RelatedEntityJob) => {
    router.push(`/jobs?id=${job.id}`);
  };

  const handleCompanyClick = (company: RelatedEntityCompany) => {
    router.push(`/companies?id=${company.id}`);
  };

  // Generate filter and sort options (static, no dependencies on data)
  const contactFilterOptions = useMemo(() => getContactFilterOptions(), []);
  const contactSortOptions = useMemo(() => getContactSortOptions(), []);

  // Mock duplicate groups (would come from API in the future)
  const duplicateGroups: DuplicateGroup[] = [];

  // Unsaved changes guard - tracks contact editing and blocks navigation
  useUnsavedChangesGuard({
    entityType: 'Contact',
    entityId: state.selectedContact?.id || null,
    entityName: state.selectedContact?.name || null,
    hasChanges: state.hasLocalEdits,
    onSave: async () => {
      await state.handleSaveEdit();
      return true;
    },
  });

  // Don't show loading state - let skeleton show in table instead
  // Only check isMounted for hydration safety
  if (!state.isMounted) {
    return null;
  }

  // Show error state
  if (state.error) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Contacts</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800">Failed to Load Contacts</h3>
              <p className="text-sm text-red-700 mt-1">{state.error.message}</p>
              <button
                onClick={() => state.refetch()}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4v5h5M16 16v-5h-5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.05 11A7 7 0 0114.95 9M14.95 9L16 4M5.05 11L4 16" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Retry
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show loading state while fetching contact details from URL navigation
  if (contactIdFromUrl && contactDetailLoading && !state.selectedContact) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M5 10l4-4M5 10l4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Contacts
          </button>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Loading Contact Details...</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>Fetching contact details...</span>
          </div>
        </div>
      </main>
    );
  }

  // Wrap delete handler to navigate back after successful deletion
  const handleDeleteWithNavigation = async (id: string) => {
    await state.handleDeleteContact(id);
    // Navigate back to contacts list after deletion
    router.replace('/contacts', { scroll: false });
  };

  // Contact Detail View
  if (state.selectedContact) {
    return (
      <ContactDetailView
        contact={state.selectedContact}
        isEditing={state.isEditing}
        isSaving={state.updateContactMutation.isPending}
        isDeleting={state.deleteContactMutation.isPending}
        editFormData={state.editFormData}
        deleteConfirmId={state.deleteConfirmId}
        onBack={handleBack}
        onEdit={state.handleStartEdit}
        onSave={state.handleSaveEdit}
        onCancel={state.handleCancelEdit}
        onDelete={handleDeleteWithNavigation}
        onFieldChange={(field, value) =>
          state.handleEditFormChange((prev) => ({ ...prev, [field]: value }))
        }
        setDeleteConfirmId={state.setDeleteConfirmId}
        onJobClick={handleJobClick}
        onCompanyClick={handleCompanyClick}
      />
    );
  }

  // Main List View
  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4">
          <div className="flex items-start gap-4">
            {/* Morphing Icon Target - Contact Ripple Animation */}
            <HeaderIconAnimation
              isReceivingAnimation={isReceivingAnimation}
              animationStyle="contact-ripple"
              headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            >
              {iconMap['contacts']}
            </HeaderIconAnimation>
            <div className="overflow-hidden">
              <motion.h1
                className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
              >
                Contacts
              </motion.h1>
              <motion.p
                className="text-sm text-[var(--muted-foreground)] mt-1"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
              >
                Showing {state.filteredContacts.length} of {state.totalCount} contacts
              </motion.p>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
          >
            {/* Dedupe Button - hidden on mobile, visible on tablet+ */}
            <button
              onClick={() => state.setShowDedupeModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-purple-700 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                <path d="M12 2v20M2 12h20"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span className="hidden md:inline">Find Duplicates</span>
              <span className="md:hidden">Dedupe</span>
              ({duplicateGroups.length})
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => state.setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded ${state.viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Grid View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => state.setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded ${state.viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="List View"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-[18px] sm:h-[18px]">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>

            <SortButton
              sortOptions={contactSortOptions}
              onMultiSortChange={state.handleMultiSortChange}
              activeSorts={state.clientSortColumns}
            />

            <AdvancedFilters
              filterOptions={contactFilterOptions}
              onFiltersChange={state.handleFiltersChange}
              activeFilters={state.activeFilters}
            />
            <button
              onClick={() => state.setShowCreateModal(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              <span className="hidden sm:inline">Add Contact</span>
              <span className="sm:hidden">Add</span>
            </button>
          </motion.div>
        </div>

        {/* Quick Filters */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--muted-foreground)] leading-none">Quick filters:</span>
          <div className="flex gap-1 sm:gap-2 overflow-x-auto -mx-1 px-1 items-center">
            {CONTACT_TYPES.map((type) => {
              // Determine if this role filter is active
              const roleFilter = state.activeFilters.find(f => f.columnName === 'role');
              let isActive = false;
              
              if (type === 'All') {
                // "All" is active if there's no role filter in activeFilters
                isActive = !roleFilter;
              } else {
                // Check if this specific role is in the active filters
                if (roleFilter?.operator === 'IN' && roleFilter.values) {
                  isActive = roleFilter.values.includes(type);
                } else if (roleFilter?.operator === 'EQ' && roleFilter.value) {
                  isActive = roleFilter.value === type;
                }
              }

              const handleQuickFilterClick = () => {
                // Remove any existing role filters
                const otherFilters = state.activeFilters.filter(f => f.columnName !== 'role');
                
                if (type === 'All') {
                  // Clear role filter
                  state.handleFiltersChange(otherFilters);
                } else {
                  // Add role filter with IN operator
                  state.handleFiltersChange([
                    ...otherFilters,
                    {
                      columnName: 'role',
                      operator: 'IN',
                      values: [type],
                    },
                  ]);
                }
              };

              return (
                <button
                  key={type}
                  onClick={handleQuickFilterClick}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden p-6 pt-4">
        {state.viewMode === 'list' ? (
          <ListView 
            contacts={state.filteredContacts} 
            onContactClick={state.setSelectedContact}
            hasNextPage={state.hasNextPage}
            isFetchingNextPage={state.isFetchingNextPage}
            fetchNextPage={state.fetchNextPage}
            isLoading={state.isLoading}
            hasFilters={state.activeFilters.length > 0}
            onColumnFiltersChange={state.handleColumnFiltersChange}
            filterOptions={contactFilterOptions}
            columnFilters={state.columnFilters}
          />
        ) : (
          <GridView contacts={state.filteredContacts} onContactClick={state.setSelectedContact} />
        )}
      </div>

      {/* Create Contact Modal */}
      <CreateContactModal
        isOpen={state.showCreateModal}
        onClose={() => state.setShowCreateModal(false)}
        onSuccess={() => state.refetch()}
      />
    </main>
  );
}
