#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '{/* Set End User Modal */}' in line:
        start_line = i
    if start_line is not None and '{/* Copy Price Modal */}' in line:
        end_line = i
        break

if start_line is None or end_line is None:
    print("Could not find markers")
    sys.exit(1)

print(f"Found Set End User Modal from line {start_line + 1} to {end_line}")

replacement = '''                {/* Set End User Modal */}
                <SetEndUserModal
                  show={showSetEndUserModal}
                  selectedQuote={selectedQuote}
                  selectedLineItems={selectedLineItems}
                  selectedEndUser={selectedEndUser}
                  availableEndUsers={availableEndUsers}
                  onClose={() => setShowSetEndUserModal(false)}
                  onSetSelectedEndUser={setSelectedEndUser}
                  onApply={(endUser) => {
                    setQuoteLineItems(prev => prev.map(item =>
                      selectedLineItems.has(item.id) ? { ...item, endUser } : item
                    ));
                  }}
                />

'''

new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines.")
