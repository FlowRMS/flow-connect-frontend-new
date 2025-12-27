#!/usr/bin/env python3
"""Remove duplicate Kanban DnD code that is now handled by useKanbanDnD hook."""

file_path = r"c:\Users\ksubh\Desktop\Subhans projects\flow crm  curtis mock\flow-crm\components\QuotesContent.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# We need to remove the DnD logic but keep handleQuoteSelect
# Find:
# 1. Start: "  const sensors = useSensors("
# 2. End: before "  // Get line items for selected quote"
# But keep: "const handleQuoteSelect = useCallback" section

start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if '  const sensors = useSensors(' in line and start_idx is None:
        start_idx = i
    if start_idx is not None and '// Get line items for selected quote' in line:
        end_idx = i
        break

if start_idx is None or end_idx is None:
    print("Could not find markers")
    print(f"start_idx: {start_idx}, end_idx: {end_idx}")
    exit(1)

# Extract the handleQuoteSelect callback (lines 1734-1737 relative)
# Find it within the range to be deleted
handle_quote_select_lines = []
for i in range(start_idx, end_idx):
    if 'const handleQuoteSelect = useCallback' in lines[i]:
        # Include this line and the next two (the callback body and closing)
        handle_quote_select_lines = lines[i:i+3]
        break

print(f"Found DnD section from line {start_idx + 1} to {end_idx}")
print(f"Removing {end_idx - start_idx} lines")
if handle_quote_select_lines:
    print(f"Preserving handleQuoteSelect callback")

# Build new lines: everything before start, handleQuoteSelect if found, comment about utils, everything from end onwards
new_lines = lines[:start_idx]

# Add handleQuoteSelect if we found it
if handle_quote_select_lines:
    new_lines.append('')
    new_lines.extend(handle_quote_select_lines)

new_lines.append('')
new_lines.extend(lines[end_idx:])

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print(f"Successfully removed {end_idx - start_idx} lines (with some preserved)")
print(f"New line count: {len(new_lines)}")
