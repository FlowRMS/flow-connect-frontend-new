#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '{/* Line Item Details Modal (shows only columns NOT visible in table) */}' in line:
        start_line = i
    if start_line is not None and '{/* Approval Request Modal' in line:
        end_line = i
        break

if start_line is None or end_line is None:
    print("Could not find markers")
    print(f"start_line: {start_line}, end_line: {end_line}")
    sys.exit(1)

print(f"Found Line Item Details Modal from line {start_line + 1} to {end_line}")

replacement = '''        {/* Line Item Details Modal (shows only columns NOT visible in table) */}
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
            setLineDetailsModalItem(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
          }}
        />

'''

new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines.")
