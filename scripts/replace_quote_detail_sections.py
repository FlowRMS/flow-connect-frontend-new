#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find Header section: starts with "{/* Header */}" and ends before "{/* Pricing Summary Bar */}"
header_start = None
header_end = None

for i, line in enumerate(lines):
    if '{/* Header */}' in line:
        header_start = i
    if header_start is not None and '{/* Pricing Summary Bar */}' in line:
        header_end = i
        break

if header_start is None or header_end is None:
    print("Could not find Header section markers")
    print(f"header_start: {header_start}, header_end: {header_end}")
    sys.exit(1)

print(f"Found Header section from line {header_start + 1} to {header_end}")

header_replacement = '''        {/* Header */}
        <QuoteDetailHeader
          selectedQuote={selectedQuote}
          setSelectedQuote={setSelectedQuote}
          setQuotes={setQuotes}
          quoteLineItems={quoteLineItems}
          showActionsDropdown={showActionsDropdown}
          setShowActionsDropdown={setShowActionsDropdown}
          showStageDropdown={showStageDropdown}
          setShowStageDropdown={setShowStageDropdown}
          showVersionDropdown={showVersionDropdown}
          setShowVersionDropdown={setShowVersionDropdown}
          showViewModeDropdown={showViewModeDropdown}
          setShowViewModeDropdown={setShowViewModeDropdown}
          showSaveDropdown={showSaveDropdown}
          setShowSaveDropdown={setShowSaveDropdown}
          quoteViewMode={quoteViewMode}
          setQuoteViewMode={setQuoteViewMode}
          adminShowSalesCredit={adminShowSalesCredit}
          getStageColor={getStageColor}
          setShowMarkAsLostModal={setShowMarkAsLostModal}
          setSelectedQuotesForBulk={setSelectedQuotesForBulk}
          setShowCreditModal={setShowCreditModal}
          setShowQuotePdfPreview={setShowQuotePdfPreview}
          setShowConvertToOrderModal={setShowConvertToOrderModal}
          setShowCreateOrderFromQuoteModal={setShowCreateOrderFromQuoteModal}
          setCreateOrderSelectedItems={setCreateOrderSelectedItems}
          setCreateOrderSelectAll={setCreateOrderSelectAll}
          setShowDuplicateQuoteModal={setShowDuplicateQuoteModal}
          setDuplicateQuoteNumber={setDuplicateQuoteNumber}
          setDuplicateCustomer={setDuplicateCustomer}
          setDuplicatePercentIncrease={setDuplicatePercentIncrease}
          setDuplicateCopyNotes={setDuplicateCopyNotes}
        />

'''

new_lines = lines[:header_start] + [header_replacement] + lines[header_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Header replacement completed. Removed {header_end - header_start} lines.")

# Re-read for next replacement
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find Pricing Summary Bar section
pricing_start = None
pricing_end = None

for i, line in enumerate(lines):
    if '{/* Pricing Summary Bar */}' in line:
        pricing_start = i
    if pricing_start is not None and '{/* Collapsible Header Fields Section */}' in line:
        pricing_end = i
        break

if pricing_start is None or pricing_end is None:
    print("Could not find Pricing Summary Bar section markers")
    print(f"pricing_start: {pricing_start}, pricing_end: {pricing_end}")
    sys.exit(1)

print(f"Found Pricing Summary Bar section from line {pricing_start + 1} to {pricing_end}")

pricing_replacement = '''        {/* Pricing Summary Bar */}
        <PricingSummaryBar
          totals={totals}
          quoteViewMode={quoteViewMode}
          quotePriceLevels={quotePriceLevels}
          priceLevelColors={priceLevelColors}
        />

'''

new_lines = lines[:pricing_start] + [pricing_replacement] + lines[pricing_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Pricing Summary Bar replacement completed. Removed {pricing_end - pricing_start} lines.")

# Re-read for next replacement
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find Collapsible Header Fields Section
fields_start = None
fields_end = None

for i, line in enumerate(lines):
    if '{/* Collapsible Header Fields Section */}' in line:
        fields_start = i
    if fields_start is not None and '<div className="flex flex-1 overflow-hidden min-h-0">' in line:
        fields_end = i
        break

if fields_start is None or fields_end is None:
    print("Could not find Header Fields section markers")
    print(f"fields_start: {fields_start}, fields_end: {fields_end}")
    sys.exit(1)

print(f"Found Header Fields section from line {fields_start + 1} to {fields_end}")

fields_replacement = '''        {/* Collapsible Header Fields Section */}
        <HeaderFieldsSection
          selectedQuote={selectedQuote}
          setSelectedQuote={setSelectedQuote}
          setQuotes={setQuotes}
          showHeaderFields={showHeaderFields}
          setShowHeaderFields={setShowHeaderFields}
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

'''

new_lines = lines[:fields_start] + [fields_replacement] + lines[fields_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Header Fields replacement completed. Removed {fields_end - fields_start} lines.")
print("All replacements completed successfully!")
