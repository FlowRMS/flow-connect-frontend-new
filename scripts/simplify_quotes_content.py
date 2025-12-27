#!/usr/bin/env python3
"""
Simplify QuotesContent.tsx to only contain the minimal state needed.
LinesTab now manages its own internal UI state.
"""

output_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

content = '''\'use client\';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, closestCorners } from '@dnd-kit/core';

// Import types from quotes module
import type {
  Quote,
  LineItem,
  Section,
  Recipient,
  DistributorQuote,
  QuoteFile,
} from './quotes/types';

// Import mock data from quotes module
import {
  mockQuotes,
  mockSections,
  mockLineItems,
  mockQuoteFiles,
  mockDistributorQuotes,
  availableOutsideReps,
  availableInsideReps,
  initialProductCatalog,
} from './quotes/data';

// Import UI components from quotes module
import {
  QuotesListHeader,
  QuotesKanbanView,
  QuotesListView,
  QuoteDetailHeader,
  PricingSummaryBar,
  HeaderFieldsSection,
  QuoteDetailTabs,
  QuoteDetailModals,
} from './quotes/components';

// Import config
import { defaultPriceLevels, lostReasonOptions } from './quotes/config';

// Import hooks
import { useQuotesListFilters, useKanbanDnD } from './quotes/hooks';

// Import tabs
import {
  NotesTab,
  TasksTab,
  ActivityTab,
  VersionsTab,
  LinkedObjectsTab,
  SubmittalsTab,
  SettingsTab,
  ApprovalsTab,
  RecipientsTab,
  LinesTab,
} from './quotes/tabs';

// Submittals imports
import { mockSubmittals } from '../lib/data/submittals-mock';
import type { Submittal } from '../lib/types/submittals';

// ============================================
// MAIN COMPONENT
// ============================================

export default function QuotesContent() {
  const router = useRouter();

  // ========================================
  // VIEW STATE
  // ========================================
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [detailTab, setDetailTab] = useState<'lines' | 'approvals' | 'recipients' | 'distributors' | 'linkedObjects' | 'versions' | 'notes' | 'tasks' | 'activity' | 'settings' | 'submittals'>('lines');

  // ========================================
  // KANBAN STATE (from hook)
  // ========================================
  const {
    activeId,
    sensors,
    stages,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    activeQuote,
  } = useKanbanDnD(quotes, setQuotes);

  // ========================================
  // QUOTES LIST FILTERS (from hook)
  // ========================================
  const {
    sortedQuotes,
    quotesSortColumn,
    quotesSortDirection,
    handleQuotesSort,
    quickDatePreset,
    setQuickDatePreset,
    quickDateField,
    setQuickDateField,
    showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown,
    quoteColumnFilters,
    activeQuoteFilterColumn,
    setActiveQuoteFilterColumn,
    filterSearchText,
    setFilterSearchText,
    handleQuoteFilterChange,
    clearQuoteFilter,
    getUniqueValuesForColumn,
    getFilterType,
    hasActiveFilter,
  } = useQuotesListFilters(quotes);

  // ========================================
  // QUOTE DETAIL STATE
  // ========================================
  const [quoteLineItems, setQuoteLineItems] = useState<LineItem[]>(mockLineItems);
  const [quoteSections, setQuoteSections] = useState<Section[]>(mockSections);
  const [quoteFiles, setQuoteFiles] = useState<QuoteFile[]>(mockQuoteFiles);

  // Recipients
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [recipientQuoteVersion, setRecipientQuoteVersion] = useState(1);

  // Distributor quotes
  const [quoteDistributorQuotes, setQuoteDistributorQuotes] = useState<DistributorQuote[]>(mockDistributorQuotes);
  const [selectedDistributorQuote, setSelectedDistributorQuote] = useState<DistributorQuote | null>(null);
  const [showDistributorModal, setShowDistributorModal] = useState(false);

  // ========================================
  // QUOTE SETTINGS
  // ========================================
  const [quoteViewMode, setQuoteViewMode] = useState<'overage' | 'simple'>('simple');
  const [showEndUserPerLine, setShowEndUserPerLine] = useState(false);
  const [showCommissionSplits, setShowCommissionSplits] = useState(false);
  const [showInsideRepSplits, setShowInsideRepSplits] = useState(false);
  const [showSections, setShowSections] = useState(false);
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [sectionDisplayMode, setSectionDisplayMode] = useState<'column' | 'lineShelf'>('column');
  const [customerPartNumberSource, setCustomerPartNumberSource] = useState<'soldTo' | 'endUser'>('soldTo');
  const [quotePriceLevels, setQuotePriceLevels] = useState(defaultPriceLevels);

  // Product catalog (shared between components)
  const [productCatalog, setProductCatalog] = useState(initialProductCatalog);

  // Spec sheet selections (for approvals)
  const [specSheetSelections, setSpecSheetSelections] = useState<Set<string>>(new Set());

  // ========================================
  // HEADER STATE
  // ========================================
  const [headerEndUser, setHeaderEndUser] = useState('');
  const [endUserSameAsCustomer, setEndUserSameAsCustomer] = useState(true);
  const [quoteOutsideRep, setQuoteOutsideRep] = useState('');
  const [quoteInsideRep, setQuoteInsideRep] = useState('');
  const [splitCommission, setSplitCommission] = useState(false);
  const [splitInsideCommission, setSplitInsideCommission] = useState(false);
  const [repCommissionSplits, setRepCommissionSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);
  const [insideRepCommissionSplits, setInsideRepCommissionSplits] = useState<{repId: string; repName: string; percentage: number}[]>([]);
  const [showRepSplitsModal, setShowRepSplitsModal] = useState(false);
  const [showInsideRepSplitsModal, setShowInsideRepSplitsModal] = useState(false);

  // ========================================
  // DROPDOWN STATES
  // ========================================
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // ========================================
  // MODAL STATES
  // ========================================
  const [showDuplicateQuoteModal, setShowDuplicateQuoteModal] = useState(false);
  const [showCreateOrderFromQuoteModal, setShowCreateOrderFromQuoteModal] = useState(false);
  const [showMarkAsLostModal, setShowMarkAsLostModal] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [showApprovalRequestModal, setShowApprovalRequestModal] = useState(false);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [showMarkApprovalModal, setShowMarkApprovalModal] = useState(false);

  // Duplicate quote state
  const [duplicateQuoteNumber, setDuplicateQuoteNumber] = useState('');
  const [duplicateCustomer, setDuplicateCustomer] = useState('');
  const [duplicatePercentIncrease, setDuplicatePercentIncrease] = useState(0);
  const [duplicateCopyNotes, setDuplicateCopyNotes] = useState(true);

  // Create order state
  const [createOrderSelectAll, setCreateOrderSelectAll] = useState(true);
  const [createOrderSelectedItems, setCreateOrderSelectedItems] = useState<{id: string; selected: boolean; quantity: number}[]>([]);

  // Lost reason state
  const [lostReason, setLostReason] = useState('');
  const [customLostReason, setCustomLostReason] = useState('');
  const [lostReasons, setLostReasons] = useState(lostReasonOptions);
  const [showAddReasonInput, setShowAddReasonInput] = useState(false);
  const [newReasonText, setNewReasonText] = useState('');

  // Bulk selection
  const [selectedQuotesForBulk, setSelectedQuotesForBulk] = useState<Set<string>>(new Set());
  const [showQuotesBulkActionsMenu, setShowQuotesBulkActionsMenu] = useState(false);

  // PDF state
  const [generatedPdfData, setGeneratedPdfData] = useState<{
    manufacturer: string;
    builder: string;
    project: string;
    products: { sku: string; description: string; qty: number; value: number }[];
    justification: string;
    totalValue: number;
  } | null>(null);
  const [pdfTemplate, setPdfTemplate] = useState({
    companyLogo: true,
    companyName: 'FlowConnect Lighting',
    companyAddress: '123 Main Street, Suite 400\\nAnytown, ST 12345',
    includeProjectDetails: true,
    includeProductList: true,
    includeSpecSheets: true,
    includeJustification: true,
    headerText: 'Manufacturer Approval Request',
    footerText: 'Thank you for your consideration. Please respond within 5 business days.',
    customMessage: '',
  });

  // ========================================
  // SUBMITTALS STATE
  // ========================================
  const [submittals, setSubmittals] = useState<Submittal[]>(mockSubmittals);
  const [showCreateSubmittalModal, setShowCreateSubmittalModal] = useState(false);
  const [editingSubmittalId, setEditingSubmittalId] = useState<string | null>(null);
  const [showSubmittalConfigModal, setShowSubmittalConfigModal] = useState(false);
  const [selectedSubmittalForDetail, setSelectedSubmittalForDetail] = useState<Submittal | null>(null);
  const [printSubmittal, setPrintSubmittal] = useState<Submittal | null>(null);

  // ========================================
  // COMPUTED VALUES
  // ========================================
  const totals = useMemo(() => {
    const baseTotal = quoteLineItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);
    const sellTotal = quoteLineItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    const l1Total = quoteLineItems.reduce((sum, item) => sum + (item.level1Price * item.quantity), 0);
    const l2Total = quoteLineItems.reduce((sum, item) => sum + (item.level2Price * item.quantity), 0);
    const l3Total = quoteLineItems.reduce((sum, item) => sum + (item.level3Price * item.quantity), 0);
    const overage = sellTotal - baseTotal;
    const commission = quoteLineItems.reduce((sum, item) => {
      const commRate = item.manufacturers?.[0]?.commissionRate || 0;
      return sum + (item.sellPrice * item.quantity * commRate / 100);
    }, 0);
    return { baseTotal, sellTotal, l1Total, l2Total, l3Total, overage, commission };
  }, [quoteLineItems]);

  // ========================================
  // HANDLERS
  // ========================================
  const handleQuoteSelect = useCallback((quote: Quote) => {
    setSelectedQuote(quote);
    setDetailTab('lines');
  }, []);

  const handleMarkAsLost = useCallback(() => {
    if (selectedQuote) {
      setSelectedQuotesForBulk(new Set([selectedQuote.id]));
      setShowMarkAsLostModal(true);
    }
  }, [selectedQuote]);

  // ========================================
  // RENDER
  // ========================================

  // Quotes list view (no quote selected)
  if (!selectedQuote) {
    return (
      <div className="flex flex-col h-full">
        <QuotesListHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          quotesCount={quotes.length}
          selectedQuotesCount={selectedQuotesForBulk.size}
          showQuotesBulkActionsMenu={showQuotesBulkActionsMenu}
          setShowQuotesBulkActionsMenu={setShowQuotesBulkActionsMenu}
          setShowMarkAsLostModal={setShowMarkAsLostModal}
          quickDatePreset={quickDatePreset}
          setQuickDatePreset={setQuickDatePreset}
          quickDateField={quickDateField}
          setQuickDateField={setQuickDateField}
          showQuickDateFieldDropdown={showQuickDateFieldDropdown}
          setShowQuickDateFieldDropdown={setShowQuickDateFieldDropdown}
        />

        <div className="flex-1 overflow-hidden">
          {viewMode === 'kanban' ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <QuotesKanbanView
                stages={stages}
                quotes={quotes}
                activeId={activeId}
                activeQuote={activeQuote}
                onSelectQuote={handleQuoteSelect}
              />
            </DndContext>
          ) : (
            <QuotesListView
              quotes={sortedQuotes}
              selectedQuotesForBulk={selectedQuotesForBulk}
              setSelectedQuotesForBulk={setSelectedQuotesForBulk}
              onSelectQuote={handleQuoteSelect}
              sortColumn={quotesSortColumn}
              sortDirection={quotesSortDirection}
              onSort={handleQuotesSort}
              columnFilters={quoteColumnFilters}
              activeFilterColumn={activeQuoteFilterColumn}
              setActiveFilterColumn={setActiveQuoteFilterColumn}
              filterSearchText={filterSearchText}
              setFilterSearchText={setFilterSearchText}
              onFilterChange={handleQuoteFilterChange}
              clearFilter={clearQuoteFilter}
              getUniqueValues={getUniqueValuesForColumn}
              getFilterType={getFilterType}
              hasActiveFilter={hasActiveFilter}
            />
          )}
        </div>
      </div>
    );
  }

  // Quote detail view
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <QuoteDetailHeader
        selectedQuote={selectedQuote}
        setSelectedQuote={setSelectedQuote}
        quotes={quotes}
        setQuotes={setQuotes}
        totals={totals}
        showStageDropdown={showStageDropdown}
        setShowStageDropdown={setShowStageDropdown}
        showTypeDropdown={showTypeDropdown}
        setShowTypeDropdown={setShowTypeDropdown}
        showVersionDropdown={showVersionDropdown}
        setShowVersionDropdown={setShowVersionDropdown}
        showActionsDropdown={showActionsDropdown}
        setShowActionsDropdown={setShowActionsDropdown}
        setShowDuplicateQuoteModal={setShowDuplicateQuoteModal}
        setShowCreateOrderFromQuoteModal={setShowCreateOrderFromQuoteModal}
        quoteViewMode={quoteViewMode}
      />

      <HeaderFieldsSection
        selectedQuote={selectedQuote}
        showEndUserPerLine={showEndUserPerLine}
        showCommissionSplits={showCommissionSplits}
        showInsideRepSplits={showInsideRepSplits}
        endUserSameAsCustomer={endUserSameAsCustomer}
        setEndUserSameAsCustomer={setEndUserSameAsCustomer}
        headerEndUser={headerEndUser}
        setHeaderEndUser={setHeaderEndUser}
        quoteOutsideRep={quoteOutsideRep}
        setQuoteOutsideRep={setQuoteOutsideRep}
        quoteInsideRep={quoteInsideRep}
        setQuoteInsideRep={setQuoteInsideRep}
        splitCommission={splitCommission}
        setSplitCommission={setSplitCommission}
        splitInsideCommission={splitInsideCommission}
        setSplitInsideCommission={setSplitInsideCommission}
        repCommissionSplits={repCommissionSplits}
        setRepCommissionSplits={setRepCommissionSplits}
        insideRepCommissionSplits={insideRepCommissionSplits}
        setInsideRepCommissionSplits={setInsideRepCommissionSplits}
        availableOutsideReps={availableOutsideReps}
        availableInsideReps={availableInsideReps}
        setShowRepSplitsModal={setShowRepSplitsModal}
        setShowInsideRepSplitsModal={setShowInsideRepSplitsModal}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col p-6 min-w-0 overflow-hidden">
          <QuoteDetailTabs
            selectedQuote={selectedQuote}
            quoteLineItemsCount={quoteLineItems.length}
            quoteViewMode={quoteViewMode}
            detailTab={detailTab}
            setDetailTab={setDetailTab}
            showViewsMenu={false}
            setShowViewsMenu={() => {}}
            showColumnsMenu={false}
            setShowColumnsMenu={() => {}}
            savedViews={[]}
            activeView=""
            applyView={() => {}}
            deleteView={() => {}}
            setShowSaveViewModal={() => {}}
            showSections={showSections}
            setShowSectionsModal={setShowSectionsModal}
            effectiveVisibleColumnsSize={0}
          />

          {/* Line Items Tab */}
          {detailTab === 'lines' && (
            <LinesTab
              selectedQuote={selectedQuote}
              quoteLineItems={quoteLineItems}
              setQuoteLineItems={setQuoteLineItems}
              quoteSections={quoteSections}
              setQuoteSections={setQuoteSections}
              totals={totals}
              quoteViewMode={quoteViewMode}
              setQuoteViewMode={setQuoteViewMode}
              showEndUserPerLine={showEndUserPerLine}
              showCommissionSplits={showCommissionSplits}
              showInsideRepSplits={showInsideRepSplits}
              showSections={showSections}
              setShowSections={setShowSections}
              sectionDisplayMode={sectionDisplayMode}
              recipients={recipients}
              selectedRecipient={selectedRecipient}
              setSelectedRecipient={setSelectedRecipient}
              recipientQuoteVersion={recipientQuoteVersion}
              setRecipientQuoteVersion={setRecipientQuoteVersion}
              productCatalog={productCatalog}
              setProductCatalog={setProductCatalog}
              quotePriceLevels={quotePriceLevels}
              specSheetSelections={specSheetSelections}
              setSpecSheetSelections={setSpecSheetSelections}
              onMarkAsLost={handleMarkAsLost}
            />
          )}

          {/* Approvals Tab */}
          {detailTab === 'approvals' && (
            <ApprovalsTab
              selectedQuote={selectedQuote}
              quoteLineItems={quoteLineItems}
              approvalRequests={[]}
              onSetGeneratedPdfData={setGeneratedPdfData}
              onShowPdfPreviewModal={() => setShowPdfPreviewModal(true)}
              onShowEditTemplateModal={() => setShowEditTemplateModal(true)}
              onShowSendEmailModal={() => setShowSendEmailModal(true)}
              onShowMarkApprovalModal={() => setShowMarkApprovalModal(true)}
              onShowApprovalRequestModal={() => setShowApprovalRequestModal(true)}
            />
          )}

          {/* Recipients Tab */}
          {detailTab === 'recipients' && (
            <RecipientsTab
              quoteLineItems={quoteLineItems}
              selectedQuote={selectedQuote}
              totals={totals}
              quoteDistributorQuotes={quoteDistributorQuotes}
              onShowDistributorModal={() => setShowDistributorModal(true)}
              onShowApprovalRequestModal={() => setShowApprovalRequestModal(true)}
              onSelectRecipient={(recipient, version) => {
                setSelectedRecipient(recipient);
                setRecipientQuoteVersion(version);
                setDetailTab('lines');
              }}
              onSelectDistributorQuote={setSelectedDistributorQuote}
            />
          )}

          {/* Versions Tab */}
          {detailTab === 'versions' && <VersionsTab onShowRevertModal={() => setShowRevertModal(true)} />}

          {/* Linked Objects Tab */}
          {detailTab === 'linkedObjects' && <LinkedObjectsTab />}

          {/* Notes Tab */}
          {detailTab === 'notes' && <NotesTab />}

          {/* Tasks Tab */}
          {detailTab === 'tasks' && <TasksTab />}

          {/* Activity Tab */}
          {detailTab === 'activity' && <ActivityTab />}

          {/* Submittals Tab */}
          {detailTab === 'submittals' && (
            <SubmittalsTab
              submittals={submittals}
              selectedQuoteId={selectedQuote.id}
              onSetPrintSubmittal={setPrintSubmittal}
              onShowCreateSubmittalModal={() => setShowCreateSubmittalModal(true)}
              onEditSubmittal={(id) => { setEditingSubmittalId(id); setShowSubmittalConfigModal(true); }}
              onSelectSubmittalForDetail={setSelectedSubmittalForDetail}
            />
          )}

          {/* Settings Tab */}
          {detailTab === 'settings' && (
            <SettingsTab
              showEndUserPerLine={showEndUserPerLine}
              setShowEndUserPerLine={setShowEndUserPerLine}
              showCommissionSplits={showCommissionSplits}
              setShowCommissionSplits={setShowCommissionSplits}
              showInsideRepSplits={showInsideRepSplits}
              setShowInsideRepSplits={setShowInsideRepSplits}
              customerPartNumberSource={customerPartNumberSource}
              setCustomerPartNumberSource={setCustomerPartNumberSource}
              quotePriceLevels={quotePriceLevels}
              setQuotePriceLevels={setQuotePriceLevels}
            />
          )}
        </div>
      </div>

      {/* Modals would go here - using QuoteDetailModals component */}
    </div>
  );
}
'''

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Created simplified QuotesContent.tsx")
print(f"Line count: {len(content.split(chr(10)))}")
