#!/usr/bin/env python3
"""Remove duplicate quotes filtering code that is now handled by useQuotesListFilters hook."""

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# Find the start: "  // Quotes list sorting state"
# Find the end: line ending with "quotesSortColumn, quotesSortDirection, quoteColumnFilters, quickDatePreset, quickDateField]);"

start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if '// Quotes list sorting state' in line and start_idx is None:
        start_idx = i
    if start_idx is not None and 'quotesSortColumn, quotesSortDirection, quoteColumnFilters, quickDatePreset, quickDateField]);' in line:
        end_idx = i + 1  # Include this line
        break

if start_idx is None or end_idx is None:
    print("Could not find markers")
    print(f"start_idx: {start_idx}, end_idx: {end_idx}")
    exit(1)

print(f"Found duplicate section from line {start_idx + 1} to {end_idx}")
print(f"Removing {end_idx - start_idx} lines")

# Remove the lines
new_lines = lines[:start_idx] + lines[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print(f"Successfully removed {end_idx - start_idx} lines")
print(f"New line count: {len(new_lines)}")
