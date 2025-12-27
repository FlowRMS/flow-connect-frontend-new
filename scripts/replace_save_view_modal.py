#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '{/* Save View Modal */}' in line:
        start_line = i
    if start_line is not None and '              </div>' in line and i > start_line + 50:
        # Look for the closing div that ends at the right indentation
        # After the modal ends, we should see the tabs rendering
        next_lines = ''.join(lines[i:i+5])
        if '{/* Approvals Tab */}' in next_lines or 'detailTab ===' in next_lines:
            end_line = i
            break

if start_line is None or end_line is None:
    print("Could not find markers")
    sys.exit(1)

print(f"Found Save View Modal from line {start_line + 1} to {end_line}")

replacement = '''                {/* Save View Modal */}
                <SaveViewModal
                  show={showSaveViewModal}
                  newViewName={newViewName}
                  effectiveVisibleColumns={effectiveVisibleColumns}
                  columnDefinitions={columnDefinitions}
                  onClose={() => setShowSaveViewModal(false)}
                  onSetNewViewName={setNewViewName}
                  onSave={saveCurrentView}
                />
'''

new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines.")
