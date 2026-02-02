/**
 * CheckDetailContent Component
 * Main container for check detail
 */

'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFlowChat } from '@/contexts/FlowChatContext';
import { useCheckDetailState } from './hooks';
import { usePostedStatement } from '@/components/orders/api/checksApi';
import type { PostedStatement } from '@/components/orders/api/checksApi';
import type { ColumnKey } from './types';
import { formatCurrency } from './utils';
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
import { FilesTab } from '@/components/shared/FilesTab';
import {
  PostedStatementModal,
  RepSplitsModal,
  ColumnsModal,
  LineItemDetailModal,
  AddLineItemModal,
  OrderDetailModal,
} from './components/modals';
import {
  AdjustmentModal,
  AdjustmentDetailModal,
  DeleteConfirmModal,
} from '@/components/orders/detail/components/modals';
import { useAdjustmentsState } from '@/components/orders/detail/hooks/useAdjustmentsState';
import { getTabsConfig } from './config/tabsConfig';
import { SAVED_VIEWS, getDefaultView } from './config/viewsConfig';
import { useUnsavedChangesGuard } from '@/components/shared/hooks/useUnsavedChangesGuard';
import { useUnsavedChangesContext } from '@/contexts/UnsavedChangesContext';

interface CheckDetailContentProps {
  checkId: string;
}

export default function CheckDetailContent({
  checkId,
}: CheckDetailContentProps) {
  const router = useRouter();
  const state = useCheckDetailState({ checkId });
  const { setFullEntityContext } = useFlowChat();
  const { requestNavigation, hasUnsavedChanges, clearUnsavedChanges } = useUnsavedChangesContext();

  // Sub-tab state for line-items tab
  const [lineItemsSubTab, setLineItemsSubTab] = useState<'invoices' | 'adjustments'>('invoices');

  // Adjustments state management - reuse from orders
  const adjustmentsState = useAdjustmentsState();

  // Fetch posted statement data when modal is shown and check is posted
  // Note: we call this unconditionally to respect React hooks rules
  const showPostedModal = state?.showPostedStatementModal ?? false;
  const isPostedStatus = state?.status === 'posted';
  const {
    data: postedStatement,
    isLoading: isLoadingPostedStatement,
    error: postedStatementError,
  } = usePostedStatement(
    checkId !== 'new' ? checkId : null,
    showPostedModal && isPostedStatus
  );

  // Set full entity context for global chatbot (type, id, and check number)
  useEffect(() => {
    if (state?.checkNumber && checkId) {
      setFullEntityContext('commission', checkId, state.checkNumber);
    }
    return () => {
      setFullEntityContext(null, null, null);
    };
  }, [state?.checkNumber, checkId, setFullEntityContext]);

  // Excel export using posted statement data from API
  // This useCallback must be defined before any early returns to respect React hooks rules
  const handleDownloadExcel = useCallback(() => {
    if (!state) return;

    // If postedStatement has a presigned URL, download from there
    if (postedStatement?.presignedUrl) {
      const link = document.createElement('a');
      link.href = postedStatement.presignedUrl;
      link.download = `Posted_Statement_${postedStatement.header?.checkNumber || state.checkNumber || 'Check'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Fallback: If no presigned URL, show a message (backend should always provide URL)
    console.warn('No presigned URL available from backend for posted statement');
  }, [postedStatement, state]);

  // Wrapper for save handler to return boolean for unsaved changes guard
  const handleSaveForGuard = useCallback(async (): Promise<boolean> => {
    if (!state?.handleSave) return false;
    try {
      await state.handleSave();
      return true;
    } catch {
      return false;
    }
  }, [state]);

  // Unsaved changes guard - must be before any early returns
  useUnsavedChangesGuard({
    entityType: 'Check',
    entityId: state?.isCreateMode ? null : checkId,
    entityName: state?.checkNumber || null,
    hasChanges: state?.hasChanges || false,
    onSave: handleSaveForGuard,
  });

  // Handle back navigation with unsaved changes check
  const handleBack = () => {
    if (hasUnsavedChanges) {
      const canNavigate = requestNavigation('/commissions', 'back');
      if (!canNavigate) {
        return; // Navigation blocked, modal will be shown
      }
    }
    router.push('/commissions');
  };

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

  const handleSaveAsNewVersion = () => {
    alert('Save as New Version');
  };

  return (
    <main className="h-full overflow-auto bg-[var(--background)]">
      {/* Header Top Bar */}
      <HeaderTopBar
        check={state.check}
        status={state.status}
        showActionsDropdown={state.showActionsDropdown}
        setShowActionsDropdown={state.setShowActionsDropdown}
        showVersionDropdown={state.showVersionDropdown}
        setShowVersionDropdown={state.setShowVersionDropdown}
        showSaveDropdown={state.showSaveDropdown}
        setShowSaveDropdown={state.setShowSaveDropdown}
        showPostedStatementDropdown={state.showPostedStatementDropdown}
        setShowPostedStatementDropdown={state.setShowPostedStatementDropdown}
        currentVersion={state.currentVersion}
        availableVersions={state.availableVersions}
        onExportCheckDetails={handleExportCheckDetails}
        onReconcileCheck={handleReconcileCheck}
        onSeePostedStatement={handleSeePostedStatement}
        onDownloadExcel={handleDownloadExcel}
        onSave={state.handleSave}
        onSaveAndClose={state.handleSaveAndClose}
        onSaveAsNewVersion={handleSaveAsNewVersion}
        onPost={state.handlePost}
        onUnpost={state.handleUnpost}
        onDelete={state.openDeleteConfirmModal}
        isCreateMode={state.isCreateMode}
        isSaving={state.isSaving}
        isPosting={state.isPosting}
        isUnposting={state.isUnposting}
        isDeleting={state.isDeleting}
        isOriginallyPosted={state.isOriginallyPosted}
        hasChanges={state.hasChanges}
        onBack={handleBack}
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
        onOpenInvoicesLoaded={state.handleOpenInvoicesLoaded}
      />

      {/* Main Content Area with Tabs */}
      <div>
        <div className="p-6">
          {/* Tabs */}
          <div className="flex items-center justify-between gap-1 mb-6 border-b border-[var(--border)] bg-white -mx-6 px-6 pt-4 -mt-6">
            <div className="flex gap-1">
              {getTabsConfig(state.lineItems.length, state.adjustments.length, state.isCreateMode).map(
                (tab) => (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && !tab.comingSoon && state.setActiveTab(tab.id)}
                    disabled={tab.disabled || tab.comingSoon}
                    title={tab.disabled ? tab.disabledReason : tab.comingSoon ? 'Coming soon' : undefined}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      tab.disabled || tab.comingSoon
                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                        : state.activeTab === tab.id
                        ? 'border-[var(--primary)] text-[var(--primary)]'
                        : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {tab.label}
                    {tab.comingSoon && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                        SOON
                      </span>
                    )}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${tab.disabled ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              )}
              {state.isCreateMode && (
                <span className="ml-auto text-xs text-[var(--muted-foreground)] italic pr-2">
                  Some tabs will unlock after saving
                </span>
              )}
            </div>

          </div>

          {/* Tab Content */}
          {state.activeTab === 'line-items' && (() => {
            const invoiceCreditItems = state.lineItems.filter(item => item.type !== 'adjustment');
            const adjustmentLineItems = state.lineItems.filter(item => item.type === 'adjustment');
            const allAdjustmentCount = state.deductionAdjustments.length + adjustmentLineItems.length;

            return (
            <div>
              {/* Sub-tabs: Invoices/Credits and Adjustments */}
              <div className="flex items-center gap-1 mb-4">
                <button
                  onClick={() => setLineItemsSubTab('invoices')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    lineItemsSubTab === 'invoices'
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-gray-100 text-[var(--muted-foreground)] hover:bg-gray-200'
                  }`}
                >
                  Invoices / Credits
                  {invoiceCreditItems.length > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                      lineItemsSubTab === 'invoices' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {invoiceCreditItems.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setLineItemsSubTab('adjustments')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    lineItemsSubTab === 'adjustments'
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-gray-100 text-[var(--muted-foreground)] hover:bg-gray-200'
                  }`}
                >
                  Adjustments
                  {allAdjustmentCount > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                      lineItemsSubTab === 'adjustments' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {allAdjustmentCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Invoices/Credits sub-tab */}
              {lineItemsSubTab === 'invoices' && (
                <LineItemsTable
                  lineItems={invoiceCreditItems}
                  visibleColumns={state.visibleColumns}
                  commissionSource={state.commissionSource}
                  status={state.status}
                  onTogglePaid={state.togglePaid}
                  onAddNewLine={state.addNewLine}
                  onRowClick={state.openLineItemDetail}
                  onUpdateStatedCommission={state.updateLineItemAmount}
                  onOrderClick={state.openOrderDetail}
                  isPinned={state.isPinned}
                  getPinnedColumnStyle={state.getPinnedColumnStyle}
                  activeView={state.activeView}
                  showViewsMenu={state.showViewsMenu}
                  onToggleViewsMenu={() => state.setShowViewsMenu(!state.showViewsMenu)}
                  onSelectView={(viewId) => {
                    const view = SAVED_VIEWS.find((v) => v.id === viewId);
                    if (view) {
                      const newConfig = state.columnConfig.map(col => ({
                        ...col,
                        visible: view.columns.includes(col.key as ColumnKey),
                      }));
                      state.setColumnConfig(newConfig);
                      state.setActiveView(viewId);
                      state.setShowViewsMenu(false);
                    }
                  }}
                  onOpenColumnsModal={() => state.setShowColumnsModal(true)}
                  onDelete={state.deleteLineItem}
                  onZeroAllStatedCommissions={state.zeroAllStatedCommissions}
                />
              )}

              {/* Adjustments sub-tab */}
              {lineItemsSubTab === 'adjustments' && (
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
                  {allAdjustmentCount === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                      No adjustments on this check.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[var(--card)] sticky top-0 z-10">
                          <tr className="border-b border-[var(--border)]">
                            <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Number</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-[var(--foreground)]">Reason</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-[var(--foreground)]">Amount</th>
                            <th className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)]">Status</th>
                            {state.status !== 'posted' && (
                              <th className="px-4 py-3 text-center text-sm font-medium text-[var(--foreground)] w-10"></th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Unsaved adjustment line items */}
                          {adjustmentLineItems.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                              onClick={() => state.openLineItemDetail(item)}
                            >
                              <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                                <div className="flex items-center gap-2">
                                  {item.number || item.id.substring(0, 8)}
                                  {item.isNew && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-700 border border-emerald-300 uppercase tracking-wide">
                                      New
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                                {item.entityDate
                                  ? new Date(item.entityDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                                {item.reason || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium">
                                <span className={item.paidCommission < 0 ? 'text-red-500' : 'text-[var(--foreground)]'}>
                                  {formatCurrency(item.paidCommission)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                                  Unsaved
                                </span>
                              </td>
                              {state.status !== 'posted' && (
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      state.deleteLineItem(item.id);
                                    }}
                                    className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Remove from check"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                          {/* Saved adjustments from API */}
                          {state.deductionAdjustments.map((adj) => (
                            <tr
                              key={adj.id}
                              className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
                              onClick={() => {
                                const fullAdj = adjustmentsState.adjustments?.find(
                                  (a) => a.id === adj.id
                                );
                                if (fullAdj) {
                                  adjustmentsState.viewAdjustment(fullAdj);
                                }
                              }}
                            >
                              <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                                {adj.adjustmentNumber || adj.id.substring(0, 8)}
                              </td>
                              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                                {adj.entityDate
                                  ? new Date(adj.entityDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                                {adj.reason || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium">
                                <span className={parseFloat(adj.amount || '0') < 0 ? 'text-red-500' : 'text-[var(--foreground)]'}>
                                  {formatCurrency(parseFloat(adj.amount || '0'))}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  adj.status === 'POSTED'
                                    ? 'bg-green-100 text-green-700'
                                    : adj.status === 'VOID'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {adj.status || 'Pending'}
                                </span>
                              </td>
                              {state.status !== 'posted' && (
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      state.removeDeductionAdjustment(adj.id);
                                    }}
                                    className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Remove from check"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-[var(--border)] bg-[var(--muted)]/20">
                            <td colSpan={3} className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                              Total
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-[var(--foreground)]">
                              {formatCurrency(
                                adjustmentLineItems.reduce((sum, item) => sum + item.paidCommission, 0) +
                                state.deductionAdjustments.reduce(
                                  (sum, adj) => sum + (parseFloat(adj.amount || '0') || 0),
                                  0
                                )
                              )}
                            </td>
                            <td />
                            {state.status !== 'posted' && <td />}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })()}

          {/* Files Tab */}
          {state.activeTab === 'files' && (
            <FilesTab
              entityId={checkId}
              entityType="CHECK"
            />
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

          {state.activeTab === 'notes' && <NotesTab checkId={checkId} />}

          {state.activeTab === 'tasks' && <TasksTab checkId={checkId} />}

          {state.activeTab === 'activity' && <ActivityTab />}

          {state.activeTab === 'linked-objects' && <LinkedObjectsTab checkId={checkId} />}

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
          checkId={checkId}
          postedStatement={postedStatement}
          isLoading={isLoadingPostedStatement}
          error={postedStatementError}
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

      <ColumnsModal
        isOpen={state.showColumnsModal}
        onClose={() => state.setShowColumnsModal(false)}
        columnConfig={state.columnConfig}
        onColumnConfigChange={state.setColumnConfig}
      />

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

      {/* Order Detail Modal */}
      {state.showOrderDetailModal && state.selectedOrderId && (
        <OrderDetailModal
          orderId={state.selectedOrderId}
          onClose={state.closeOrderDetail}
        />
      )}

      {/* Delete Confirmation Modal for Check */}
      <DeleteConfirmModal
        isOpen={state.showDeleteConfirmModal}
        title="Delete Check?"
        message="Are you sure you want to delete check"
        itemName={state.checkNumber || state.check?.checkNumber}
        isPending={state.isDeleting}
        onConfirm={state.handleDelete}
        onCancel={state.closeDeleteConfirmModal}
      />
    </main>
  );
}

