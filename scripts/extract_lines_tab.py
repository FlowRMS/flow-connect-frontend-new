#!/usr/bin/env python3
"""Extract LinesTab component from QuotesContent.tsx"""

import re

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# Find the LinesTab section: from "{detailTab === 'lines' && (" to the line before "{/* Approvals Tab */}"
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if "{detailTab === 'lines' && (" in line and start_idx is None:
        start_idx = i
    if start_idx is not None and "{/* Approvals Tab */}" in line:
        # Go back to find the closing of the lines section
        end_idx = i
        break

if start_idx is None or end_idx is None:
    print("Could not find LinesTab markers")
    print(f"start_idx: {start_idx}, end_idx: {end_idx}")
    exit(1)

print(f"Found LinesTab from line {start_idx + 1} to {end_idx}")
print(f"Total lines: {end_idx - start_idx}")

# Extract the LinesTab content (the JSX inside the conditional)
lines_tab_content = lines[start_idx:end_idx]

# Save the extracted content for reference
output_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\quotes\tabs\LinesTab_extracted.txt"
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines_tab_content))

print(f"Extracted {len(lines_tab_content)} lines to {output_path}")
