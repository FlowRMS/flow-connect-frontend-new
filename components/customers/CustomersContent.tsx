/**
 * Customers Content Component - Main Container
 * Clean, modular implementation for the customers page
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AdvancedFilters from '../AdvancedFilters';
import SortButton from '../SortButton';
import { useCustomersState } from './hooks/useCustomersState';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { getCustomerFilterOptions, getCustomerSortOptions } from './config/filterConfig';
import { ListView } from './views/ListView';
import { GridView } from './views/GridView';
import { DeleteCustomerModal } from './modals/DeleteCustomerModal';

export default function CustomersContent() {
  const router = useRouter();
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    filteredCustomers,
    deleteConfirmId,
    setDeleteConfirmId,
    isLoading,
    error,
    refetch,
    isMounted,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    uniqueCompanyNames,
    activeFilters,
    handleFiltersChange,
    clientSortColumns,
    handleMultiSortChange,
    handleCustomerDeleted,
  } = useCustomersState();

  // Navigate to customer edit page
  const handleCustomerClick = (customer: { id: string }) => {
    router.push(`/customers/${customer.id}/edit`);
  };

  // Navigate to customer edit page
  const handleEditCustomer = (customer: { id: string }) => {
    router.push(`/customers/${customer.id}/edit`);
  };

  // Infinite scroll trigger
  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  // Filter and sort configuration
  const customerFilterOptions = getCustomerFilterOptions(uniqueCompanyNames);
  const customerSortOptions = getCustomerSortOptions();

  // Find customer to delete
  const customerToDelete = filteredCustomers.find(c => c.id === deleteConfirmId);

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">Customers</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Manage your customer accounts</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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

            {/* Type Filter */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              {(['All', 'Parent', 'Child'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-white shadow-sm text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--card)]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <SortButton
              sortOptions={customerSortOptions}
              onMultiSortChange={handleMultiSortChange}
              activeSorts={clientSortColumns}
            />

            <AdvancedFilters
              filterOptions={customerFilterOptions}
              onFiltersChange={handleFiltersChange}
              activeFilters={activeFilters}
            />

            <button
              onClick={() => router.push('/customers/new')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-4 sm:h-4">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              <span className="hidden sm:inline">New Customer</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Loading State */}
      {(!isMounted || isLoading) && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-[var(--muted-foreground)]">Loading customers...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isMounted && error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="mx-auto mb-4 w-12 h-12 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load customers</h3>
          <p className="text-sm text-red-600 mb-4">{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Views */}
      {isMounted && !isLoading && !error && viewMode === 'grid' && (
        <GridView
          customers={filteredCustomers}
          onCustomerClick={handleCustomerClick}
          onEditClick={handleEditCustomer}
          onDeleteClick={(customer) => setDeleteConfirmId(customer.id)}
        />
      )}

      {isMounted && !isLoading && !error && viewMode === 'list' && (
        <ListView
          customers={filteredCustomers}
          onCustomerClick={handleCustomerClick}
          onEditClick={handleEditCustomer}
          onDeleteClick={(customer) => setDeleteConfirmId(customer.id)}
        />
      )}

      {/* Infinite scroll trigger */}
      {isMounted && !isLoading && !error && filteredCustomers.length > 0 && (
        <>
          <div ref={loadMoreRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Loading more customers...</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      {customerToDelete && (
        <DeleteCustomerModal
          isOpen={!!deleteConfirmId}
          customer={customerToDelete}
          onClose={() => setDeleteConfirmId(null)}
          onSuccess={handleCustomerDeleted}
        />
      )}
    </main>
  );
}
