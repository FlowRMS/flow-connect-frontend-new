#!/usr/bin/env python3
"""Replace inline LinesTab JSX with LinesTab component call."""

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# Find the lines tab section (from "{/* Line Items Tab */}" to before "{/* Approvals Tab */}")
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if '{/* Line Items Tab */}' in line and start_idx is None:
        start_idx = i
    if start_idx is not None and '{/* Approvals Tab */}' in line:
        end_idx = i
        break

if start_idx is None or end_idx is None:
    print(f"Could not find markers. start_idx: {start_idx}, end_idx: {end_idx}")
    exit(1)

print(f"Found LinesTab section from line {start_idx + 1} to {end_idx}")
print(f"Removing {end_idx - start_idx} lines")

# The replacement LinesTab component with all props
lines_tab_component = '''            {/* Line Items Tab */}
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
                showViewModeDropdown={showViewModeDropdown}
                setShowViewModeDropdown={setShowViewModeDropdown}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
                simpleViewColumns={simpleViewColumns}
                setSimpleViewColumns={setSimpleViewColumns}
                effectiveVisibleColumns={effectiveVisibleColumns}
                columnOrder={columnOrder}
                setColumnOrder={setColumnOrder}
                draggingColumn={draggingColumn}
                setDraggingColumn={setDraggingColumn}
                toggleColumn={toggleColumn}
                handleColumnDragStart={handleColumnDragStart}
                handleColumnDragOver={handleColumnDragOver}
                handleColumnDragEnd={handleColumnDragEnd}
                getOrderedVisibleColumns={getOrderedVisibleColumns}
                getColumnOrder={getColumnOrder}
                savedViews={savedViews}
                setSavedViews={setSavedViews}
                activeView={activeView}
                setActiveView={setActiveView}
                showSaveViewModal={showSaveViewModal}
                setShowSaveViewModal={setShowSaveViewModal}
                newViewName={newViewName}
                setNewViewName={setNewViewName}
                applyView={applyView}
                saveCurrentView={saveCurrentView}
                deleteView={deleteView}
                showViewsMenu={showViewsMenu}
                setShowViewsMenu={setShowViewsMenu}
                showColumnsMenu={showColumnsMenu}
                setShowColumnsMenu={setShowColumnsMenu}
                selectedLineItems={selectedLineItems}
                setSelectedLineItems={setSelectedLineItems}
                showBulkActionsMenu={showBulkActionsMenu}
                setShowBulkActionsMenu={setShowBulkActionsMenu}
                recipients={recipients}
                selectedRecipient={selectedRecipient}
                setSelectedRecipient={setSelectedRecipient}
                recipientQuoteVersion={recipientQuoteVersion}
                setRecipientQuoteVersion={setRecipientQuoteVersion}
                showCompareView={showCompareView}
                setShowCompareView={setShowCompareView}
                showRecipientDropdown={showRecipientDropdown}
                setShowRecipientDropdown={setShowRecipientDropdown}
                showSections={showSections}
                setShowSections={setShowSections}
                collapsedSections={collapsedSections}
                setCollapsedSections={setCollapsedSections}
                sectionDisplayMode={sectionDisplayMode}
                showEndUserPerLine={showEndUserPerLine}
                setShowEndUserPerLine={setShowEndUserPerLine}
                showSetEndUserModal={showSetEndUserModal}
                setShowSetEndUserModal={setShowSetEndUserModal}
                selectedEndUser={selectedEndUser}
                setSelectedEndUser={setSelectedEndUser}
                showCommissionSplits={showCommissionSplits}
                setShowCommissionSplits={setShowCommissionSplits}
                showCommissionSplitsModal={showCommissionSplitsModal}
                setShowCommissionSplitsModal={setShowCommissionSplitsModal}
                commissionSplitsModalItem={commissionSplitsModalItem}
                setCommissionSplitsModalItem={setCommissionSplitsModalItem}
                repSplitModalItem={repSplitModalItem}
                setRepSplitModalItem={setRepSplitModalItem}
                lineItemRepDropdown={lineItemRepDropdown}
                setLineItemRepDropdown={setLineItemRepDropdown}
                lineItemRepSearch={lineItemRepSearch}
                setLineItemRepSearch={setLineItemRepSearch}
                showLineItemRepSplitsModal={showLineItemRepSplitsModal}
                setShowLineItemRepSplitsModal={setShowLineItemRepSplitsModal}
                lineItemRepSplitsTarget={lineItemRepSplitsTarget}
                setLineItemRepSplitsTarget={setLineItemRepSplitsTarget}
                lineItemRepSplits={lineItemRepSplits}
                setLineItemRepSplits={setLineItemRepSplits}
                showInsideRepSplits={showInsideRepSplits}
                lineItemInsideRepDropdown={lineItemInsideRepDropdown}
                setLineItemInsideRepDropdown={setLineItemInsideRepDropdown}
                lineItemInsideRepSearch={lineItemInsideRepSearch}
                setLineItemInsideRepSearch={setLineItemInsideRepSearch}
                showLineItemInsideRepSplitsModal={showLineItemInsideRepSplitsModal}
                setShowLineItemInsideRepSplitsModal={setShowLineItemInsideRepSplitsModal}
                lineItemInsideRepSplitsTarget={lineItemInsideRepSplitsTarget}
                setLineItemInsideRepSplitsTarget={setLineItemInsideRepSplitsTarget}
                lineItemInsideRepSplits={lineItemInsideRepSplits}
                setLineItemInsideRepSplits={setLineItemInsideRepSplits}
                productCatalog={productCatalog}
                setProductCatalog={setProductCatalog}
                productSearchOpen={productSearchOpen}
                setProductSearchOpen={setProductSearchOpen}
                productSearchField={productSearchField}
                setProductSearchField={setProductSearchField}
                productSearchQuery={productSearchQuery}
                setProductSearchQuery={setProductSearchQuery}
                showCreateProduct={showCreateProduct}
                setShowCreateProduct={setShowCreateProduct}
                newProductData={newProductData}
                setNewProductData={setNewProductData}
                getFilteredProducts={getFilteredProducts}
                handleAddProduct={handleAddProduct}
                dropdownPosition={dropdownPosition}
                setDropdownPosition={setDropdownPosition}
                productDropdownRef={productDropdownRef}
                showCreateProductModal={showCreateProductModal}
                setShowCreateProductModal={setShowCreateProductModal}
                createProductForLineItem={createProductForLineItem}
                setCreateProductForLineItem={setCreateProductForLineItem}
                createProductInitialData={createProductInitialData}
                setCreateProductInitialData={setCreateProductInitialData}
                manufacturerDropdown={manufacturerDropdown}
                setManufacturerDropdown={setManufacturerDropdown}
                manufacturerSearch={manufacturerSearch}
                setManufacturerSearch={setManufacturerSearch}
                showSetOverageModal={showSetOverageModal}
                setShowSetOverageModal={setShowSetOverageModal}
                overageModalTab={overageModalTab}
                setOverageModalTab={setOverageModalTab}
                overageInputPercent={overageInputPercent}
                setOverageInputPercent={setOverageInputPercent}
                overageInputTargetPrice={overageInputTargetPrice}
                setOverageInputTargetPrice={setOverageInputTargetPrice}
                overageInputTargetMargin={overageInputTargetMargin}
                setOverageInputTargetMargin={setOverageInputTargetMargin}
                showCopyPriceModal={showCopyPriceModal}
                setShowCopyPriceModal={setShowCopyPriceModal}
                showPriceLookupModal={showPriceLookupModal}
                setShowPriceLookupModal={setShowPriceLookupModal}
                priceLookupTargetPrice={priceLookupTargetPrice}
                setPriceLookupTargetPrice={setPriceLookupTargetPrice}
                expandedLineItems={expandedLineItems}
                setExpandedLineItems={setExpandedLineItems}
                showMinOverageModal={showMinOverageModal}
                setShowMinOverageModal={setShowMinOverageModal}
                minOverageInput={minOverageInput}
                setMinOverageInput={setMinOverageInput}
                showAutoCalcModal={showAutoCalcModal}
                setShowAutoCalcModal={setShowAutoCalcModal}
                autoCalcMode={autoCalcMode}
                setAutoCalcMode={setAutoCalcMode}
                autoCalcTargetOverage={autoCalcTargetOverage}
                setAutoCalcTargetOverage={setAutoCalcTargetOverage}
                autoCalcTargetCommission={autoCalcTargetCommission}
                setAutoCalcTargetCommission={setAutoCalcTargetCommission}
                quotePriceLevels={quotePriceLevels}
                setQuotePriceLevels={setQuotePriceLevels}
                sortColumn={sortColumn}
                setSortColumn={setSortColumn}
                sortDirection={sortDirection}
                setSortDirection={setSortDirection}
                columnFilters={columnFilters}
                setColumnFilters={setColumnFilters}
                activeFilterColumn={activeFilterColumn}
                setActiveFilterColumn={setActiveFilterColumn}
                handleSort={handleSort}
                handleFilterChange={handleFilterChange}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
                editValue={editValue}
                setEditValue={setEditValue}
                editInputRef={editInputRef}
                startEditing={startEditing}
                getItemValue={getItemValue}
                showLineDetailsModal={showLineDetailsModal}
                setShowLineDetailsModal={setShowLineDetailsModal}
                lineDetailsModalItem={lineDetailsModalItem}
                setLineDetailsModalItem={setLineDetailsModalItem}
              />
            )}'''

# Build new content
new_lines = lines[:start_idx]
new_lines.extend(lines_tab_component.split('\n'))
new_lines.extend(lines[end_idx:])

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print(f"Successfully replaced LinesTab section ({end_idx - start_idx} lines -> {len(lines_tab_component.split(chr(10)))} lines)")
print(f"New line count: {len(new_lines)}")
