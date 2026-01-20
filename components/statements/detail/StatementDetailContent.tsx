/**
 * StatementDetailContent Component
 * Main container for statement detail/create/edit
 * Following the pattern from OrderDetailContent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStatementDetailState, type LocalLineItem } from './hooks/useStatementDetailState';
import { HeaderTopBar, PricingSummaryBar, StatementDetailsFields } from './components/header';
import { LineItemsTable } from './components/line-items';
// Note: FilesTab not yet supported for statements - STATEMENT not in FileEntityType
import { useDeleteStatement } from '../api/useStatementsApi';
import { ColumnsModal } from './components/modals/ColumnsModal';
import { AdditionalDetailsModal } from './components/modals/AdditionalDetailsModal';

interface StatementDetailContentProps {
  statementId: string;
}

export default function StatementDetailContent({ statementId }: StatementDetailContentProps) {
  const router = useRouter();
  const state = useStatementDetailState({ statementId });

  // Delete mutation
  const deleteStatementMutation = useDeleteStatement();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Additional details modal state
  const [additionalDetailsItem, setAdditionalDetailsItem] = useState<LocalLineItem | null>(null);

  // Loading state
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading statement...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background)]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Error Loading Statement</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">{state.error.message}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => state.refetch()}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/statements')}
              className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Back to Statements
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state (only for edit mode)
  if (!state.isCreateMode && !state.statement && !state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Statement Not Found
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            The statement with ID "{statementId}" could not be found.
          </p>
          <button
            onClick={() => router.push('/statements')}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Statements
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!state.factoryId) {
        alert('Factory is required');
        return;
      }

      if (!state.entityDate) {
        alert('Statement date is required');
        return;
      }

      const input = state.buildSaveInput();

      if (state.isCreateMode) {
        const result = await state.createMutation.mutateAsync(input);
        state.resetChanges();
        router.push(`/statements/${result.id}`);
      } else {
        await state.updateMutation.mutateAsync(input);
        state.resetChanges();
      }
    } catch (error) {
      console.error('Error saving statement:', error);
      const message = error instanceof Error ? error.message : 'Failed to save statement';
      alert(message);
    }
  };

  const handleDelete = async () => {
    if (!state.statement?.id) return;

    setIsDeleting(true);
    try {
      await deleteStatementMutation.mutateAsync(state.statement.id);
      router.push('/statements');
    } catch (error) {
      console.error('Error deleting statement:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete statement';
      alert(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isSaving = state.createMutation.isPending || state.updateMutation.isPending;

  return (
    <main className="h-full overflow-auto bg-[var(--background)]">
      {/* Header */}
      <HeaderTopBar
        statementNumber={state.statementNumber}
        isCreateMode={state.isCreateMode}
        hasChanges={state.hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onDelete={() => setShowDeleteConfirm(true)}
        showActionsDropdown={state.showActionsDropdown}
        setShowActionsDropdown={state.setShowActionsDropdown}
      />

      {/* Pricing Summary */}
      <PricingSummaryBar
        subtotal={state.totals.subtotal}
        total={state.totals.total}
        commission={state.totals.commission}
        lineItemCount={state.lineItems.length}
      />

      {/* Details Fields */}
      <StatementDetailsFields
        showHeaderFields={state.showHeaderFields}
        toggleHeaderFields={state.toggleHeaderFields}
        statementNumber={state.statementNumber}
        entityDate={state.entityDate}
        factoryId={state.factoryId}
        factoryName={state.factoryName}
        isCreateMode={state.isCreateMode}
        onUpdate={state.updateStatementHeader}
      />

      {/* Main Content Area with Tabs */}
      <div className="p-6">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-1 mb-6 border-b border-[var(--border)] bg-white pt-4 px-4 -mx-6 -mt-6">
          <div className="flex gap-1">
            {[
              { id: 'line-items', label: 'Line Items', count: state.lineItems.length },
              { id: 'files', label: 'Files', disabled: true, disabledReason: 'Coming soon' },
              { id: 'notes', label: 'Notes', disabled: true, disabledReason: 'Coming soon' },
              { id: 'activity', label: 'Activity', disabled: true, disabledReason: 'Coming soon' },
              { id: 'settings', label: 'Settings', disabled: true, disabledReason: 'Coming soon' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && state.setActiveTab(tab.id as any)}
                disabled={tab.disabled}
                title={tab.disabled ? tab.disabledReason : undefined}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab.disabled
                    ? 'border-transparent text-gray-300 cursor-not-allowed'
                    : state.activeTab === tab.id
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                      tab.disabled ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
            {state.isCreateMode && (
              <span className="ml-auto text-xs text-[var(--muted-foreground)] italic pr-2">
                Some tabs will unlock after saving
              </span>
            )}
          </div>

          {/* View Controls */}
          {state.activeTab === 'line-items' && (
            <div className="flex items-center gap-3 pb-2">
              <button
                onClick={state.openColumnsModal}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h12M4 10h12M4 14h12" strokeLinecap="round" />
                </svg>
                Columns
                <span className="px-1.5 py-0.5 bg-[var(--muted)] rounded text-xs">
                  {state.visibleColumns.size}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="pb-32">
          {state.activeTab === 'line-items' && (
            <LineItemsTable
              lineItems={state.lineItems}
              selectedLineItems={state.selectedLineItems}
              visibleColumns={state.visibleColumns}
              factoryId={state.factoryId}
              onToggleSelection={state.toggleLineItemSelection}
              onToggleAllSelection={state.selectAllLineItems}
              onClearSelection={state.clearLineItemSelection}
              onUpdateLineItem={state.updateLineItem}
              onRemoveLineItem={state.removeLineItem}
              onAddLineItem={state.addLineItem}
              onOpenAdditionalDetails={setAdditionalDetailsItem}
            />
          )}

          {/* Files tab not yet supported for statements */}
        </div>
      </div>

      {/* Columns Modal */}
      <ColumnsModal
        isOpen={state.showColumnsModal}
        onClose={state.closeColumnsModal}
        visibleColumns={state.visibleColumns}
        toggleColumn={state.toggleColumn}
      />

      {/* Additional Details Modal */}
      {additionalDetailsItem && (
        <AdditionalDetailsModal
          isOpen={!!additionalDetailsItem}
          onClose={() => setAdditionalDetailsItem(null)}
          // Always pass the current line item from state to ensure fresh data
          lineItem={state.lineItems.find(li => li.tempId === additionalDetailsItem.tempId) || additionalDetailsItem}
          onSave={(updates) => {
            state.updateLineItem(additionalDetailsItem.tempId, updates);
            setAdditionalDetailsItem(null);
          }}
          onLiveUpdate={(updates) => {
            state.updateLineItem(additionalDetailsItem.tempId, updates);
            // Update local state to match
            setAdditionalDetailsItem((prev) => {
              if (!prev) return null;
              // Get fresh item from state after update
              const currentItem = state.lineItems.find(li => li.tempId === prev.tempId);
              return currentItem ? { ...currentItem, ...updates } : { ...prev, ...updates };
            });
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Delete Statement?
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Are you sure you want to delete statement "{state.statementNumber}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
