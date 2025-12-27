#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '{/* Duplicate Quote Modal */}' in line:
        start_line = i
    if start_line is not None and '{/* Create Order from Quote Modal */}' in line:
        end_line = i
        break

if start_line is None or end_line is None:
    print("Could not find markers")
    sys.exit(1)

print(f"Found Duplicate Quote Modal from line {start_line + 1} to {end_line}")

replacement = '''        {/* Duplicate Quote Modal */}
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

'''

new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines.")
