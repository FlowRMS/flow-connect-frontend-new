'use client';

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationMorph } from '@/contexts/NavigationMorphContext';
import type { RefObject } from 'react';
import { useProductsState } from '../hooks/useProductsState';
import { DeleteProductModal } from '../modals/DeleteProductModal';
import { ManageCategoriesModal } from '../modals/ManageCategoriesModal';
import { ManageUomsModal } from '../modals/ManageUomsModal';
import { BulkDeleteModal, BulkActionsToolbar } from '../../shared';
import type { ProductLandingPage } from '../api';
import { ProductsTable } from './components/table/ProductsTable';
import { ProductsStatsCards } from './components/stats/ProductsStatsCards';
import { ProductsHeader } from './components/header/ProductsHeader';
import { ProductsFilters } from './components/filters/ProductsFilters';
import { getProductFilterOptions, getProductSortOptions } from '../config/filterConfig';

export default function ProductsContent() {
  const router = useRouter();
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
    searchQuery,
    setSearchQuery,
    filteredProducts,
    totalCount,
    clientSortColumns,
    handleMultiSortChange,
    columnFilters,
    handleColumnFiltersChange,
    activeFilters,
    setActiveFilters,
    showCategoriesModal,
    setShowCategoriesModal,
    showUomsModal,
    setShowUomsModal,
    deleteConfirmId,
    setDeleteConfirmId,
    isLoading,
    isMounted,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    uniqueFactories,
    uniqueCategories,
    uniqueUoms,
    handleProductDeleted,
    selectAllMode,
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    isItemSelected,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
    getAllSelectedIds,
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    handleBulkDeleteSuccess,
  } = useProductsState();

  const filterOptions = useMemo(() =>
    getProductFilterOptions(uniqueFactories, uniqueCategories, uniqueUoms),
    [uniqueFactories, uniqueCategories, uniqueUoms]
  );

  const sortOptions = useMemo(() => getProductSortOptions(), []);

  const hasFilters = useMemo(() =>
    searchQuery.length >= 2 ||
    Object.keys(columnFilters || {}).length > 0 ||
    (clientSortColumns && clientSortColumns.length > 0) ||
    (activeFilters && activeFilters.length > 0),
    [searchQuery, columnFilters, clientSortColumns, activeFilters]
  );

  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    handleColumnFiltersChange({});
    handleMultiSortChange([]);
    setActiveFilters([]);
  }, [setSearchQuery, handleColumnFiltersChange, handleMultiSortChange, setActiveFilters]);

  const productToDelete = useMemo(() => {
    if (!deleteConfirmId) return null;
    return filteredProducts.find(p => p.id === deleteConfirmId) || null;
  }, [deleteConfirmId, filteredProducts]);

  const handleProductClick = (product: ProductLandingPage) => {
    router.push(`/products/${product.id}/edit`);
  };

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
        <div className="p-6 pb-0 flex-shrink-0">
          <ProductsHeader
            headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            isReceivingAnimation={isReceivingAnimation}
            onManageUoms={() => setShowUomsModal(true)}
            onManageCategories={() => setShowCategoriesModal(true)}
          />

          <ProductsStatsCards />

          <ProductsFilters
            filteredCount={filteredProducts.length}
            totalCount={totalCount}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortOptions={sortOptions}
            activeSorts={clientSortColumns}
            onMultiSortChange={handleMultiSortChange}
            hasFilters={hasFilters}
            onClearFilters={handleClearAllFilters}
            isLoading={isLoading}
            onRefresh={refetch}
          />

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
            onCreateProduct={() => router.push('/products/new')}
          />
        </div>
      </div>

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
