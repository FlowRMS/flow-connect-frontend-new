/**
 * CheckDetailContent Component
 * Main container for check detail
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCheckDetailState } from './hooks';
import { HeaderTopBar, PricingSummaryBar, CheckDetailsFields } from './components/header';
import { LineItemsTable } from './components/line-items';
import {
  NotesTab,
  TasksTab,
  ActivityTab,
  LinkedObjectsTab,
  DeductionsTab,
  SettingsTab,
} from './components/tabs';
import {
  PostedStatementModal,
  RepSplitsModal,
  ColumnsModal,
  LineItemDetailModal,
  AddLineItemModal,
} from './components/modals';
import {
  AdjustmentModal,
  AdjustmentDetailModal,
  DeleteConfirmModal,
} from '@/components/orders/detail/components/modals';
import { useAdjustmentsState } from '@/components/orders/detail/hooks/useAdjustmentsState';
import { getTabsConfig } from './config/tabsConfig';
import { SAVED_VIEWS, getDefaultView } from './config/viewsConfig';

interface CheckDetailContentProps {
  checkId: string;
}

export default function CheckDetailContent({
  checkId,
}: CheckDetailContentProps) {
  const router = useRouter();
  const state = useCheckDetailState({ checkId });

  // Adjustments state management - reuse from orders
  const adjustmentsState = useAdjustmentsState();

  // Loading state
  if (state?.isLoading) {
    return (
      <main className="flex-1 overflow-auto bg-[var(--background)] p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4" />
          <p className="text-[var(--muted-foreground)]">Loading check...</p>
        </div>
      </main>
    );
  }

  if (!state || !state.check) {
    return (
      <main className="flex-1 overflow-auto bg-[var(--background)] p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Check not found
          </h2>
          <p className="text-[var(--muted-foreground)] mt-2">
            The commission check you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push('/commissions')}
            className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Commissions
          </button>
        </div>
      </main>
    );
  }

  // Handler functions for HeaderTopBar
  const handleExportCheckDetails = () => {
    alert('Export Check Details');
  };

  const handleReconcileCheck = () => {
    alert('Reconcile Check');
  };

  const handleSeePostedStatement = () => {
    state.setShowPostedStatementModal(true);
  };

  const handleDownloadExcel = () => {
    alert('Downloading Excel...');
  };

  const handleSaveAsNewVersion = () => {
    alert('Save as New Version');
  };

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)] flex flex-col">
      {/* Header Top Bar */}
      <HeaderTopBar
        check={state.check}
        status={state.status}
        setStatus={state.setStatus}
        showActionsDropdown={state.showActionsDropdown}
        setShowActionsDropdown={state.setShowActionsDropdown}
        showStatusDropdown={state.showStatusDropdown}
        setShowStatusDropdown={state.setShowStatusDropdown}
        showVersionDropdown={state.showVersionDropdown}
        setShowVersionDropdown={state.setShowVersionDropdown}
        showSaveDropdown={state.showSaveDropdown}
        setShowSaveDropdown={state.setShowSaveDropdown}
        showPostedStatementDropdown={state.showPostedStatementDropdown}
        setShowPostedStatementDropdown={state.setShowPostedStatementDropdown}
        currentVersion={state.currentVersion}
        setCurrentVersion={state.setCurrentVersion}
        availableVersions={state.availableVersions}
        onExportCheckDetails={handleExportCheckDetails}
        onReconcileCheck={handleReconcileCheck}
        onSeePostedStatement={handleSeePostedStatement}
        onDownloadExcel={handleDownloadExcel}
        onSave={state.handleSave}
        onSaveAndClose={state.handleSaveAndClose}
        onSaveAsNewVersion={handleSaveAsNewVersion}
        isCreateMode={state.isCreateMode}
        isSaving={state.isSaving}
      />

      {/* Pricing Summary Bar */}
      <PricingSummaryBar
        status={state.status}
        summary={state.summary}
        totalAdjustments={state.totalAdjustments}
        commissionAmount={state.commissionAmount}
        isTotalStatedCommission={state.isTotalStatedCommission}
      />

      {/* Check Details Fields */}
      <CheckDetailsFields
        check={state.check}
        showHeaderFields={state.showHeaderFields}
        toggleHeaderFields={() =>
          state.setShowHeaderFields(!state.showHeaderFields)
        }
        status={state.status}
        isCreateMode={state.isCreateMode}
        factory={state.factory}
        factoryId={state.factoryId}
        setFactoryId={state.setFactoryId}
        setFactory={state.setFactory}
        checkNumber={state.checkNumber}
        setCheckNumber={state.setCheckNumber}
        checkDate={state.checkDate}
        setCheckDate={state.setCheckDate}
        postedDate={state.postedDate}
        setPostedDate={state.setPostedDate}
        commissionAmount={state.commissionAmount}
        setCommissionAmount={state.setCommissionAmount}
        isTotalStatedCommission={state.isTotalStatedCommission}
        setIsTotalStatedCommission={state.setIsTotalStatedCommission}
        isTiedToCommissionUpload={state.isTiedToCommissionUpload}
        commissionMonth={state.commissionMonth}
        setCommissionMonth={state.setCommissionMonth}
        summary={state.summary}
        totalAdjustments={state.totalAdjustments}
        selectedCheckNumbers={state.selectedCheckNumbers}
        setSelectedCheckNumbers={state.setSelectedCheckNumbers}
        showCheckNumbersDropdown={state.showCheckNumbersDropdown}
        setShowCheckNumbersDropdown={state.setShowCheckNumbersDropdown}
        checkNumberSearch={state.checkNumberSearch}
        setCheckNumberSearch={state.setCheckNumberSearch}
        unpaidInvoicesAfterDate={state.unpaidInvoicesAfterDate}
        setUnpaidInvoicesAfterDate={state.setUnpaidInvoicesAfterDate}
        includeAllUnpaid={state.includeAllUnpaid}
        setIncludeAllUnpaid={state.setIncludeAllUnpaid}
        ordersWithoutInvoicesAfterDate={state.ordersWithoutInvoicesAfterDate}
        setOrdersWithoutInvoicesAfterDate={
          state.setOrdersWithoutInvoicesAfterDate
        }
        includeAllOrdersWithoutInvoices={
          state.includeAllOrdersWithoutInvoices
        }
        setIncludeAllOrdersWithoutInvoices={
          state.setIncludeAllOrdersWithoutInvoices
        }
        filteredChecks={state.filteredChecks}
        currentCheckId={checkId}
      />

      {/* Main Content Area with Tabs */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col p-6 min-w-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between gap-1 mb-6 border-b border-[var(--border)] flex-shrink-0 bg-white -mx-6 px-6 pt-4 -mt-6">
            <div className="flex gap-1">
              {getTabsConfig(state.lineItems.length, state.adjustments.length).map(
                (tab) => (
                  <button
                    key={tab.id}
                    onClick={() => state.setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      state.activeTab === tab.id
                        ? 'border-[var(--primary)] text-[var(--primary)]'
                        : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              )}
            </div>

            {/* View Controls */}
            {state.activeTab === 'line-items' && (
              <div className="flex items-center gap-3 pb-2">
                {/* Views Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => state.setShowViewsMenu(!state.showViewsMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="14" height="14" rx="2" />
                      <path d="M3 8h14M8 8v9" />
                    </svg>
                    {SAVED_VIEWS.find((v) => v.id === state.activeView)?.name ||
                      getDefaultView().name}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M6 8l4 4 4-4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {state.showViewsMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => state.setShowViewsMenu(false)}
                      />
                      <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20">
                        <div className="p-2 border-b border-[var(--border)]">
                          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase px-2">
                            Saved Views
                          </p>
                        </div>
                        {SAVED_VIEWS.map((view) => (
                          <button
                            key={view.id}
                            onClick={() => {
                              state.setVisibleColumns(new Set(view.columns));
                              state.setActiveView(view.id);
                              state.setShowViewsMenu(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors flex items-center justify-between ${
                              state.activeView === view.id
                                ? 'text-[var(--primary)] font-medium'
                                : ''
                            }`}
                          >
                            {view.name}
                            {state.activeView === view.id && (
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 20 20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <path
                                  d="M5 10l3 3 7-7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Sections Button */}
                <button
                  onClick={() => state.setShowSectionsModal(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                    state.showSections
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'border-[var(--border)] hover:bg-[var(--muted)]'
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="14" height="4" rx="1" />
                    <rect x="3" y="10" width="14" height="7" rx="1" />
                  </svg>
                  Sections
                </button>

                {/* Columns Button */}
                <button
                  onClick={() => state.setShowColumnsModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M4 6h12M4 10h12M4 14h12"
                      strokeLinecap="round"
                    />
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
          {state.activeTab === 'line-items' && (
            <div className="flex-1 overflow-auto min-h-0">
              <LineItemsTable
                lineItems={state.lineItems}
                visibleColumns={state.visibleColumns}
                commissionSource={state.commissionSource}
                status={state.status}
                onTogglePaid={state.togglePaid}
                onAddNewLine={state.addNewLine}
                onRowClick={state.openLineItemDetail}
              />
            </div>
          )}

          {/* Other Tabs */}
          {state.activeTab === 'deductions' && (
            <DeductionsTab
              adjustments={adjustmentsState.adjustments}
              isLoading={adjustmentsState.isLoadingAdjustments}
              error={adjustmentsState.adjustmentsError}
              onAddAdjustment={adjustmentsState.openCreateAdjustmentModal}
              onViewAdjustment={adjustmentsState.viewAdjustment}
              onEditAdjustment={adjustmentsState.openEditAdjustmentModal}
              onDeleteAdjustment={adjustmentsState.handleDeleteAdjustment}
            />
          )}

          {state.activeTab === 'notes' && <NotesTab />}

          {state.activeTab === 'tasks' && <TasksTab />}

          {state.activeTab === 'activity' && <ActivityTab />}

          {state.activeTab === 'linked-objects' && <LinkedObjectsTab />}

          {state.activeTab === 'settings' && (
            <SettingsTab
              commissionSource={state.commissionSource}
              onSetCommissionSource={state.setCommissionSource}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {state.showPostedStatementModal && (
        <PostedStatementModal
          check={state.check}
          checkNumber={state.checkNumber}
          checkDate={state.checkDate}
          commissionMonth={state.commissionMonth}
          postedDate={state.postedDate}
          commissionAmount={state.commissionAmount}
          isTotalStatedCommission={state.isTotalStatedCommission}
          summary={state.summary}
          lineItems={state.lineItems}
          adjustments={state.adjustments}
          onClose={() => state.setShowPostedStatementModal(false)}
          onDownloadExcel={handleDownloadExcel}
        />
      )}

      {state.showRepSplitsModal && (
        <RepSplitsModal
          tempRepSplits={state.tempRepSplits}
          totalSplitPercentage={state.totalSplitPercentage}
          availableReps={state.availableReps}
          onAddRep={state.addRepToSplit}
          onRemoveRep={state.removeRepFromSplit}
          onUpdateRepSplit={state.updateRepSplit}
          onSave={state.saveRepSplits}
          onCancel={() => state.setShowRepSplitsModal(false)}
        />
      )}

      {state.showColumnsModal && (
        <ColumnsModal
          visibleColumns={state.visibleColumns}
          onToggleColumn={(column) => {
            state.setVisibleColumns((prev) => {
              const newSet = new Set(prev);
              if (newSet.has(column)) {
                newSet.delete(column);
              } else {
                newSet.add(column);
              }
              return newSet;
            });
          }}
          onClose={() => state.setShowColumnsModal(false)}
        />
      )}

      {/* Line Item Detail Modal */}
      {state.showLineItemDetailModal && state.selectedLineItem && (
        <LineItemDetailModal
          item={state.selectedLineItem}
          status={state.status}
          onClose={state.closeLineItemDetail}
          onTogglePaid={state.togglePaid}
          onDelete={state.deleteLineItem}
          onUpdateAmount={state.updateLineItemAmount}
        />
      )}

      {/* Add Line Item Modal */}
      {state.showAddLineItemModal && (
        <AddLineItemModal
          onClose={() => state.setShowAddLineItemModal(false)}
          onAdd={state.handleAddLineItem}
          factoryId={state.factoryId}
        />
      )}

      {/* Adjustments Modals - reused from orders */}
      <AdjustmentModal
        isOpen={adjustmentsState.showAdjustmentModal}
        onClose={adjustmentsState.closeAdjustmentModal}
        order={null}
        adjustment={adjustmentsState.adjustmentToEdit}
        onSubmit={adjustmentsState.handleSaveAdjustment}
        isLoading={adjustmentsState.isSavingAdjustment}
        isLoadingAdjustmentDetails={adjustmentsState.isLoadingAdjustmentDetails}
      />

      <AdjustmentDetailModal
        isOpen={adjustmentsState.showAdjustmentDetailModal}
        onClose={adjustmentsState.closeAdjustmentDetailModal}
        adjustment={adjustmentsState.selectedAdjustment}
        onEdit={adjustmentsState.editAdjustmentFromDetail}
        onDelete={adjustmentsState.deleteAdjustmentFromDetail}
        isDeleting={adjustmentsState.isDeletingAdjustment}
      />

      {/* Delete Confirmation Modal for Adjustments */}
      <DeleteConfirmModal
        isOpen={adjustmentsState.showDeleteConfirmModal}
        title="Delete Adjustment?"
        message="Are you sure you want to delete adjustment"
        itemName={adjustmentsState.adjustmentToDelete?.adjustmentNumber || adjustmentsState.adjustmentToDelete?.id?.substring(0, 8)}
        isPending={adjustmentsState.isDeletingAdjustment}
        onConfirm={adjustmentsState.handleConfirmDelete}
        onCancel={adjustmentsState.closeDeleteConfirmModal}
      />
    </main>
  );
}

