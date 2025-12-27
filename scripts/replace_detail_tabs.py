#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the Tabs section
tabs_start = None
tabs_end = None

for i, line in enumerate(lines):
    if '{/* Tabs */}' in line and 'flex items-center justify-between' in lines[i+1]:
        tabs_start = i
    if tabs_start is not None and '{/* Line Items Tab */}' in line:
        tabs_end = i
        break

if tabs_start is None or tabs_end is None:
    print("Could not find Tabs section markers")
    print(f"tabs_start: {tabs_start}, tabs_end: {tabs_end}")
    sys.exit(1)

print(f"Found Tabs section from line {tabs_start + 1} to {tabs_end}")

tabs_replacement = '''            {/* Tabs */}
            <QuoteDetailTabs
              selectedQuote={selectedQuote}
              quoteLineItemsCount={quoteLineItems.length}
              quoteViewMode={quoteViewMode}
              detailTab={detailTab}
              setDetailTab={setDetailTab}
              showViewsMenu={showViewsMenu}
              setShowViewsMenu={setShowViewsMenu}
              showColumnsMenu={showColumnsMenu}
              setShowColumnsMenu={setShowColumnsMenu}
              savedViews={savedViews}
              activeView={activeView}
              applyView={applyView}
              deleteView={deleteView}
              setShowSaveViewModal={setShowSaveViewModal}
              showSections={showSections}
              setShowSectionsModal={setShowSectionsModal}
              effectiveVisibleColumnsSize={effectiveVisibleColumns.size}
            />

'''

new_lines = lines[:tabs_start] + [tabs_replacement] + lines[tabs_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Tabs replacement completed. Removed {tabs_end - tabs_start} lines.")
