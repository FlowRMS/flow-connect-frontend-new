#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '{/* Price Lookup Modal' in line:
        start_line = i
    if start_line is not None and '{/* Save View Modal */}' in line:
        end_line = i
        break

if start_line is None or end_line is None:
    print("Could not find markers")
    sys.exit(1)

print(f"Found Price Lookup Modal from line {start_line + 1} to {end_line}")

replacement = '''                {/* Price Lookup Modal */}
                <PriceLookupModal
                  show={showPriceLookupModal}
                  quoteLineItems={quoteLineItems}
                  priceLookupTargetPrice={priceLookupTargetPrice}
                  onClose={() => setShowPriceLookupModal(null)}
                  onSetPriceLookupTargetPrice={setPriceLookupTargetPrice}
                  onApply={(price) => {
                    // Apply price logic here if needed
                  }}
                />

'''

new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines.")
