/**
 * AcknowledgementsListContent Component
 * Main content for the Acknowledgements page with full CRUD functionality
 * Includes infinite scroll pagination and search
 */

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';
import { useAcknowledgementsListState } from './hooks/useAcknowledgementsListState';
import type { AcknowledgementLandingPage, AcknowledgementCreationType } from '@/components/orders/api/acknowledgementsApi';
import { AcknowledgementDetailModal } from '@/components/orders/detail/components/modals/acknowledgements/AcknowledgementDetailModal';
import { AcknowledgementModal } from '@/components/orders/detail/components/modals/acknowledgements/AcknowledgementModal';
import { DeleteConfirmModal } from '@/components/orders/detail/components/modals/utility/DeleteConfirmModal';
import { AvatarInline } from '@/components/ui/CreatedByBadge';
import { OrderSelectModal } from './OrderSelectModal';

// Creation Type Configuration
const CREATION_TYPE_CONFIG: Record<AcknowledgementCreationType, { label: string; color: string; bgColor: string }> = {
  MANUAL: { label: 'Manual', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  IMPORT: { label: 'Import', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  API: { label: 'API', color: 'text-green-700', bgColor: 'bg-green-100' },
  DUPLICATION: { label: 'Duplicated', color: 'text-amber-700', bgColor: 'bg-amber-100' },
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function AcknowledgementsListContent() {
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

  const isReceivingAnimation = floatingIcon?.itemId === 'acknowledgements';

  const {
    acknowledgements,
    isLoadingAcknowledgements,
    acknowledgementsError,
    refetchAcknowledgements,
    // Pagination
    totalCount,
    hasNextPage,
    isFetchingNextPage,
    handleScroll,
    // Search
    searchQuery,
    setSearchQuery,
    isSearching,
    // Modals
    showAcknowledgementModal,
    showAcknowledgementDetailModal,
    showDeleteConfirmModal,
    showOrderSelectModal,
    selectedAcknowledgement,
    acknowledgementToEdit,
    acknowledgementToDelete,
    isLoadingAcknowledgementDetails,
    // Order state
    selectedOrder,
    isLoadingOrder,
    // Modal actions
    openCreateAcknowledgementModal,
    closeAcknowledgementModal,
    closeAcknowledgementDetailModal,
    closeDeleteConfirmModal,
    closeOrderSelectModal,
    handleOrderSelect,
    // CRUD actions
    handleSaveAcknowledgement,
    handleDeleteAcknowledgement,
    handleConfirmDelete,
    viewAcknowledgement,
    editAcknowledgementFromDetail,
    deleteAcknowledgementFromDetail,
    // Mutation states
    isSavingAcknowledgement,
    isDeletingAcknowledgement,
  } = useAcknowledgementsListState();

  // Local filter/sort state
  const [creationTypeFilter, setCreationTypeFilter] = useState<AcknowledgementCreationType | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'quantity' | 'number'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort acknowledgements
  const filteredAcknowledgements = useMemo(() => {
    return (acknowledgements || [])
      .filter((ack) => {
        const matchesType = creationTypeFilter === 'ALL' || ack.creationType === creationTypeFilter;
        return matchesType;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'date':
            comparison = new Date(a.orderEntityDate || a.createdAt || '').getTime() - new Date(b.orderEntityDate || b.createdAt || '').getTime();
            break;
          case 'quantity':
            comparison = parseInt(a.quantity || '0') - parseInt(b.quantity || '0');
            break;
          case 'number':
            comparison = (a.orderAcknowledgementNumber || '').localeCompare(b.orderAcknowledgementNumber || '');
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [acknowledgements, creationTypeFilter, sortField, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => ({
    totalQty: filteredAcknowledgements.reduce((sum, a) => sum + parseInt(a.quantity || '0'), 0),
    count: filteredAcknowledgements.length,
  }), [filteredAcknowledgements]);

  const toggleSort = (field: 'date' | 'quantity' | 'number') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            {/* Morphing Icon Target - Stamp Press Animation */}
            <HeaderIconAnimation
              isReceivingAnimation={isReceivingAnimation}
              animationStyle="stamp-press"
              headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            >
              {iconMap['acknowledgements']}
            </HeaderIconAnimation>
            <div className="overflow-hidden">
              <motion.h1
                className="text-2xl font-bold text-[var(--foreground)]"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
              >
                Acknowledgements
              </motion.h1>
              <motion.p
                className="text-sm text-[var(--muted-foreground)] mt-1"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
              >
                {searchQuery.length >= 2
                  ? `${filteredAcknowledgements.length} results for "${searchQuery}"`
                  : `Showing ${filteredAcknowledgements.length} of ${totalCount} acknowledgements`}
                {totals.totalQty > 0 && (
                  <span className="ml-2 font-medium text-teal-600">
                    • Total Qty: {totals.totalQty.toLocaleString()}
                  </span>
                )}
              </motion.p>
            </div>
          </div>

          {/* Create Button */}
          <motion.button
            onClick={openCreateAcknowledgementModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
            </svg>
            Create Acknowledgement
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search - uses API search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            >
              <circle cx="9" cy="9" r="6"/>
              <path d="M13.5 13.5L17 17" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search acknowledgements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {isSearching && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600" />
              </div>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted-foreground)]">Type:</span>
            <div className="flex gap-1">
              {(['ALL', 'MANUAL', 'IMPORT', 'API', 'DUPLICATION'] as const).map((type) => {
                const isActive = creationTypeFilter === type;
                const config = type !== 'ALL' ? CREATION_TYPE_CONFIG[type] : null;
                return (
                  <button
                    key={type}
                    onClick={() => setCreationTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? type === 'ALL'
                          ? 'bg-[var(--foreground)] text-[var(--background)]'
                          : `${config?.bgColor} ${config?.color}`
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                    }`}
                  >
                    {type === 'ALL' ? 'All' : config?.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetchAcknowledgements()}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            title="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10a7 7 0 1114 0M3 10V4m0 6h6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area with scroll handler for infinite scroll */}
      <div className="flex-1 overflow-auto p-6 bg-[var(--background)]" onScroll={handleScroll}>
        {/* Loading State */}
        {isLoadingAcknowledgements && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-10 w-10 text-teal-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span className="text-sm text-[var(--muted-foreground)]">Loading acknowledgements...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {acknowledgementsError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <circle cx="10" cy="10" r="8"/>
              <path d="M10 6v4M10 14v.01"/>
            </svg>
            <span className="text-sm text-red-700">{acknowledgementsError.message}</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingAcknowledgements && !acknowledgementsError && filteredAcknowledgements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-[var(--card)] rounded-xl border-2 border-dashed border-[var(--border)]">
            <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-[var(--foreground)] mb-2">No Acknowledgements Found</h4>
            <p className="text-sm text-[var(--muted-foreground)] mb-6 text-center max-w-md">
              {searchQuery || creationTypeFilter !== 'ALL'
                ? 'No acknowledgements match your current filters. Try adjusting your search or filter criteria.'
                : 'Acknowledgements track factory confirmations of order quantities and expected ship dates.'}
            </p>
          </div>
        )}

        {/* Table */}
        {!isLoadingAcknowledgements && !acknowledgementsError && filteredAcknowledgements.length > 0 && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-[var(--muted)]/30">
                <tr>
                  <th
                    className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                    onClick={() => toggleSort('number')}
                  >
                    <div className="flex items-center gap-1">
                      Ack #
                      {sortField === 'number' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                          <path d="M5 8l5 5 5-5"/>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Order #</th>
                  <th
                    className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Order Date
                      {sortField === 'date' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                          <path d="M5 8l5 5 5-5"/>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Product</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Factory</th>
                  <th
                    className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                    onClick={() => toggleSort('quantity')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Qty
                      {sortField === 'quantity' && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                          <path d="M5 8l5 5 5-5"/>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">
                    Ship Date
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Created By</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredAcknowledgements.map((ack) => {
                  const typeConfig = ack.creationType ? CREATION_TYPE_CONFIG[ack.creationType] : null;

                  return (
                    <tr
                      key={ack.id}
                      className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                      onClick={() => viewAcknowledgement(ack)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
                              <path d="M9 12l2 2 4-4"/>
                            </svg>
                          </div>
                          <p className="font-medium text-[var(--foreground)]">
                            {ack.orderAcknowledgementNumber || `ACK-${ack.id.substring(0, 8)}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[var(--primary)] font-medium">{ack.orderNumber || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                        {formatDate(ack.orderEntityDate)}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-[200px] truncate" title={ack.productName || ''}>
                        {ack.productName || '-'}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-[150px] truncate" title={ack.factoryName || ''}>
                        {ack.factoryName || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-teal-600">
                        {ack.quantity || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                        -
                      </td>
                      <td className="px-4 py-3 text-center">
                        {typeConfig && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <AvatarInline name={(ack as any).createdBy} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => viewAcknowledgement(ack)}
                            className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
                            title="View"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="10" cy="10" r="3"/>
                              <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteAcknowledgement(ack)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                            title="Delete"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 6h12M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 10v5M12 10v5M5 6l1 11a2 2 0 002 2h4a2 2 0 002-2l1-11"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filteredAcknowledgements.length > 0 && (
                <tfoot className="bg-[var(--muted)]/20 border-t border-[var(--border)]">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right font-semibold text-sm">Total:</td>
                    <td className="px-4 py-3 text-right font-bold text-teal-600">{totals.totalQty.toLocaleString()}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Loading indicator for infinite scroll */}
        {(isFetchingNextPage || hasNextPage) && (
          <div className="flex items-center justify-center py-4 bg-[var(--card)] border border-[var(--border)] rounded-lg mt-4">
            {isFetchingNextPage ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
                <span className="ml-2 text-sm text-[var(--muted-foreground)]">Loading more acknowledgements...</span>
              </>
            ) : (
              <span className="text-sm text-[var(--muted-foreground)]">Scroll for more...</span>
            )}
          </div>
        )}

        {/* End of list indicator */}
        {!hasNextPage && filteredAcknowledgements.length > 0 && !searchQuery && (
          <div className="text-center py-4 text-sm text-[var(--muted-foreground)]">
            All {totalCount} acknowledgements loaded
          </div>
        )}
      </div>

      {/* Modals */}
      <OrderSelectModal
        isOpen={showOrderSelectModal}
        onClose={closeOrderSelectModal}
        onSelect={handleOrderSelect}
        isLoading={isLoadingOrder}
      />

      {selectedOrder && (
        <AcknowledgementModal
          isOpen={showAcknowledgementModal}
          onClose={closeAcknowledgementModal}
          order={selectedOrder}
          acknowledgement={acknowledgementToEdit}
          onSubmit={handleSaveAcknowledgement}
          isLoading={isSavingAcknowledgement}
          isLoadingDetails={isLoadingAcknowledgementDetails || isLoadingOrder}
        />
      )}

      <AcknowledgementDetailModal
        isOpen={showAcknowledgementDetailModal}
        onClose={closeAcknowledgementDetailModal}
        acknowledgement={selectedAcknowledgement}
        onEdit={editAcknowledgementFromDetail}
        onDelete={deleteAcknowledgementFromDetail}
        isDeleting={isDeletingAcknowledgement}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirmModal}
        title="Delete Acknowledgement"
        message="Are you sure you want to delete this acknowledgement"
        itemName={acknowledgementToDelete?.orderAcknowledgementNumber || `ACK-${acknowledgementToDelete?.id.substring(0, 8)}`}
        isPending={isDeletingAcknowledgement}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteConfirmModal}
      />
    </div>
  );
}
