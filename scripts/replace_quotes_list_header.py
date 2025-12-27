#!/usr/bin/env python3
import sys

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_line = None
end_line = None

for i, line in enumerate(lines):
    if '{/* Header */}' in line and 'mb-6' not in lines[i+1] if i+1 < len(lines) else False:
        # Skip if this is the Quote Detail Header
        continue
    if start_line is None and '<div className="mb-6">' in line and i > 6500:
        # Check previous line for {/* Header */}
        if '{/* Header */}' in lines[i-1]:
            start_line = i - 1
    if start_line is not None and '{/* Kanban View */}' in line:
        end_line = i
        break

if start_line is None or end_line is None:
    print("Could not find markers")
    print(f"start_line: {start_line}, end_line: {end_line}")
    sys.exit(1)

print(f"Found QuotesListHeader from line {start_line + 1} to {end_line}")

replacement = '''      <QuotesListHeader
        quotes={quotes}
        viewMode={viewMode}
        setViewMode={setViewMode}
        quoteFilterOptions={quoteFilterOptions}
        quickDatePreset={quickDatePreset}
        setQuickDatePreset={setQuickDatePreset}
        quickDateField={quickDateField}
        setQuickDateField={setQuickDateField}
        showQuickDateFieldDropdown={showQuickDateFieldDropdown}
        setShowQuickDateFieldDropdown={setShowQuickDateFieldDropdown}
      />

'''

new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Replacement completed. Removed {end_line - start_line} lines.")
