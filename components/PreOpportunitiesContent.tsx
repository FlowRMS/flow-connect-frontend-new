/**
 * Pre-Opportunities Content Component
 * Main entry point for the Pre-Opportunities page
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from './ui/HeaderIconAnimations';
import { iconMap } from './Sidebar';
import type { RefObject } from 'react';
import AdvancedFilters from './advancedFilters/AdvancedFilters';
import SortButton from './SortButton';
import {
  usePreOppsState,
  getPreOppFilterOptions,
  getPreOppSortOptions,
  KanbanView,
  ListView,
  CreatePreOpportunityModal,
  ViewModeToggle,
  LoadingState,
  ErrorState,
  PlusCircleIcon,
} from './pre-opportunities';

export default function PreOpportunitiesContent() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    viewMode,
    setViewMode,
    preOpps,
    isLoading,
    error,
    refetch,
    stages,
    activeId,
    setActiveId,
    activeFilters,
    clientSortColumns,
    uniqueEntityNumbers,
    uniqueStatuses,
    uniqueCreatedBy,
    handleFiltersChange,
    handleMultiSortChange,
  } = usePreOppsState();

  const preOppFilterOptions = useMemo(() => getPreOppFilterOptions(
    uniqueEntityNumbers,
    uniqueStatuses,
    uniqueCreatedBy
  ), [uniqueEntityNumbers, uniqueStatuses, uniqueCreatedBy]);

  const preOppSortOptions = useMemo(() => getPreOppSortOptions(), []);

  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    setIsCreateModalOpen(false);
    refetch();
  }, [refetch]);

  // Navigation morph hooks - must be called before any early returns
  const { registerHeaderTarget, floatingIcon } = useNavigationMorph();
  const headerIconRef = useRef<HTMLDivElement>(null);

  // Register header target on mount
  useEffect(() => {
    if (headerIconRef.current) {
      registerHeaderTarget(headerIconRef.current);
    }
    return () => {
      registerHeaderTarget(null);
    };
  }, [registerHeaderTarget]);

  const isReceivingAnimation = floatingIcon?.itemId === 'pre-quotes';

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)]">
      {/* Header */}
      <div className="p-3 sm:p-6 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-2">
          <div className="flex items-start gap-4">
            {/* Morphing Icon Target - Sparkle Burst Animation */}
            <HeaderIconAnimation
              isReceivingAnimation={isReceivingAnimation}
              animationStyle="sparkle-burst"
              headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            >
              {iconMap['pre-quotes']}
            </HeaderIconAnimation>
            <div className="overflow-hidden">
              <motion.h1
                className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
              >
                Pre-Opportunities
              </motion.h1>
              <motion.p
                className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
              >
                {isLoading ? 'Loading...' : `${preOpps.length} opportunities • Early-stage pipeline prospects`}
              </motion.p>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
            initial={{ opacity: 0, x: 30, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
          >
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />

            <SortButton
              sortOptions={preOppSortOptions}
              onMultiSortChange={handleMultiSortChange}
              activeSorts={clientSortColumns}
            />

            <AdvancedFilters
              filterOptions={preOppFilterOptions}
              activeFilters={activeFilters}
              onFiltersChange={handleFiltersChange}
            />

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <PlusCircleIcon />
              <span className="hidden sm:inline">New Pre-Opportunity</span>
              <span className="sm:hidden">New</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Views */}
      <div className="px-3 sm:px-6 pb-6">
        {isLoading ? (
          <LoadingState />
        ) : viewMode === 'kanban' ? (
          <KanbanView
            preOpps={preOpps}
            stages={stages}
            activeId={activeId}
            setActiveId={setActiveId}
            onRefresh={refetch}
          />
        ) : (
          <ListView preOpps={preOpps} onRefresh={refetch} />
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreatePreOpportunityModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onSuccess={handleCreateSuccess}
        />
      )}
    </main>
  );
}
