'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';
import { useProductsState } from '../hooks/useProductsState';
import { CreateProductModal } from '../modals/CreateProductModal';
import { DeleteProductModal } from '../modals/DeleteProductModal';
import { ManageCategoriesModal } from '../modals/ManageCategoriesModal';
import { ManageUomsModal } from '../modals/ManageUomsModal';
import { BulkDeleteModal, BulkActionsToolbar } from '../../shared';
import type { ProductLandingPage } from '../api/useProductsApi';
import { ProductsTable } from './components/table/ProductsTable';
import { getProductFilterOptions, getProductSortOptions } from '../config/filterConfig';
import SortButton from '@/components/SortButton';

export default function ProductsContent() {
  const router = useRouter();

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

  const isReceivingAnimation = floatingIcon?.itemId === 'products';

  const {
    // State
    searchQuery,
    setSearchQuery,
    filteredProducts,
    stats,
    totalCount,
    // Sort state
    sortState,
    handleSort,
    clientSortColumns,
    handleMultiSortChange,
    columnFilters,
    handleColumnFiltersChange,
    // Advanced filters
    activeFilters,
    setActiveFilters,
    // Modal state
    showCreateModal,
    setShowCreateModal,
    showCategoriesModal,
    setShowCategoriesModal,
    showUomsModal,
    setShowUomsModal,
    deleteConfirmId,
    setDeleteConfirmId,
    // Loading state
    isLoading,
    isMounted,
    refetch,
    // Pagination
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleScroll,
    // Filter options
    uniqueFactories,
    uniqueCategories,
    uniqueUoms,
    // Handlers
    handleProductDeleted,
    // Bulk selection
    selectAllMode,
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    isItemSelected,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
    getAllSelectedIds,
    // Bulk delete modal
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    handleBulkDeleteSuccess,
  } = useProductsState();

  // Get filter options with dynamic values
  const filterOptions = useMemo(() => 
    getProductFilterOptions(uniqueFactories, uniqueCategories, uniqueUoms),
    [uniqueFactories, uniqueCategories, uniqueUoms]
  );

  // Get sort options
  const sortOptions = useMemo(() => getProductSortOptions(), []);

  // Check if there are any filters applied (search, column filters, sort, or advanced filters)
  const hasFilters = useMemo(() => 
    searchQuery.length >= 2 ||
    Object.keys(columnFilters || {}).length > 0 ||
    (clientSortColumns && clientSortColumns.length > 0) ||
    (activeFilters && activeFilters.length > 0),
    [searchQuery, columnFilters, clientSortColumns, activeFilters]
  );

  // Clear all filters handler
  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    handleColumnFiltersChange({});
    handleMultiSortChange([]);
    setActiveFilters([]);
  }, [setSearchQuery, handleColumnFiltersChange, handleMultiSortChange, setActiveFilters]);

  // Product to delete
  const productToDelete = useMemo(() => {
    if (!deleteConfirmId) return null;
    return filteredProducts.find(p => p.id === deleteConfirmId) || null;
  }, [deleteConfirmId, filteredProducts]);

  // Navigate to product detail page
  const handleProductClick = (product: ProductLandingPage) => {
    router.push(`/products/${product.id}/edit`);
  };

  // Format currency
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value?: number) => {
    if (value === undefined || value === null) return '—';
    return `${(value * 100).toFixed(1)}%`;
  };

  // Skeleton loader
  if (!isMounted) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--muted)] rounded w-48" />
            <div className="h-4 bg-[var(--muted)] rounded w-64" />
            <div className="grid grid-cols-4 gap-4 mt-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-[var(--muted)] rounded-lg" />
              ))}
            </div>
            <div className="h-10 bg-[var(--muted)] rounded mt-6" />
            <div className="space-y-2 mt-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-[var(--muted)] rounded" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)] flex">
      <div className="flex-1 flex flex-col min-h-0 w-full">
        {/* Header */}
        <div className="p-6 pb-0 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-start gap-4 flex-shrink-0">
              {/* Morphing Icon Target - Cube Rotate Animation */}
              <HeaderIconAnimation
                isReceivingAnimation={isReceivingAnimation}
                animationStyle="cube-rotate"
                headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
              >
                {iconMap['products']}
              </HeaderIconAnimation>
              <div className="overflow-hidden">
                <motion.h1
                  className="text-2xl font-semibold text-[var(--foreground)]"
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
                >
                  Products
                </motion.h1>
                <motion.p
                  className="text-sm text-[var(--muted-foreground)] mt-1"
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
                >
                  Manage your product catalog, categories, and units of measure
                </motion.p>
              </div>
            </div>
            <motion.div
              className="flex items-center gap-2 sm:gap-3 flex-wrap"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
            >
              <button
                onClick={() => setShowUomsModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-[var(--border)] rounded-lg text-xs sm:text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors whitespace-nowrap"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span className="hidden sm:inline">Manage UOMs</span>
                <span className="sm:hidden">UOMs</span>
              </button>
              <button
                onClick={() => setShowCategoriesModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-[var(--border)] rounded-lg text-xs sm:text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors whitespace-nowrap"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
                <span className="hidden sm:inline">Manage Categories</span>
                <span className="sm:hidden">Categories</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors whitespace-nowrap"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </button>
            </motion.div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Total Products</div>
              <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{totalCount}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">In catalog</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Published</div>
              <div className="text-2xl font-semibold text-green-600 mt-1">{stats.publishedProducts}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">Available for use</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Draft</div>
              <div className="text-2xl font-semibold text-amber-600 mt-1">{stats.draftProducts}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">Not published</div>
            </div>
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm text-[var(--muted-foreground)]">Needs Approval</div>
              <div className="text-2xl font-semibold text-purple-600 mt-1">{stats.needsApproval}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">Pending review</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search by part number, description, factory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <SortButton
              sortOptions={sortOptions}
              onMultiSortChange={handleMultiSortChange}
              activeSorts={clientSortColumns}
            />
            <button
              onClick={handleClearAllFilters}
              disabled={!hasFilters}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors ${
                hasFilters
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                  : 'border-[var(--border)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed'
              }`}
              title={hasFilters ? 'Clear all filters' : 'No filters to clear'}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Clear Filters
            </button>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Results count */}
          <div className="text-sm text-[var(--muted-foreground)] mb-4">
            Showing {filteredProducts.length} of {totalCount} products
          </div>

          {/* Bulk Actions Toolbar */}
          <BulkActionsToolbar
            entityType="PRODUCTS"
            selectedCount={selectedCount}
            totalCount={totalCount}
            loadedCount={filteredProducts.length}
            selectAllMode={selectAllMode}
            onClearSelection={clearSelection}
            onDelete={() => setShowBulkDeleteModal(true)}
          />
        </div>

        {/* Products Table */}
        <div className="flex-1 p-6 pt-4 min-h-0">
          <ProductsTable
            filteredProducts={filteredProducts}
            isLoading={isLoading}
            hasFilters={hasFilters}
            isItemSelected={isItemSelected}
            isAllSelected={isAllSelected}
            isPartiallySelected={isPartiallySelected}
            handleSelectAll={handleSelectAll}
            handleSelectOne={handleSelectOne}
            onColumnFiltersChange={handleColumnFiltersChange}
            filterOptions={filterOptions}
            columnFilters={columnFilters}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            searchQuery={searchQuery}
            onProductClick={handleProductClick}
            onDelete={setDeleteConfirmId}
            onClearFilters={() => {
              setSearchQuery('');
              handleColumnFiltersChange({});
            }}
            onCreateProduct={() => setShowCreateModal(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => refetch()}
      />

      <DeleteProductModal
        isOpen={!!deleteConfirmId}
        product={productToDelete}
        onClose={() => setDeleteConfirmId(null)}
        onSuccess={handleProductDeleted}
      />

      <ManageCategoriesModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
      />

      <ManageUomsModal
        isOpen={showUomsModal}
        onClose={() => setShowUomsModal(false)}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={showBulkDeleteModal}
        entityType="PRODUCTS"
        selectedCount={selectedCount}
        getAllSelectedIds={getAllSelectedIds}
        onClose={() => setShowBulkDeleteModal(false)}
        onSuccess={handleBulkDeleteSuccess}
        queryKeysToInvalidate={[['products']]}
      />
    </main>
  );
}
