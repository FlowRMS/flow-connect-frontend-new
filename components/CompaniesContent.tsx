/**
 * Companies Content - Main Component
 * Modular and clean architecture following best practices
 */

'use client';

import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdvancedFilters, { ActiveFilter, ActiveSort } from './advancedFilters/AdvancedFilters';
import SortButton from './SortButton';
import { useCRMCompanyLandingPagesInfinite, useDeleteCRMCompany, useUpdateCRMCompany, useCRMCompany } from './hooks/useCRMApi';

import { companyToasts } from './lib/toast';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import type { CompanySourceType, Contact as APIContact, Job as APIJob, LandingPageFilter, LandingPageOrderBy } from './lib/crm-graphql';

// Modular imports
import { useCompaniesState } from './companies/hooks/useCompaniesState';
import { COMPANY_TYPES } from './companies/constants';
import { getCompanyFilterOptions, getCompanySortOptions } from './companies/config/filterConfig';
import { mapAPICompanyToUICompany } from './companies/types';
import CompanyDetailView from './companies/detail/CompanyDetailView';
import GridView from './companies/views/GridView';
import ListView from './companies/views/ListView';

export default function CompaniesContent() {
  // Router for navigation
  const router = useRouter();
  const searchParams = useSearchParams();

  // Hydration-safe mounted state
  const [isMounted, setIsMounted] = useState(false);

  // Server-side filters - defined BEFORE API hook so they can be passed to the query
  // Default filter: Only show CUSTOMER companies (manufacturers are managed in /manufacturers)
  const [serverFilters, setServerFilters] = useState<LandingPageFilter[]>([
    { operator: 'EQ', columnName: 'companySourceType', value: 'CUSTOMER' }
  ]);
  const [serverOrderBy, setServerOrderBy] = useState<LandingPageOrderBy[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Default filter to only show CUSTOMER companies (manufacturers are managed separately)
  const customerOnlyFilter: LandingPageFilter = { operator: 'EQ', columnName: 'companySourceType', value: 'CUSTOMER' };

  // Handler for server-side filter changes
  const handleServerFiltersChange = useCallback((filters: ActiveFilter[]) => {
    // Only include value OR values, not both - check which one exists
    const apiFilters: LandingPageFilter[] = filters.map(f => {
      if (f.values && f.values.length > 0) {
        return {
          operator: f.operator,
          columnName: f.columnName,
          values: f.values,
        };
      }
      return {
        operator: f.operator,
        columnName: f.columnName,
        value: f.value,
      };
    });
    // Always include the CUSTOMER-only filter
    setServerFilters([customerOnlyFilter, ...apiFilters]);
  }, []);

  // Handler for server-side sort changes
  const handleServerSortChange = useCallback((sorts: ActiveSort[]) => {
    const apiOrderBy: LandingPageOrderBy[] = sorts.map(s => ({
      columnName: s.columnName,
      direction: s.direction,
    }));
    setServerOrderBy(apiOrderBy);
  }, []);

  // CRM API hooks with infinite scroll - now with server-side filters
  const {
    data: companiesData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCRMCompanyLandingPagesInfinite(serverFilters, serverOrderBy);
  const deleteCompanyMutation = useDeleteCRMCompany();
  const updateCompanyMutation = useUpdateCRMCompany();

  // Flatten paginated results with deduplication
  const landingPageCompanies = useMemo(() => {
    if (!companiesData?.pages) return undefined;
    const allRecords = companiesData.pages.flatMap(page => page.records);
    // Deduplicate by ID
    const seen = new Set<string>();
    return allRecords.filter(record => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    });
  }, [companiesData]);

  // Infinite scroll trigger
  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  // State management
  const {
    viewMode,
    setViewMode,
    selectedType,
    setSelectedType,
    companies,
    filteredCompanies,
    selectedCompany,
    setSelectedCompany,
    isEditing,
    setIsEditing,
    editFormData,
    setEditFormData,
    deleteConfirmId,
    setDeleteConfirmId,
    activeFilters,
    clientSortColumns,
    uniqueCompanyNames,
    uniqueCompanyTypes,
    uniqueCreatedBy,
    handleFiltersChange: stateHandleFiltersChange,
    handleMultiSortChange: stateHandleMultiSortChange,
    handleStartEdit,
    handleCancelEdit,
  } = useCompaniesState(landingPageCompanies);

  // Wrapper handlers that call both state and server-side filter handlers
  const handleFiltersChange = useCallback((filters: ActiveFilter[]) => {
    stateHandleFiltersChange(filters);
    handleServerFiltersChange(filters);
  }, [stateHandleFiltersChange, handleServerFiltersChange]);

  const handleMultiSortChange = useCallback((sorts: ActiveSort[]) => {
    stateHandleMultiSortChange(sorts);
    handleServerSortChange(sorts);
  }, [stateHandleMultiSortChange, handleServerSortChange]);

  // Get company ID from URL - this is the source of truth for navigation
  const companyIdFromUrl = searchParams.get('id');

  // Track intentional clear to prevent re-selecting after back navigation
  const isIntentionalClearRef = useRef(false);

  // Fetch full company details when navigating via URL
  const targetCompanyId = (!isIntentionalClearRef.current && companyIdFromUrl) ? companyIdFromUrl : (selectedCompany?.id || '');
  const { data: fullCompanyData, isLoading: companyDetailLoading } = useCRMCompany(targetCompanyId);

  // When we get company data from API (navigating via URL), set it as selected
  useEffect(() => {
    if (fullCompanyData && companyIdFromUrl && !isIntentionalClearRef.current) {
      const mappedCompany = mapAPICompanyToUICompany(fullCompanyData);
      if (!selectedCompany || selectedCompany.id !== mappedCompany.id) {
        setSelectedCompany(mappedCompany);
      }
    }
  }, [fullCompanyData, companyIdFromUrl, selectedCompany, setSelectedCompany]);

  // Reset the intentional clear flag when URL has no ID
  useEffect(() => {
    if (!companyIdFromUrl) {
      isIntentionalClearRef.current = false;
    }
  }, [companyIdFromUrl]);

  // Update URL when a company is selected (not when cleared - that's handled by handleBack)
  useEffect(() => {
    if (!isMounted) return;
    if (selectedCompany?.id) {
      const currentId = searchParams.get('id');
      if (currentId !== selectedCompany.id) {
        router.replace(`/companies?id=${selectedCompany.id}`, { scroll: false });
      }
    }
  }, [selectedCompany?.id, isMounted, router, searchParams]);

  // Handle back navigation
  const handleBack = () => {
    isIntentionalClearRef.current = true;
    setSelectedCompany(null);
    setIsEditing(false);
    router.replace('/companies', { scroll: false });
  };

  // Navigation handlers for related entities
  const handleContactClick = (contact: APIContact) => {
    // Navigate to contacts page with the contact ID as query param
    router.push(`/contacts?id=${contact.id}`);
  };

  const handleJobClick = (job: APIJob) => {
    // Navigate to jobs page with the job ID as query param
    router.push(`/jobs?id=${job.id}`);
  };

  // Filter and sort options with unique values
  const companyFilterOptions = useMemo(
    () => getCompanyFilterOptions(uniqueCompanyNames, uniqueCompanyTypes, uniqueCreatedBy),
    [uniqueCompanyNames, uniqueCompanyTypes, uniqueCreatedBy]
  );

  const companySortOptions = useMemo(() => getCompanySortOptions(), []);

  // Handle delete company
  const handleDeleteCompany = async (id: string) => {
    const company = companies.find(c => c.id === id);
    try {
      await deleteCompanyMutation.mutateAsync(id);
      companyToasts.deleteSuccess(company?.name || 'Company');
      setDeleteConfirmId(null);
      
      // Always navigate back to companies list after deletion
      isIntentionalClearRef.current = true;
      setSelectedCompany(null);
      router.replace('/companies', { scroll: false });
    } catch (err) {
      console.error('Failed to delete company:', err);
      companyToasts.deleteError(err instanceof Error ? err.message : undefined);
    }
  };

  // Helper to normalize company source type
  const normalizeCompanySourceType = (value: string | CompanySourceType | undefined): CompanySourceType => {
    if (value === '2' || value === 2 as unknown as string) return 'MANUFACTURER';
    if (value === '1' || value === 1 as unknown as string) return 'CUSTOMER';
    if (value === 'MANUFACTURER') return 'MANUFACTURER';
    return 'CUSTOMER';
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedCompany) return;
    
    // Ensure companySourceType is a valid enum value
    const normalizedSourceType = normalizeCompanySourceType(editFormData.companySourceType);
    
    // Parse tags - handle both string and array formats
    let tagsToSend: string | undefined;
    if (editFormData.tags) {
      if (typeof editFormData.tags === 'string') {
        tagsToSend = editFormData.tags;
      } else if (Array.isArray(editFormData.tags)) {
        tagsToSend = editFormData.tags.join(',');
      }
    }
    
    try {
      await updateCompanyMutation.mutateAsync({
        id: selectedCompany.id,
        input: {
          name: editFormData.name,
          phone: editFormData.phone,
          website: editFormData.website,
          companySourceType: normalizedSourceType,
          tags: tagsToSend,
        },
      });
      
      // Update local state
      const updatedName = editFormData.name || selectedCompany.name;
      const updatedTags = tagsToSend ? tagsToSend.split(',').map(t => t.trim()).filter(Boolean) : selectedCompany.tags;
      
      companyToasts.updateSuccess(updatedName);
      setSelectedCompany({
        ...selectedCompany,
        name: updatedName,
        phone: editFormData.phone || selectedCompany.phone,
        website: editFormData.website || selectedCompany.website,
        companySourceType: normalizedSourceType,
        type: normalizedSourceType === 'MANUFACTURER' ? ['Manufacturer'] : ['Customer'],
        tags: updatedTags,
      });
      
      setIsEditing(false);
      refetch();
    } catch (err) {
      console.error('Failed to update company:', err);
      companyToasts.updateError(err instanceof Error ? err.message : undefined);
    }
  };

  // Handle field change in edit form
  const handleFieldChange = (field: string, value: unknown) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  // Show loading state while fetching company details from URL navigation
  if (companyIdFromUrl && companyDetailLoading && !selectedCompany) {
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
            Back to Companies
          </button>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Loading Company Details...</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>Fetching company details...</span>
          </div>
        </div>
      </main>
    );
  }

  // Company Detail View
  if (selectedCompany) {
    return (
      <CompanyDetailView
        company={selectedCompany}
        isEditing={isEditing}
        editFormData={editFormData}
        deleteConfirmId={deleteConfirmId}
        updatePending={updateCompanyMutation.isPending}
        deletePending={deleteCompanyMutation.isPending}
        onBack={handleBack}
        onStartEdit={handleStartEdit}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onDeleteClick={() => setDeleteConfirmId(selectedCompany.id)}
        onDeleteConfirm={() => handleDeleteCompany(deleteConfirmId!)}
        onDeleteCancel={() => setDeleteConfirmId(null)}
        onFieldChange={handleFieldChange}
        onContactClick={handleContactClick}
        onJobClick={handleJobClick}
      />
    );
  }

  // Show loading state (also check isMounted for hydration safety)
  if (!isMounted || isLoading) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Companies</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-[var(--muted-foreground)]">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span>Loading companies from CRM...</span>
          </div>
        </div>
      </main>
    );
  }

  // Show error state
  if (error) {
    return (
      <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Companies</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800">Failed to Load Companies</h3>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
              <button
                onClick={() => refetch()}
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

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">Companies</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Type Filter */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              {COMPANY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-white shadow-sm text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
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
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
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
              sortOptions={companySortOptions}
              onMultiSortChange={handleMultiSortChange}
              activeSorts={clientSortColumns}
            />

            <AdvancedFilters
              filterOptions={companyFilterOptions}
              onFiltersChange={handleFiltersChange}
              activeFilters={activeFilters}
            />

            <button
              onClick={() => router.push('/companies/new')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              <span className="hidden sm:inline">Add Company</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredCompanies.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4zM8 14v3M12 14v3M16 14v3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No Companies Yet</h3>
          <p className="text-[var(--muted-foreground)] text-center max-w-md mb-6">
            Start by adding your first company. Companies you create will appear here.
          </p>
          <button
            onClick={() => router.push('/companies/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
            </svg>
            Add Your First Company
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <GridView companies={filteredCompanies} onCompanyClick={setSelectedCompany} />
          ) : (
            <ListView companies={filteredCompanies} onCompanyClick={setSelectedCompany} />
          )}

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Loading more companies...</span>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
