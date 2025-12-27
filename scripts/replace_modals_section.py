#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# Find the start of modals section: "{/* Commission Splits Modal */}"
modals_start = None
modals_end = None

for i, line in enumerate(lines):
    if '{/* Commission Splits Modal */}' in line and modals_start is None:
        modals_start = i
    # Find the end: line before "</main>" that closes the detail view
    if modals_start is not None and '</main>' in line and modals_end is None:
        modals_end = i
        break

if modals_start is None or modals_end is None:
    print("Could not find modals section markers")
    print(f"modals_start: {modals_start}, modals_end: {modals_end}")
    sys.exit(1)

print(f"Found modals section from line {modals_start + 1} to {modals_end}")
print(f"This is {modals_end - modals_start} lines")

# The replacement component call
modals_replacement = '''        <QuoteDetailModals
          selectedQuote={selectedQuote}
          quoteLineItems={quoteLineItems}
          setQuoteLineItems={setQuoteLineItems}
          quotes={quotes}
          setQuotes={setQuotes}
          setSelectedQuote={setSelectedQuote}
          totals={totals}
          showCommissionSplitsModal={showCommissionSplitsModal}
          setShowCommissionSplitsModal={setShowCommissionSplitsModal}
          commissionSplitsModalItem={commissionSplitsModalItem}
          setCommissionSplitsModalItem={setCommissionSplitsModalItem}
          applyToAllLines={applyToAllLines}
          setApplyToAllLines={setApplyToAllLines}
          availableOutsideReps={availableOutsideReps}
          availableInsideReps={availableInsideReps}
          showSectionsModal={showSectionsModal}
          setShowSectionsModal={setShowSectionsModal}
          showSections={showSections}
          setShowSections={setShowSections}
          sectionDisplayMode={sectionDisplayMode}
          setSectionDisplayMode={setSectionDisplayMode}
          showRepSplitsModal={showRepSplitsModal}
          setShowRepSplitsModal={setShowRepSplitsModal}
          repCommissionSplits={repCommissionSplits}
          setRepCommissionSplits={setRepCommissionSplits}
          splitCommission={splitCommission}
          setSplitCommission={setSplitCommission}
          showInsideRepSplitsModal={showInsideRepSplitsModal}
          setShowInsideRepSplitsModal={setShowInsideRepSplitsModal}
          insideRepCommissionSplits={insideRepCommissionSplits}
          setInsideRepCommissionSplits={setInsideRepCommissionSplits}
          splitInsideCommission={splitInsideCommission}
          setSplitInsideCommission={setSplitInsideCommission}
          showLineItemRepSplitsModal={showLineItemRepSplitsModal}
          setShowLineItemRepSplitsModal={setShowLineItemRepSplitsModal}
          lineItemRepSplitsTarget={lineItemRepSplitsTarget}
          setLineItemRepSplitsTarget={setLineItemRepSplitsTarget}
          lineItemRepSplits={lineItemRepSplits}
          setLineItemRepSplits={setLineItemRepSplits}
          showLineItemInsideRepSplitsModal={showLineItemInsideRepSplitsModal}
          setShowLineItemInsideRepSplitsModal={setShowLineItemInsideRepSplitsModal}
          lineItemInsideRepSplitsTarget={lineItemInsideRepSplitsTarget}
          setLineItemInsideRepSplitsTarget={setLineItemInsideRepSplitsTarget}
          lineItemInsideRepSplits={lineItemInsideRepSplits}
          setLineItemInsideRepSplits={setLineItemInsideRepSplits}
          showDuplicateQuoteModal={showDuplicateQuoteModal}
          setShowDuplicateQuoteModal={setShowDuplicateQuoteModal}
          duplicateQuoteNumber={duplicateQuoteNumber}
          setDuplicateQuoteNumber={setDuplicateQuoteNumber}
          duplicateCustomer={duplicateCustomer}
          setDuplicateCustomer={setDuplicateCustomer}
          duplicatePercentIncrease={duplicatePercentIncrease}
          setDuplicatePercentIncrease={setDuplicatePercentIncrease}
          duplicateCopyNotes={duplicateCopyNotes}
          setDuplicateCopyNotes={setDuplicateCopyNotes}
          availableEndUsers={availableEndUsers}
          showCreateOrderFromQuoteModal={showCreateOrderFromQuoteModal}
          setShowCreateOrderFromQuoteModal={setShowCreateOrderFromQuoteModal}
          createOrderSelectAll={createOrderSelectAll}
          setCreateOrderSelectAll={setCreateOrderSelectAll}
          createOrderSelectedItems={createOrderSelectedItems}
          setCreateOrderSelectedItems={setCreateOrderSelectedItems}
          showColumnsMenu={showColumnsMenu}
          setShowColumnsMenu={setShowColumnsMenu}
          columnOrder={columnOrder}
          columnDefinitions={columnDefinitions}
          visibleColumns={visibleColumns}
          simpleViewColumns={simpleViewColumns}
          quoteViewMode={quoteViewMode}
          toggleColumn={toggleColumn}
          showMarkAsLostModal={showMarkAsLostModal}
          setShowMarkAsLostModal={setShowMarkAsLostModal}
          lostReason={lostReason}
          setLostReason={setLostReason}
          customLostReason={customLostReason}
          setCustomLostReason={setCustomLostReason}
          showAddReasonInput={showAddReasonInput}
          setShowAddReasonInput={setShowAddReasonInput}
          newReasonText={newReasonText}
          setNewReasonText={setNewReasonText}
          lostReasons={lostReasons}
          setLostReasons={setLostReasons}
          selectedQuotesForBulk={selectedQuotesForBulk}
          setSelectedQuotesForBulk={setSelectedQuotesForBulk}
          showLineDetailsModal={showLineDetailsModal}
          setShowLineDetailsModal={setShowLineDetailsModal}
          lineDetailsModalItem={lineDetailsModalItem}
          setLineDetailsModalItem={setLineDetailsModalItem}
          effectiveVisibleColumns={effectiveVisibleColumns}
          showEndUserPerLine={showEndUserPerLine}
          showApprovalRequestModal={showApprovalRequestModal}
          setShowApprovalRequestModal={setShowApprovalRequestModal}
          manufacturers={mockManufacturers}
          showPdfPreviewModal={showPdfPreviewModal}
          setShowPdfPreviewModal={setShowPdfPreviewModal}
          generatedPdfData={generatedPdfData}
          setGeneratedPdfData={setGeneratedPdfData}
          pdfTemplate={pdfTemplate}
          setPdfTemplate={setPdfTemplate}
          showEditTemplateModal={showEditTemplateModal}
          setShowEditTemplateModal={setShowEditTemplateModal}
          showSendEmailModal={showSendEmailModal}
          setShowSendEmailModal={setShowSendEmailModal}
          selectedManufacturerForApproval={selectedManufacturerForApproval}
          setSelectedManufacturerForApproval={setSelectedManufacturerForApproval}
          showMarkApprovalModal={showMarkApprovalModal}
          setShowMarkApprovalModal={setShowMarkApprovalModal}
          showRevertModal={showRevertModal}
          setShowRevertModal={setShowRevertModal}
          showCreditModal={showCreditModal}
          setShowCreditModal={setShowCreditModal}
          showQuotePdfPreview={showQuotePdfPreview}
          setShowQuotePdfPreview={setShowQuotePdfPreview}
          showConvertToOrderModal={showConvertToOrderModal}
          setShowConvertToOrderModal={setShowConvertToOrderModal}
          showCreateProductModal={showCreateProductModal}
          setShowCreateProductModal={setShowCreateProductModal}
          createProductForLineItem={createProductForLineItem}
          setCreateProductForLineItem={setCreateProductForLineItem}
          createProductInitialData={createProductInitialData}
          setCreateProductInitialData={setCreateProductInitialData}
          productCatalog={productCatalog}
          setProductCatalog={setProductCatalog}
          availableManufacturers={availableManufacturers}
          showDistributorModal={showDistributorModal}
          setShowDistributorModal={setShowDistributorModal}
          selectedDistributorQuote={selectedDistributorQuote}
          setSelectedDistributorQuote={setSelectedDistributorQuote}
          distributorQuoteLines={mockDistributorQuoteLines}
          crossAuditLog={mockCrossAuditLog}
          selectedRecipient={selectedRecipient}
          setSelectedRecipient={setSelectedRecipient}
          recipientQuoteVersion={recipientQuoteVersion}
          setRecipientQuoteVersion={setRecipientQuoteVersion}
          showCompareView={showCompareView}
          setShowCompareView={setShowCompareView}
          repSplitModalItem={repSplitModalItem}
          setRepSplitModalItem={setRepSplitModalItem}
          showCreateSubmittalModal={showCreateSubmittalModal}
          setShowCreateSubmittalModal={setShowCreateSubmittalModal}
          showSubmittalConfigModal={showSubmittalConfigModal}
          setShowSubmittalConfigModal={setShowSubmittalConfigModal}
          editingSubmittalId={editingSubmittalId}
          setEditingSubmittalId={setEditingSubmittalId}
          submittals={submittals}
          setSubmittals={setSubmittals}
          selectedSubmittalForDetail={selectedSubmittalForDetail}
          setSelectedSubmittalForDetail={setSelectedSubmittalForDetail}
          printSubmittal={printSubmittal}
          setPrintSubmittal={setPrintSubmittal}
          recipients={recipients}
        />
'''

new_lines = lines[:modals_start] + [modals_replacement] + lines[modals_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print(f"Modals replacement completed. Removed {modals_end - modals_start} lines.")
