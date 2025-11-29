/**
 * Main Contacts Content Component (Refactored)
 */

'use client';

import React, { useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdvancedFilters from '../AdvancedFilters';
import SortButton from '../SortButton';
import ContactDetailView from './detail/ContactDetailView';
import ListView from './views/ListView';
import GridView from './views/GridView';
import CreateContactModal from './modals/CreateContactModal';
import { useContactsState } from './hooks/useContactsState';
import { getContactFilterOptions } from './config/filterConfig';
import { CONTACT_TYPES, CONTACT_SORT_OPTIONS } from './constants';
import type { DuplicateGroup } from './types';
import type { Job as APIJob, Company as APICompany } from '../lib/crm-graphql';

export default function ContactsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = useContactsState();

  // Check for ID in query params to auto-select a contact
  const contactId = searchParams.get('id');
  useEffect(() => {
    if (contactId && state.contacts.length > 0 && !state.selectedContact) {
      const contact = state.contacts.find(c => c.id === contactId);
      if (contact) {
        state.setSelectedContact(contact);
        // Clear the query param after selecting
        router.replace('/contacts', { scroll: false });
      }
    }
  }, [contactId, state.contacts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigation handlers for related entities
  const handleJobClick = (job: APIJob) => {
    router.push(`/jobs?id=${job.id}`);
  };

  const handleCompanyClick = (company: APICompany) => {
    router.push(`/companies?id=${company.id}`);
  };

  // Generate filter options with current data
  const contactFilterOptions = useMemo(
    () => getContactFilterOptions(state.contacts),
    [state.contacts]
  );

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

  // Show loading state
  if (state.isLoading) {
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
        onBack={() => {
          state.setSelectedContact(null);
          state.setIsEditing(false);
        }}
        onEdit={state.handleStartEdit}
        onSave={state.handleSaveEdit}
        onCancel={state.handleCancelEdit}
        onDelete={state.handleDeleteContact}
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
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Contacts</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Dedupe Button */}
            <button
              onClick={() => state.setShowDedupeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Find Duplicates ({duplicateGroups.length})
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => state.setViewMode('grid')}
                className={`p-2 rounded ${state.viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Grid View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => state.setViewMode('list')}
                className={`p-2 rounded ${state.viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="List View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              sortOptions={CONTACT_SORT_OPTIONS}
              onSortChange={state.handleSortChange}
              activeSort={state.clientSortColumn ? { columnName: state.clientSortColumn, direction: state.clientSortDirection } : undefined}
            />

            <AdvancedFilters 
              filterOptions={contactFilterOptions}
              onFilterChange={state.handleFilterChange}
              activeFilter={state.activeFilter ? { columnName: state.activeFilter.columnName, operator: state.activeFilter.operator as any, value: state.activeFilter.value, values: state.activeFilter.values } : undefined}
            />
            <button 
              onClick={() => state.setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              Add Contact
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CONTACT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => state.setSelectedType(type)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                state.selectedType === type
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {type}
              {type === 'All' && <span className="ml-2 text-xs opacity-75">({state.contacts.length})</span>}
              {type !== 'All' && (
                <span className="ml-2 text-xs opacity-75">
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

      {/* Create Contact Modal */}
      <CreateContactModal 
        isOpen={state.showCreateModal}
        onClose={() => state.setShowCreateModal(false)}
        onSuccess={() => state.refetch()}
      />
    </main>
  );
}
