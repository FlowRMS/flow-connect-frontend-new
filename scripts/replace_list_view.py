#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '/* List View */' in line:
        start_line = i
    if start_line is not None and '</main>' in line:
        # We want to end before </main>
        end_line = i
        break

if start_line is None or end_line is None:
    print("Could not find markers")
    print(f"start_line: {start_line}, end_line: {end_line}")
    sys.exit(1)

print(f"Found List View from line {start_line + 1} to {end_line}")

replacement = '''        /* List View */
        <QuotesListView
          sortedQuotes={sortedQuotes}
          selectedQuotesForBulk={selectedQuotesForBulk}
          setSelectedQuotesForBulk={setSelectedQuotesForBulk}
          showQuotesBulkActionsMenu={showQuotesBulkActionsMenu}
          setShowQuotesBulkActionsMenu={setShowQuotesBulkActionsMenu}
          setQuotes={setQuotes}
          setShowMarkAsLostModal={setShowMarkAsLostModal}
          isQuoteLinked={isQuoteLinked}
          getQuoteLinkedReason={getQuoteLinkedReason}
          getStageColor={getStageColor}
          handleQuotesSort={handleQuotesSort}
          quotesSortColumn={quotesSortColumn}
          quotesSortDirection={quotesSortDirection}
          activeQuoteFilterColumn={activeQuoteFilterColumn}
          setActiveQuoteFilterColumn={setActiveQuoteFilterColumn}
          setFilterSearchText={setFilterSearchText}
          hasActiveFilter={hasActiveFilter}
          renderFilterDropdown={renderFilterDropdown}
          setSelectedQuote={setSelectedQuote}
        />
      )}
'''

new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines.")
