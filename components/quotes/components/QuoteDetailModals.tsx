'use client';

import React from 'react';
import type { Quote, LineItem, Recipient, DistributorQuote, OutsideRepSplit, Manufacturer, DistributorQuoteLine, CrossAuditLog } from '../types';
import type { Submittal } from '../../../lib/types/submittals';
import type { Order } from '../../../lib/types/rms';

// Import modal components
import { CommissionSplitsModal } from '../modals/CommissionSplitsModal';
import { SectionsSettingsModal } from '../modals/SectionsSettingsModal';
import { GenericRepSplitsModal } from '../modals/GenericRepSplitsModal';
import { DuplicateQuoteModal } from '../modals/DuplicateQuoteModal';
import { CreateOrderFromQuoteModal } from '../modals/CreateOrderFromQuoteModal';
import { ColumnsConfigModal } from '../modals/ColumnsConfigModal';
import { MarkAsLostModal } from '../modals/MarkAsLostModal';
import { LineItemDetailsModal } from '../modals/LineItemDetailsModal';
import { ApprovalRequestModal } from '../modals/ApprovalRequestModal';
import { PdfPreviewModal } from '../modals/PdfPreviewModal';
import { EditTemplateModal } from '../modals/EditTemplateModal';
import { SendEmailModal } from '../modals/SendEmailModal';
import { MarkApprovalStatusModal } from '../modals/MarkApprovalStatusModal';
import { RevertVersionModal } from '../modals/RevertVersionModal';
import { GenerateDistributorQuotesModal } from '../modals/GenerateDistributorQuotesModal';
import { DistributorQuoteDetailModal } from '../modals/DistributorQuoteDetailModal';
import { RecipientQuoteDetailModal } from '../modals/RecipientQuoteDetailModal';
import { RepSplitModal } from '../modals/RepSplitModal';
import CreditModal from '../../CreditModal';
import QuotePdfPreviewModal from '../QuotePdfPreviewModal';
import ConvertQuoteToOrderModal from '../../orders/ConvertQuoteToOrderModal';
import CreateProductModal from '../CreateProductModal';
import CreateSubmittalModal from '../../submittals/CreateSubmittalModal';
import { SubmittalConfigModal } from '../modals/SubmittalConfigModal';
import SubmittalDetailPanel from '../../submittals/SubmittalDetailPanel';
import PrintSubmittalDialog, { PrintSettings } from '../../submittals/PrintSubmittalDialog';
import { defaultSubmittalConfig } from '../../../lib/types/submittals';

type ColumnKey = 'partNumber' | 'customerPartNumber' | 'description' | 'manufacturer' | 'quantity' | 'uom' | 'divisor' | 'unitPrice' | 'endUser' | 'sellTotal' | 'commissionPercent' | 'commission' | 'commissionTotal' | 'linkedOrder' | 'overage' | 'overageAmt' | 'commRate' | 'baseComm' | 'overageShare' | 'overageComm' | 'totalEarn' | 'effRate' | 'l1' | 'l2' | 'l3' | 'trend' | 'specSheet' | 'outsideReps' | 'commissionDiscountPercent' | 'commissionDiscountAmount' | 'lineDiscountPercent' | 'lineDiscountAmount' | 'leadTime';

interface Rep {
  id: string;
  name: string;
}

interface EndUserObj {
  id: string;
  name: string;
}

interface Totals {
  baseTotal: number;
  sellTotal: number;
  commission: number;
  overage: number;
  l1Total: number;
  l2Total: number;
  l3Total: number;
}

interface PdfTemplate {
  companyLogo: boolean;
  companyName: string;
  companyAddress: string;
  includeProjectDetails: boolean;
  includeProductList: boolean;
  includeSpecSheets: boolean;
  includeJustification: boolean;
  headerText: string;
  footerText: string;
  customMessage: string;
}

interface GeneratedPdfData {
  manufacturer: string;
  builder: string;
  project: string;
  products: { sku: string; description: string; qty: number; value: number }[];
  justification: string;
  totalValue: number;
}

interface QuoteDetailModalsProps {
  selectedQuote: Quote;
  quoteLineItems: LineItem[];
  setQuoteLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  setSelectedQuote: React.Dispatch<React.SetStateAction<Quote | null>>;
  totals: Totals;

  // Commission Splits Modal
  showCommissionSplitsModal: boolean;
  setShowCommissionSplitsModal: (show: boolean) => void;
  commissionSplitsModalItem: LineItem | null;
  setCommissionSplitsModalItem: (item: LineItem | null) => void;
  applyToAllLines: boolean;
  setApplyToAllLines: (apply: boolean) => void;
  availableOutsideReps: Rep[];
  availableInsideReps: Rep[];

  // Sections Settings Modal
  showSectionsModal: boolean;
  setShowSectionsModal: (show: boolean) => void;
  showSections: boolean;
  setShowSections: (show: boolean) => void;
  sectionDisplayMode: 'column' | 'lineShelf';
  setSectionDisplayMode: (mode: 'column' | 'lineShelf') => void;

  // Rep Commission Splits Modal
  showRepSplitsModal: boolean;
  setShowRepSplitsModal: (show: boolean) => void;
  repCommissionSplits: { repId: string; repName: string; percentage: number }[];
  setRepCommissionSplits: React.Dispatch<React.SetStateAction<{ repId: string; repName: string; percentage: number }[]>>;
  splitCommission: boolean;
  setSplitCommission: (split: boolean) => void;

  // Inside Rep Commission Splits Modal
  showInsideRepSplitsModal: boolean;
  setShowInsideRepSplitsModal: (show: boolean) => void;
  insideRepCommissionSplits: { repId: string; repName: string; percentage: number }[];
  setInsideRepCommissionSplits: React.Dispatch<React.SetStateAction<{ repId: string; repName: string; percentage: number }[]>>;
  splitInsideCommission: boolean;
  setSplitInsideCommission: (split: boolean) => void;

  // Line Item Rep Commission Splits Modal
  showLineItemRepSplitsModal: boolean;
  setShowLineItemRepSplitsModal: (show: boolean) => void;
  lineItemRepSplitsTarget: string | null;
  setLineItemRepSplitsTarget: (target: string | null) => void;
  lineItemRepSplits: { repId: string; repName: string; percentage: number }[];
  setLineItemRepSplits: React.Dispatch<React.SetStateAction<{ repId: string; repName: string; percentage: number }[]>>;

  // Line Item Inside Rep Commission Splits Modal
  showLineItemInsideRepSplitsModal: boolean;
  setShowLineItemInsideRepSplitsModal: (show: boolean) => void;
  lineItemInsideRepSplitsTarget: string | null;
  setLineItemInsideRepSplitsTarget: (target: string | null) => void;
  lineItemInsideRepSplits: { repId: string; repName: string; percentage: number }[];
  setLineItemInsideRepSplits: React.Dispatch<React.SetStateAction<{ repId: string; repName: string; percentage: number }[]>>;

  // Duplicate Quote Modal
  showDuplicateQuoteModal: boolean;
  setShowDuplicateQuoteModal: (show: boolean) => void;
  duplicateQuoteNumber: string;
  setDuplicateQuoteNumber: (num: string) => void;
  duplicateCustomer: string;
  setDuplicateCustomer: (customer: string) => void;
  duplicatePercentIncrease: number;
  setDuplicatePercentIncrease: (percent: number) => void;
  duplicateCopyNotes: boolean;
  setDuplicateCopyNotes: (copy: boolean) => void;
  availableEndUsers: string[];

  // Create Order from Quote Modal
  showCreateOrderFromQuoteModal: boolean;
  setShowCreateOrderFromQuoteModal: (show: boolean) => void;
  createOrderSelectAll: boolean;
  setCreateOrderSelectAll: (selectAll: boolean) => void;
  createOrderSelectedItems: { id: string; selected: boolean; quantity: number }[];
  setCreateOrderSelectedItems: React.Dispatch<React.SetStateAction<{ id: string; selected: boolean; quantity: number }[]>>;

  // Columns Configuration Modal
  showColumnsMenu: boolean;
  setShowColumnsMenu: (show: boolean) => void;
  columnOrder: ColumnKey[];
  columnDefinitions: { key: ColumnKey; label: string; group: string }[];
  visibleColumns: Set<ColumnKey>;
  simpleViewColumns: Set<ColumnKey>;
  quoteViewMode: 'overage' | 'simple';
  toggleColumn: (col: ColumnKey) => void;

  // Mark as Lost Modal
  showMarkAsLostModal: boolean;
  setShowMarkAsLostModal: (show: boolean) => void;
  lostReason: string;
  setLostReason: (reason: string) => void;
  customLostReason: string;
  setCustomLostReason: (reason: string) => void;
  showAddReasonInput: boolean;
  setShowAddReasonInput: (show: boolean) => void;
  newReasonText: string;
  setNewReasonText: (text: string) => void;
  lostReasons: string[];
  setLostReasons: React.Dispatch<React.SetStateAction<string[]>>;
  selectedQuotesForBulk: Set<string>;
  setSelectedQuotesForBulk: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Line Item Details Modal
  showLineDetailsModal: boolean;
  setShowLineDetailsModal: (show: boolean) => void;
  lineDetailsModalItem: LineItem | null;
  setLineDetailsModalItem: React.Dispatch<React.SetStateAction<LineItem | null>>;
  effectiveVisibleColumns: Set<ColumnKey>;
  showEndUserPerLine: boolean;

  // Approval Request Modal
  showApprovalRequestModal: boolean;
  setShowApprovalRequestModal: (show: boolean) => void;
  manufacturers: Manufacturer[];

  // PDF Preview Modal
  showPdfPreviewModal: boolean;
  setShowPdfPreviewModal: (show: boolean) => void;
  generatedPdfData: GeneratedPdfData | null;
  setGeneratedPdfData: React.Dispatch<React.SetStateAction<GeneratedPdfData | null>>;
  pdfTemplate: PdfTemplate;
  setPdfTemplate: React.Dispatch<React.SetStateAction<PdfTemplate>>;

  // Edit Template Modal
  showEditTemplateModal: boolean;
  setShowEditTemplateModal: (show: boolean) => void;

  // Send Email Modal
  showSendEmailModal: boolean;
  setShowSendEmailModal: (show: boolean) => void;
  selectedManufacturerForApproval: string | null;
  setSelectedManufacturerForApproval: (mfr: string | null) => void;

  // Mark Approval Status Modal
  showMarkApprovalModal: boolean;
  setShowMarkApprovalModal: (show: boolean) => void;

  // Revert Version Modal
  showRevertModal: boolean;
  setShowRevertModal: (show: boolean) => void;

  // Credit Modal
  showCreditModal: boolean;
  setShowCreditModal: (show: boolean) => void;

  // Quote PDF Preview Modal
  showQuotePdfPreview: boolean;
  setShowQuotePdfPreview: (show: boolean) => void;

  // Convert to Order Modal
  showConvertToOrderModal: boolean;
  setShowConvertToOrderModal: (show: boolean) => void;

  // Create Product Modal
  showCreateProductModal: boolean;
  setShowCreateProductModal: (show: boolean) => void;
  createProductForLineItem: string | null;
  setCreateProductForLineItem: (id: string | null) => void;
  createProductInitialData: { partNumber: string; description: string };
  setCreateProductInitialData: React.Dispatch<React.SetStateAction<{ partNumber: string; description: string }>>;
  productCatalog: { id: string; partNumber: string; description: string; manufacturer: string; basePrice: number }[];
  setProductCatalog: React.Dispatch<React.SetStateAction<{ id: string; partNumber: string; description: string; manufacturer: string; basePrice: number }[]>>;
  availableManufacturers: { id: string; name: string }[];

  // Generate Distributor Quotes Modal
  showDistributorModal: boolean;
  setShowDistributorModal: (show: boolean) => void;

  // Distributor Quote Detail Modal
  selectedDistributorQuote: DistributorQuote | null;
  setSelectedDistributorQuote: (quote: DistributorQuote | null) => void;
  distributorQuoteLines: DistributorQuoteLine[];
  crossAuditLog: CrossAuditLog[];

  // Recipient Quote Detail Modal
  selectedRecipient: Recipient | null;
  setSelectedRecipient: (recipient: Recipient | null) => void;
  recipientQuoteVersion: number;
  setRecipientQuoteVersion: (version: number) => void;
  showCompareView: boolean;
  setShowCompareView: (show: boolean) => void;

  // Rep Split Modal
  repSplitModalItem: LineItem | null;
  setRepSplitModalItem: (item: LineItem | null) => void;

  // Submittal Modals
  showCreateSubmittalModal: boolean;
  setShowCreateSubmittalModal: (show: boolean) => void;
  showSubmittalConfigModal: boolean;
  setShowSubmittalConfigModal: (show: boolean) => void;
  editingSubmittalId: string | null;
  setEditingSubmittalId: (id: string | null) => void;
  submittals: Submittal[];
  setSubmittals: React.Dispatch<React.SetStateAction<Submittal[]>>;
  selectedSubmittalForDetail: Submittal | null;
  setSelectedSubmittalForDetail: React.Dispatch<React.SetStateAction<Submittal | null>>;
  printSubmittal: Submittal | null;
  setPrintSubmittal: (submittal: Submittal | null) => void;
  recipients: Recipient[];
}

export function QuoteDetailModals({
  selectedQuote,
  quoteLineItems,
  setQuoteLineItems,
  quotes,
  setQuotes,
  setSelectedQuote,
  totals,

  // Commission Splits Modal
  showCommissionSplitsModal,
  setShowCommissionSplitsModal,
  commissionSplitsModalItem,
  setCommissionSplitsModalItem,
  applyToAllLines,
  setApplyToAllLines,
  availableOutsideReps,
  availableInsideReps,

  // Sections Settings Modal
  showSectionsModal,
  setShowSectionsModal,
  showSections,
  setShowSections,
  sectionDisplayMode,
  setSectionDisplayMode,

  // Rep Commission Splits Modal
  showRepSplitsModal,
  setShowRepSplitsModal,
  repCommissionSplits,
  setRepCommissionSplits,
  splitCommission,
  setSplitCommission,

  // Inside Rep Commission Splits Modal
  showInsideRepSplitsModal,
  setShowInsideRepSplitsModal,
  insideRepCommissionSplits,
  setInsideRepCommissionSplits,
  splitInsideCommission,
  setSplitInsideCommission,

  // Line Item Rep Commission Splits Modal
  showLineItemRepSplitsModal,
  setShowLineItemRepSplitsModal,
  lineItemRepSplitsTarget,
  setLineItemRepSplitsTarget,
  lineItemRepSplits,
  setLineItemRepSplits,

  // Line Item Inside Rep Commission Splits Modal
  showLineItemInsideRepSplitsModal,
  setShowLineItemInsideRepSplitsModal,
  lineItemInsideRepSplitsTarget,
  setLineItemInsideRepSplitsTarget,
  lineItemInsideRepSplits,
  setLineItemInsideRepSplits,

  // Duplicate Quote Modal
  showDuplicateQuoteModal,
  setShowDuplicateQuoteModal,
  duplicateQuoteNumber,
  setDuplicateQuoteNumber,
  duplicateCustomer,
  setDuplicateCustomer,
  duplicatePercentIncrease,
  setDuplicatePercentIncrease,
  duplicateCopyNotes,
  setDuplicateCopyNotes,
  availableEndUsers,

  // Create Order from Quote Modal
  showCreateOrderFromQuoteModal,
  setShowCreateOrderFromQuoteModal,
  createOrderSelectAll,
  setCreateOrderSelectAll,
  createOrderSelectedItems,
  setCreateOrderSelectedItems,

  // Columns Configuration Modal
  showColumnsMenu,
  setShowColumnsMenu,
  columnOrder,
  columnDefinitions,
  visibleColumns,
  simpleViewColumns,
  quoteViewMode,
  toggleColumn,

  // Mark as Lost Modal
  showMarkAsLostModal,
  setShowMarkAsLostModal,
  lostReason,
  setLostReason,
  customLostReason,
  setCustomLostReason,
  showAddReasonInput,
  setShowAddReasonInput,
  newReasonText,
  setNewReasonText,
  lostReasons,
  setLostReasons,
  selectedQuotesForBulk,
  setSelectedQuotesForBulk,

  // Line Item Details Modal
  showLineDetailsModal,
  setShowLineDetailsModal,
  lineDetailsModalItem,
  setLineDetailsModalItem,
  effectiveVisibleColumns,
  showEndUserPerLine,

  // Approval Request Modal
  showApprovalRequestModal,
  setShowApprovalRequestModal,
  manufacturers,

  // PDF Preview Modal
  showPdfPreviewModal,
  setShowPdfPreviewModal,
  generatedPdfData,
  setGeneratedPdfData,
  pdfTemplate,
  setPdfTemplate,

  // Edit Template Modal
  showEditTemplateModal,
  setShowEditTemplateModal,

  // Send Email Modal
  showSendEmailModal,
  setShowSendEmailModal,
  selectedManufacturerForApproval,
  setSelectedManufacturerForApproval,

  // Mark Approval Status Modal
  showMarkApprovalModal,
  setShowMarkApprovalModal,

  // Revert Version Modal
  showRevertModal,
  setShowRevertModal,

  // Credit Modal
  showCreditModal,
  setShowCreditModal,

  // Quote PDF Preview Modal
  showQuotePdfPreview,
  setShowQuotePdfPreview,

  // Convert to Order Modal
  showConvertToOrderModal,
  setShowConvertToOrderModal,

  // Create Product Modal
  showCreateProductModal,
  setShowCreateProductModal,
  createProductForLineItem,
  setCreateProductForLineItem,
  createProductInitialData,
  setCreateProductInitialData,
  productCatalog,
  setProductCatalog,
  availableManufacturers,

  // Generate Distributor Quotes Modal
  showDistributorModal,
  setShowDistributorModal,

  // Distributor Quote Detail Modal
  selectedDistributorQuote,
  setSelectedDistributorQuote,
  distributorQuoteLines,
  crossAuditLog,

  // Recipient Quote Detail Modal
  selectedRecipient,
  setSelectedRecipient,
  recipientQuoteVersion,
  setRecipientQuoteVersion,
  showCompareView,
  setShowCompareView,

  // Rep Split Modal
  repSplitModalItem,
  setRepSplitModalItem,

  // Submittal Modals
  showCreateSubmittalModal,
  setShowCreateSubmittalModal,
  showSubmittalConfigModal,
  setShowSubmittalConfigModal,
  editingSubmittalId,
  setEditingSubmittalId,
  submittals,
  setSubmittals,
  selectedSubmittalForDetail,
  setSelectedSubmittalForDetail,
  printSubmittal,
  setPrintSubmittal,
  recipients,
}: QuoteDetailModalsProps) {
  return (
    <>
      {/* Commission Splits Modal */}
      <CommissionSplitsModal
        show={showCommissionSplitsModal}
        item={commissionSplitsModalItem}
        applyToAllLines={applyToAllLines}
        availableOutsideReps={availableOutsideReps}
        onClose={() => {
          setShowCommissionSplitsModal(false);
          setCommissionSplitsModalItem(null);
          setApplyToAllLines(false);
        }}
        onSetApplyToAllLines={setApplyToAllLines}
        onUpdateLineItem={(itemId, outsideRepSplits) => {
          setQuoteLineItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, outsideRepSplits } : item
          ));
        }}
        onUpdateItem={setCommissionSplitsModalItem}
        onApplyToAll={(outsideRepSplits) => {
          setQuoteLineItems(prev => prev.map(item => ({
            ...item,
            outsideRepSplits: [...outsideRepSplits]
          })));
        }}
      />

      {/* Sections Settings Modal */}
      <SectionsSettingsModal
        show={showSectionsModal}
        showSections={showSections}
        sectionDisplayMode={sectionDisplayMode}
        onClose={() => setShowSectionsModal(false)}
        onSetShowSections={setShowSections}
        onSetSectionDisplayMode={setSectionDisplayMode}
      />

      {/* Rep Commission Splits Modal */}
      <GenericRepSplitsModal
        show={showRepSplitsModal}
        title="Commission Splits"
        subtitle="Divide commission among outside reps"
        splits={repCommissionSplits}
        availableReps={availableOutsideReps}
        onClose={() => setShowRepSplitsModal(false)}
        onCancel={() => {
          setSplitCommission(false);
          setRepCommissionSplits([]);
          setShowRepSplitsModal(false);
        }}
        onSetSplits={setRepCommissionSplits}
      />

      {/* Quote-Level Inside Rep Commission Splits Modal */}
      <GenericRepSplitsModal
        show={showInsideRepSplitsModal}
        title="Inside Rep Commission Splits"
        subtitle="Divide commission among inside reps"
        splits={insideRepCommissionSplits}
        availableReps={availableInsideReps}
        onClose={() => setShowInsideRepSplitsModal(false)}
        onCancel={() => {
          setSplitInsideCommission(false);
          setInsideRepCommissionSplits([]);
          setShowInsideRepSplitsModal(false);
        }}
        onSetSplits={setInsideRepCommissionSplits}
      />

      {/* Line Item Rep Commission Splits Modal */}
      <GenericRepSplitsModal
        show={showLineItemRepSplitsModal && lineItemRepSplitsTarget !== null}
        title="Commission Splits"
        subtitle="Divide commission for this line item"
        splits={lineItemRepSplits}
        availableReps={availableOutsideReps}
        onClose={() => {
          if (lineItemRepSplitsTarget) {
            setQuoteLineItems(prev => prev.map(item =>
              item.id === lineItemRepSplitsTarget
                ? { ...item, outsideRepSplits: lineItemRepSplits.map(s => ({ repId: s.repId, repName: s.repName, percentage: s.percentage })) }
                : item
            ));
          }
          setShowLineItemRepSplitsModal(false);
          setLineItemRepSplitsTarget(null);
        }}
        onCancel={() => {
          setShowLineItemRepSplitsModal(false);
          setLineItemRepSplitsTarget(null);
          setLineItemRepSplits([]);
        }}
        onSetSplits={setLineItemRepSplits}
      />

      {/* Line Item Inside Rep Commission Splits Modal */}
      <GenericRepSplitsModal
        show={showLineItemInsideRepSplitsModal && lineItemInsideRepSplitsTarget !== null}
        title="Inside Rep Commission Splits"
        subtitle="Divide commission for this line item"
        splits={lineItemInsideRepSplits}
        availableReps={availableInsideReps}
        onClose={() => {
          if (lineItemInsideRepSplitsTarget) {
            setQuoteLineItems(prev => prev.map(item =>
              item.id === lineItemInsideRepSplitsTarget
                ? { ...item, insideRepSplits: lineItemInsideRepSplits.map(s => ({ repId: s.repId, repName: s.repName, percentage: s.percentage })) }
                : item
            ));
          }
          setShowLineItemInsideRepSplitsModal(false);
          setLineItemInsideRepSplitsTarget(null);
        }}
        onCancel={() => {
          setShowLineItemInsideRepSplitsModal(false);
          setLineItemInsideRepSplitsTarget(null);
          setLineItemInsideRepSplits([]);
        }}
        onSetSplits={setLineItemInsideRepSplits}
      />

      {/* Duplicate Quote Modal */}
      <DuplicateQuoteModal
        show={showDuplicateQuoteModal}
        selectedQuote={selectedQuote}
        duplicateQuoteNumber={duplicateQuoteNumber}
        duplicateCustomer={duplicateCustomer}
        duplicatePercentIncrease={duplicatePercentIncrease}
        duplicateCopyNotes={duplicateCopyNotes}
        availableEndUsers={availableEndUsers}
        onClose={() => setShowDuplicateQuoteModal(false)}
        onSetDuplicateQuoteNumber={setDuplicateQuoteNumber}
        onSetDuplicateCustomer={setDuplicateCustomer}
        onSetDuplicatePercentIncrease={setDuplicatePercentIncrease}
        onSetDuplicateCopyNotes={setDuplicateCopyNotes}
      />

      {/* Create Order from Quote Modal */}
      <CreateOrderFromQuoteModal
        show={showCreateOrderFromQuoteModal}
        selectedQuote={selectedQuote}
        quoteLineItems={quoteLineItems}
        createOrderSelectAll={createOrderSelectAll}
        createOrderSelectedItems={createOrderSelectedItems}
        onClose={() => setShowCreateOrderFromQuoteModal(false)}
        onSetCreateOrderSelectAll={setCreateOrderSelectAll}
        onSetCreateOrderSelectedItems={setCreateOrderSelectedItems}
        onCreate={() => {
          alert('Order created successfully!');
          setShowCreateOrderFromQuoteModal(false);
        }}
      />

      {/* Columns Configuration Modal */}
      <ColumnsConfigModal
        show={showColumnsMenu}
        columnOrder={columnOrder}
        columnDefinitions={columnDefinitions}
        visibleColumns={visibleColumns}
        simpleViewColumns={simpleViewColumns}
        quoteViewMode={quoteViewMode}
        onClose={() => setShowColumnsMenu(false)}
        onToggleColumn={toggleColumn}
      />

      {/* Mark as Lost Modal */}
      <MarkAsLostModal
        show={showMarkAsLostModal}
        lostReason={lostReason}
        customLostReason={customLostReason}
        showAddReasonInput={showAddReasonInput}
        newReasonText={newReasonText}
        lostReasons={lostReasons}
        selectedQuotesForBulk={selectedQuotesForBulk}
        selectedQuote={selectedQuote}
        onClose={() => setShowMarkAsLostModal(false)}
        onSetLostReason={setLostReason}
        onSetCustomLostReason={setCustomLostReason}
        onSetShowAddReasonInput={setShowAddReasonInput}
        onSetNewReasonText={setNewReasonText}
        onSetLostReasons={setLostReasons}
        onSubmit={(reason) => {
          setQuotes(prev => prev.map(q =>
            selectedQuotesForBulk.has(q.id)
              ? { ...q, stage: 'Lost' as const, lostReason: reason }
              : q
          ));
          if (selectedQuote && selectedQuotesForBulk.has(selectedQuote.id)) {
            setSelectedQuote({ ...selectedQuote, stage: 'Lost' as const, lostReason: reason });
          }
          setSelectedQuotesForBulk(new Set());
        }}
      />

      {/* Line Item Details Modal */}
      <LineItemDetailsModal
        show={showLineDetailsModal}
        lineItem={lineDetailsModalItem}
        effectiveVisibleColumns={effectiveVisibleColumns}
        showEndUserPerLine={showEndUserPerLine}
        onClose={() => {
          setShowLineDetailsModal(false);
          setLineDetailsModalItem(null);
        }}
        onUpdateLineItem={(id, updates) => {
          setQuoteLineItems(prev => prev.map(li => li.id === id ? { ...li, ...updates } : li));
          setLineDetailsModalItem((prev: LineItem | null) => prev && prev.id === id ? { ...prev, ...updates } : prev);
        }}
      />

      {/* Approval Request Modal */}
      <ApprovalRequestModal
        show={showApprovalRequestModal}
        soldToCustomer={selectedQuote.soldToCustomer}
        quoteName={selectedQuote.name}
        manufacturers={manufacturers}
        onClose={() => setShowApprovalRequestModal(false)}
        onSend={() => setShowApprovalRequestModal(false)}
      />

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        show={showPdfPreviewModal}
        generatedPdfData={generatedPdfData}
        pdfTemplate={pdfTemplate}
        onClose={() => setShowPdfPreviewModal(false)}
        onEditTemplate={() => {
          setShowPdfPreviewModal(false);
          setShowEditTemplateModal(true);
        }}
        onSendEmail={() => {
          setShowPdfPreviewModal(false);
          setShowSendEmailModal(true);
        }}
        onDownload={() => {
          if (generatedPdfData) {
            alert('PDF downloaded: Approval_Request_' + generatedPdfData.manufacturer.replace(/\s+/g, '_') + '.pdf');
          }
        }}
      />

      {/* Print Submittal Modal */}
      {printSubmittal && (
        <PrintSubmittalDialog
          submittal={printSubmittal}
          onClose={() => setPrintSubmittal(null)}
          onPrint={(settings: PrintSettings) => {
            console.log('Printing submittal with settings:', settings);
            setPrintSubmittal(null);
          }}
        />
      )}

      {/* Rep Split Modal */}
      {repSplitModalItem && (
        <RepSplitModal
          lineItemId={repSplitModalItem.id}
          lineItemDescription={repSplitModalItem.description}
          currentSplits={repSplitModalItem.outsideRepSplits}
          availableReps={availableOutsideReps}
          onClose={() => setRepSplitModalItem(null)}
          onSave={(splits) => {
            console.log('Saving splits for item:', repSplitModalItem.id, splits);
            setRepSplitModalItem(null);
          }}
          onApplyToSection={(splits) => {
            console.log('Applying splits to section:', repSplitModalItem.sectionId, splits);
            setRepSplitModalItem(null);
          }}
          onApplyToAll={(splits) => {
            console.log('Applying splits to all items:', splits);
            setRepSplitModalItem(null);
          }}
        />
      )}

      {/* Edit Template Modal */}
      <EditTemplateModal
        show={showEditTemplateModal}
        pdfTemplate={pdfTemplate}
        onClose={() => setShowEditTemplateModal(false)}
        onSetPdfTemplate={setPdfTemplate}
        onSave={() => {
          alert('Template saved successfully!');
          setShowEditTemplateModal(false);
        }}
        onReset={() => {
          setPdfTemplate({
            companyLogo: true,
            companyName: 'FlowConnect Lighting',
            companyAddress: '123 Main Street, Suite 400\nAnytown, ST 12345',
            includeProjectDetails: true,
            includeProductList: true,
            includeSpecSheets: true,
            includeJustification: true,
            headerText: 'Manufacturer Approval Request',
            footerText: 'Thank you for your consideration. Please respond within 5 business days.',
            customMessage: '',
          });
        }}
      />

      {/* Send Email Modal */}
      <SendEmailModal
        show={showSendEmailModal}
        generatedPdfData={generatedPdfData}
        pdfTemplate={pdfTemplate}
        onClose={() => setShowSendEmailModal(false)}
        onPreviewPdf={() => {
          setShowSendEmailModal(false);
          setShowPdfPreviewModal(true);
        }}
        onSend={() => {
          if (generatedPdfData) {
            alert('Email sent successfully to Mike Johnson with approval request for ' + generatedPdfData.manufacturer);
          }
          setShowSendEmailModal(false);
          setGeneratedPdfData(null);
          setSelectedManufacturerForApproval(null);
        }}
      />

      {/* Mark Approval Status Modal */}
      <MarkApprovalStatusModal
        show={showMarkApprovalModal}
        soldToCustomer={selectedQuote.soldToCustomer}
        onClose={() => setShowMarkApprovalModal(false)}
        onSave={() => setShowMarkApprovalModal(false)}
      />

      {/* Revert to Version Modal */}
      <RevertVersionModal
        show={showRevertModal}
        currentVersion={selectedQuote.version}
        onClose={() => setShowRevertModal(false)}
        onRevert={() => {
          setSelectedQuote({ ...selectedQuote, version: 2 });
          setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? { ...q, version: 2 } : q));
          setShowRevertModal(false);
          alert('Quote reverted to v2');
        }}
      />

      {/* Sale Credit Modal */}
      <CreditModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        quoteName={selectedQuote?.name}
      />

      {/* Quote PDF Preview Modal */}
      {showQuotePdfPreview && selectedQuote && (
        <QuotePdfPreviewModal
          quote={{
            quoteNumber: selectedQuote.id,
            quoteName: selectedQuote.name,
            version: selectedQuote.version,
            stage: selectedQuote.stage,
            soldToCustomer: selectedQuote.soldToCustomer,
            billToCustomer: selectedQuote.billToCustomer,
            jobName: selectedQuote.jobName,
            quoteDate: selectedQuote.quoteDate,
            expirationDate: selectedQuote.expirationDate,
            revisedDate: selectedQuote.revisedDate,
            acceptDate: selectedQuote.acceptDate,
            paymentTerms: selectedQuote.paymentTerms,
            freightTerms: selectedQuote.freightTerms,
            lineItems: quoteLineItems.map(li => ({
              sectionName: li.sectionName,
              productNumber: li.productNumber,
              description: li.description,
              quantity: li.quantity,
              sellPrice: li.sellPrice,
              extendedPrice: li.sellPrice * li.quantity,
            })),
            totals: {
              baseTotal: totals.baseTotal,
              sellTotal: totals.sellTotal,
              commission: totals.commission,
              overage: totals.overage,
            },
          }}
          onClose={() => setShowQuotePdfPreview(false)}
        />
      )}

      {/* Convert Quote to Order Modal */}
      {showConvertToOrderModal && selectedQuote && (
        <ConvertQuoteToOrderModal
          quote={{
            id: selectedQuote.id,
            quoteNumber: selectedQuote.name,
            customerName: selectedQuote.soldToCustomer,
            projectName: selectedQuote.jobName,
            lineItems: quoteLineItems.map(li => ({
              id: li.id,
              partNumber: li.productNumber,
              description: li.description,
              manufacturer: li.manufacturers[0]?.name || 'Unknown',
              quantity: li.quantity,
              unitPrice: li.basePrice,
              sellPrice: li.sellPrice,
            })),
            totalValue: selectedQuote.valueNumber,
          }}
          onClose={() => setShowConvertToOrderModal(false)}
          onConvert={(order: Order) => {
            alert(`Order ${order.orderNumber} created successfully!`);
            setShowConvertToOrderModal(false);
          }}
        />
      )}

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={showCreateProductModal}
        onClose={() => {
          setShowCreateProductModal(false);
          setCreateProductForLineItem(null);
          setCreateProductInitialData({ partNumber: '', description: '' });
        }}
        onSave={(newProduct) => {
          setProductCatalog(prev => [...prev, newProduct]);
          if (createProductForLineItem) {
            setQuoteLineItems(prev => prev.map(li =>
              li.id === createProductForLineItem ? {
                ...li,
                productNumber: newProduct.partNumber,
                description: newProduct.description,
                basePrice: newProduct.basePrice,
                sellPrice: newProduct.basePrice,
                manufacturers: [{
                  ...li.manufacturers[0],
                  name: newProduct.manufacturer,
                }]
              } : li
            ));
          }
          setCreateProductForLineItem(null);
          setCreateProductInitialData({ partNumber: '', description: '' });
        }}
        initialData={createProductInitialData}
        manufacturers={availableManufacturers}
      />

      {/* Generate Distributor Quotes Modal */}
      <GenerateDistributorQuotesModal
        show={showDistributorModal}
        onClose={() => setShowDistributorModal(false)}
        onGenerate={() => setShowDistributorModal(false)}
      />

      {/* Distributor Quote Detail Modal */}
      <DistributorQuoteDetailModal
        selectedDistributorQuote={selectedDistributorQuote}
        distributorQuoteLines={distributorQuoteLines}
        crossAuditLog={crossAuditLog}
        onClose={() => setSelectedDistributorQuote(null)}
      />

      {/* Recipient Quote Detail Modal */}
      <RecipientQuoteDetailModal
        selectedRecipient={selectedRecipient}
        quoteVersion={selectedQuote.version}
        recipientQuoteVersion={recipientQuoteVersion}
        showCompareView={showCompareView}
        quoteLineItems={quoteLineItems}
        totals={totals}
        onClose={() => { setSelectedRecipient(null); setShowCompareView(false); }}
        onVersionChange={(v) => setRecipientQuoteVersion(v)}
        onToggleCompare={() => setShowCompareView(!showCompareView)}
      />

      {/* Create Submittal Modal */}
      {showCreateSubmittalModal && (
        <CreateSubmittalModal
          onClose={() => setShowCreateSubmittalModal(false)}
          onCreate={(submittalData) => {
            const newSubmittal: Submittal = {
              id: `SUB-${Date.now()}`,
              jobId: selectedQuote.jobId,
              jobName: submittalData.jobName || selectedQuote.jobName || selectedQuote.name,
              jobLocation: '',
              quoteIds: [selectedQuote.id],
              customers: submittalData.customers || [],
              engineers: submittalData.engineers || [],
              architects: submittalData.architects || [],
              submittalDate: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'draft',
              currentRevision: 1,
              items: submittalData.items || [],
              revisions: [],
              config: defaultSubmittalConfig,
              createdBy: 'Current User',
              updatedBy: 'Current User',
            };
            setSubmittals(prev => [...prev, newSubmittal]);
            setShowCreateSubmittalModal(false);
          }}
          preselectedQuoteId={selectedQuote.id}
          preselectedQuoteName={selectedQuote.name}
          quoteRecipients={recipients.map(r => ({
            id: r.id,
            name: r.contact,
            company: r.company,
            email: r.email,
            role: 'customer' as const,
          }))}
          quoteLineItems={quoteLineItems.map(li => ({
            id: li.id,
            catalogNumber: li.productNumber,
            manufacturer: li.manufacturers[0]?.name || 'Unknown',
            description: li.description,
            quantity: li.quantity,
          }))}
        />
      )}

      {/* Submittal Configuration Modal */}
      {showSubmittalConfigModal && editingSubmittalId && (
        <SubmittalConfigModal
          submittal={submittals.find(s => s.id === editingSubmittalId)!}
          onClose={() => {
            setShowSubmittalConfigModal(false);
            setEditingSubmittalId(null);
          }}
          onSave={(updates) => {
            setSubmittals(prev => prev.map(s =>
              s.id === editingSubmittalId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
            ));
            setShowSubmittalConfigModal(false);
            setEditingSubmittalId(null);
          }}
        />
      )}

      {/* Submittal Detail Panel Modal */}
      {selectedSubmittalForDetail && (
        <SubmittalDetailPanel
          submittal={selectedSubmittalForDetail}
          onClose={() => setSelectedSubmittalForDetail(null)}
          onUpdate={(updates) => {
            setSubmittals(prev => prev.map(s =>
              s.id === selectedSubmittalForDetail.id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
            ));
            setSelectedSubmittalForDetail((prev: Submittal | null) => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
          }}
          onPrint={() => setPrintSubmittal(selectedSubmittalForDetail)}
          onResubmit={(itemsToResubmit) => {
            console.log('Resubmit items:', itemsToResubmit);
            setPrintSubmittal(selectedSubmittalForDetail);
          }}
        />
      )}
    </>
  );
}
