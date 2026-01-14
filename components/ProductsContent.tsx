'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';
import { useProductsState } from './products/hooks/useProductsState';
import { DeleteProductModal } from './products/modals/DeleteProductModal';
import { ManageCategoriesModal } from './products/modals/ManageCategoriesModal';
import { ManageUomsModal } from './products/modals/ManageUomsModal';
import type { ProductLandingPage } from './products/api/useProductsApi';

// Sort direction type
type SortDirection = 'asc' | 'desc' | null;

// Column sort state
interface SortState {
  column: string;
  direction: SortDirection;
}

// Sortable/Filterable column header component
interface ColumnHeaderProps {
  label: string;
  columnKey: string;
  sortState: SortState | null;
  onSort: (column: string) => void;
  filterType: 'text' | 'dropdown';
  filterValue: string;
  onFilterChange: (column: string, value: string) => void;
  filterOptions?: string[];
  width?: string;
  textAlign?: 'left' | 'center';
}

function ColumnHeader({
  label,
  columnKey,
  sortState,
  onSort,
  filterType,
  filterValue,
  onFilterChange,
  filterOptions = [],
  textAlign = 'left',
}: ColumnHeaderProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
        setDropdownSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSorted = sortState?.column === columnKey;
  const sortDirection = isSorted ? sortState.direction : null;

  const filteredOptions = filterOptions.filter(opt =>
    opt.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  return (
    <div className="relative" ref={filterRef}>
      <div className={`flex items-center gap-1 ${textAlign === 'center' ? 'justify-center' : ''}`}>
        <button
          onClick={() => onSort(columnKey)}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
        >
          {label}
          <span className="flex flex-col">
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              className={`${sortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/40'}`}
            >
              <path d="M4 0L8 4H0L4 0Z" fill="currentColor" />
            </svg>
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              className={`-mt-0.5 ${sortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/40'}`}
            >
              <path d="M4 8L0 4H8L4 8Z" fill="currentColor" />
            </svg>
          </span>
        </button>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`p-0.5 rounded hover:bg-[var(--muted)] transition-colors ${filterValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/60'}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
      </div>

      {showFilter && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg min-w-[180px]">
          {filterType === 'text' ? (
            <div className="p-2">
              <input
                type="text"
                placeholder={`Filter ${label.toLowerCase()}...`}
                value={filterValue}
                onChange={(e) => onFilterChange(columnKey, e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                autoFocus
              />
              {filterValue && (
                <button
                  onClick={() => onFilterChange(columnKey, '')}
                  className="mt-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="p-2">
              <input
                type="text"
                placeholder="Search..."
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] mb-2"
                autoFocus
              />
              <div className="max-h-[200px] overflow-y-auto">
                <button
                  onClick={() => {
                    onFilterChange(columnKey, '');
                    setShowFilter(false);
                    setDropdownSearch('');
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] ${!filterValue ? 'bg-[var(--muted)] font-medium' : ''}`}
                >
                  All
                </button>
                {filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onFilterChange(columnKey, option);
                      setShowFilter(false);
                      setDropdownSearch('');
                    }}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[var(--muted)] ${filterValue === option ? 'bg-[var(--muted)] font-medium' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
    columnFilters,
    handleColumnFilterChange,
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
    // Filter options
    uniqueFactories,
    uniqueCategories,
    // Handlers
    handleProductDeleted,
  } = useProductsState();

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
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6 overflow-visible">
            <div className="flex items-start gap-4 overflow-visible">
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
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
            >
              <button
                onClick={() => setShowUomsModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                Manage UOMs
              </button>
              <button
                onClick={() => setShowCategoriesModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
                Manage Categories
              </button>
              <button
                onClick={() => router.push('/products/new')}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                Add Product
              </button>
            </motion.div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
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
        </div>

        {/* Products Table */}
        <div className="flex-1 overflow-auto p-6 pt-0">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {isLoading && filteredProducts.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="animate-spin h-8 w-8 mx-auto text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="mt-4 text-[var(--muted-foreground)]">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--muted)] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">No products found</h3>
                <p className="text-[var(--muted-foreground)] mb-4">
                  {searchQuery ? 'Try adjusting your search or filters' : 'Get started by creating your first product'}
                </p>
                <button
                  onClick={() => router.push('/products/new')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="7"/>
                    <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                  </svg>
                  Create First Product
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="px-4 py-3 text-left">
                        <ColumnHeader
                          label="Part Number"
                          columnKey="factoryPartNumber"
                          sortState={sortState}
                          onSort={handleSort}
                          filterType="text"
                          filterValue={columnFilters.factoryPartNumber}
                          onFilterChange={handleColumnFilterChange}
                        />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <ColumnHeader
                          label="Description"
                          columnKey="description"
                          sortState={sortState}
                          onSort={handleSort}
                          filterType="text"
                          filterValue={columnFilters.description}
                          onFilterChange={handleColumnFilterChange}
                        />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <ColumnHeader
                          label="Factory"
                          columnKey="factoryTitle"
                          sortState={sortState}
                          onSort={handleSort}
                          filterType="dropdown"
                          filterValue={columnFilters.factoryTitle}
                          onFilterChange={handleColumnFilterChange}
                          filterOptions={uniqueFactories}
                        />
                      </th>
                      <th className="px-4 py-3 text-left">
                        <ColumnHeader
                          label="Category"
                          columnKey="categoryTitle"
                          sortState={sortState}
                          onSort={handleSort}
                          filterType="dropdown"
                          filterValue={columnFilters.categoryTitle}
                          onFilterChange={handleColumnFilterChange}
                          filterOptions={uniqueCategories}
                        />
                      </th>
                      <th className="px-4 py-3 text-right">
                        <ColumnHeader
                          label="Unit Price"
                          columnKey="unitPrice"
                          sortState={sortState}
                          onSort={handleSort}
                          filterType="text"
                          filterValue=""
                          onFilterChange={() => {}}
                          textAlign="center"
                        />
                      </th>
                      <th className="px-4 py-3 text-center">
                        <ColumnHeader
                          label="Commission"
                          columnKey="defaultCommissionRate"
                          sortState={sortState}
                          onSort={handleSort}
                          filterType="text"
                          filterValue=""
                          onFilterChange={() => {}}
                          textAlign="center"
                        />
                      </th>
                      <th className="px-4 py-3 text-center">
                        <ColumnHeader
                          label="Status"
                          columnKey="published"
                          sortState={sortState}
                          onSort={handleSort}
                          filterType="dropdown"
                          filterValue={columnFilters.published}
                          onFilterChange={handleColumnFilterChange}
                          filterOptions={['Published', 'Draft']}
                          textAlign="center"
                        />
                      </th>
                      <th className="px-4 py-3 text-center">
                        <ColumnHeader
                          label="Approval"
                          columnKey="approvalNeeded"
                          sortState={sortState}
                          onSort={handleSort}
                          filterType="dropdown"
                          filterValue={columnFilters.approvalNeeded}
                          onFilterChange={handleColumnFilterChange}
                          filterOptions={['Yes', 'No']}
                          textAlign="center"
                        />
                      </th>
                      <th className="px-4 py-3 text-center w-16">
                        <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                          Actions
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-[var(--foreground)]">
                            {product.factoryPartNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-[var(--foreground)] line-clamp-2 max-w-xs">
                            {product.description || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                            {product.factoryTitle || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700">
                            {product.categoryTitle || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {formatCurrency(product.unitPrice)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-[var(--foreground)]">
                            {formatPercentage(product.defaultCommissionRate)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {product.published ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {product.approvalNeeded ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Required
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--muted-foreground)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(product.id);
                            }}
                            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-[var(--muted-foreground)] hover:text-red-600"
                            title="Delete product"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Load More */}
            {hasNextPage && (
              <div className="p-4 border-t border-[var(--border)] text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading more...' : 'Load more products'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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
    </main>
  );
}
