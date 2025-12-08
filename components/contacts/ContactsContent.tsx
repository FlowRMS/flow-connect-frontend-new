/**
 * Main Contacts Content Component (Refactored)
 */

'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdvancedFilters from '../AdvancedFilters';
import SortButton from '../SortButton';
import ContactDetailView from './detail/ContactDetailView';
import ListView from './views/ListView';
import GridView from './views/GridView';
import CreateContactModal from './modals/CreateContactModal';
import { useContactsState } from './hooks/useContactsState';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useCRMContact } from '../hooks/useCRMApi';
import { getContactFilterOptions, getContactSortOptions } from './config/filterConfig';
import { CONTACT_TYPES } from './constants';
import { mapAPIContactToUIContact } from './types';
import type { DuplicateGroup } from './types';
import type { Job as APIJob, Company as APICompany } from '../lib/crm-graphql';

export default function ContactsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = useContactsState();

  // Infinite scroll trigger
  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: state.hasNextPage ?? false,
    isFetchingNextPage: state.isFetchingNextPage,
    fetchNextPage: state.fetchNextPage,
  });

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

  // Handle back navigation
  const handleBack = () => {
    isIntentionalClearRef.current = true;
    state.setSelectedContact(null);
    state.setIsEditing(false);
    router.replace('/contacts', { scroll: false });
  };

  // Navigation handlers for related entities
  const handleJobClick = (job: APIJob) => {
    router.push(`/jobs?id=${job.id}`);
  };

  const handleCompanyClick = (company: APICompany) => {
    router.push(`/companies?id=${company.id}`);
  };

  // Generate filter and sort options with current data
  const contactFilterOptions = useMemo(
    () => getContactFilterOptions(state.contacts),
    [state.contacts]
  );

  const contactSortOptions = useMemo(() => getContactSortOptions(), []);

  // Mock duplicate groups (would come from API in the future)
  const duplicateGroups: DuplicateGroup[] = [];

  // Show connection required message
  if (!state.isConnected) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Contacts</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-yellow-800">CRM Not Connected</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please configure your CRM API tokens to view and manage contacts.
              </p>
              <a
                href="/dashboard/apps/flow-crm/auth"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Go to Auth Settings
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 10h10M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show loading state (also check isMounted for hydration safety)
  if (!state.isMounted || state.isLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Contacts</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>Loading contacts from CRM...</span>
          </div>
        </div>
      </main>
    );
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
          state.setEditFormData((prev) => ({ ...prev, [field]: value }))
        }
        setDeleteConfirmId={state.setDeleteConfirmId}
        onJobClick={handleJobClick}
        onCompanyClick={handleCompanyClick}
      />
    );
  }

  // Main List View
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">Contacts</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {CONTACT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => state.setSelectedType(type)}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                state.selectedType === type
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {type}
              {type === 'All' && <span className="ml-1 sm:ml-2 text-xs opacity-75">({state.contacts.length})</span>}
              {type !== 'All' && (
                <span className="ml-1 sm:ml-2 text-xs opacity-75">
                  ({state.contacts.filter(c => c.contactType.includes(type)).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* View Content */}
      {state.viewMode === 'list' ? (
        <ListView contacts={state.filteredContacts} onContactClick={state.setSelectedContact} />
      ) : (
        <GridView contacts={state.filteredContacts} onContactClick={state.setSelectedContact} />
      )}

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-4" />
      {state.isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>Loading more contacts...</span>
          </div>
        </div>
      )}

      {/* Create Contact Modal */}
      <CreateContactModal
        isOpen={state.showCreateModal}
        onClose={() => state.setShowCreateModal(false)}
        onSuccess={() => state.refetch()}
      />
    </main>
  );
}
