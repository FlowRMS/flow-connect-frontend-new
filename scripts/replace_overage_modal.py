#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '{/* Set Overage Modal - Enhanced with Tabs */}' in line:
        start_line = i
    if start_line is not None and '{/* Set Minimum Overage Modal */}' in line:
        end_line = i
        break

if start_line is None or end_line is None:
    print("Could not find markers")
    sys.exit(1)

print(f"Found Set Overage Modal from line {start_line + 1} to {end_line}")

replacement = '''                {/* Set Overage Modal - Enhanced with Tabs */}
                <SetOverageModal
                  show={showSetOverageModal}
                  quoteLineItems={quoteLineItems}
                  selectedLineItems={selectedLineItems}
                  overageModalTab={overageModalTab}
                  overageInputPercent={overageInputPercent}
                  overageInputTargetPrice={overageInputTargetPrice}
                  overageInputTargetMargin={overageInputTargetMargin}
                  onClose={() => setShowSetOverageModal(false)}
                  onSetOverageModalTab={setOverageModalTab}
                  onSetOverageInputPercent={setOverageInputPercent}
                  onSetOverageInputTargetPrice={setOverageInputTargetPrice}
                  onSetOverageInputTargetMargin={setOverageInputTargetMargin}
                  onApply={(newOveragePercent) => {
                    // Apply the overage changes to selected items (skip locked)
                    setQuoteLineItems(prev => prev.map(item => {
                      if (!selectedLineItems.has(item.id) || item.locked) return item;
                      return {
                        ...item,
                        sellPrice: item.basePrice * (1 + newOveragePercent / 100),
                        overagePercent: newOveragePercent
                      };
                    }));
                  }}
                />

'''

new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines.")
