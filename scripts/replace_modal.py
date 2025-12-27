#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the start line (Commission Splits Modal comment)
start_line = None
end_line = None

for i, line in enumerate(lines):
    if '{/* Commission Splits Modal */}' in line:
        start_line = i
    if start_line is not None and '{/* Sections Settings Modal */}' in line:
        end_line = i
        break

if start_line is None or end_line is None:
    print("Could not find markers")
    sys.exit(1)

print(f"Found Commission Splits Modal from line {start_line + 1} to {end_line}")

# Create the replacement
replacement = '''        {/* Commission Splits Modal */}
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

'''

# Replace lines
new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines, added replacement.")
