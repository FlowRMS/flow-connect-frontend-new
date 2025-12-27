#!/usr/bin/env python3
"""
Modularize QuotesContent.tsx by:
1. Replacing inline LinesTab JSX with <LinesTab /> component
2. Removing dead code (renderHeaderCell, renderBodyCell)
"""

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

print(f"Original line count: {len(lines)}")

# Step 1: Find and replace the inline LinesTab JSX
# Find the start: {detailTab === 'lines' && (
# Find the end: next detailTab check for 'approvals'

lines_tab_start = None
lines_tab_end = None

for i, line in enumerate(lines):
    if "{detailTab === 'lines' && (" in line and lines_tab_start is None:
        lines_tab_start = i
    if "{detailTab === 'approvals' && (" in line and lines_tab_start is not None:
        lines_tab_end = i
        break

if lines_tab_start is not None and lines_tab_end is not None:
    print(f"LinesTab inline JSX: lines {lines_tab_start + 1} to {lines_tab_end}")
    print(f"Lines to remove: {lines_tab_end - lines_tab_start}")

    # Create the replacement LinesTab component call
    lines_tab_replacement = '''            {detailTab === 'lines' && (
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

'''

    # Replace the inline JSX with the component call
    lines = lines[:lines_tab_start] + lines_tab_replacement.split('\n') + lines[lines_tab_end:]
    print(f"After LinesTab replacement: {len(lines)} lines")
else:
    print("Could not find LinesTab inline JSX boundaries")

# Step 2: Remove renderHeaderCell function
# Find: "// Render a table header cell for a given column key"
# End: closing brace before "// Render a table body cell"

render_header_start = None
render_header_end = None

for i, line in enumerate(lines):
    if '// Render a table header cell for a given column key' in line:
        render_header_start = i
    if render_header_start is not None and '// Render a table body cell' in line:
        # End is the line before this one
        render_header_end = i
        break

if render_header_start is not None and render_header_end is not None:
    print(f"renderHeaderCell: lines {render_header_start + 1} to {render_header_end}")
    print(f"Lines to remove: {render_header_end - render_header_start}")
    lines = lines[:render_header_start] + lines[render_header_end:]
    print(f"After renderHeaderCell removal: {len(lines)} lines")
else:
    print("Could not find renderHeaderCell function boundaries")

# Step 3: Remove renderBodyCell function
# Find: "// Render a table body cell for a given column key and line item"
# End: next comment starting with "  // " that defines a helper

render_body_start = None
render_body_end = None
brace_count = 0
in_render_body = False

for i, line in enumerate(lines):
    if '// Render a table body cell for a given column key' in line:
        render_body_start = i
        in_render_body = True
        brace_count = 0
        continue
    if in_render_body:
        brace_count += line.count('{') - line.count('}')
        # Check for closing brace followed by next function/comment
        if line.strip() == '};' and brace_count <= 0:
            # Look ahead for next function definition
            for j in range(i + 1, min(i + 5, len(lines))):
                if lines[j].strip().startswith('// ') or lines[j].strip().startswith('const '):
                    render_body_end = i + 1
                    break
            if render_body_end:
                break

if render_body_start is not None and render_body_end is not None:
    print(f"renderBodyCell: lines {render_body_start + 1} to {render_body_end}")
    print(f"Lines to remove: {render_body_end - render_body_start}")
    lines = lines[:render_body_start] + lines[render_body_end:]
    print(f"After renderBodyCell removal: {len(lines)} lines")
else:
    print("Could not find renderBodyCell function boundaries")

# Write the result
with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"\nFinal line count: {len(lines)}")
